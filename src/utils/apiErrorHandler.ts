/**
 * CENTRALIZED CLIENT API ERROR HANDLER & RETRY UTILITY
 *
 * Covers all production failure categories cleanly without exposing raw stack traces
 * or leaving the interface stuck in an infinite loading state.
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
  | 'FILE_PROCESSING_FAILURE'
  | 'DATABASE_FAILURE'
  | 'NETWORK_INTERRUPTION';

export interface NormalizedApiError {
  category: ApiErrorCategory;
  code: string;
  status?: number;
  userMessage: string;
  retryable: boolean;
  requestId?: string;
}

export const HIGH_TRAFFIC_MESSAGE = "I'm unable to serve the data due to high traffic.";

export function classifyApiError(
  status?: number,
  serverCode?: string,
  serverMessage?: string,
  err?: unknown
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
      userMessage: 'The request timed out or was cancelled. Please try again.',
      retryable: true,
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
      userMessage: 'Network connection interrupted. Check your internet connection and retry.',
      retryable: true,
    };
  }

  if (status === 408 || status === 504 || code.includes('TIMEOUT')) {
    return {
      category: 'REQUEST_TIMEOUT',
      code: code || 'REQUEST_TIMEOUT',
      status,
      userMessage: 'The request took too long to respond. Please try again.',
      retryable: true,
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
      userMessage: HIGH_TRAFFIC_MESSAGE,
      retryable: true,
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
    code.includes('HIGH_TRAFFIC')
  ) {
    return {
      category: code.includes('MODEL') ? 'MODEL_UNAVAILABLE' : 'API_UNAVAILABLE',
      code: code || 'SERVICE_UNAVAILABLE',
      status: 503,
      userMessage: HIGH_TRAFFIC_MESSAGE,
      retryable: true,
    };
  }

  if (code.includes('DATABASE') || code.includes('FIRESTORE')) {
    return {
      category: 'DATABASE_FAILURE',
      code: code || 'DATABASE_FAILURE',
      status: status || 500,
      userMessage: 'A temporary storage error occurred. Your session remains safe—please retry shortly.',
      retryable: true,
    };
  }

  return {
    category: 'API_UNAVAILABLE',
    code: code || 'UPSTREAM_ERROR',
    status: status || 500,
    userMessage: HIGH_TRAFFIC_MESSAGE,
    retryable: true,
  };
}

export interface FetchWithRetryOptions {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
}

/**
 * Executes fetch() with a strict per-attempt timeout and controlled exponential backoff
 * for transient failures (502/503/504/network hiccups). Never retries 4xx validation or auth errors.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { timeoutMs = 28000, maxRetries = 1, baseDelayMs = 650, signal } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }

    const attemptController = new AbortController();
    const onExternalAbort = () => attemptController.abort();
    if (signal) {
      signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    const timeoutId = window.setTimeout(() => attemptController.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: attemptController.signal,
      });

      window.clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onExternalAbort);
      }

      const isTransientStatus =
        response.status === 502 || response.status === 503 || response.status === 504;

      if (!isTransientStatus || attempt === maxRetries) {
        return response;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    } catch (err) {
      window.clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onExternalAbort);
      }
      lastError = err;

      if (signal?.aborted || attempt === maxRetries) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
