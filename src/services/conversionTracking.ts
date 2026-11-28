import { track } from '@vercel/analytics';
import { getSavedCookieConsent } from '../components/ui/CookieConsent';

export type ConversionEventName =
  | 'organic_landing_visit'
  | 'signup_cta_click'
  | 'registration_started'
  | 'registration_completed'
  | 'free_tool_used'
  | 'article_to_product_click';

export interface ConversionEventPayload {
  page?: string;
  category?: string;
  source?: string;
  location?: string;
  target?: string;
  method?: 'google' | 'email';
  tool?: string;
  action?: string;
  preset?: string;
  articleSlug?: string;
  placement?: string;
  referrerHost?: string;
}

export interface LoggedConversionEvent {
  id: string;
  event: ConversionEventName;
  payload: ConversionEventPayload;
  timestamp: number;
  analyticsConsentGranted: boolean;
}

const FORBIDDEN_PII_KEYS = new Set([
  'email',
  'name',
  'username',
  'uid',
  'userid',
  'user_id',
  'prompt',
  'input',
  'text',
  'message',
  'password',
  'token',
  'phone',
  'ip',
]);

const ALLOWED_KEYS = new Set([
  'page',
  'category',
  'source',
  'location',
  'target',
  'method',
  'tool',
  'action',
  'preset',
  'articleSlug',
  'placement',
  'referrerHost',
]);

const MAX_LOG_ENTRIES = 100;
const conversionEventLog: LoggedConversionEvent[] = [];

function sanitizeConversionPayload(
  raw: Record<string, unknown> = {}
): Record<string, string | number | boolean> {
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (FORBIDDEN_PII_KEYS.has(key.toLowerCase().trim())) continue;
    if (!ALLOWED_KEYS.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === 'boolean' || typeof value === 'number') {
      clean[key] = value;
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        clean[key] = trimmed.slice(0, 80);
      }
    }
  }
  return clean;
}

function getSafeReferrerHost(): string | undefined {
  if (typeof document === 'undefined' || !document.referrer) return undefined;
  try {
    const url = new URL(document.referrer);
    if (url.hostname === window.location.hostname) return 'internal';
    return url.hostname.slice(0, 64);
  } catch {
    return undefined;
  }
}

/**
 * Privacy-respecting SaaS conversion funnel tracker.
 * - Sends zero PII and strips any disallowed fields.
 * - Respects saved cookie consent preferences: cookieless aggregate conversion
 *   events dispatch through @vercel/analytics only when optional analytics have
 *   not been explicitly rejected/withdrawn, and never stores tracking cookies.
 */
export function trackConversionEvent(
  event: ConversionEventName,
  rawPayload: ConversionEventPayload = {}
): LoggedConversionEvent {
  const consent = typeof window !== 'undefined' ? getSavedCookieConsent() : null;
  const analyticsConsentGranted = Boolean(consent?.analytics);
  const explicitlyRejected =
    consent !== null &&
    (consent.action === 'REJECT_OPTIONAL' ||
      consent.action === 'WITHDRAW' ||
      !consent.analytics);

  const enrichedRaw: Record<string, unknown> = { ...rawPayload };
  if (event === 'organic_landing_visit' && !enrichedRaw.referrerHost) {
    const refHost = getSafeReferrerHost();
    if (refHost) enrichedRaw.referrerHost = refHost;
  }

  const sanitized = sanitizeConversionPayload(enrichedRaw);

  const entry: LoggedConversionEvent = {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event,
    payload: sanitized as ConversionEventPayload,
    timestamp: Date.now(),
    analyticsConsentGranted,
  };

  try {
    conversionEventLog.push(entry);
    if (conversionEventLog.length > MAX_LOG_ENTRIES) {
      conversionEventLog.shift();
    }

    if (typeof window !== 'undefined' && !explicitlyRejected && analyticsConsentGranted) {
      track(event, sanitized);
    }
  } catch {
    // Tracking must never break user flows
  }

  return entry;
}

export function getLoggedConversionEvents(): LoggedConversionEvent[] {
  return [...conversionEventLog];
}
