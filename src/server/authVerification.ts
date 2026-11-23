/**
 * Server-side Firebase ID-token verification.
 * Tokens are trusted only after RS256 signature verification against Google's
 * published Firebase Secure Token certificates.
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

async function getGooglePublicKeys(): Promise<GooglePublicKeys> {
  const now = Date.now();
  if (cachedKeys && now < cachedKeysExpiry) return cachedKeys;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      { signal: controller.signal }
    );
    if (!response.ok) return cachedKeys || {};

    const keys = (await response.json()) as GooglePublicKeys;
    if (!keys || typeof keys !== 'object' || Array.isArray(keys)) {
      return cachedKeys || {};
    }

    cachedKeys = keys;
    const cacheControl = response.headers.get('cache-control');
    const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/);
    const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 21600;
    cachedKeysExpiry = now + (Number.isFinite(maxAgeSeconds) ? maxAgeSeconds : 21600) * 1000;
    return cachedKeys;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'certificate request failed';
    console.warn('[AuthVerify] Could not retrieve Google public keys:', message);
    return cachedKeys || {};
  } finally {
    clearTimeout(timeout);
  }
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

/** Verifies Firebase JWT claims and RS256 signature; fails closed on key errors. */
export async function verifyFirebaseIdToken(token: string): Promise<VerifiedAuthEvent> {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is missing or not a string' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return { valid: false, error: 'Malformed JWT' };
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (header?.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
      return { valid: false, error: 'Invalid Firebase token header' };
    }

    const projectId = resolveFirebaseProjectId();
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      payload?.aud !== projectId ||
      payload?.iss !== `https://securetoken.google.com/${projectId}`
    ) {
      return { valid: false, error: 'Firebase token audience or issuer mismatch' };
    }
    if (
      typeof payload.sub !== 'string' ||
      payload.sub.length === 0 ||
      payload.sub.length > 128 ||
      !/^[a-zA-Z0-9_-]+$/.test(payload.sub)
    ) {
      return { valid: false, error: 'Token subject is invalid' };
    }
    if (
      typeof payload.exp !== 'number' ||
      payload.exp <= nowSec - 60 ||
      typeof payload.iat !== 'number' ||
      payload.iat > nowSec + 300 ||
      typeof payload.auth_time !== 'number' ||
      payload.auth_time > nowSec + 300
    ) {
      return { valid: false, error: 'Firebase token time claims are invalid or expired' };
    }

    const publicKeys = await getGooglePublicKeys();
    const certificate = publicKeys[header.kid];
    if (typeof certificate !== 'string' || !certificate) {
      return { valid: false, error: 'Firebase signing key is unavailable or unrecognized' };
    }

    const signature = Buffer.from(parts[2], 'base64url');
    if (signature.length === 0) {
      return { valid: false, error: 'Firebase token signature is malformed' };
    }
    const verified = crypto.verify(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`),
      certificate,
      signature
    );
    if (!verified) return { valid: false, error: 'Firebase token signature is invalid' };

    return {
      valid: true,
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      emailVerified: payload.email_verified === true,
      authTime: payload.auth_time,
      tokenIssuedAt: payload.iat,
      tokenExpiresAt: payload.exp,
      provider: payload.firebase?.sign_in_provider || 'google.com',
    };
  } catch {
    return { valid: false, error: 'Firebase token verification failed' };
  }
}

/** Extracts a concise device and client summary from User-Agent string. */
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
