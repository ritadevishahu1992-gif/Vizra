import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Shield, Sliders, Check, X } from 'lucide-react';
import { Dialog } from './Dialog';

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: number;
}

const CONSENT_STORAGE_KEY = 'vizra_cookie_consent_v1';
const CONSENT_EVENT_NAME = 'vizra:cookie-consent-updated';

export function getSavedCookieConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        essential: true,
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
        updatedAt: Number(parsed.updatedAt) || Date.now(),
      };
    }
  } catch {
    // Ignore storage read error
  }
  return null;
}

/**
 * 09 · Cookie Consent
 * Adapted from 21st.dev `cookie-consent` pattern.
 * Stores user consent preferences in localStorage and gates optional analytics scripts.
 */
export const CookieConsent: React.FC<{
  onConsentChange?: (prefs: CookiePreferences) => void;
}> = ({ onConsentChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const existing = getSavedCookieConsent();
    if (existing) {
      setAnalyticsEnabled(existing.analytics);
      setMarketingEnabled(existing.marketing);
      onConsentChange?.(existing);
    } else {
      const timer = window.setTimeout(() => setIsVisible(true), 800);
      return () => window.clearTimeout(timer);
    }
  }, [onConsentChange]);

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: prefs }));
    } catch {
      // Ignore storage error
    }
    setIsVisible(false);
    setIsCustomizeOpen(false);
    onConsentChange?.(prefs);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      updatedAt: Date.now(),
    });
  };

  const handleRejectOptional = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      updatedAt: Date.now(),
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      essential: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      updatedAt: Date.now(),
    });
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && !isCustomizeOpen && (
          <motion.aside
            role="region"
            aria-label="Cookie consent banner"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-md z-[85] rounded-2xl bg-[#111111]/95 backdrop-blur-md border border-white/[0.1] p-5 shadow-2xl text-white select-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center text-[#EB3B2D] shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white tracking-tight">
                    Privacy & Telemetry Preferences
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400">
                    GDPR · CCPA Compliant Controls
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRejectOptional}
                className="p-1 rounded-lg text-neutral-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Reject optional cookies and close"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
              VIZRA uses essential cookies to keep your creative studio session secure. With your consent, we also use privacy-preserving performance telemetry to optimize 60fps rendering and Omnia latency.{' '}
              <a
                href="/#philosophy"
                className="text-white underline underline-offset-4 hover:text-[#EB3B2D] transition-colors"
              >
                Privacy Policy
              </a>
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 py-2 px-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={13} />
                <span>Accept All</span>
              </button>
              <button
                type="button"
                onClick={handleRejectOptional}
                className="flex-1 py-2 px-3 rounded-xl bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-neutral-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Reject Optional
              </button>
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(true)}
                className="py-2 px-3 rounded-xl bg-[#090909] hover:bg-[#171717] border border-white/[0.08] text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                aria-label="Customize cookie preferences"
              >
                <Sliders size={12} className="text-[#EB3B2D]" />
                <span>Customize</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Granular Preferences Modal */}
      <Dialog
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        title="Customize Cookie & Telemetry Preferences"
        description="Control how VIZRA stores session state and performance metrics in your browser."
        badge="Privacy"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={handleRejectOptional}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              Reject Optional
            </button>
            <button
              type="button"
              onClick={handleSaveCustom}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors cursor-pointer"
            >
              Save Preferences
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {/* Essential Cookies */}
          <div className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.07] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Essential Studio Storage</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                  Always Active
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Required for Firebase Authentication, CSRF/SSRF protection, project persistence, and keyboard shortcut preferences.
              </p>
            </div>
            <input
              type="checkbox"
              checked
              disabled
              aria-label="Essential cookies always active"
              className="mt-1 accent-[#DC2626] cursor-not-allowed opacity-70"
            />
          </div>

          {/* Analytics Cookies */}
          <label className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.07] flex items-start justify-between gap-4 cursor-pointer hover:border-white/[0.15] transition-colors">
            <div>
              <div className="text-xs font-semibold text-white">
                Performance & Speed Insights
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Enables anonymous Core Web Vitals and Omnia streaming latency telemetry via Vercel Analytics & Speed Insights.
              </p>
            </div>
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#DC2626] cursor-pointer"
            />
          </label>

          {/* Marketing / Engage Personalization */}
          <label className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.07] flex items-start justify-between gap-4 cursor-pointer hover:border-white/[0.15] transition-colors">
            <div>
              <div className="text-xs font-semibold text-white">
                Contextual Discovery & Partner Cards
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Allows VIZRA Engage to remember dismissed creative tips and frequency-cap sponsored studio cards across sessions.
              </p>
            </div>
            <input
              type="checkbox"
              checked={marketingEnabled}
              onChange={(e) => setMarketingEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#DC2626] cursor-pointer"
            />
          </label>
        </div>
      </Dialog>
    </>
  );
};
