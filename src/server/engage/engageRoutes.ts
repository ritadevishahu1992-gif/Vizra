import { Express, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  SlidingWindowRateLimiter,
  validateExternalUrlForSSRF,
  authLockoutTracker,
} from '../security';
import { verifyFirebaseIdToken } from '../authVerification';
import { resolveRequestAgePolicyContext } from '../compliance/ageAssurance';
import {
  getConfiguredAdminKey,
  getAdminAllowlistEmails,
} from '../config/envConfig';
import {
  getEngageConfig,
  updateEngageConfig,
  listEngageContent,
  upsertEngageContent,
  setEngageContentApproval,
  deleteEngageContent,
  listEngageCampaigns,
  upsertEngageCampaign,
  listEngagePartners,
  upsertEngagePartner,
  recordEngageAnalyticsEvent,
  getEngageAnalyticsSummary,
  listEngageAuditLog,
  sanitizeEngageText,
} from './engageStore';
import { selectEngageInventory } from './engageSelectionEngine';
import { AIMode } from '../../types/ai';
import {
  EngageEventType,
  EngageContentType,
  EngageLifecycleState,
} from '../../types/engage';

const engageSelectLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  name: 'engage-select',
});

const engageEventLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 180,
  name: 'engage-events',
});

const engageAdminLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  name: 'engage-admin',
});

const VALID_MODES = new Set<AIMode>([
  'quick',
  'think',
  'research',
  'create',
  'code',
  'analyze',
  'science',
]);

const VALID_EVENT_TYPES = new Set<EngageEventType>([
  'impression',
  'click',
  'dismiss',
  'interaction',
  'conversion',
]);

const VALID_CONTENT_TYPES = new Set<EngageContentType>([
  'visualization',
  'knowledge_card',
  'creative_tip',
  'mini_experience',
  'sponsored_card',
  'affiliate_card',
]);

const VALID_LIFECYCLE_STATES = new Set<EngageLifecycleState>([
  'idle',
  'generating',
  'streaming',
  'completed',
  'cancelled',
  'failed',
]);

function safeCompareStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Server-side Role-Based Authorization for VIZRA Engage Administration.
 * Always fails closed when credentials are missing or invalid.
 * Supports:
 * 1. Valid server ADMIN_API_KEY via X-Admin-Key or Authorization Bearer header.
 * 2. Verified Firebase ID Token with verified email belonging to ADMIN_ALLOWLIST_EMAILS.
 */
export async function engageAdminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const lockKey = `engage_admin:${authLockoutTracker.resolveIp(req)}`;
  const lockStatus = authLockoutTracker.checkLocked(lockKey);
  if (lockStatus.locked) {
    res.setHeader('Retry-After', String(lockStatus.retryAfterSeconds));
    res.status(429).json({
      error: {
        code: 'AUTH_LOCKED_OUT',
        message: `Too many failed administrator authentication attempts. Try again in ${lockStatus.retryAfterSeconds} seconds.`,
        retryAfterSeconds: lockStatus.retryAfterSeconds,
      },
    });
    return;
  }

  const allowedAdminEmails = getAdminAllowlistEmails();
  const { key: configuredAdminKey } = getConfiguredAdminKey();

  const xAdminKey =
    typeof req.headers['x-admin-key'] === 'string'
      ? req.headers['x-admin-key'].trim()
      : '';
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';

  // 1. Check X-Admin-Key or Bearer matching ADMIN_API_KEY
  if (
    configuredAdminKey &&
    ((xAdminKey && safeCompareStrings(xAdminKey, configuredAdminKey)) ||
      (bearerToken && safeCompareStrings(bearerToken, configuredAdminKey)))
  ) {
    authLockoutTracker.recordSuccess(lockKey);
    (req as any).engageActor = 'admin-key@vizra.ai';
    next();
    return;
  }

  // If X-Admin-Key was explicitly provided but did not match, reject immediately
  if (xAdminKey) {
    authLockoutTracker.recordFailure(lockKey);
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED_ENGAGE_ADMIN',
        message: 'Unauthorized: Invalid X-Admin-Key credential.',
      },
    });
    return;
  }

  // 2. Check Firebase JWT if Bearer token is provided
  if (bearerToken) {
    const verified = await verifyFirebaseIdToken(bearerToken);
    if (!verified.valid || !verified.email) {
      authLockoutTracker.recordFailure(lockKey);
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED_ENGAGE_TOKEN',
          message: 'Unauthorized: Invalid or expired authentication token.',
        },
      });
      return;
    }

    if (
      verified.emailVerified === false ||
      allowedAdminEmails.length === 0 ||
      !allowedAdminEmails.includes(verified.email.toLowerCase())
    ) {
      authLockoutTracker.recordFailure(lockKey);
      res.status(403).json({
        error: {
          code: 'FORBIDDEN_ENGAGE_ROLE',
          message: 'Forbidden: Administrator role with verified email is required to manage VIZRA Engage.',
        },
      });
      return;
    }

    authLockoutTracker.recordSuccess(lockKey);
    (req as any).engageActor = verified.email.toLowerCase();
    next();
    return;
  }

  // 3. Fail closed in ALL environments when no credentials are supplied
  authLockoutTracker.recordFailure(lockKey);
  res.status(401).json({
    error: {
      code: 'ENGAGE_AUTH_REQUIRED',
      message: 'Unauthorized: Administrator credentials required.',
    },
  });
}

