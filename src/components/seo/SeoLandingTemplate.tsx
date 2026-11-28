import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { PageLayout } from '../PageLayout';
import { SeoLandingPageConfig } from '../../data/seoLandingPages';
import { useAuth } from '../../context/AuthContext';
import { trackConversionEvent } from '../../services/conversionTracking';

interface SeoLandingTemplateProps {
  config: SeoLandingPageConfig;
  seoTitle: string;
  seoDescription: string;
}

export const SeoLandingTemplate: React.FC<SeoLandingTemplateProps> = ({
  config,
  seoTitle,
  seoDescription,
}) => {
  const { user, openLoginModal } = useAuth();
  const isAuthenticated = Boolean(user);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    trackConversionEvent('organic_landing_visit', {
      page: config.canonicalPath,
      category: config.category,
    });
  }, [config.canonicalPath, config.category]);

  const handlePrimaryCtaClick = (locationTag: string) => {
    trackConversionEvent('signup_cta_click', {
      source: config.canonicalPath,
      location: locationTag,
      target: config.primaryCtaPath,
    });
  };

  const handleSignUpClick = (locationTag: string) => {
    trackConversionEvent('signup_cta_click', {
      source: config.canonicalPath,
      location: locationTag,
      target: 'auth_modal',
    });
    openLoginModal();
  };

  return (
    <PageLayout
      title={seoTitle}
      description={seoDescription}
      canonicalPath={config.canonicalPath}
    >
      {/* Hero Section */}
      <section className="pt-28 md:pt-36 pb-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        {/* Visible Breadcrumb Trail matching BreadcrumbList JSON-LD */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-neutral-400 mb-6"
        >
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-neutral-600" aria-hidden="true" />
          <Link to="/features" className="hover:text-white transition-colors">
            Platform
          </Link>
          <ChevronRight size={13} className="text-neutral-600" aria-hidden="true" />
          <span className="text-neutral-200">{config.eyebrow}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="typo-eyebrow">{config.eyebrow}</div>
            <h1 className="typo-page-title">{config.h1}</h1>
            <p className="typo-body-lg text-neutral-300">{config.lead}</p>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl">
              {config.secondaryLead}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={config.primaryCtaPath}
                onClick={() => handlePrimaryCtaClick('hero_primary')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors"
              >
                <Sparkles size={15} className="text-[#DC2626]" aria-hidden="true" />
                <span>{config.primaryCtaLabel}</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>

              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => handleSignUpClick('hero_signup')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#111111] border border-white/[0.12] text-white font-display font-medium text-sm hover:border-white/[0.26] hover:bg-[#171717] transition-colors cursor-pointer"
                >
                  <UserPlus size={15} className="text-[#EB3B2D]" aria-hidden="true" />
                  <span>Create Free Account</span>
                </button>
              )}

              <Link
                to={config.secondaryCtaPath}
                onClick={() =>
                  trackConversionEvent('signup_cta_click', {
                    source: config.canonicalPath,
                    location: 'hero_secondary',
                    target: config.secondaryCtaPath,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-3 text-sm text-neutral-300 hover:text-white transition-colors"
              >
                <span>{config.secondaryCtaLabel}</span>
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Right Product Architecture Spec Panel */}
          <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7 space-y-5">
            <div className="space-y-1.5">
              <h2 className="font-display text-base font-semibold text-white">
                {config.heroVisualTitle}
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {config.heroVisualCaption}
              </p>
            </div>

            <dl className="divide-y divide-white/[0.06]">
              {config.heroVisualItems.map((item) => (
                <div
                  key={item.label}
                  className="py-3 first:pt-1 last:pb-0 flex flex-col gap-0.5"
                >
                  <dt className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    {item.label}
                  </dt>
                  <dd className="text-sm text-neutral-100 leading-snug">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
              <span>Creator Free Tier: $0/mo</span>
              <Link
                to="/pricing"
                className="text-neutral-200 hover:text-[#EB3B2D] transition-colors inline-flex items-center gap-1"
              >
                <span>View Pricing</span>
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problems & Solutions Section */}
      <section className="py-16 md:py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl mb-10 space-y-2">
          <div className="typo-eyebrow">Workflow Friction Solved</div>
          <h2 className="typo-section-title">{config.problemsSectionTitle}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {config.problems.map((item, idx) => (
            <article
              key={item.vizraFeature}
              className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="text-xs font-mono text-[#EB3B2D] tabular-nums">
                  0{idx + 1} · Challenge &amp; Solution
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-base font-semibold text-white leading-snug">
                    {item.problem}
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    {item.solution}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-neutral-400">
                <CheckCircle2
                  size={14}
                  className="text-[#EB3B2D] shrink-0"
                  aria-hidden="true"
                />
                <span>{item.vizraFeature}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Verified Live Features Grid */}
      <section className="py-16 md:py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl mb-10 space-y-2">
          <div className="typo-eyebrow">Verified Capabilities</div>
          <h2 className="typo-section-title">{config.featuresSectionTitle}</h2>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            {config.featuresSectionIntro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {config.features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-neutral-400">{feature.category}</span>
                  <span
                    className={
                      feature.status === 'Live Today'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }
                  >
                    {feature.status}
                  </span>
                </div>
                <h3 className="typo-card-title">{feature.title}</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div>
                <Link
                  to={feature.linkTo}
                  className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-white hover:text-[#EB3B2D] transition-colors"
                >
                  <span>{feature.linkLabel}</span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Capability Table & Transparency Notice */}
      <section className="py-16 md:py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl mb-8 space-y-2">
          <div className="typo-eyebrow">Product Specifications</div>
          <h2 className="typo-section-title">{config.specsSectionTitle}</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#111111]">
          <table className="w-full text-left border-collapse text-sm tabular-nums">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#090909]/60">
                <th className="py-3.5 px-5 font-display font-semibold text-neutral-200">
                  Capability
                </th>
                <th className="py-3.5 px-5 font-display font-semibold text-neutral-200">
                  Verified Specification
                </th>
                <th className="py-3.5 px-5 font-display font-semibold text-neutral-200">
                  Availability
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {config.specs.map((row) => (
                <tr key={row.capability}>
                  <td className="py-4 px-5 font-medium text-white whitespace-nowrap">
                    {row.capability}
                  </td>
                  <td className="py-4 px-5 text-neutral-300">{row.detail}</td>
                  <td className="py-4 px-5 text-xs font-mono text-neutral-300 whitespace-nowrap">
                    {row.availability}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#0D0D0D] p-5 flex items-start gap-3">
          <Info
            size={16}
            className="text-neutral-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            {config.transparencyNote}
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto border-b border-white/[0.06]">
        <div className="mb-8 space-y-2">
          <div className="typo-eyebrow">Frequently Asked Questions</div>
          <h2 className="typo-section-title">Practical Questions, Direct Answers</h2>
        </div>

        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {config.faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={faq.question} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
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

      {/* Related Resources & Final Conversion CTA */}
      <section className="py-16 md:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto space-y-14">
        <div>
          <h2 className="font-display text-lg font-semibold text-white mb-5">
            Explore Related Studio Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {config.relatedLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-2xl border border-white/[0.08] bg-[#111111] hover:border-white/[0.2] p-5 transition-colors group flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="font-display text-sm font-semibold text-white group-hover:text-[#EB3B2D] transition-colors flex items-center justify-between">
                    <span>{link.label}</span>
                    <ArrowUpRight size={14} className="text-neutral-500" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {link.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-[#111111] p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Start building inside VIZRA today.
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Launch Omnia 1.0 on the Creator Free tier with zero credit card required, or test our standalone AI Prompt Optimizer immediately without creating an account.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/ai"
              onClick={() => handlePrimaryCtaClick('footer_banner_omnia')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors"
            >
              <span>Launch Omnia 1.0</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => handleSignUpClick('footer_banner_signup')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#090909] border border-white/[0.14] text-white font-display font-medium text-sm hover:border-white/[0.28] transition-colors cursor-pointer"
              >
                <span>Sign Up Free</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
