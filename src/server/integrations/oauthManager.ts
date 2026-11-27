import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { verifyFirebaseIdToken } from '../authVerification';
import { generalApiRateLimiter, feedbackRateLimiter } from '../security';
import { enforceFeatureAccessForRequest } from '../compliance/ageAssurance';
import {
  getIntegrationVaultSecret,
  getIntegrationVaultSecretKeys,
  getOAuthCredentialsForEnv,
  getAppUrl,
  isProductionEnv,
  computeSecretFingerprint,
} from '../config/envConfig';

export interface WorkspaceProviderSpec {
  id:
    | 'google_drive'
    | 'google_docs'
    | 'google_sheets'
    | 'notion'
    | 'github'
    | 'figma'
    | 'canva'
    | 'youtube';
  name: string;
  category: 'productivity' | 'development' | 'creator';
  icon: string;
  description: string;
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  isGoogleWorkspace1P: boolean;
}

export const WORKSPACE_OAUTH_CATALOG: WorkspaceProviderSpec[] = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    category: 'productivity',
    icon: 'folder',
    description: 'Read user-selected Drive documents, PDFs, and studio assets via OAuth 2.0.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    clientIdEnv: 'OAUTH_GOOGLE_CLIENT_ID',
    clientSecretEnv: 'OAUTH_GOOGLE_CLIENT_SECRET',
    isGoogleWorkspace1P: true,
  },
  {
    id: 'google_docs',
    name: 'Google Docs',
    category: 'productivity',
    icon: 'file-text',
    description: 'Import creative briefs and outlines with least-privilege Docs readonly scope.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: ['https://www.googleapis.com/auth/documents.readonly'],
    clientIdEnv: 'OAUTH_GOOGLE_CLIENT_ID',
    clientSecretEnv: 'OAUTH_GOOGLE_CLIENT_SECRET',
    isGoogleWorkspace1P: true,
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    category: 'productivity',
    icon: 'table',
    description: 'Analyze tabular budgets and shot lists with readonly Sheets scope.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    clientIdEnv: 'OAUTH_GOOGLE_CLIENT_ID',
    clientSecretEnv: 'OAUTH_GOOGLE_CLIENT_SECRET',
    isGoogleWorkspace1P: true,
  },
  {
    id: 'notion',
    name: 'Notion Workspace',
    category: 'productivity',
    icon: 'book-open',
    description: 'Read authorized project databases and brand guidelines via Notion OAuth.',
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: ['read_content'],
    clientIdEnv: 'OAUTH_NOTION_CLIENT_ID',
    clientSecretEnv: 'OAUTH_NOTION_CLIENT_SECRET',
    isGoogleWorkspace1P: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'development',
    icon: 'github',
    description: 'Inspect user-selected repositories and pull requests with read-only OAuth scope.',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user', 'public_repo'],
    clientIdEnv: 'OAUTH_GITHUB_CLIENT_ID',
    clientSecretEnv: 'OAUTH_GITHUB_CLIENT_SECRET',
    isGoogleWorkspace1P: false,
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'development',
    icon: 'figma',
    description: 'Inspect design tokens and component hierarchies via Figma OAuth.',
    authUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://api.figma.com/v1/oauth/token',
    scopes: ['file_read'],
    clientIdEnv: 'OAUTH_FIGMA_CLIENT_ID',
    clientSecretEnv: 'OAUTH_FIGMA_CLIENT_SECRET',
    isGoogleWorkspace1P: false,
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'creator',
    icon: 'layout',
    description: 'Sync storyboard thumbnails and brand templates via Canva Connect OAuth.',
    authUrl: 'https://www.canva.com/api/oauth/authorize',
    tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
    revokeUrl: 'https://api.canva.com/rest/v1/oauth/revoke',
    scopes: ['design:meta:read'],
    clientIdEnv: 'OAUTH_CANVA_CLIENT_ID',
    clientSecretEnv: 'OAUTH_CANVA_CLIENT_SECRET',
    isGoogleWorkspace1P: false,
  },
  {
    id: 'youtube',
    name: 'YouTube Creator Studio',
    category: 'creator',
    icon: 'video',
    description: 'Read creator channel analytics and video metadata with readonly YouTube scope.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    clientIdEnv: 'OAUTH_GOOGLE_CLIENT_ID',
    clientSecretEnv: 'OAUTH_GOOGLE_CLIENT_SECRET',
    isGoogleWorkspace1P: true,
  },
];

