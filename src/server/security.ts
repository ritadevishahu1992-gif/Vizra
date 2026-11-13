import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import dns from 'dns';
import crypto from 'crypto';

// ============================================================================
// 1. SSRF PROTECTION FOR EXTERNAL URLS & IMAGES
// ============================================================================

/**
 * Checks whether an IPv4 or IPv6 address is in a private, loopback, link-local,
 * or cloud metadata IP range (e.g., AWS/GCP 169.254.169.254).
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  // IPv4 Loopback (127.0.0.0/8)
  if (/^127\./.test(ip)) return true;

  // IPv4 Link-Local / Cloud Metadata (169.254.0.0/16) - AWS/GCP/Azure metadata service
  if (/^169\.254\./.test(ip)) return true;

  // IPv4 Private Class A (10.0.0.0/8)
  if (/^10\./.test(ip)) return true;

  // IPv4 Private Class B (172.16.0.0/12)
  const classBMatch = ip.match(/^172\.(\d+)\./);
  if (classBMatch) {
    const secondOctet = parseInt(classBMatch[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  // IPv4 Private Class C (192.168.0.0/16)
  if (/^192\.168\./.test(ip)) return true;

  // IPv4 Broadcast / Current network (0.0.0.0/8, 255.255.255.255)
  if (/^0\./.test(ip) || ip === '255.255.255.255') return true;

  // IPv6 Loopback (::1)
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;

  // IPv6 Link-Local (fe80::/10)
  if (/^fe[89ab][0-9a-f]:/i.test(ip)) return true;

  // IPv6 Unique Local Address (fc00::/7)
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;

  // IPv4-mapped IPv6 addresses (::ffff:127.0.0.1, etc.)
  if (ip.startsWith('::ffff:')) {
    const mappedV4 = ip.replace('::ffff:', '');
    return isPrivateOrReservedIP(mappedV4);
  }

  return false;
}

/**
 * Validates an external URL for SSRF vulnerabilities before fetching.
 * Validates protocol, hostname, and resolves DNS to verify IP is public.
 */
export async function validateExternalUrlForSSRF(rawUrl: string): Promise<{
  safe: boolean;
  reason?: string;
  resolvedIp?: string;
}> {
  try {
    const parsed = new URL(rawUrl);

    // Only allow HTTP and HTTPS protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Forbidden protocol: ${parsed.protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block common internal/local hostnames
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.lan') ||
      hostname.endsWith('.cluster.local') ||
      hostname.includes('metadata.google') ||
      hostname === '169.254.169.254'
    ) {
      return { safe: false, reason: `Forbidden host: ${hostname}` };
    }

    // Resolve DNS to verify destination IP
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return { safe: false, reason: 'DNS lookup failed: host does not resolve' };
    }

    // Check each resolved IP address
    for (const record of lookupResult) {
      if (isPrivateOrReservedIP(record.address)) {
        return {
          safe: false,
          reason: `Resolved to private or metadata IP: ${record.address}`,
          resolvedIp: record.address,
        };
      }
    }

    return { safe: true, resolvedIp: lookupResult[0].address };
  } catch (err: any) {
    return { safe: false, reason: `Invalid URL format or DNS error: ${err.message}` };
  }
}

// ============================================================================
// 2. RATE LIMITER (SLIDING WINDOW ALGORITHM)
// ============================================================================

interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly name: string;

  constructor(options: { windowMs: number; max: number; name?: string }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.max;
    this.name = options.name || 'default';

    // Periodically clean up stale entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  public check(key: string): {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetMs: number;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        limit: this.maxRequests,
        resetMs,
      };
    }

    record.timestamps.push(now);
    const remaining = this.maxRequests - record.timestamps.length;
    const resetMs = this.windowMs;

    return {
      allowed: true,
      remaining,
      limit: this.maxRequests,
      resetMs,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((t) => t > windowStart);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  public getMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Determine client IP using x-forwarded-for or connection remoteAddress
      const forwarded = req.headers['x-forwarded-for'];
      const rawIp = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress || 'unknown';

      const clientKey = `${this.name}:${rawIp}`;
      const result = this.check(clientKey);

      res.setHeader('X-RateLimit-Limit', result.limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetMs / 1000).toString());

      if (!result.allowed) {
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests for ${this.name}. Please wait ${Math.ceil(result.resetMs / 1000)} seconds before trying again.`,
            retryAfterSeconds: Math.ceil(result.resetMs / 1000),
          },
        });
        return;
      }

      next();
    };
  }
}

// Preset rate limiters
export const chatRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  name: 'chat',
});

export const scienceRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  name: 'science',
});

export const musicRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  name: 'music',
});

export const adminRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  name: 'admin',
});

export const ragRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 45,
  name: 'rag',
});

export const generalApiRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  name: 'api',
});

/**
 * Global express-rate-limit middleware protecting all public-facing /api/* routes
 * against automated abuse, scraping, and volumetric request floods.
 */
export const publicApiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  limit: 120, // 120 requests per minute per IP across /api/*
  standardHeaders: 'draft-7',
  legacyHeaders: true,
  validate: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many API requests from this IP address. Please wait a moment and try again.',
        retryAfterSeconds: 60,
      },
    });
  },
});

/**
 * Strict express-rate-limit middleware protecting authentication and administrative
 * endpoints (/api/auth/*, /api/seo-diagnostics/*) against credential and passkey brute-force attempts.
 */
export const authBruteForceRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  limit: 30, // 30 attempts per 15 minutes per IP
  standardHeaders: 'draft-7',
  legacyHeaders: true,
  validate: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'AUTH_BRUTE_FORCE_BLOCKED',
        message: 'Too many authentication attempts from this IP address. Please try again in 15 minutes.',
        retryAfterSeconds: 900,
      },
    });
  },
});

// ============================================================================
// 3. ADMIN & CRON AUTHENTICATION MIDDLEWARES
// ============================================================================

/**
 * Constant-time string comparison to prevent timing attacks on secrets.
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Protects administrative training endpoints (/api/omnia/train, /api/omnia/knowledge POST).
 * Accepts Bearer token via Authorization header or X-Admin-Key header.
 */
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const configuredAdminKey = process.env.ADMIN_API_KEY || process.env.WORKFLOW_SECRET;

  // If no admin key is configured on server, warn in dev, enforce in production
  if (!configuredAdminKey || configuredAdminKey === 'your_admin_api_key') {
    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({
        error: {
          code: 'ADMIN_AUTH_NOT_CONFIGURED',
          message: 'Administrative endpoint disabled: ADMIN_API_KEY is not configured in production.',
        },
      });
      return;
    }
    // In local development without secret configured, allow with warning
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  const xAdminKey = req.headers['x-admin-key'];

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (typeof xAdminKey === 'string') {
    token = xAdminKey.trim();
  }

  if (!token || !safeCompare(token, configuredAdminKey)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED_ADMIN',
        message: 'Unauthorized: Valid administrative key required.',
      },
    });
    return;
  }

  next();
}

/**
 * Protects scheduled Vercel Cron endpoints (/api/cron/omnia-sync).
 */
export function cronAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const configuredCronSecret = process.env.CRON_SECRET;

  if (!configuredCronSecret || configuredCronSecret === 'your_vercel_cron_secret') {
    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({
        error: {
          code: 'CRON_SECRET_NOT_CONFIGURED',
          message: 'Cron endpoint disabled: CRON_SECRET is not configured in production.',
        },
      });
      return;
    }
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token || !safeCompare(token, configuredCronSecret)) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED_CRON',
        message: 'Unauthorized: Invalid cron secret header.',
      },
    });
    return;
  }

  next();
}

// ============================================================================
// 4. SECURITY HEADERS, CORS & INPUT SANITIZATION
// ============================================================================

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' ws: wss: https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://alphafold.ebi.ac.uk https://pubchem.ncbi.nlm.nih.gov https://eutils.ncbi.nlm.nih.gov",
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
  "frame-ancestors 'self' https://*.run.app https://*.google.com https://aistudio.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/**
 * Checks whether an Origin header belongs to a trusted VIZRA origin.
 */
export function isTrustedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Same-origin or non-browser request without Origin
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'vizra.vercel.app' ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.run.app') ||
      host.endsWith('.google.com')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), microphone=(self)'
  );
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);

  // Apply X-Robots-Tag: noindex, nofollow and no-store cache policy strictly to API and private routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/live')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
}

/**
 * Enforces HTTP method whitelist and strict CORS origin checks for /api/* routes.
 */
export function corsSecurityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedMethods = ['GET', 'HEAD', 'POST', 'DELETE', 'OPTIONS'];
  if (!allowedMethods.includes(req.method.toUpperCase())) {
    res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `HTTP method ${req.method} is not allowed.`,
      },
    });
    return;
  }

  const origin = req.headers.origin;
  if (origin) {
    if (isTrustedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
    } else if (req.path.startsWith('/api/')) {
      res.status(403).json({
        error: {
          code: 'CORS_ORIGIN_FORBIDDEN',
          message: 'Cross-origin API request from untrusted origin is forbidden.',
        },
      });
      return;
    }
  }

  if (req.method.toUpperCase() === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

/**
 * Validates and limits prompt input.
 */
export function validatePrompt(prompt: any): { valid: boolean; error?: string; cleanText?: string } {
  if (typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt must be a string.' };
  }
  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty.' };
  }
  if (trimmed.length > 50000) {
    return { valid: false, error: 'Prompt exceeds maximum allowed length of 50,000 characters.' };
  }
  return { valid: true, cleanText: trimmed };
}

/**
 * Detects direct prompt injection attempts targeting system secrets, environment variables,
 * or raw system instruction exfiltration.
 */
export function detectPromptInjection(input: string): {
  safe: boolean;
  reason?: string;
} {
  if (!input || typeof input !== 'string') return { safe: true };

  const normalized = input.toLowerCase();

  // Block explicit attempts to extract server environment variables or private API keys
  const secretExtractionPatterns = [
    /(?:print|reveal|output|show|dump|expose|leak|return|echo)\s+(?:all\s+|the\s+|your\s+)?(?:process\.env|gemini_api_key|admin_api_key|cron_secret|resend_api_key|workflow_secret)/i,
    /ignore\s+(?:all\s+)?(?:previous|prior|above|system)\s+instructions[\s\S]{0,120}(?:system\s+prompt|systeminstruction|api[_\s]?key|process\.env|secret)/i,
  ];

  for (const pattern of secretExtractionPatterns) {
    if (pattern.test(normalized)) {
      return {
        safe: false,
        reason: 'Request blocked by security policy: attempts to extract server secrets or override system boundaries are prohibited.',
      };
    }
  }

  return { safe: true };
}

/**
 * Validates and bounds RAG context strings to prevent context-window DoS or injection.
 */
export function validateRagContext(ragContext: any): {
  valid: boolean;
  error?: string;
  cleanContext: string;
} {
  if (ragContext === undefined || ragContext === null || ragContext === '') {
    return { valid: true, cleanContext: '' };
  }
  if (typeof ragContext !== 'string') {
    return { valid: false, error: 'ragContext must be a string.', cleanContext: '' };
  }
  if (ragContext.length > 25000) {
    return {
      valid: false,
      error: 'ragContext exceeds maximum allowed length of 25,000 characters.',
      cleanContext: '',
    };
  }
  const injectionCheck = detectPromptInjection(ragContext);
  if (!injectionCheck.safe) {
    return { valid: false, error: injectionCheck.reason, cleanContext: '' };
  }
  return { valid: true, cleanContext: ragContext.trim() };
}

const FORBIDDEN_ATTACHMENT_EXTENSIONS = new Set([
  '.svg',
  '.svgz',
  '.html',
  '.htm',
  '.xhtml',
  '.shtml',
  '.exe',
  '.dll',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.ps1',
  '.vbs',
  '.msi',
  '.com',
  '.scr',
  '.php',
  '.jsp',
  '.asp',
  '.aspx',
  '.cgi',
  '.jar',
]);

/**
 * Validates uploaded attachments to prevent memory exhaustion, active XSS payloads (SVG/HTML),
 * executable uploads, and path traversal.
 */
export function validateAttachments(attachments: any): { valid: boolean; error?: string } {
  if (!attachments) return { valid: true };
  if (!Array.isArray(attachments)) {
    return { valid: false, error: 'Attachments must be an array.' };
  }
  if (attachments.length > 5) {
    return { valid: false, error: 'Maximum 5 attachments allowed per message.' };
  }

  for (let i = 0; i < attachments.length; i++) {
    const att = attachments[i];
    if (!att || typeof att !== 'object') {
      return { valid: false, error: `Attachment at index ${i} is invalid.` };
    }

    // Validate filename against path traversal and dangerous executable/script extensions
    if (att.name !== undefined) {
      if (typeof att.name !== 'string' || att.name.length > 255) {
        return { valid: false, error: `Attachment filename at index ${i} is invalid.` };
      }
      if (att.name.includes('..') || att.name.includes('/') || att.name.includes('\\') || att.name.includes('\0')) {
        return { valid: false, error: `Attachment "${att.name}" contains forbidden path characters.` };
      }
      const lowerName = att.name.toLowerCase().trim();
      const dotIdx = lowerName.lastIndexOf('.');
      if (dotIdx !== -1) {
        const ext = lowerName.slice(dotIdx);
        if (FORBIDDEN_ATTACHMENT_EXTENSIONS.has(ext)) {
          return {
            valid: false,
            error: `Attachment "${att.name}" uses a restricted executable or active-script file type (${ext}).`,
          };
        }
      }
    }

    // Check base64 size limits (< 15MB string length which corresponds to ~10MB binary)
    if (att.previewUrl && typeof att.previewUrl === 'string') {
      if (att.previewUrl.length > 15 * 1024 * 1024) {
        return { valid: false, error: `Attachment "${att.name || i}" exceeds 10MB size limit.` };
      }
      const lowerUrl = att.previewUrl.slice(0, 64).toLowerCase();
      if (
        lowerUrl.startsWith('data:image/svg') ||
        lowerUrl.startsWith('data:text/html') ||
        lowerUrl.startsWith('data:application/xhtml') ||
        lowerUrl.startsWith('javascript:')
      ) {
        return {
          valid: false,
          error: `Attachment "${att.name || i}" contains an active script or SVG/HTML data URI that is not permitted.`,
        };
      }
    }
    if (att.content && typeof att.content === 'string') {
      if (att.content.length > 100000) {
        return { valid: false, error: `Text document "${att.name || i}" exceeds 100,000 characters.` };
      }
    }
  }

  return { valid: true };
}

/**
 * Sanitizes internal server error messages so stack traces, file paths, or keys are never leaked.
 */
export function sanitizeServerError(err: any, fallbackMessage = 'An unexpected server error occurred.'): string {
  if (!err || typeof err.message !== 'string') return fallbackMessage;
  const msg = err.message
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_KEY]')
    .replace(/re_[0-9A-Za-z_-]{15,}/g, '[REDACTED_KEY]')
    .replace(/\/app\/applet[^\s:]*/g, '[INTERNAL_PATH]');
  return msg.slice(0, 240) || fallbackMessage;
}

