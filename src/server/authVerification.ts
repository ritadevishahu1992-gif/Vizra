/**
 * SERVER-SIDE AUTHENTICATION & TOKEN VERIFICATION
 * 
 * Verifies Firebase Auth ID tokens cryptographically against Google public keys.
 * Extracts verified UID, authenticated email, and auth_time claim.
 * Never trusts client-supplied recipient email addresses.
 */

import crypto from 'crypto';
import { getFirebaseProjectId } from './config/envConfig';

interface GooglePublicKeys {
  [kid: string]: string;
}

let cachedKeys: GooglePublicKeys | null = null;
let cachedKeysExpiry = 0;

function resolveFirebaseProjectId(): string {
  return getFirebaseProjectId().projectId;
}

/**
 * Fetches Google public certificates for Firebase ID token verification.
 */
async function getGooglePublicKeys(): Promise<GooglePublicKeys> {
  const now = Date.now();
  if (cachedKeys && now < cachedKeysExpiry) {
    return cachedKeys;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const keys = (await res.json()) as GooglePublicKeys;
      cachedKeys = keys;
      // Cache-Control header inspection or default 6 hours
      const cacheControl = res.headers.get('cache-control');
      const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/);
      const maxAgeSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 21600;
      cachedKeysExpiry = now + maxAgeSeconds * 1000;
      return cachedKeys;
    }
  } catch (err: any) {
    console.warn('[AuthVerify] Failed to refresh Google public keys from network:', err.message);
  }

  return cachedKeys || {};
}

export interface VerifiedAuthEvent {
  valid: boolean;
  uid?: string;
  email?: string;
  emailVerified?: boolean;
  authTime?: number;
  tokenIssuedAt?: number;
  tokenExpiresAt?: number;
  provider?: string;
  error?: string;
}

/**
 * Cryptographically verifies Firebase ID Token (JWT).
 * 1. Checks RS256 algorithm and header kid.
 * 2. Checks token expiration (exp) and issued time (iat).
 * 3. Checks audience matches Firebase Project ID.
 * 4. Checks issuer matches https://securetoken.google.com/<projectId>.
 * 5. Verifies cryptographic signature against Google's public certs (strictly fail-closed).
 */
export async function verifyFirebaseIdToken(token: string): Promise<VerifiedAuthEvent> {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is missing or not a string' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed JWT: must contain header, payload, and signature' };
  }

  try {
    const headerStr = Buffer.from(parts[0], 'base64url').toString('utf8');
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
    const header = JSON.parse(headerStr);
    const payload = JSON.parse(payloadStr);

    if (header.alg !== 'RS256') {
      return { valid: false, error: `Invalid algorithm: ${header.alg}. Expected RS256.` };
    }

    const projectId = resolveFirebaseProjectId();
    const nowSec = Math.floor(Date.now() / 1000);

    // 1. Check expiration and issued-at time
    if (typeof payload.exp !== 'number' || payload.exp < nowSec - 60) {
      return { valid: false, error: 'Token has expired' };
    }
    if (typeof payload.iat === 'number' && payload.iat > nowSec + 300) {
      return { valid: false, error: 'Token issued-at time (iat) is in the future' };
    }

    // 2. Check audience
    if (payload.aud !== projectId) {
      return { valid: false, error: `Audience mismatch: expected ${projectId}, got ${payload.aud}` };
    }

    // 3. Check issuer
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    if (payload.iss !== expectedIssuer) {
      return { valid: false, error: `Issuer mismatch: expected ${expectedIssuer}, got ${payload.iss}` };
    }

    // 4. Check subject (UID) format and length
    if (
      !payload.sub ||
      typeof payload.sub !== 'string' ||
      payload.sub.length > 128 ||
      !/^[a-zA-Z0-9_-]+$/.test(payload.sub)
    ) {
      return { valid: false, error: 'Token missing or invalid subject (UID) claim' };
    }

    // 5. Cryptographic signature verification against Google public keys (ALWAYS fail closed)
    const googleKeys = await getGooglePublicKeys();
    const cert = typeof header.kid === 'string' && header.kid ? googleKeys[header.kid] : null;

    if (!cert) {
      return {
        valid: false,
        error:
          Object.keys(googleKeys).length === 0
            ? 'Unable to verify token signature: Google certificate authority unavailable'
            : `Public key kid '${header.kid || 'none'}' not recognized by Google certificate authority`,
      };
    }

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    const signatureBuf = Buffer.from(parts[2], 'base64url');
    const isSignatureValid = verifier.verify(cert, signatureBuf);

    if (!isSignatureValid) {
      return { valid: false, error: 'Cryptographic signature verification failed' };
    }

    const provider = payload.firebase?.sign_in_provider || 'google.com';

    return {
      valid: true,
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      emailVerified: payload.email_verified === true,
      authTime: payload.auth_time || payload.iat || nowSec,
      tokenIssuedAt: payload.iat,
      tokenExpiresAt: payload.exp,
      provider,
    };
  } catch {
    return { valid: false, error: 'Token parsing failed' };
  }
}

/**
 * Extracts a concise device and client summary from User-Agent string.
 */
export function parseDeviceSummary(userAgent?: string): string {
  if (!userAgent) return 'Web Client';
  const ua = userAgent.toLowerCase();
  let os = 'Unknown OS';
  if (ua.includes('iphone')) os = 'iOS (iPhone)';
  else if (ua.includes('ipad')) os = 'iPadOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('linux')) os = 'Linux';

  let browser = 'Browser';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';

  return `${browser} on ${os}`;
}
