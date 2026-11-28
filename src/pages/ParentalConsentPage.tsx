import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Shield,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  UserCheck,
  FileWarning,
  RefreshCw,
  ArrowRight,
  Ban,
  Info,
  Trash2,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { auth } from '../lib/firebase';

type JurisdictionCode = 'IN' | 'US' | 'EU' | 'UK' | 'GLOBAL';
type ActiveTab = 'routing' | 'minor_invite' | 'parent_review' | 'manage';

interface AgeStatusResponse {
  activePolicy: string;
  environment: 'OMNIA_ADULT' | 'OMNIA_YOUTH' | 'BLOCKED';
  ageStatus: string;
  consentStatus: string;
  accountAccessState: string;
  jurisdiction: string;
  isMinorBlocked: boolean;
  featurePermissions: Record<string, boolean>;
  resourceLimits: {
    maxPromptChars: number;
    maxAttachments: number;
    maxAttachmentSizeMb: number;
    allowAudioUploads: boolean;
    maxLocalRagMb: number;
  };
}

interface InvitationPreview {
  invitationId: string;
  consentId: string;
  jurisdiction: string;
  jurisdictionLabel?: string;
  applicableStatutes?: string[];
  verificationStandardNote?: string;
  status: string;
  expiresAt: string;
  policyVersion: string;
}

interface ConsentRecordSummary {
  consent_id: string;
  child_uid: string;
  parent_uid: string | null;
  jurisdiction: string;
  status: string;
  verification_method: string;
  policy_version: string;
  verified_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  updated_at: string;
}

const DEFAULT_SEVEN_DISCLOSURE_POINTS = [
  'What data VIZRA collects for an Omnia Youth account (account credentials, prompts, projects, and restricted file uploads — zero raw birthdates or identity documents stored).',
  'How Omnia processes prompts via server-proxied AI APIs (Google Gemini) with youth-safe directives and strict BLOCK_LOW_AND_ABOVE safety filters.',
  'Which Omnia Youth features are permitted (core conversational AI, educational & coding assistance, filtered web research, restricted file analysis) and which remain disabled (Live Voice, unrestricted audio synthesis, paid upgrades, external connectors, targeted ads).',
  'Retention rules, data minimization, and that child conversations are NOT automatically exposed to parent accounts.',
  'Zero behavioral age inference, zero behavioral profiling, and zero targeted advertising for minors.',
  'How to review consent status, immediately withdraw/revoke consent, or request permanent account & data deletion at any time.',
  'That verification of parent/guardian identity and legal authority is required by law and cannot be satisfied by an ordinary email confirmation or checkbox alone.',
];

