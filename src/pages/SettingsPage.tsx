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

  const handleSavePreferences = () => {
    localStorage.setItem('vizra_pref_language', language);
    localStorage.setItem('vizra_pref_style', responseStyle);
    localStorage.setItem('vizra_pref_speed', streamSpeed);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2400);
  };

  const handleClearLocalData = () => {
    if (window.confirm('Clear all locally cached conversation history and draft prompts?')) {
      localStorage.removeItem('omnia_conversations_v1');
      localStorage.removeItem('omnia_draft_prompt');
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 2400);
    }
  };

  return (
    <PageLayout
      title="Application Settings — Vizra AI Creative Studio"
      description="Configure your Vizra studio theme, Omnia 1.0 response style, language preferences, local cache, and privacy controls."
      canonicalPath="/settings"
    >
      <div className="pt-24 pb-28 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="pb-6 border-b border-white/10 dark:border-white/10 border-neutral-300">
          <div className="typo-eyebrow flex items-center gap-2">
            <SettingsIcon size={14} />
            <span>Studio Preferences & Configuration</span>
          </div>
          <h1 className="typo-section-title mt-1">Application Settings</h1>
          <p className="text-sm text-neutral-400 dark:text-neutral-400 text-neutral-600 mt-0.5">
            Manage your global visual theme, account credentials, model response tone, and local memory.
          </p>
        </div>

        {/* Section 1: Appearance & Liquid Glass Theme Toggle */}
        <div className="p-6 rounded-2xl bg-neutral-900/60 dark:bg-neutral-900/60 bg-white border border-white/10 dark:border-white/10 border-neutral-200 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white dark:text-white text-neutral-900 flex items-center gap-2">
                {theme === 'dark' ? <Moon size={18} className="text-[#eb3b2d]" /> : <Sun size={18} className="text-amber-500" />}
                <span>Global Visual Appearance</span>
              </h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-400 text-neutral-600 mt-0.5">
                Toggle between Obsidian Dark Mode (default) and Studio Light Mode using the Liquid Glass Surface Tension switch.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-400 dark:text-neutral-400 text-neutral-500 hidden sm:inline">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
              <LiquidGlassToggle size="md" />
            </div>
          </div>
        </div>

        {/* Section 2: Account & Entitlements */}
        <div className="p-6 rounded-2xl bg-neutral-900/60 dark:bg-neutral-900/60 bg-white border border-white/10 dark:border-white/10 border-neutral-200 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white dark:text-white text-neutral-900 flex items-center gap-2">
                <User size={18} className="text-[#eb3b2d]" />
                <span>Account & Studio Identity</span>
              </h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-400 text-neutral-600 mt-0.5">
                {user
                  ? `Signed in as ${user.displayName || 'Creator'} (${user.email})`
                  : 'You are using Vizra in guest creator mode.'}
              </p>
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => signOutUser()}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 hover:text-white font-medium cursor-pointer transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Sign In / Register
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 dark:border-white/10 border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-white dark:text-white text-neutral-900 block">
                Credit Allowance & Priority Compute
              </span>
              <span className="text-[11px] text-neutral-400">
                View your real-time generation credit quota and upgrade options.
              </span>
            </div>
            <CreditUsageIndicator variant="header" />
          </div>
        </div>

        {/* Section 3: Omnia AI Behavior & Tone */}
        <div className="p-6 rounded-2xl bg-neutral-900/60 dark:bg-neutral-900/60 bg-white border border-white/10 dark:border-white/10 border-neutral-200 space-y-5">
          <h2 className="text-base font-semibold text-white dark:text-white text-neutral-900 flex items-center gap-2">
            <Sliders size={18} className="text-[#eb3b2d]" />
            <span>AI Response Preferences</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Language */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 dark:text-neutral-300 text-neutral-700 mb-1.5">
                Conversation Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 dark:bg-neutral-950 bg-neutral-100 border border-white/10 dark:border-white/10 border-neutral-300 text-xs text-white dark:text-white text-neutral-900 focus:outline-none focus:border-[#eb3b2d]"
              >
                <option value="auto">Auto-Detect Intent</option>
                <option value="en">English (US/UK)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="hinglish">Hinglish (Conversational)</option>
              </select>
            </div>

            {/* Response Style */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 dark:text-neutral-300 text-neutral-700 mb-1.5">
                Response Proportionality
              </label>
              <select
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 dark:bg-neutral-950 bg-neutral-100 border border-white/10 dark:border-white/10 border-neutral-300 text-xs text-white dark:text-white text-neutral-900 focus:outline-none focus:border-[#eb3b2d]"
              >
                <option value="kinetic">Proportional (Default)</option>
                <option value="concise">Ultra-Concise</option>
                <option value="detailed">In-Depth & Exhaustive</option>
              </select>
            </div>

            {/* Stream Pacing */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 dark:text-neutral-300 text-neutral-700 mb-1.5">
                Generation Streaming
              </label>
              <select
                value={streamSpeed}
                onChange={(e) => setStreamSpeed(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 dark:bg-neutral-950 bg-neutral-100 border border-white/10 dark:border-white/10 border-neutral-300 text-xs text-white dark:text-white text-neutral-900 focus:outline-none focus:border-[#eb3b2d]"
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

        {/* Section 4: Privacy & Cache Management */}
        <div className="p-6 rounded-2xl bg-neutral-900/60 dark:bg-neutral-900/60 bg-white border border-white/10 dark:border-white/10 border-neutral-200 space-y-4">
          <h2 className="text-base font-semibold text-white dark:text-white text-neutral-900 flex items-center gap-2">
            <Shield size={18} className="text-[#eb3b2d]" />
            <span>Privacy & Storage Controls</span>
          </h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-400 text-neutral-600">
            Vizra processes all AI requests through server-side proxies with zero telemetry leakage and client-isolated storage.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <span className="text-xs font-medium text-white dark:text-white text-neutral-900 block">
                Clear Local Browser Cache
              </span>
              <span className="text-[11px] text-neutral-400">
                Removes saved conversation threads and drafts from this device.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {clearedNotice && (
                <span className="text-xs font-mono text-emerald-400">Cache cleared</span>
              )}
              <button
                type="button"
                onClick={handleClearLocalData}
                className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
