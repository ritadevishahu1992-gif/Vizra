import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Scale,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import {
  ALTERNATIVES_HUB_CARDS,
  COMPETITOR_COMPARISONS,
} from '../data/competitorComparisons';
import { resolveRouteSeoPayload } from '../seo/routeMetadata';
import { useAuth } from '../context/AuthContext';
import { trackConversionEvent } from '../services/conversionTracking';
import { NotFoundPage } from './NotFoundPage';

const AlternativesHubView: React.FC = () => {
  const { user, openLoginModal } = useAuth();
  const isAuthenticated = Boolean(user);
  const routeSeo = resolveRouteSeoPayload('/alternatives');

  useEffect(() => {
    trackConversionEvent('organic_landing_visit', {
      page: '/alternatives',
      category: 'Comparison Hub',
    });
  }, []);

  return (
    <PageLayout
      title={routeSeo.title}
      description={routeSeo.description}
      canonicalPath="/alternatives"
    >
      {/* Header */}
      <section className="pt-28 md:pt-36 pb-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-neutral-400 mb-6"
        >
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-neutral-600" aria-hidden="true" />
          <span className="text-neutral-200">Alternatives &amp; Comparisons</span>
        </nav>

        <div className="max-w-3xl space-y-4">
          <div className="typo-eyebrow">Honest Platform Comparisons · Verified Nov 2026</div>
          <h1 className="typo-page-title">
            How VIZRA Compares to Leading Creative AI Platforms
          </h1>
          <p className="typo-body-lg text-neutral-300">
            Every creative platform optimizes for a different workflow. Below is an honest, verified comparison showing where VIZRA excels — and where Canva, Runway, Krea AI, or Adobe Express is the better choice today.
          </p>
        </div>
      </section>

      {/* Competitor Comparison Grid */}
      <section className="py-16 md:py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ALTERNATIVES_HUB_CARDS.map((card) => (
            <article
              key={card.name}
              className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7 flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">
                      VIZRA vs {card.name}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">{card.category}</p>
                  </div>
                  <span className="text-xs font-mono text-neutral-300 shrink-0 tabular-nums">
                    {card.startingPaidPrice}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Where {card.name} Leads
                    </div>
                    <p className="text-neutral-300 leading-relaxed">{card.bestKnownFor}</p>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#EB3B2D] mb-1">
                      Where VIZRA Differs
                    </div>
                    <p className="text-neutral-200 leading-relaxed">{card.whereVizraDiffers}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {card.comparisonPath ? (
                  <Link
                    to={card.comparisonPath}
                    className="inline-flex items-center gap-2 text-sm font-display font-semibold text-white hover:text-[#EB3B2D] transition-colors"
                  >
                    <span>{card.comparisonLabel}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="text-xs font-mono text-neutral-400">
                    {card.comparisonLabel}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Quick Decision Matrix */}
      <section className="py-16 md:py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl mb-8 space-y-2">
          <div className="typo-eyebrow">Quick Decision Guide</div>
          <h2 className="typo-section-title">Which Tool Fits Your Immediate Goal?</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#111111]">
          <table className="w-full text-left border-collapse text-sm tabular-nums">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#090909]/60">
                <th className="py-3.5 px-5 font-display font-semibold text-neutral-200">
                  Primary Creative Goal
                </th>
                <th className="py-3.5 px-5 font-display font-semibold text-neutral-200">
                  Recommended Platform
                </th>
                <th className="py-3.5 px-5 font-display font-semibold text-neutral-200">
                  Why
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              <tr>
                <td className="py-4 px-5 font-medium text-white">
                  Unified AI studio (research + code/shaders + file audits + audio + 10-stage workspace)
                </td>
                <td className="py-4 px-5 font-display font-semibold text-[#EB3B2D]">VIZRA</td>
                <td className="py-4 px-5 text-neutral-300">
                  Live Omnia 1.0 modes, verified HTTPS citations, GLSL/React code, Lyria 3 WAV audio, and persistent pipelines in one browser tab.
                </td>
              </tr>
              <tr>
                <td className="py-4 px-5 font-medium text-white">
                  Social graphics, presentation decks, print flyers &amp; team Brand Kits
                </td>
                <td className="py-4 px-5 font-medium text-neutral-100">Canva or Adobe Express</td>
                <td className="py-4 px-5 text-neutral-300">
                  Millions of ready-made templates, stock photo libraries (200M+ on Adobe Express), and direct social scheduling.
                </td>
              </tr>
              <tr>
                <td className="py-4 px-5 font-medium text-white">
                  Production generative AI video clips, 4K upscaling &amp; lip sync today
                </td>
                <td className="py-4 px-5 font-medium text-neutral-100">Runway</td>
                <td className="py-4 px-5 text-neutral-300">
                  Gen-4.5 video models and ProRes/HDR workflows are live today; VIZRA’s Temporal Video Engine is still in staging.
                </td>
              </tr>
              <tr>
                <td className="py-4 px-5 font-medium text-white">
                  Real-time diffusion painting, AI upscaling &amp; custom LoRA training
                </td>
                <td className="py-4 px-5 font-medium text-neutral-100">Krea AI</td>
                <td className="py-4 px-5 text-neutral-300">
                  Purpose-built real-time image canvas and custom LoRA fine-tuning across compute-unit tiers.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-white/[0.1] bg-[#111111] p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              Test VIZRA firsthand before deciding.
            </h2>
            <p className="text-sm sm:text-base text-neutral-300">
              Try our Free AI Prompt Optimizer with zero registration, or open Omnia 1.0 on the $0 Creator Free tier.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/ai"
              onClick={() =>
                trackConversionEvent('signup_cta_click', {
                  source: '/alternatives',
                  location: 'hub_cta',
                  target: '/ai',
                })
              }
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors"
            >
              <Sparkles size={15} className="text-[#DC2626]" aria-hidden="true" />
              <span>Launch Omnia 1.0 Free</span>
            </Link>
            <Link
              to="/free-ai-prompt-optimizer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#090909] border border-white/[0.14] text-white font-display font-medium text-sm hover:border-white/[0.28] transition-colors"
            >
              <span>Try Prompt Optimizer</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  trackConversionEvent('signup_cta_click', {
                    source: '/alternatives',
                    location: 'hub_signup',
                    target: 'auth_modal',
                  });
                  openLoginModal();
                }}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <UserPlus size={14} aria-hidden="true" />
                <span>Create Account</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export const ComparisonPage: React.FC = () => {
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const { user, openLoginModal } = useAuth();
  const isAuthenticated = Boolean(user);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (normalizedPath === '/alternatives') {
    return <AlternativesHubView />;
  }

  const comparison = COMPETITOR_COMPARISONS[normalizedPath];

  useEffect(() => {
    if (comparison) {
      trackConversionEvent('organic_landing_visit', {
        page: comparison.canonicalPath,
        category: 'Competitor Comparison',
      });
    }
  }, [comparison]);

  if (!comparison) {
    return <NotFoundPage />;
  }

  const routeSeo = resolveRouteSeoPayload(comparison.canonicalPath);

  return (
    <PageLayout
      title={routeSeo.title}
      description={routeSeo.description}
      canonicalPath={comparison.canonicalPath}
    >
      {/* Hero */}
      <section className="pt-28 md:pt-36 pb-14 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-neutral-400 mb-6"
        >
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-neutral-600" aria-hidden="true" />
          <Link to="/alternatives" className="hover:text-white transition-colors">
            Alternatives
          </Link>
          <ChevronRight size={13} className="text-neutral-600" aria-hidden="true" />
          <span className="text-neutral-200">VIZRA vs {comparison.competitorName}</span>
        </nav>

        <div className="max-w-4xl space-y-5">
          <div className="typo-eyebrow">
            {comparison.eyebrow} · Pricing &amp; Specs Verified {comparison.verifiedDate}
          </div>
          <h1 className="typo-page-title">{comparison.h1}</h1>
          <p className="typo-body-lg text-neutral-300">{comparison.intro}</p>

          {/* TL;DR Honest Verdict Box */}
          <div className="rounded-2xl border border-white/[0.1] bg-[#111111] p-5 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#EB3B2D]">
              <Scale size={14} aria-hidden="true" />
              <span>Honest Verdict</span>
            </div>
            <p className="text-sm sm:text-base text-neutral-200 leading-relaxed">
              {comparison.tldrVerdict}
            </p>
          </div>
        </div>
      </section>

      {/* What Each Platform Offers */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-[#EB3B2D]">
              What VIZRA Offers
            </div>
            <h2 className="typo-card-title">VIZRA AI Creative Studio</h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {comparison.vizraOverview}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              What {comparison.competitorName} Offers
            </div>
            <h2 className="typo-card-title">{comparison.competitorName}</h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {comparison.competitorOverview}
            </p>
          </div>
        </div>
      </section>

      {/* Feature-by-Feature Matrix */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl mb-8 space-y-2">
          <div className="typo-eyebrow">Side-by-Side Breakdown</div>
          <h2 className="typo-section-title">
            Feature-by-Feature Comparison: VIZRA vs {comparison.competitorName}
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#111111]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#090909]/60">
                <th className="py-3.5 px-5 font-display font-semibold text-neutral-200 w-1/4">
                  Dimension
                </th>
                <th className="py-3.5 px-5 font-display font-semibold text-white w-[37.5%]">
                  VIZRA
                </th>
                <th className="py-3.5 px-5 font-display font-semibold text-neutral-200 w-[37.5%]">
                  {comparison.competitorName}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {comparison.featureComparison.map((row) => (
                <tr key={row.category}>
                  <td className="py-4 px-5 font-medium text-white align-top">
                    {row.category}
                  </td>
                  <td className="py-4 px-5 text-neutral-200 align-top leading-relaxed">
                    {row.vizra}
                  </td>
                  <td className="py-4 px-5 text-neutral-300 align-top leading-relaxed">
                    {row.competitor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl mb-8 space-y-2">
          <div className="typo-eyebrow">Pricing Comparison · Verified {comparison.verifiedDate}</div>
          <h2 className="typo-section-title">Plans &amp; Pricing Transparency</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 tabular-nums">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">
              VIZRA Pricing
            </h3>
            <div className="divide-y divide-white/[0.06]">
              {comparison.vizraPricing.map((tier) => (
                <div key={tier.plan} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-white text-sm">{tier.plan}</span>
                    <span className="font-mono text-xs text-[#EB3B2D]">{tier.price}</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{tier.notes}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">
              {comparison.competitorName} Pricing
            </h3>
            <div className="divide-y divide-white/[0.06]">
              {comparison.competitorPricing.map((tier) => (
                <div key={tier.plan} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-white text-sm">{tier.plan}</span>
                    <span className="font-mono text-xs text-neutral-300">{tier.price}</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{tier.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-400 mt-5 leading-relaxed">
          {comparison.pricingDisclaimer}
        </p>
      </section>

      {/* Strengths & Intended Audience */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06] space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">
              Where VIZRA Is Stronger
            </h2>
            <ul className="space-y-3">
              {comparison.whereVizraIsBetter.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-200 leading-relaxed">
                  <Check size={15} className="text-[#EB3B2D] shrink-0 mt-1" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">
              Where {comparison.competitorName} Is Stronger
            </h2>
            <ul className="space-y-3">
              {comparison.whereCompetitorIsBetter.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-300 leading-relaxed">
                  <Check size={15} className="text-neutral-400 shrink-0 mt-1" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D0D] p-6 space-y-3">
            <h3 className="font-display text-base font-semibold text-white">
              Choose VIZRA if…
            </h3>
            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
              {comparison.chooseVizraIf.map((point) => (
                <li key={point} className="leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D0D] p-6 space-y-3">
            <h3 className="font-display text-base font-semibold text-white">
              Choose {comparison.competitorName} if…
            </h3>
            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
              {comparison.chooseCompetitorIf.map((point) => (
                <li key={point} className="leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7 space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            Bottom Line
          </div>
          <p className="text-sm sm:text-base text-neutral-200 leading-relaxed">
            {comparison.honestConclusion}
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto border-b border-white/[0.06]">
        <div className="mb-8 space-y-2">
          <div className="typo-eyebrow">Comparison FAQs</div>
          <h2 className="typo-section-title">
            Common Questions About VIZRA vs {comparison.competitorName}
          </h2>
        </div>

        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {comparison.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={faq.question} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left py-1 cursor-pointer group"
                >
                  <span className="font-display text-sm sm:text-base font-semibold text-white group-hover:text-[#EB3B2D] transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-neutral-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="pt-3 pr-8 text-sm text-neutral-300 leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Related Comparisons + CTA */}
      <section className="py-16 md:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto space-y-12">
        <div>
          <h2 className="font-display text-lg font-semibold text-white mb-5">
            More Comparisons &amp; Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {comparison.relatedComparisons.map((rel) => (
              <Link
                key={rel.to}
                to={rel.to}
                className="rounded-2xl border border-white/[0.08] bg-[#111111] hover:border-white/[0.2] p-5 transition-colors group"
              >
                <div className="font-display text-sm font-semibold text-white group-hover:text-[#EB3B2D] transition-colors flex items-center justify-between mb-1.5">
                  <span>{rel.label}</span>
                  <ArrowUpRight size={14} className="text-neutral-500" aria-hidden="true" />
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">{rel.summary}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-[#111111] p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              Try VIZRA’s Creator Free Tier Today
            </h2>
            <p className="text-sm sm:text-base text-neutral-300">
              Experience Omnia 1.0, live verified citations, creative code, and Lyria 3 instrumental audio with zero credit card required.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/ai"
              onClick={() =>
                trackConversionEvent('signup_cta_click', {
                  source: comparison.canonicalPath,
                  location: 'comparison_footer_cta',
                  target: '/ai',
                })
              }
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors"
            >
              <span>Launch Omnia 1.0</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  trackConversionEvent('signup_cta_click', {
                    source: comparison.canonicalPath,
                    location: 'comparison_footer_signup',
                    target: 'auth_modal',
                  });
                  openLoginModal();
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#090909] border border-white/[0.14] text-white font-display font-medium text-sm hover:border-white/[0.28] transition-colors cursor-pointer"
              >
                <span>Create Free Account</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
