import fs from 'fs';
import path from 'path';
import {
  EngageContentItem,
  EngagePartner,
  EngageCampaign,
  EngageAnalyticsEvent,
  EngageGlobalConfig,
  EngageAuditLogEntry,
  EngageAnalyticsSummary,
} from '../../types/engage';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ENGAGE_STORE_FILE = path.join(DATA_DIR, 'vizra_engage_store.json');

interface EngagePersistedState {
  config: EngageGlobalConfig;
  partners: EngagePartner[];
  campaigns: EngageCampaign[];
  content: EngageContentItem[];
  events: EngageAnalyticsEvent[];
  auditLog: EngageAuditLogEntry[];
}

const DEFAULT_CONFIG: EngageGlobalConfig = {
  enabled: true,
  sponsoredEnabled: true,
  affiliateEnabled: true,
  educationalEnabled: true,
  interactiveEnabled: true,
  collapseOnCompleteDelayMs: 350,
  rotationIntervalMs: 6500,
  maxSponsoredRatio: 0.35,
  defaultDisclosureText:
    'Independent placement via VIZRA Engage. Does not influence Omnia 1.0 answers or citations.',
  respectReducedMotion: true,
  updatedAt: Date.now(),
  updatedBy: 'system@vizra.ai',
};

const DEFAULT_PARTNERS: EngagePartner[] = [
  {
    id: 'partner-vercel',
    name: 'Vercel Cloud Platform',
    domain: 'vercel.com',
    contactEmail: 'partnerships@vercel.com',
    verified: true,
    status: 'active',
    tier: 'direct_brand',
    allowedDestinations: ['https://vercel.com', 'https://vercel.com/ai'],
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'partner-figma',
    name: 'Figma Design Systems',
    domain: 'figma.com',
    contactEmail: 'affiliates@figma.com',
    verified: true,
    status: 'active',
    tier: 'affiliate_network',
    allowedDestinations: ['https://www.figma.com', 'https://www.figma.com/design-systems'],
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'partner-vizra-studio',
    name: 'VIZRA Creative Ecosystem',
    domain: 'vizra.ai',
    contactEmail: 'studio@vizra.ai',
    verified: true,
    status: 'active',
    tier: 'ecosystem_partner',
    allowedDestinations: ['https://vizra.ai', 'https://docs.vizra.ai'],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
  },
];

const DEFAULT_CAMPAIGNS: EngageCampaign[] = [
  {
    id: 'camp-vercel-edge-2026',
    name: 'Vercel AI Cloud & Fluid Compute',
    partnerId: 'partner-vercel',
    partnerName: 'Vercel Cloud Platform',
    type: 'direct_sponsorship',
    sponsorshipLabel: 'Sponsored',
    destinationUrl: 'https://vercel.com/ai',
    affiliateParams: 'utm_source=vizra_engage&utm_medium=chat_wait',
    status: 'active',
    approvalStatus: 'approved',
    budgetUsd: 5000,
    spentUsd: 412.5,
    cpmUsd: 18,
    cpcUsd: 1.45,
    cpaUsd: 12.0,
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2027-12-31T23:59:59.000Z',
    targetModes: ['code', 'quick', 'think', 'analyze'],
    priority: 82,
    impressionGoal: 250000,
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'camp-figma-variables-2026',
    name: 'Figma Design Token Architecture',
    partnerId: 'partner-figma',
    partnerName: 'Figma Design Systems',
    type: 'affiliate',
    sponsorshipLabel: 'Affiliate',
    destinationUrl: 'https://www.figma.com/design-systems',
    affiliateParams: 'ref=vizra_creative_studio&aff_id=vz901',
    status: 'active',
    approvalStatus: 'approved',
    budgetUsd: 3200,
    spentUsd: 268.0,
    cpmUsd: 14,
    cpcUsd: 1.15,
    cpaUsd: 9.5,
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2027-12-31T23:59:59.000Z',
    targetModes: ['create', 'quick', 'research'],
    priority: 76,
    impressionGoal: 150000,
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 1,
  },
];