export interface EncryptedTokenRecord {
  uid: string;
  providerId: string;
  ivHex: string;
  authTagHex: string;
  cipherTextHex: string;
  keyVersion?: 'v1' | 'v2';
  keyFingerprint?: string;
  scopes: string[];
  connectedAt: string;
  rotatedAt?: string;
}

interface PendingOAuthState {
  state: string;
  uid: string;
  providerId: string;
  expiresAt: number;
}

const VAULT_FILE = path.resolve(process.cwd(), 'data', 'integrations_vault.json');
const pendingOAuthStates = new Map<string, PendingOAuthState>();
const derivedVaultKeyCache = new Map<string, Buffer>();
// In non-production dev mode when INTEGRATION_TOKEN_SECRET is unset, keep tokens strictly in memory
// so ephemeral per-process ciphertexts never overwrite or pollute persistent disk storage.
let ephemeralVaultMemory: EncryptedTokenRecord[] = [];

function deriveVaultKeyForSecret(secret: string): Buffer {
  const digest = computeSecretFingerprint(secret) + ':' + secret.length;
  const cached = derivedVaultKeyCache.get(digest);
  if (cached) return cached;
  const derived = crypto.scryptSync(secret, 'vizra-oauth-vault-v1', 32);
  if (derivedVaultKeyCache.size > 32) {
    const oldest = derivedVaultKeyCache.keys().next().value;
    if (oldest) derivedVaultKeyCache.delete(oldest);
  }
  derivedVaultKeyCache.set(digest, derived);
  return derived;
}

export function encryptTokenPayload(
  payload: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  },
  overrideSecret?: string
): {
  ivHex: string;
  authTagHex: string;
  cipherTextHex: string;
  keyVersion: 'v2';
  keyFingerprint: string;
} {
  const activeSecret = overrideSecret || getIntegrationVaultSecret().secret;
  const keyFingerprint = computeSecretFingerprint(activeSecret);
  const iv = crypto.randomBytes(12);
  const key = deriveVaultKeyForSecret(activeSecret);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf-8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    cipherTextHex: encrypted.toString('hex'),
    keyVersion: 'v2',
    keyFingerprint,
  };
}

export function decryptTokenPayloadWithMeta(
  encrypted: {
    ivHex: string;
    authTagHex: string;
    cipherTextHex: string;
    keyVersion?: string;
    keyFingerprint?: string;
  },
  candidateSecretsOverride?: string[]
): {
  payload: { accessToken: string; refreshToken?: string; expiresAt?: number };
  matchedPrimaryKey: boolean;
  keyFingerprint: string;
} | null {
  const { primary, previous } = getIntegrationVaultSecretKeys();
  const secretPool: Array<{ secret: string; keyFingerprint: string; isPrimary: boolean }> = [];

  if (candidateSecretsOverride && candidateSecretsOverride.length > 0) {
    for (const s of candidateSecretsOverride) {
      secretPool.push({
        secret: s,
        keyFingerprint: computeSecretFingerprint(s),
        isPrimary: s === primary.secret,
      });
    }
  } else {
    secretPool.push({
      secret: primary.secret,
      keyFingerprint: primary.keyFingerprint,
      isPrimary: true,
    });
    for (const prev of previous) {
      secretPool.push({
        secret: prev.secret,
        keyFingerprint: prev.keyFingerprint,
        isPrimary: false,
      });
    }
  }

  // Prioritize the candidate matching the record's recorded fingerprint (zero key material stored)
  const orderedPool = encrypted.keyFingerprint
    ? [
        ...secretPool.filter((entry) => entry.keyFingerprint === encrypted.keyFingerprint),
        ...secretPool.filter((entry) => entry.keyFingerprint !== encrypted.keyFingerprint),
      ]
    : secretPool;

  for (const candidate of orderedPool) {
    try {
      const key = deriveVaultKeyForSecret(candidate.secret);
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(encrypted.ivHex, 'hex')
      );
      decipher.setAuthTag(Buffer.from(encrypted.authTagHex, 'hex'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted.cipherTextHex, 'hex')),
        decipher.final(),
      ]);
      const parsed = JSON.parse(decrypted.toString('utf-8'));
      if (parsed && typeof parsed.accessToken === 'string') {
        return {
          payload: parsed,
          matchedPrimaryKey: candidate.isPrimary,
          keyFingerprint: candidate.keyFingerprint,
        };
      }
    } catch {
      // Try next rotation key
    }
  }

  return null;
}

