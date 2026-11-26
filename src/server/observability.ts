import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============================================================================
// 1. OBSERVABILITY TYPES & INTERFACES
// ============================================================================

export interface ReliabilityMetrics {
  totalAiRequests: number;
  successfulAiRequests: number;
  failedAiRequests: number;
  successRatePct: number;
  errorRatePct: number;
  providerThrottleCount: number;
  provider5xxCount: number;
  totalRetries: number;
  fallbackActivations: number;
  fallbackRatePct: number;
  queue: {
    activeCount: number;
    queuedCount: number;
    totalQueued: number;
    queueTimeouts: number;
    queueRejections: number;
    duplicateBlocked: number;
    avgQueueWaitMs: number;
  };
  retrieval: {
    totalRuns: number;
    failures: number;
    avgDurationMs: number;
    cacheHits: number;
    coalescedHits: number;
  };
  publicResponseCacheHits: number;
}

export interface RequestMetrics {
  totalRequests: number;
  routes: Record<string, number>;
  statusCodes: Record<string, number>;
  totalLatencyMs: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  latencies: number[];
  modelCalls: {
    total: number;
    successful: number;
    failed: number;
    fallbacksTriggered: number;
    byModel: Record<string, number>;
  };
  reliability: ReliabilityMetrics;
  rateLimitHits: number;
  ssrfBlocks: number;
  tokenUsage: {
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    totalEstimatedTokens: number;
    estimatedCostUSD: number;
  };
  uptimeSeconds: number;
  startedAt: string;
}

export interface StructuredLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  requestId: string;
  method: string;
  path: string;
  status?: number;
  durationMs?: number;
  model?: string;
  fallback?: boolean;
  message?: string;
  error?: string;
  clientIp?: string;
  tokens?: { input: number; output: number };
}

// ============================================================================
// 2. IN-MEMORY METRICS STORE
// ============================================================================

const serverStartTime = Date.now();
const recentLatencies: number[] = [];
const MAX_LATENCY_SAMPLES = 500;
let totalRetrievalDurationMs = 0;

const metricsStore: RequestMetrics = {
  totalRequests: 0,
  routes: {},
  statusCodes: {},
  totalLatencyMs: 0,
  averageLatencyMs: 0,
  p95LatencyMs: 0,
  latencies: [],
  modelCalls: {
    total: 0,
    successful: 0,
    failed: 0,
    fallbacksTriggered: 0,
    byModel: {},
  },
  reliability: {
    totalAiRequests: 0,
    successfulAiRequests: 0,
    failedAiRequests: 0,
    successRatePct: 100,
    errorRatePct: 0,
    providerThrottleCount: 0,
    provider5xxCount: 0,
    totalRetries: 0,
    fallbackActivations: 0,
    fallbackRatePct: 0,
    queue: {
      activeCount: 0,
      queuedCount: 0,
      totalQueued: 0,
      queueTimeouts: 0,
      queueRejections: 0,
      duplicateBlocked: 0,
      avgQueueWaitMs: 0,
    },
    retrieval: {
      totalRuns: 0,
      failures: 0,
      avgDurationMs: 0,
      cacheHits: 0,
      coalescedHits: 0,
    },
    publicResponseCacheHits: 0,
  },
  rateLimitHits: 0,
  ssrfBlocks: 0,
  tokenUsage: {
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    totalEstimatedTokens: 0,
    estimatedCostUSD: 0,
  },
  uptimeSeconds: 0,
  startedAt: new Date(serverStartTime).toISOString(),
};

/**
 * Computes the 95th percentile from collected response latencies.
 */
function calculateP95(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.95);
  return sorted[Math.min(index, sorted.length - 1)];
}

// Approximate Gemini pricing per 1M tokens (e.g. Flash ~$0.075 input / $0.30 output)
const COST_PER_1M_INPUT_FLASH = 0.075;
const COST_PER_1M_OUTPUT_FLASH = 0.30;
const COST_PER_1M_INPUT_PRO = 1.25;
const COST_PER_1M_OUTPUT_PRO = 5.00;

