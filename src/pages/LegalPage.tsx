import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Lock, FileText, ArrowRight } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

export const LegalPage: React.FC = () => {
  const location = useLocation();
  const isTerms = location.pathname.startsWith('/terms');

  return (
    <PageLayout
      title={
        isTerms
          ? 'Terms of Service — Vizra AI Creative Studio'
          : 'Privacy Policy & Data Governance — Vizra AI Creative Studio'
      }
      description={
        isTerms
          ? 'Terms of Service, studio usage guidelines, intellectual property rights, and API concurrency rules for Vizra AI Creative Studio.'
          : 'Privacy Policy, zero-retention enterprise governance, cookie preferences, and SSRF security standards for Vizra AI Creative Studio.'
      }
    >
      {/* Page Header */}
      <section className="pt-28 md:pt-36 pb-12 px-6 sm:px-10 lg:px-16 max-w-5xl mx-auto border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="typo-eyebrow">Legal & Data Governance</div>
            <h1 className="typo-page-title">
              {isTerms ? 'Terms of Service' : 'Privacy Policy & Data Governance'}
            </h1>
            <p className="typo-body">
              Effective Date: November 2026 · Applies to Vizra AI Creative Studio & Omnia 1.0
            </p>
          </div>

          {/* Switcher between Privacy and Terms */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#111111] border border-white/[0.08] self-start">
            <Link
              to="/privacy"
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                !isTerms
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                isTerms
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </section>

      {/* Document Body */}
      <section className="py-16 md:py-24 px-6 sm:px-10 lg:px-16 max-w-5xl mx-auto space-y-8">
        {!isTerms ? (
          <div className="space-y-6">
            {[
              {
                icon: Lock,
                title: '1. Studio Workspace & Conversation Privacy',
                body: 'Your creative prompts, uploaded files (PDFs, CSVs, images, and code), and 10-stage project milestones are isolated to your workspace session and authenticated Firestore user scope. We never sell user data or expose private workspace artifacts on public URLs.',
              },
              {
                icon: Shield,
                title: '2. Server-Side API Keys & SSRF Protection',
                body: 'All AI synthesis and diagnostic requests are proxied through server-side routes (/api/*) so environment credentials are never exposed in client bundles. External URL diagnostics enforce strict Server-Side Request Forgery (SSRF) filters blocking private RFC1918 subnets and loopback addresses.',
              },
              {
                icon: FileText,
                title: '3. Cookie Consent & Telemetry Controls',
                body: 'Vizra respects granular cookie preferences (Essential, Analytics, Functional, and Marketing). Non-essential analytics only activate after explicit user consent via the Cookie Preferences controller.',
              },
            ].map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} className="text-[#EB3B2D]" />
                    <h2 className="typo-card-title">{section.title}</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    {section.body}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {[
              {
                icon: FileText,
                title: '1. Creative Output Ownership & Licensing',
                body: 'You retain full ownership of the prompts, scripts, code components, GLSL shaders, and visual assets you synthesize inside Vizra AI Creative Studio, subject to applicable law and third-party source attributions.',
              },
              {
                icon: Shield,
                title: '2. Acceptable Use & Rate Limit Fair Play',
                body: 'To maintain 60fps workspace responsiveness for all creators, API endpoints enforce sliding-window rate limits (60 req/min on Creator Free, 240 req/min on Omnia Pro). Automated scraping or attempts to bypass authentication gates are prohibited.',
              },
              {
                icon: Lock,
                title: '3. Grounded Citations & Factual Verification',
                body: 'While Omnia 1.0 uses live web search grounding and deterministic math verification to maximize accuracy, users remain responsible for reviewing generated code and factual citations prior to commercial publication.',
              },
            ].map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} className="text-[#EB3B2D]" />
                    <h2 className="typo-card-title">{section.title}</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    {section.body}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-6 rounded-2xl bg-[#111111] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-neutral-400">
            Questions about data privacy, enterprise DPA agreements, or security audits?
          </div>
          <Link
            to="/contact"
            className="px-4 py-2 rounded-xl bg-white text-black font-display font-semibold text-xs hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Contact Legal & Security</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
};
