/**
 * CENTRALIZED CLIENT API ERROR HANDLER & RETRY UTILITY
 *
 * Covers all production failure categories cleanly without exposing raw stack traces
 * or leaving the interface stuck in an infinite loading state.
 * Includes Retry-After awareness, exponential backoff with randomized jitter,
 * strict retry limits, and anonymous session client IDs for fair NAT concurrency.
 */

export type ApiErrorCategory =
  | 'API_UNAVAILABLE'
  | 'REQUEST_TIMEOUT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AUTH_FAILURE'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'INVALID_REQUEST'
  | 'MODEL_UNAVAILABLE'
  | 'PROVIDER_QUOTA'
  | 'PROVIDER_OVERLOAD'
  | 'CAPACITY_QUEUE_FULL'
  | 'CAPACITY_QUEUE_TIMEOUT'
  | 'DUPLICATE_IN_FLIGHT'
  | 'FILE_PROCESSING_FAILURE'
  | 'DATABASE_FAILURE'
  | 'NETWORK_INTERRUPTION';

export interface NormalizedApiError {
  category: ApiErrorCategory;
  code: string;
  status?: number;
  userMessage: string;
  retryable: boolean;
  retryAfterSec?: number;
  requestId?: string;
}

export const HIGH_TRAFFIC_MESSAGE =
  'Omnia is temporarily handling high traffic. Your message is preserved — please click Retry in a few seconds.';

const CLIENT_ID_STORAGE_KEY = 'vizra_session_client_id_v1';
let memoryClientId: string | null = null;

/**
 * Generates a lightweight anonymous per-tab client ID so users behind a shared NAT/proxy IP
 * each receive fair concurrency slots without tracking personal identity.
 */
