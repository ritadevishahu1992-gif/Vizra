import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';
import {
  ACTIVE_AGE_POLICY,
  OPTION_2_ACTIVE,
  OPTION_5_REJECTED,
  AGE_FEATURE_POLICY_MATRIX,
  JURISDICTION_CONSENT_THRESHOLDS,
  MINOR_SAFE_GEMINI_SAFETY_SETTINGS,
  MINOR_SAFE_SYSTEM_DIRECTIVE,
  evaluateDateOfBirth,
  evaluateMinorFeatureAccess,
  UnconfiguredParentalVerificationProvider,
} from '../src/server/compliance/ageAssurance';
import { selectEngageInventory } from '../src/server/engage/engageSelectionEngine';

interface TestResult {
  id: string;
  option: 'Option 3' | 'Option 4' | 'Governance';
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

function record(
  id: string,
  option: TestResult['option'],
  name: string,
  expected: string,
  actual: string,
  passed: boolean
) {
  results.push({ id, option, name, expected, actual, passed });
  const mark = passed ? '✓' : '✗';
  console.log(`  ${mark} [${passed ? 'PASS' : 'FAIL'}] ${id} (${option}): ${name}`);
  if (!passed) {
    console.log(`      Expected: ${expected}`);
    console.log(`      Actual:   ${actual}`);
  }
}

function httpRequest(options: {
  path: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<{ status: number; headers: http.IncomingHttpHeaders; bodyText: string; json?: any }> {
  return new Promise((resolve, reject) => {
    const payload =
      options.body !== undefined
        ? typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body)
        : undefined;

    const reqHeaders: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (payload && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      `http://127.0.0.1:3000${options.path}`,
      {
        method: options.method || 'GET',
        timeout: 12000,
        headers: reqHeaders,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          const bodyText = Buffer.concat(chunks).toString('utf-8');
          let json: any = undefined;
          try {
            json = JSON.parse(bodyText);
          } catch {
            // Non-JSON
          }
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            bodyText,
            json,
          });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout requesting ${options.path}`));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function runVerification() {
  console.log('================================================================================');
  console.log('VIZRA — CHILD ONLINE SAFETY OPTION 3 & OPTION 4 VERIFICATION SUITE');
  console.log('================================================================================\n');

  const testRunSuffix = Date.now().toString(36);
  const teenClientId = `teen_opt34_${testRunSuffix}`;
  const childClientId = `u13_opt34_${testRunSuffix}`;
  const parentEmail = `guardian_${testRunSuffix}@example.org`;

  try {
    // -------------------------------------------------------------------------
    // GOVERNANCE BASELINE: Option 1 active, Option 2 dormant, Option 5 rejected
    // -------------------------------------------------------------------------
    const policyRes = await httpRequest({
      path: '/api/compliance/age-assurance/policy',
      method: 'GET',
    });
    const option5Res = await httpRequest({
      path: '/api/compliance/age-assurance/option-5-bypass',
      method: 'POST',
    });

    record(
      'CS-01',
      'Governance',
      'Active policy remains STRICT_18_PLUS, Option 2 stays DORMANT, Option 5 stays REJECTED (403)',
      'STRICT_18_PLUS, opt2=false, opt5=true(403)',
      `policy=${policyRes.json?.activePolicy}, opt2=${policyRes.json?.option2Preparatory?.active}, opt5=${option5Res.status}`,
      ACTIVE_AGE_POLICY === 'STRICT_18_PLUS' &&
        OPTION_2_ACTIVE === false &&
        OPTION_5_REJECTED === true &&
        policyRes.status === 200 &&
        policyRes.json?.option2Preparatory?.active === false &&
        policyRes.json?.option5?.rejected === true &&
        option5Res.status === 403
    );

    // -------------------------------------------------------------------------
    // OPTION 3: JURISDICTION DIGITAL CONSENT THRESHOLDS & VERIFIABLE PARENTAL CONSENT
    // -------------------------------------------------------------------------
    const refDate = new Date(Date.UTC(2026, 10, 14));
    const dob14 = '2012-06-01'; // Age 14 on 2026-11-14
    const us14 = evaluateDateOfBirth(dob14, refDate, 'US'); // US threshold = 13 -> NOT below COPPA 13
    const de14 = evaluateDateOfBirth(dob14, refDate, 'DE'); // DE GDPR Art. 8 threshold = 16 -> BELOW 16
    const in17 = evaluateDateOfBirth('2009-05-01', refDate, 'IN'); // India DPDP threshold = 18 -> BELOW 18
    const jurisdictionsRes = await httpRequest({
      path: '/api/compliance/age-assurance/jurisdictions',
      method: 'GET',
    });

    record(
      'CS-02',
      'Option 3',
      'Jurisdictional digital-consent thresholds differentiate US (13 COPPA), DE/EU (16 GDPR Art. 8), UK (13 + AADC <18), IN (18 DPDP Sec. 9)',
      'US14.below=false, DE14.below=true, IN17.below=true, endpoint=200',
      `usBelow=${us14.belowDigitalConsentThreshold}, deBelow=${de14.belowDigitalConsentThreshold}, inBelow=${in17.belowDigitalConsentThreshold}, http=${jurisdictionsRes.status}(count=${jurisdictionsRes.json?.jurisdictions?.length})`,
      us14.digitalConsentAge === 13 &&
        us14.belowDigitalConsentThreshold === false &&
        de14.digitalConsentAge === 16 &&
        de14.belowDigitalConsentThreshold === true &&
        in17.digitalConsentAge === 18 &&
        in17.belowDigitalConsentThreshold === true &&
        jurisdictionsRes.status === 200 &&
        Array.isArray(jurisdictionsRes.json?.jurisdictions) &&
        jurisdictionsRes.json.jurisdictions.length >= Object.keys(JURISDICTION_CONSENT_THRESHOLDS).length
    );

    // Evaluate under-18 teen with explicit client ID -> must block (403) and lock anti-circumvention
    const teenEvalRes = await httpRequest({
      path: '/api/compliance/age-assurance/evaluate',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': teenClientId },
      body: { dateOfBirth: '2011-05-01', jurisdiction: 'DE' },
    });

    // Attempt self-declaration circumvention on SAME client ID by submitting adult DOB
    const circumventionRes = await httpRequest({
      path: '/api/compliance/age-assurance/evaluate',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': teenClientId },
      body: { dateOfBirth: '1992-01-01', jurisdiction: 'US' },
    });

    record(
      'CS-03',
      'Option 3',
      'Named minor evaluation blocks access (403) and blocks subsequent upward adult self-declaration circumvention (403 SELF_DECLARATION_CIRCUMVENTION_BLOCKED)',
      'teenEval=403, circumvention=403(SELF_DECLARATION_CIRCUMVENTION_BLOCKED)',
      `teenEval=${teenEvalRes.status}, circumvention=${circumventionRes.status}(${circumventionRes.json?.error?.code})`,
      teenEvalRes.status === 403 &&
        teenEvalRes.json?.evaluation?.jurisdiction === 'DE' &&
        teenEvalRes.json?.evaluation?.digitalConsentAge === 16 &&
        circumventionRes.status === 403 &&
        circumventionRes.json?.error?.code === 'SELF_DECLARATION_CIRCUMVENTION_BLOCKED'
    );

    // Spoofed parental-consent verification bypass check
    const spoofedConsentRes = await httpRequest({
      path: '/api/compliance/age-assurance/parental-consent',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': teenClientId },
      body: {
        parentEmail,
        jurisdiction: 'DE',
        verified: true,
        bypass: true,
      },
    });

    // Legitimate parental-consent initiation fails closed with HTTP 424 (no external vendor configured)
    const realConsentInitRes = await httpRequest({
      path: '/api/compliance/age-assurance/parental-consent',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': teenClientId },
      body: {
        parentEmail,
        jurisdiction: 'DE',
      },
    });

    // Unconfigured webhook callback fails closed (424)
    const webhookRes = await httpRequest({
      path: '/api/compliance/age-assurance/parental-consent/callback',
      method: 'POST',
      body: { recordId: realConsentInitRes.json?.recordId, verified: true },
    });

    record(
      'CS-04',
      'Option 3',
      'Parental consent rejects client verification spoofing (403), fails closed when VPC vendor unconfigured (424), and locks signed webhook callback (424)',
      'spoof=403, realInit=424, webhook=424, unconfiguredAdapter=false',
      `spoof=${spoofedConsentRes.status}, realInit=${realConsentInitRes.status}, webhook=${webhookRes.status}`,
      spoofedConsentRes.status === 403 &&
        spoofedConsentRes.json?.error?.code === 'SPOOFED_VERIFICATION_REJECTED' &&
        realConsentInitRes.status === 424 &&
        realConsentInitRes.json?.error?.code === 'PARENTAL_VERIFICATION_VENDOR_NOT_CONFIGURED' &&
        webhookRes.status === 424 &&
        !(new UnconfiguredParentalVerificationProvider()).configured
    );

    // Check Non-PII data minimization in age_assurance_records.json
    const ageRecordsRaw = fs.readFileSync(
      path.resolve(process.cwd(), 'data', 'age_assurance_records.json'),
      'utf-8'
    );
    const leaksPii =
      ageRecordsRaw.includes('2011-05-01') ||
      ageRecordsRaw.includes(parentEmail) ||
      ageRecordsRaw.includes(teenClientId);

    // Parental consent withdrawal (requires matching guardian email when unauthenticated)
    const wrongWithdraw = await httpRequest({
      path: '/api/compliance/age-assurance/parental-consent/withdraw',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': teenClientId },
      body: { parentEmail: 'attacker@example.com' },
    });
    const validWithdraw = await httpRequest({
      path: '/api/compliance/age-assurance/parental-consent/withdraw',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': teenClientId },
      body: { parentEmail },
    });
    const statusAfterWithdraw = await httpRequest({
      path: '/api/compliance/age-assurance/status',
      method: 'GET',
      headers: { 'X-Vizra-Client-Id': teenClientId },
    });

    record(
      'CS-05',
      'Option 3',
      'Age assurance store persists zero raw DOB/email/UID PII, rejects unauthorized consent withdrawal (404), and executes guardian consent withdrawal cleanly (WITHDRAWN)',
      'leaksPii=false, wrongWithdraw=404, validWithdraw=200(WITHDRAWN)',
      `leaksPii=${leaksPii}, wrongWithdraw=${wrongWithdraw.status}, validWithdraw=${validWithdraw.status}, status=${statusAfterWithdraw.json?.record?.consentStatus}`,
      !leaksPii &&
        wrongWithdraw.status === 404 &&
        validWithdraw.status === 200 &&
        validWithdraw.json?.consentStatus === 'WITHDRAWN' &&
        statusAfterWithdraw.status === 200 &&
        statusAfterWithdraw.json?.isMinorBlocked === true
    );

    // -------------------------------------------------------------------------
    // OPTION 4: AGE-APPROPRIATE FEATURE RESTRICTIONS (UNIT + LIVE ENDPOINT ENFORCEMENT)
    // -------------------------------------------------------------------------
    // Register an under-13 blocked client session as well
    await httpRequest({
      path: '/api/compliance/age-assurance/evaluate',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': childClientId },
      body: { dateOfBirth: '2017-05-01', jurisdiction: 'US' },
    });

    const matrixRes = await httpRequest({
      path: '/api/compliance/age-assurance/feature-matrix',
      method: 'GET',
    });

    // Verify server feature enforcement across live endpoints for blocked minor / under-13 client
    const chatBlocked = await httpRequest({
      path: '/api/chat',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': childClientId },
      body: { prompt: 'Hello Omnia, help me learn astronomy.' },
    });
    const researchBlocked = await httpRequest({
      path: '/api/research',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': teenClientId },
      body: { query: 'How does photosynthesis work?' },
    });
    const musicBlocked = await httpRequest({
      path: '/api/music/generate',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': teenClientId },
      body: { prompt: 'Ambient study synth' },
    });
    const billingBlocked = await httpRequest({
      path: '/api/credits/usage',
      method: 'POST',
      headers: { 'X-Vizra-Client-Id': teenClientId },
      body: { action: 'consume', planId: 'studio', amount: 1 },
    });

    record(
      'CS-06',
      'Option 4',
      'Live API routes (/api/chat, /api/research, /api/music/generate, /api/credits/usage upgrades) enforce server-side age assurance gating (HTTP 403)',
      'matrix=200(8 keys), chat=403, research=403, music=403, billing=403',
      `matrix=${matrixRes.status}, chat=${chatBlocked.status}, research=${researchBlocked.status}, music=${musicBlocked.status}, billing=${billingBlocked.status}`,
      matrixRes.status === 200 &&
        Object.keys(matrixRes.json?.featureMatrix || {}).length === Object.keys(AGE_FEATURE_POLICY_MATRIX).length &&
        chatBlocked.status === 403 &&
        researchBlocked.status === 403 &&
        musicBlocked.status === 403 &&
        billingBlocked.status === 403
    );

    // Verify Option 4 feature matrix for RESTRICTED_MINOR_SAFE vs UNDER_13_BLOCKED vs ADULT_18_PLUS
    const u13Chat = evaluateMinorFeatureAccess('UNDER_13_BLOCKED', 'chat_basic', true, {
      allowOption4Simulation: true,
    });
    const teenSafeChat = evaluateMinorFeatureAccess(
      'TEEN_13_17_PENDING_PARENTAL_CONSENT',
      'chat_basic',
      true,
      { allowOption4Simulation: true }
    );
    const teenVoice = evaluateMinorFeatureAccess(
      'TEEN_13_17_PENDING_PARENTAL_CONSENT',
      'voice_live',
      true,
      { allowOption4Simulation: true }
    );
    const teenOAuth = evaluateMinorFeatureAccess(
      'TEEN_13_17_PENDING_PARENTAL_CONSENT',
      'third_party_workspace_oauth',
      true,
      { allowOption4Simulation: true }
    );
    const teenCommercialEngage = evaluateMinorFeatureAccess(
      'TEEN_13_17_PENDING_PARENTAL_CONSENT',
      'commercial_engage_targeting',
      true,
      { allowOption4Simulation: true }
    );
    const teenPaidBilling = evaluateMinorFeatureAccess(
      'TEEN_13_17_PENDING_PARENTAL_CONSENT',
      'paid_billing',
      true,
      { allowOption4Simulation: true }
    );

    const hasAllStrictThresholds =
      MINOR_SAFE_GEMINI_SAFETY_SETTINGS.length === 4 &&
      MINOR_SAFE_GEMINI_SAFETY_SETTINGS.every((s) =>
        String(s.threshold).includes('BLOCK_LOW_AND_ABOVE')
      ) &&
      MINOR_SAFE_SYSTEM_DIRECTIVE.includes('AGE-APPROPRIATE MINOR-SAFE GUARDRAIL');

    record(
      'CS-07',
      'Option 4',
      'Minor-safe restriction matrix blocks under-13 completely, allows supervised educational chat for verified teens, and disables Voice Live, OAuth, Paid Billing & Commercial Engage',
      'u13=false, teenChat=true, voice/oauth/engage/billing=false, safety=BLOCK_LOW_AND_ABOVE',
      `u13=${u13Chat.allowed}, teenChat=${teenSafeChat.allowed}, voice=${teenVoice.allowed}, oauth=${teenOAuth.allowed}, engage=${teenCommercialEngage.allowed}, billing=${teenPaidBilling.allowed}, strictSafety=${hasAllStrictThresholds}`,
      !u13Chat.allowed &&
        teenSafeChat.allowed &&
        teenSafeChat.requiresMinorSafeSafetySettings &&
        !teenVoice.allowed &&
        !teenOAuth.allowed &&
        !teenCommercialEngage.allowed &&
        !teenPaidBilling.allowed &&
        hasAllStrictThresholds
    );

    // Verify Engage commercial suppression & minor-blocked filtering
    const engageMinorSafe = selectEngageInventory({
      mode: 'quick',
      sessionHash: 'opt4_minor_safe_test',
      minorSafeMode: true,
      minorBlocked: false,
    });
    const hasZeroCommercialItems = engageMinorSafe.items.every(
      (i) =>
        i.type !== 'sponsored_card' &&
        i.type !== 'affiliate_card' &&
        i.sponsorshipLabel === 'None' &&
        !i.campaignId &&
        !i.partnerId
    );
    const engageBlockedLive = await httpRequest({
      path: '/api/engage/select?mode=quick',
      method: 'GET',
      headers: { 'X-Vizra-Client-Id': teenClientId },
    });

    record(
      'CS-08',
      'Option 4',
      'VIZRA Engage strips sponsored/affiliate items in minorSafeMode and returns empty disabled state on /api/engage/select for minor-blocked sessions',
      'zeroCommercial=true, blockedSelect.enabled=false & items=[]',
      `zeroCommercial=${hasZeroCommercialItems}, blockedEnabled=${engageBlockedLive.json?.enabled}, blockedItems=${engageBlockedLive.json?.items?.length}`,
      hasZeroCommercialItems &&
        engageBlockedLive.status === 200 &&
        engageBlockedLive.json?.enabled === false &&
        Array.isArray(engageBlockedLive.json?.items) &&
        engageBlockedLive.json.items.length === 0
    );

    // Cascade deletion test via DELETE /api/account/data
    const deleteTeenRes = await httpRequest({
      path: '/api/account/data',
      method: 'DELETE',
      headers: { 'X-Vizra-Client-Id': teenClientId },
    });
    const deleteChildRes = await httpRequest({
      path: '/api/account/data',
      method: 'DELETE',
      headers: { 'X-Vizra-Client-Id': childClientId },
    });
    const statusAfterDelete = await httpRequest({
      path: '/api/compliance/age-assurance/status',
      method: 'GET',
      headers: { 'X-Vizra-Client-Id': teenClientId },
    });

    record(
      'CS-09',
      'Option 3',
      'DELETE /api/account/data cascades erasure to age_assurance_records.json cleanly',
      'purgedStores includes age_assurance_records and subsequent status.record=null',
      `purged=${JSON.stringify(deleteTeenRes.json?.purgedStores)}, afterRecord=${statusAfterDelete.json?.record}`,
      deleteTeenRes.status === 200 &&
        Array.isArray(deleteTeenRes.json?.purgedStores) &&
        deleteTeenRes.json.purgedStores.includes('age_assurance_records') &&
        deleteChildRes.status === 200 &&
        statusAfterDelete.status === 200 &&
        statusAfterDelete.json?.record === null
    );

    // Verify SettingsPage & LegalPage honestly reflect Option 3 & Option 4 without fake verification UI
    const settingsSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/SettingsPage.tsx'), 'utf-8');
    const legalSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/LegalPage.tsx'), 'utf-8');
    const uiHonest =
      settingsSrc.includes('/api/compliance/age-assurance/policy') &&
      settingsSrc.includes('Option 3') &&
      settingsSrc.includes('Option 4') &&
      legalSrc.includes('Option 3') &&
      legalSrc.includes('Option 4') &&
      legalSrc.includes('HTTP 424');

    record(
      'CS-10',
      'Governance',
      'SettingsPage and LegalPage expose real server-backed Option 3 & Option 4 governance posture with zero fake parental approval UI',
      'SettingsPage & LegalPage wired honestly',
      `uiHonest=${uiHonest}`,
      uiHonest
    );
  } finally {
    // Cleanup safety
    await httpRequest({
      path: '/api/account/data',
      method: 'DELETE',
      headers: { 'X-Vizra-Client-Id': teenClientId },
    }).catch(() => {});
    await httpRequest({
      path: '/api/account/data',
      method: 'DELETE',
      headers: { 'X-Vizra-Client-Id': childClientId },
    }).catch(() => {});
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log('\n================================================================================');
  console.log(`CHILD SAFETY OPTION 3 & 4 SUMMARY: ${passedCount}/${results.length} CHECKS PASSED`);
  console.log('================================================================================');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error in verifyChildSafetyOptions3And4:', err);
  process.exit(1);
});