const DEFAULT_CONTENT: EngageContentItem[] = [
  {
    id: 'eng-vis-neural-synthesis',
    title: 'Multi-Stage Context Synthesis',
    subtitle: 'Omnia 1.0 Neural Topology',
    body: 'Omnia cross-validates semantic embeddings, structured project memory, and live verification gates in parallel before streaming tokens.',
    type: 'visualization',
    category: 'AI Architecture',
    targetModes: ['quick', 'think', 'research', 'science', 'analyze', 'code', 'create'],
    sponsorshipLabel: 'None',
    priority: 95,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 20,
    createdBy: 'system@vizra.ai',
    reviewedBy: 'ritadevishahu1992@gmail.com',
    reviewedAt: Date.now() - 86400000 * 5,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'eng-know-rag-grounding',
    title: 'How Epistemic Verification Prevents Hallucination',
    subtitle: 'Knowledge Architecture',
    body: 'Every factual claim in Research and Science mode passes through a 6-point source validation gate checking domain authority, retrieval freshness, and semantic entailment.',
    type: 'knowledge_card',
    category: 'Epistemic Governance',
    targetModes: ['research', 'science', 'think', 'analyze', 'quick'],
    sponsorshipLabel: 'None',
    priority: 90,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 12,
    createdBy: 'system@vizra.ai',
    reviewedBy: 'ritadevishahu1992@gmail.com',
    reviewedAt: Date.now() - 86400000 * 4,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'eng-tip-creative-workflow',
    title: 'Pro Tip: Convert Any Synthesis Into a 10-Stage Project',
    subtitle: 'Creative & Productivity Mastery',
    body: 'Press Cmd/Ctrl + K at any time to open the Command Palette, switch reasoning modes, or promote an architectural blueprint into a full multi-stage workspace.',
    type: 'creative_tip',
    category: 'Studio Productivity',
    targetModes: ['create', 'code', 'quick', 'think'],
    sponsorshipLabel: 'None',
    priority: 88,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 12,
    createdBy: 'system@vizra.ai',
    reviewedBy: 'ritadevishahu1992@gmail.com',
    reviewedAt: Date.now() - 86400000 * 4,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'eng-mini-micro-quiz',
    title: 'Quick Architecture Pulse',
    subtitle: 'Interactive Mini-Experience',
    body: 'Which technique best isolates tenant context in multi-project RAG pipelines?',
    type: 'mini_experience',
    category: 'Interactive Challenge',
    targetModes: ['code', 'think', 'research', 'science', 'analyze', 'quick', 'create'],
    sponsorshipLabel: 'None',
    interactiveConfig: {
      kind: 'poll',
      question: 'Which layer guarantees zero cross-tenant vector leakage during hybrid retrieval?',
      options: [
        'Strict namespace partitioning + verified UID pre-filters',
        'Post-generation regex redaction only',
        'Shared global cache with client-side filtering',
      ],
      correctIndex: 0,
      explanation:
        'Namespace partitioning combined with cryptographic UID pre-filtering prevents unauthorized embeddings from ever entering the candidate pool.',
    },
    priority: 86,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 8,
    createdBy: 'system@vizra.ai',
    reviewedBy: 'ritadevishahu1992@gmail.com',
    reviewedAt: Date.now() - 86400000 * 3,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'eng-spon-vercel-ai',
    title: 'Deploy Low-Latency AI Workloads on Vercel Fluid Compute',
    subtitle: 'Vercel Cloud Platform',
    body: 'Scale streaming inference routes, background queues, and edge middleware with zero cold-start penalties.',
    type: 'sponsored_card',
    category: 'Cloud Infrastructure',
    targetModes: ['code', 'quick', 'think', 'analyze'],
    ctaLabel: 'Explore Vercel AI',
    destinationUrl: 'https://vercel.com/ai',
    sponsorshipLabel: 'Sponsored',
    disclosureText:
      'Sponsored Partner Placement • Independent of Omnia 1.0 reasoning & citations.',
    campaignId: 'camp-vercel-edge-2026',
    partnerId: 'partner-vercel',
    priority: 78,
    approvalStatus: 'approved',
    enabled: true,
    scheduleStart: '2025-01-01T00:00:00.000Z',
    scheduleEnd: '2027-12-31T23:59:59.000Z',
    expiresAt: '2027-12-31T23:59:59.000Z',
    frequencyCapPerSession: 4,
    createdBy: 'ritadevishahu1992@gmail.com',
    reviewedBy: 'ritadevishahu1992@gmail.com',
    reviewedAt: Date.now() - 86400000 * 2,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'eng-aff-figma-tokens',
    title: 'Architect Multi-Brand Design Systems with Figma Variables',
    subtitle: 'Figma Design Systems',
    body: 'Synchronize typography scales, charcoal-and-crimson surface tokens, and interactive prototypes directly with production code.',
    type: 'affiliate_card',
    category: 'Design Tooling',
    targetModes: ['create', 'quick', 'research'],
    ctaLabel: 'Inspect Token Kit',
    destinationUrl: 'https://www.figma.com/design-systems',
    sponsorshipLabel: 'Affiliate',
    disclosureText:
      'Affiliate Recommendation • VIZRA may earn a commission at no cost to you. Never influences AI answers.',
    campaignId: 'camp-figma-variables-2026',
    partnerId: 'partner-figma',
    affiliateCode: 'vz901',
    priority: 74,
    approvalStatus: 'approved',
    enabled: true,
    scheduleStart: '2025-01-01T00:00:00.000Z',
    scheduleEnd: '2027-12-31T23:59:59.000Z',
    expiresAt: '2027-12-31T23:59:59.000Z',
    frequencyCapPerSession: 4,
    createdBy: 'ritadevishahu1992@gmail.com',
    reviewedBy: 'ritadevishahu1992@gmail.com',
    reviewedAt: Date.now() - 86400000 * 2,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'eng-pending-sample',
    title: 'Quantum Protein Folding Benchmarks 2026',
    subtitle: 'Pending Editorial Review',
    body: 'Comparative latency benchmarks for AlphaFold 3 structural docking workflows in computational biology.',
    type: 'knowledge_card',
    category: 'Scientific Computing',
    targetModes: ['science', 'research'],
    sponsorshipLabel: 'None',
    priority: 70,
    approvalStatus: 'pending_review',
    enabled: true,
    frequencyCapPerSession: 5,
    createdBy: 'editor@vizra.ai',
    createdAt: Date.now() - 3600000 * 6,
    updatedAt: Date.now() - 3600000 * 6,
  },
];

