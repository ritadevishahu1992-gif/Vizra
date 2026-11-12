import {
  isPrivateOrReservedIP,
  validateExternalUrlForSSRF,
  SlidingWindowRateLimiter,
  validatePrompt,
  validateAttachments,
} from '../src/server/security';
import {
  recordModelCall,
  getObservabilityMetrics,
} from '../src/server/observability';
import fs from 'fs';
import path from 'path';

export interface SecurityTestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  error?: string;
}

export async function runProductionSecurityEvaluation(): Promise<SecurityTestResult[]> {
  const results: SecurityTestResult[] = [];

  const test = async (suite: string, name: string, fn: () => Promise<boolean> | boolean) => {
    const start = Date.now();
    try {
      const ok = await fn();
      results.push({
        suite,
        name,
        passed: !!ok,
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite,
        name,
        passed: false,
        durationMs: Date.now() - start,
        error: err.message || String(err),
      });
    }
  };

  // ==========================================================================
  // Suite 1: SSRF Defense & IP Filtering
  // ==========================================================================
  await test('10. SSRF Defense', 'Identifies and blocks cloud metadata IP (169.254.169.254)', () => {
    return isPrivateOrReservedIP('169.254.169.254') && isPrivateOrReservedIP('169.254.1.1');
  });

  await test('10. SSRF Defense', 'Identifies and blocks loopback IPs (127.0.0.1, ::1)', () => {
    return isPrivateOrReservedIP('127.0.0.1') && isPrivateOrReservedIP('::1') && isPrivateOrReservedIP('127.100.50.1');
  });

  await test('10. SSRF Defense', 'Identifies and blocks RFC1918 private subnets (10.x, 172.16-31.x, 192.168.x)', () => {
    return (
      isPrivateOrReservedIP('10.0.0.1') &&
      isPrivateOrReservedIP('172.24.0.1') &&
      isPrivateOrReservedIP('192.168.1.1')
    );
  });

  await test('10. SSRF Defense', 'Permits valid public IPv4 addresses', () => {
    return !isPrivateOrReservedIP('8.8.8.8') && !isPrivateOrReservedIP('1.1.1.1');
  });

  await test('10. SSRF Defense', 'Rejects non-HTTP protocols (file://, gopher://, ftp://)', async () => {
    const fileRes = await validateExternalUrlForSSRF('file:///etc/passwd');
    const gopherRes = await validateExternalUrlForSSRF('gopher://evil.com/1');
    const ftpRes = await validateExternalUrlForSSRF('ftp://speedtest.tele2.net');
    return !fileRes.safe && !gopherRes.safe && !ftpRes.safe;
  });

  await test('10. SSRF Defense', 'Rejects localhost and internal domain names', async () => {
    const loc = await validateExternalUrlForSSRF('http://localhost:3000/api');
    const meta = await validateExternalUrlForSSRF('http://metadata.google.internal/computeMetadata/v1');
    return !loc.safe && !meta.safe;
  });

  // ==========================================================================
  // Suite 2: Rate Limiting & Abuse Prevention
  // ==========================================================================
  await test('11. Rate Limiting', 'Sliding window decrements remaining allowance correctly', () => {
    const limiter = new SlidingWindowRateLimiter({ windowMs: 10000, max: 3, name: 'test_dec' });
    const r1 = limiter.check('client_1');
    const r2 = limiter.check('client_1');
    return r1.allowed && r1.remaining === 2 && r2.allowed && r2.remaining === 1;
  });

  await test('11. Rate Limiting', 'Enforces strict HTTP 429 threshold when limit is exceeded', () => {
    const limiter = new SlidingWindowRateLimiter({ windowMs: 10000, max: 2, name: 'test_cap' });
    limiter.check('client_2');
    limiter.check('client_2');
    const blocked = limiter.check('client_2');
    return !blocked.allowed && blocked.remaining === 0;
  });

  // ==========================================================================
  // Suite 3: Input Bounds & Memory Exhaustion Prevention
  // ==========================================================================
  await test('12. Input Protection', 'Rejects empty or whitespace-only prompts', () => {
    const empty = validatePrompt('');
    const ws = validatePrompt('     ');
    const valid = validatePrompt('Hello Omnia');
    return !empty.valid && !ws.valid && valid.valid && valid.cleanText === 'Hello Omnia';
  });

  await test('12. Input Protection', 'Enforces 50,000 character maximum prompt length limit', () => {
    const huge = 'x'.repeat(50001);
    const result = validatePrompt(huge);
    return !result.valid;
  });

  await test('12. Input Protection', 'Rejects requests with more than 5 attachments', () => {
    const excessive = new Array(6).fill({ type: 'image', name: 'img.jpg' });
    const result = validateAttachments(excessive);
    return !result.valid;
  });

  await test('12. Input Protection', 'Rejects attachments with oversized base64 data (> 15MB)', () => {
    const hugeAttachment = [
      {
        type: 'image',
        name: 'huge.jpg',
        previewUrl: 'data:image/jpeg;base64,' + 'A'.repeat(16 * 1024 * 1024),
      },
    ];
    const result = validateAttachments(hugeAttachment);
    return !result.valid;
  });

  // ==========================================================================
  // Suite 4: Observability, Metrics & Cost Estimation
  // ==========================================================================
  await test('13. Observability & Costs', 'Calculates estimated tokens and incremental cost', () => {
    recordModelCall({
      model: 'gemini-3.8-flash',
      success: true,
      inputChars: 4000, // ~1000 tokens
      outputChars: 2000, // ~500 tokens
    });
    const metrics = getObservabilityMetrics();
    return (
      metrics.tokenUsage.estimatedInputTokens >= 1000 &&
      metrics.tokenUsage.estimatedOutputTokens >= 500 &&
      metrics.tokenUsage.estimatedCostUSD >= 0
    );
  });

  await test('13. Observability & Costs', 'Returns structured operational metrics and uptime', () => {
    const metrics = getObservabilityMetrics();
    return (
      typeof metrics.uptimeSeconds === 'number' &&
      metrics.uptimeSeconds >= 0 &&
      typeof metrics.startedAt === 'string'
    );
  });

  // ==========================================================================
  // Suite 5: Deployment Configuration & Production Readiness
  // ==========================================================================
  await test('14. Production Deployment', 'Package.json contains tsx in dependencies and production start script', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf-8'));
    return Boolean(pkg.dependencies?.tsx && pkg.scripts?.start && pkg.scripts?.build);
  });

  await test('14. Production Deployment', 'Vercel configuration contains scheduled cron and client rewrites', () => {
    const vercel = JSON.parse(fs.readFileSync(path.resolve('./vercel.json'), 'utf-8'));
    return (
      Array.isArray(vercel.crons) &&
      vercel.crons.length > 0 &&
      Array.isArray(vercel.rewrites) &&
      vercel.rewrites.length >= 2
    );
  });

  await test('14. Production Deployment', 'Firestore security rules enforce strict user-owner isolation', () => {
    const rules = fs.readFileSync(path.resolve('./firestore.rules'), 'utf-8');
    return (
      rules.includes('function isOwner(userId)') &&
      rules.includes('request.auth.uid == userId') &&
      rules.includes('allow read, write: if false')
    );
  });

  // ==========================================================================
  // Suite 6: Privacy, Legal Pages & Consent Management Lifecycle
  // ==========================================================================
  const {
    processConsentSubmission,
    getStoredConsentById,
    formatConsentRowForSheets,
    exportConsentEventToGoogleSheets,
    CURRENT_CONSENT_VERSION,
    CURRENT_POLICY_VERSION,
  } = await import('../src/server/consent/consentService');

  const testConsentId = `cns_test_${Date.now().toString(36)}`;

  await test('17. Privacy & Consent Lifecycle', '1. Accept All saves all optional categories (Analytics, Functional, Marketing) as enabled', async () => {
    const res = await processConsentSubmission(
      {
        consentId: testConsentId,
        action: 'ACCEPT_ALL',
        source: 'Cookie Banner',
        region: 'US',
      },
      { bypassDedupWindow: true }
    );
    return (
      res.ok &&
      res.record?.necessary === true &&
      res.record?.analytics === true &&
      res.record?.functional === true &&
      res.record?.marketing === true &&
      res.record?.action === 'ACCEPT_ALL'
    );
  });

  await test('17. Privacy & Consent Lifecycle', '2. Reject Optional saves all optional categories as disabled', async () => {
    const res = await processConsentSubmission(
      {
        consentId: testConsentId,
        action: 'REJECT_OPTIONAL',
        analytics: true, // Should be overridden to false
        functional: true,
        marketing: true,
        source: 'Cookie Banner',
      },
      { bypassDedupWindow: true }
    );
    return (
      res.ok &&
      res.record?.necessary === true &&
      res.record?.analytics === false &&
      res.record?.functional === false &&
      res.record?.marketing === false &&
      res.record?.action === 'REJECT_OPTIONAL'
    );
  });

  await test('17. Privacy & Consent Lifecycle', '3. Customize saves only explicitly selected categories', async () => {
    const res = await processConsentSubmission(
      {
        consentId: testConsentId,
        action: 'CUSTOMIZE',
        analytics: true,
        functional: true,
        marketing: false,
        source: 'Settings',
      },
      { bypassDedupWindow: true }
    );
    return (
      res.ok &&
      res.record?.necessary === true &&
      res.record?.analytics === true &&
      res.record?.functional === true &&
      res.record?.marketing === false &&
      res.record?.action === 'CUSTOMIZE'
    );
  });

  await test('17. Privacy & Consent Lifecycle', '4. Withdrawal disables all optional categories and preserves audit history', async () => {
    const res = await processConsentSubmission(
      {
        consentId: testConsentId,
        action: 'WITHDRAW',
        source: 'Cookie Policy Page',
      },
      { bypassDedupWindow: true }
    );
    const stored = getStoredConsentById(testConsentId);
    return (
      res.ok &&
      stored.record?.analytics === false &&
      stored.record?.functional === false &&
      stored.record?.marketing === false &&
      stored.record?.action === 'WITHDRAW' &&
      stored.history.length >= 4
    );
  });

  await test('17. Privacy & Consent Lifecycle', '5. Deduplicates rapid identical consent submissions within 5s window', async () => {
    const dedupId = `cns_dedup_${Date.now().toString(36)}`;
    const first = await processConsentSubmission({
      consentId: dedupId,
      action: 'REJECT_OPTIONAL',
      source: 'Cookie Banner',
    });
    const second = await processConsentSubmission({
      consentId: dedupId,
      action: 'REJECT_OPTIONAL',
      source: 'Cookie Banner',
    });
    return first.ok && !first.isDuplicate && second.ok && Boolean(second.isDuplicate);
  });

  await test('17. Privacy & Consent Lifecycle', '6. Google Sheets 12-column row format & graceful failure fallback', async () => {
    const stored = getStoredConsentById(testConsentId);
    const latestEvent = stored.history[stored.history.length - 1];
    if (!latestEvent) return false;

    const row = formatConsentRowForSheets(latestEvent);
    const prevWebhook = process.env.GOOGLE_SHEETS_CONSENT_WEBHOOK_URL;

    // Test simulated webhook success
    process.env.GOOGLE_SHEETS_CONSENT_WEBHOOK_URL = 'https://script.google.com/macros/s/test/exec';
    const syncOk = await exportConsentEventToGoogleSheets(latestEvent, async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    // Test simulated webhook network failure (must not throw or break consent)
    const syncFailGraceful = await exportConsentEventToGoogleSheets(latestEvent, async () => {
      throw new Error('Simulated Google Sheets network timeout');
    });

    if (prevWebhook === undefined) {
      delete process.env.GOOGLE_SHEETS_CONSENT_WEBHOOK_URL;
    } else {
      process.env.GOOGLE_SHEETS_CONSENT_WEBHOOK_URL = prevWebhook;
    }

    return (
      row.length === 12 &&
      row[2] === CURRENT_CONSENT_VERSION &&
      row[3] === testConsentId &&
      row[5] === true &&
      row[9] === CURRENT_POLICY_VERSION &&
      syncOk === 'synced' &&
      syncFailGraceful === 'failed_gracefully'
    );
  });

  await test('17. Privacy & Consent Lifecycle', '7. Legal routes (/terms-and-conditions, /privacy-policy, /cookie-policy) & Vercel Analytics separation', () => {
    const appCode = fs.readFileSync(path.resolve('./src/App.tsx'), 'utf-8');
    const cookieCode = fs.readFileSync(path.resolve('./src/components/ui/CookieConsent.tsx'), 'utf-8');
    return (
      appCode.includes('path="/terms-and-conditions"') &&
      appCode.includes('path="/privacy-policy"') &&
      appCode.includes('path="/cookie-policy"') &&
      appCode.includes('<Analytics />') &&
      appCode.includes('{allowOptionalAnalytics && <SpeedInsights />}') &&
      cookieCode.includes('useState(false)')
    );
  });

  return results;
}

