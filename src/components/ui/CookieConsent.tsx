import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Shield, Sliders, Check, RotateCcw } from 'lucide-react';
import { Dialog } from './Dialog';

export const CURRENT_CONSENT_VERSION = '1.0';
export const CURRENT_POLICY_VERSION = '2026-11';

export type ConsentActionType =
  | 'ACCEPT_ALL'
  | 'REJECT_OPTIONAL'
  | 'CUSTOMIZE'
  | 'WITHDRAW';

export type ConsentSourceType =
  | 'Cookie Banner'
  | 'Settings'
  | 'Cookie Policy Page'
  | 'Footer Settings';

export interface CookiePreferences {
  consentVersion: string;
  policyVersion: string;
  necessary: true;
  essential: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  action: ConsentActionType;
  timestamp: string;
  updatedAt: number;
  consentId: string;
  source: ConsentSourceType;
}

export const CONSENT_STORAGE_KEY = 'vizra_cookie_consent_v1';
export const CONSENT_ID_STORAGE_KEY = 'vizra_anonymous_consent_id_v1';
export const CONSENT_HISTORY_STORAGE_KEY = 'vizra_cookie_consent_history_v1';
export const CONSENT_EVENT_NAME = 'vizra:cookie-consent-updated';
export const OPEN_CONSENT_MODAL_EVENT = 'vizra:open-cookie-preferences';

/**
 * Generates or retrieves a persistent anonymous random ID for consent recordkeeping.
 * Contains zero PII or device fingerprinting.
 */
export function getOrCreateAnonymousConsentId(): string {
  try {
    const existing = localStorage.getItem(CONSENT_ID_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) {
      return existing;
    }
    const randomPart =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '')
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    const newId = `cns_${randomPart}`;
    localStorage.setItem(CONSENT_ID_STORAGE_KEY, newId);
    return newId;
  } catch {
    return `cns_ephemeral_${Date.now().toString(36)}`;
  }
}

/**
 * Reads the saved consent record from localStorage.
 * Returns null if no consent has been given OR if a material consentVersion / policyVersion
 * update requires renewed consent. Never converts a previous rejection into acceptance.
 */
export function getSavedCookieConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    // Require explicit consentVersion & policyVersion match; if outdated, return null to re-prompt
    if (
      parsed.consentVersion !== CURRENT_CONSENT_VERSION ||
      parsed.policyVersion !== CURRENT_POLICY_VERSION
    ) {
      return null;
    }

    const consentId =
      typeof parsed.consentId === 'string' && parsed.consentId.length >= 8
        ? parsed.consentId
        : getOrCreateAnonymousConsentId();

    return {
      consentVersion: CURRENT_CONSENT_VERSION,
      policyVersion: CURRENT_POLICY_VERSION,
      necessary: true,
      essential: true,
      analytics: Boolean(parsed.analytics),
      functional: Boolean(parsed.functional),
      marketing: Boolean(parsed.marketing),
      action:
        parsed.action === 'ACCEPT_ALL' ||
        parsed.action === 'REJECT_OPTIONAL' ||
        parsed.action === 'CUSTOMIZE' ||
        parsed.action === 'WITHDRAW'
          ? parsed.action
          : 'CUSTOMIZE',
      timestamp:
        typeof parsed.timestamp === 'string'
          ? parsed.timestamp
          : new Date(Number(parsed.updatedAt) || Date.now()).toISOString(),
      updatedAt: Number(parsed.updatedAt) || Date.now(),
      consentId,
      source: parsed.source || 'Cookie Banner',
    };
  } catch {
    return null;
  }
}

/**
 * Reads previous consent decisions saved even across older versions so we can pre-fill toggles
 * conservatively without ever turning a rejected toggle on.
 */
function getPreviousRawToggles(): {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
} {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return { analytics: false, functional: false, marketing: false };
    const parsed = JSON.parse(raw);
    return {
      analytics: Boolean(parsed?.analytics),
      functional: Boolean(parsed?.functional),
      marketing: Boolean(parsed?.marketing),
    };
  } catch {
    return { analytics: false, functional: false, marketing: false };
  }
}