// In-memory state initialized from disk or defaults
let state: EngagePersistedState = {
  config: { ...DEFAULT_CONFIG },
  partners: [...DEFAULT_PARTNERS],
  campaigns: [...DEFAULT_CAMPAIGNS],
  content: [...DEFAULT_CONTENT],
  events: [],
  auditLog: [
    {
      id: 'audit-init-1',
      actor: 'system@vizra.ai',
      action: 'INITIALIZE_ENGAGE_INVENTORY',
      targetType: 'config',
      targetId: 'global',
      summary: 'Initialized VIZRA Engage Hybrid Content Engine & Governance Store',
      timestamp: Date.now() - 86400000 * 5,
    },
  ],
};

// Deduplication cache: key = `${sessionHash}:${eventType}:${contentId}:${bucket}`
const eventDedupeCache = new Map<string, number>();

export function sanitizeEngageText(input: unknown, maxLength = 400): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function loadEngageStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(ENGAGE_STORE_FILE)) {
      const raw = fs.readFileSync(ENGAGE_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<EngagePersistedState>;
      if (parsed.config) state.config = { ...DEFAULT_CONFIG, ...parsed.config };
      if (Array.isArray(parsed.partners) && parsed.partners.length > 0) {
        state.partners = parsed.partners;
      }
      if (Array.isArray(parsed.campaigns) && parsed.campaigns.length > 0) {
        state.campaigns = parsed.campaigns;
      }
      if (Array.isArray(parsed.content) && parsed.content.length > 0) {
        state.content = parsed.content;
      }
      if (Array.isArray(parsed.events)) {
        state.events = parsed.events.slice(-2500);
      }
      if (Array.isArray(parsed.auditLog)) {
        state.auditLog = parsed.auditLog.slice(-500);
      }
    } else {
      persistEngageStore();
    }
  } catch (err) {
    console.warn('[VIZRA Engage] Operating with in-memory store fallback:', err);
  }
}

function persistEngageStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ENGAGE_STORE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Graceful no-op in read-only serverless environments
  }
}

// Initialize immediately on module load
loadEngageStore();

export function getEngageConfig(): EngageGlobalConfig {
  return { ...state.config };
}

export function updateEngageConfig(
  patch: Partial<EngageGlobalConfig>,
  actor = 'admin@vizra.ai'
): EngageGlobalConfig {
  state.config = {
    ...state.config,
    ...patch,
    maxSponsoredRatio:
      typeof patch.maxSponsoredRatio === 'number'
        ? Math.max(0, Math.min(1, patch.maxSponsoredRatio))
        : state.config.maxSponsoredRatio,
    collapseOnCompleteDelayMs:
      typeof patch.collapseOnCompleteDelayMs === 'number'
        ? Math.max(0, Math.min(3000, patch.collapseOnCompleteDelayMs))
        : state.config.collapseOnCompleteDelayMs,
    rotationIntervalMs:
      typeof patch.rotationIntervalMs === 'number'
        ? Math.max(2500, Math.min(30000, patch.rotationIntervalMs))
        : state.config.rotationIntervalMs,
    defaultDisclosureText:
      patch.defaultDisclosureText !== undefined
        ? sanitizeEngageText(patch.defaultDisclosureText, 240)
        : state.config.defaultDisclosureText,
    updatedAt: Date.now(),
    updatedBy: actor,
  };
  appendAuditLog(actor, 'UPDATE_GLOBAL_CONFIG', 'config', 'global', 'Updated VIZRA Engage global settings');
  persistEngageStore();
  return { ...state.config };
}

export function listEngageContent(): EngageContentItem[] {
  return [...state.content].sort((a, b) => b.priority - a.priority || b.updatedAt - a.updatedAt);
}

export function getEngageContentById(id: string): EngageContentItem | undefined {
  return state.content.find((c) => c.id === id);
}