export function decryptTokenPayload(
  encrypted: {
    ivHex: string;
    authTagHex: string;
    cipherTextHex: string;
    keyVersion?: string;
    keyFingerprint?: string;
  },
  candidateSecretsOverride?: string[]
): { accessToken: string; refreshToken?: string; expiresAt?: number } | null {
  const result = decryptTokenPayloadWithMeta(encrypted, candidateSecretsOverride);
  return result ? result.payload : null;
}

function loadDiskVault(vaultFilePath = VAULT_FILE): EncryptedTokenRecord[] {
  try {
    if (fs.existsSync(vaultFilePath)) {
      const parsed = JSON.parse(fs.readFileSync(vaultFilePath, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // Fallback empty
  }
  return [];
}

function saveDiskVault(records: EncryptedTokenRecord[], vaultFilePath = VAULT_FILE): void {
  const dir = path.dirname(vaultFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(vaultFilePath, JSON.stringify(records, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

function loadActiveVault(): EncryptedTokenRecord[] {
  const { persistent } = getIntegrationVaultSecret();
  if (!persistent) {
    // Combine in-memory ephemeral records with any readable persistent records without mutating disk
    const disk = loadDiskVault();
    return [...ephemeralVaultMemory, ...disk];
  }
  return loadDiskVault();
}

function saveActiveVault(records: EncryptedTokenRecord[]): { persistedToDisk: boolean } {
  const { persistent } = getIntegrationVaultSecret();
  if (!persistent) {
    ephemeralVaultMemory = records;
    return { persistedToDisk: false };
  }
  try {
    saveDiskVault(records);
    return { persistedToDisk: true };
  } catch {
    ephemeralVaultMemory = records;
    return { persistedToDisk: false };
  }
}

/**
 * Re-encrypts any v1 or rotated-key token records onto the current primary INTEGRATION_TOKEN_SECRET.
 */
export function rotateVaultTokensToPrimaryKey(vaultFilePath = VAULT_FILE): {
  total: number;
  reencrypted: number;
  undecryptable: number;
} {
  const { persistent, secret, keyFingerprint } = getIntegrationVaultSecretKeys().primary;
  if (!persistent) {
    return { total: ephemeralVaultMemory.length, reencrypted: 0, undecryptable: 0 };
  }
  const records = loadDiskVault(vaultFilePath);
  let reencrypted = 0;
  let undecryptable = 0;
  let changed = false;

  const updated = records.map((rec) => {
    const decrypted = decryptTokenPayloadWithMeta(rec);
    if (!decrypted) {
      undecryptable += 1;
      return rec;
    }
    const needsUpgrade =
      !decrypted.matchedPrimaryKey ||
      rec.keyVersion !== 'v2' ||
      rec.keyFingerprint !== keyFingerprint;
    if (!needsUpgrade) return rec;

    const fresh = encryptTokenPayload(decrypted.payload, secret);
    reencrypted += 1;
    changed = true;
    return {
      ...rec,
      ...fresh,
      rotatedAt: new Date().toISOString(),
    };
  });

  if (changed) {
    saveDiskVault(updated, vaultFilePath);
  }
  return { total: records.length, reencrypted, undecryptable };
}

export function purgeVaultRecordsForUser(uid: string): number {
  if (!uid) return 0;
  let removed = 0;
  const beforeMem = ephemeralVaultMemory.length;
  ephemeralVaultMemory = ephemeralVaultMemory.filter((r) => r.uid !== uid);
  removed += beforeMem - ephemeralVaultMemory.length;

  const disk = loadDiskVault();
  const filteredDisk = disk.filter((r) => r.uid !== uid);
  if (filteredDisk.length !== disk.length) {
    removed += disk.length - filteredDisk.length;
    try {
      saveDiskVault(filteredDisk);
    } catch {
      // Ignore read-only disk error
    }
  }
  return removed;
}

export function isProviderConfigured(spec: WorkspaceProviderSpec): boolean {
  return getOAuthCredentialsForEnv(spec.clientIdEnv, spec.clientSecretEnv).configured;
}

function resolveCallbackUrl(providerId: string, req: express.Request): string {
  const baseUrl = getAppUrl(req.protocol, req.get('host') || 'localhost:3000');
  return `${baseUrl}/api/integrations/${providerId}/callback`;
}

async function resolveOptionalUid(req: express.Request): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const verified = await verifyFirebaseIdToken(authHeader.slice(7).trim());
    return verified.valid && verified.uid ? verified.uid : null;
  } catch {
    return null;
  }
}

export function setupIntegrationsRoutes(app: express.Application): void {
  // Catalog & per-user connection status (verifies ciphertext decryptability and never exposes stored tokens)
  app.get('/api/integrations', generalApiRateLimiter.getMiddleware(), async (req, res) => {
    const uid = await resolveOptionalUid(req);
    const { persistent } = getIntegrationVaultSecret();
    const vault = loadActiveVault();
    let reencryptedOnRead = false;

    const updatedVault = [...vault];
    const providers = WORKSPACE_OAUTH_CATALOG.map((spec) => {
      const configured = isProviderConfigured(spec);
      const recordIdx = uid
        ? updatedVault.findIndex((r) => r.uid === uid && r.providerId === spec.id)
        : -1;
      const userRecord = recordIdx >= 0 ? updatedVault[recordIdx] : undefined;

      let decryptable = false;
      let staleUndecryptable = false;
      if (userRecord) {
        const decrypted = decryptTokenPayloadWithMeta(userRecord);
        if (decrypted) {
          decryptable = true;
          if (
            persistent &&
            (!decrypted.matchedPrimaryKey || userRecord.keyVersion !== 'v2')
          ) {
            const refreshed = encryptTokenPayload(decrypted.payload);
            updatedVault[recordIdx] = {
              ...userRecord,
              ...refreshed,
              rotatedAt: new Date().toISOString(),
            };
            reencryptedOnRead = true;
          }
        } else {
          staleUndecryptable = true;
        }
      }

      return {
        id: spec.id,
        name: spec.name,
        category: spec.category,
        icon: spec.icon,
        description: spec.description,
        configured,
        isGoogleWorkspace1P: spec.isGoogleWorkspace1P,
        scopes: spec.scopes,
        requiredEnvVars: [spec.clientIdEnv, spec.clientSecretEnv],
        status: decryptable
          ? ('connected' as const)
          : configured
          ? ('connect' as const)
          : ('coming_soon' as const),
        connectedAt: decryptable ? userRecord?.connectedAt : undefined,
        ...(staleUndecryptable ? { requiresReauthentication: true } : {}),
      };
    });

    if (reencryptedOnRead && persistent) {
      saveActiveVault(updatedVault);
    }

    res.json({
      success: true,
      authenticated: Boolean(uid),
      vaultPersistent: persistent,
      providers,
    });
  });

  // Initiate real OAuth popup flow (fails honestly with 424 if provider OAuth credentials are unset,
  // or 503 VAULT_ENCRYPTION_KEY_MISSING in production if INTEGRATION_TOKEN_SECRET is unset)
  app.get(
    '/api/integrations/:provider/auth-url',
    feedbackRateLimiter.getMiddleware(),
    async (req, res) => {
      const uid = await resolveOptionalUid(req);
      if (!uid) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Sign in with a verified VIZRA account before connecting external workspaces.',
          },
        });
        return;
      }

      if (isProductionEnv() && !getIntegrationVaultSecret().persistent) {
        res.status(503).json({
          error: {
            code: 'VAULT_ENCRYPTION_KEY_MISSING',
            message:
              'Server INTEGRATION_TOKEN_SECRET must be configured in production before storing encrypted OAuth credentials.',
          },
        });
        return;
      }

      const ageGate = await enforceFeatureAccessForRequest(req, 'third_party_workspace_oauth');
      if (!ageGate.allowed) {
        res.status(ageGate.status).json({
          error: {
            code: ageGate.code,
            message: ageGate.message,
          },
        });
        return;
      }

      const spec = WORKSPACE_OAUTH_CATALOG.find((p) => p.id === req.params.provider);
      if (!spec) {
        res.status(404).json({
          error: {
            code: 'UNKNOWN_PROVIDER',
            message: 'Requested workspace integration provider does not exist.',
          },
        });
        return;
      }

      if (!isProviderConfigured(spec)) {
        res.status(424).json({
          configured: false,
          error: {
            code: 'PROVIDER_CREDENTIALS_MISSING',
            message: `${spec.name} requires external OAuth app approval and configured client credentials (${spec.clientIdEnv}, ${spec.clientSecretEnv}).`,
            requiredEnvVars: [spec.clientIdEnv, spec.clientSecretEnv],
          },
        });
        return;
      }

      const oauthCreds = getOAuthCredentialsForEnv(spec.clientIdEnv, spec.clientSecretEnv);
      const state = crypto.randomBytes(24).toString('hex');
      pendingOAuthStates.set(state, {
        state,
        uid,
        providerId: spec.id,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      const redirectUri = resolveCallbackUrl(spec.id, req);
      const params = new URLSearchParams({
        client_id: oauthCreds.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: spec.scopes.join(' '),
        state,
      });

      if (spec.isGoogleWorkspace1P) {
        params.set('access_type', 'offline');
        params.set('include_granted_scopes', 'true');
        params.set('prompt', 'consent');
      }

      res.json({
        success: true,
        provider: spec.id,
        authUrl: `${spec.authUrl}?${params.toString()}`,
        redirectUri,
      });
    }
  );

  // OAuth callback handler: validates CSRF state, exchanges authorization code, stores AES-256-GCM encrypted token
  app.get(
    '/api/integrations/:provider/callback',
    generalApiRateLimiter.getMiddleware(),
    async (req, res) => {
      const { code, state, error: oauthError } = req.query;
      const spec = WORKSPACE_OAUTH_CATALOG.find((p) => p.id === req.params.provider);
      if (!spec) {
        res.status(404).send('Unknown integration provider.');
        return;
      }

      if (typeof oauthError === 'string' && oauthError) {
        const safeError = oauthError.replace(/[<>&"'`]/g, '').slice(0, 120);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(400).send(`OAuth authorization cancelled or denied: ${safeError}`);
        return;
      }

      if (typeof state !== 'string' || !pendingOAuthStates.has(state)) {
        res.status(400).send('Invalid or expired OAuth CSRF state parameter.');
        return;
      }

      const pending = pendingOAuthStates.get(state)!;
      pendingOAuthStates.delete(state);

      if (pending.providerId !== spec.id || Date.now() > pending.expiresAt) {
        res.status(400).send('OAuth state validation failed or expired.');
        return;
      }

      if (typeof code !== 'string' || !code.trim()) {
        res.status(400).send('Authorization code missing from OAuth callback.');
        return;
      }

      if (!isProviderConfigured(spec)) {
        res.status(424).send('OAuth provider credentials are not configured on server.');
        return;
      }

      if (isProductionEnv() && !getIntegrationVaultSecret().persistent) {
        res
          .status(503)
          .send('OAuth token storage unavailable: INTEGRATION_TOKEN_SECRET must be configured in production.');
        return;
      }

      try {
        const oauthCreds = getOAuthCredentialsForEnv(spec.clientIdEnv, spec.clientSecretEnv);
        const redirectUri = resolveCallbackUrl(spec.id, req);
        const bodyParams = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code.trim(),
          redirect_uri: redirectUri,
          client_id: oauthCreds.clientId,
          client_secret: oauthCreds.clientSecret,
        });

        const tokenRes = await fetch(spec.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: bodyParams.toString(),
          signal: AbortSignal.timeout(10000),
        });

        if (!tokenRes.ok) {
          res.status(502).send('Failed to exchange OAuth authorization code with provider.');
          return;
        }

        const tokenJson: any = await tokenRes.json();
        const accessToken = tokenJson?.access_token;
        if (typeof accessToken !== 'string' || !accessToken) {
          res.status(502).send('Provider did not return an access token.');
          return;
        }

        const encrypted = encryptTokenPayload({
          accessToken,
          refreshToken: typeof tokenJson.refresh_token === 'string' ? tokenJson.refresh_token : undefined,
          expiresAt:
            typeof tokenJson.expires_in === 'number'
              ? Date.now() + tokenJson.expires_in * 1000
              : undefined,
        });

        const { persistent } = getIntegrationVaultSecret();
        const vault = (persistent ? loadDiskVault() : ephemeralVaultMemory).filter(
          (r) => !(r.uid === pending.uid && r.providerId === spec.id)
        );
        vault.unshift({
          uid: pending.uid,
          providerId: spec.id,
          ...encrypted,
          scopes: spec.scopes,
          connectedAt: new Date().toISOString(),
        });
        saveActiveVault(vault);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(`<!doctype html><html><body><script>
          if (window.opener) {
            window.opener.postMessage({ type: 'vizra_oauth_callback', provider: ${JSON.stringify(spec.id)}, success: true }, window.location.origin);
            window.close();
          }
        </script><p>Authentication complete. You may close this window.</p></body></html>`);
      } catch {
        res.status(502).send('Error completing OAuth token exchange.');
      }
    }
  );

  // Disconnect & upstream token revocation
  app.post(
    '/api/integrations/:provider/disconnect',
    feedbackRateLimiter.getMiddleware(),
    async (req, res) => {
      const uid = await resolveOptionalUid(req);
      if (!uid) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to disconnect workspace integrations.',
          },
        });
        return;
      }

      const spec = WORKSPACE_OAUTH_CATALOG.find((p) => p.id === req.params.provider);
      if (!spec) {
        res.status(404).json({
          error: {
            code: 'UNKNOWN_PROVIDER',
            message: 'Unknown provider.',
          },
        });
        return;
      }

      const diskVault = loadDiskVault();
      const target =
        ephemeralVaultMemory.find((r) => r.uid === uid && r.providerId === spec.id) ||
        diskVault.find((r) => r.uid === uid && r.providerId === spec.id);
      if (target && spec.revokeUrl) {
        const decrypted = decryptTokenPayload(target);
        if (decrypted?.accessToken) {
          try {
            await fetch(`${spec.revokeUrl}?token=${encodeURIComponent(decrypted.accessToken)}`, {
              method: 'POST',
              signal: AbortSignal.timeout(5000),
            });
          } catch {
            // Continue local vault deletion even if upstream revoke network fails
          }
        }
      }

      ephemeralVaultMemory = ephemeralVaultMemory.filter(
        (r) => !(r.uid === uid && r.providerId === spec.id)
      );
      const remainingDisk = diskVault.filter((r) => !(r.uid === uid && r.providerId === spec.id));
      if (remainingDisk.length !== diskVault.length) {
        try {
          saveDiskVault(remainingDisk);
        } catch {
          // Ignore write failure on read-only FS
        }
      }

      res.json({
        success: true,
        provider: spec.id,
        disconnected: true,
      });
    }
  );
}
