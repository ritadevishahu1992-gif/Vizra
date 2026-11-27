import crypto from 'crypto';

// ============================================================================
// VIZRA PRODUCTION RELIABILITY & TRAFFIC MANAGEMENT LAYER
// - Bounded concurrency with fair per-user round-robin queuing
// - Global & per-user backpressure + queue timeout
// - Duplicate in-flight submission protection
// - Intelligent retry with exponential backoff, randomized jitter & Retry-After
// - Model health tracking for automatic compatible fallback promotion
// - Safe TTL caching & in-flight request coalescing for public retrieval
// ============================================================================

export type FailureCategory =
  | 'NONE'
  | 'PROVIDER_QUOTA'
  | 'PROVIDER_OVERLOAD'
  | 'PROVIDER_5XX'
  | 'REQUEST_TIMEOUT'
  | 'CAPACITY_QUEUE_FULL'
  | 'CAPACITY_QUEUE_TIMEOUT'
  | 'DUPLICATE_IN_FLIGHT'
  | 'RETRIEVAL_FAILURE'
  | 'INVALID_REQUEST'
  | 'AUTH_FAILURE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface QueueAcquireResult {
  ticketId: string;
  queueWaitMs: number;
  wasQueued: boolean;
  release: () => void;
}

export class CapacityBackpressureError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly category: FailureCategory;
  public readonly retryAfterSec: number;

  constructor(params: {
    message: string;
    status: number;
    code: string;
    category: FailureCategory;
    retryAfterSec: number;
  }) {
    super(params.message);
    this.name = 'CapacityBackpressureError';
    this.status = params.status;
    this.code = params.code;
    this.category = params.category;
    this.retryAfterSec = params.retryAfterSec;
  }
}

interface PendingWaiter {
  ticketId: string;
  userKey: string;
  enqueuedAt: number;
  timer: ReturnType<typeof setTimeout>;
  resolve: (result: QueueAcquireResult) => void;
  reject: (err: Error) => void;
}

export interface TrafficControllerConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  queueTimeoutMs: number;
  maxPerUserInFlight: number;
  globalWindowMs: number;
  globalMaxRequests: number;
  duplicateWindowMs: number;
}

export interface TrafficControllerSnapshot {
  activeCount: number;
  maxConcurrent: number;
  queuedCount: number;
  maxQueueSize: number;
  totalAdmitted: number;
  totalQueued: number;
  queueTimeouts: number;
  queueRejections: number;
  duplicateBlocked: number;
  globalRateLimited: number;
  avgQueueWaitMs: number;
}

export class BoundedFairTrafficController {
  private readonly cfg: TrafficControllerConfig;
  private activeCount = 0;
  private activeByUser = new Map<string, number>();
  private queuedByUser = new Map<string, number>();
  private queue: PendingWaiter[] = [];
  private lastServedUserIndex = 0;
  private globalTimestamps: number[] = [];
  private inFlightSignatures = new Map<string, number>();

  // Operational metrics
  private totalAdmitted = 0;
  private totalQueued = 0;
  private totalQueueWaitMs = 0;
  private queueTimeouts = 0;
  private queueRejections = 0;
  private duplicateBlocked = 0;
  private globalRateLimited = 0;

  constructor(config?: Partial<TrafficControllerConfig>) {
    this.cfg = {
      maxConcurrent: config?.maxConcurrent ?? Number(process.env.OMNIA_MAX_CONCURRENT_AI || 6),
      maxQueueSize: config?.maxQueueSize ?? Number(process.env.OMNIA_MAX_QUEUE_SIZE || 24),
      queueTimeoutMs: config?.queueTimeoutMs ?? Number(process.env.OMNIA_QUEUE_TIMEOUT_MS || 12000),
      maxPerUserInFlight: config?.maxPerUserInFlight ?? Number(process.env.OMNIA_MAX_PER_USER_INFLIGHT || 2),
      globalWindowMs: config?.globalWindowMs ?? 60_000,
      globalMaxRequests: config?.globalMaxRequests ?? Number(process.env.OMNIA_GLOBAL_RPM_LIMIT || 120),
      duplicateWindowMs: config?.duplicateWindowMs ?? 2000,
    };
  }