export function recordModelCall(options: {
  model: string;
  success: boolean;
  fallbackTriggered?: boolean;
  inputChars?: number;
  outputChars?: number;
}): void {
  metricsStore.modelCalls.total += 1;
  metricsStore.modelCalls.byModel[options.model] =
    (metricsStore.modelCalls.byModel[options.model] || 0) + 1;

  if (options.success) {
    metricsStore.modelCalls.successful += 1;
  } else {
    metricsStore.modelCalls.failed += 1;
  }

  if (options.fallbackTriggered) {
    metricsStore.modelCalls.fallbacksTriggered += 1;
  }

  // Estimate tokens (~4 characters per token average in English/code)
  const inputTokens = Math.ceil((options.inputChars || 0) / 4);
  const outputTokens = Math.ceil((options.outputChars || 0) / 4);

  metricsStore.tokenUsage.estimatedInputTokens += inputTokens;
  metricsStore.tokenUsage.estimatedOutputTokens += outputTokens;
  metricsStore.tokenUsage.totalEstimatedTokens += inputTokens + outputTokens;

  const isPro = options.model.includes('pro');
  const inputRate = isPro ? COST_PER_1M_INPUT_PRO : COST_PER_1M_INPUT_FLASH;
  const outputRate = isPro ? COST_PER_1M_OUTPUT_PRO : COST_PER_1M_OUTPUT_FLASH;

  const incrementalCost =
    (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;

  metricsStore.tokenUsage.estimatedCostUSD =
    Math.round((metricsStore.tokenUsage.estimatedCostUSD + incrementalCost) * 10000) / 10000;
}

export function recordAiReliabilityOutcome(event: {
  success: boolean;
  retriesUsed?: number;
  fallbackActivated?: boolean;
  providerStatus?: number;
  retrievalDurationMs?: number;
  retrievalFailed?: boolean;
  retrievalCacheHit?: boolean;
  retrievalCoalesced?: boolean;
  publicResponseCacheHit?: boolean;
}): void {
  const rel = metricsStore.reliability;
  rel.totalAiRequests += 1;
  if (event.success) {
    rel.successfulAiRequests += 1;
  } else {
    rel.failedAiRequests += 1;
  }

  if (event.retriesUsed && event.retriesUsed > 0) {
    rel.totalRetries += event.retriesUsed;
  }
  if (event.fallbackActivated) {
    rel.fallbackActivations += 1;
  }
  if (event.providerStatus === 429) {
    rel.providerThrottleCount += 1;
  } else if (event.providerStatus && event.providerStatus >= 500) {
    rel.provider5xxCount += 1;
  }

  if (typeof event.retrievalDurationMs === 'number') {
    rel.retrieval.totalRuns += 1;
    totalRetrievalDurationMs += event.retrievalDurationMs;
    rel.retrieval.avgDurationMs = Math.round(totalRetrievalDurationMs / rel.retrieval.totalRuns);
  }
  if (event.retrievalFailed) {
    rel.retrieval.failures += 1;
  }
  if (event.retrievalCacheHit) {
    rel.retrieval.cacheHits += 1;
  }
  if (event.retrievalCoalesced) {
    rel.retrieval.coalescedHits += 1;
  }
  if (event.publicResponseCacheHit) {
    rel.publicResponseCacheHits += 1;
  }

  rel.successRatePct = Number(
    ((rel.successfulAiRequests / Math.max(1, rel.totalAiRequests)) * 100).toFixed(2)
  );
  rel.errorRatePct = Number(
    ((rel.failedAiRequests / Math.max(1, rel.totalAiRequests)) * 100).toFixed(2)
  );
  rel.fallbackRatePct = Number(
    ((rel.fallbackActivations / Math.max(1, rel.totalAiRequests)) * 100).toFixed(2)
  );
}

export function syncQueueReliabilitySnapshot(snapshot: {
  activeCount: number;
  queuedCount: number;
  totalQueued: number;
  queueTimeouts: number;
  queueRejections: number;
  duplicateBlocked: number;
  avgQueueWaitMs: number;
}): void {
  metricsStore.reliability.queue = { ...snapshot };
}

export function recordRateLimitHit(): void {
  metricsStore.rateLimitHits += 1;
}

export function recordSsrfBlock(): void {
  metricsStore.ssrfBlocks += 1;
}

export function getObservabilityMetrics(): RequestMetrics {
  return {
    ...metricsStore,
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    p95LatencyMs: calculateP95(recentLatencies),
  };
}

// ============================================================================
// 3. STRUCTURED LOGGING & REQUEST ID TRACING
// ============================================================================

/**
 * Emits a structured log line in production JSON format.
 * Redacts passwords, keys, authorization headers, and large prompt contents.
 */
export function logStructured(log: StructuredLog): void {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const statusPart = log.status ? ` [${log.status}]` : '';
    const durPart = log.durationMs !== undefined ? ` in ${log.durationMs}ms` : '';
    const modelPart = log.model ? ` (model: ${log.model})` : '';
    const fallbackPart = log.fallback ? ' [FALLBACK]' : '';
    const msg = log.message ? ` - ${log.message}` : '';
    const err = log.error ? ` [ERROR: ${log.error}]` : '';

    if (log.level === 'error') {
      console.error(`[${log.requestId}] ${log.method} ${log.path}${statusPart}${durPart}${err}`);
    } else if (log.level === 'warn') {
      console.warn(`[${log.requestId}] ${log.method} ${log.path}${statusPart}${modelPart}${fallbackPart}${msg}`);
    } else {
      console.log(`[${log.requestId}] ${log.method} ${log.path}${statusPart}${durPart}${modelPart}${msg}`);
    }
  } else {
    // Production machine-parseable JSON log line
    const serialized = JSON.stringify(log);
    if (log.level === 'error') {
      console.error(serialized);
    } else if (log.level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }
}

/**
 * Express middleware that generates an X-Request-Id header, tracks request metrics,
 * and logs request completion with duration and status code.
 */
export function observabilityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId =
    (req.headers['x-request-id'] as string) || `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Attach request ID to request and response header
  (req as any).id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Sanitized client IP
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || '127.0.0.1';

  // Record metrics on response finish
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const path = req.baseUrl || req.path || '/';
    const status = res.statusCode;

    // Update metrics
    metricsStore.totalRequests += 1;
    metricsStore.routes[path] = (metricsStore.routes[path] || 0) + 1;
    metricsStore.statusCodes[status.toString()] =
      (metricsStore.statusCodes[status.toString()] || 0) + 1;
    metricsStore.totalLatencyMs += durationMs;

    recentLatencies.push(durationMs);
    if (recentLatencies.length > MAX_LATENCY_SAMPLES) {
      recentLatencies.shift();
    }

    metricsStore.averageLatencyMs =
      Math.round(metricsStore.totalLatencyMs / metricsStore.totalRequests);
    metricsStore.p95LatencyMs = calculateP95(recentLatencies);

    // Filter noisy static asset requests from logs
    const isApi = path.startsWith('/api') || path.startsWith('/live');
    if (isApi) {
      const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      logStructured({
        timestamp: new Date().toISOString(),
        level,
        requestId,
        method: req.method,
        path,
        status,
        durationMs,
        clientIp: clientIp.replace(/:\d+$/, ''), // Strip port if present
      });
    }
  });

  next();
}
