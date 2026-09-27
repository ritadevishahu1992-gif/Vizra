import { Integration } from '../types/ai';

const INTEGRATIONS_STORAGE_KEY = 'vizra_omnia_integrations_v1';

export const INITIAL_INTEGRATIONS: Integration[] = [
  // Files
  {
    id: 'local_files',
    name: 'Local Files & Media',
    category: 'files',
    icon: 'hard-drive',
    description: 'Direct upload for images, videos, audio, PDF, and spreadsheets.',
    status: 'connected',
    scopeRequired: 'Read file contents in current session',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    category: 'productivity',
    icon: 'folder',
    description: 'Read and analyze docs, PDFs, and assets from Google Drive.',
    status: 'connect',
    scopeRequired: 'Allow Omnia to access the files and folders you choose.',
  },
  {
    id: 'google_docs',
    name: 'Google Docs',
    category: 'productivity',
    icon: 'file-text',
    description: 'Import outlines, scripts, and export finished creative briefs.',
    status: 'connect',
    scopeRequired: 'Read and write selected Google Docs documents.',
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    category: 'productivity',
    icon: 'table',
    description: 'Analyze tabular datasets, financial models, and shot lists.',
    status: 'connect',
    scopeRequired: 'Read spreadsheet values and column headers.',
  },
  {
    id: 'notion',
    name: 'Notion Workspace',
    category: 'productivity',
    icon: 'book-open',
    description: 'Sync project tasks, research databases, and brand guidelines.',
    status: 'connect',
    scopeRequired: 'Read selected pages and databases in your workspace.',
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'development',
    icon: 'github',
    description: 'Review repositories, analyze codebases, generate PR summaries.',
    status: 'connect',
    scopeRequired: 'Read public repositories and selected user projects.',
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'development',
    icon: 'figma',
    description: 'Inspect design tokens, component hierarchies, and vector assets.',
    status: 'connect',
    scopeRequired: 'Read design file nodes, styles, and color components.',
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'creator',
    icon: 'layout',
    description: 'Export storyboard thumbnails and social templates.',
    status: 'coming_soon',
    scopeRequired: 'Creator API bridge (in private beta testing).',
  },
  {
    id: 'youtube',
    name: 'YouTube Creator Studio',
    category: 'creator',
    icon: 'video',
    description: 'Inspect channel analytics, audience retention curves, and tags.',
    status: 'connect',
    scopeRequired: 'Read channel video metadata and caption transcripts.',
  },
];

export function getIntegrations(): Integration[] {
  try {
    const raw = localStorage.getItem(INTEGRATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(INITIAL_INTEGRATIONS));
      return INITIAL_INTEGRATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INTEGRATIONS;
  }
}

export function saveIntegrations(list: Integration[]): void {
  try {
    localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save integrations', err);
  }
}

export function updateIntegrationStatus(id: string, status: Integration['status']): Integration[] {
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
