/**
 * VIZRA Frontend Exception Monitoring (Sentry)
 *
 * Captures and reports frontend runtime exceptions and React ErrorBoundary crashes
 * via @sentry/react while guaranteeing PII, credentials, prompts, cookies, and
 * sensitive tokens are masked before any payload leaves the browser.
 */

import * as Sentry from '@sentry/react';
import type { Breadcrumb, ErrorEvent, EventHint, SeverityLevel } from '@sentry/react';

export interface MonitoringInitOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}

export interface CaptureContextOptions {
  component?: string;
  area?: string;
  componentStack?: string;
  tags?: Record<string, string | number | boolean | undefined>;
  extra?: Record<string, unknown>;
  level?: SeverityLevel;
}

const REDACTED = '[REDACTED]';
const MAX_SCRUB_DEPTH = 6;

const SENSITIVE_KEY_EXACT = new Set<string>([
  'authorization',
  'proxy-authorization',
  'cookie',
  'cookies',
  'set-cookie',
  'x-admin-key',
  'x-admin-api-key',
  'x-api-key',
  'x-vizra-client-id',
  'x-workspace-token',
  'x-vizra-billing-signature',
  'x-parental-signature',
  'x-consent-webhook-secret',
  'password',
  'passwd',
  'pwd',
  'secret',
  'client_secret',
  'clientsecret',
  'token',
  'idtoken',
  'id_token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'apikey',
  'api_key',
  'privatekey',
  'private_key',
  'signature',
  'ticket',
  'email',
  'useremail',
  'user_email',
  'parentemail',
  'phone',
  'phonenumber',
  'phone_number',
  'displayname',
  'display_name',
  'username',
  'fullname',
  'full_name',
  'address',
  'ip',
  'ip_address',
  'ipaddress',
  'clientip',
  'prompt',
  'rawprompt',
  'userprompt',
  'systeminstruction',
  'messages',
  'attachments',
  'imagebase64',
  'audiobase64',
  'creditcard',
  'cardnumber',
  'cvv',
  'ssn',
]);

const SENSITIVE_QUERY_PARAMS = new Set<string>([
  'token',
  'id_token',
  'idtoken',
  'access_token',
  'accesstoken',
  'refresh_token',
  'refreshtoken',
  'key',
  'api_key',
  'apikey',
  'secret',
  'password',
  'code',
  'state',
  'ticket',
  'sig',
  'signature',
  'auth',
  'email',
  'phone',
  'client_secret',
  'session',
]);

let monitoringInitialized = false;

/**
 * Checks if an object property key represents PII or sensitive credential/content material.
 */
function isSensitiveKey(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return false;
  if (SENSITIVE_KEY_EXACT.has(normalized)) return true;
  return (
    normalized.includes('password') ||
    normalized.includes('secret') ||
    normalized.includes('token') ||
    normalized.includes('apikey') ||
    normalized.includes('api_key') ||
    normalized.includes('authorization') ||
    normalized.includes('cookie') ||
    normalized.includes('private_key') ||
    normalized.includes('privatekey') ||
    normalized.includes('email')
  );
}

/**
 * Masks sensitive query parameters and embedded credentials in URLs while preserving path context.
 */
export function sanitizeUrlForMonitoring(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const isRelative = trimmed.startsWith('/');
    const parsed = new URL(trimmed, 'https://vizra.local');
    if (parsed.username || parsed.password) {
      parsed.username = '';
      parsed.password = '';
    }
    parsed.searchParams.forEach((value, key) => {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase()) || isSensitiveKey(key)) {
        parsed.searchParams.set(key, REDACTED);
      } else {
        const maskedVal = maskSensitiveString(value);
        if (maskedVal !== value) {
          parsed.searchParams.set(key, maskedVal);
        }
      }
    });
    if (parsed.hash && parsed.hash.length > 1) {
      parsed.hash = '#' + maskSensitiveString(parsed.hash.slice(1));
    }
    if (isRelative) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return parsed.toString();
  } catch {
    return maskSensitiveString(trimmed);
  }
}

/**
 * Masks PII (emails, IPs, phone numbers) and sensitive tokens/keys (JWTs, Bearer/Basic auth,
 * Google/OpenAI/Resend/GitHub/VIZRA workspace keys, inline secret assignments) inside arbitrary text.
 */
