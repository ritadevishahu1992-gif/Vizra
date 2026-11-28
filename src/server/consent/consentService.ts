import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import { SlidingWindowRateLimiter, validateExternalUrlForSSRF } from '../security';
import { getGoogleSheetsConsentConfig } from '../config/envConfig';

export const CURRENT_CONSENT_VERSION = '1.0';
export const CURRENT_POLICY_VERSION = '2026-11';

export type ConsentActionType =
  | 'ACCEPT_ALL'
  | 'REJECT_OPTIONAL'
  | 'CUSTOMIZE'
  | 'WITHDRAW';

export type ConsentSourceType =
  | 'Cookie Banner'
  | 'Settings'
  | 'Cookie Policy Page'
  | 'Footer Settings';

export interface ConsentRecord {
  consentVersion: string;
  policyVersion: string;
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  action: ConsentActionType;
  timestamp: string;
  consentId: string;
  source: ConsentSourceType;
}

export interface ConsentAuditEvent extends ConsentRecord {
  eventId: string;
  region: string;
  sheetsSyncStatus: 'synced' | 'skipped_unconfigured' | 'failed_gracefully';
}

interface ConsentStoreData {
  version: string;
  recordsByConsentId: Record<string, ConsentRecord>;
  auditHistory: ConsentAuditEvent[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONSENT_STORE_PATH = path.join(DATA_DIR, 'consent_store.json');

// Dedicated rate limiter for consent endpoints (30 req / minute per client key)
export const consentRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  name: 'consent_api',
});

// In-memory deduplication cache (prevents duplicate submissions within 5 seconds)
const recentSubmissionHashes = new Map<string, { timestamp: number; event: ConsentAuditEvent }>();

function ensureStoreLoaded(): ConsentStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CONSENT_STORE_PATH)) {
      const raw = fs.readFileSync(CONSENT_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          version: CURRENT_CONSENT_VERSION,
          recordsByConsentId: parsed.recordsByConsentId || {},
          auditHistory: Array.isArray(parsed.auditHistory) ? parsed.auditHistory : [],
        };
      }
    }
  } catch {
    // Fallback to clean in-memory store if disk read fails
  }
  return {
    version: CURRENT_CONSENT_VERSION,
    recordsByConsentId: {},
    auditHistory: [],
  };
}

let memoryStore: ConsentStoreData = ensureStoreLoaded();

function persistStore(store: ConsentStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Bound audit history to most recent 2,000 events to prevent unbounded disk growth
    if (store.auditHistory.length > 2000) {
      store.auditHistory = store.auditHistory.slice(-2000);
    }
    fs.writeFileSync(CONSENT_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Non-fatal in read-only serverless environments; in-memory state remains authoritative for instance lifetime
  }
}

export function isValidConsentId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(id.trim());
}

export function isValidConsentAction(action: unknown): action is ConsentActionType {
  return (
    action === 'ACCEPT_ALL' ||
    action === 'REJECT_OPTIONAL' ||
    action === 'CUSTOMIZE' ||
    action === 'WITHDRAW'
  );
}

export function normalizeConsentSource(source: unknown): ConsentSourceType {
  if (source === 'Settings' || source === 'settings') return 'Settings';
  if (source === 'Cookie Policy Page' || source === 'cookie_policy') return 'Cookie Policy Page';
  if (source === 'Footer Settings' || source === 'footer') return 'Footer Settings';
  return 'Cookie Banner';
}

/**
 * Extracts only a 2-letter ISO country/region header if reliably provided by the edge network
 * (e.g. Vercel `x-vercel-ip-country`). Never reads or logs raw IP addresses.
 */
export function extractLawfulRegionHeader(req: Request): string {
  const vercelCountry = req.headers['x-vercel-ip-country'];
  if (typeof vercelCountry === 'string' && /^[A-Z]{2}$/i.test(vercelCountry.trim())) {
    return vercelCountry.trim().toUpperCase();
  }
  const cfCountry = req.headers['cf-ipcountry'];
  if (
    typeof cfCountry === 'string' &&
    /^[A-Z]{2}$/i.test(cfCountry.trim()) &&
    cfCountry.trim().toUpperCase() !== 'XX'
  ) {
    return cfCountry.trim().toUpperCase();
  }
  return 'N/A';
}

