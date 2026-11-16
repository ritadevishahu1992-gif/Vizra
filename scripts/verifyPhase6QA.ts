import fs from 'fs';
import path from 'path';
import http from 'http';

interface CheckResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];
const rootDir = process.cwd();

function record(id: string, name: string, passed: boolean, details: string) {
  results.push({ id, name, passed, details });
  const icon = passed ? '✓' : '✗';
  console.log(`  ${icon} [${passed ? 'PASS' : 'FAIL'}] ${id} — ${name}: ${details}`);
}

function httpRequest(
  method: string,
  urlPath: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any; rawBody: string }> {
  return new Promise((resolve, reject) => {
    const payload =
      body === undefined
        ? null
        : typeof body === 'string'
        ? body
        : JSON.stringify(body);
    const reqHeaders: Record<string, string> = { ...headers };
    if (payload && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      `http://127.0.0.1:3000${urlPath}`,
      {
        method,
        headers: reqHeaders,
        timeout: 15000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed: any = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {
            // keep raw text
          }
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: parsed,
            rawBody: raw,
          });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout calling ${method} ${urlPath}`));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function runPhase6QA() {
  console.log('======================================================================');
  console.log('   VIZRA — PHASE 6 COMPLETE QA, BUG FIX & ARCHITECTURE VERIFICATION   ');
  console.log('======================================================================\n');

  // QA-01: Live /api/health & Malformed JSON Error Handler
  const health = await httpRequest('GET', '/api/health');
  record(
    'QA-01',
    'Server Health Check (/api/health)',
    health.status === 200 && health.body?.status === 'ok',
    `HTTP ${health.status}, uptime=${health.body?.uptimeSeconds}s`
  );

  const badJson = await httpRequest('POST', '/api/chat', '{invalid_json_payload', {
    'Content-Type': 'application/json',
  });
  record(
    'QA-02',
    'Malformed JSON Express Error Handler (HTTP 400 INVALID_JSON)',
    badJson.status === 400 && badJson.body?.error?.code === 'INVALID_JSON',
    `HTTP ${badJson.status}, code=${badJson.body?.error?.code}`
  );

  // QA-03..QA-07: Workspace API Token Full Lifecycle + GDPR Cascade Deletion
  const testClientId = `phase6_qa_${Date.now()}`;
  const unauthTokens = await httpRequest('GET', '/api/workspace/tokens');
  record(
    'QA-03',
    'Workspace API Tokens Fail-Closed Without Auth / Client Identity',
    unauthTokens.status === 401 && unauthTokens.body?.error?.code === 'WORKSPACE_AUTH_REQUIRED',
    `HTTP ${unauthTokens.status}, code=${unauthTokens.body?.error?.code}`
  );

  const created1 = await httpRequest(
    'POST',
    '/api/workspace/tokens',
    { label: 'QA Integration Key 1', scope: 'read:telemetry' },
    { 'X-Vizra-Client-Id': testClientId }
  );
  const secret1: string = created1.body?.secret || '';
  const tok1Id: string = created1.body?.token?.id || '';
  const tok1Prefix: string = created1.body?.token?.prefix || '';
  record(
    'QA-04',
    'Workspace API Token Creation Returns One-Time Secret & Prefix Metadata',
    created1.status === 201 &&
      secret1.startsWith('vz_live_') &&
      tok1Id.startsWith('tok_') &&
      tok1Prefix.includes('vz_live_'),
    `HTTP ${created1.status}, id=${tok1Id}, prefix=${tok1Prefix}`
  );

  const listed = await httpRequest(
    'GET',
    '/api/workspace/tokens',
    undefined,
    { 'X-Vizra-Client-Id': testClientId }
  );
  const listedContainsPlaintext = listed.rawBody.includes(secret1);
  const tokenStorePath = path.join(rootDir, 'data', 'workspace_tokens_store.json');
  const tokenStoreRaw = fs.existsSync(tokenStorePath)
    ? fs.readFileSync(tokenStorePath, 'utf-8')
    : '[]';
  const diskContainsPlaintext = secret1.length > 10 && tokenStoreRaw.includes(secret1);
  const diskContainsHash = tok1Id.length > 0 && tokenStoreRaw.includes('tokenHash');
  record(
    'QA-05',
    'Workspace Token At-Rest Hashing & Masked Listing (Never Exposes Plaintext)',
    listed.status === 200 &&
      Array.isArray(listed.body?.tokens) &&
      listed.body.tokens.some((t: any) => t.id === tok1Id && t.prefix === tok1Prefix) &&
      !listedContainsPlaintext &&
      !diskContainsPlaintext &&
      diskContainsHash,
    `listedPlaintext=${listedContainsPlaintext}, diskPlaintext=${diskContainsPlaintext}, diskHasHash=${diskContainsHash}`
  );

  // Use Bearer vz_live_... against /api/credits/usage and verify lastUsedAt updates
  const bearerUsage = await httpRequest(
    'GET',
    '/api/credits/usage',
    undefined,
    { Authorization: `Bearer ${secret1}` }
  );
  const listedAfterUse = await httpRequest(
    'GET',
    '/api/workspace/tokens',
    undefined,
    { 'X-Vizra-Client-Id': testClientId }
  );
  const matchedAfterUse = (listedAfterUse.body?.tokens || []).find((t: any) => t.id === tok1Id);
  record(
    'QA-06',
    'Workspace Bearer vz_live_ Token Authenticates Credits Usage & Updates lastUsedAt',
    bearerUsage.status === 200 &&
      typeof matchedAfterUse?.lastUsedAt === 'number' &&
      matchedAfterUse.lastUsedAt > 0,
    `creditsStatus=${bearerUsage.status}, lastUsedAt=${matchedAfterUse?.lastUsedAt}`
  );

  // Revoke tok1, create tok2, then execute DELETE /api/account/data cascade erasure
  const revoked = await httpRequest(
    'DELETE',
    `/api/workspace/tokens/${tok1Id}`,
    undefined,
    { 'X-Vizra-Client-Id': testClientId }
  );
  const created2 = await httpRequest(
    'POST',
    '/api/workspace/tokens',
    { label: 'QA Integration Key 2', scope: 'write:projects' },
    { 'X-Vizra-Client-Id': testClientId }
  );
  const purged = await httpRequest(
    'DELETE',
    '/api/account/data',
    undefined,
    {
      'X-Vizra-Client-Id': testClientId,
      'X-Forwarded-For': `198.51.100.${(Date.now() % 200) + 10}`,
    }
  );
  const listedAfterPurge = await httpRequest(
    'GET',
    '/api/workspace/tokens',
    undefined,
    { 'X-Vizra-Client-Id': testClientId }
  );
  const diskAfterPurge = fs.existsSync(tokenStorePath)
    ? fs.readFileSync(tokenStorePath, 'utf-8')
    : '[]';
  record(
    'QA-07',
    'Workspace Token Revocation & Cascade Purge via DELETE /api/account/data',
    revoked.status === 200 &&
      created2.status === 201 &&
      purged.status === 200 &&
      Array.isArray(purged.body?.purgedStores) &&
      purged.body.purgedStores.includes('workspace_api_tokens') &&
      Array.isArray(listedAfterPurge.body?.tokens) &&
      listedAfterPurge.body.tokens.length === 0 &&
      !diskAfterPurge.includes(testClientId),
    `revoked=${revoked.status}, purgedStores=${JSON.stringify(purged.body?.purgedStores)}, remaining=${listedAfterPurge.body?.tokens?.length}`
  );

  // QA-08: Vercel Serverless Bridge Under VERCEL=1
  const prevVercel = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    const { getVercelApp } = await import('../server');
    const vercelApp = await getVercelApp();
    const { default: vercelCatchAllHandler } = await import('../api/[...path]');
    record(
      'QA-08',
      'Vercel Serverless API Bridge (/api/[...path].ts & getVercelApp)',
      typeof vercelApp === 'function' && typeof vercelCatchAllHandler === 'function',
      `getVercelApp=${typeof vercelApp}, catchAllHandler=${typeof vercelCatchAllHandler}`
    );
  } finally {
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
  }

  // QA-09: Frontend Data Integrity & Component Regression Checks
  const appTsx = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');
  const aiPage = fs.readFileSync(path.join(rootDir, 'src/pages/AIPage.tsx'), 'utf-8');
  const historyPage = fs.readFileSync(path.join(rootDir, 'src/pages/HistoryPage.tsx'), 'utf-8');
  const firestoreSvc = fs.readFileSync(path.join(rootDir, 'src/services/firestoreService.ts'), 'utf-8');
  const workspacePage = fs.readFileSync(path.join(rootDir, 'src/pages/WorkspaceDashboardPage.tsx'), 'utf-8');

  record(
    'QA-09',
    'ErrorBoundary, Shared Seeds Parity (conv-1..3), Message Edit & Firestore Stage Persistence',
    appTsx.includes('<AppErrorBoundary>') &&
      aiPage.includes('createInitialConversations') &&
      aiPage.includes('handleEditUserMessage') &&
      aiPage.includes('<main ') &&
      historyPage.includes('createInitialConversations') &&
      firestoreSvc.includes('DEFAULT_STAGE_TEMPLATES') &&
      firestoreSvc.includes('stages: sanitizedStages') &&
      workspacePage.includes('/api/workspace/tokens') &&
      workspacePage.includes("sessionStorage.getItem('vizra_admin_key')") &&
      workspacePage.includes('serverMetrics?.metrics?.requests?.total'),
    'AppErrorBoundary wraps routes, AIPage/HistoryPage share conv-1..3 seeds, prompt edit replaces cleanly, Firestore persists stages, Dashboard fixes 401/metrics bugs'
  );

  // QA-10: Accessibility, Escape Handlers & Light/Dark Contrast Hygiene
  const voiceModal = fs.readFileSync(path.join(rootDir, 'src/components/ai/VoiceLiveModal.tsx'), 'utf-8');
  const musicModal = fs.readFileSync(path.join(rootDir, 'src/components/ai/MusicStudioModal.tsx'), 'utf-8');
  const intModal = fs.readFileSync(path.join(rootDir, 'src/components/ai/IntegrationPermissionModal.tsx'), 'utf-8');
  const loginModal = fs.readFileSync(path.join(rootDir, 'src/components/auth/LoginModal.tsx'), 'utf-8');
  const settingsPage = fs.readFileSync(path.join(rootDir, 'src/pages/SettingsPage.tsx'), 'utf-8');
  const seoDiagPage = fs.readFileSync(path.join(rootDir, 'src/pages/SeoDiagnosticPage.tsx'), 'utf-8');

  const escapeOk =
    voiceModal.includes("e.key === 'Escape'") &&
    musicModal.includes("e.key === 'Escape'") &&
    intModal.includes("e.key === 'Escape'") &&
    loginModal.includes("e.key === 'Escape'");
  const ariaOk =
    voiceModal.includes('aria-labelledby="voice-live-title"') &&
    musicModal.includes('aria-labelledby="music-studio-title"') &&
    intModal.includes('aria-labelledby="integration-permission-title"') &&
    settingsPage.includes('htmlFor="settings-language-select"') &&
    seoDiagPage.includes('htmlFor="seo-admin-passkey"');
  const noContrastCollision =
    !historyPage.includes('text-white bg-neutral-900') &&
    !settingsPage.includes('bg-neutral-950/60 border-neutral-800/80') &&
    !seoDiagPage.includes('bg-[#0d0d0d] border-neutral-800 text-white');

  record(
    'QA-10',
    'Modal Escape Handlers, Dialog/Form ARIA Bindings & Theme Contrast Parity',
    escapeOk && ariaOk && noContrastCollision,
    `escapeHandlers=${escapeOk}, ariaLabels=${ariaOk}, themeContrastClean=${noContrastCollision}`
  );

  // QA-11: SEO Consistency & Vite Bundle Chunk Splitting
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const routeMeta = fs.readFileSync(path.join(rootDir, 'src/seo/routeMetadata.ts'), 'utf-8');
  const distAssets = fs.existsSync(path.join(rootDir, 'dist/assets'))
    ? fs.readdirSync(path.join(rootDir, 'dist/assets'))
    : [];
  const hasSplitChunks =
    distAssets.some((f) => f.startsWith('vendor-react-')) &&
    distAssets.some((f) => f.startsWith('vendor-firebase-')) &&
    distAssets.some((f) => f.startsWith('vendor-d3-')) &&
    distAssets.some((f) => f.startsWith('vendor-motion-')) &&
    distAssets.some((f) => f.startsWith('vendor-lucide-')) &&
    distAssets.some((f) => f.startsWith('vendor-genai-'));
  const noPlaceholderLegal =
    !indexHtml.includes('Vizra Technologies Inc.') &&
    !routeMeta.includes("'Vizra Technologies Inc.'");

  record(
    'QA-11',
    'SEO Canonical Entity Consistency & Production Bundle Vendor Splitting',
    noPlaceholderLegal && hasSplitChunks,
    `noPlaceholderLegal=${noPlaceholderLegal}, vendorChunksSplit=${hasSplitChunks}`
  );

  const failed = results.filter((r) => !r.passed);
  console.log('\n======================================================================');
  console.log(`   PHASE 6 QA VERIFICATION SUMMARY: ${results.length - failed.length}/${results.length} PASSED`);
  console.log('======================================================================\n');

  if (failed.length > 0) {
    process.exit(1);
  }
}

runPhase6QA().catch((err) => {
  console.error('Fatal Phase 6 QA failure:', err);
  process.exit(1);
});