  public getSnapshot(): TrafficControllerSnapshot {
    return {
      activeCount: this.activeCount,
      maxConcurrent: this.cfg.maxConcurrent,
      queuedCount: this.queue.length,
      maxQueueSize: this.cfg.maxQueueSize,
      totalAdmitted: this.totalAdmitted,
      totalQueued: this.totalQueued,
      queueTimeouts: this.queueTimeouts,
      queueRejections: this.queueRejections,
      duplicateBlocked: this.duplicateBlocked,
      globalRateLimited: this.globalRateLimited,
      avgQueueWaitMs: this.totalQueued > 0 ? Math.round(this.totalQueueWaitMs / this.totalQueued) : 0,
    };
  }

  public computeDuplicateKey(userKey: string, prompt: string, mode?: string): string {
    const normalized = `${userKey}::${(mode || 'quick').toLowerCase()}::${prompt.trim().toLowerCase().slice(0, 400)}`;
    return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 24);
  }

  private checkGlobalWindow(now: number): { allowed: boolean; retryAfterSec: number } {
    const cutoff = now - this.cfg.globalWindowMs;
    while (this.globalTimestamps.length > 0 && this.globalTimestamps[0] <= cutoff) {
      this.globalTimestamps.shift();
    }
    if (this.globalTimestamps.length >= this.cfg.globalMaxRequests) {
      const oldest = this.globalTimestamps[0];
      const waitMs = Math.max(1000, oldest + this.cfg.globalWindowMs - now);
      return { allowed: false, retryAfterSec: Math.ceil(waitMs / 1000) };
    }
    this.globalTimestamps.push(now);
    return { allowed: true, retryAfterSec: 0 };
  }

  public async acquire(userKey: string, duplicateKey?: string): Promise<QueueAcquireResult> {
    const now = Date.now();

    // 1. Clean expired duplicate entries & protect against accidental rapid duplicate submissions
    for (const [sig, ts] of this.inFlightSignatures.entries()) {
      if (now - ts > Math.max(this.cfg.duplicateWindowMs, 35_000)) {
        this.inFlightSignatures.delete(sig);
      }
    }

    if (duplicateKey) {
      const existingTs = this.inFlightSignatures.get(duplicateKey);
      if (existingTs !== undefined && now - existingTs < this.cfg.duplicateWindowMs) {
        this.duplicateBlocked += 1;
        throw new CapacityBackpressureError({
          message: 'An identical request is already being processed. Please wait a moment.',
          status: 429,
          code: 'DUPLICATE_IN_FLIGHT',
          category: 'DUPLICATE_IN_FLIGHT',
          retryAfterSec: 2,
        });
      }
    }

    // 2. Global rate limit check (protects upstream Gemini quota under massive launch spikes)
    const globalCheck = this.checkGlobalWindow(now);
    if (!globalCheck.allowed) {
      this.globalRateLimited += 1;
      throw new CapacityBackpressureError({
        message: 'Omnia is temporarily at global capacity. Please retry shortly.',
        status: 429,
        code: 'GLOBAL_RATE_LIMIT',
        category: 'CAPACITY_QUEUE_FULL',
        retryAfterSec: globalCheck.retryAfterSec,
      });
    }

    // 3. Per-user fairness guard (prevents a single user from exhausting concurrency/queue)
    const userActive = this.activeByUser.get(userKey) || 0;
    const userQueued = this.queuedByUser.get(userKey) || 0;
    if (userActive + userQueued >= this.cfg.maxPerUserInFlight) {
      this.queueRejections += 1;
      throw new CapacityBackpressureError({
        message: 'You already have active requests in progress. Waiting for them to complete before starting another.',
        status: 429,
        code: 'USER_CONCURRENCY_LIMIT',
        category: 'CAPACITY_QUEUE_FULL',
        retryAfterSec: 3,
      });
    }

    const ticketId = `tkt_${now}_${crypto.randomBytes(3).toString('hex')}`;
    if (duplicateKey) {
      this.inFlightSignatures.set(duplicateKey, now);
    }

    // 4. Immediate admission if concurrency slot available
    if (this.activeCount < this.cfg.maxConcurrent) {
      return this.admitImmediate(ticketId, userKey, duplicateKey, 0, false);
    }

    // 5. Bounded queue backpressure (never unlimited queue!)
    if (this.queue.length >= this.cfg.maxQueueSize) {
      if (duplicateKey) this.inFlightSignatures.delete(duplicateKey);
      this.queueRejections += 1;
      throw new CapacityBackpressureError({
        message: 'Omnia is currently handling high demand. Please retry in a few seconds.',
        status: 503,
        code: 'CAPACITY_QUEUE_FULL',
        category: 'CAPACITY_QUEUE_FULL',
        retryAfterSec: 5,
      });
    }

    // 6. Enqueue with strict timeout and fair round-robin dispatch
    this.totalQueued += 1;
    this.queuedByUser.set(userKey, userQueued + 1);

    return new Promise<QueueAcquireResult>((resolve, reject) => {
      const enqueuedAt = Date.now();
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex((w) => w.ticketId === ticketId);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          this.decrementUserMap(this.queuedByUser, userKey);
          if (duplicateKey) this.inFlightSignatures.delete(duplicateKey);
          this.queueTimeouts += 1;
          reject(
            new CapacityBackpressureError({
              message: 'Wait time for capacity exceeded. Please click Retry to try again.',
              status: 503,
              code: 'CAPACITY_QUEUE_TIMEOUT',
              category: 'CAPACITY_QUEUE_TIMEOUT',
              retryAfterSec: 4,
            })
          );
        }
      }, this.cfg.queueTimeoutMs);

      this.queue.push({
        ticketId,
        userKey,
        enqueuedAt,
        timer,
        resolve: (result) => {
          resolve(result);
        },
        reject,
      });

      // Attach duplicateKey cleanup to ticket via closure when dequeued
      (this.queue[this.queue.length - 1] as any).duplicateKey = duplicateKey;
    });
  }

  private admitImmediate(
    ticketId: string,
    userKey: string,
    duplicateKey: string | undefined,
    queueWaitMs: number,
    wasQueued: boolean
  ): QueueAcquireResult {
    this.activeCount += 1;
    this.totalAdmitted += 1;
    this.activeByUser.set(userKey, (this.activeByUser.get(userKey) || 0) + 1);
    if (wasQueued) {
      this.totalQueueWaitMs += queueWaitMs;
    }

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.decrementUserMap(this.activeByUser, userKey);
      if (duplicateKey) {
        this.inFlightSignatures.delete(duplicateKey);
      }
      this.dispatchNextFair();
    };

    return {
      ticketId,
      queueWaitMs,
      wasQueued,
      release,
    };
  }

  /**
   * Fair scheduler: selects the next queued waiter preferring users with the fewest active slots
   * (round-robin tie-break) so no single user can monopolize capacity during a spike.
   */
  private dispatchNextFair(): void {
    if (this.activeCount >= this.cfg.maxConcurrent || this.queue.length === 0) {
      return;
    }

    let bestIndex = 0;
    let bestScore = Infinity;

    for (let i = 0; i < this.queue.length; i++) {
      const idx = (this.lastServedUserIndex + i) % this.queue.length;
      const waiter = this.queue[idx];
      const activeForUser = this.activeByUser.get(waiter.userKey) || 0;
      if (activeForUser < bestScore) {
        bestScore = activeForUser;
        bestIndex = idx;
        if (activeForUser === 0) break;
      }
    }

    const [next] = this.queue.splice(bestIndex, 1);
    if (!next) return;

    this.lastServedUserIndex = bestIndex % Math.max(1, this.queue.length);
    clearTimeout(next.timer);
    this.decrementUserMap(this.queuedByUser, next.userKey);

    const waitMs = Date.now() - next.enqueuedAt;
    const duplicateKey = (next as any).duplicateKey as string | undefined;
    const result = this.admitImmediate(next.ticketId, next.userKey, duplicateKey, waitMs, true);
    next.resolve(result);
  }

  private decrementUserMap(map: Map<string, number>, key: string): void {
    const current = map.get(key) || 0;
    if (current <= 1) {
      map.delete(key);
    } else {
      map.set(key, current - 1);
    }
  }
}

