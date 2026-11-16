import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Shield,
  Zap,
  Trash2,
  Download,
  Check,
  User,
  Sliders,
  Globe,
  Lock,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { LiquidGlassToggle } from '../components/ui/LiquidGlassToggle';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CreditUsageIndicator } from '../components/ui/CreditUsageIndicator';
import { deleteUserFirestoreWorkspace } from '../services/firestoreService';
import { auth, deleteUser } from '../lib/firebase';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, openLoginModal, signOutUser } = useAuth();

  const [language, setLanguage] = useState<'auto' | 'en' | 'hi' | 'hinglish'>(() => {
    return (localStorage.getItem('vizra_pref_language') as any) || 'auto';
  });
  const [responseStyle, setResponseStyle] = useState<'concise' | 'detailed' | 'kinetic'>(() => {
    return (localStorage.getItem('vizra_pref_style') as any) || 'kinetic';
  });
  const [streamSpeed, setStreamSpeed] = useState<'fast' | 'natural'>(() => {
    return (localStorage.getItem('vizra_pref_speed') as any) || 'fast';
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);
  const [deleteReceipt, setDeleteReceipt] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [agePolicyOverview, setAgePolicyOverview] = useState<{
    activePolicy: string;
    minimumActiveAge: number;
    option2Active: boolean;
    option3VendorConfigured: boolean;
    option4EnforcedEndpoints: number;
    option5Rejected: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/compliance/age-assurance/policy')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setAgePolicyOverview({
          activePolicy: data.activePolicy || 'STRICT_18_PLUS',
          minimumActiveAge: Number(data.minimumActiveAge || 18),
          option2Active: Boolean(data.option2Preparatory?.active),
          option3VendorConfigured: Boolean(data.option3ParentalConsent?.parentalVendorConfigured),
          option4EnforcedEndpoints: Array.isArray(data.option4FeatureRestrictions?.enforcedEndpoints)
            ? data.option4FeatureRestrictions.enforcedEndpoints.length
            : 0,
          option5Rejected: Boolean(data.option5?.rejected),
        });
      })
      .catch(() => {
        // Non-blocking
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem('vizra_pref_language', language);
    localStorage.setItem('vizra_pref_style', responseStyle);
    localStorage.setItem('vizra_pref_speed', streamSpeed);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2400);
  };

  const handleClearLocalData = () => {
    localStorage.removeItem('omnia_conversations_v1');
    localStorage.removeItem('omnia_draft_prompt');
    localStorage.removeItem('vizra_omnia_personal_memories_v1');
    localStorage.removeItem('vizra_omnia_personal_memories_v1_anon');
    if (user?.uid) {
      localStorage.removeItem(`vizra_omnia_personal_memories_v1_${user.uid}`);
    }
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2400);
  };

  const handleDeleteAccountAndData = async () => {
    setIsDeletingAccount(true);
    setDeleteReceipt(null);
    try {
      const headers: Record<string, string> = {};
      if (user && typeof (user as any).getIdToken === 'function') {
        const idToken = await (user as any).getIdToken();
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }
      } else {
        const clientId = localStorage.getItem('vizra_client_tenant_id_v1') || 'anon_client_purge';
        headers['X-Vizra-Client-Id'] = clientId;
      }

      // Collect conversation IDs prior to clearing localStorage so Firestore messages can be cascaded
      let conversationIds: string[] = [];
      try {
        const rawConvs = localStorage.getItem('omnia_conversations_v1');
        if (rawConvs) {
          const parsed = JSON.parse(rawConvs);
          if (Array.isArray(parsed)) {
            conversationIds = parsed.map((c: any) => String(c?.id || '')).filter(Boolean);
          }
        }
      } catch {
        // Ignore parse failures
      }

      const res = await fetch('/api/account/data', {
        method: 'DELETE',
        headers,
      });
      const data = await res.json().catch(() => null);

      let cloudDeletedNote = '';
      if (user?.uid) {
        const fsRes = await deleteUserFirestoreWorkspace(user.uid, conversationIds);
        cloudDeletedNote = ` Cloud docs purged (projects: ${fsRes.deletedProjects}, messages: ${fsRes.deletedMessages}).`;
        if (auth.currentUser && auth.currentUser.uid === user.uid) {
          try {
            await deleteUser(auth.currentUser);
            cloudDeletedNote += ' Firebase Auth account deleted.';
          } catch (authDelErr: any) {
            if (authDelErr?.code === 'auth/requires-recent-login') {
              cloudDeletedNote += ' Re-authenticate cleanly if permanently deleting Firebase login credentials.';
            }
          }
        }
      }

      handleClearLocalData();
      localStorage.removeItem('vizra_workspace_uploaded_assets_v1');
      localStorage.removeItem('vizra_workspace_client_tokens_v1');
      localStorage.removeItem('vizra_active_plan_v1');

      if (user) {
        await signOutUser();
      }

      setDeleteReceipt(
        (data?.receiptId
          ? `Erasure complete (Receipt: ${data.receiptId}).`
          : 'Local & server workspace data purged.') + cloudDeletedNote
      );
    } catch {
      handleClearLocalData();
      setDeleteReceipt('Local workspace data purged.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <PageLayout
      title="Application Settings — Vizra AI Creative Studio"
      description="Configure your Vizra studio theme, Omnia 1.0 response style, language preferences, local cache, and privacy controls."
      canonicalPath="/settings"
      noindex={true}
    >
      <div className="pt-24 pb-28 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="pb-6 border-b border-neutral-300 dark:border-white/10">
          <div className="typo-eyebrow flex items-center gap-2">
            <SettingsIcon size={14} />
            <span>Studio Preferences & Configuration</span>
          </div>
          <h1 className="typo-section-title mt-1">Application Settings</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            Manage your global visual theme, account credentials, model response tone, and local memory.
          </p>
        </div>

        {/* Section 1: Appearance & Liquid Glass Theme Toggle */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                {theme === 'dark' ? <Moon size={18} className="text-[#eb3b2d]" /> : <Sun size={18} className="text-amber-500" />}
                <span>Global Visual Appearance</span>
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Toggle between Obsidian Dark Mode (default) and Studio Light Mode using the Liquid Glass Surface Tension switch.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
              <LiquidGlassToggle size="md" />
            </div>
          </div>
        </div>

        {/* Section 2: Account & Entitlements */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <User size={18} className="text-[#eb3b2d]" />
                <span>Account & Studio Identity</span>
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                {user
                  ? `Signed in as ${user.displayName || 'Creator'} (${user.email})`
                  : 'You are using Vizra in guest creator mode.'}
              </p>
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => signOutUser()}
                className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white font-medium cursor-pointer transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Sign In / Register
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-neutral-900 dark:text-white block">
                Credit Allowance & Priority Compute
              </span>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                View your real-time generation credit quota and upgrade options.
              </span>
            </div>
            <CreditUsageIndicator variant="header" />
          </div>
        </div>

        {/* Section 3: Omnia AI Behavior & Tone */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Sliders size={18} className="text-[#eb3b2d]" />
            <span>AI Response Preferences</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Language */}
            <div>
              <label
                htmlFor="settings-language-select"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Conversation Language
              </label>
              <select
                id="settings-language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#eb3b2d]"
              >
                <option value="auto">Auto-Detect Intent</option>
                <option value="en">English (US/UK)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="hinglish">Hinglish (Conversational)</option>
              </select>
            </div>

            {/* Response Style */}
            <div>
              <label
                htmlFor="settings-style-select"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Response Proportionality
              </label>
              <select
                id="settings-style-select"
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#eb3b2d]"
              >
                <option value="kinetic">Proportional (Default)</option>
                <option value="concise">Ultra-Concise</option>
                <option value="detailed">In-Depth & Exhaustive</option>
              </select>
            </div>

            {/* Stream Pacing */}
            <div>
              <label
                htmlFor="settings-stream-select"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Generation Streaming
              </label>
              <select
                id="settings-stream-select"
                value={streamSpeed}
                onChange={(e) => setStreamSpeed(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#eb3b2d]"
              >
                <option value="fast">High-Throughput (Fast)</option>
                <option value="natural">Natural Pacing</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedNotice ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <Check size={14} /> Preferences saved
              </span>
            ) : (
              <span className="text-[11px] text-neutral-500">Settings apply across all Omnia 1.0 sessions.</span>
            )}
            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-4 py-2 rounded-xl bg-[#eb3b2d] hover:bg-[#dc2626] text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>

        {/* Section 4: Privacy, Cache & Account Data Erasure */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield size={18} className="text-[#eb3b2d]" />
            <span>Privacy, Storage &amp; Data Erasure Controls</span>
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Vizra routes AI requests through server-side proxies with user-scoped storage and zero third-party advertising trackers. Review our Privacy Policy for subprocessor retention details.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <span className="text-xs font-medium text-neutral-900 dark:text-white block">
                Clear Local Browser Cache
              </span>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Removes saved conversation threads, memories, and drafts from this browser.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {clearedNotice && (
                <span className="text-xs font-mono text-emerald-500 dark:text-emerald-400">Cache cleared</span>
              )}
              <button
                type="button"
                onClick={handleClearLocalData}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Clear Local Cache</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-white/10">
            <div>
              <span className="text-xs font-medium text-red-600 dark:text-red-400 block">
                Delete Account &amp; Server Data (GDPR Art. 17 / DPDP Erasure)
              </span>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Purges server-side credit ledgers, contact/early-access records, and local workspace storage.
              </span>
              {deleteReceipt && (
                <span className="block text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {deleteReceipt}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={isDeletingAccount}
              onClick={handleDeleteAccountAndData}
              className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>{isDeletingAccount ? 'Purging Data…' : 'Delete Account & Data'}</span>
            </button>
          </div>
        </div>

        {/* Section 5: Child Online Safety & Age Assurance Governance */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Lock size={18} className="text-[#eb3b2d]" />
                <span>Child Online Safety &amp; Age Assurance Policy</span>
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Live platform policy posture and server-enforced minor protection boundaries.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#eb3b2d]/15 border border-[#eb3b2d]/40 text-[11px] font-mono text-[#eb3b2d] shrink-0">
              {agePolicyOverview?.activePolicy || 'STRICT_18_PLUS'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-white/10 space-y-1">
              <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 uppercase">Option 3 • Parental Consent</div>
              <div className="font-medium text-neutral-900 dark:text-white">
                {agePolicyOverview?.option3VendorConfigured
                  ? 'External VPC Vendor Configured'
                  : 'Blocked Pending External VPC Vendor & Counsel Sign-Off'}
              </div>
              <div className="text-[11px] text-neutral-600 dark:text-neutral-500">
                Jurisdiction thresholds (US 13, EU 13–16, UK 13/AADC 18, IN 18), fail-closed 424 guard, consent withdrawal, and Delete Account cascade active.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-white/10 space-y-1">
              <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 uppercase">Option 4 • Feature Safeguards</div>
              <div className="font-medium text-neutral-900 dark:text-white">
                Server-Enforced ({agePolicyOverview?.option4EnforcedEndpoints ?? 8} Protected Routes)
              </div>
              <div className="text-[11px] text-neutral-600 dark:text-neutral-500">
                Blocks under-18 Voice Live, OAuth connectors, unrestricted music, commercial Engage placements, and paid upgrades. Option 2 Teen access stays dormant; Option 5 stays rejected.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
