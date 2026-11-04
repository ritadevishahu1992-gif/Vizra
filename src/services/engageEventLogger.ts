import { track } from '@vercel/analytics';
import { AIMode } from '../types/ai';
import {
  EngageCoarseIntent,
  EngageContentType,
  EngageLifecycleState,
} from '../types/engage';

export type SafeInteractionEventName =
  | 'chat_initiated'
  | 'chat_completed'
  | 'chat_cancelled'
  | 'chat_failed'
  | 'engage_lifecycle_transition'
  | 'engage_card_interaction'
  | 'engage_error_boundary_triggered';

export interface SafeInteractionEventPayload {
  mode?: AIMode;
  model?: string;
  hasAttachments?: boolean;
  lifecycleState?: EngageLifecycleState;
  coarseIntent?: EngageCoarseIntent;
  hasStreamedTokens?: boolean;
  contentId?: string;
  contentType?: EngageContentType;
  action?: 'interact' | 'navigate' | 'expand' | 'collapse' | 'dismiss';
  durationMs?: number;
  fallbackRendered?: boolean;
  reason?: string;
}

export interface LoggedSafeInteractionEvent {
  id: string;
  event: SafeInteractionEventName;
  payload: SafeInteractionEventPayload;
  timestamp: number;
}

/**
 * Explicitly forbidden keys to guarantee zero PII or raw user prompt leakage
 * even if a caller passes untrusted properties at runtime.
 */
const FORBIDDEN_PII_KEYS = new Set([
  'prompt',
  'content',
  'text',
  'message',
  'query',
  'email',
  'uid',
  'userid',
  'user_id',
  'name',
  'username',
  'ip',
  'ipaddress',
  'token',
  'authorization',
  'attachment',
  'attachments',
  'file',
  'files',
]);

const ALLOWED_SAFE_KEYS = new Set([
  'mode',
  'model',
  'hasAttachments',
  'lifecycleState',
  'coarseIntent',
  'hasStreamedTokens',
  'contentId',
  'contentType',
  'action',
  'durationMs',
  'fallbackRendered',
  'reason',
]);

const MAX_BUFFER_SIZE = 200;
const eventRingBuffer: LoggedSafeInteractionEvent[] = [];

/**
 * Sanitizes any event payload to guarantee that only coarse, non-PII operational
 * telemetry fields are retained.
 */
export function sanitizeEventPayload(
  rawPayload: Record<string, unknown> = {}
): SafeInteractionEventPayload {
  const clean: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(rawPayload)) {
    const normalizedKey = key.toLowerCase().trim();
    if (FORBIDDEN_PII_KEYS.has(normalizedKey)) {
      continue;
    }
    if (!ALLOWED_SAFE_KEYS.has(key)) {
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      clean[key] = value;
    } else if (typeof value === 'string') {
      // Truncate any string metadata to 64 chars to prevent accidental content stuffing
      clean[key] = value.slice(0, 64);
    }
  }

  return clean as SafeInteractionEventPayload;
}

/**
 * Records a privacy-compliant interaction event without blocking UI or AI streaming.
 * Uses @vercel/analytics `track` when running in a browser environment and stores
 * a bounded in-memory audit log for verification and diagnostics.
 */
export function logSafeInteractionEvent(
  event: SafeInteractionEventName,
  rawPayload: SafeInteractionEventPayload & Record<string, unknown> = {}
): LoggedSafeInteractionEvent {
  const sanitizedPayload = sanitizeEventPayload(rawPayload);
  const entry: LoggedSafeInteractionEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event,
    payload: sanitizedPayload,
    timestamp: Date.now(),
  };

  try {
    eventRingBuffer.push(entry);
    if (eventRingBuffer.length > MAX_BUFFER_SIZE) {
      eventRingBuffer.shift();
    }

    if (typeof window !== 'undefined') {
      track(event, sanitizedPayload as Record<string, string | number | boolean>);
    }
  } catch {
    // Telemetry must never throw or disrupt application execution
  }

  return entry;
}

export function getLoggedSafeInteractionEvents(): LoggedSafeInteractionEvent[] {
  return [...eventRingBuffer];
}

export function clearLoggedSafeInteractionEvents(): void {
  eventRingBuffer.length = 0;
}
