import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  BarChart3,
  Layers,
  Megaphone,
  Building2,
  CheckSquare,
  Calendar,
  Activity,
  Settings,
  Plus,
  Check,
  XCircle,
  Trash2,
  Eye,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../lib/firebase';
import { AIMode } from '../../../types/ai';
import { toSafeExternalHref } from '../../../utils/safeUrl';
import {
  EngageContentItem,
  EngageCampaign,
  EngagePartner,
  EngageGlobalConfig,
  EngageAnalyticsSummary,
  EngageAuditLogEntry,
  EngageContentType,
  EngageSponsorshipLabel,
} from '../../../types/engage';
import { VizraEngageBanner } from './VizraEngageBanner';

interface EngageAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab =
  | 'overview'
  | 'content'
  | 'campaigns'
  | 'partners'
  | 'approvals'
  | 'scheduling'
  | 'analytics'
  | 'safety'
  | 'config';

interface AdminSafetyReport {
  id: string;
  messageId: string;
  category?: string;
  reason: string;
  details: string;
  modelId: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  sessionHash?: string;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

const ALL_MODES: AIMode[] = [
  'quick',
  'think',
  'research',
  'create',
  'code',
  'analyze',
  'science',
];

export const EngageAdminModal: React.FC<EngageAdminModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [config, setConfig] = useState<EngageGlobalConfig | null>(null);
  const [content, setContent] = useState<EngageContentItem[]>([]);
  const [campaigns, setCampaigns] = useState<EngageCampaign[]>([]);
  const [partners, setPartners] = useState<EngagePartner[]>([]);
  const [analytics, setAnalytics] = useState<EngageAnalyticsSummary | null>(null);
  const [auditLog, setAuditLog] = useState<EngageAuditLogEntry[]>([]);
  const [safetyReports, setSafetyReports] = useState<AdminSafetyReport[]>([]);
  const [safetyNotesDraft, setSafetyNotesDraft] = useState<Record<string, string>>({});