// ============================================================================
// 2. INTELLIGENT RETRY WITH EXPONENTIAL BACKOFF, JITTER & RETRY-AFTER
// ============================================================================

export function extractHttpStatusFromError(err: any): number | undefined {
  if (!err) return undefined;
  if (typeof err.status === 'number') return err.status;
  if (typeof err.statusCode === 'number') return err.statusCode;
  if (typeof err.code === 'number' && err.code >= 400 && err.code < 600) return err.code;
  const msg = String(err.message || err || '');
  if (/\b429\b|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(msg)) return 429;
  if (/\b504\b|DEADLINE_EXCEEDED|timeout|timed out/i.test(msg)) return 504;
  if (/\b503\b|UNAVAILABLE|overloaded|high demand/i.test(msg)) return 503;
  if (/\b502\b|BAD_GATEWAY/i.test(msg)) return 502;
  if (/\b500\b|INTERNAL/i.test(msg)) return 500;
  if (/\b401\b|UNAUTHENTICATED|API_KEY_INVALID/i.test(msg)) return 401;
  if (/\b403\b|PERMISSION_DENIED/i.test(msg)) return 403;
  if (/\b400\b|INVALID_ARGUMENT/i.test(msg)) return 400;
  if (/\b404\b|NOT_FOUND/i.test(msg)) return 404;
  return undefined;
}