export function upsertEngageContent(
  item: Partial<EngageContentItem> & { title: string; body: string; type: EngageContentItem['type'] },
  actor = 'admin@vizra.ai'
): EngageContentItem {
  const now = Date.now();
  const existingIdx = item.id ? state.content.findIndex((c) => c.id === item.id) : -1;

  const cleanTitle = sanitizeEngageText(item.title, 140);
  const cleanSubtitle = item.subtitle ? sanitizeEngageText(item.subtitle, 120) : undefined;
  const cleanBody = sanitizeEngageText(item.body, 500);
  const cleanCategory = sanitizeEngageText(item.category || 'General', 80);
  const cleanCta = item.ctaLabel ? sanitizeEngageText(item.ctaLabel, 50) : undefined;
  const cleanDisclosure = item.disclosureText
    ? sanitizeEngageText(item.disclosureText, 240)
    : undefined;

  if (existingIdx >= 0) {
    const prev = state.content[existingIdx];
    const updated: EngageContentItem = {
      ...prev,
      ...item,
      title: cleanTitle || prev.title,
      subtitle: cleanSubtitle,
      body: cleanBody || prev.body,
      category: cleanCategory || prev.category,
      ctaLabel: cleanCta,
      disclosureText: cleanDisclosure,
      priority:
        typeof item.priority === 'number'
          ? Math.max(1, Math.min(100, item.priority))
          : prev.priority,
      updatedAt: now,
    };
    state.content[existingIdx] = updated;
    appendAuditLog(
      actor,
      'UPDATE_CONTENT',
      'content',
      updated.id,
      `Updated content item "${updated.title}" (${updated.approvalStatus})`
    );
    persistEngageStore();
    return updated;
  }

  const created: EngageContentItem = {
    id: item.id || `eng-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: cleanTitle,
    subtitle: cleanSubtitle,
    body: cleanBody,
    type: item.type,
    category: cleanCategory,
    targetModes:
      Array.isArray(item.targetModes) && item.targetModes.length > 0
        ? item.targetModes
        : ['quick', 'think', 'research', 'create', 'code', 'analyze', 'science'],
    mediaUrl: item.mediaUrl,
    ctaLabel: cleanCta,
    destinationUrl: item.destinationUrl,
    sponsorshipLabel: item.sponsorshipLabel || 'None',
    disclosureText: cleanDisclosure,
    campaignId: item.campaignId,
    partnerId: item.partnerId,
    affiliateCode: item.affiliateCode ? sanitizeEngageText(item.affiliateCode, 60) : undefined,
    interactiveConfig: item.interactiveConfig,
    priority: typeof item.priority === 'number' ? Math.max(1, Math.min(100, item.priority)) : 50,
    approvalStatus: item.approvalStatus || 'pending_review',
    enabled: item.enabled !== undefined ? Boolean(item.enabled) : true,
    scheduleStart: item.scheduleStart,
    scheduleEnd: item.scheduleEnd,
    expiresAt: item.expiresAt,
    frequencyCapPerSession:
      typeof item.frequencyCapPerSession === 'number'
        ? Math.max(1, Math.min(100, item.frequencyCapPerSession))
        : 5,
    createdBy: actor,
    reviewedBy: item.approvalStatus === 'approved' ? actor : undefined,
    reviewedAt: item.approvalStatus === 'approved' ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };

  state.content.unshift(created);
  appendAuditLog(
    actor,
    'CREATE_CONTENT',
    'content',
    created.id,
    `Created content "${created.title}" [${created.type}]`
  );
  persistEngageStore();
  return created;
}

export function setEngageContentApproval(
  contentId: string,
  approvalStatus: EngageContentItem['approvalStatus'],
  actor = 'admin@vizra.ai'
): EngageContentItem | null {
  const idx = state.content.findIndex((c) => c.id === contentId);
  if (idx === -1) return null;

  state.content[idx] = {
    ...state.content[idx],
    approvalStatus,
    reviewedBy: actor,
    reviewedAt: Date.now(),
    updatedAt: Date.now(),
  };

  appendAuditLog(
    actor,
    `CONTENT_${approvalStatus.toUpperCase()}`,
    'content',
    contentId,
    `Set approval status of "${state.content[idx].title}" to ${approvalStatus}`
  );
  persistEngageStore();
  return state.content[idx];
}

export function deleteEngageContent(contentId: string, actor = 'admin@vizra.ai'): boolean {
  const idx = state.content.findIndex((c) => c.id === contentId);
  if (idx === -1) return false;
  const removed = state.content.splice(idx, 1)[0];
  appendAuditLog(actor, 'DELETE_CONTENT', 'content', contentId, `Deleted content "${removed.title}"`);
  persistEngageStore();
  return true;
}

export function listEngageCampaigns(): EngageCampaign[] {
  return [...state.campaigns].sort((a, b) => b.priority - a.priority || b.updatedAt - a.updatedAt);
}

export function getEngageCampaignById(id: string): EngageCampaign | undefined {
  return state.campaigns.find((c) => c.id === id);
}

export function upsertEngageCampaign(
  campaign: Partial<EngageCampaign> & { name: string; partnerId: string; destinationUrl: string },
  actor = 'admin@vizra.ai'
): EngageCampaign {
  const now = Date.now();
  const partner = state.partners.find((p) => p.id === campaign.partnerId);
  const partnerName = partner ? partner.name : sanitizeEngageText(campaign.partnerName || 'Partner', 100);
  const existingIdx = campaign.id ? state.campaigns.findIndex((c) => c.id === campaign.id) : -1;

  if (existingIdx >= 0) {
    const prev = state.campaigns[existingIdx];
    const updated: EngageCampaign = {
      ...prev,
      ...campaign,
      name: sanitizeEngageText(campaign.name, 140) || prev.name,
      partnerName,
      updatedAt: now,
    };
    state.campaigns[existingIdx] = updated;
    appendAuditLog(
      actor,
      'UPDATE_CAMPAIGN',
      'campaign',
      updated.id,
      `Updated campaign "${updated.name}" (${updated.status})`
    );
    persistEngageStore();
    return updated;
  }

  const created: EngageCampaign = {
    id: campaign.id || `camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: sanitizeEngageText(campaign.name, 140),
    partnerId: campaign.partnerId,
    partnerName,
    type: campaign.type || 'direct_sponsorship',
    sponsorshipLabel:
      campaign.sponsorshipLabel ||
      (campaign.type === 'affiliate' ? 'Affiliate' : 'Sponsored'),
    destinationUrl: campaign.destinationUrl,
    affiliateParams: campaign.affiliateParams
      ? sanitizeEngageText(campaign.affiliateParams, 160)
      : undefined,
    status: campaign.status || 'active',
    approvalStatus: campaign.approvalStatus || 'approved',
    budgetUsd: typeof campaign.budgetUsd === 'number' ? Math.max(0, campaign.budgetUsd) : 1000,
    spentUsd: typeof campaign.spentUsd === 'number' ? Math.max(0, campaign.spentUsd) : 0,
    cpmUsd: typeof campaign.cpmUsd === 'number' ? Math.max(0, campaign.cpmUsd) : 15,
    cpcUsd: typeof campaign.cpcUsd === 'number' ? Math.max(0, campaign.cpcUsd) : 1.2,
    cpaUsd: typeof campaign.cpaUsd === 'number' ? Math.max(0, campaign.cpaUsd) : 10,
    startDate: campaign.startDate || new Date().toISOString(),
    endDate:
      campaign.endDate || new Date(Date.now() + 86400000 * 90).toISOString(),
    targetModes:
      Array.isArray(campaign.targetModes) && campaign.targetModes.length > 0
        ? campaign.targetModes
        : ['quick', 'think', 'research', 'create', 'code', 'analyze', 'science'],
    priority: typeof campaign.priority === 'number' ? Math.max(1, Math.min(100, campaign.priority)) : 75,
    impressionGoal: typeof campaign.impressionGoal === 'number' ? campaign.impressionGoal : 50000,
    createdAt: now,
    updatedAt: now,
  };

  state.campaigns.unshift(created);
  appendAuditLog(
    actor,
    'CREATE_CAMPAIGN',
    'campaign',
    created.id,
    `Created campaign "${created.name}" for ${created.partnerName}`
  );
  persistEngageStore();
  return created;
}