  // Content Editor Form State
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentTitle, setContentTitle] = useState('');
  const [contentSubtitle, setContentSubtitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentType, setContentType] = useState<EngageContentType>('knowledge_card');
  const [contentCategory, setContentCategory] = useState('Knowledge Architecture');
  const [contentPriority, setContentPriority] = useState(80);
  const [contentCta, setContentCta] = useState('');
  const [contentDestination, setContentDestination] = useState('');
  const [contentMediaUrl, setContentMediaUrl] = useState('');
  const [contentSponsorship, setContentSponsorship] =
    useState<EngageSponsorshipLabel>('None');
  const [contentDisclosure, setContentDisclosure] = useState('');
  const [contentCampaignId, setContentCampaignId] = useState('');
  const [contentPartnerId, setContentPartnerId] = useState('');
  const [contentModes, setContentModes] = useState<AIMode[]>(['quick', 'think', 'research']);
  const [contentScheduleStart, setContentScheduleStart] = useState('');
  const [contentScheduleEnd, setContentScheduleEnd] = useState('');
  const [contentExpiresAt, setContentExpiresAt] = useState('');
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Campaign Form State
  const [campName, setCampName] = useState('');
  const [campPartnerId, setCampPartnerId] = useState('partner-vizra-studio');
  const [campType, setCampType] =
    useState<EngageCampaign['type']>('direct_sponsorship');
  const [campDestination, setCampDestination] = useState('https://vizra.vercel.app/studio');
  const [campAffiliateParams, setCampAffiliateParams] = useState(
    'utm_source=vizra_engage'
  );
  const [campBudget, setCampBudget] = useState(2500);
  const [campCpm, setCampCpm] = useState(16);
  const [campCpc, setCampCpc] = useState(1.25);

  // Partner Form State
  const [partnerName, setPartnerName] = useState('');
  const [partnerDomain, setPartnerDomain] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerTier, setPartnerTier] =
    useState<EngagePartner['tier']>('direct_brand');

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    try {
      if (auth?.currentUser) {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Fallback to local studio preview session
    }
    return headers;
  }, []);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/engage/admin/overview', { headers });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({
          type: 'error',
          text: data.error?.message || 'Unable to load VIZRA Engage administration data.',
        });
        return;
      }
      setConfig(data.config);
      setContent(data.content || []);
      setCampaigns(data.campaigns || []);
      setPartners(data.partners || []);
      setAnalytics(data.analytics || null);
      setAuditLog(data.auditLog || []);

      try {
        const safetyRes = await fetch('/api/safety/reports', { headers });
        if (safetyRes.ok) {
          const safetyData = await safetyRes.json();
          if (Array.isArray(safetyData.reports)) {
            setSafetyReports(safetyData.reports);
          }
        }
      } catch {
        // Non-fatal if safety reports endpoint unavailable
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Network error loading Engage dashboard.',
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (isOpen) {
      fetchOverview();
    }
  }, [isOpen, fetchOverview]);

  if (!isOpen) return null;

  const resetContentForm = () => {
    setEditingContentId(null);
    setContentTitle('');
    setContentSubtitle('');
    setContentBody('');
    setContentType('knowledge_card');
    setContentCategory('Knowledge Architecture');
    setContentPriority(80);
    setContentCta('');
    setContentDestination('');
    setContentMediaUrl('');
    setContentSponsorship('None');
    setContentDisclosure('');
    setContentCampaignId('');
    setContentPartnerId('');
    setContentModes(['quick', 'think', 'research']);
    setContentScheduleStart('');
    setContentScheduleEnd('');
    setContentExpiresAt('');
  };

  const loadContentForEdit = (item: EngageContentItem) => {
    setEditingContentId(item.id);
    setContentTitle(item.title);
    setContentSubtitle(item.subtitle || '');
    setContentBody(item.body);
    setContentType(item.type);
    setContentCategory(item.category);
    setContentPriority(item.priority);
    setContentCta(item.ctaLabel || '');
    setContentDestination(item.destinationUrl || '');
    setContentMediaUrl(item.mediaUrl || '');
    setContentSponsorship(item.sponsorshipLabel);
    setContentDisclosure(item.disclosureText || '');
    setContentCampaignId(item.campaignId || '');
    setContentPartnerId(item.partnerId || '');
    setContentModes(item.targetModes);
    setContentScheduleStart(item.scheduleStart ? item.scheduleStart.slice(0, 16) : '');
    setContentScheduleEnd(item.scheduleEnd ? item.scheduleEnd.slice(0, 16) : '');
    setContentExpiresAt(item.expiresAt ? item.expiresAt.slice(0, 16) : '');
    setActiveTab('content');
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const payload = {
        id: editingContentId || undefined,
        title: contentTitle,
        subtitle: contentSubtitle || undefined,
        body: contentBody,
        type: contentType,
        category: contentCategory,
        priority: Number(contentPriority),
        ctaLabel: contentCta || undefined,
        destinationUrl: contentDestination || undefined,
        mediaUrl: contentMediaUrl || undefined,
        sponsorshipLabel: contentSponsorship,
        disclosureText: contentDisclosure || undefined,
        campaignId: contentCampaignId || undefined,
        partnerId: contentPartnerId || undefined,
        targetModes: contentModes,
        scheduleStart: contentScheduleStart
          ? new Date(contentScheduleStart).toISOString()
          : undefined,
        scheduleEnd: contentScheduleEnd
          ? new Date(contentScheduleEnd).toISOString()
          : undefined,
        expiresAt: contentExpiresAt
          ? new Date(contentExpiresAt).toISOString()
          : undefined,
        approvalStatus: editingContentId ? undefined : 'approved',
        enabled: true,
      };
      const res = await fetch('/api/engage/admin/content', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({
          type: 'error',
          text: data.error?.message || 'Failed to save content item.',
        });
        return;
      }
      setStatusMessage({
        type: 'success',
        text: `Saved "${data.item.title}" to Engage inventory.`,
      });
      resetContentForm();
      fetchOverview();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleApprovalChange = async (
    contentId: string,
    approvalStatus: EngageContentItem['approvalStatus']
  ) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/engage/admin/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({ contentId, approvalStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Updated approval status to ${approvalStatus}.`,
        });
        fetchOverview();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error?.message || 'Approval update failed.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleContentEnabled = async (item: EngageContentItem) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/engage/admin/content', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...item,
          enabled: !item.enabled,
        }),
      });
      if (res.ok) {
        fetchOverview();
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/engage/admin/content/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Deleted content item.' });
        fetchOverview();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/engage/admin/campaigns', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: campName,
          partnerId: campPartnerId,
          type: campType,
          sponsorshipLabel: campType === 'affiliate' ? 'Affiliate' : 'Sponsored',
          destinationUrl: campDestination,
          affiliateParams: campAffiliateParams,
          budgetUsd: Number(campBudget),
          cpmUsd: Number(campCpm),
          cpcUsd: Number(campCpc),
          status: 'active',
          approvalStatus: 'approved',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({
          type: 'error',
          text: data.error?.message || 'Failed to create campaign.',
        });
        return;
      }
      setStatusMessage({
        type: 'success',
        text: `Campaign "${data.campaign.name}" launched.`,
      });
      setCampName('');
      fetchOverview();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleCampaignStatus = async (camp: EngageCampaign) => {
    try {
      const headers = await getAuthHeaders();
      const nextStatus = camp.status === 'active' ? 'paused' : 'active';
      const res = await fetch('/api/engage/admin/campaigns', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...camp,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        fetchOverview();
      }
    } catch {
      // Ignore
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/engage/admin/partners', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: partnerName,
          domain: partnerDomain,
          contactEmail: partnerEmail,
          tier: partnerTier,
          verified: true,
          status: 'active',
          allowedDestinations: [`https://${partnerDomain.replace(/^https?:\/\//, '')}`],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({
          type: 'error',
          text: data.error?.message || 'Failed to register partner.',
        });
        return;
      }
      setStatusMessage({
        type: 'success',
        text: `Partner "${data.partner.name}" verified & added.`,
      });
      setPartnerName('');
      setPartnerDomain('');
      setPartnerEmail('');
      fetchOverview();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdateConfig = async (patch: Partial<EngageGlobalConfig>) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/engage/admin/config', {
        method: 'POST',
        headers,
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        setStatusMessage({
          type: 'success',
          text: 'Updated VIZRA Engage global configuration.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdateSafetyReportStatus = async (
    reportId: string,
    status: AdminSafetyReport['status']
  ) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/safety/reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status,
          reviewerNotes: safetyNotesDraft[reportId] || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setStatusMessage({
          type: 'error',
          text: data.error?.message || 'Unable to update safety report status.',
        });
        return;
      }
      setSafetyReports((prev) =>
        prev.map((r) => (r.id === reportId ? data.report : r))
      );
      setStatusMessage({
        type: 'success',
        text: `Updated safety report ${reportId} to "${status}".`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const pendingQueue = content.filter((c) => c.approvalStatus === 'pending_review');
  const openSafetyCount = safetyReports.filter((r) => r.status === 'open').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-6xl h-[88vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#eb3b2d]/15 border border-[#eb3b2d]/40 flex items-center justify-center text-[#eb3b2d]">
              <BarChart3 size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  VIZRA Engage — Hybrid Content & Monetization Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
                  RBAC Governed
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Manage contextual waiting-period visualizations, knowledge cards, brand campaigns, and privacy-preserving telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchOverview}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh telemetry & inventory"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close VIZRA Engage Admin"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2 text-xs flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : 'bg-red-950/40 border-red-800/50 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={13} />
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-[11px] underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Body: Left Navigation + Right Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <nav className="w-52 border-r border-neutral-800 bg-neutral-950/60 p-3 space-y-1 overflow-y-auto shrink-0">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'content', label: 'Content Engine', icon: Layers },
              { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
              { id: 'partners', label: 'Partners', icon: Building2 },
              {
                id: 'approvals',
                label: `Approval Queue (${pendingQueue.length})`,
                icon: CheckSquare,
              },
              { id: 'scheduling', label: 'Scheduling', icon: Calendar },
              { id: 'analytics', label: 'Analytics & CTR', icon: Activity },
              {
                id: 'safety',
                label: `Safety Reports (${openSafetyCount})`,
                icon: ShieldAlert,
              },
              { id: 'config', label: 'Global Config', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#eb3b2d] text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon size={14} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-neutral-900 px-2 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-neutral-500">
                Operator Session
              </div>
              <div className="text-[11px] font-mono text-neutral-300 truncate">
                {user?.email || 'Authenticated Admin'}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <ShieldCheck size={11} />
                <span>SSRF & Disclosure Gate Active</span>
              </div>
            </div>
          </nav>

          {/* Right Workspace Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Executive Pulse & Live Preview
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Real-time status of the VIZRA Engage waiting-period experience and monetization engine.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLivePreview(!showLivePreview)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-white cursor-pointer"
                  >
                    <Eye size={13} className="text-[#eb3b2d]" />
                    <span>{showLivePreview ? 'Hide Interactive Preview' : 'Preview Live Engage Component'}</span>
                  </button>
                </div>

                {showLivePreview && (
                  <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="text-[11px] font-mono text-neutral-400 uppercase">
                      Live Chat Waiting-Period Sandbox (Generating State)
                    </div>
                    <VizraEngageBanner lifecycleState="generating" mode="quick" />
                  </div>
                )}

                {/* KPI Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="text-[11px] font-mono text-neutral-400">
                      TOTAL IMPRESSIONS
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {analytics?.totalImpressions ?? 0}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      Unique Sessions: {analytics?.uniqueReachSessions ?? 0}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="text-[11px] font-mono text-neutral-400">
                      ENGAGEMENT CTR
                    </div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">
                      {analytics?.ctrPercent ?? 0}%
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      {analytics?.totalClicks ?? 0} clicks • {analytics?.totalInteractions ?? 0} quiz actions
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="text-[11px] font-mono text-neutral-400">
                      ESTIMATED REVENUE
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">
                      ${analytics?.estimatedRevenueUsd?.toFixed(2) ?? '0.00'}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      {campaigns.filter((c) => c.status === 'active').length} active campaigns
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="text-[11px] font-mono text-neutral-400">
                      RENDER LATENCY
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {analytics?.avgRenderLatencyMs ?? 14}ms
                    </div>
                    <div className="text-[11px] text-emerald-400 mt-1">
                      0ms Omnia response delay
                    </div>
                  </div>
                </div>

                {/* Active Inventory Snapshot */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase text-neutral-300">
                      Approved Inventory Snapshot ({content.filter((c) => c.approvalStatus === 'approved').length} Approved)
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('content')}
                      className="text-xs text-[#eb3b2d] hover:underline cursor-pointer"
                    >
                      Manage Content →
                    </button>
                  </div>
                  <div className="divide-y divide-neutral-900">
                    {content.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {item.type} • {item.category} • Priority {item.priority}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              item.approvalStatus === 'approved'
                                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50'
                                : 'text-amber-300 bg-amber-950/40 border-amber-800/50'
                            }`}
                          >
                            {item.approvalStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CONTENT MANAGEMENT */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleSaveContent}
                  className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      {editingContentId ? 'Edit Engage Content Item' : 'Create New Engage Content Card'}
                    </h3>
                    {editingContentId && (
                      <button
                        type="button"
                        onClick={resetContentForm}
                        className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={contentTitle}
                        onChange={(e) => setContentTitle(e.target.value)}
                        placeholder="e.g., Hybrid Retrieval Latency Optimization"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={contentSubtitle}
                        onChange={(e) => setContentSubtitle(e.target.value)}
                        placeholder="e.g., Architecture Insight"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Card Type *
                      </label>
                      <select
                        value={contentType}
                        onChange={(e) =>
                          setContentType(e.target.value as EngageContentType)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      >
                        <option value="visualization">Neural Visualization</option>
                        <option value="knowledge_card">Educational Knowledge Card</option>
                        <option value="creative_tip">Creative & Productivity Tip</option>
                        <option value="mini_experience">Interactive Mini-Experience</option>
                        <option value="sponsored_card">Sponsored Partner Card</option>
                        <option value="affiliate_card">Affiliate Recommendation</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                      Body Copy *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      placeholder="Concise, high-signal explanation displayed while Omnia synthesizes..."
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={contentCategory}
                        onChange={(e) => setContentCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Priority (1-100)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={contentPriority}
                        onChange={(e) => setContentPriority(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Sponsorship Label
                      </label>
                      <select
                        value={contentSponsorship}
                        onChange={(e) =>
                          setContentSponsorship(
                            e.target.value as EngageSponsorshipLabel
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      >
                        <option value="None">None (Editorial / Organic)</option>
                        <option value="Sponsored">Sponsored</option>
                        <option value="Affiliate">Affiliate</option>
                        <option value="Partner">Partner</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        CTA Button Label
                      </label>
                      <input
                        type="text"
                        value={contentCta}
                        onChange={(e) => setContentCta(e.target.value)}
                        placeholder="e.g., Explore Docs"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Destination URL (SSRF-verified HTTPS)
                      </label>
                      <input
                        type="url"
                        value={contentDestination}
                        onChange={(e) => setContentDestination(e.target.value)}
                        placeholder="https://vizra.vercel.app/studio"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Disclosure Text
                      </label>
                      <input
                        type="text"
                        value={contentDisclosure}
                        onChange={(e) => setContentDisclosure(e.target.value)}
                        placeholder="Independent placement • Does not affect Omnia answers"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Target Reasoning Modes */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1.5">
                      Contextual Relevance Modes (Coarse Topic Matching — Zero Prompt Inspection)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_MODES.map((m) => {
                        const selected = contentModes.includes(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() =>
                              setContentModes((prev) =>
                                prev.includes(m)
                                  ? prev.filter((x) => x !== m)
                                  : [...prev, m]
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase border transition-colors cursor-pointer ${
                              selected
                                ? 'bg-[#eb3b2d]/20 border-[#eb3b2d] text-white'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>{editingContentId ? 'Save Changes' : 'Add to Inventory'}</span>
                    </button>
                  </div>
                </form>

                {/* Existing Content Table */}
                <div className="space-y-2.5">
                  {content.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                            {item.type}
                          </span>
                          {item.sponsorshipLabel !== 'None' && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-700/50 text-amber-300">
                              {item.sponsorshipLabel}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              item.enabled
                                ? 'bg-emerald-950/40 text-emerald-400'
                                : 'bg-neutral-900 text-neutral-500'
                            }`}
                          >
                            {item.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-2">
                          {item.body}
                        </p>
                        <div className="text-[10px] font-mono text-neutral-500">
                          Category: {item.category} • Priority: {item.priority} • Modes:{' '}
                          {item.targetModes.join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleContentEnabled(item)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 cursor-pointer"
                        >
                          {item.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => loadContentForEdit(item)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-white cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContent(item.id)}
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/50 border border-neutral-800 text-neutral-400 hover:text-red-400 cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CAMPAIGNS */}
            {activeTab === 'campaigns' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleCreateCampaign}
                  className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4"
                >
                  <h3 className="text-sm font-bold text-white">
                    Launch Sponsored or Affiliate Campaign
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Campaign Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={campName}
                        onChange={(e) => setCampName(e.target.value)}
                        placeholder="e.g., Q4 Cloud Compute Partner Push"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Verified Partner *
                      </label>
                      <select
                        value={campPartnerId}
                        onChange={(e) => setCampPartnerId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      >
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.domain})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Monetization Type
                      </label>
                      <select
                        value={campType}
                        onChange={(e) =>
                          setCampType(e.target.value as EngageCampaign['type'])
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      >
                        <option value="direct_sponsorship">Direct Brand Sponsorship</option>
                        <option value="affiliate">Affiliate Attribution</option>
                        <option value="house_educational">House Ecosystem Promotion</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Verified Destination URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={campDestination}
                        onChange={(e) => setCampDestination(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Affiliate / UTM Params
                      </label>
                      <input
                        type="text"
                        value={campAffiliateParams}
                        onChange={(e) => setCampAffiliateParams(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Budget (USD)
                      </label>
                      <input
                        type="number"
                        value={campBudget}
                        onChange={(e) => setCampBudget(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                    >
                      Create Campaign
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {campaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {camp.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 border border-amber-700/50 text-amber-300">
                            {camp.sponsorshipLabel}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              camp.status === 'active'
                                ? 'bg-emerald-950/40 text-emerald-400'
                                : 'bg-neutral-900 text-neutral-400'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 flex items-center gap-2">
                          <span>Partner: {camp.partnerName}</span>
                          <span>•</span>
                          {toSafeExternalHref(camp.destinationUrl) ? (
                            <a
                              href={toSafeExternalHref(camp.destinationUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#eb3b2d] hover:underline inline-flex items-center gap-1"
                            >
                              <span>{camp.destinationUrl}</span>
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-neutral-500">{camp.destinationUrl}</span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500">
                          Spend: ${camp.spentUsd.toFixed(2)} / ${camp.budgetUsd.toFixed(2)} • CPM: $
                          {camp.cpmUsd} • CPC: ${camp.cpcUsd}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCampaignStatus(camp)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-white cursor-pointer"
                      >
                        {camp.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PARTNERS */}
            {activeTab === 'partners' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleCreatePartner}
                  className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4"
                >
                  <h3 className="text-sm font-bold text-white">
                    Register Verified Brand or Affiliate Partner
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Partner Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="e.g., Linear"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Verified Domain *
                      </label>
                      <input
                        type="text"
                        required
                        value={partnerDomain}
                        onChange={(e) => setPartnerDomain(e.target.value)}
                        placeholder="linear.app"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        placeholder="partners@linear.app"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Partner Tier
                      </label>
                      <select
                        value={partnerTier}
                        onChange={(e) =>
                          setPartnerTier(e.target.value as EngagePartner['tier'])
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                      >
                        <option value="direct_brand">Direct Brand</option>
                        <option value="affiliate_network">Affiliate Network</option>
                        <option value="ecosystem_partner">Ecosystem Partner</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                    >
                      Verify & Add Partner
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {partners.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-400">
                          Verified • {p.tier}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400">
                        Domain: <span className="font-mono text-white">{p.domain}</span> •{' '}
                        {p.contactEmail}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        Allowed Destinations: {p.allowedDestinations.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: APPROVAL QUEUE */}
            {activeTab === 'approvals' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Content & Sponsorship Approval Queue
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Unapproved or rejected items are strictly blocked from serving in the chat experience.
                  </p>
                </div>

                <div className="space-y-3">
                  {content.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {item.title}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              item.approvalStatus === 'approved'
                                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50'
                                : item.approvalStatus === 'rejected'
                                ? 'text-red-400 bg-red-950/40 border-red-800/50'
                                : 'text-amber-300 bg-amber-950/40 border-amber-800/50'
                            }`}
                          >
                            {item.approvalStatus}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">{item.body}</p>
                        <div className="text-[10px] font-mono text-neutral-500">
                          Submitted by {item.createdBy} • Type: {item.type}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApprovalChange(item.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-xs text-emerald-300 cursor-pointer"
                        >
                          <Check size={13} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprovalChange(item.id, 'rejected')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-xs text-red-300 cursor-pointer"
                        >
                          <XCircle size={13} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: SCHEDULING */}
            {activeTab === 'scheduling' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Publishing Windows & Expiration Enforcement
                  </h3>
                  <p className="text-xs text-neutral-400">
                    The Hybrid Content Engine automatically filters out any item outside its active schedule window or past its expiration timestamp.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {content.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{item.title}</div>
                        <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                          Start: {item.scheduleStart || 'Immediate'} • End:{' '}
                          {item.scheduleEnd || 'Continuous'} • Expires:{' '}
                          {item.expiresAt || 'Never'}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                          Session Frequency Cap: {item.frequencyCapPerSession} impressions/session
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadContentForEdit(item)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-white cursor-pointer"
                      >
                        Modify Window
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: ANALYTICS */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Privacy-Preserving Performance & Attribution Report
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Aggregated session-hashed metrics with 10-second impression/click deduplication. Zero user prompts are stored.
                  </p>
                </div>

                {/* Category Performance */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-neutral-300">
                    Performance by Content Category
                  </h4>
                  <div className="divide-y divide-neutral-900">
                    {Object.entries(analytics.byCategory).length === 0 ? (
                      <div className="text-xs text-neutral-500 py-2">
                        No category events recorded yet in this window.
                      </div>
                    ) : (
                      Object.entries(analytics.byCategory).map(([cat, stats]) => (
                        <div
                          key={cat}
                          className="py-2 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-white">{cat}</span>
                          <div className="flex items-center gap-4 font-mono text-[11px] text-neutral-400">
                            <span>Impressions: {stats.impressions}</span>
                            <span>Clicks: {stats.clicks}</span>
                            <span>Interactions: {stats.interactions}</span>
                            <span>Dismissals: {stats.dismissals}</span>
                            <span className="text-emerald-400">
                              CTR: {stats.ctrPercent}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Campaign Performance */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-neutral-300">
                    Monetization Campaign Attribution
                  </h4>
                  <div className="divide-y divide-neutral-900">
                    {analytics.byCampaign.map((c) => (
                      <div
                        key={c.campaignId}
                        className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {c.campaignName}{' '}
                            <span className="text-neutral-500 font-normal">
                              ({c.partnerName})
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-neutral-500">
                            Status: {c.status} • Spend: ${c.spentUsd} / ${c.budgetUsd}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 font-mono text-[11px] text-neutral-300">
                          <span>Impr: {c.impressions}</span>
                          <span>Clicks: {c.clicks}</span>
                          <span>Conv: {c.conversions}</span>
                          <span className="text-emerald-400">CTR: {c.ctrPercent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: TRUST & SAFETY REPORTS */}
            {activeTab === 'safety' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    AI Trust &amp; Safety Incident Queue
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Review PII-scrubbed user safety reports submitted from Omnia chat responses and update moderation triage status.
                  </p>
                </div>

                {safetyReports.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 text-center">
                    No safety incident reports recorded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {safetyReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-white font-semibold">
                              {report.id}
                            </span>
                            {report.category && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                                {report.category}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                report.status === 'resolved'
                                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50'
                                  : report.status === 'dismissed'
                                  ? 'text-neutral-400 bg-neutral-900 border-neutral-800'
                                  : report.status === 'under_review'
                                  ? 'text-sky-300 bg-sky-950/40 border-sky-800/50'
                                  : 'text-amber-300 bg-amber-950/40 border-amber-800/50'
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {new Date(report.createdAt).toLocaleString()} • {report.modelId}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-neutral-200">
                          {report.reason}
                        </div>
                        <p className="text-xs text-neutral-400 bg-black/50 p-2.5 rounded-lg border border-neutral-900 whitespace-pre-wrap">
                          {report.details || 'No additional excerpt provided.'}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <input
                            type="text"
                            value={safetyNotesDraft[report.id] ?? report.reviewerNotes ?? ''}
                            onChange={(e) =>
                              setSafetyNotesDraft((prev) => ({
                                ...prev,
                                [report.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional moderation reviewer notes..."
                            className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSafetyReportStatus(report.id, 'under_review')
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-sky-300 cursor-pointer"
                            >
                              Under Review
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSafetyReportStatus(report.id, 'resolved')
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-[11px] text-emerald-300 cursor-pointer"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSafetyReportStatus(report.id, 'dismissed')
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-400 cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>

                        {report.reviewedBy && (
                          <div className="text-[10px] font-mono text-neutral-500">
                            Reviewed by {report.reviewedBy}
                            {report.reviewedAt ? ` at ${new Date(report.reviewedAt).toLocaleString()}` : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 9: GLOBAL CONFIG & AUDIT LOG */}
            {activeTab === 'config' && config && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    Global Kill-Switch & Experience Controls
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        key: 'enabled',
                        label: 'Master VIZRA Engage System Enabled',
                        val: config.enabled,
                      },
                      {
                        key: 'educationalEnabled',
                        label: 'Educational Knowledge & Creative Tips',
                        val: config.educationalEnabled,
                      },
                      {
                        key: 'interactiveEnabled',
                        label: 'Interactive Mini-Experiences (Polls/Quizzes)',
                        val: config.interactiveEnabled,
                      },
                      {
                        key: 'sponsoredEnabled',
                        label: 'Approved Direct Brand Sponsorships',
                        val: config.sponsoredEnabled,
                      },
                      {
                        key: 'affiliateEnabled',
                        label: 'Approved Affiliate Recommendations',
                        val: config.affiliateEnabled,
                      },
                      {
                        key: 'respectReducedMotion',
                        label: 'Honor OS Reduced-Motion Accessibility',
                        val: config.respectReducedMotion,
                      },
                    ].map((toggle) => (
                      <div
                        key={toggle.key}
                        className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-center justify-between"
                      >
                        <span className="text-xs text-neutral-200">{toggle.label}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateConfig({
                              [toggle.key]: !toggle.val,
                            } as Partial<EngageGlobalConfig>)
                          }
                          className={`px-3 py-1 rounded-lg text-[11px] font-mono font-semibold cursor-pointer ${
                            toggle.val
                              ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {toggle.val ? 'ACTIVE' : 'OFF'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Immutable Governance Audit Log */}
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-neutral-300">
                    Administrative Governance Audit Log ({auditLog.length} entries)
                  </h4>
                  <div className="max-h-60 overflow-y-auto divide-y divide-neutral-900 text-xs font-mono">
                    {auditLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="py-2 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <span className="text-[#eb3b2d] font-semibold">
                            [{entry.action}]
                          </span>{' '}
                          <span className="text-neutral-300">{entry.summary}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 shrink-0">
                          {entry.actor} • {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
