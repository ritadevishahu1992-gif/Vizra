import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  FileText,
  Cookie,
  Sliders,
  RotateCcw,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import {
  CookiePreferences,
  getSavedCookieConsent,
  openCookiePreferencesModal,
  commitCookieConsentDecision,
  CONSENT_EVENT_NAME,
  CURRENT_CONSENT_VERSION,
  CURRENT_POLICY_VERSION,
} from '../components/ui/CookieConsent';

type LegalDocTab = 'privacy' | 'terms' | 'cookies';

export const LegalPage: React.FC = () => {
  const location = useLocation();
  const [consentRecord, setConsentRecord] = useState<CookiePreferences | null>(() =>
    getSavedCookieConsent()
  );

  const activeDoc: LegalDocTab = location.pathname.startsWith('/terms')
    ? 'terms'
    : location.pathname.startsWith('/cookie')
    ? 'cookies'
    : 'privacy';

  useEffect(() => {
    const syncConsent = () => {
      setConsentRecord(getSavedCookieConsent());
    };
    window.addEventListener(CONSENT_EVENT_NAME, syncConsent);
    return () => window.removeEventListener(CONSENT_EVENT_NAME, syncConsent);
  }, []);

  const handleWithdrawDirectly = () => {
    const updated = commitCookieConsentDecision({
      action: 'WITHDRAW',
      analytics: false,
      functional: false,
      marketing: false,
      source: 'Cookie Policy Page',
    });
    setConsentRecord(updated);
  };

  const pageMeta = {
    privacy: {
      title: 'Privacy Policy — Vizra AI Creative Studio',
      description:
        'Privacy Policy detailing information collection, processing, retention, third-party processors, security controls, and user privacy rights for Vizra AI Creative Studio.',
      heading: 'Privacy Policy',
      eyebrow: 'Data Protection & Privacy Notice',
    },
    terms: {
      title: 'Terms & Conditions — Vizra AI Creative Studio',
      description:
        'Terms and Conditions governing use of Vizra AI Creative Studio and Omnia 1.0, user responsibilities, acceptable use, intellectual property, and liability limits.',
      heading: 'Terms & Conditions',
      eyebrow: 'Platform Agreement & Rules of Use',
    },
    cookies: {
      title: 'Cookie Policy — Vizra AI Creative Studio',
      description:
        'Cookie and browser storage policy explaining strictly necessary, analytics, functional, and marketing technologies used in Vizra and how to withdraw or customize consent.',
      heading: 'Cookie & Storage Policy',
      eyebrow: 'Consent & Browser Storage Governance',
    },
  }[activeDoc];

  return (
    <PageLayout title={pageMeta.title} description={pageMeta.description}>
      {/* Page Header */}
      <section className="pt-28 md:pt-36 pb-12 px-6 sm:px-10 lg:px-16 max-w-5xl mx-auto border-b border-white/[0.06]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="typo-eyebrow">{pageMeta.eyebrow}</div>
            <h1 className="typo-page-title">{pageMeta.heading}</h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-mono">
              Effective Date: November 11, 2026 · Last Updated: November 11, 2026 · Policy v{CURRENT_POLICY_VERSION}
            </p>
          </div>

          {/* 3-Document Navigation Switcher */}
          <div
            role="navigation"
            aria-label="Legal documents navigation"
            className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-[#111111] border border-white/[0.08] self-start"
          >
            <Link
              to="/privacy-policy"
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeDoc === 'privacy'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-and-conditions"
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeDoc === 'terms'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Terms &amp; Conditions
            </Link>
            <Link
              to="/cookie-policy"
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeDoc === 'cookies'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-14 md:py-20 px-6 sm:px-10 lg:px-16 max-w-5xl mx-auto space-y-10">
        {/* Live Interactive Consent Status Banner (shown on Cookie Policy & Privacy Policy) */}
        {(activeDoc === 'cookies' || activeDoc === 'privacy') && (
          <div className="p-6 sm:p-7 rounded-2xl bg-[#111111] border border-white/[0.1] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Cookie size={16} className="text-[#EB3B2D]" />
                  <h2 className="text-sm sm:text-base font-display font-semibold text-white">
                    Your Current Consent Status
                  </h2>
                </div>
                <p className="text-xs text-neutral-400">
                  {consentRecord
                    ? `Recorded via ${consentRecord.source} on ${new Date(
                        consentRecord.timestamp
                      ).toUTCString()} (Action: ${consentRecord.action})`
                    : 'No optional cookie consent has been granted yet. Optional categories are disabled by default.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openCookiePreferencesModal('Cookie Policy Page')}
                  className="px-4 py-2 rounded-xl bg-white text-black font-display font-semibold text-xs hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders size={13} className="text-[#EB3B2D]" />
                  <span>Manage Cookie Preferences</span>
                </button>
                {consentRecord &&
                  (consentRecord.analytics ||
                    consentRecord.functional ||
                    consentRecord.marketing) && (
                    <button
                      type="button"
                      onClick={handleWithdrawDirectly}
                      className="px-3.5 py-2 rounded-xl bg-[#171717] hover:bg-red-950/40 border border-white/[0.1] hover:border-[#EB3B2D]/40 text-xs font-medium text-neutral-300 hover:text-[#EB3B2D] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Withdraw Optional Consent</span>
                    </button>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.06] text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#090909] border border-white/[0.06]">
                <span className="text-neutral-500 block text-[10px]">NECESSARY</span>
                <span className="text-white font-semibold">Enabled (Required)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#090909] border border-white/[0.06]">
                <span className="text-neutral-500 block text-[10px]">ANALYTICS</span>
                <span
                  className={
                    consentRecord?.analytics ? 'text-white font-semibold' : 'text-neutral-400'
                  }
                >
                  {consentRecord?.analytics ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#090909] border border-white/[0.06]">
                <span className="text-neutral-500 block text-[10px]">FUNCTIONAL</span>
                <span
                  className={
                    consentRecord?.functional ? 'text-white font-semibold' : 'text-neutral-400'
                  }
                >
                  {consentRecord?.functional ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#090909] border border-white/[0.06]">
                <span className="text-neutral-500 block text-[10px]">MARKETING</span>
                <span
                  className={
                    consentRecord?.marketing ? 'text-white font-semibold' : 'text-neutral-400'
                  }
                >
                  {consentRecord?.marketing ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* DOCUMENT 1: PRIVACY POLICY (/privacy-policy & /privacy)            */}
        {/* ================================================================= */}
        {activeDoc === 'privacy' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">1. What Information VIZRA Collects</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                VIZRA collects only the minimum information required to operate the AI Creative Studio and Omnia 1.0 workspace:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <li>
                  <strong>Account Information (Optional Sign-In):</strong> When you sign in with Google via Firebase Authentication, we receive your Firebase User UID, display name, email address, and profile avatar URL (`users/&#123;userId&#125;`).
                </li>
                <li>
                  <strong>Workspace Prompts &amp; Multimodal Attachments:</strong> Text prompts, code snippets, and files (images, PDFs, CSVs) you submit to Omnia 1.0 for synthesis, along with 10-stage project records (`users/&#123;userId&#125;/projects`).
                </li>
                <li>
                  <strong>Consent Records:</strong> An anonymous random identifier (`consentId`), selected consent categories (`necessary`, `analytics`, `functional`, `marketing`), timestamp, policy version (`{CURRENT_POLICY_VERSION}`), and action (`ACCEPT_ALL`, `REJECT_OPTIONAL`, `CUSTOMIZE`, or `WITHDRAW`). We never record raw IP addresses, passwords, or device fingerprints in consent logs.
                </li>
                <li>
                  <strong>Operational &amp; Security Telemetry:</strong> Ephemeral request rate-limiting counters, SSRF defense logs, and cookieless aggregate pageview metrics via Vercel Web Analytics.
                </li>
              </ul>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">2. Why Information Is Collected</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <li>To execute AI text, code, visual, and research requests within the Omnia 1.0 studio.</li>
                <li>To authenticate your account and isolate your saved projects and conversation histories.</li>
                <li>To protect infrastructure against Server-Side Request Forgery (SSRF), automated abuse, and unauthorized access.</li>
                <li>To maintain an auditable record of your cookie and privacy preferences.</li>
              </ul>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">3. How Information Is Processed</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                AI prompts and attachments are transmitted over HTTPS to VIZRA&apos;s server-side proxy routes (`/api/*`) and forwarded to the Google Gemini API (`@google/genai`) for inference. Server-side API keys are isolated from client bundles. General knowledge queries are strictly isolated from your private workspace project files. VIZRA does not sell personal information to third parties or data brokers.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">4. Data Storage &amp; Retention</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <li>
                  <strong>Browser Local Storage:</strong> Anonymous conversations (`omnia_conversations_v1`), theme settings (`vizra_theme_mode_v1`), user memories (`vizra_user_memories`), and consent state (`vizra_cookie_consent_v1`) remain in your browser until you clear them or withdraw consent.
                </li>
                <li>
                  <strong>Cloud Firestore:</strong> Authenticated user profiles, projects, and chat histories are stored in Google Cloud Firestore under strict owner-only security rules (`request.auth.uid == userId`) until deleted by the user.
                </li>
                <li>
                  <strong>Consent Audit Trail:</strong> Anonymous consent events (`evt_cns_*`) are retained in the server consent store (`data/consent_store.json`) and, if configured by the site operator, exported to a designated Google Sheets audit log.
                </li>
              </ul>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">5. Third-Party Service Providers</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <li>
                  <strong>Google Cloud &amp; Firebase:</strong> Authentication (`Firebase Auth`) and NoSQL document persistence (`Cloud Firestore`).
                </li>
                <li>
                  <strong>Google Gemini API:</strong> Multimodal AI inference, embeddings, and live Google Search grounding.
                </li>
                <li>
                  <strong>Vercel Inc.:</strong> Application hosting, edge routing, cookieless Web Analytics (`@vercel/analytics`), and optional Speed Insights (`@vercel/speed-insights`, loaded only when Analytics consent is enabled).
                </li>
                <li>
                  <strong>Google Sheets API (Optional):</strong> When configured by the operator, receives anonymous consent audit rows (`consentId`, timestamp, boolean category flags, and policy version) containing zero PII.
                </li>
                <li>
                  <strong>Resend (Optional):</strong> When configured via `RESEND_API_KEY`, dispatches security login notification emails.
                </li>
              </ul>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">6. Security Measures</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                VIZRA enforces Attribute-Based Access Control (ABAC) in `firestore.rules` with default-deny catch-all rules, strict schema validation, and owner UID verification. Server routes enforce sliding-window rate limits, input length caps (50,000 characters max), attachment size limits (15MB max), and SSRF network filters blocking loopback (`127.0.0.1`, `::1`), cloud metadata (`169.254.169.254`), and private RFC1918 subnets.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">7. User Privacy Rights &amp; Data Deletion Requests</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Depending on your jurisdiction, you may have the right to access, correct, export, or delete your personal data, restrict or object to processing, and withdraw consent at any time:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <li>
                  <strong>Self-Service Deletion &amp; Export:</strong> You can export conversations as JSON or delete individual/all threads immediately on the <Link to="/history" className="text-white underline hover:text-[#EB3B2D]">History</Link> and <Link to="/settings" className="text-white underline hover:text-[#EB3B2D]">Settings</Link> pages.
                </li>
                <li>
                  <strong>Consent Withdrawal:</strong> Use the <em>Manage Cookie Preferences</em> or <em>Withdraw Optional Consent</em> controls on this page or in the site footer at any time.
                </li>
                <li>
                  <strong>Account &amp; Cloud Data Deletion Requests:</strong> Submit a formal deletion or correction request via our <Link to="/contact" className="text-white underline hover:text-[#EB3B2D]">Contact &amp; Privacy Requests</Link> page.
                </li>
              </ul>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">8. Applicable Legal Framework &amp; Operator Configuration Notice</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                These privacy controls are engineered to support transparency, data minimization, and opt-in consent principles aligned with the EU/UK General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA/CPRA), and India&apos;s Digital Personal Data Protection Act (DPDP Act). Publication of these technical pages does not by itself constitute a legal certification.
              </p>
              <div className="p-4 rounded-xl bg-[#090909] border border-amber-500/30 text-xs text-neutral-300 space-y-1.5 font-mono">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <AlertCircle size={14} />
                  <span>Operator Configuration Requirement (Business Details)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  • Legal Entity Name: [Configuration Required: Insert Registered Company / Operator Name]<br />
                  • Registered Office Address: [Configuration Required: Insert Official Postal Address]<br />
                  • Privacy &amp; Grievance Officer Contact: [Configuration Required: Insert Designated DPO / Grievance Email]
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* DOCUMENT 2: TERMS & CONDITIONS (/terms-and-conditions & /terms)    */}
        {/* ================================================================= */}
        {activeDoc === 'terms' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">1. Service Description</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                VIZRA (&ldquo;Platform&rdquo;) is a web-based AI creative studio and multimodal workspace powered by the Omnia 1.0 operating layer. The Platform provides AI-assisted writing, research grounding, design system ideation, code generation, procedural canvas previews, and project workflow management.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">2. User Responsibilities &amp; Account Rules</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <li>You are responsible for maintaining the confidentiality of your authentication credentials and all activities that occur under your session.</li>
                <li>You must ensure that any text, images, documents, or URLs you submit to VIZRA do not violate third-party intellectual property, privacy, or confidentiality rights.</li>
                <li>You must not use VIZRA to generate unlawful, defamatory, deceptive, or malicious content, or to conduct unauthorized network scanning, SSRF probing, or automated scraping.</li>
              </ul>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">3. Acceptable Use &amp; API Rate Limits</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                To maintain service stability for all users, VIZRA enforces automated sliding-window rate limits and payload boundaries (maximum 50,000 characters per prompt and up to 5 attachments under 15MB). Attempts to bypass rate limiters, probe internal cloud metadata addresses, or forge authentication tokens will result in immediate request blocking.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">4. Intellectual Property</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <li>
                  <strong>User Content:</strong> Subject to applicable law and third-party model terms, you retain ownership of the original prompts and input materials you submit, and VIZRA assigns to you any rights it may hold in the outputs generated specifically from your prompts.
                </li>
                <li>
                  <strong>Platform IP:</strong> The VIZRA brand, UI components, procedural shaders, server architecture, and Omnia 1.0 orchestration logic remain the proprietary intellectual property of VIZRA and its licensors.
                </li>
              </ul>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">5. AI-Generated Content Limitations</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                AI synthesis is probabilistic and may produce inaccurate, incomplete, or outdated statements despite web search grounding and deterministic verification checks. Outputs do not constitute professional legal, medical, financial, or security advice. You are solely responsible for human review, testing, and verification of any generated text, citations, or code prior to deployment or publication.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">6. Service Availability, Modifications &amp; Termination</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                VIZRA is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We may modify, update, rate-limit, or discontinue experimental studio features or model endpoints at any time. We reserve the right to suspend or terminate access for accounts that violate these Terms or threaten platform security.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">7. Limitation of Liability</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                To the maximum extent permitted by applicable law, VIZRA and its operators shall not be liable for any indirect, incidental, consequential, special, or exemplary damages, or for any loss of data, revenue, or business arising out of or connected with your use of the Platform or reliance on AI-generated outputs.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">8. Contact Information &amp; Operator Configuration</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                For questions regarding these Terms &amp; Conditions, please reach out via our <Link to="/contact" className="text-white underline hover:text-[#EB3B2D]">Contact</Link> page.
              </p>
              <div className="p-4 rounded-xl bg-[#090909] border border-amber-500/30 text-xs text-neutral-300 space-y-1.5 font-mono">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <AlertCircle size={14} />
                  <span>Operator Configuration Requirement (Legal Entity &amp; Jurisdiction)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  • Operating Entity: [Configuration Required: Insert Registered Legal Entity]<br />
                  • Governing Law &amp; Jurisdiction: [Configuration Required: Insert Applicable State / Country Law]<br />
                  • Official Legal Notice Address: [Configuration Required: Insert Legal Notice Email &amp; Postal Address]
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* DOCUMENT 3: COOKIE POLICY (/cookie-policy & /cookies)              */}
        {/* ================================================================= */}
        {activeDoc === 'cookies' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">1. How VIZRA Uses Cookies &amp; Local Storage</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                VIZRA primarily uses browser `localStorage`, `sessionStorage`, and IndexedDB rather than traditional third-party tracking cookies. Optional categories (`Analytics`, `Functional`, and `Marketing`) are disabled by default for first-time visitors and are only activated if you explicitly choose <strong>Accept All</strong> or enable specific toggles via <strong>Customize Preferences</strong>.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">2. Vercel Web Analytics Separation (Cookieless Analytics)</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                VIZRA uses <strong>Vercel Web Analytics (`@vercel/analytics`)</strong> for aggregate pageview and route diagnostics. Per Vercel&apos;s architecture, Vercel Web Analytics is cookieless, does not set browser cookies, and does not track visitors across third-party websites. Accordingly, it is mounted independently of marketing or advertising cookie state and is never classified as an advertising tracker. Optional client performance diagnostics (`@vercel/speed-insights`) remain strictly gated behind the <strong>Analytics</strong> consent toggle.
              </p>
            </div>

            {/* Complete Storage & Cookie Inventory Table */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-4 overflow-x-auto">
              <h2 className="typo-card-title">3. Storage &amp; Technology Inventory</h2>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.1] text-neutral-400 font-mono">
                    <th className="py-2.5 pr-4">Key / Technology</th>
                    <th className="py-2.5 pr-4">Category</th>
                    <th className="py-2.5 pr-4">Type</th>
                    <th className="py-2.5 pr-4">Purpose</th>
                    <th className="py-2.5">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-neutral-300">
                  <tr>
                    <td className="py-3 pr-4 font-mono text-white">vizra_cookie_consent_v1</td>
                    <td className="py-3 pr-4 text-[#EB3B2D] font-mono">Strictly Necessary</td>
                    <td className="py-3 pr-4">localStorage</td>
                    <td className="py-3 pr-4">Stores your versioned cookie consent preferences (`v{CURRENT_CONSENT_VERSION}`).</td>
                    <td className="py-3 font-mono">Persistent</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-white">vizra_anonymous_consent_id_v1</td>
                    <td className="py-3 pr-4 text-[#EB3B2D] font-mono">Strictly Necessary</td>
                    <td className="py-3 pr-4">localStorage</td>
                    <td className="py-3 pr-4">Anonymous random UUID used to link consent updates or withdrawals in the audit log.</td>
                    <td className="py-3 font-mono">Persistent</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-white">firebase:authUser:*</td>
                    <td className="py-3 pr-4 text-[#EB3B2D] font-mono">Strictly Necessary</td>
                    <td className="py-3 pr-4">IndexedDB / Local</td>
                    <td className="py-3 pr-4">Maintains authenticated user session when you sign in with Google.</td>
                    <td className="py-3 font-mono">Session / Auth</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-white">@vercel/analytics</td>
                    <td className="py-3 pr-4 text-neutral-300 font-mono">Cookieless Web</td>
                    <td className="py-3 pr-4">Cookieless Beacon</td>
                    <td className="py-3 pr-4">Aggregate cookieless pageview metrics without cross-site identifiers.</td>
                    <td className="py-3 font-mono">Ephemeral</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-white">@vercel/speed-insights</td>
                    <td className="py-3 pr-4 text-neutral-300 font-mono">Analytics (Opt-In)</td>
                    <td className="py-3 pr-4">Telemetry Script</td>
                    <td className="py-3 pr-4">Measures Core Web Vitals and frame rendering latency when Analytics consent is enabled.</td>
                    <td className="py-3 font-mono">Ephemeral</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-white">vizra_theme_mode_v1</td>
                    <td className="py-3 pr-4 text-neutral-300 font-mono">Functional</td>
                    <td className="py-3 pr-4">localStorage</td>
                    <td className="py-3 pr-4">Remembers Dark Mode vs. Light Mode UI preference across reloads.</td>
                    <td className="py-3 font-mono">Persistent</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-white">omnia_conversations_v1</td>
                    <td className="py-3 pr-4 text-neutral-300 font-mono">Functional</td>
                    <td className="py-3 pr-4">localStorage</td>
                    <td className="py-3 pr-4">Stores local Omnia chat threads for quick access on `/history` and `/ai`.</td>
                    <td className="py-3 font-mono">User-Controlled</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-white">vizra_engage_dismissed_cards</td>
                    <td className="py-3 pr-4 text-neutral-300 font-mono">Marketing (Opt-In)</td>
                    <td className="py-3 pr-4">sessionStorage</td>
                    <td className="py-3 pr-4">Remembers dismissed contextual studio tips in VIZRA Engage. Purged upon withdrawal.</td>
                    <td className="py-3 font-mono">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
              <h2 className="typo-card-title">4. How to Change or Withdraw Consent</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                You may review, customize, or withdraw your consent at any time using the <strong>Manage Cookie Preferences</strong> button at the top of this page or in the website footer. Withdrawing consent immediately disables optional Analytics, Functional, and Marketing categories, purges optional marketing session storage, and appends a `WITHDRAW` event to the consent audit log.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Contact & Privacy Action Strip */}
        <div className="p-6 rounded-2xl bg-[#111111] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <CheckCircle2 size={14} className="text-[#EB3B2D]" />
              <span>Privacy Requests, Data Deletion &amp; Legal Inquiries</span>
            </div>
            <p className="text-xs text-neutral-400">
              Need to submit a data access/deletion request or adjust your browser consent settings?
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => openCookiePreferencesModal('Cookie Policy Page')}
              className="px-4 py-2 rounded-xl bg-[#171717] hover:bg-neutral-800 border border-white/[0.1] text-white font-display font-medium text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders size={13} className="text-[#EB3B2D]" />
              <span>Manage Cookie Preferences</span>
            </button>
            <Link
              to="/contact"
              className="px-4 py-2 rounded-xl bg-white text-black font-display font-semibold text-xs hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Contact / Privacy Requests</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