export function listEngagePartners(): EngagePartner[] {
  return [...state.partners].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function upsertEngagePartner(
  partner: Partial<EngagePartner> & { name: string; domain: string },
  actor = 'admin@vizra.ai'
): EngagePartner {
  const now = Date.now();
  const existingIdx = partner.id ? state.partners.findIndex((p) => p.id === partner.id) : -1;

  if (existingIdx >= 0) {
    const prev = state.partners[existingIdx];
    const updated: EngagePartner = {
      ...prev,
      ...partner,
      name: sanitizeEngageText(partner.name, 120) || prev.name,
      domain: sanitizeEngageText(partner.domain, 120) || prev.domain,
      updatedAt: now,
    };
    state.partners[existingIdx] = updated;
    appendAuditLog(
      actor,
      'UPDATE_PARTNER',
      'partner',
      updated.id,
      `Updated partner "${updated.name}" (${updated.status})`
    );
    persistEngageStore();
    return updated;
  }

  const created: EngagePartner = {
    id: partner.id || `partner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: sanitizeEngageText(partner.name, 120),
    domain: sanitizeEngageText(partner.domain, 120),
    contactEmail: sanitizeEngageText(partner.contactEmail || 'partner@example.com', 120),
    verified: partner.verified !== undefined ? Boolean(partner.verified) : true,
    status: partner.status || 'active',
    tier: partner.tier || 'direct_brand',
    allowedDestinations: Array.isArray(partner.allowedDestinations)
      ? partner.allowedDestinations
      : [`https://${sanitizeEngageText(partner.domain, 120)}`],
    createdAt: now,
    updatedAt: now,
  };

  state.partners.unshift(created);
  appendAuditLog(
    actor,
    'CREATE_PARTNER',
    'partner',
    created.id,
    `Registered partner "${created.name}" (${created.domain})`
  );
  persistEngageStore();
  return created;
}

export function recordEngageAnalyticsEvent(
  input: Omit<EngageAnalyticsEvent, 'id' | 'timestamp' | 'revenueDeltaUsd'> & {
    dedupeKey?: string;
  }
): { recorded: boolean; deduplicated: boolean; event?: EngageAnalyticsEvent } {
  const now = Date.now();
  // Deduplicate impressions/clicks within a 10-second window per session + contentId + eventType
  const bucket = Math.floor(now / 10000);
  const dedupeId =
    input.dedupeKey || `${input.sessionHash}:${input.eventType}:${input.contentId}:${bucket}`;

  const lastSeen = eventDedupeCache.get(dedupeId);
  if (lastSeen && now - lastSeen < 10000) {
    return { recorded: false, deduplicated: true };
  }
  eventDedupeCache.set(dedupeId, now);

  // Prune old dedupe keys occasionally
  if (eventDedupeCache.size > 5000) {
    const cutoff = now - 60000;
    for (const [k, ts] of eventDedupeCache.entries()) {
      if (ts < cutoff) eventDedupeCache.delete(k);
    }
  }

  let revenueDeltaUsd = 0;
  if (input.campaignId) {
    const campIdx = state.campaigns.findIndex((c) => c.id === input.campaignId);
    if (campIdx >= 0) {
      const camp = state.campaigns[campIdx];
      if (input.eventType === 'impression') {
        revenueDeltaUsd = Number((camp.cpmUsd / 1000).toFixed(5));
      } else if (input.eventType === 'click') {
        revenueDeltaUsd = camp.cpcUsd;
      } else if (input.eventType === 'conversion') {
        revenueDeltaUsd = camp.cpaUsd;
      }
      if (revenueDeltaUsd > 0) {
        state.campaigns[campIdx] = {
          ...camp,
          spentUsd: Number((camp.spentUsd + revenueDeltaUsd).toFixed(4)),
          updatedAt: now,
        };
      }
    }
  }

  const event: EngageAnalyticsEvent = {
    id: `ev-${now}-${Math.random().toString(36).slice(2, 7)}`,
    eventType: input.eventType,
    contentId: input.contentId,
    contentType: input.contentType,
    category: input.category,
    campaignId: input.campaignId,
    partnerId: input.partnerId,
    sessionHash: input.sessionHash,
    mode: input.mode,
    lifecycleState: input.lifecycleState,
    renderLatencyMs: input.renderLatencyMs,
    revenueDeltaUsd,
    timestamp: now,
  };

  state.events.push(event);
  if (state.events.length > 2500) {
    state.events = state.events.slice(-2500);
  }
  persistEngageStore();
  return { recorded: true, deduplicated: false, event };
}

export function getEngageSessionImpressions(sessionHash: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ev of state.events) {
    if (ev.sessionHash === sessionHash && ev.eventType === 'impression') {
      counts[ev.contentId] = (counts[ev.contentId] || 0) + 1;
    }
  }
  return counts;
}