export function setupVizraEngageRoutes(app: Express): void {
  // ==========================================================================
  // PUBLIC: HYBRID CONTENT SELECTION (Zero private conversation inspection)
  // ==========================================================================
  const handleSelect = async (req: Request, res: Response) => {
    try {
      const rawMode = (req.query.mode || req.body?.mode || 'quick') as string;
      const mode: AIMode = VALID_MODES.has(rawMode as AIMode)
        ? (rawMode as AIMode)
        : 'quick';

      const rawSession =
        (req.query.session as string) ||
        (req.body?.sessionHash as string) ||
        'anon';
      const sessionHash = sanitizeEngageText(rawSession, 64) || 'anon';

      const excludeIds = Array.isArray(req.body?.excludeIds)
        ? req.body.excludeIds
            .filter((id: unknown) => typeof id === 'string')
            .slice(0, 25)
        : [];

      const ageCtx = await resolveRequestAgePolicyContext(req);
      const rawLimit = req.query.limit ?? req.body?.limit;
      let validatedLimit = 5;
      if (rawLimit !== undefined && rawLimit !== '') {
        const parsedLimit = Number(rawLimit);
        if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
          res.status(400).json({
            error: {
              code: 'INVALID_QUANTITY',
              message: 'limit must be an integer between 1 and 20.',
            },
          });
          return;
        }
        validatedLimit = parsedLimit;
      }
      const selection = selectEngageInventory({
        mode,
        sessionHash,
        excludeIds,
        limit: validatedLimit,
        minorSafeMode: ageCtx.requiresMinorSafeDirectives,
        minorBlocked: ageCtx.isMinorBlocked,
      });

      res.json({
        success: true,
        ...selection,
      });
    } catch (err: any) {
      // Fail-safe degradation: never break chat experience
      res.status(200).json({
        success: false,
        enabled: false,
        items: [],
        fallback: true,
        error: err.message || 'Engage selection unavailable',
      });
    }
  };

  app.get('/api/engage/select', engageSelectLimiter.getMiddleware(), handleSelect);
  app.post('/api/engage/select', engageSelectLimiter.getMiddleware(), handleSelect);

  // ==========================================================================
  // PUBLIC: PRIVACY-PRESERVING ANALYTICS & DEDUPLICATED TELEMETRY
  // ==========================================================================
  app.post(
    '/api/engage/events',
    engageEventLimiter.getMiddleware(),
    (req: Request, res: Response) => {
      try {
        const {
          eventType,
          contentId,
          contentType,
          category,
          campaignId,
          partnerId,
          sessionHash,
          mode,
          lifecycleState,
          renderLatencyMs,
          dedupeKey,
        } = req.body || {};

        if (!eventType || !VALID_EVENT_TYPES.has(eventType)) {
          res.status(400).json({
            error: {
              code: 'INVALID_EVENT_TYPE',
              message: 'Valid eventType is required (impression, click, dismiss, interaction, conversion).',
            },
          });
          return;
        }

        if (!contentId || typeof contentId !== 'string') {
          res.status(400).json({
            error: {
              code: 'INVALID_CONTENT_ID',
              message: 'Valid contentId string is required.',
            },
          });
          return;
        }

        const safeContentType: EngageContentType = VALID_CONTENT_TYPES.has(contentType)
          ? contentType
          : 'knowledge_card';
        const safeMode: AIMode = VALID_MODES.has(mode) ? mode : 'quick';
        const safeLifecycle: EngageLifecycleState = VALID_LIFECYCLE_STATES.has(
          lifecycleState
        )
          ? lifecycleState
          : 'generating';

        const result = recordEngageAnalyticsEvent({
          eventType,
          contentId: sanitizeEngageText(contentId, 80),
          contentType: safeContentType,
          category: sanitizeEngageText(category || 'General', 80),
          campaignId: campaignId ? sanitizeEngageText(campaignId, 80) : undefined,
          partnerId: partnerId ? sanitizeEngageText(partnerId, 80) : undefined,
          sessionHash: sanitizeEngageText(sessionHash || 'anon', 64) || 'anon',
          mode: safeMode,
          lifecycleState: safeLifecycle,
          renderLatencyMs:
            typeof renderLatencyMs === 'number'
              ? Math.max(0, Math.min(60000, Math.round(renderLatencyMs)))
              : undefined,
          dedupeKey: dedupeKey ? sanitizeEngageText(dedupeKey, 120) : undefined,
        });

        res.json({
          success: true,
          recorded: result.recorded,
          deduplicated: result.deduplicated,
        });
      } catch (err: any) {
        res.status(200).json({
          success: false,
          recorded: false,
          error: err.message,
        });
      }
    }
  );

  // ==========================================================================
  // ADMIN: OVERVIEW & FULL STATE
  // ==========================================================================
  app.get(
    '/api/engage/admin/overview',
    engageAdminLimiter.getMiddleware(),
    engageAdminAuthMiddleware,
    (_req: Request, res: Response) => {
      res.json({
        success: true,
        config: getEngageConfig(),
        content: listEngageContent(),
        campaigns: listEngageCampaigns(),
        partners: listEngagePartners(),
        analytics: getEngageAnalyticsSummary(),
        auditLog: listEngageAuditLog(),
      });
    }
  );

  // ==========================================================================
  // ADMIN: CREATE / UPDATE CONTENT INVENTORY (With SSRF Destination Check)
  // ==========================================================================
  app.post(
    '/api/engage/admin/content',
    engageAdminLimiter.getMiddleware(),
    engageAdminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const body = req.body || {};
        if (!body.title || !body.body || !body.type) {
          res.status(400).json({
            error: {
              code: 'MISSING_CONTENT_FIELDS',
              message: 'title, body, and type are required.',
            },
          });
          return;
        }

        if (!VALID_CONTENT_TYPES.has(body.type)) {
          res.status(400).json({
            error: {
              code: 'INVALID_CONTENT_TYPE',
              message: 'Unsupported Engage content type.',
            },
          });
          return;
        }

        // Validate destinationUrl against SSRF & private IP ranges if supplied
        if (body.destinationUrl && typeof body.destinationUrl === 'string') {
          const ssrf = await validateExternalUrlForSSRF(body.destinationUrl);
          if (!ssrf.safe) {
            res.status(400).json({
              error: {
                code: 'UNSAFE_DESTINATION_URL',
                message: `Destination URL rejected by security gate: ${ssrf.reason}`,
              },
            });
            return;
          }
        }

        // Validate mediaUrl against SSRF if external URL supplied
        if (
          body.mediaUrl &&
          typeof body.mediaUrl === 'string' &&
          body.mediaUrl.startsWith('http')
        ) {
          const ssrfMedia = await validateExternalUrlForSSRF(body.mediaUrl);
          if (!ssrfMedia.safe) {
            res.status(400).json({
              error: {
                code: 'UNSAFE_MEDIA_URL',
                message: `Media URL rejected by security gate: ${ssrfMedia.reason}`,
              },
            });
            return;
          }
        }

        // Enforce mandatory Sponsorship / Affiliate disclosure label on monetized types
        if (body.type === 'sponsored_card' && body.sponsorshipLabel === 'None') {
          body.sponsorshipLabel = 'Sponsored';
        }
        if (body.type === 'affiliate_card' && body.sponsorshipLabel === 'None') {
          body.sponsorshipLabel = 'Affiliate';
        }

        const actor = (req as any).engageActor || 'admin@vizra.ai';
        const item = upsertEngageContent(body, actor);

        res.json({
          success: true,
          item,
        });
      } catch (err: any) {
        res.status(500).json({
          error: {
            code: 'ENGAGE_CONTENT_SAVE_ERROR',
            message: err.message || 'Failed to save content item.',
          },
        });
      }
    }
  );

  // ==========================================================================
  // ADMIN: APPROVE / REJECT SUBMISSION QUEUE
  // ==========================================================================
  app.post(
    '/api/engage/admin/approve',
    engageAdminLimiter.getMiddleware(),
    engageAdminAuthMiddleware,
    (req: Request, res: Response) => {
      const { contentId, approvalStatus } = req.body || {};
      if (
        !contentId ||
        !['approved', 'rejected', 'pending_review', 'draft'].includes(approvalStatus)
      ) {
        res.status(400).json({
          error: {
            code: 'INVALID_APPROVAL_REQUEST',
            message: 'contentId and valid approvalStatus are required.',
          },
        });
        return;
      }

      const actor = (req as any).engageActor || 'admin@vizra.ai';
      const updated = setEngageContentApproval(contentId, approvalStatus, actor);
      if (!updated) {
        res.status(404).json({
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: 'Content item not found.',
          },
        });
        return;
      }

      res.json({
        success: true,
        item: updated,
      });
    }
  );

  // ==========================================================================
  // ADMIN: DELETE CONTENT ITEM
  // ==========================================================================
  app.delete(
    '/api/engage/admin/content/:id',
    engageAdminLimiter.getMiddleware(),
    engageAdminAuthMiddleware,
    (req: Request, res: Response) => {
      const actor = (req as any).engageActor || 'admin@vizra.ai';
      const deleted = deleteEngageContent(req.params.id, actor);
      if (!deleted) {
        res.status(404).json({
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: 'Content item not found.',
          },
        });
        return;
      }
      res.json({ success: true });
    }
  );

  // ==========================================================================
  // ADMIN: CREATE / UPDATE MONETIZATION CAMPAIGNS (With SSRF Destination Check)
  // ==========================================================================
  app.post(
    '/api/engage/admin/campaigns',
    engageAdminLimiter.getMiddleware(),
    engageAdminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const body = req.body || {};
        if (!body.name || !body.partnerId || !body.destinationUrl) {
          res.status(400).json({
            error: {
              code: 'MISSING_CAMPAIGN_FIELDS',
              message: 'name, partnerId, and destinationUrl are required.',
            },
          });
          return;
        }

        const ssrf = await validateExternalUrlForSSRF(body.destinationUrl);
        if (!ssrf.safe) {
          res.status(400).json({
            error: {
              code: 'UNSAFE_CAMPAIGN_DESTINATION',
              message: `Campaign destination URL rejected by SSRF guard: ${ssrf.reason}`,
            },
          });
          return;
        }

        const actor = (req as any).engageActor || 'admin@vizra.ai';
        const campaign = upsertEngageCampaign(body, actor);
        res.json({
          success: true,
          campaign,
        });
      } catch (err: any) {
        res.status(500).json({
          error: {
            code: 'CAMPAIGN_SAVE_ERROR',
            message: err.message || 'Failed to save campaign.',
          },
        });
      }
    }
  );

  // ==========================================================================
  // ADMIN: CREATE / UPDATE BRAND & AFFILIATE PARTNERS
  // ==========================================================================
  app.post(
    '/api/engage/admin/partners',
    engageAdminLimiter.getMiddleware(),
    engageAdminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const body = req.body || {};
        if (!body.name || !body.domain) {
          res.status(400).json({
            error: {
              code: 'MISSING_PARTNER_FIELDS',
              message: 'Partner name and domain are required.',
            },
          });
          return;
        }

        if (Array.isArray(body.allowedDestinations)) {
          for (const dest of body.allowedDestinations) {
            if (typeof dest === 'string' && dest.trim()) {
              const ssrf = await validateExternalUrlForSSRF(dest.trim());
              if (!ssrf.safe) {
                res.status(400).json({
                  error: {
                    code: 'UNSAFE_PARTNER_DESTINATION',
                    message: `Partner destination "${dest}" rejected: ${ssrf.reason}`,
                  },
                });
                return;
              }
            }
          }
        }

        const actor = (req as any).engageActor || 'admin@vizra.ai';
        const partner = upsertEngagePartner(body, actor);
        res.json({
          success: true,
          partner,
        });
      } catch (err: any) {
        res.status(500).json({
          error: {
            code: 'PARTNER_SAVE_ERROR',
            message: err.message || 'Failed to save partner.',
          },
        });
      }
    }
  );

  // ==========================================================================
  // ADMIN: GLOBAL CONFIGURATION & KILL SWITCH
  // ==========================================================================
  app.post(
    '/api/engage/admin/config',
    engageAdminLimiter.getMiddleware(),
    engageAdminAuthMiddleware,
    (req: Request, res: Response) => {
      const actor = (req as any).engageActor || 'admin@vizra.ai';
      const updated = updateEngageConfig(req.body || {}, actor);
      res.json({
        success: true,
        config: updated,
      });
    }
  );

  // ==========================================================================
  // ADMIN: ANALYTICS REPORT
  // ==========================================================================
  app.get(
    '/api/engage/admin/analytics',
    engageAdminLimiter.getMiddleware(),
    engageAdminAuthMiddleware,
    (_req: Request, res: Response) => {
      res.json({
        success: true,
        analytics: getEngageAnalyticsSummary(),
      });
    }
  );
}