/**
 * Checks whether Google Sheets audit export is configured via environment variables.
 */
export function isGoogleSheetsConsentConfigured(): {
  configured: boolean;
  mode: 'service_account' | 'webhook' | 'none';
} {
  const cfg = getGoogleSheetsConsentConfig();
  return { configured: cfg.configured, mode: cfg.mode };
}

/**
 * Generates a short-lived Google OAuth2 access token using Node's native crypto module
 * for Service Account authentication to Google Sheets API v4.
 */
async function getGoogleServiceAccountAccessToken(
  clientEmail: string,
  rawPrivateKey: string
): Promise<string> {
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  const nowSec = Math.floor(Date.now() / 1000);

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec,
    })
  ).toString('base64url');

  const unsignedJwt = `${header}.${claimSet}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const signature = signer.sign(privateKey, 'base64url');
  const jwt = `${unsignedJwt}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!tokenRes.ok) {
    throw new Error(`Google OAuth token exchange failed with HTTP ${tokenRes.status}`);
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error('Missing access_token in Google OAuth response');
  }
  return tokenJson.access_token;
}

/**
 * Formats a consent event into the 12-column row specification for Google Sheets.
 */
export function formatConsentRowForSheets(event: ConsentAuditEvent): (string | boolean)[] {
  return [
    event.eventId,           // 1. Consent Event ID
    event.timestamp,         // 2. Timestamp (UTC)
    event.consentVersion,    // 3. Consent Version
    event.consentId,         // 4. Anonymous Consent ID
    event.action,            // 5. Action: ACCEPT_ALL / REJECT_OPTIONAL / CUSTOMIZE / WITHDRAW
    true,                    // 6. Necessary: true
    event.analytics,         // 7. Analytics: true/false
    event.functional,        // 8. Functional: true/false
    event.marketing,         // 9. Marketing: true/false
    event.policyVersion,     // 10. Policy Version
    event.source,            // 11. Source: Cookie Banner / Settings / etc.
    event.region,            // 12. Country or region (only if lawfully available via edge header)
  ];
}

/**
 * Sends the consent audit record to Google Sheets if configured.
 * Never throws or blocks user consent persistence if Google Sheets fails or is unconfigured.
 */