export function getOrCreateVizraClientId(): string {
  if (memoryClientId) return memoryClientId;
  try {
    const existing = window.sessionStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing && /^[a-z0-9_-]{16,64}$/i.test(existing)) {
      memoryClientId = existing;
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 24)
        : `vc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
    memoryClientId = generated;
    return generated;
  } catch {
    memoryClientId = `vc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 8)}`;
    return memoryClientId;
  }
}

export function parseRetryAfterHeaderMs(headerVal: string | null | undefined): number | undefined {
  if (!headerVal || !headerVal.trim()) return undefined;
  const trimmed = headerVal.trim();
  const secs = Number(trimmed);
  if (Number.isFinite(secs) && secs > 0) {
    return Math.round(secs * 1000);
  }
  const dateMs = Date.parse(trimmed);
  if (Number.isFinite(dateMs)) {
    const diff = dateMs - Date.now();
    if (diff > 0) return diff;
  }
  return undefined;
}

export function classifyApiError(
  status?: number,
  serverCode?: string,
  serverMessage?: string,
  err?: unknown,
  retryAfterSec?: number
): NormalizedApiError {
  const code = (serverCode || '').toUpperCase();
  const rawMsg =
    (typeof serverMessage === 'string' && serverMessage) ||
    (err instanceof Error ? err.message : '') ||
    '';

  if (err instanceof DOMException && err.name === 'AbortError') {
    return {
      category: 'REQUEST_TIMEOUT',
      code: 'REQUEST_ABORTED',
      status,
      userMessage: 'The request timed out or was cancelled. Your message is preserved — click Retry to try again.',
      retryable: true,
      retryAfterSec: retryAfterSec ?? 2,
    };
  }

  if (
    err instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(rawMsg)
  ) {
    return {
      category: 'NETWORK_INTERRUPTION',
      code: 'NETWORK_ERROR',
      status,
      userMessage: 'Network connection interrupted. Check your internet connection and click Retry.',
      retryable: true,
      retryAfterSec: retryAfterSec ?? 2,
    };
  }

  if (code === 'DUPLICATE_IN_FLIGHT') {
    return {
      category: 'DUPLICATE_IN_FLIGHT',
      code,
      status: status || 429,
      userMessage: 'Your previous identical request is already being processed. Please wait a moment.',
      retryable: true,
      retryAfterSec: retryAfterSec ?? 2,
    };
  }

  if (code === 'CAPACITY_QUEUE_FULL' || code === 'GLOBAL_RATE_LIMIT' || code === 'USER_CONCURRENCY_LIMIT') {
    return {
      category: 'CAPACITY_QUEUE_FULL',
      code,
      status: status || 503,
      userMessage:
        serverMessage && serverMessage.length < 220
          ? serverMessage
          : 'Omnia is currently handling high demand. Your message is preserved — please retry in a few seconds.',
      retryable: true,
      retryAfterSec: retryAfterSec ?? 5,
    };
  }

  if (code === 'CAPACITY_QUEUE_TIMEOUT') {
    return {
      category: 'CAPACITY_QUEUE_TIMEOUT',
      code,
      status: status || 503,
      userMessage: 'Capacity wait time exceeded under heavy traffic. Your message is preserved — click Retry to try again.',
      retryable: true,
      retryAfterSec: retryAfterSec ?? 4,
    };
  }

  if (status === 408 || status === 504 || code.includes('TIMEOUT')) {
    return {
      category: 'REQUEST_TIMEOUT',
      code: code || 'REQUEST_TIMEOUT',
      status: status || 504,
      userMessage: 'The AI provider took too long to respond. Your message is preserved — please click Retry.',
      retryable: true,
      retryAfterSec: retryAfterSec ?? 3,
    };
  }

  if (
    status === 429 ||
    code.includes('RATE_LIMIT') ||
    code.includes('QUOTA') ||
    /resource_exhausted|quota|too many requests|high traffic/i.test(rawMsg)
  ) {
    const isQuota = code.includes('QUOTA') || /resource_exhausted|quota/i.test(rawMsg);
    return {
      category: isQuota ? 'PROVIDER_QUOTA' : 'RATE_LIMIT_EXCEEDED',
      code: code || (isQuota ? 'PROVIDER_QUOTA' : 'RATE_LIMIT_EXCEEDED'),
      status: status || 429,
      userMessage:
        serverMessage && serverMessage.length < 220
          ? serverMessage
          : HIGH_TRAFFIC_MESSAGE,
      retryable: true,
      retryAfterSec: retryAfterSec ?? 5,
    };
  }

  if (status === 401 || code.includes('AUTH') || code.includes('TOKEN')) {
    return {
      category: 'AUTH_FAILURE',
      code: code || 'AUTH_FAILURE',
      status: 401,
      userMessage: 'Your session needs to be refreshed. Please sign in again to continue.',
      retryable: false,
    };
  }

  if (status === 403 || code.includes('PERMISSION') || code.includes('AGE_ASSURANCE')) {
    return {
      category: 'INSUFFICIENT_PERMISSIONS',
      code: code || 'INSUFFICIENT_PERMISSIONS',
      status: 403,
      userMessage:
        serverMessage && serverMessage.length < 220
          ? serverMessage
          : 'You do not have permission to perform this action.',
      retryable: false,
    };
  }

  if (
    status === 400 ||
    status === 413 ||
    status === 422 ||
    code.includes('INVALID_') ||
    code.includes('PROMPT_POLICY')
  ) {
    const isFile =
      status === 413 || code.includes('ATTACHMENT') || code.includes('FILE');
    return {
      category: isFile ? 'FILE_PROCESSING_FAILURE' : 'INVALID_REQUEST',
      code: code || (isFile ? 'FILE_PROCESSING_FAILURE' : 'INVALID_REQUEST'),
      status: status || 400,
      userMessage:
        serverMessage && serverMessage.length < 240
          ? serverMessage
          : isFile
          ? 'The uploaded file could not be processed. Ensure it is under 10 MB and a supported format.'
          : 'The request could not be processed. Please review your input and try again.',
      retryable: false,
    };
  }

  if (
    status === 503 ||
    code.includes('MODEL_UNAVAILABLE') ||
    code.includes('GEMINI_NOT_CONFIGURED') ||
    code.includes('HIGH_TRAFFIC') ||
    code.includes('OVERLOAD')
  ) {
    return {
      category: code.includes('OVERLOAD') ? 'PROVIDER_OVERLOAD' : 'MODEL_UNAVAILABLE',
      code: code || 'SERVICE_UNAVAILABLE',
      status: 503,
      userMessage:
        serverMessage && serverMessage.length < 220
          ? serverMessage
          : HIGH_TRAFFIC_MESSAGE,
      retryable: true,
      retryAfterSec: retryAfterSec ?? 4,
    };
  }

  if (code.includes('DATABASE') || code.includes('FIRESTORE')) {
    return {
      category: 'DATABASE_FAILURE',
      code: code || 'DATABASE_FAILURE',
      status: status || 500,
      userMessage: 'A temporary storage error occurred. Your session remains safe — please retry shortly.',
      retryable: true,
      retryAfterSec: retryAfterSec ?? 3,
    };
  }

  return {
    category: 'API_UNAVAILABLE',
    code: code || 'UPSTREAM_ERROR',
    status: status || 500,
    userMessage:
      serverMessage && serverMessage.length < 220
        ? serverMessage
        : HIGH_TRAFFIC_MESSAGE,
    retryable: true,
    retryAfterSec: retryAfterSec ?? 3,
  };
}

export interface FetchWithRetryOptions {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
  onRetry?: (info: { attempt: number; delayMs: number; status?: number }) => void;
}

function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Request aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Request aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function computeClientBackoffMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  retryAfterMs?: number
): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
  // Randomized jitter (50%–100%) to avoid synchronized client retry storms
  const jittered = Math.round(exp * (0.5 + Math.random() * 0.5));
  if (retryAfterMs !== undefined && retryAfterMs > 0) {
    return Math.min(maxDelayMs, Math.max(jittered, retryAfterMs));
  }
  return jittered;
}

export interface ApiHealthSignalDetail {
  kind: 'ok' | 'heavy_traffic' | 'limited_access';
  status?: number;
  latencyMs?: number;
  timestamp: number;
}

export const API_HEALTH_SIGNAL_EVENT = 'vizra:api-health-signal';

function emitApiHealthSignal(detail: ApiHealthSignalDetail): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent<ApiHealthSignalDetail>(API_HEALTH_SIGNAL_EVENT, { detail }));
  } catch {
    // Ignore event dispatch failures in non-browser environments
  }
}

/**
 * Executes fetch() with a strict per-attempt timeout, anonymous X-Vizra-Client-Id header
 * for fair concurrency, Retry-After awareness, and exponential backoff with randomized jitter
 * for transient failures (429/500/502/503/504/network hiccups).
 * Never retries 400/401/403/404/413/422 validation or authentication failures.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 34000,
    maxRetries = 2,
    baseDelayMs = 700,
    maxDelayMs = 6000,
    signal,
    onRetry,
  } = options;

  const isInternalApi = url.startsWith('/api/') && !url.startsWith('/api/health');
  const effectiveSignal = signal ?? init.signal ?? undefined;
  const headers = new Headers(init.headers || {});
  if (url.startsWith('/api/') && !headers.has('X-Vizra-Client-Id')) {
    headers.set('X-Vizra-Client-Id', getOrCreateVizraClientId());
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (effectiveSignal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }

    const attemptController = new AbortController();
    const onExternalAbort = () => attemptController.abort();
    if (effectiveSignal) {
      effectiveSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    const timeoutId = window.setTimeout(() => attemptController.abort(), timeoutMs);
    const attemptStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: attemptController.signal,
      });

      window.clearTimeout(timeoutId);
      if (effectiveSignal) {
        effectiveSignal.removeEventListener('abort', onExternalAbort);
      }

      const elapsedMs = Math.round(
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - attemptStartedAt
      );

      const isTransientStatus =
        response.status === 429 ||
        response.status === 500 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;

      if (isInternalApi) {
        if (response.status === 503 || response.status === 500) {
          emitApiHealthSignal({
            kind: 'limited_access',
            status: response.status,
            latencyMs: elapsedMs,
            timestamp: Date.now(),
          });
        } else if (response.status === 429 || response.status === 502 || response.status === 504) {
          emitApiHealthSignal({
            kind: 'heavy_traffic',
            status: response.status,
            latencyMs: elapsedMs,
            timestamp: Date.now(),
          });
        } else if (response.ok) {
          emitApiHealthSignal({
            kind: 'ok',
            status: response.status,
            latencyMs: elapsedMs,
            timestamp: Date.now(),
          });
        }
      }

      if (!isTransientStatus || attempt === maxRetries) {
        return response;
      }

      // Never auto-retry DUPLICATE_IN_FLIGHT (wait for the original request instead)
      if (response.status === 429) {
        try {
          const cloned = response.clone();
          const body = await cloned.json();
          if (body?.error?.code === 'DUPLICATE_IN_FLIGHT') {
            return response;
          }
        } catch {
          // non-JSON 429 body — treat as retryable
        }
      }

      const retryAfterMs = parseRetryAfterHeaderMs(response.headers.get('Retry-After'));
      const delay = computeClientBackoffMs(attempt, baseDelayMs, maxDelayMs, retryAfterMs);
      onRetry?.({ attempt: attempt + 1, delayMs: delay, status: response.status });
      await sleepWithAbort(delay, effectiveSignal);
    } catch (err) {
      window.clearTimeout(timeoutId);
      if (effectiveSignal) {
        effectiveSignal.removeEventListener('abort', onExternalAbort);
      }
      lastError = err;

      if (isInternalApi && !effectiveSignal?.aborted) {
        emitApiHealthSignal({
          kind: 'limited_access',
          timestamp: Date.now(),
        });
      }

      if (effectiveSignal?.aborted || attempt === maxRetries) {
        throw err;
      }

      const delay = computeClientBackoffMs(attempt, baseDelayMs, maxDelayMs);
      onRetry?.({ attempt: attempt + 1, delayMs: delay });
      await sleepWithAbort(delay, effectiveSignal);
    }
  }

  throw lastError;
}