function getOrCreateClientId(): string {
  const key = 'vizra_anonymous_client_id';
  try {
    const existing = localStorage.getItem(key);
    if (existing && /^[a-zA-Z0-9_-]{16,64}$/.test(existing)) return existing;
    const generated = `vz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
    localStorage.setItem(key, generated);
    return generated;
  } catch {
    return `vz_${Date.now().toString(36)}_sessionclient01`;
  }
}

async function getRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Vizra-Client-Id': getOrCreateClientId(),
  };
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // Proceed with client ID header
    }
  }
  return headers;
}

export const ParentalConsentPage: React.FC = () => {
  const { user, openLoginModal } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteParam = searchParams.get('invite') || '';

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    inviteParam ? 'parent_review' : 'routing'
  );
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusData, setStatusData] = useState<AgeStatusResponse | null>(null);
  const [vpcVendorConfigured, setVpcVendorConfigured] = useState(false);

  // Step 1: Age Declaration Routing (DOB evaluated transiently; ZERO raw DOB stored)
  const [jurisdiction, setJurisdiction] = useState<JurisdictionCode>('IN');
  const [dateOfBirth, setDateOfBirth] = useState<string>('2010-06-15');
  const [submittingEval, setSubmittingEval] = useState(false);
  const [evalMessage, setEvalMessage] = useState<string | null>(null);

  // Step 2-3: Minor Invitation Generator
  const [parentEmail, setParentEmail] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [generatedInviteExpiry, setGeneratedInviteExpiry] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Step 4-7: Parent Review & Approval
  const [inviteTokenInput, setInviteTokenInput] = useState(inviteParam);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [invitePreview, setInvitePreview] = useState<InvitationPreview | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [acknowledgedPoints, setAcknowledgedPoints] = useState<boolean[]>(
    () => new Array(7).fill(false)
  );
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{
    consentId?: string;
    consentStatus: string;
    message: string;
    requiresExternalVerification: boolean;
  } | null>(null);

  // Step 9: Manage & Revoke
  const [consentRecords, setConsentRecords] = useState<ConsentRecordSummary[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchAccountStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const headers = await getRequestHeaders();
      const [statusRes, policyRes] = await Promise.all([
        fetch('/api/compliance/age-assurance/status', { headers }),
        fetch('/api/compliance/age-assurance/policy'),
      ]);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatusData(data);
      }
      if (policyRes.ok) {
        const pData = await policyRes.json();
        setVpcVendorConfigured(Boolean(pData?.option3ParentalConsent?.parentalVendorConfigured));
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchConsentRecords = useCallback(async () => {
    if (!auth.currentUser) {
      setConsentRecords([]);
      return;
    }
    setLoadingRecords(true);
    try {
      const headers = await getRequestHeaders();
      const res = await fetch('/api/compliance/parental-consent/status', { headers });
      if (res.ok) {
        const data = await res.json();
        const combined: ConsentRecordSummary[] = [
          ...(Array.isArray(data.asChild) ? data.asChild : []),
          ...(Array.isArray(data.asParent) ? data.asParent : []),
        ];
        const unique = Array.from(
          new Map(combined.map((item) => [item.consent_id, item])).values()
        );
        setConsentRecords(unique);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  const fetchInvitePreview = useCallback(async (rawToken: string) => {
    const clean = rawToken.trim();
    if (!clean) return;
    setLoadingInvite(true);
    setInviteError(null);
    setInvitePreview(null);
    try {
      const res = await fetch(
        `/api/compliance/parental-consent/invitations/${encodeURIComponent(clean)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data?.error?.message || 'Unable to load invitation.');
      } else {
        setInvitePreview(data.invitation || null);
      }
    } catch {
      setInviteError('Network error while checking invitation link.');
    } finally {
      setLoadingInvite(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountStatus();
    fetchConsentRecords();
  }, [user?.uid, fetchAccountStatus, fetchConsentRecords]);

  useEffect(() => {
    if (inviteParam) {
      setInviteTokenInput(inviteParam);
      setActiveTab('parent_review');
      fetchInvitePreview(inviteParam);
    }
  }, [inviteParam, fetchInvitePreview]);

  const handleEvaluateAge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      toast({
        title: 'Valid date required',
        description: 'Enter a valid date of birth (YYYY-MM-DD). Raw birthdates are never stored.',
        type: 'warning',
      });
      return;
    }
    setSubmittingEval(true);
    setEvalMessage(null);
    try {
      const headers = await getRequestHeaders();
      const res = await fetch('/api/compliance/age-assurance/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ dateOfBirth, jurisdiction }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 403) {
        toast({
          title: 'Evaluation failed',
          description: data?.error?.message || 'Could not evaluate age declaration.',
          type: 'error',
        });
      } else if (res.status === 403) {
        setEvalMessage(data?.error?.message || 'Access restricted under age assurance safeguards.');
        await fetchAccountStatus();
        toast({
          title: 'Access restricted',
          description: data?.error?.message || 'Under-13 or circumvention guard triggered.',
          type: 'warning',
        });
      } else {
        setEvalMessage(
          data?.nextStep?.message ||
            (data.environment === 'OMNIA_ADULT'
              ? 'Routed to Omnia Adult (18+).'
              : 'Routed to Omnia Youth parental consent workflow.')
        );
        await fetchAccountStatus();
        toast({
          title: 'Age routing updated',
          description: `State: ${data.accountAccessState || 'Updated'}`,
          type: 'success',
        });
        if (data.requiresParentalConsent) {
          setActiveTab('minor_invite');
        }
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Could not reach age assurance endpoint.',
        type: 'error',
      });
    } finally {
      setSubmittingEval(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      openLoginModal('Sign in with the minor account first to generate a parental consent invitation.');
      return;
    }
    const cleanEmail = parentEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({
        title: 'Valid guardian email required',
        description: 'Enter your parent or legal guardian email address.',
        type: 'warning',
      });
      return;
    }
    setCreatingInvite(true);
    setGeneratedInviteUrl(null);
    try {
      const headers = await getRequestHeaders();
      const res = await fetch('/api/compliance/parental-consent/invitations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parentEmail: cleanEmail,
          jurisdiction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: 'Could not create invitation',
          description: data?.error?.message || 'Invitation request rejected.',
          type: 'error',
        });
      } else {
        const token = data.invitationToken || '';
        const url = `${window.location.origin}/parental-consent?invite=${encodeURIComponent(token)}`;
        setGeneratedInviteUrl(url);
        setGeneratedInviteExpiry(data.expiresAt || null);
        await fetchAccountStatus();
        await fetchConsentRecords();
        toast({
          title: 'Parental invitation created',
          description: 'Share this expiring 72-hour link with your parent or legal guardian.',
          type: 'success',
        });
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Unable to create parental consent invitation.',
        type: 'error',
      });
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!generatedInviteUrl) return;
    try {
      await navigator.clipboard.writeText(generatedInviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      toast({
        title: 'Copy manually',
        description: 'Select the link field and copy it directly.',
        type: 'info',
      });
    }
  };

  const allDisclosuresChecked = acknowledgedPoints.every(Boolean);

  const handleParentApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      openLoginModal('Sign in with your own parent/guardian account (separate from the child account) to review and approve consent.');
      return;
    }
    if (!allDisclosuresChecked) {
      toast({
        title: 'Review all 7 disclosures',
        description: 'All seven consent disclosure points must be explicitly acknowledged.',
        type: 'warning',
      });
      return;
    }
    setSubmittingApproval(true);
    setApprovalResult(null);
    try {
      const headers = await getRequestHeaders();
      const res = await fetch('/api/compliance/parental-consent/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          invitationToken: inviteTokenInput.trim(),
          acknowledgedDisclosures: true,
          policyVersion: invitePreview?.policyVersion,
        }),
      });
      const data = await res.json();
      if (res.status === 424) {
        // Expected fail-closed behavior when external VPC provider is not yet configured
        setApprovalResult({
          consentId: data.consentId,
          consentStatus: data.status || 'PARENTAL_CONSENT_PENDING',
          message:
            data?.error?.message ||
            'Parent authentication & 7-point disclosure recorded. External identity/authority verification is required before Omnia Youth activation (fail-closed).',
          requiresExternalVerification: true,
        });
        await fetchAccountStatus();
        await fetchConsentRecords();
        toast({
          title: 'Pending external verification (Fail-Closed)',
          description: 'Parent disclosure recorded; Omnia Youth remains locked until verified by an accredited VPC provider.',
          type: 'info',
        });
      } else if (!res.ok) {
        toast({
          title: 'Approval rejected',
          description: data?.error?.message || 'Unable to process parental consent approval.',
          type: 'error',
        });
      } else {
        setApprovalResult({
          consentId: data?.consent?.consent_id,
          consentStatus: data?.consent?.status || 'PARENTAL_CONSENT_VERIFIED',
          message: data.message || 'Parental consent verified.',
          requiresExternalVerification: false,
        });
        await fetchAccountStatus();
        await fetchConsentRecords();
        toast({
          title: 'Parental consent verified',
          description: 'Omnia Youth access has been activated with mandatory safeguards.',
          type: 'success',
        });
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Could not reach parental consent approval endpoint.',
        type: 'error',
      });
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    if (!auth.currentUser) {
      openLoginModal('Sign in to revoke parental consent.');
      return;
    }
    setRevokingId(consentId);
    try {
      const headers = await getRequestHeaders();
      const res = await fetch('/api/compliance/parental-consent/revoke', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          consentId,
          reason: 'Parent/guardian or account holder initiated immediate withdrawal via VIZRA portal',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: 'Revocation failed',
          description: data?.error?.message || 'Could not revoke consent.',
          type: 'error',
        });
      } else {
        toast({
          title: 'Parental consent revoked immediately',
          description: 'Protected youth access has been suspended across all endpoints.',
          type: 'success',
        });
        await fetchAccountStatus();
        await fetchConsentRecords();
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Unable to revoke consent right now.',
        type: 'error',
      });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <PageLayout
      title="Age Assurance & Parental Consent"
      description="Privacy-first age assurance, Omnia Adult and Omnia Youth access environments, verifiable parental consent workflow, and instant consent withdrawal."
      noindex={true}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Header */}
        <header className="space-y-3 border-b border-neutral-200 dark:border-white/10 pb-8">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#EB3B2D]">
            VIZRA Age Assurance &amp; Parental Consent Framework
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Omnia Adult &amp; Omnia Youth Access Governance
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
            VIZRA uses privacy-first age routing paired with jurisdiction-aware, server-enforced verifiable parental consent. Age declaration is a routing step, never standalone proof of age, and VIZRA performs zero behavioral age inference or targeted advertising.
          </p>
        </header>

        {/* Live Server-Authoritative Status Strip */}
        <section className="rounded-2xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Shield size={18} className="text-[#EB3B2D]" />
              <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">
                Current Server-Authoritative Access State
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                fetchAccountStatus();
                fetchConsentRecords();
              }}
              disabled={loadingStatus}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white cursor-pointer"
            >
              <RefreshCw size={13} className={loadingStatus ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10">
              <div className="text-[11px] font-mono text-neutral-500 uppercase">Environment</div>
              <div className="mt-1 font-semibold text-neutral-950 dark:text-white">
                {statusData?.environment || 'UNASSESSED'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10">
              <div className="text-[11px] font-mono text-neutral-500 uppercase">Access State</div>
              <div className="mt-1 font-mono text-[11px] font-semibold text-[#EB3B2D]">
                {statusData?.accountAccessState || 'UNASSESSED'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10">
              <div className="text-[11px] font-mono text-neutral-500 uppercase">Consent Status</div>
              <div className="mt-1 font-mono text-[11px] font-semibold text-neutral-900 dark:text-neutral-200">
                {statusData?.consentStatus || 'NOT_REQUIRED'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10">
              <div className="text-[11px] font-mono text-neutral-500 uppercase">External VPC Provider</div>
              <div className="mt-1 font-medium text-neutral-900 dark:text-neutral-200">
                {vpcVendorConfigured ? 'Webhook Configured' : 'Fail-Closed (Pending Vendor)'}
              </div>
            </div>
          </div>

          {!user && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-200 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-400">
              <span>Sign in with Firebase Authentication to initiate, approve, or revoke parental consent records.</span>
              <button
                type="button"
                onClick={() => openLoginModal('Sign in to manage age assurance and parental consent.')}
                className="px-3.5 py-1.5 rounded-lg bg-[#EB3B2D] hover:bg-[#d63225] text-white font-medium cursor-pointer transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </section>

        {/* Workflow Navigation Tabs */}
        <nav
          aria-label="Parental consent workflow steps"
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 border-b border-neutral-200 dark:border-white/10 pb-3"
        >
          {(
            [
              { id: 'routing', label: '1. Age Routing' },
              { id: 'minor_invite', label: '2. Request Consent' },
              { id: 'parent_review', label: '3. Parent Review' },
              { id: 'manage', label: '4. Manage & Revoke' },
            ] as Array<{ id: ActiveTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-[#EB3B2D] text-white border-[#EB3B2D]'
                  : 'bg-white dark:bg-[#111111] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:border-[#EB3B2D]/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* TAB 1: Age Declaration Routing */}
        {activeTab === 'routing' && (
          <section className="rounded-2xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                Step 1 — Privacy-First Age Declaration &amp; Jurisdiction Routing
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Your date of birth is evaluated transiently in memory solely to compute your non-PII age bracket and jurisdiction workflow (India DPDP Act &amp; Rules, US COPPA, EU GDPR Art. 8 &amp; DSA, UK AADC). Raw birthdates are never stored.
              </p>
            </div>

            <form onSubmit={handleEvaluateAge} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label htmlFor="jurisdiction-select" className="block text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  Jurisdiction
                </label>
                <select
                  id="jurisdiction-select"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value as JurisdictionCode)}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs text-neutral-950 dark:text-white focus:outline-none focus:border-[#EB3B2D]"
                >
                  <option value="IN">India (DPDP Act &amp; Rules — Under 18 requires VPC)</option>
                  <option value="US">United States (COPPA — Under 13 blocked; 13–17 Youth)</option>
                  <option value="EU">European Union (GDPR Art. 8 &amp; DSA — Under 16 VPC)</option>
                  <option value="UK">United Kingdom (UK AADC — Under 18 safeguards)</option>
                  <option value="GLOBAL">Other Jurisdiction (Conservative Youth baseline)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dob-input" className="block text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  Date of Birth (Not Stored)
                </label>
                <input
                  id="dob-input"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs text-neutral-950 dark:text-white focus:outline-none focus:border-[#EB3B2D]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingEval}
                className="px-4 py-2.5 rounded-xl bg-[#EB3B2D] hover:bg-[#d63225] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
              >
                {submittingEval ? 'Evaluating…' : 'Evaluate Access Path'}
              </button>
            </form>

            {evalMessage && (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-2.5">
                <Info size={16} className="text-[#EB3B2D] shrink-0 mt-0.5" />
                <span>{evalMessage}</span>
              </div>
            )}

            {/* Omnia Adult vs Omnia Youth Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 space-y-2.5">
                <div className="text-xs font-mono font-semibold text-neutral-900 dark:text-white">
                  OMNIA ADULT (18+)
                </div>
                <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <li>• Core Omnia chat, streaming, deep thinking &amp; research</li>
                  <li>• Vision, PDF/document analysis (up to 5 files, 10MB, 50k chars)</li>
                  <li>• Live Voice WebSocket &amp; Lyria music synthesis</li>
                  <li>• OAuth external connectors &amp; paid credit upgrades</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-[#EB3B2D]/30 space-y-2.5">
                <div className="text-xs font-mono font-semibold text-[#EB3B2D]">
                  OMNIA YOUTH (Verified Parental Consent Required)
                </div>
                <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <li>• Permitted: Core AI chat, educational &amp; coding help, filtered research, restricted file analysis (max 2 files, ≤5MB, no audio uploads, 25k chars)</li>
                  <li>• Disabled even with consent: Live Voice, unrestricted audio synthesis, paid upgrades, external OAuth connectors, targeted ads</li>
                  <li>• Privacy: Zero behavioral profiling; child chats are NOT auto-exposed to parents</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: Minor Invitation Generator */}
        {activeTab === 'minor_invite' && (
          <section className="rounded-2xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                Steps 2 &amp; 3 — Generate Secure Parent/Guardian Invitation
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Signed-in minors can generate a cryptographically signed, 72-hour expiring invitation link. Your parent or guardian must sign in with their own separate Firebase account — self-approval using the same account is strictly blocked.
              </p>
            </div>

            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="guardian-email" className="block text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    Parent or Legal Guardian Email
                  </label>
                  <input
                    id="guardian-email"
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs text-neutral-950 dark:text-white focus:outline-none focus:border-[#EB3B2D]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="minor-jurisdiction" className="block text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    Jurisdiction
                  </label>
                  <select
                    id="minor-jurisdiction"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value as JurisdictionCode)}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs text-neutral-950 dark:text-white focus:outline-none focus:border-[#EB3B2D]"
                  >
                    <option value="IN">India (DPDP)</option>
                    <option value="US">United States (COPPA)</option>
                    <option value="EU">European Union (GDPR/DSA)</option>
                    <option value="UK">United Kingdom (AADC)</option>
                    <option value="GLOBAL">Other</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingInvite}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EB3B2D] hover:bg-[#d63225] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
              >
                <span>{creatingInvite ? 'Generating Signed Link…' : 'Create Expiring Guardian Invitation'}</span>
                <ArrowRight size={14} />
              </button>
            </form>

            {generatedInviteUrl && (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  <span>Secure Parental Consent Invitation Ready</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteUrl}
                    aria-label="Parental consent invitation URL"
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-[11px] font-mono text-neutral-800 dark:text-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-medium cursor-pointer"
                  >
                    {copiedInvite ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedInvite ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
                {generatedInviteExpiry && (
                  <p className="text-[11px] font-mono text-neutral-500">
                    Expires: {new Date(generatedInviteExpiry).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Parent Review & 7-Point Consent Disclosure */}
        {activeTab === 'parent_review' && (
          <section className="rounded-2xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                Steps 4–7 — Independent Parent Authentication &amp; 7-Point Disclosure
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Review the child’s consent request, verify that you are signed into your own separate verified parent/guardian account, and explicitly acknowledge all seven privacy and safety disclosures.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inviteTokenInput}
                onChange={(e) => setInviteTokenInput(e.target.value)}
                placeholder="Paste invitation token (or open the full ?invite= link)"
                className="flex-1 px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-950 dark:text-white focus:outline-none focus:border-[#EB3B2D]"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchParams(inviteTokenInput.trim() ? { invite: inviteTokenInput.trim() } : {});
                  fetchInvitePreview(inviteTokenInput);
                }}
                disabled={loadingInvite || !inviteTokenInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                {loadingInvite ? 'Loading…' : 'Load Invitation'}
              </button>
            </div>

            {inviteError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <FileWarning size={16} />
                <span>{inviteError}</span>
              </div>
            )}

            {invitePreview && (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-mono text-neutral-500 block">Consent ID</span>
                  <span className="font-mono text-neutral-900 dark:text-white">{invitePreview.consentId}</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-neutral-500 block">Jurisdiction</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {invitePreview.jurisdictionLabel || invitePreview.jurisdiction}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-neutral-500 block">Status</span>
                  <span className="font-mono text-[#EB3B2D]">{invitePreview.status}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleParentApprove} className="space-y-5">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-neutral-950 dark:text-white">
                  Required 7-Point Parental Consent Disclosure
                </div>
                <div className="space-y-2.5">
                  {DEFAULT_SEVEN_DISCLOSURE_POINTS.map((point, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 cursor-pointer hover:border-[#EB3B2D]/40 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(acknowledgedPoints[idx])}
                        onChange={(e) => {
                          const next = [...acknowledgedPoints];
                          next[idx] = e.target.checked;
                          setAcknowledgedPoints(next);
                        }}
                        className="mt-0.5 accent-[#EB3B2D] shrink-0"
                      />
                      <span className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        <strong className="font-mono text-[#EB3B2D] mr-1.5">0{idx + 1}.</strong>
                        {point}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Fail-Closed Verification Notice:</strong> Submitting this form verifies independent parent authentication and disclosure acceptance, then requires independent external identity/authority verification (such as an India DPDP DigiLocker/Virtual Token verifier or accredited VPC provider webhook) before Omnia Youth is unlocked.
                </span>
              </div>

              <button
                type="submit"
                disabled={submittingApproval || !inviteTokenInput.trim() || !allDisclosuresChecked}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EB3B2D] hover:bg-[#d63225] text-white text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors"
              >
                <UserCheck size={15} />
                <span>{submittingApproval ? 'Submitting Authorization…' : 'Record Parent Authorization & Initiate Verification'}</span>
              </button>
            </form>

            {approvalResult && (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-emerald-500/30 space-y-2 text-xs">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {approvalResult.consentId ? `Consent ID: ${approvalResult.consentId} — ` : ''}
                  Status: <span className="font-mono">{approvalResult.consentStatus}</span>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300">{approvalResult.message}</p>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: Manage, Withdraw & Data Erasure */}
        {activeTab === 'manage' && (
          <section className="rounded-2xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                  Steps 9 &amp; 10 — Review, Withdraw Consent &amp; Erasure
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Revoking consent immediately transitions the linked minor account to <code className="font-mono">PARENTAL_CONSENT_REVOKED</code> and blocks all protected AI endpoints.
                </p>
              </div>
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:border-[#EB3B2D]/40"
              >
                <Trash2 size={13} className="text-[#EB3B2D]" />
                <span>Full Account Erasure in Settings</span>
              </Link>
            </div>

            {!user ? (
              <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-400">
                Sign in to view your parental consent records and withdrawal controls.
              </div>
            ) : loadingRecords ? (
              <div className="text-xs font-mono text-neutral-500">Loading consent records…</div>
            ) : consentRecords.length === 0 ? (
              <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-400">
                No parental consent records are currently associated with this account.
              </div>
            ) : (
              <div className="space-y-3">
                {consentRecords.map((rec) => {
                  const isRevoked = rec.status === 'PARENTAL_CONSENT_REVOKED';
                  return (
                    <div
                      key={rec.consent_id}
                      className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-semibold text-neutral-950 dark:text-white">
                            {rec.consent_id}
                          </span>
                          <span className="font-mono text-[11px] text-[#EB3B2D]">
                            {rec.status}
                          </span>
                          <span className="font-mono text-[11px] text-neutral-500">
                            {rec.jurisdiction}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          Method: {rec.verification_method} • Updated: {new Date(rec.updated_at).toLocaleString()}
                        </div>
                      </div>

                      {!isRevoked && (
                        <button
                          type="button"
                          disabled={revokingId === rec.consent_id}
                          onClick={() => handleRevokeConsent(rec.consent_id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <Ban size={13} />
                          <span>{revokingId === rec.consent_id ? 'Revoking…' : 'Revoke Consent Immediately'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-start gap-2.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              <Lock size={14} className="shrink-0 mt-0.5 text-[#EB3B2D]" />
              <span>
                Firestore security rules strictly deny all client writes to <code className="font-mono">/parental_consents</code>, <code className="font-mono">/parent_child_relationships</code>, and <code className="font-mono">/consent_audit_logs</code>. Child conversations under <code className="font-mono">/users/&#123;childUid&#125;/conversations</code> remain private to the child account and are never exposed to parent accounts.
              </span>
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
};