export function maskSensitiveString(input: string): string {
  if (!input || typeof input !== 'string') return input;

  let out = input;

  // 1. Authorization schemes (Bearer / Basic / Token)
  out = out.replace(/\b(Bearer|Basic|Token)\s+[A-Za-z0-9\-._~+/]+=*/gi, '$1 [REDACTED_TOKEN]');

  // 2. JSON Web Tokens (header.payload.signature starting with eyJ)
  out = out.replace(
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    '[REDACTED_JWT]'
  );

  // 3. Known provider API keys & VIZRA workspace/OAuth tokens
  out = out.replace(/\bAIza[0-9A-Za-z\-_]{20,}\b/g, '[REDACTED_API_KEY]');
  out = out.replace(/\bvz_live_[A-Za-z0-9_-]{12,}\b/g, '[REDACTED_WORKSPACE_TOKEN]');
  out = out.replace(/\bya29\.[0-9A-Za-z\-_]{16,}\b/g, '[REDACTED_OAUTH_TOKEN]');
  out = out.replace(/\b(?:sk|pk|rk)_(?:live|test|proj)_[A-Za-z0-9_-]{12,}\b/g, '[REDACTED_API_KEY]');
  out = out.replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, '[REDACTED_API_KEY]');
  out = out.replace(/\bre_[A-Za-z0-9_]{16,}\b/g, '[REDACTED_API_KEY]');
  out = out.replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g, '[REDACTED_GITHUB_TOKEN]');
  out = out.replace(/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, '[REDACTED_TOKEN]');

  // 4. Inline key=value / "key":"value" secret patterns
  out = out.replace(
    /((?:password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|authorization|cookie|ticket|x-admin-key|x-vizra-client-id)["']?\s*[:=]\s*["']?)([^"'\s&;,}]{4,})(["']?)/gi,
    `$1${REDACTED}$3`
  );

  // 5. Email addresses
  out = out.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]');

  // 6. IPv4 addresses (preserve version strings like 1.0.0 by requiring 4 octets)
  out = out.replace(
    /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g,
    '[REDACTED_IP]'
  );

  // 7. International / formatted phone numbers (10-15 digits with separators, avoiding pure IDs)
  out = out.replace(
    /(?<!\w)(?:\+?\d{1,3}[\s.-])?(?:\(\d{2,4}\)[\s.-]?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?!\w)/g,
    '[REDACTED_PHONE]'
  );

  return out;
}

/**
 * Recursively deep-clones and masks sensitive keys and string values within arbitrary payloads.
 */
export function scrubSensitiveValue<T>(
  value: T,
  depth = 0,
  seen = new WeakSet<object>()
): T {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return maskSensitiveString(value) as unknown as T;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (depth >= MAX_SCRUB_DEPTH) {
    return '[TRUNCATED]' as unknown as T;
  }

  if (seen.has(value as object)) {
    return '[CIRCULAR]' as unknown as T;
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => scrubSensitiveValue(item, depth + 1, seen)) as unknown as T;
  }

  if (value instanceof Date) {
    return value.toISOString() as unknown as T;
  }

  const record = value as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (isSensitiveKey(key)) {
      cleaned[key] = REDACTED;
    } else if ((key === 'url' || key === 'href' || key === 'referer' || key === 'referrer') && typeof entry === 'string') {
      cleaned[key] = sanitizeUrlForMonitoring(entry);
    } else {
      cleaned[key] = scrubSensitiveValue(entry, depth + 1, seen);
    }
  }
  return cleaned as T;
}

