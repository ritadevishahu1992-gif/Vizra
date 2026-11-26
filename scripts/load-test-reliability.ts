import http from 'http';
import { createExpressApp } from '../server';
import {
  publicChatResponseCache,
  publicBlogRetrievalCache,
  chatTrafficController,
} from '../src/server/reliability/trafficController';

type FaultMode =
  | 'healthy'
  | 'transient_429_once'
  | 'primary_model_down'
  | 'total_outage'
  | 'slow_provider';

let activeFaultMode: FaultMode = 'healthy';
let currentConcurrentAiCalls = 0;
let peakConcurrentAiCalls = 0;
let totalAiCalls = 0;
const attemptCounterByPrompt = new Map<string, number>();

function createSimulatedGeminiClient() {
  return {
    models: {
      generateContent: async (params: { model: string; contents: any; config?: any }) => {
        totalAiCalls += 1;
        currentConcurrentAiCalls += 1;
        if (currentConcurrentAiCalls > peakConcurrentAiCalls) {
          peakConcurrentAiCalls = currentConcurrentAiCalls;
        }
        try {
          const promptKey = JSON.stringify(params.contents).slice(-80);
          const count = (attemptCounterByPrompt.get(promptKey) || 0) + 1;
          attemptCounterByPrompt.set(promptKey, count);

          if (activeFaultMode === 'slow_provider') {
            await new Promise((r) => setTimeout(r, 140));
          } else {
            await new Promise((r) => setTimeout(r, 35));
          }

          if (activeFaultMode === 'transient_429_once' && count === 1) {
            const err: any = new Error('429 RESOURCE_EXHAUSTED: Upstream rate limit');
            err.status = 429;
            err.headers = { 'retry-after': '1' };
            throw err;
          }

          if (activeFaultMode === 'primary_model_down' && params.model === 'gemini-3.1-flash-lite') {
            const err: any = new Error('503 UNAVAILABLE: Primary model temporarily overloaded');
            err.status = 503;
            throw err;
          }

          if (activeFaultMode === 'total_outage') {
            const err: any = new Error('503 UNAVAILABLE: Provider capacity exhausted');
            err.status = 503;
            throw err;
          }

          return {
            text: `Verified response from ${params.model} (attempt #${count}).`,
            candidates: [
              {
                finishReason: 'STOP',
                content: {
                  parts: [{ text: `Verified response from ${params.model} (attempt #${count}).` }],
                },
              },
            ],
          };
        } finally {
          currentConcurrentAiCalls -= 1;
        }
      },
      embedContent: async () => ({
        embeddings: [{ values: [0.12, 0.34, 0.56, 0.78] }],
      }),
    },
  } as any;
}

