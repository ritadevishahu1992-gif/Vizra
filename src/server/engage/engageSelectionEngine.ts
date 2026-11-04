import { AIMode } from '../../types/ai';
import { EngageContentItem, EngageGlobalConfig } from '../../types/engage';
import {
  getEngageConfig,
  listEngageContent,
  listEngageCampaigns,
  listEngagePartners,
  getEngageSessionImpressions,
} from './engageStore';

export interface EngageSelectionRequest {
  mode?: AIMode;
  sessionHash?: string;
  excludeIds?: string[];
  limit?: number;
}

export interface EngageSelectionResult {
  enabled: boolean;
  config: Pick<
    EngageGlobalConfig,
    | 'enabled'
    | 'collapseOnCompleteDelayMs'
    | 'rotationIntervalMs'
    | 'defaultDisclosureText'
    | 'respectReducedMotion'
  >;
  items: EngageContentItem[];
}

export function isContentScheduleEligible(item: EngageContentItem, nowMs = Date.now()): boolean {
  if (!item.enabled) return false;
  if (item.approvalStatus !== 'approved') return false;

  if (item.scheduleStart) {
    const startMs = Date.parse(item.scheduleStart);
    if (!Number.isNaN(startMs) && nowMs < startMs) return false;
  }

  if (item.scheduleEnd) {
    const endMs = Date.parse(item.scheduleEnd);
    if (!Number.isNaN(endMs) && nowMs > endMs) return false;
  }

  if (item.expiresAt) {
    const expMs = Date.parse(item.expiresAt);
    if (!Number.isNaN(expMs) && nowMs > expMs) return false;
  }

  return true;
}

export function selectEngageInventory(req: EngageSelectionRequest): EngageSelectionResult {
  const config = getEngageConfig();
  const mode: AIMode = req.mode || 'quick';
  const sessionHash = req.sessionHash || 'anon';
  const excludeSet = new Set(req.excludeIds || []);
  const limit = Math.max(1, Math.min(10, req.limit || 5));

  const publicConfig = {
    enabled: config.enabled,
    collapseOnCompleteDelayMs: config.collapseOnCompleteDelayMs,
    rotationIntervalMs: config.rotationIntervalMs,
    defaultDisclosureText: config.defaultDisclosureText,
    respectReducedMotion: config.respectReducedMotion,
  };

  if (!config.enabled) {
    return {
      enabled: false,
      config: publicConfig,
      items: [],
    };
  }

  const nowMs = Date.now();
  const allContent = listEngageContent();
  const campaigns = listEngageCampaigns();
  const partners = listEngagePartners();
  const sessionCounts = getEngageSessionImpressions(sessionHash);

  const activeCampaignMap = new Map(
    campaigns
      .filter((c) => {
        if (c.status !== 'active' || c.approvalStatus !== 'approved') return false;
        if (c.spentUsd >= c.budgetUsd && c.budgetUsd > 0) return false;
        const startMs = Date.parse(c.startDate);
        const endMs = Date.parse(c.endDate);
        if (!Number.isNaN(startMs) && nowMs < startMs) return false;
        if (!Number.isNaN(endMs) && nowMs > endMs) return false;
        return true;
      })
      .map((c) => [c.id, c])
  );

  const activePartnerSet = new Set(
    partners.filter((p) => p.status === 'active' && p.verified).map((p) => p.id)
  );

  const eligible: Array<{ item: EngageContentItem; score: number }> = [];

  for (const item of allContent) {
    if (excludeSet.has(item.id)) continue;
    if (!isContentScheduleEligible(item, nowMs)) continue;

    // Check global type toggles
    if (item.type === 'sponsored_card' && !config.sponsoredEnabled) continue;
    if (item.type === 'affiliate_card' && !config.affiliateEnabled) continue;
    if (
      (item.type === 'knowledge_card' || item.type === 'creative_tip') &&
      !config.educationalEnabled
    ) {
      continue;
    }
    if (item.type === 'mini_experience' && !config.interactiveEnabled) continue;

    // Check frequency cap per session
    const seenCount = sessionCounts[item.id] || 0;
    if (item.frequencyCapPerSession > 0 && seenCount >= item.frequencyCapPerSession) {
      continue;
    }

    // If paid/monetized card, verify active campaign & verified partner
    if (
      item.type === 'sponsored_card' ||
      item.type === 'affiliate_card' ||
      item.sponsorshipLabel === 'Sponsored' ||
      item.sponsorshipLabel === 'Affiliate'
    ) {
      if (item.campaignId && !activeCampaignMap.has(item.campaignId)) {
        continue;
      }
      if (item.partnerId && !activePartnerSet.has(item.partnerId)) {
        continue;
      }
      // Enforce mandatory disclosure badge
      if (item.sponsorshipLabel === 'None') {
        continue;
      }
    }

    // Calculate contextual relevance score based purely on coarse mode (zero prompt inspection)
    const matchesMode = item.targetModes.includes(mode);
    const modeBoost = matchesMode ? 25 : 0;
    const freshnessPenalty = seenCount * 8;
    const score = item.priority + modeBoost - freshnessPenalty;

    eligible.push({ item, score });
  }

  eligible.sort((a, b) => b.score - a.score);

  // Enforce maxSponsoredRatio so organic/educational cards always anchor the experience
  const maxPaidCount = Math.max(1, Math.floor(limit * config.maxSponsoredRatio));
  let paidIncluded = 0;
  const selected: EngageContentItem[] = [];

  for (const entry of eligible) {
    if (selected.length >= limit) break;
    const isPaid =
      entry.item.type === 'sponsored_card' ||
      entry.item.type === 'affiliate_card' ||
      entry.item.sponsorshipLabel === 'Sponsored' ||
      entry.item.sponsorshipLabel === 'Affiliate';

    if (isPaid) {
      if (paidIncluded >= maxPaidCount) continue;
      paidIncluded++;
    }

    // Ensure destinationUrl carries campaign affiliate attribution if applicable
    const cloned = { ...entry.item };
    if (cloned.campaignId && cloned.destinationUrl) {
      const camp = activeCampaignMap.get(cloned.campaignId);
      if (camp?.affiliateParams && !cloned.destinationUrl.includes('?')) {
        cloned.destinationUrl = `${cloned.destinationUrl}?${camp.affiliateParams}`;
      }
    }

    selected.push(cloned);
  }

  return {
    enabled: true,
    config: publicConfig,
    items: selected,
  };
}