export function getLocalConsentAuditHistory(): CookiePreferences[] {
  try {
    const raw = localStorage.getItem(CONSENT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Helper to open the Cookie Preferences modal from anywhere in the app (Footer, Cookie Policy, Settings).
 */
export function openCookiePreferencesModal(source: ConsentSourceType = 'Footer Settings'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(OPEN_CONSENT_MODAL_EVENT, { detail: { source } })
    );
  }
}

/**
 * Synchronizes consent decision with the backend API (/api/privacy/consent)
 * and optional Google Sheets audit log. Fails gracefully without blocking the user.
 */
export async function syncConsentRecordToBackend(
  record: CookiePreferences
): Promise<{ ok: boolean; eventId?: string; sheetsSyncStatus?: string }> {
  try {
    const response = await fetch('/api/privacy/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentId: record.consentId,
        consentVersion: record.consentVersion,
        policyVersion: record.policyVersion,
        action: record.action,
        necessary: true,
        analytics: record.analytics,
        functional: record.functional,
        marketing: record.marketing,
        source: record.source,
      }),
    });
    if (!response.ok) return { ok: false };
    const data = await response.json();
    return {
      ok: Boolean(data.success),
      eventId: data.audit?.eventId,
      sheetsSyncStatus: data.audit?.sheetsSyncStatus,
    };
  } catch {
    return { ok: false };
  }
}

/**
 * Executes a consent update, persists locally, cleans up withdrawn storage if needed,
 * emits global event, and logs asynchronously to the server.
 */
export function commitCookieConsentDecision(params: {
  action: ConsentActionType;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  source: ConsentSourceType;
}): CookiePreferences {
  const now = Date.now();
  const timestamp = new Date(now).toISOString();
  const consentId = getOrCreateAnonymousConsentId();

  const isRejectOrWithdraw =
    params.action === 'REJECT_OPTIONAL' || params.action === 'WITHDRAW';

  const record: CookiePreferences = {
    consentVersion: CURRENT_CONSENT_VERSION,
    policyVersion: CURRENT_POLICY_VERSION,
    necessary: true,
    essential: true,
    analytics: isRejectOrWithdraw
      ? false
      : params.action === 'ACCEPT_ALL'
      ? true
      : Boolean(params.analytics),
    functional: isRejectOrWithdraw
      ? false
      : params.action === 'ACCEPT_ALL'
      ? true
      : Boolean(params.functional),
    marketing: isRejectOrWithdraw
      ? false
      : params.action === 'ACCEPT_ALL'
      ? true
      : Boolean(params.marketing),
    action: params.action,
    timestamp,
    updatedAt: now,
    consentId,
    source: params.source,
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));

    // Preserve previous events in the local audit history (bounded to 50 entries)
    const history = getLocalConsentAuditHistory();
    history.push(record);
    localStorage.setItem(
      CONSENT_HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(-50))
    );

    // If Marketing or Functional consent is withdrawn/disabled, purge optional marketing session state
    if (!record.marketing) {
      sessionStorage.removeItem('vizra_engage_dismissed_cards');
    }

    window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: record }));
  } catch {
    // Ignore storage quota errors
  }

  // Non-blocking backend + optional Google Sheets record sync
  void syncConsentRecordToBackend(record);

  return record;
}

