/**
 * Verification test for src/lib/monitoring.ts PII & token masking guarantees.
 */
import assert from 'node:assert/strict';
import type { Breadcrumb, ErrorEvent } from '@sentry/react';
import {
  maskSensitiveString,
  sanitizeUrlForMonitoring,
  scrubSentryEvent,
  scrubSentryBreadcrumb,
} from '../src/lib/monitoring';

// 1. String masking: emails, JWTs, Bearer tokens, API keys, workspace tokens, IPs, phones, inline secrets
const fakeJwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signaturePayload1234567890';
const rawString = [
  'User alice@example.com failed auth with Authorization: Bearer superSecretToken12345',
  `jwt=${fakeJwt}`,
  'gemini=AIzaSyDummyKeyValueForRedactionTest12345',
  'workspace=vz_live_abcdef1234567890',
  'ip=203.0.113.42 phone=+1-415-555-0199 password=MySecretPass99',
].join(' | ');

const masked = maskSensitiveString(rawString);
assert.ok(!masked.includes('alice@example.com'), 'Email must be masked');
assert.ok(!masked.includes('superSecretToken12345'), 'Bearer token must be masked');
assert.ok(!masked.includes('eyJhbGci'), 'JWT must be masked');
assert.ok(!masked.includes('AIzaSyDummyKeyValue'), 'Google API key must be masked');
assert.ok(!masked.includes('vz_live_abcdef'), 'Workspace token must be masked');
assert.ok(!masked.includes('203.0.113.42'), 'IPv4 must be masked');
assert.ok(!masked.includes('415-555-0199'), 'Phone number must be masked');
assert.ok(!masked.includes('MySecretPass99'), 'Password must be masked');

// 2. URL query param & embedded credential sanitization
const dirtyUrl = 'https://user:pass@vizra.vercel.app/studio?token=abc12345&email=bob@test.com&tab=audio&ticket=xyz999';
const safeUrl = sanitizeUrlForMonitoring(dirtyUrl);
assert.ok(!safeUrl.includes('user:pass'), 'Embedded credentials must be stripped');
assert.ok(!safeUrl.includes('abc12345'), 'Token query param must be masked');
assert.ok(!safeUrl.includes('bob@test.com'), 'Email query param must be masked');
assert.ok(!safeUrl.includes('xyz999'), 'Ticket query param must be masked');
assert.ok(safeUrl.includes('tab=audio'), 'Non-sensitive route query params should be preserved');

// 3. Full Sentry ErrorEvent scrubbing (user PII, headers, cookies, request data, exception value, breadcrumbs)
const dirtyEvent = {
  type: undefined,
  message: 'Failed request for bob@company.org with Bearer tok_987654321',
  user: {
    id: 'raw_firebase_uid_12345',
    email: 'bob@company.org',
    username: 'bob',
    ip_address: '198.51.100.22',
  },
  request: {
    url: 'https://vizra.vercel.app/api/chat?api_key=AIzaSySecret1234567890123456',
    headers: {
      Authorization: 'Bearer mySecretJwtToken',
      Cookie: 'session=abc123',
      'X-Vizra-Client-Id': 'client_secret_id_999',
      'Content-Type': 'application/json',
    },
    cookies: { session: 'abc123' },
    data: {
      prompt: 'Private user prompt containing confidential business details',
      model: 'gemini-2.5-flash',
    },
  },
  exception: {
    values: [
      {
        type: 'Error',
        value: `API error for alice@example.com (${fakeJwt})`,
      },
    ],
  },
  extra: {
    idToken: fakeJwt,
    displayName: 'Alice Smith',
    safeMetric: 42,
  },
  breadcrumbs: [
    {
      category: 'fetch',
      message: 'POST https://vizra.vercel.app/api/live/session?ticket=secretTicketValue',
      data: {
        url: 'https://vizra.vercel.app/api/live/session?ticket=secretTicketValue',
        authorization: 'Bearer leakMeNot',
        status_code: 401,
      },
    } as Breadcrumb,
  ],
} as unknown as ErrorEvent;

const cleanEvent = scrubSentryEvent(dirtyEvent);
const serialized = JSON.stringify(cleanEvent);
for (const secret of [
  'bob@company.org',
  'alice@example.com',
  'tok_987654321',
  'raw_firebase_uid_12345',
  '198.51.100.22',
  'mySecretJwtToken',
  'session=abc123',
  'client_secret_id_999',
  'Private user prompt',
  'Alice Smith',
  'secretTicketValue',
  'leakMeNot',
  'AIzaSySecret1234567890123456',
  'eyJhbGci',
]) {
  assert.ok(!serialized.includes(secret), `Scrubbed Sentry event must not contain: ${secret}`);
}
assert.equal(cleanEvent.user, undefined, 'Non-hashed raw user object must be stripped');
assert.equal(cleanEvent.request?.cookies, undefined, 'Request cookies must be removed');
assert.equal((cleanEvent.extra as Record<string, unknown>)?.safeMetric, 42, 'Non-sensitive telemetry should remain intact');

// 4. Opaque hashed user ID is allowed while email/ip are still stripped
const hashedUserEvent = scrubSentryEvent({
  user: { id: 'usr_a1b2c3d4e5f60718', email: 'strip@me.com', ip_address: '10.0.0.1' },
} as unknown as ErrorEvent);
assert.deepEqual(hashedUserEvent.user, { id: 'usr_a1b2c3d4e5f60718' });

// 5. Breadcrumb scrubber standalone check
const cleanCrumb = scrubSentryBreadcrumb({
  category: 'navigation',
  data: { to: '/settings?code=oauth_code_12345', from: '/workspace' },
});
assert.ok(cleanCrumb && !JSON.stringify(cleanCrumb).includes('oauth_code_12345'));

console.log('ALL SENTRY PII & TOKEN MASKING CHECKS PASSED (5/5)');
