import { Integration } from '../types/ai';

const INTEGRATIONS_STORAGE_KEY = 'vizra_omnia_integrations_v1';

export const INITIAL_INTEGRATIONS: Integration[] = [
  // Files
  {
    id: 'local_files',
    name: 'Local Files & Media',
    category: 'files',
    icon: 'hard-drive',
    description: 'Direct upload for images, text, code, JSON, and CSV datasets in the current session.',
    status: 'connected',
    scopeRequired: 'Read file contents in current session',
    configured: true,
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    category: 'productivity',
    icon: 'folder',
    description: 'Read user-selected Drive docs, PDFs, and assets via OAuth 2.0 (external OAuth approval required).',
    status: 'coming_soon',
    scopeRequired: 'https://www.googleapis.com/auth/drive.readonly',
    configured: false,
    requiredEnvVars: ['OAUTH_GOOGLE_CLIENT_ID'],
    isGoogleWorkspace1P: true,
  },
  {
    id: 'google_docs',
    name: 'Google Docs',
    category: 'productivity',
    icon: 'file-text',
    description: 'Import outlines and scripts via readonly Google Docs OAuth (external OAuth approval required).',
    status: 'coming_soon',
    scopeRequired: 'https://www.googleapis.com/auth/documents.readonly',
    configured: false,
    requiredEnvVars: ['OAUTH_GOOGLE_CLIENT_ID'],
    isGoogleWorkspace1P: true,
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    category: 'productivity',
    icon: 'table',
    description: 'Analyze tabular datasets and shot lists via readonly Sheets OAuth (external OAuth approval required).',
    status: 'coming_soon',
    scopeRequired: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    configured: false,
    requiredEnvVars: ['OAUTH_GOOGLE_CLIENT_ID'],
    isGoogleWorkspace1P: true,
  },
  {
    id: 'notion',
    name: 'Notion Workspace',
    category: 'productivity',
    icon: 'book-open',
    description: 'Sync authorized project tasks and brand databases via Notion OAuth (external credentials required).',
    status: 'coming_soon',
    scopeRequired: 'read_content',
    configured: false,
    requiredEnvVars: ['OAUTH_NOTION_CLIENT_ID', 'OAUTH_NOTION_CLIENT_SECRET'],
    isGoogleWorkspace1P: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'development',
    icon: 'github',
    description: 'Review user-selected repositories and PRs via read-only OAuth (external OAuth app required).',
    status: 'coming_soon',
    scopeRequired: 'read:user public_repo',
    configured: false,
    requiredEnvVars: ['OAUTH_GITHUB_CLIENT_ID', 'OAUTH_GITHUB_CLIENT_SECRET'],
    isGoogleWorkspace1P: false,
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'development',
    icon: 'figma',
    description: 'Inspect design tokens and component hierarchies via Figma OAuth (external OAuth app required).',
    status: 'coming_soon',
    scopeRequired: 'file_read',
    configured: false,
    requiredEnvVars: ['OAUTH_FIGMA_CLIENT_ID', 'OAUTH_FIGMA_CLIENT_SECRET'],
    isGoogleWorkspace1P: false,
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'creator',
    icon: 'layout',
    description: 'Sync storyboard thumbnails via Canva Connect OAuth (external app approval required).',
    status: 'coming_soon',
    scopeRequired: 'design:meta:read',
    configured: false,
    requiredEnvVars: ['OAUTH_CANVA_CLIENT_ID', 'OAUTH_CANVA_CLIENT_SECRET'],
    isGoogleWorkspace1P: false,
  },
  {
    id: 'youtube',
    name: 'YouTube Creator Studio',
    category: 'creator',
    icon: 'video',
    description: 'Inspect channel analytics via readonly YouTube OAuth (external OAuth approval required).',
    status: 'coming_soon',
    scopeRequired: 'https://www.googleapis.com/auth/youtube.readonly',
    configured: false,
    requiredEnvVars: ['OAUTH_GOOGLE_CLIENT_ID'],
    isGoogleWorkspace1P: true,
  },
];

export function getIntegrations(): Integration[] {
  return INITIAL_INTEGRATIONS;
}

export function saveIntegrations(list: Integration[]): void {
  try {
    localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save integrations', err);
  }
}

export function updateIntegrationStatus(id: string, status: Integration['status']): Integration[] {
  // Only local_files can be toggled synchronously without a verified server-side OAuth token exchange
  if (id !== 'local_files') {
    return INITIAL_INTEGRATIONS;
  }
  const current = getIntegrations();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        connectedAt: status === 'connected' ? new Date().toLocaleDateString() : undefined,
      };
    }
    return item;
  });
  saveIntegrations(updated);
  return updated;
}

export async function fetchServerIntegrations(idToken?: string | null): Promise<Integration[]> {
  try {
    const headers: Record<string, string> = {};
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }
    const res = await fetch('/api/integrations', { headers });
    if (!res.ok) return INITIAL_INTEGRATIONS;
    const data = await res.json();
    if (!Array.isArray(data?.providers)) return INITIAL_INTEGRATIONS;

    const remoteMap = new Map<string, any>();
    for (const p of data.providers) {
      remoteMap.set(p.id, p);
    }

    return INITIAL_INTEGRATIONS.map((item) => {
      if (item.id === 'local_files') return item;
      const remote = remoteMap.get(item.id);
      if (!remote) return item;
      return {
        ...item,
        status: remote.status || 'coming_soon',
        configured: Boolean(remote.configured),
        connectedAt: remote.connectedAt,
        requiredEnvVars: Array.isArray(remote.requiredEnvVars) ? remote.requiredEnvVars : item.requiredEnvVars,
        scopes: Array.isArray(remote.scopes) ? remote.scopes : item.scopes,
        scopeRequired: Array.isArray(remote.scopes) ? remote.scopes.join(' ') : item.scopeRequired,
        isGoogleWorkspace1P: Boolean(remote.isGoogleWorkspace1P),
      };
    });
  } catch {
    return INITIAL_INTEGRATIONS;
  }
}

export async function initiateIntegrationOAuth(
  providerId: string,
  idToken?: string | null
): Promise<{
  ok: boolean;
  authUrl?: string;
  blockedByExternalDependency?: boolean;
  error?: string;
}> {
  if (!idToken) {
    return {
      ok: false,
      error: 'Please sign in with your VIZRA account before connecting third-party services.',
    };
  }
  try {
    const res = await fetch(`/api/integrations/${encodeURIComponent(providerId)}/auth-url`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.authUrl) {
      return {
        ok: false,
        blockedByExternalDependency: res.status === 424 || data?.error?.code === 'PROVIDER_CREDENTIALS_MISSING',
        error:
          data?.error?.message ||
          `Unable to initiate OAuth flow (HTTP ${res.status}).`,
      };
    }
    return { ok: true, authUrl: data.authUrl };
  } catch {
    return {
      ok: false,
      error: 'Network error reaching VIZRA OAuth integration backend.',
    };
  }
}

export async function disconnectServerIntegration(
  providerId: string,
  idToken?: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (providerId === 'local_files') {
    updateIntegrationStatus('local_files', 'connect');
    return { ok: true };
  }
  if (!idToken) {
    return { ok: false, error: 'Authentication required to revoke external OAuth tokens.' };
  }
  try {
    const res = await fetch(`/api/integrations/${encodeURIComponent(providerId)}/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.disconnected) {
      return { ok: false, error: data?.error?.message || 'Failed to revoke provider token.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error disconnecting integration.' };
  }
}
