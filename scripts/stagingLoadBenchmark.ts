/**
 * VIZRA AI Creative Studio — Controlled Local/Staging Load Benchmark
 *
 * SAFETY GUARDRAILS:
 * - Strictly targets local/staging server (http://127.0.0.1:3000). Refuses production URLs.
 * - Uses ONLY lightweight read-only / non-AI local endpoints (/api/health, /api/omnia/status, /)
 *   so external Gemini and Firebase quotas are NEVER stressed or incurred.
 * - Gradual concurrency ramp (10 -> 25 -> 50 concurrent workers) with strict automatic abort
 *   if error rate > 5% or p95 latency > 2000ms.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

if (BASE_URL.includes('vizra.vercel.app')) {
  console.error('ABORTED: Load benchmarks MUST NEVER target production https://vizra.vercel.app/.');
  process.exit(1);
}

interface StageResult {
  stageName: string;
  concurrency: number;
  totalRequests: number;
  succeeded: number;
  rateLimited429: number;
  errors: number;
  durationSec: number;
  rps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  aborted: boolean;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Number(sorted[idx].toFixed(1));
}

async function runStage(
  stageName: string,
  path: string,
  concurrency: number,
  requestsPerWorker: number
): Promise<StageResult> {
  const latencies: number[] = [];
  let succeeded = 0;
  let rateLimited429 = 0;
  let errors = 0;

  const startWall = performance.now();

  const worker = async () => {
    for (let i = 0; i < requestsPerWorker; i++) {
      const t0 = performance.now();
      try {
        const res = await fetch(`${BASE_URL}${path}`, {
          signal: AbortSignal.timeout(5000),
        });
        await res.arrayBuffer(); // Drain body for accurate connection reuse
        const elapsed = performance.now() - t0;
        latencies.push(elapsed);
        if (res.status >= 200 && res.status < 300) {
          succeeded += 1;
        } else if (res.status === 429) {
          rateLimited429 += 1;
        } else {
          errors += 1;
        }
      } catch {
        latencies.push(performance.now() - t0);
        errors += 1;
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const durationSec = (performance.now() - startWall) / 1000;
  const sorted = [...latencies].sort((a, b) => a - b);
  const totalRequests = succeeded + rateLimited429 + errors;
  const p50Ms = percentile(sorted, 50);
  const p95Ms = percentile(sorted, 95);
  const p99Ms = percentile(sorted, 99);
  const maxMs = sorted.length ? Number(sorted[sorted.length - 1].toFixed(1)) : 0;
  const rps = Number((totalRequests / Math.max(durationSec, 0.001)).toFixed(1));
  const errorRatePct = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
  const aborted = errorRatePct > 5 || p95Ms > 2000;

  return {
    stageName,
    concurrency,
    totalRequests,
    succeeded,
    rateLimited429,
    errors,
    durationSec: Number(durationSec.toFixed(2)),
    rps,
    p50Ms,
    p95Ms,
    p99Ms,
    maxMs,
    aborted,
  };
}

async function main() {
  console.log(`\n=== VIZRA Controlled Local Staging Benchmark (Target: ${BASE_URL}) ===`);
  console.log('Scope: Non-AI local Express routes only (zero Gemini/Firebase quota consumption).\n');

  const stages: Array<[string, string, number, number]> = [
    ['Stage 1 — Baseline Health (c=10)', '/api/health', 10, 15],
    ['Stage 2 — Moderate Concurrency Health (c=25)', '/api/health', 25, 12],
    ['Stage 3 — Peak Local Concurrency Health (c=50)', '/api/health', 50, 10],
    ['Stage 4 — Omnia Status JSON Read (c=20)', '/api/omnia/status', 20, 10],
  ];

  const allResults: StageResult[] = [];
  for (const [name, route, c, n] of stages) {
    const res = await runStage(name, route, c, n);
    allResults.push(res);
    console.log(
      `${res.stageName}: total=${res.totalRequests}, ok=${res.succeeded}, 429=${res.rateLimited429}, err=${res.errors} | ` +
        `RPS=${res.rps} | p50=${res.p50Ms}ms, p95=${res.p95Ms}ms, p99=${res.p99Ms}ms, max=${res.maxMs}ms`
    );
    if (res.aborted) {
      console.warn(`STOP CONDITION TRIGGERED on ${res.stageName} (errors=${res.errors}, p95=${res.p95Ms}ms). Halting ramp.`);
      break;
    }
  }

  console.log('\nBenchmark complete. Note: Results reflect single-node local dev runtime, NOT Vercel Serverless production limits.\n');
}

main().catch((err) => {
  console.error('Staging benchmark failed:', err);
  process.exit(1);
});