export function getEngageAnalyticsSummary(): EngageAnalyticsSummary {
  const events = state.events;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalDismissals = 0;
  let totalInteractions = 0;
  let verifiedConversions = 0;
  let eventRevenueUsd = 0;
  let latencySum = 0;
  let latencyCount = 0;
  const uniqueSessions = new Set<string>();

  const byCategory: EngageAnalyticsSummary['byCategory'] = {};
  const campMetrics = new Map<
    string,
    { impressions: number; clicks: number; conversions: number }
  >();

  for (const ev of events) {
    uniqueSessions.add(ev.sessionHash);
    const cat = ev.category || 'General';
    if (!byCategory[cat]) {
      byCategory[cat] = {
        impressions: 0,
        clicks: 0,
        dismissals: 0,
        interactions: 0,
        ctrPercent: 0,
      };
    }

    if (ev.eventType === 'impression') {
      totalImpressions++;
      byCategory[cat].impressions++;
    } else if (ev.eventType === 'click') {
      totalClicks++;
      byCategory[cat].clicks++;
    } else if (ev.eventType === 'dismiss') {
      totalDismissals++;
      byCategory[cat].dismissals++;
    } else if (ev.eventType === 'interaction') {
      totalInteractions++;
      byCategory[cat].interactions++;
    } else if (ev.eventType === 'conversion') {
      verifiedConversions++;
    }

    eventRevenueUsd += ev.revenueDeltaUsd || 0;
    if (typeof ev.renderLatencyMs === 'number' && ev.renderLatencyMs >= 0) {
      latencySum += ev.renderLatencyMs;
      latencyCount++;
    }

    if (ev.campaignId) {
      const m = campMetrics.get(ev.campaignId) || {
        impressions: 0,
        clicks: 0,
        conversions: 0,
      };
      if (ev.eventType === 'impression') m.impressions++;
      if (ev.eventType === 'click') m.clicks++;
      if (ev.eventType === 'conversion') m.conversions++;
      campMetrics.set(ev.campaignId, m);
    }
  }

  for (const cat of Object.keys(byCategory)) {
    const c = byCategory[cat];
    c.ctrPercent =
      c.impressions > 0 ? Number(((c.clicks / c.impressions) * 100).toFixed(2)) : 0;
  }

  const baseCampaignSpend = state.campaigns.reduce((acc, c) => acc + (c.spentUsd || 0), 0);

  const byCampaign = state.campaigns.map((camp) => {
    const m = campMetrics.get(camp.id) || { impressions: 0, clicks: 0, conversions: 0 };
    return {
      campaignId: camp.id,
      campaignName: camp.name,
      partnerName: camp.partnerName,
      status: camp.status,
      impressions: m.impressions,
      clicks: m.clicks,
      conversions: m.conversions,
      ctrPercent:
        m.impressions > 0 ? Number(((m.clicks / m.impressions) * 100).toFixed(2)) : 0,
      spentUsd: Number(camp.spentUsd.toFixed(2)),
      budgetUsd: camp.budgetUsd,
    };
  });

  return {
    totalImpressions,
    uniqueReachSessions: uniqueSessions.size,
    totalClicks,
    ctrPercent:
      totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
    totalDismissals,
    totalInteractions,
    verifiedConversions,
    estimatedRevenueUsd: Number(Math.max(baseCampaignSpend, eventRevenueUsd).toFixed(2)),
    avgRenderLatencyMs: latencyCount > 0 ? Math.round(latencySum / latencyCount) : 14,
    byCategory,
    byCampaign,
    recentEvents: events.slice(-40).reverse(),
  };
}

export function listEngageAuditLog(): EngageAuditLogEntry[] {
  return [...state.auditLog].reverse();
}

function appendAuditLog(
  actor: string,
  action: string,
  targetType: EngageAuditLogEntry['targetType'],
  targetId: string,
  summary: string
): void {
  state.auditLog.push({
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actor,
    action,
    targetType,
    targetId,
    summary,
    timestamp: Date.now(),
  });
  if (state.auditLog.length > 500) {
    state.auditLog = state.auditLog.slice(-500);
  }
}