export const CookieConsent: React.FC<{
  onConsentChange?: (prefs: CookiePreferences) => void;
}> = ({ onConsentChange }) => {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [modalSource, setModalSource] = useState<ConsentSourceType>('Cookie Banner');

  // Optional categories strictly default to FALSE until valid consent is obtained
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [functionalEnabled, setFunctionalEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [hasExistingConsent, setHasExistingConsent] = useState(false);

  const syncFromStorage = useCallback(() => {
    const existing = getSavedCookieConsent();
    if (existing) {
      setAnalyticsEnabled(existing.analytics);
      setFunctionalEnabled(existing.functional);
      setMarketingEnabled(existing.marketing);
      setHasExistingConsent(true);
      onConsentChange?.(existing);
    } else {
      // Check if an older version existed; preserve only false or prior explicit choices without defaulting to true
      const prev = getPreviousRawToggles();
      setAnalyticsEnabled(prev.analytics);
      setFunctionalEnabled(prev.functional);
      setMarketingEnabled(prev.marketing);
      setHasExistingConsent(false);
      setIsBannerVisible(true);
    }
  }, [onConsentChange]);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  // Listen for external triggers (Footer "Manage Cookie Preferences", Cookie Policy page, Settings)
  useEffect(() => {
    const handleOpenModal = (event: Event) => {
      const customEvt = event as CustomEvent<{ source?: ConsentSourceType }>;
      const src = customEvt.detail?.source || 'Footer Settings';
      const existing = getSavedCookieConsent();
      if (existing) {
        setAnalyticsEnabled(existing.analytics);
        setFunctionalEnabled(existing.functional);
        setMarketingEnabled(existing.marketing);
        setHasExistingConsent(true);
      } else {
        setAnalyticsEnabled(false);
        setFunctionalEnabled(false);
        setMarketingEnabled(false);
      }
      setModalSource(src);
      setIsCustomizeOpen(true);
    };

    const handleExternalUpdate = (event: Event) => {
      const customEvt = event as CustomEvent<CookiePreferences>;
      if (customEvt.detail) {
        setAnalyticsEnabled(customEvt.detail.analytics);
        setFunctionalEnabled(customEvt.detail.functional);
        setMarketingEnabled(customEvt.detail.marketing);
        setHasExistingConsent(true);
        setIsBannerVisible(false);
        onConsentChange?.(customEvt.detail);
      }
    };

    window.addEventListener(OPEN_CONSENT_MODAL_EVENT, handleOpenModal);
    window.addEventListener(CONSENT_EVENT_NAME, handleExternalUpdate);
    return () => {
      window.removeEventListener(OPEN_CONSENT_MODAL_EVENT, handleOpenModal);
      window.removeEventListener(CONSENT_EVENT_NAME, handleExternalUpdate);
    };
  }, [onConsentChange]);

  const handleDecision = (
    action: ConsentActionType,
    sourceOverride?: ConsentSourceType
  ) => {
    const record = commitCookieConsentDecision({
      action,
      analytics: analyticsEnabled,
      functional: functionalEnabled,
      marketing: marketingEnabled,
      source: sourceOverride || modalSource,
    });
    setAnalyticsEnabled(record.analytics);
    setFunctionalEnabled(record.functional);
    setMarketingEnabled(record.marketing);
    setHasExistingConsent(true);
    setIsBannerVisible(false);
    setIsCustomizeOpen(false);
    onConsentChange?.(record);
  };

  return (
    <>
      <AnimatePresence>
        {isBannerVisible && !isCustomizeOpen && (
          <motion.aside
            role="region"
            aria-label="Cookie and privacy consent banner"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 md:right-auto md:max-w-lg z-[85] rounded-2xl bg-[#111111]/95 backdrop-blur-xl border border-white/[0.12] p-5 shadow-2xl text-white select-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center text-[#EB3B2D] shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                    Privacy &amp; Cookie Consent
                  </h2>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Policy v{CURRENT_POLICY_VERSION} · Optional trackers off by default
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
              VIZRA uses strictly necessary storage for security, authentication, and saving your consent choices. With your explicit permission, we also support optional Analytics, Functional preferences, and Marketing discovery controls. Read our{' '}
              <Link
                to="/privacy-policy"
                className="text-white underline underline-offset-4 hover:text-[#EB3B2D] transition-colors"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                to="/cookie-policy"
                className="text-white underline underline-offset-4 hover:text-[#EB3B2D] transition-colors"
              >
                Cookie Policy
              </Link>
              .
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDecision('ACCEPT_ALL', 'Cookie Banner')}
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Check size={13} />
                <span>Accept All</span>
              </button>
              <button
                type="button"
                onClick={() => handleDecision('REJECT_OPTIONAL', 'Cookie Banner')}
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#171717] hover:bg-neutral-800 border border-white/[0.1] text-neutral-200 hover:text-white font-medium text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] transition-colors cursor-pointer whitespace-nowrap"
              >
                Reject Optional
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalSource('Cookie Banner');
                  setIsCustomizeOpen(true);
                }}
                className="py-2.5 px-3.5 rounded-xl bg-[#090909] hover:bg-[#171717] border border-white/[0.1] text-neutral-300 hover:text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                aria-label="Customize cookie preferences"
              >
                <Sliders size={12} className="text-[#EB3B2D]" />
                <span>Customize Preferences</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Granular Preferences Modal */}
      <Dialog
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        title="Customize Cookie & Privacy Preferences"
        description="Manage optional storage and telemetry categories. Strictly Necessary storage is required for platform operation. Closing this dialog without saving does not grant consent."
        badge={`v${CURRENT_CONSENT_VERSION}`}
        maxWidth="lg"
        footer={
          <div className="w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {hasExistingConsent && (
                <button
                  type="button"
                  onClick={() => handleDecision('WITHDRAW', modalSource)}
                  className="px-3.5 py-2 rounded-xl bg-[#171717] hover:bg-red-950/40 border border-white/[0.08] hover:border-[#EB3B2D]/40 text-xs font-medium text-neutral-300 hover:text-[#EB3B2D] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={12} />
                  <span>Withdraw Consent</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDecision('REJECT_OPTIONAL', modalSource)}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                Reject Optional
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDecision('ACCEPT_ALL', modalSource)}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={() => handleDecision('CUSTOMIZE', modalSource)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {/* Category 1: Strictly Necessary */}
          <div className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.08] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  1. Strictly Necessary
                </span>
                <span className="text-[10px] font-mono text-[#EB3B2D]">
                  · Always Enabled
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Required for Firebase Authentication sessions, CSRF/SSRF security protections, rate-limit enforcement, and storing your privacy consent record (`vizra_cookie_consent_v1`). Cannot be disabled.
              </p>
            </div>
            <input
              type="checkbox"
              checked
              disabled
              aria-label="Strictly Necessary storage always enabled"
              className="mt-1 w-4 h-4 accent-[#DC2626] cursor-not-allowed opacity-70"
            />
          </div>

          {/* Category 2: Analytics */}
          <label className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.08] flex items-start justify-between gap-4 cursor-pointer hover:border-white/[0.16] transition-colors">
            <div>
              <div className="text-xs font-semibold text-white">
                2. Analytics
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Enables optional client-side performance diagnostics (`@vercel/speed-insights`) and studio latency telemetry. Note: Cookieless web pageview aggregation (`@vercel/analytics`) operates without browser cookies or cross-site identifiers.
              </p>
            </div>
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              aria-label="Enable optional Analytics"
              className="mt-1 w-4 h-4 accent-[#DC2626] cursor-pointer"
            />
          </label>

          {/* Category 3: Functional */}
          <label className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.08] flex items-start justify-between gap-4 cursor-pointer hover:border-white/[0.16] transition-colors">
            <div>
              <div className="text-xs font-semibold text-white">
                3. Functional
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Remembers optional workspace customization across sessions, including UI theme mode (`vizra_theme_mode_v1`), response style presets, and personal memory convenience settings.
              </p>
            </div>
            <input
              type="checkbox"
              checked={functionalEnabled}
              onChange={(e) => setFunctionalEnabled(e.target.checked)}
              aria-label="Enable optional Functional preferences"
              className="mt-1 w-4 h-4 accent-[#DC2626] cursor-pointer"
            />
          </label>

          {/* Category 4: Marketing */}
          <label className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.08] flex items-start justify-between gap-4 cursor-pointer hover:border-white/[0.16] transition-colors">
            <div>
              <div className="text-xs font-semibold text-white">
                4. Marketing
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Allows VIZRA Engage contextual discovery cards to remember dismissed tips and apply frequency caps across sessions. VIZRA does not load third-party behavioural ad networks by default.
              </p>
            </div>
            <input
              type="checkbox"
              checked={marketingEnabled}
              onChange={(e) => setMarketingEnabled(e.target.checked)}
              aria-label="Enable optional Marketing technologies"
              className="mt-1 w-4 h-4 accent-[#DC2626] cursor-pointer"
            />
          </label>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500">
            <div className="flex items-center gap-3">
              <Link
                to="/privacy-policy"
                onClick={() => setIsCustomizeOpen(false)}
                className="hover:text-white underline underline-offset-4 transition-colors"
              >
                Privacy Policy
              </Link>
              <span>·</span>
              <Link
                to="/cookie-policy"
                onClick={() => setIsCustomizeOpen(false)}
                className="hover:text-white underline underline-offset-4 transition-colors"
              >
                Cookie Policy
              </Link>
              <span>·</span>
              <Link
                to="/terms-and-conditions"
                onClick={() => setIsCustomizeOpen(false)}
                className="hover:text-white underline underline-offset-4 transition-colors"
              >
                Terms &amp; Conditions
              </Link>
            </div>
            <span className="font-mono text-[10px]">
              Consent Schema v{CURRENT_CONSENT_VERSION}
            </span>
          </div>
        </div>
      </Dialog>
    </>
  );
};
