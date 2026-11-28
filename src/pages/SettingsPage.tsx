import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Shield,
  Trash2,
  Check,
  User,
  Sliders,
  Lock,
  Link2,
  Unlink,
  MailCheck,
  KeyRound,
  AlertTriangle,
  Database,
  X,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { LiquidGlassToggle } from '../components/ui/LiquidGlassToggle';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { CreditUsageIndicator } from '../components/ui/CreditUsageIndicator';
import { deleteUserFirestoreWorkspace } from '../services/firestoreService';
import { auth, deleteUser } from '../lib/firebase';

const DPDP_DATA_INVENTORY = [
  {
    category: 'Account Identity & Linked Providers',
    location: 'Firebase Auth & Firestore users/{uid}',
    purpose: 'Sign-in authentication, email verification, and session continuity',
    retention: 'Until account deletion',
    erasure: 'Purged on Delete Account',
  },
  {
    category: 'Saved Chats & Projects',
    location: 'Firestore users/{uid}/* & browser localStorage',
    purpose: 'Multi-device workspace history & 10-stage creative project state',
    retention: 'Until user deletes chat/project or account',
    erasure: 'Deleted immediately (Temporary Chat is never saved)',
  },
  {
    category: 'Personal AI Preferences & Memory',
    location: 'Browser localStorage scoped per UID',
    purpose: 'Optional user-controlled response preferences (PII-scrubbed)',
    retention: 'Local only until cleared or disabled',
    erasure: 'Wiped by Clear Local Cache or Delete Account',
  },
  {
    category: 'Credit Ledger & Security Login Alerts',
    location: 'Server tenant ledger & masked-IP alert hash',
    purpose: 'Quota accounting and duplicate-alert prevention',
    retention: 'Ledger until deletion; alert hashes 7 days',
    erasure: 'Purged via DELETE /api/account/data',
  },
  {
    category: 'Deletion Audit Receipt (Non-PII)',
    location: 'Server audit log (hash + timestamp only)',
    purpose: 'Accountability proof that an erasure request was completed',
    retention: 'Non-personal hash retained for audit logs',
    erasure: 'Contains zero email, name, or chat content',
  },
];

