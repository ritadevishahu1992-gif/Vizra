import { AIMode } from './ai';

export type EngageLifecycleState =
  | 'idle'
  | 'generating'
  | 'streaming'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type EngageCoarseIntent =
  | 'general'
  | 'coding'
  | 'research'
  | 'creative'
  | 'analysis'
  | 'science'
  | 'project'
  | 'math';

export type EngageContentType =
  | 'visualization'
  | 'knowledge_card'
  | 'creative_tip'
  | 'mini_experience'
  | 'announcement'
  | 'partner_placeholder'
  | 'sponsored_card'
  | 'affiliate_card';

export type EngageSponsorshipLabel = 'None' | 'Sponsored' | 'Affiliate' | 'Partner';

export type EngageApprovalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export interface EngageInteractiveConfig {
  kind:
    | 'poll'
    | 'prompt_spark'
    | 'breathing_focus'
    | 'shortcut_challenge'
    | 'prompt_improvement'
    | 'flashcard'
    | 'creative_decision'
    | 'shortcut_learning';
  question?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  sparkPrompt?: string;
  beforePrompt?: string;
  afterPrompt?: string;
  flashcardFront?: string;
  flashcardBack?: string;
  shortcutKeys?: string[];
  shortcutAction?: string;
}

export interface EngageContentItem {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  type: EngageContentType;
  category: string;
  targetModes: AIMode[];
  targetIntents?: EngageCoarseIntent[];
  takeaway?: string;
  shortcutKeys?: string[];
  mediaUrl?: string;
  ctaLabel?: string;
  destinationUrl?: string;
  sponsorshipLabel: EngageSponsorshipLabel;
  disclosureText?: string;
  campaignId?: string;
  partnerId?: string;
  affiliateCode?: string;
  interactiveConfig?: EngageInteractiveConfig;
  priority: number; // 1 (lowest) to 100 (highest)
  approvalStatus: EngageApprovalStatus;
  enabled: boolean;
  scheduleStart?: string; // ISO date string
  scheduleEnd?: string; // ISO date string
  expiresAt?: string; // ISO date string
  frequencyCapPerSession: number;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface EngagePartner {
  id: string;
  name: string;
  domain: string;
  contactEmail: string;
  verified: boolean;
  status: 'active' | 'paused' | 'suspended';
  tier: 'direct_brand' | 'affiliate_network' | 'ecosystem_partner';
  allowedDestinations: string[];
  createdAt: number;
  updatedAt: number;
}

export interface EngageCampaign {
  id: string;
  name: string;
  partnerId: string;
  partnerName: string;
  type: 'direct_sponsorship' | 'affiliate' | 'house_educational';
  sponsorshipLabel: EngageSponsorshipLabel;
  destinationUrl: string;
  affiliateParams?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  approvalStatus: EngageApprovalStatus;
  budgetUsd: number;
  spentUsd: number;
  cpmUsd: number;
  cpcUsd: number;
  cpaUsd: number;
  startDate: string;
  endDate: string;
  targetModes: AIMode[];
  priority: number;
  impressionGoal: number;
  createdAt: number;
  updatedAt: number;
}

export type EngageEventType =
  | 'impression'
  | 'click'
  | 'dismiss'
  | 'interaction'
  | 'conversion';

export interface EngageAnalyticsEvent {
  id: string;
  eventType: EngageEventType;
  contentId: string;
  contentType: EngageContentType;
  category: string;
  campaignId?: string;
  partnerId?: string;
  sessionHash: string;
  mode: AIMode;
  lifecycleState: EngageLifecycleState;
  renderLatencyMs?: number;
  revenueDeltaUsd: number;
  timestamp: number;
}

export interface EngageGlobalConfig {
  enabled: boolean;
  sponsoredEnabled: boolean;
  affiliateEnabled: boolean;
  educationalEnabled: boolean;
  interactiveEnabled: boolean;
  collapseOnCompleteDelayMs: number;
  rotationIntervalMs: number;
  maxSponsoredRatio: number; // 0.0 to 1.0
  defaultDisclosureText: string;
  respectReducedMotion: boolean;
  updatedAt: number;
  updatedBy: string;
}

export interface EngageAuditLogEntry {
  id: string;
  actor: string;
  action: string;
  targetType: 'content' | 'campaign' | 'partner' | 'config';
  targetId: string;
  summary: string;
  timestamp: number;
}

export interface EngageAnalyticsSummary {
  totalImpressions: number;
  uniqueReachSessions: number;
  totalClicks: number;
  ctrPercent: number;
  totalDismissals: number;
  totalInteractions: number;
  verifiedConversions: number;
  estimatedRevenueUsd: number;
  avgRenderLatencyMs: number;
  byCategory: Record<
    string,
    {
      impressions: number;
      clicks: number;
      dismissals: number;
      interactions: number;
      ctrPercent: number;
    }
  >;
  byCampaign: Array<{
    campaignId: string;
    campaignName: string;
    partnerName: string;
    status: string;
    impressions: number;
    clicks: number;
    conversions: number;
    ctrPercent: number;
    spentUsd: number;
    budgetUsd: number;
  }>;
  recentEvents: EngageAnalyticsEvent[];
}
