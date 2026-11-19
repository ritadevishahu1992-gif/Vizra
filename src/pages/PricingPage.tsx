import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Check, ArrowRight } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { PricingSection } from '../components/PricingSection';

interface ComparisonRow {
  capability: string;
  starter: string;
  pro: string;
  studio: string;
}

const COMPARISON_MATRIX: ComparisonRow[] = [
  {
    capability: 'Omnia 1.0 Concurrency Quota',
    starter: '60 req / min',
    pro: '240 req / min',
    studio: 'Custom SLA',
  },
  {
    capability: '10-Stage Creative Workspaces',
    starter: 'Up to 3 Active',
    pro: 'Unlimited',
    studio: 'Unlimited + Team Sync',
  },
  {
    capability: 'Multimodal Attachment Limit',
    starter: '10 MB / file',
    pro: '15 MB / file',
    studio: '15 MB / file + Corpus RAG',
  },
  {
    capability: 'Grounded Live Web Citations',
    starter: 'Included',
    pro: 'Priority Deep Research',
    studio: 'Priority + Custom Domains',
  },
  {
    capability: 'Lyria 3 Music & Live Voice',
    starter: 'Preview Access',
    pro: 'Full Studio Access',
    studio: 'Multi-Seat Studio Access',
  },
  {
    capability: 'Workspace Governance & Team Support',
    starter: 'Self-Service Studio Docs',
    pro: 'Priority Studio Support',
    studio: 'Shared Team Roles & Dedicated SLA',
  },
];

const PRICING_FAQS = [
  {
    q: 'How are AI generation credits calculated across Omnia 1.0 modes?',
    a: 'Standard conversational queries (Quick and Think modes) use 1 credit per turn. Deep web research, high-resolution visual synthesis, and Lyria 3 audio generation consume credits proportional to compute complexity, tracked live in your header Credit Usage Indicator.',
  },
  {
    q: 'Can I switch between Monthly and Yearly billing at any time?',
    a: 'Yes. You can toggle between Monthly and Annual billing directly from the Pricing page or your Workspace Console. Annual billing provides an immediate 20% discount across Omnia Pro and VIZRA Studio tiers.',
  },
  {
    q: 'What happens to my 10-stage projects if I downgrade to Creator Free?',
    a: 'Your existing project history, files, and research notes are never deleted. On Creator Free, up to 3 projects remain actively editable while additional projects stay safely archived in read-only mode until you re-activate Pro or Studio.',
  },
  {
    q: 'Do you offer custom enterprise deployments or academic studio grants?',
    a: 'Yes. Production studios, universities, and research teams can request tailored concurrency quotas and dedicated onboarding through our Contact page.',
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <PageLayout
      title="Pricing & Compute Tiers — Vizra AI Creative Studio"
      description="Compare Vizra’s Creator Free ($0), Omnia Pro ($19/mo), and VIZRA Studio ($64/mo) plans with transparent compute quotas and 10-stage creative workspaces."
      canonicalPath="/pricing"
    >
      {/* Page Intro Banner */}
      <section className="pt-28 md:pt-36 pb-6 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="max-w-3xl space-y-4">
          <div className="typo-eyebrow">Pricing & Studio Entitlements</div>
          <h1 className="typo-page-title">
            Predictable pricing engineered for individual creators and production teams.
          </h1>
          <p className="typo-body-lg">
            Start free with Omnia 1.0 conversational intelligence and grounded search, then upgrade as your creative pipeline scales into multi-stage production.
          </p>
        </div>
      </section>

      {/* Main Interactive Pricing Cards & Upgrade Modal */}
      <PricingSection onLaunchOmnia={() => navigate('/ai')} />

      {/* Compute & Capability Comparison Matrix */}
      <section className="py-20 md:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="max-w-2xl mb-12 space-y-3">
          <div className="typo-eyebrow">Architecture Comparison</div>
          <h2 className="typo-section-title">Compute & Entitlement Matrix</h2>
          <p className="typo-body">
            Detailed specification breakdown across all three VIZRA platform tiers.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#090909] text-xs font-display uppercase tracking-wider text-neutral-400">
                <th className="py-4 px-6">Platform Capability</th>
                <th className="py-4 px-6">Creator Free ($0)</th>
                <th className="py-4 px-6 text-[#EB3B2D]">Omnia Pro ($19/mo)</th>
                <th className="py-4 px-6">VIZRA Studio ($64/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm tabular-nums">
              {COMPARISON_MATRIX.map((row) => (
                <tr key={row.capability} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6 font-medium text-white">{row.capability}</td>
                  <td className="py-4 px-6 text-neutral-400 font-mono text-xs">{row.starter}</td>
                  <td className="py-4 px-6 text-white font-mono text-xs font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Check size={13} className="text-[#EB3B2D]" />
                      <span>{row.pro}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 text-neutral-200 font-mono text-xs">{row.studio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="max-w-2xl mb-12 space-y-3">
          <div className="typo-eyebrow">Frequently Asked Questions</div>
          <h2 className="typo-section-title">Billing & Compute Clarity</h2>
        </div>

        <div className="space-y-3">
          {PRICING_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-display text-sm sm:text-base font-semibold text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#EB3B2D]' : ''
                    }`}
                  />
                </button>
                <div
                  className={
                    isOpen
                      ? 'px-6 pb-5 pt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed border-t border-white/[0.05]'
                      : 'hidden'
                  }
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-[#111111] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="typo-card-title">Need custom concurrency or enterprise governance?</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Talk directly with our studio engineering team to configure custom limits.
            </p>
          </div>
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-xl bg-white text-black font-display font-semibold text-xs hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            <span>Contact Studio Team</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
};