export function extractRetryAfterMs(err: any): number | undefined {
  const headerVal =
    err?.headers?.get?.('retry-after') ||
    err?.headers?.['retry-after'] ||
    err?.response?.headers?.['retry-after'] ||
    err?.retryAfter;

  if (typeof headerVal === 'number' && Number.isFinite(headerVal) && headerVal > 0) {
    return headerVal * 1000;
  }
  if (typeof headerVal === 'string' && headerVal.trim()) {
    const secs = Number(headerVal.trim());
    if (Number.isFinite(secs) && secs > 0) {
      return secs * 1000;
    }
    const parsedDate = Date.parse(headerVal);
    if (Number.isFinite(parsedDate)) {
      const diff = parsedDate - Date.now();
      if (diff > 0) return diff;
    }
  }
  return undefined;
}

export function isRetryableProviderError(err: any): {
  retryable: boolean;
  status?: number;
  category: FailureCategory;
} {
  const status = extractHttpStatusFromError(err);
  const msg = String(err?.message || err || '');

  // Never retry invalid requests, auth failures, or permission errors
  if (status === 400 || status === 404 || status === 413 || status === 422) {
    return { retryable: false, status, category: 'INVALID_REQUEST' };
  }
  if (status === 401 || status === 403) {
    return { retryable: false, status, category: 'AUTH_FAILURE' };
  }

  // Transient retryable statuses
  if (status === 429) {
    const isQuota = /RESOURCE_EXHAUSTED|quota/i.test(msg);
    return { retryable: true, status: 429, category: isQuota ? 'PROVIDER_QUOTA' : 'PROVIDER_OVERLOAD' };
  }
  if (status === 504 || /timeout|timed out|DEADLINE_EXCEEDED/i.test(msg)) {
    return { retryable: true, status: status || 504, category: 'REQUEST_TIMEOUT' };
  }
  if (status === 503) {
    return { retryable: true, status: 503, category: 'PROVIDER_OVERLOAD' };
  }
  if (status === 500 || status === 502) {
    return { retryable: true, status, category: 'PROVIDER_5XX' };
  }
  if (/ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|fetch failed|network/i.test(msg)) {
    return { retryable: true, status: undefined, category: 'NETWORK_ERROR' };
  }

  return { retryable: false, status, category: 'UNKNOWN' };
}

export function computeBackoffWithJitterMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  retryAfterMs?: number
): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
  // Equal-to-full randomized jitter (50%–100% of exponential cap) to prevent thundering herds
  const jittered = Math.round(exp * (0.5 + Math.random() * 0.5));
  if (retryAfterMs !== undefined && retryAfterMs > 0) {
    return Math.min(maxDelayMs, Math.max(jittered, retryAfterMs));
  }
  return jittered;
}

export interface IntelligentRetryOptions {
  maxRetries: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  getRemainingBudgetMs: () => number;
  minBudgetForRetryMs?: number;
  failFastOnTimeout?: boolean;
  onRetry?: (info: { attempt: number; delayMs: number; status?: number; category: FailureCategory }) => void;
}

export interface IntelligentRetryOutcome<T> {
  result: T;
  retriesUsed: number;
}