export const SettingsPage: React.FC = () => {
  const { theme, themePreference, setTheme } = useTheme();
  const {
    user,
    openLoginModal,
    signOutUser,
    resetPassword,
    linkGoogleProvider,
    linkEmailPasswordProvider,
    unlinkAuthProvider,
    resendVerificationEmail,
  } = useAuth();
  const { toast } = useToast();

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

  // Two-step confirmation modal for destructive account/data erasure
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  // Account linking UI state
  const [isLinkingProvider, setIsLinkingProvider] = useState(false);
  const [showAddPasswordForm, setShowAddPasswordForm] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');
  const [linkPasswordConfirm, setLinkPasswordConfirm] = useState('');

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
          activePolicy: data.activePolicy || 'VIZRA_AGE_ASSURANCE_PARENTAL_CONSENT',
          minimumActiveAge: Number(data.minimumActiveAge || 13),
          option2Active: Boolean(data.option2Preparatory?.active),
          option3VendorConfigured: Boolean(data.option3ParentalConsent?.parentalVendorConfigured),
          option4EnforcedEndpoints: Array.isArray(data.option4FeatureRestrictions?.enforcedEndpoints)
            ? data.option4FeatureRestrictions.enforcedEndpoints.length
            : 10,
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

  const linkedProviders = auth.currentUser?.providerData || user?.providerData || [];
  const hasGoogleLinked = linkedProviders.some((p) => p.providerId === 'google.com');
  const hasPasswordLinked = linkedProviders.some((p) => p.providerId === 'password');

  const handleSavePreferences = () => {
    localStorage.setItem('vizra_pref_language', language);
    localStorage.setItem('vizra_pref_style', responseStyle);
    localStorage.setItem('vizra_pref_speed', streamSpeed);
    setSavedNotice(true);
    toast({
      title: 'Preferences saved',
      description: 'Your Omnia 1.0 language, tone, and streaming preferences are updated.',
      type: 'success',
    });
    setTimeout(() => setSavedNotice(false), 2400);
  };

  const handleClearLocalData = () => {
    // Strictly preserves authentication session tokens while clearing local chats/memories/drafts
    localStorage.removeItem('omnia_conversations_v1');
    localStorage.removeItem('omnia_draft_prompt');
    localStorage.removeItem('vizra_omnia_personal_memories_v1');
    localStorage.removeItem('vizra_omnia_personal_memories_v1_anon');
    if (user?.uid) {
      localStorage.removeItem(`vizra_omnia_personal_memories_v1_${user.uid}`);
    }
    setClearedNotice(true);
    toast({
      title: 'Local cache cleared',
      description: 'Saved browser conversations, drafts, and local memories were removed. Your sign-in session remains active.',
      type: 'success',
    });
    setTimeout(() => setClearedNotice(false), 2400);
  };

  const handleLinkGoogle = async () => {
    setIsLinkingProvider(true);
    const res = await linkGoogleProvider();
    setIsLinkingProvider(false);
    toast({
      title: res.ok ? 'Google linked' : 'Could not link Google',
      description: res.message,
      type: res.ok ? 'success' : 'error',
    });
  };

  const handleLinkPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (linkPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Use at least 8 characters.',
        type: 'warning',
      });
      return;
    }
    if (linkPassword !== linkPasswordConfirm) {
      toast({
        title: 'Passwords do not match',
        description: 'Re-enter matching passwords to link Email & Password sign-in.',
        type: 'warning',
      });
      return;
    }
    setIsLinkingProvider(true);
    const res = await linkEmailPasswordProvider(user.email, linkPassword);
    setIsLinkingProvider(false);
    if (res.ok) {
      setShowAddPasswordForm(false);
      setLinkPassword('');
      setLinkPasswordConfirm('');
    }
    toast({
      title: res.ok ? 'Email & Password linked' : 'Linking failed',
      description: res.message,
      type: res.ok ? 'success' : 'error',
    });
  };

  const handleUnlinkProvider = async (providerId: string) => {
    setIsLinkingProvider(true);
    const res = await unlinkAuthProvider(providerId);
    setIsLinkingProvider(false);
    toast({
      title: res.ok ? 'Sign-in method unlinked' : 'Cannot unlink method',
      description: res.message,
      type: res.ok ? 'success' : 'warning',
    });
  };

  const handleResendVerification = async () => {
    const res = await resendVerificationEmail();
    toast({
      title: res.ok ? 'Verification email sent' : 'Verification notice',
      description: res.message,
      type: res.ok ? 'success' : 'error',
    });
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    const ok = await resetPassword(user.email);
    toast({
      title: ok ? 'Password reset email sent' : 'Password reset failed',
      description: ok
        ? `Reset instructions were sent to ${user.email}.`
        : 'Unable to send reset email right now.',
      type: ok ? 'success' : 'error',
    });
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
              cloudDeletedNote += ' Re-authenticate cleanly to finalize Firebase login credential removal.';
            }
          }
        }
      }

      localStorage.removeItem('omnia_conversations_v1');
      localStorage.removeItem('omnia_draft_prompt');
      localStorage.removeItem('vizra_omnia_personal_memories_v1');
      localStorage.removeItem('vizra_omnia_personal_memories_v1_anon');
      if (user?.uid) {
        localStorage.removeItem(`vizra_omnia_personal_memories_v1_${user.uid}`);
      }
      localStorage.removeItem('vizra_workspace_uploaded_assets_v1');
      localStorage.removeItem('vizra_workspace_client_tokens_v1');
      localStorage.removeItem('vizra_active_plan_v1');

      if (user) {
        await signOutUser();
      }

      const receiptMsg =
        (data?.receiptId
          ? `Erasure complete (Receipt: ${data.receiptId}).`
          : 'Local & server workspace data purged.') + cloudDeletedNote;

      setDeleteReceipt(receiptMsg);
      setIsDeleteModalOpen(false);
      setDeleteConfirmInput('');
      toast({
        title: 'Account & data erased',
        description: receiptMsg,
        type: 'success',
      });
    } catch {
      handleClearLocalData();
      setDeleteReceipt('Local workspace data purged.');
      setIsDeleteModalOpen(false);
      setDeleteConfirmInput('');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <PageLayout
      title="Application Settings — Vizra AI Creative Studio"
      description="Configure your Vizra studio theme, Omnia 1.0 response style, linked sign-in methods, DPDP privacy inventory, and data erasure controls."
      canonicalPath="/settings"
      noindex={true}
      showBottomNav={true}
    >
      <div className="pt-24 pb-28 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="pb-6 border-b border-neutral-300 dark:border-white/10">
          <div className="typo-eyebrow flex items-center gap-2">
            <SettingsIcon size={14} />
            <span>Studio Preferences &amp; Privacy Governance</span>
          </div>
          <h1 className="typo-section-title mt-1">Application Settings</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            Manage your visual theme, linked authentication methods, AI response tone, and data erasure controls.
          </p>
        </div>

        {/* Section 1: Appearance & Liquid Glass Theme Toggle */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                {themePreference === 'system' ? (
                  <Monitor size={18} className="text-[#eb3b2d]" />
                ) : theme === 'dark' ? (
                  <Moon size={18} className="text-[#eb3b2d]" />
                ) : (
                  <Sun size={18} className="text-amber-500" />
                )}
                <span>Global Visual Appearance</span>
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Choose Obsidian Dark Mode (default), Studio Light Mode, or sync with your OS when System is selected.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                {themePreference === 'system'
                  ? `System (${theme === 'dark' ? 'Dark' : 'Light'})`
                  : theme === 'dark'
                    ? 'Dark Mode'
                    : 'Light Mode'}
              </span>
              <LiquidGlassToggle size="md" />
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label="Theme preference"
            className="grid grid-cols-3 gap-2.5 pt-2 border-t border-neutral-200 dark:border-white/10"
          >
            {(
              [
                { id: 'dark' as ThemePreference, label: 'Dark', desc: 'Obsidian default', icon: Moon },
                { id: 'light' as ThemePreference, label: 'Light', desc: 'Studio daylight', icon: Sun },
                { id: 'system' as ThemePreference, label: 'System', desc: 'Match OS setting', icon: Monitor },
              ]
            ).map((opt) => {
              const Icon = opt.icon;
              const isSelected = themePreference === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setTheme(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-white/[0.07] border-[#DC2626] text-neutral-900 dark:text-white shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-950/60 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-white/20 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    size={15}
                    className={isSelected ? 'text-[#DC2626] shrink-0' : 'shrink-0 opacity-75'}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight">{opt.label}</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Account, Verification & Linked Sign-In Methods */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <User size={18} className="text-[#eb3b2d]" />
                <span>Account &amp; Studio Identity</span>
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

          {/* Linked Sign-In Methods & Verification */}
          {user && (
            <div className="pt-4 border-t border-neutral-200 dark:border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MailCheck
                    size={15}
                    className={user.emailVerified ? 'text-emerald-500' : 'text-amber-500'}
                  />
                  <span className="text-xs font-medium text-neutral-900 dark:text-white">
                    Email Verification:
                  </span>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                      user.emailVerified
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    }`}
                  >
                    {user.emailVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!user.emailVerified && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      Resend Verification Email
                    </button>
                  )}
                  {user.email && hasPasswordLinked && (
                    <button
                      type="button"
                      onClick={handleSendPasswordReset}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      <KeyRound size={12} />
                      <span>Reset Password</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Link2 size={14} className="text-[#eb3b2d]" />
                  <span>Linked Sign-In Methods</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Link both Google and Email/Password under one verified UID. Accounts are never silently merged without proof of control.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Google Provider Card */}
                  <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                        Google OAuth
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {hasGoogleLinked ? 'Linked to this account' : 'Not linked'}
                      </div>
                    </div>
                    {hasGoogleLinked ? (
                      <button
                        type="button"
                        disabled={isLinkingProvider || linkedProviders.length <= 1}
                        onClick={() => handleUnlinkProvider('google.com')}
                        title={
                          linkedProviders.length <= 1
                            ? 'Link another method before unlinking Google'
                            : 'Unlink Google sign-in'
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 cursor-pointer transition-colors"
                      >
                        <Unlink size={11} />
                        <span>Unlink</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isLinkingProvider}
                        onClick={handleLinkGoogle}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#eb3b2d] hover:bg-[#dc2626] text-white text-[11px] font-medium disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        <Link2 size={11} />
                        <span>Link Google</span>
                      </button>
                    )}
                  </div>

                  {/* Email & Password Provider Card */}
                  <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                        Email &amp; Password
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {hasPasswordLinked ? 'Linked to this account' : 'Not linked'}
                      </div>
                    </div>
                    {hasPasswordLinked ? (
                      <button
                        type="button"
                        disabled={isLinkingProvider || linkedProviders.length <= 1}
                        onClick={() => handleUnlinkProvider('password')}
                        title={
                          linkedProviders.length <= 1
                            ? 'Link Google before unlinking Email & Password'
                            : 'Unlink Email & Password'
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 cursor-pointer transition-colors"
                      >
                        <Unlink size={11} />
                        <span>Unlink</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isLinkingProvider || !user.email}
                        onClick={() => setShowAddPasswordForm((prev) => !prev)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-[11px] font-medium disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        <KeyRound size={11} />
                        <span>Add Password</span>
                      </button>
                    )}
                  </div>
                </div>

                {showAddPasswordForm && !hasPasswordLinked && user.email && (
                  <form
                    onSubmit={handleLinkPassword}
                    className="mt-3 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 space-y-3"
                  >
                    <div className="text-xs font-medium text-neutral-900 dark:text-white">
                      Set a password for <span className="font-mono">{user.email}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="password"
                        value={linkPassword}
                        onChange={(e) => setLinkPassword(e.target.value)}
                        placeholder="New password (min 8 chars)"
                        required
                        minLength={8}
                        className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#eb3b2d]"
                      />
                      <input
                        type="password"
                        value={linkPasswordConfirm}
                        onChange={(e) => setLinkPasswordConfirm(e.target.value)}
                        placeholder="Confirm password"
                        required
                        minLength={8}
                        className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#eb3b2d]"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddPasswordForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLinkingProvider}
                        className="px-3.5 py-1.5 rounded-lg bg-[#eb3b2d] hover:bg-[#dc2626] text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
                      >
                        {isLinkingProvider ? 'Linking…' : 'Confirm & Link Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-neutral-900 dark:text-white block">
                Credit Allowance &amp; Priority Compute
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
                <option value="detailed">In-Depth &amp; Exhaustive</option>
              </select>
            </div>

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
              <span className="text-xs font-mono text-emerald-500 flex items-center gap-1.5">
                <Check size={14} /> Preferences saved
              </span>
            ) : (
              <span className="text-[11px] text-neutral-500">
                Settings apply across all Omnia 1.0 sessions.
              </span>
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

        {/* Section 4: Collected Data & DPDP Privacy Transparency */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Database size={18} className="text-[#eb3b2d]" />
                <span>Collected Data &amp; Privacy Transparency</span>
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Exact inventory of what VIZRA stores, why it is collected, and what happens when you clear data or delete your account.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <Link to="/privacy-policy" className="text-[#eb3b2d] hover:underline">
                Privacy Policy
              </Link>
              <Link to="/terms-and-conditions" className="text-[#eb3b2d] hover:underline">
                Terms &amp; Conditions
              </Link>
              <Link to="/cookies" className="text-[#eb3b2d] hover:underline">
                Cookie Policy
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-white/10">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-neutral-100 dark:bg-white/[0.04] border-b border-neutral-200 dark:border-white/10 text-[10px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  <th className="px-3.5 py-2.5">Data Category</th>
                  <th className="px-3.5 py-2.5">Storage Location</th>
                  <th className="px-3.5 py-2.5">Purpose</th>
                  <th className="px-3.5 py-2.5">Erasure Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-white/[0.06]">
                {DPDP_DATA_INVENTORY.map((row) => (
                  <tr key={row.category} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-3.5 py-2.5 font-medium text-neutral-950 dark:text-white">
                      {row.category}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                      {row.location}
                    </td>
                    <td className="px-3.5 py-2.5">{row.purpose}</td>
                    <td className="px-3.5 py-2.5 text-neutral-600 dark:text-neutral-400">
                      {row.erasure}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-white/10 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5 leading-relaxed">
            <p>
              <strong className="text-neutral-900 dark:text-neutral-200">
                Database Isolation Guarantee:
              </strong>{' '}
              Firebase Authentication and Cloud Firestore are VIZRA&apos;s sole authoritative identity and user data stores. Google Sheets and Google Docs are <strong>never</strong> used to store user accounts, credentials, or personal data.
            </p>
            <p>
              <strong className="text-neutral-900 dark:text-neutral-200">
                DPDP Act 2023 Legal Review Notice:
              </strong>{' '}
              These technical safeguards are designed to support India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act) principles (data minimization, consent transparency, erasure cascade, and non-PII deletion receipts). Final legal adequacy of consent notices, retention schedules, and Grievance Officer details requires qualified legal review.
            </p>
          </div>
        </div>

        {/* Section 5: Privacy, Cache & Account Data Erasure */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield size={18} className="text-[#eb3b2d]" />
            <span>Cache &amp; Account Erasure Controls</span>
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <span className="text-xs font-medium text-neutral-900 dark:text-white block">
                Clear Local Browser Cache
              </span>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                Removes saved conversation threads, memories, and drafts from this browser while keeping your account signed in.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {clearedNotice && (
                <span className="text-xs font-mono text-emerald-500 dark:text-emerald-400">
                  Cache cleared
                </span>
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
                Permanently deletes your cloud chats, projects, credit ledger, OAuth tokens, contact records, and Firebase account. Requires explicit typed confirmation.
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
              onClick={() => {
                setDeleteConfirmInput('');
                setIsDeleteModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>{isDeletingAccount ? 'Purging Data…' : 'Delete Account & Data'}</span>
            </button>
          </div>
        </div>

        {/* Section 6: Child Online Safety & Age Assurance Governance */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Lock size={18} className="text-[#eb3b2d]" />
                <span>Age Assurance &amp; Parental Consent Framework</span>
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Privacy-first Omnia Adult (18+) and Omnia Youth (verified parental consent) access boundaries.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#eb3b2d]/15 border border-[#eb3b2d]/40 text-[11px] font-mono text-[#eb3b2d] shrink-0">
              {agePolicyOverview?.activePolicy || 'VIZRA_AGE_ASSURANCE_PARENTAL_CONSENT'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-white/10 space-y-1">
              <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 uppercase">
                Verifiable Parental Consent (DPDP / COPPA / GDPR / AADC)
              </div>
              <div className="font-medium text-neutral-900 dark:text-white">
                {agePolicyOverview?.option3VendorConfigured
                  ? 'External VPC Provider Webhook Configured'
                  : 'Fail-Closed Pending External VPC Provider Configuration'}
              </div>
              <div className="text-[11px] text-neutral-600 dark:text-neutral-500">
                Independent parent Firebase Auth, 7-point disclosure, instant consent revocation, zero behavioral age inference, and child-chat privacy isolation active.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-950/80 border border-neutral-200 dark:border-white/10 space-y-1">
              <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 uppercase">
                Omnia Youth Server-Enforced Safeguards
              </div>
              <div className="font-medium text-neutral-900 dark:text-white">
                Server-Enforced ({agePolicyOverview?.option4EnforcedEndpoints ?? 10} Protected Routes)
              </div>
              <div className="text-[11px] text-neutral-600 dark:text-neutral-500">
                Disables Live Voice, unrestricted audio synthesis, OAuth connectors, commercial Engage placements, and paid upgrades for Youth even with consent.
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 dark:border-white/10">
            <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Manage age routing, generate expiring guardian invitations, review disclosures, or withdraw parental consent immediately.
            </span>
            <Link
              to="/parental-consent"
              className="px-3.5 py-2 rounded-xl bg-[#eb3b2d] hover:bg-[#dc2626] text-white text-xs font-medium transition-colors"
            >
              Open Parental Consent Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Step Typed Confirmation Modal for Destructive Account Erasure */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111111] border border-red-500/30 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle size={18} />
                <h2
                  id="delete-account-modal-title"
                  className="text-sm font-semibold text-neutral-950 dark:text-white"
                >
                  Confirm Permanent Account &amp; Data Erasure
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                aria-label="Cancel deletion"
                className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
              <p className="leading-relaxed">
                This action is <strong className="text-red-500">irreversible</strong>. Proceeding will permanently delete:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
                <li>Your Firestore conversations, projects, and user profile</li>
                <li>Server-side credit ledger, OAuth token vault, API tokens, and age-assurance records</li>
                <li>Browser localStorage chats, drafts, and personal memories</li>
                <li>Your Firebase Authentication login credentials (if signed in recently)</li>
              </ul>
              <p className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-[11px] text-neutral-500 dark:text-neutral-400">
                Only a non-personal cryptographic deletion receipt hash and timestamp are kept in server audit logs to verify erasure completion.
              </p>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-delete-input"
                  className="block text-[11px] font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
                >
                  Type <span className="text-red-500 font-bold">DELETE</span> to confirm
                </label>
                <input
                  id="confirm-delete-input"
                  type="text"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmInput.trim() !== 'DELETE' || isDeletingAccount}
                  onClick={handleDeleteAccountAndData}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {isDeletingAccount ? 'Erasing Data…' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