async function postJson(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  const started = Date.now();
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return {
    status: res.status,
    headers: res.headers,
    data,
    latencyMs: Date.now() - started,
  };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

async function main() {
  // Raise express per-IP rate limit via distinct forwarded IPs in simulation so we test true multi-user launch traffic
  const mockAi = createSimulatedGeminiClient();
  const { app } = await createExpressApp({
    attachFrontendMiddleware: false,
    aiClientOverride: mockAi,
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const results: Array<{ name: string; pass: boolean; details: string }> = [];
  const assert = (name: string, cond: boolean, details: string) => {
    results.push({ name, pass: cond, details });
    console.log(`${cond ? 'PASS' : 'FAIL'} | ${name} — ${details}`);
  };

  try {
    // ------------------------------------------------------------------
    // SCENARIO 1: Steady Multi-User Load across /api/chat, /api/blog/agent, /api/research
    // ------------------------------------------------------------------
    activeFaultMode = 'healthy';
    peakConcurrentAiCalls = 0;
    const steadyPromises = Array.from({ length: 12 }, (_, idx) => {
      const ip = `203.0.113.${idx + 1}`;
      const clientId = `user_steady_${idx + 1}`;
      if (idx % 3 === 0) {
        return postJson(
          baseUrl,
          '/api/chat',
          { prompt: `Explain steady load test concept number ${idx + 1} in animation.` },
          { 'X-Forwarded-For': ip, 'X-Vizra-Client-Id': clientId }
        );
      } else if (idx % 3 === 1) {
        return postJson(
          baseUrl,
          '/api/blog/agent',
          { question: `Summarize VIZRA blog guidance number ${idx + 1}.` },
          { 'X-Forwarded-For': ip, 'X-Vizra-Client-Id': clientId }
        );
      } else {
        return postJson(
          baseUrl,
          '/api/research',
          { query: `Research latest GPU shader pipeline milestone ${idx + 1}` },
          { 'X-Forwarded-For': ip, 'X-Vizra-Client-Id': clientId }
        );
      }
    });
    const steadyRes = await Promise.all(steadyPromises);
    const steadyOk = steadyRes.filter((r) => r.status === 200).length;
    const steadyLatencies = steadyRes.map((r) => r.latencyMs);
    const maxAllowedConc = chatTrafficController.getSnapshot().maxConcurrent;
    assert(
      '1. Steady Multi-User Concurrency (12 users across 3 AI routes)',
      steadyOk === 12 && peakConcurrentAiCalls <= maxAllowedConc,
      `${steadyOk}/12 succeeded | peakConcurrent=${peakConcurrentAiCalls}/${maxAllowedConc} | avg=${Math.round(
        steadyLatencies.reduce((a, b) => a + b, 0) / steadyLatencies.length
      )}ms | p95=${percentile(steadyLatencies, 0.95)}ms`
    );

    // ------------------------------------------------------------------
    // SCENARIO 2: Launch-Day Spike & Bounded Queue Backpressure (35 simultaneous users)
    // ------------------------------------------------------------------
    activeFaultMode = 'slow_provider';
    peakConcurrentAiCalls = 0;
    const spikePromises = Array.from({ length: 35 }, (_, idx) =>
      postJson(
        baseUrl,
        '/api/chat',
        { prompt: `Unique launch-day spike question #${idx + 1} about render graphs.` },
        { 'X-Forwarded-For': `198.51.100.${idx + 1}`, 'X-Vizra-Client-Id': `spike_u_${idx + 1}` }
      )
    );
    const spikeRes = await Promise.all(spikePromises);
    const spike200 = spikeRes.filter((r) => r.status === 200).length;
    const spikeBackpressure = spikeRes.filter(
      (r) => (r.status === 503 || r.status === 429) && Boolean(r.headers.get('retry-after'))
    ).length;
    const spikeOtherErr = spikeRes.filter((r) => r.status !== 200 && r.status !== 503 && r.status !== 429).length;
    assert(
      '2. Launch-Day Spike & Backpressure (35 simultaneous requests)',
      spike200 >= 25 && spikeBackpressure >= 1 && spikeOtherErr === 0 && peakConcurrentAiCalls <= maxAllowedConc,
      `200 OK=${spike200}, controlled backpressure(503/429 + Retry-After)=${spikeBackpressure}, unexpected=${spikeOtherErr}, peakConcurrent=${peakConcurrentAiCalls}/${maxAllowedConc}`
    );

    // ------------------------------------------------------------------
    // SCENARIO 3: Duplicate Submission & Per-User Fairness Guard
    // ------------------------------------------------------------------
    activeFaultMode = 'slow_provider';
    const dupPromises = [1, 2, 3].map(() =>
      postJson(
        baseUrl,
        '/api/chat',
        { prompt: 'Duplicate submission guard verification prompt for single user.' },
        { 'X-Forwarded-For': '192.0.2.50', 'X-Vizra-Client-Id': 'same_user_dup' }
      )
    );
    const dupRes = await Promise.all(dupPromises);
    const dup200 = dupRes.filter((r) => r.status === 200).length;
    const dup429 = dupRes.filter(
      (r) => r.status === 429 && r.data?.error?.code === 'DUPLICATE_IN_FLIGHT' && Boolean(r.headers.get('retry-after'))
    ).length;
    assert(
      '3. Duplicate In-Flight Submission Guard',
      dup200 === 1 && dup429 === 2,
      `admitted=${dup200}, blocked_as_DUPLICATE_IN_FLIGHT=${dup429}`
    );

    // ------------------------------------------------------------------
    // SCENARIO 4: Intelligent Retry with Backoff + Jitter + Retry-After (429 recovery)
    // ------------------------------------------------------------------
    activeFaultMode = 'transient_429_once';
    attemptCounterByPrompt.clear();
    const retryRes = await postJson(
      baseUrl,
      '/api/chat',
      { prompt: 'Test automatic recovery after transient 429 provider throttle.' },
      { 'X-Forwarded-For': '192.0.2.61', 'X-Vizra-Client-Id': 'retry_user_1' }
    );
    assert(
      '4. Intelligent Retry on HTTP 429 + Retry-After',
      retryRes.status === 200 && retryRes.data?.reliability?.retriesUsed >= 1 && retryRes.data?.reliability?.recovered === true,
      `status=${retryRes.status}, retriesUsed=${retryRes.data?.reliability?.retriesUsed}, latency=${retryRes.latencyMs}ms, model=${retryRes.data?.reliability?.model}`
    );

    // ------------------------------------------------------------------
    // SCENARIO 5: Automatic Compatible Model Fallback (gemini-3.1-flash-lite -> gemini-4-hydrogen)
    // ------------------------------------------------------------------
    activeFaultMode = 'primary_model_down';
    attemptCounterByPrompt.clear();
    const fbRes = await postJson(
      baseUrl,
      '/api/chat',
      { prompt: 'Verify seamless secondary Gemini model fallback when primary returns 503.' },
      { 'X-Forwarded-For': '192.0.2.62', 'X-Vizra-Client-Id': 'fallback_user_1' }
    );
    assert(
      '5. Automatic Compatible Model Fallback (Primary 503 -> Secondary)',
      fbRes.status === 200 &&
        fbRes.data?.reliability?.model === 'gemini-4-hydrogen' &&
        fbRes.data?.reliability?.fallbackActivated === true,
      `status=${fbRes.status}, model=${fbRes.data?.reliability?.model}, fallbackActivated=${fbRes.data?.reliability?.fallbackActivated}, latency=${fbRes.latencyMs}ms`
    );

    // ------------------------------------------------------------------
    // SCENARIO 6: Total Provider Outage -> Graceful Unavailability, ZERO Fabricated Answers
    // ------------------------------------------------------------------
    activeFaultMode = 'total_outage';
    attemptCounterByPrompt.clear();
    const [outageChat, outageBlog, outageResearch] = await Promise.all([
      postJson(
        baseUrl,
        '/api/chat',
        { prompt: 'What does the VIZRA blog say about lighting?' },
        { 'X-Forwarded-For': '192.0.2.71', 'X-Vizra-Client-Id': 'outage_u1' }
      ),
      postJson(
        baseUrl,
        '/api/blog/agent',
        { question: 'Explain color grading pipelines.' },
        { 'X-Forwarded-For': '192.0.2.72', 'X-Vizra-Client-Id': 'outage_u2' }
      ),
      postJson(
        baseUrl,
        '/api/research',
        { query: 'Compare WebGPU vs Vulkan compute performance' },
        { 'X-Forwarded-For': '192.0.2.73', 'X-Vizra-Client-Id': 'outage_u3' }
      ),
    ]);
    assert(
      '6. Total Outage Graceful Degradation (Zero Fabricated Answers across all 3 AI routes)',
      outageChat.status === 503 &&
        outageBlog.status === 503 &&
        outageResearch.status === 503 &&
        Boolean(outageChat.headers.get('retry-after')) &&
        Boolean(outageBlog.headers.get('retry-after')) &&
        Boolean(outageResearch.headers.get('retry-after')) &&
        !outageChat.data?.text &&
        !outageResearch.data?.text,
      `chat=${outageChat.status}(partialSources=${outageChat.data?.partialSources?.length || 0}), blog=${outageBlog.status}, research=${outageResearch.status}`
    );

    // ------------------------------------------------------------------
    // SCENARIO 7: Non-Retryable 400 Invalid Input Fails Fast (0 AI Calls)
    // ------------------------------------------------------------------
    activeFaultMode = 'healthy';
    const callsBeforeInvalid = totalAiCalls;
    const badRes = await postJson(
      baseUrl,
      '/api/chat',
      { prompt: '   ' },
      { 'X-Forwarded-For': '192.0.2.80', 'X-Vizra-Client-Id': 'invalid_u1' }
    );
    assert(
      '7. Invalid Input Rejected Fast Without Retrying or Calling Gemini',
      badRes.status === 400 && totalAiCalls === callsBeforeInvalid,
      `status=${badRes.status}, aiCallsAdded=${totalAiCalls - callsBeforeInvalid}, latency=${badRes.latencyMs}ms`
    );

    // ------------------------------------------------------------------
    // SCENARIO 8: Safe Public Caching vs Time-Sensitive Bypass
    // ------------------------------------------------------------------
    publicChatResponseCache.clear();
    publicBlogRetrievalCache.clear();
    const cacheQ = 'Explain what PBR metallic roughness textures represent in 3D rendering.';
    const firstCache = await postJson(
      baseUrl,
      '/api/chat',
      { prompt: cacheQ },
      { 'X-Forwarded-For': '192.0.2.91', 'X-Vizra-Client-Id': 'cache_u1' }
    );
    const secondCache = await postJson(
      baseUrl,
      '/api/chat',
      { prompt: cacheQ },
      { 'X-Forwarded-For': '192.0.2.92', 'X-Vizra-Client-Id': 'cache_u2' }
    );
    const liveQ = 'What is the latest stock price of Nvidia today?';
    const firstLive = await postJson(
      baseUrl,
      '/api/chat',
      { prompt: liveQ },
      { 'X-Forwarded-For': '192.0.2.93', 'X-Vizra-Client-Id': 'cache_u3' }
    );
    const secondLive = await postJson(
      baseUrl,
      '/api/chat',
      { prompt: liveQ },
      { 'X-Forwarded-For': '192.0.2.94', 'X-Vizra-Client-Id': 'cache_u4' }
    );
    assert(
      '8. Safe Public Response Cache (Static HIT, Time-Sensitive MISS)',
      firstCache.headers.get('x-vizra-cache') === 'MISS' &&
        secondCache.headers.get('x-vizra-cache') === 'HIT' &&
        firstLive.headers.get('x-vizra-cache') === 'MISS' &&
        secondLive.headers.get('x-vizra-cache') === 'MISS',
      `static: ${firstCache.headers.get('x-vizra-cache')}(${firstCache.latencyMs}ms) -> ${secondCache.headers.get(
        'x-vizra-cache'
      )}(${secondCache.latencyMs}ms) | live: ${firstLive.headers.get('x-vizra-cache')} -> ${secondLive.headers.get(
        'x-vizra-cache'
      )}`
    );

    // ------------------------------------------------------------------
    // SCENARIO 9: /api/health Operational Telemetry Check
    // ------------------------------------------------------------------
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson: any = await healthRes.json();
    assert(
      '9. /api/health Exposes Non-Sensitive Reliability Telemetry',
      healthRes.status === 200 &&
        healthJson.status === 'ok' &&
        typeof healthJson.reliability?.activeAiRequests === 'number' &&
        typeof healthJson.reliability?.maxConcurrentAiRequests === 'number' &&
        healthJson.reliability?.activeAiRequests === 0 &&
        !JSON.stringify(healthJson).includes('AIza'),
      `active=${healthJson.reliability?.activeAiRequests}/${healthJson.reliability?.maxConcurrentAiRequests}, cacheHits=${healthJson.reliability?.publicResponseCacheHits}`
    );

    const passed = results.filter((r) => r.pass).length;
    console.log(`\n=== SUMMARY: ${passed}/${results.length} SCENARIOS PASSED ===`);
    if (passed !== results.length) {
      process.exitCode = 1;
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

main().catch((err) => {
  console.error('Load test crashed:', err);
  process.exit(1);
});