export async function executeWithIntelligentRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: IntelligentRetryOptions
): Promise<IntelligentRetryOutcome<T>> {
  const {
    maxRetries,
    baseDelayMs = 450,
    maxDelayMs = 4500,
    getRemainingBudgetMs,
    minBudgetForRetryMs = 3000,
    failFastOnTimeout = false,
    onRetry,
  } = options;

  let retriesUsed = 0;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation(attempt);
      return { result, retriesUsed };
    } catch (err: any) {
      lastError = err;
      const classification = isRetryableProviderError(err);

      const isTimeoutFailure =
        classification.status === 504 || classification.category === 'REQUEST_TIMEOUT';
      if (!classification.retryable || attempt >= maxRetries || (failFastOnTimeout && isTimeoutFailure)) {
        throw err;
      }

      const retryAfterMs = extractRetryAfterMs(err);
      const delayMs = computeBackoffWithJitterMs(attempt, baseDelayMs, maxDelayMs, retryAfterMs);
      const remaining = getRemainingBudgetMs();

      if (remaining - delayMs < minBudgetForRetryMs) {
        throw err;
      }

      retriesUsed += 1;
      onRetry?.({
        attempt: attempt + 1,
        delayMs,
        status: classification.status,
        category: classification.category,
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

// ============================================================================
// 3. MODEL HEALTH TRACKER (AUTOMATIC COMPATIBLE FALLBACK PROMOTION)
// ============================================================================

interface ModelHealthEntry {
  consecutiveFailures: number;
  degradedUntil: number;
  lastErrorStatus?: number;
}

export class ModelHealthTracker {
  private readonly health = new Map<string, ModelHealthEntry>();
  private readonly cooldownMs: number;

  constructor(cooldownMs = 20_000) {
    this.cooldownMs = cooldownMs;
  }

  public recordSuccess(model: string): void {
    this.health.set(model, {
      consecutiveFailures: 0,
      degradedUntil: 0,
    });
  }

  public recordFailure(model: string, status?: number): void {
    const prev = this.health.get(model) || { consecutiveFailures: 0, degradedUntil: 0 };
    const nextFailures = prev.consecutiveFailures + 1;
    // After 2 consecutive 429/5xx failures, temporarily demote model behind healthy secondary
    const isProviderPressure = status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
    const degradedUntil =
      isProviderPressure && nextFailures >= 2 ? Date.now() + this.cooldownMs : prev.degradedUntil;

    this.health.set(model, {
      consecutiveFailures: nextFailures,
      degradedUntil,
      lastErrorStatus: status,
    });
  }

  public isDegraded(model: string): boolean {
    const entry = this.health.get(model);
    if (!entry) return false;
    return entry.degradedUntil > Date.now();
  }

  /**
   * Orders compatible models so healthy candidates run first while preserving
   * every candidate in the fallback chain (never dropping all models).
   */
  public orderCandidates(preferredOrder: string[]): string[] {
    const healthy: string[] = [];
    const degraded: string[] = [];
    for (const model of preferredOrder) {
      if (this.isDegraded(model)) {
        degraded.push(model);
      } else {
        healthy.push(model);
      }
    }
    return [...healthy, ...degraded];
  }

  public getStatus(): Record<string, { degraded: boolean; consecutiveFailures: number }> {
    const out: Record<string, { degraded: boolean; consecutiveFailures: number }> = {};
    for (const [model, entry] of this.health.entries()) {
      out[model] = {
        degraded: entry.degradedUntil > Date.now(),
        consecutiveFailures: entry.consecutiveFailures,
      };
    }
    return out;
  }
}

// ============================================================================
// 4. SAFE PUBLIC CACHE + IN-FLIGHT REQUEST COALESCING
// ============================================================================

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class SafeTtlCache<T> {
  private store = new Map<string, CacheItem<T>>();
  private inFlight = new Map<string, Promise<T>>();
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;

  public hits = 0;
  public misses = 0;
  public coalescedHits = 0;

  constructor(options?: { maxEntries?: number; defaultTtlMs?: number }) {
    this.maxEntries = options?.maxEntries ?? 250;
    this.defaultTtlMs = options?.defaultTtlMs ?? 5 * 60 * 1000;
  }

  public get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    this.hits += 1;
    // Refresh recency
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  public set(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  /**
   * Executes `loader` once for concurrent identical public requests (request coalescing)
   * and caches the resolved value for `ttlMs`.
   */
  public async getOrCoalesce(
    key: string,
    loader: () => Promise<T>,
    ttlMs?: number
  ): Promise<{ value: T; cacheHit: boolean; coalesced: boolean }> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return { value: cached, cacheHit: true, coalesced: false };
    }

    const existingPromise = this.inFlight.get(key);
    if (existingPromise) {
      this.coalescedHits += 1;
      const value = await existingPromise;
      return { value, cacheHit: false, coalesced: true };
    }

    this.misses += 1;
    const promise = (async () => {
      try {
        const result = await loader();
        this.set(key, result, ttlMs);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    const value = await promise;
    return { value, cacheHit: false, coalesced: false };
  }

  public clear(): void {
    this.store.clear();
  }
}

/**
 * Determines whether a chat query is strictly safe for short-lived public caching:
 * - NO attachments, NO user workspace RAG, NO conversation history, NO temporary/personalized instructions
 * - NO time-sensitive / live / personal words
 */
export function isSafeForPublicResponseCache(params: {
  prompt: string;
  hasAttachments: boolean;
  hasWorkspaceRag: boolean;
  hasHistory: boolean;
  isTemporarySession: boolean;
  hasSessionInstructions: boolean;
  isAuthenticatedUser: boolean;
  mode?: string;
}): boolean {
  if (
    params.hasAttachments ||
    params.hasWorkspaceRag ||
    params.hasHistory ||
    params.isTemporarySession ||
    params.hasSessionInstructions ||
    params.mode === 'create' ||
    params.mode === 'analyze'
  ) {
    return false;
  }

  const lower = params.prompt.toLowerCase();
  // Never cache time-sensitive, live, or personalized queries
  if (
    /\b(today|yesterday|tomorrow|now|current|latest|recent|live|price|weather|news|score|election|stock|2025|2026|2027|my\s+|i\s+am|i'm|mine|me)\b/i.test(
      lower
    )
  ) {
    return false;
  }

  // Only cache concise, stable informational questions
  return params.prompt.trim().length >= 8 && params.prompt.trim().length <= 240;
}

/**
 * Runs a retrieval provider with bounded retries and strict timeout isolation so
 * retrieval errors never crash or corrupt the generation pipeline.
 */
export async function runBoundedRetrieval<T>(
  operation: () => Promise<T> | T,
  options?: { maxRetries?: number; timeoutMs?: number; baseDelayMs?: number }
): Promise<{
  ok: boolean;
  data?: T;
  durationMs: number;
  retriesUsed: number;
  error?: string;
}> {
  const maxRetries = options?.maxRetries ?? 1;
  const timeoutMs = options?.timeoutMs ?? 2500;
  const baseDelayMs = options?.baseDelayMs ?? 120;
  const startedAt = Date.now();
  let retriesUsed = 0;
  let lastErr: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const data = await Promise.race<T>([
        Promise.resolve().then(() => operation()),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error(`Retrieval timed out after ${timeoutMs}ms`)),
            timeoutMs
          );
        }),
      ]);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      return {
        ok: true,
        data,
        durationMs: Date.now() - startedAt,
        retriesUsed,
      };
    } catch (err: any) {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      lastErr = err;
      if (attempt < maxRetries) {
        retriesUsed += 1;
        await new Promise((r) => setTimeout(r, baseDelayMs * (attempt + 1)));
      }
    }
  }

  return {
    ok: false,
    durationMs: Date.now() - startedAt,
    retriesUsed,
    error: String(lastErr?.message || lastErr || 'Retrieval error'),
  };
}

// ============================================================================
// 5. SHARED PRODUCTION INSTANCES FOR /api/chat
// ============================================================================

export const chatTrafficController = new BoundedFairTrafficController();
export const geminiModelHealthTracker = new ModelHealthTracker(20_000);
export const publicBlogRetrievalCache = new SafeTtlCache<any>({
  maxEntries: 300,
  defaultTtlMs: 5 * 60 * 1000, // 5 minutes for published VIZRA articles
});
export const publicChatResponseCache = new SafeTtlCache<{
  text: string;
  sources: any[];
  webSearchQueries: string[];
  retrievalSummary: any;
  model: string;
}>({
  maxEntries: 150,
  defaultTtlMs: 90 * 1000, // 90 seconds for safe public non-time-sensitive queries
});
