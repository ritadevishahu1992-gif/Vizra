import type { Response } from 'express';
import { sanitizeServerError } from './security';

export type ServerErrorCategory =
  | 'API_UNAVAILABLE'
  | 'REQUEST_TIMEOUT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AUTH_FAILURE'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'INVALID_REQUEST'
  | 'MODEL_UNAVAILABLE'
  | 'PROVIDER_QUOTA'
  | 'FILE_PROCESSING_FAILURE'
  | 'DATABASE_FAILURE';

export const HIGH_TRAFFIC_USER_MESSAGE =
  "I'm unable to serve the data due to high traffic.";

export interface ClassifiedServerError {
  status: number;
  category: ServerErrorCategory;
  code: string;
  message: string;
  retryable: boolean;
}

/**
 * Classifies upstream AI / network / server errors into safe, user-facing payloads
 * without leaking internal stack traces, file paths, or environment keys.
 */
export function classifyUpstreamError(err: any): ClassifiedServerError {
  const status = Number(err?.status || err?.statusCode || 0);
  const raw = String(err?.message || '');

  if (status === 429 || /429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(raw)) {
    return {
      status: 429,
      category: 'PROVIDER_QUOTA',
      code: 'HIGH_TRAFFIC_QUOTA',
      message: HIGH_TRAFFIC_USER_MESSAGE,
      retryable: true,
    };
  }

  if (status === 408 || status === 504 || /timeout|timed out|abort/i.test(raw)) {
    return {
      status: 504,
      category: 'REQUEST_TIMEOUT',
      code: 'UPSTREAM_TIMEOUT',
      message: HIGH_TRAFFIC_USER_MESSAGE,
      retryable: true,
    };
  }

  if (status === 503 || /unavailable|overloaded|model.*not found|503/i.test(raw)) {
    return {
      status: 503,
      category: 'MODEL_UNAVAILABLE',
      code: 'MODEL_UNAVAILABLE',
      message: HIGH_TRAFFIC_USER_MESSAGE,
      retryable: true,
    };
  }

  if (status === 401) {
    return {
      status: 401,
      category: 'AUTH_FAILURE',
      code: 'AUTH_FAILURE',
      message: 'Authentication is required for this request.',
      retryable: false,
    };
  }

  if (status === 403) {
    return {
      status: 403,
      category: 'INSUFFICIENT_PERMISSIONS',
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'Access to this resource is not permitted.',
      retryable: false,
    };
  }

  return {
    status: status >= 400 && status < 600 ? status : 500,
    category: 'API_UNAVAILABLE',
    code: 'UPSTREAM_PROCESSING_ERROR',
    message: sanitizeServerError(err, HIGH_TRAFFIC_USER_MESSAGE),
    retryable: true,
  };
}

export function sendSafeErrorResponse(
  res: Response,
  params: {
    status: number;
    code: string;
    category: ServerErrorCategory;
    message: string;
    requestId?: string;
    retryable?: boolean;
    extra?: Record<string, unknown>;
  }
): void {
  res.status(params.status).json({
    error: {
      code: params.code,
      category: params.category,
      message: params.message,
      retryable: Boolean(params.retryable),
      requestId: params.requestId,
    },
    ...(params.extra || {}),
  });
}