/**
 * Scrubs all PII, auth headers, cookies, tokens, and sensitive fields from a Sentry ErrorEvent.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  const scrubbed: ErrorEvent = { ...event };

  if (typeof scrubbed.message === 'string') {
    scrubbed.message = maskSensitiveString(scrubbed.message);
  }

  if (scrubbed.logentry) {
    scrubbed.logentry = {
      ...scrubbed.logentry,
      message:
        typeof scrubbed.logentry.message === 'string'
          ? maskSensitiveString(scrubbed.logentry.message)
          : scrubbed.logentry.message,
      params: Array.isArray(scrubbed.logentry.params)
        ? scrubbed.logentry.params.map((p) => scrubSensitiveValue(p))
        : scrubbed.logentry.params,
    };
  }

  // Scrub exception messages and local stack frame variables
  if (scrubbed.exception?.values) {
    scrubbed.exception = {
      ...scrubbed.exception,
      values: scrubbed.exception.values.map((ex) => ({
        ...ex,
        value: typeof ex.value === 'string' ? maskSensitiveString(ex.value) : ex.value,
        stacktrace: ex.stacktrace?.frames
          ? {
              ...ex.stacktrace,
              frames: ex.stacktrace.frames.map((frame) => ({
                ...frame,
                filename:
                  typeof frame.filename === 'string'
                    ? sanitizeUrlForMonitoring(frame.filename)
                    : frame.filename,
                abs_path:
                  typeof frame.abs_path === 'string'
                    ? sanitizeUrlForMonitoring(frame.abs_path)
                    : frame.abs_path,
                vars: frame.vars ? scrubSensitiveValue(frame.vars) : frame.vars,
              })),
            }
          : ex.stacktrace,
      })),
    };
  }

  // Strip PII from Sentry user context (never transmit email, username, name, or IP)
  if (scrubbed.user) {
    const safeId =
      typeof scrubbed.user.id === 'string' && /^usr_[a-f0-9]{12,32}$/.test(scrubbed.user.id)
        ? scrubbed.user.id
        : undefined;
    scrubbed.user = safeId ? { id: safeId } : undefined;
  }

  // Scrub request metadata (URL, query string, headers, cookies, body)
  if (scrubbed.request) {
    const cleanHeaders: Record<string, string> = {};
    if (scrubbed.request.headers) {
      for (const [k, v] of Object.entries(scrubbed.request.headers)) {
        cleanHeaders[k] = isSensitiveKey(k)
          ? REDACTED
          : typeof v === 'string'
            ? maskSensitiveString(v)
            : REDACTED;
      }
    }
    scrubbed.request = {
      ...scrubbed.request,
      url:
        typeof scrubbed.request.url === 'string'
          ? sanitizeUrlForMonitoring(scrubbed.request.url)
          : scrubbed.request.url,
      query_string:
        typeof scrubbed.request.query_string === 'string'
          ? sanitizeUrlForMonitoring(`/?${scrubbed.request.query_string}`).replace(/^\/\?/, '')
          : scrubbed.request.query_string
            ? scrubSensitiveValue(scrubbed.request.query_string)
            : scrubbed.request.query_string,
      headers: cleanHeaders,
      cookies: undefined,
      data: scrubbed.request.data ? scrubSensitiveValue(scrubbed.request.data) : undefined,
      env: undefined,
    };
  }

  if (scrubbed.tags) {
    scrubbed.tags = scrubSensitiveValue(scrubbed.tags);
  }

  if (scrubbed.extra) {
    scrubbed.extra = scrubSensitiveValue(scrubbed.extra);
  }

  if (scrubbed.contexts) {
    scrubbed.contexts = scrubSensitiveValue(scrubbed.contexts);
  }

  if (Array.isArray(scrubbed.breadcrumbs)) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs
      .map((crumb) => scrubSentryBreadcrumb(crumb))
      .filter((crumb): crumb is Breadcrumb => crumb !== null);
  }

  return scrubbed;
}

/**
 * Scrubs sensitive data from Sentry breadcrumbs before recording them.
 */
export function scrubSentryBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (!breadcrumb) return null;

  const cleaned: Breadcrumb = {
    ...breadcrumb,
    message:
      typeof breadcrumb.message === 'string'
        ? maskSensitiveString(breadcrumb.message)
        : breadcrumb.message,
  };

  if (cleaned.data && typeof cleaned.data === 'object') {
    const nextData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(cleaned.data)) {
      if (isSensitiveKey(k)) {
        nextData[k] = REDACTED;
      } else if ((k === 'url' || k === 'from' || k === 'to') && typeof v === 'string') {
        nextData[k] = sanitizeUrlForMonitoring(v);
      } else {
        nextData[k] = scrubSensitiveValue(v);
      }
    }
    cleaned.data = nextData;
  }

  return cleaned;
}

/**
 * Generates an irreversible opaque client-side fingerprint for correlating user errors
 * without ever transmitting raw UIDs, emails, or display names.
 */
function hashOpaqueUserId(rawUid: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < rawUid.length; i++) {
    const ch = rawUid.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `usr_${hex1}${hex2}`;
}

function resolveEnvVar(name: string): string {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> })?.env;
    const val = metaEnv?.[name];
    return typeof val === 'string' ? val.trim() : '';
  } catch {
    return '';
  }
}

/**
 * Initializes Sentry frontend exception monitoring if `VITE_SENTRY_DSN` is configured.
 * Fails gracefully (no-op) when unconfigured so local/offline builds remain clean.
 */