export async function exportConsentEventToGoogleSheets(
  event: ConsentAuditEvent,
  customFetcher?: typeof fetch
): Promise<'synced' | 'skipped_unconfigured' | 'failed_gracefully'> {
  const config = getGoogleSheetsConsentConfig();
  if (!config.configured) {
    return 'skipped_unconfigured';
  }

  const fetchImpl = customFetcher || fetch;
  const rowValues = formatConsentRowForSheets(event);

  try {
    if (config.mode === 'webhook' && config.webhookUrl) {
      const webhookUrl = config.webhookUrl;
      const ssrfCheck = await validateExternalUrlForSSRF(webhookUrl);
      if (!ssrfCheck.safe) {
        return 'failed_gracefully';
      }
      const secret = config.webhookSecret || '';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      try {
        const res = await fetchImpl(webhookUrl, {
          method: 'POST',
          redirect: 'error',
          headers: {
            'Content-Type': 'application/json',
            ...(secret ? { 'X-Consent-Webhook-Secret': secret } : {}),
          },
          body: JSON.stringify({
            row: rowValues,
            event: {
              eventId: event.eventId,
              timestamp: event.timestamp,
              consentVersion: event.consentVersion,
              consentId: event.consentId,
              action: event.action,
              necessary: true,
              analytics: event.analytics,
              functional: event.functional,
              marketing: event.marketing,
              policyVersion: event.policyVersion,
              source: event.source,
              region: event.region,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        return res.ok ? 'synced' : 'failed_gracefully';
      } catch {
        clearTimeout(timeout);
        return 'failed_gracefully';
      }
    }

    if (
      config.mode === 'service_account' &&
      config.spreadsheetId &&
      config.clientEmail &&
      config.privateKey
    ) {
      const accessToken = await getGoogleServiceAccountAccessToken(
        config.clientEmail,
        config.privateKey
      );
      const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        config.spreadsheetId
      )}/values/${encodeURIComponent(config.sheetRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      });

      return res.ok ? 'synced' : 'failed_gracefully';
    }
  } catch {
    // Graceful degradation: never expose internal errors or block consent saving
    return 'failed_gracefully';
  }

  return 'skipped_unconfigured';
}

/**
 * Core deterministic processor for recording and updating user consent state.
 */
export async function processConsentSubmission(
  input: {
    consentId: unknown;
    action: unknown;
    analytics?: unknown;
    functional?: unknown;
    marketing?: unknown;
    consentVersion?: unknown;
    policyVersion?: unknown;
    source?: unknown;
    region?: string;
  },
  options?: {
    customFetcher?: typeof fetch;
    bypassDedupWindow?: boolean;
  }
): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  isDuplicate?: boolean;
  record?: ConsentRecord;
  auditEvent?: ConsentAuditEvent;
}> {
  if (!isValidConsentId(input.consentId)) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid or missing anonymous consentId (must be 8-80 alphanumeric/hyphen characters).',
    };
  }

  if (!isValidConsentAction(input.action)) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid consent action. Must be ACCEPT_ALL, REJECT_OPTIONAL, CUSTOMIZE, or WITHDRAW.',
    };
  }

  const consentId = input.consentId.trim();
  const action = input.action;
  const source = normalizeConsentSource(input.source);
  const consentVersion =
    typeof input.consentVersion === 'string' && input.consentVersion.trim().length <= 16
      ? input.consentVersion.trim()
      : CURRENT_CONSENT_VERSION;
  const policyVersion =
    typeof input.policyVersion === 'string' && input.policyVersion.trim().length <= 24
      ? input.policyVersion.trim()
      : CURRENT_POLICY_VERSION;

  // Enforce deterministic category states based on action
  let analytics = false;
  let functional = false;
  let marketing = false;

  if (action === 'ACCEPT_ALL') {
    analytics = true;
    functional = true;
    marketing = true;
  } else if (action === 'REJECT_OPTIONAL' || action === 'WITHDRAW') {
    analytics = false;
    functional = false;
    marketing = false;
  } else if (action === 'CUSTOMIZE') {
    analytics = Boolean(input.analytics);
    functional = Boolean(input.functional);
    marketing = Boolean(input.marketing);
  }

  // Deduplication check (5-second window for identical state + action from same consentId)
  const dedupKey = `${consentId}:${action}:${analytics}:${functional}:${marketing}:${consentVersion}:${policyVersion}`;
  const nowMs = Date.now();

  if (!options?.bypassDedupWindow) {
    const existingDedup = recentSubmissionHashes.get(dedupKey);
    if (existingDedup && nowMs - existingDedup.timestamp < 5000) {
      return {
        ok: true,
        status: 200,
        isDuplicate: true,
        record: memoryStore.recordsByConsentId[consentId],
        auditEvent: existingDedup.event,
      };
    }
  }

  const timestamp = new Date(nowMs).toISOString();
  const eventId = `evt_cns_${nowMs.toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  const region = input.region || 'N/A';

  const record: ConsentRecord = {
    consentVersion,
    policyVersion,
    necessary: true,
    analytics,
    functional,
    marketing,
    action,
    timestamp,
    consentId,
    source,
  };

  const auditEvent: ConsentAuditEvent = {
    ...record,
    eventId,
    region,
    sheetsSyncStatus: 'skipped_unconfigured',
  };

  // Attempt optional Google Sheets export (non-blocking on failure)
  auditEvent.sheetsSyncStatus = await exportConsentEventToGoogleSheets(
    auditEvent,
    options?.customFetcher
  );

  // Update authoritative state and append to audit trail
  memoryStore.recordsByConsentId[consentId] = record;
  memoryStore.auditHistory.push(auditEvent);
  recentSubmissionHashes.set(dedupKey, { timestamp: nowMs, event: auditEvent });

  // Prune old deduplication entries
  if (recentSubmissionHashes.size > 500) {
    for (const [k, v] of recentSubmissionHashes.entries()) {
      if (nowMs - v.timestamp > 10000) {
        recentSubmissionHashes.delete(k);
      }
    }
  }

  persistStore(memoryStore);

  return {
    ok: true,
    status: 200,
    isDuplicate: false,
    record,
    auditEvent,
  };
}

export function getStoredConsentById(consentId: string): {
  record: ConsentRecord | null;
  history: ConsentAuditEvent[];
} {
  if (!isValidConsentId(consentId)) {
    return { record: null, history: [] };
  }
  const cleanId = consentId.trim();
  const record = memoryStore.recordsByConsentId[cleanId] || null;
  const history = memoryStore.auditHistory.filter((e) => e.consentId === cleanId);
  return { record, history };
}

/**
 * Registers the server-side Consent Management routes on the Express app.
 */
export function setupConsentRoutes(app: Express): void {
  // 1. Get consent configuration & current policy version
  app.get('/api/privacy/consent-config', (_req: Request, res: Response) => {
    const sheetsConfig = isGoogleSheetsConsentConfigured();
    res.json({
      success: true,
      consentVersion: CURRENT_CONSENT_VERSION,
      policyVersion: CURRENT_POLICY_VERSION,
      googleSheetsIntegration: {
        enabled: sheetsConfig.configured,
        mode: sheetsConfig.mode,
      },
      categories: {
        necessary: { required: true, default: true },
        analytics: { required: false, default: false },
        functional: { required: false, default: false },
        marketing: { required: false, default: false },
      },
    });
  });

  // 2. Record or update a consent decision
  app.post(
    '/api/privacy/consent',
    consentRateLimiter.getMiddleware(),
    async (req: Request, res: Response) => {
      const region = extractLawfulRegionHeader(req);
      const result = await processConsentSubmission({
        consentId: req.body?.consentId,
        action: req.body?.action,
        analytics: req.body?.analytics,
        functional: req.body?.functional,
        marketing: req.body?.marketing,
        consentVersion: req.body?.consentVersion,
        policyVersion: req.body?.policyVersion,
        source: req.body?.source,
        region,
      });

      if (!result.ok) {
        res.status(result.status).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        isDuplicate: Boolean(result.isDuplicate),
        record: result.record,
        audit: {
          eventId: result.auditEvent?.eventId,
          timestamp: result.auditEvent?.timestamp,
          action: result.auditEvent?.action,
          sheetsSyncStatus: result.auditEvent?.sheetsSyncStatus,
        },
      });
    }
  );

  // 3. Retrieve authoritative consent record and audit history for an anonymous consentId
  app.get(
    '/api/privacy/consent/:consentId',
    consentRateLimiter.getMiddleware(),
    (req: Request, res: Response) => {
      const { consentId } = req.params;
      if (!isValidConsentId(consentId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid consentId format.',
        });
        return;
      }

      const { record, history } = getStoredConsentById(consentId);
      if (!record) {
        res.status(404).json({
          success: false,
          error: 'No consent record found for this consentId.',
        });
        return;
      }

      res.json({
        success: true,
        record,
        auditCount: history.length,
        recentEvents: history.slice(-10).map((e) => ({
          eventId: e.eventId,
          timestamp: e.timestamp,
          action: e.action,
          consentVersion: e.consentVersion,
          policyVersion: e.policyVersion,
          necessary: e.necessary,
          analytics: e.analytics,
          functional: e.functional,
          marketing: e.marketing,
          source: e.source,
          sheetsSyncStatus: e.sheetsSyncStatus,
        })),
      });
    }
  );
}
