import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { verifyFirebaseIdToken } from '../authVerification';
import { generalApiRateLimiter, feedbackRateLimiter } from '../security';
import { enforceFeatureAccessForRequest } from '../compliance/ageAssurance';
import {
  getIntegrationVaultSecret,
  getOAuthCredentialsForEnv,
  getAppUrl,
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

interface EncryptedTokenRecord {
  uid: string;
  providerId: string;
  ivHex: string;
  authTagHex: string;
  cipherTextHex: string;
  scopes: string[];
  connectedAt: string;
}

interface PendingOAuthState {
  state: string;
  uid: string;
  providerId: string;
  expiresAt: number;
}

const VAULT_FILE = path.resolve(process.cwd(), 'data', 'integrations_vault.json');
const pendingOAuthStates = new Map<string, PendingOAuthState>();

function deriveVaultKey(): Buffer {
  const { secret } = getIntegrationVaultSecret();
  return crypto.scryptSync(secret, 'vizra-oauth-vault-v1', 32);
}

export function encryptTokenPayload(payload: {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}): { ivHex: string; authTagHex: string; cipherTextHex: string } {
  const iv = crypto.randomBytes(12);
  const key = deriveVaultKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf-8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    cipherTextHex: encrypted.toString('hex'),
  };
}

export function decryptTokenPayload(encrypted: {
  ivHex: string;
  authTagHex: string;
  cipherTextHex: string;
}): { accessToken: string; refreshToken?: string; expiresAt?: number } | null {
  try {
    const key = deriveVaultKey();
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
    return JSON.parse(decrypted.toString('utf-8'));
  } catch {
    return null;
  }
}

function loadVault(): EncryptedTokenRecord[] {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // Fallback empty
  }
  return [];
}

function saveVault(records: EncryptedTokenRecord[]): void {
  try {
    const dir = path.dirname(VAULT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(VAULT_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch {
    // Ephemeral fallback
  }
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
  // Catalog & per-user connection status (never exposes stored tokens)
  app.get('/api/integrations', generalApiRateLimiter.getMiddleware(), async (req, res) => {
    const uid = await resolveOptionalUid(req);
    const vault = loadVault();

    const providers = WORKSPACE_OAUTH_CATALOG.map((spec) => {
      const configured = isProviderConfigured(spec);
      const userRecord = uid
        ? vault.find((r) => r.uid === uid && r.providerId === spec.id)
        : undefined;

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
        status: userRecord
          ? ('connected' as const)
          : configured
          ? ('connect' as const)
          : ('coming_soon' as const),
        connectedAt: userRecord?.connectedAt,
      };
    });

    res.json({
      success: true,
      authenticated: Boolean(uid),
      providers,
    });
  });

  // Initiate real OAuth popup flow (fails honestly with 424 if provider OAuth credentials are unset)
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
        res.status(400).send(`OAuth authorization cancelled or denied: ${oauthError.replace(/</g, '&lt;')}`);
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

        const vault = loadVault().filter(
          (r) => !(r.uid === pending.uid && r.providerId === spec.id)
        );
        vault.unshift({
          uid: pending.uid,
          providerId: spec.id,
          ...encrypted,
          scopes: spec.scopes,
          connectedAt: new Date().toISOString(),
        });
        saveVault(vault);

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

      const vault = loadVault();
      const target = vault.find((r) => r.uid === uid && r.providerId === spec.id);
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

      const remaining = vault.filter((r) => !(r.uid === uid && r.providerId === spec.id));
      saveVault(remaining);

      res.json({
        success: true,
        provider: spec.id,
        disconnected: true,
      });
    }
  );
}