export function initFrontendMonitoring(overrides?: MonitoringInitOptions): boolean {
  if (monitoringInitialized) {
    return true;
  }

  const dsn = (overrides?.dsn ?? resolveEnvVar('VITE_SENTRY_DSN')).trim();
  if (!dsn) {
    return false;
  }

  // Validate DSN format before passing to Sentry SDK
  try {
    const parsed = new URL(dsn);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
  } catch {
    return false;
  }

  const mode = resolveEnvVar('MODE') || 'production';
  const environment = (overrides?.environment ?? resolveEnvVar('VITE_SENTRY_ENVIRONMENT')) || mode;
  const release = (overrides?.release ?? resolveEnvVar('VITE_SENTRY_RELEASE')) || 'vizra-web@1.0.0';
  const rawSampleRate = Number(
    overrides?.tracesSampleRate ?? (resolveEnvVar('VITE_SENTRY_TRACES_SAMPLE_RATE') || '0.05')
  );
  const tracesSampleRate = Number.isFinite(rawSampleRate)
    ? Math.min(1, Math.max(0, rawSampleRate))
    : 0.05;

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate,
    maxBreadcrumbs: 30,
    ignoreErrors: [
      // Ignore noisy browser extension, ResizeObserver, and disabled-HMR WebSocket artifacts
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications.',
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
      /WebSocket connection to 'ws:\/\/localhost/i,
    ],
    beforeSend(event: ErrorEvent, _hint: EventHint) {
      return scrubSentryEvent(event);
    },
    beforeSendTransaction(transaction) {
      if (transaction.request?.url) {
        transaction.request.url = sanitizeUrlForMonitoring(transaction.request.url);
      }
      if (transaction.user) {
        const safeId =
          typeof transaction.user.id === 'string' && /^usr_[a-f0-9]{12,32}$/.test(transaction.user.id)
            ? transaction.user.id
            : undefined;
        transaction.user = safeId ? { id: safeId } : undefined;
      }
      if (transaction.tags) {
        transaction.tags = scrubSensitiveValue(transaction.tags);
      }
      if (transaction.extra) {
        transaction.extra = scrubSensitiveValue(transaction.extra);
      }
      return transaction;
    },
    beforeBreadcrumb(breadcrumb: Breadcrumb) {
      return scrubSentryBreadcrumb(breadcrumb);
    },
  });

  monitoringInitialized = true;
  return true;
}

export function isMonitoringEnabled(): boolean {
  return monitoringInitialized;
}

/**
 * Sets an opaque hashed non-PII user identifier on the Sentry scope, or clears it on sign-out.
 */
export function setMonitoringUser(userId: string | null | undefined): void {
  if (!monitoringInitialized) return;
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: hashOpaqueUserId(userId.trim()) });
}

/**
 * Captures and transmits a frontend exception to Sentry with scrubbed tags, extras, and stack metadata.
 */
export function captureFrontendException(
  error: unknown,
  context?: CaptureContextOptions
): string | undefined {
  if (!monitoringInitialized) {
    return undefined;
  }

  return Sentry.withScope((scope) => {
    if (context?.level) {
      scope.setLevel(context.level);
    }
    if (context?.component) {
      scope.setTag('ui.component', maskSensitiveString(context.component));
    }
    if (context?.area) {
      scope.setTag('app.area', maskSensitiveString(context.area));
    }
    if (context?.tags) {
      for (const [k, v] of Object.entries(context.tags)) {
        if (v !== undefined && !isSensitiveKey(k)) {
          scope.setTag(k, maskSensitiveString(String(v)));
        }
      }
    }
    if (context?.componentStack) {
      scope.setExtra('componentStack', maskSensitiveString(context.componentStack));
    }
    if (context?.extra) {
      const safeExtras = scrubSensitiveValue(context.extra);
      for (const [k, v] of Object.entries(safeExtras)) {
        scope.setExtra(k, v);
      }
    }

    const safeError =
      error instanceof Error
        ? Object.assign(new Error(maskSensitiveString(error.message)), {
            name: error.name,
            stack: error.stack ? maskSensitiveString(error.stack) : undefined,
          })
        : new Error(maskSensitiveString(String(error)));

    return Sentry.captureException(safeError);
  });
}

/**
 * Captures a scrubbed operational message in Sentry.
 */
export function captureFrontendMessage(
  message: string,
  level: SeverityLevel = 'warning',
  context?: CaptureContextOptions
): string | undefined {
  if (!monitoringInitialized) {
    return undefined;
  }

  return Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context?.component) {
      scope.setTag('ui.component', maskSensitiveString(context.component));
    }
    if (context?.area) {
      scope.setTag('app.area', maskSensitiveString(context.area));
    }
    if (context?.extra) {
      const safeExtras = scrubSensitiveValue(context.extra);
      for (const [k, v] of Object.entries(safeExtras)) {
        scope.setExtra(k, v);
      }
    }
    return Sentry.captureMessage(maskSensitiveString(message), level);
  });
}
