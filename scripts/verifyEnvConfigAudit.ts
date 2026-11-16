import assert from 'assert';
import fs from 'fs';
import http from 'http';
import path from 'path';
import {
  isRealEnvValue,
  getPort,
  getNodeEnv,
  getAppUrl,
  getGeminiApiKey,
  getFirebaseProjectId,
  getConfiguredAdminKey,
  getAdminAllowlistEmails,
  getCronSecret,
  getSessionHashSecret,
  getIntegrationVaultSecret,
  getEmailConfig,
  getGoogleSheetsConsentConfig,
  getOAuthCredentialsForEnv,
  getParentalConsentConfig,
  getCisionConfig,
  getSystemConfigurationSnapshot,
} from '../src/server/config/envConfig';

interface CheckResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];

function record(id: string, name: string, passed: boolean, details: string) {
  results.push({ id, name, passed, details });
  const icon = passed ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${id}: ${name} — ${details}`);
}

function httpRequest(
  reqPath: string,
  method: 'GET' | 'POST' = 'GET',
  headers: Record<string, string> = {},
  body?: unknown
): Promise<{ status: number; body: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: reqPath,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload).toString() } : {}),
          ...headers,
        },
        timeout: 8000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode || 0,
              body: JSON.parse(data),
              raw: data,
            });
          } catch {
            resolve({ status: res.statusCode || 0, body: data, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout calling ${reqPath}`));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('VIZRA — ENVIRONMENT VARIABLE AUDIT & CONFIGURATION OPTIMIZATION SUITE');
  console.log('========================================================================\n');

  const trackedKeys = [
    'GEMINI_API_KEY',
    'APP_URL',
    'PORT',
    'NODE_ENV',
    'ADMIN_API_KEY',
    'WORKFLOW_SECRET',
    'ADMIN_ALLOWLIST_EMAILS',
    'VIZRA_ADMIN_NOTIFICATION_EMAIL',
    'VIZRA_ADMIN_NOTIFY_EMAIL',
    'CRON_SECRET',
    'RESEND_API_KEY',
    'SESSION_HASH_SECRET',
    'INTEGRATION_TOKEN_SECRET',
    'OAUTH_GOOGLE_CLIENT_ID',
    'OAUTH_GOOGLE_CLIENT_SECRET',
    'PARENTAL_CONSENT_PROVIDER',
    'PARENTAL_CONSENT_API_KEY',
    'PARENTAL_CONSENT_WEBHOOK_SECRET',
    'FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_PROJECT_ID',
    'CISION_API_KEY',
    'CISION_CLIENT_SECRET',
  ];

  const backupEnv: Record<string, string | undefined> = {};
  for (const k of trackedKeys) {
    backupEnv[k] = process.env[k];
  }

  try {
    // 1. Placeholder Rejection Rules
    const placeholderSamples = [
      '',
      '   ',
      'MY_GEMINI_API_KEY',
      'MY_APP_URL',
      'your_vercel_cron_secret',
      'your_admin_api_key',
      'your_workflow_secret',
      're_placeholder_key',
      'your_google_sheets_webhook_url',
      'your_custom_secret',
      'placeholder',
      'changeme',
    ];
    const allPlaceholdersRejected = placeholderSamples.every((s) => !isRealEnvValue(s));
    record(
      'ENV-01',
      'Template placeholder values rejected by isRealEnvValue()',
      allPlaceholdersRejected,
      `${placeholderSamples.length}/${placeholderSamples.length} placeholder samples rejected`
    );

    // 2. Admin API Key Placeholder Bypass Prevention + Safe Fallback
    process.env.ADMIN_API_KEY = 'your_admin_api_key';
    process.env.WORKFLOW_SECRET = 'your_workflow_secret';
    const rejectedPlaceholders = getConfiguredAdminKey();

    process.env.WORKFLOW_SECRET = 'real_workflow_secret_987654';
    const safeAliasFallback = getConfiguredAdminKey();

    process.env.ADMIN_API_KEY = 'real_primary_admin_key_123456';
    const primaryPreferred = getConfiguredAdminKey();

    const adminLogicValid =
      rejectedPlaceholders.key === null &&
      safeAliasFallback.key === 'real_workflow_secret_987654' &&
      safeAliasFallback.usedDeprecatedAlias === true &&
      primaryPreferred.key === 'real_primary_admin_key_123456' &&
      primaryPreferred.usedDeprecatedAlias === false;

    record(
      'ENV-02',
      'Admin key resolver rejects placeholder trap and preserves safe alias fallback',
      adminLogicValid,
      `placeholderKey=${String(rejectedPlaceholders.key)}, aliasFallbackUsed=${safeAliasFallback.usedDeprecatedAlias}, primaryPreferred=${primaryPreferred.source}`
    );

    // 3. Cron Secret & Gemini Key Validation
    process.env.CRON_SECRET = 'your_vercel_cron_secret';
    const badCron = getCronSecret();
    process.env.CRON_SECRET = 'short';
    const shortCron = getCronSecret();
    process.env.CRON_SECRET = 'cron_prod_secret_9911';
    const goodCron = getCronSecret();

    process.env.GEMINI_API_KEY = 'MY_GEMINI_API_KEY';
    const badGemini = getGeminiApiKey();

    record(
      'ENV-03',
      'CRON_SECRET and GEMINI_API_KEY reject placeholders and undersized secrets',
      badCron === null && shortCron === null && goodCron === 'cron_prod_secret_9911' && badGemini === null,
      `badCron=${String(badCron)}, shortCron=${String(shortCron)}, goodCronLoaded=${Boolean(goodCron)}, badGemini=${String(badGemini)}`
    );

    // 4. Google 1P OAuth Requires BOTH Client ID and Client Secret
    process.env.OAUTH_GOOGLE_CLIENT_ID = 'google-client-id-only';
    delete process.env.OAUTH_GOOGLE_CLIENT_SECRET;
    const partialGoogle = getOAuthCredentialsForEnv('OAUTH_GOOGLE_CLIENT_ID', 'OAUTH_GOOGLE_CLIENT_SECRET');
    process.env.OAUTH_GOOGLE_CLIENT_SECRET = 'google-client-secret-valid';
    const fullGoogle = getOAuthCredentialsForEnv('OAUTH_GOOGLE_CLIENT_ID', 'OAUTH_GOOGLE_CLIENT_SECRET');

    record(
      'ENV-04',
      'Workspace OAuth requires both Client ID and Client Secret before activation',
      partialGoogle.configured === false && fullGoogle.configured === true,
      `partialConfigured=${partialGoogle.configured}, fullConfigured=${fullGoogle.configured}`
    );

    // 5. Optional Subsystems Degrade Gracefully Under Minimal Environment
    for (const k of trackedKeys) {
      delete process.env[k];
    }
    const minSnap = getSystemConfigurationSnapshot();
    const minEmail = getEmailConfig();
    const minSheets = getGoogleSheetsConsentConfig();
    const minParental = getParentalConsentConfig();
    const minCision = getCisionConfig();
    const ephemSession = getSessionHashSecret();
    const ephemVault = getIntegrationVaultSecret();

    const minimalDegradationValid =
      minSnap.coreReadyWithMinimalConfig === true &&
      minSnap.summary.totalDocumentedOrReferencedVariables === 44 &&
      minSnap.summary.requiredCoreCount +
        minSnap.summary.optionalCount +
        minSnap.summary.featureDependentCount +
        minSnap.summary.unusedCount +
        minSnap.summary.duplicateCount ===
        44 &&
      getPort() === 3000 &&
      typeof getNodeEnv() === 'string' &&
      getAppUrl() === 'https://vizra.vercel.app' &&
      getFirebaseProjectId().projectId.length > 0 &&
      !minEmail.configured &&
      minEmail.adminNotificationEmail === '' &&
      !minSheets.configured &&
      !minParental.fullyConfigured &&
      !minCision.configured &&
      ephemSession.secret.length >= 32 &&
      !ephemSession.persistent &&
      ephemVault.secret.length >= 32 &&
      !ephemVault.persistent;

    record(
      'ENV-05',
      'Minimal env allows full server configuration with ephemeral cryptographic fallbacks',
      minimalDegradationValid,
      `totalVars=${minSnap.summary.totalDocumentedOrReferencedVariables}, port=${getPort()}, appUrl=${getAppUrl()}, firebaseSource=${getFirebaseProjectId().source}`
    );

    // 6. Zero Secret Exposure in System Configuration Snapshot
    const canarySecrets = [
      'CANARY_GEMINI_SECRET_9911',
      'CANARY_ADMIN_SECRET_8822',
      'CANARY_CRON_SECRET_7733',
      'CANARY_RESEND_SECRET_6644',
      'CANARY_VAULT_SECRET_5555_AAAA',
      'CANARY_SESSION_SECRET_4466_BBBB',
      'CANARY_GOOGLE_OAUTH_SECRET_3377',
      'CANARY_VPC_SECRET_2288_CCCC',
    ];
    process.env.GEMINI_API_KEY = canarySecrets[0];
    process.env.ADMIN_API_KEY = canarySecrets[1];
    process.env.CRON_SECRET = canarySecrets[2];
    process.env.RESEND_API_KEY = canarySecrets[3];
    process.env.INTEGRATION_TOKEN_SECRET = canarySecrets[4];
    process.env.SESSION_HASH_SECRET = canarySecrets[5];
    process.env.OAUTH_GOOGLE_CLIENT_ID = 'canary-client-id';
    process.env.OAUTH_GOOGLE_CLIENT_SECRET = canarySecrets[6];
    process.env.PARENTAL_CONSENT_PROVIDER = 'KWS';
    process.env.PARENTAL_CONSENT_API_KEY = 'vpc-key-12345';
    process.env.PARENTAL_CONSENT_WEBHOOK_SECRET = canarySecrets[7];

    const populatedSnapJson = JSON.stringify(getSystemConfigurationSnapshot());
    const leakedAnyCanary = canarySecrets.some((sec) => populatedSnapJson.includes(sec));

    record(
      'ENV-06',
      'getSystemConfigurationSnapshot() never exposes secret values even when populated',
      !leakedAnyCanary && !populatedSnapJson.includes('vpc-key-12345'),
      leakedAnyCanary ? 'SECRET LEAK DETECTED' : 'Zero canary secrets present in snapshot JSON'
    );

    // Restore original process.env cleanly before HTTP checks
    for (const k of trackedKeys) {
      if (backupEnv[k] === undefined) delete process.env[k];
      else process.env[k] = backupEnv[k];
    }

    // 7. Live HTTP Endpoint Checks on Port 3000
    const healthRes = await httpRequest('/api/health');
    const configRes = await httpRequest('/api/config/status');
    const configRaw = configRes.raw || '';
    const statusClean =
      healthRes.status === 200 &&
      healthRes.body?.coreReadyWithMinimalConfig === true &&
      configRes.status === 200 &&
      Array.isArray(configRes.body?.integrations) &&
      configRes.body.integrations.length === 11 &&
      !configRaw.includes('BEGIN PRIVATE KEY') &&
      !configRaw.includes('AIza');

    record(
      'ENV-07',
      'Live /api/health and /api/config/status respond 200 with zero leaked secrets',
      statusClean,
      `health=${healthRes.status}, config=${configRes.status}, integrations=${configRes.body?.integrations?.length || 0}`
    );

    // 8. Admin Placeholder Bypass Rejection Across Privileged Endpoints
    const seoPlaceholder1 = await httpRequest('/api/seo-diagnostics/report', 'GET', {
      Authorization: 'Bearer your_admin_api_key',
    });
    const seoPlaceholder2 = await httpRequest('/api/seo-diagnostics/report', 'GET', {
      'x-admin-api-key': 'your_workflow_secret',
    });
    const engagePlaceholder = await httpRequest('/api/engage/admin/overview', 'GET', {
      'x-admin-key': 'your_workflow_secret',
    });
    const omniaPlaceholder = await httpRequest('/api/omnia/feedback', 'GET', {
      'x-admin-api-key': 'your_admin_api_key',
    });

    const allPlaceholdersBlocked =
      seoPlaceholder1.status === 401 &&
      seoPlaceholder2.status === 401 &&
      engagePlaceholder.status === 401 &&
      (omniaPlaceholder.status === 401 || omniaPlaceholder.status === 403);

    record(
      'ENV-08',
      'Privileged endpoints block placeholder admin/workflow secrets on live HTTP server',
      allPlaceholdersBlocked,
      `seo1=${seoPlaceholder1.status}, seo2=${seoPlaceholder2.status}, engage=${engagePlaceholder.status}, omnia=${omniaPlaceholder.status}`
    );

    // 9. Optional Integrations Degrade Cleanly on Live HTTP Endpoints
    const integrationsList = await httpRequest('/api/integrations');
    const providers = Array.isArray(integrationsList.body?.providers)
      ? integrationsList.body.providers
      : [];
    const noSecretInIntegrations = !integrationsList.raw.includes('clientSecret');

    record(
      'ENV-09',
      'GET /api/integrations returns safe status metadata without client secrets',
      integrationsList.status === 200 && providers.length === 8 && noSecretInIntegrations,
      `status=${integrationsList.status}, providers=${providers.length}, secretFree=${noSecretInIntegrations}`
    );

    // 10. Built Frontend Client Bundle Contains Zero Server Secret Values or process.env Reads
    const distAssetsDir = path.resolve(process.cwd(), 'dist', 'assets');
    if (fs.existsSync(distAssetsDir)) {
      const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
      const forbiddenBundlePatterns = [
        'process.env.GEMINI_API_KEY',
        'process.env.ADMIN_API_KEY',
        'process.env.WORKFLOW_SECRET',
        'process.env.CRON_SECRET',
        'process.env.GOOGLE_PRIVATE_KEY',
        'process.env.INTEGRATION_TOKEN_SECRET',
        'process.env.SESSION_HASH_SECRET',
        'process.env.RESEND_API_KEY',
        'process.env.PARENTAL_CONSENT_API_KEY',
        'process.env.PARENTAL_CONSENT_WEBHOOK_SECRET',
        'BEGIN PRIVATE KEY',
        'your_admin_api_key',
        'your_workflow_secret',
        'your_vercel_cron_secret',
        're_placeholder_key',
        'MY_GEMINI_API_KEY',
      ];
      let matchedTokens: string[] = [];
      for (const file of jsFiles) {
        const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
        for (const tok of forbiddenBundlePatterns) {
          if (content.includes(tok)) {
            matchedTokens.push(`${file}:${tok}`);
          }
        }
      }
      record(
        'ENV-10',
        'Compiled frontend JS bundle (dist/assets/*.js) contains zero server secret reads or secret literals',
        matchedTokens.length === 0,
        matchedTokens.length === 0
          ? `Scanned ${jsFiles.length} production bundle chunks — 0 server secret leaks found`
          : `EXPOSED IN BUNDLE: ${matchedTokens.join(', ')}`
      );
    } else {
      record(
        'ENV-10',
        'Compiled frontend JS bundle secret scan',
        false,
        'dist/assets directory missing — run npm run build first'
      );
    }
  } finally {
    for (const k of trackedKeys) {
      if (backupEnv[k] === undefined) delete process.env[k];
      else process.env[k] = backupEnv[k];
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log('\n========================================================================');
  console.log(`ENV AUDIT SUMMARY: ${passedCount}/${results.length} CHECKS PASSED`);
  console.log('========================================================================');
  assert.strictEqual(passedCount, results.length, 'One or more environment audit checks failed.');
}

runTests().catch((err) => {
  console.error('\n[VerifyEnvConfigAudit Failed]', err);
  process.exit(1);
});
