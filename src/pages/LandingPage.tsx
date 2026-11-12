import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Wrench,
  Cpu,
  Compass,
  CreditCard,
  BookOpen,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { HeroSection } from '../components/HeroSection';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToAI = () => {
    navigate('/ai');
  };

  const handleNavigateToExplore = () => {
    navigate('/explore');
  };

  const platformDestinations = [
    {
      index: '01',
      title: 'Features & Pipeline',
      eyebrow: 'Architecture',
      description:
        'Explore the 4 Core Pillars (Think, Create, Build, Explore), our 5-step Idea-to-Finish pipeline, and 10-stage persistent project memory.',
      to: '/features',
      cta: 'Explore Features',
      icon: Layers,
      span: 'lg:col-span-7',
      metrics: '4 Pillars · 5-Step Pipeline · 10-Stage Memory',
    },
    {
      index: '02',
      title: 'AI Tools & Create Hub',
      eyebrow: '8 Specialized Tools',
      description:
        'Launch dedicated workflows for scriptwriting, design systems, visual synthesis, React/GLSL code, presentations, and grounded research.',
      to: '/tools',
      cta: 'Browse AI Tools',
      icon: Wrench,
      span: 'lg:col-span-5',
      metrics: 'Write · Design · Image · Code · Research',
    },
    {
      index: '03',
      title: 'Creative Studio & Roadmap',
      eyebrow: '60fps Engines',
      description:
        'Inspect our four core studio engines—Temporal Motion, Neural Direction, Procedural Shaders, and Kinetic Typography—plus 6 interactive R&D prototypes.',
      to: '/studio',
      cta: 'Open Creative Studio',
      icon: Cpu,
      span: 'lg:col-span-5',
      metrics: '4 Live Engines · 6 Roadmap Prototypes',
    },
    {
      index: '04',
      title: '3D Creative Universe Showcase',
      eyebrow: 'Interactive Spatial Gallery',
      description:
        'Fly through the 3D perspective tunnel featuring 9 curated AI artworks, inspect synthesis prompts, and remix directly inside Omnia 1.0.',
      to: '/explore',
      cta: 'Enter 3D Showcase',
      icon: Compass,
      span: 'lg:col-span-7',
      metrics: '3D Perspective Tunnel · Prompt Remixing',
    },
  ];

  const secondaryRoutes = [
    {
      title: 'Pricing & Compute Tiers',
      desc: 'Compare Creator Free, Omnia Pro, and VIZRA Studio plans.',
      to: '/pricing',
      icon: CreditCard,
    },
    {
      title: 'Technical Documentation',
      desc: 'Intent routing, API endpoints, and SSRF security guides.',
      to: '/docs',
      icon: BookOpen,
    },
    {
      title: 'Workspace & Dev Console',
      desc: 'Manage 10-stage projects, D3 credit analytics, and API keys.',
      to: '/workspace',
      icon: LayoutDashboard,
    },
  ];

  return (
    <PageLayout
      title="Vizra — AI Creative Studio & Omnia 1.0"
      description="A modern AI creative studio built to make AI-powered creation simpler for creators, animators, motion designers, developers, and beginners."
    >
      {/* Section 01: Hero with Parallax & Omnia Workspace Preview */}
      <HeroSection
        onExplore={handleNavigateToExplore}
        onLaunchOmnia={handleNavigateToAI}
      />

      {/* Section 02: Asymmetric Multi-Page Platform Architecture Bento Grid */}
      <section className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl space-y-3">
            <div className="typo-eyebrow">01. Platform Architecture</div>
            <h2 className="typo-section-title">
              Navigate the Vizra Ecosystem
            </h2>
            <p className="typo-body">
              Every capability in Vizra has a dedicated workspace. Explore our core architecture, specialized AI tools, 60fps studio engines, and 3D creative showcase.
            </p>
          </div>

          <Link
            to="/about"
            className="text-xs sm:text-sm font-medium text-neutral-300 hover:text-white inline-flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <span>Read the Vizra Philosophy</span>
            <ArrowRight size={14} className="text-[#EB3B2D]" />
          </Link>
        </div>

        {/* Primary 4-Destination Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {platformDestinations.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className={`${card.span} group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-[#DC2626]/60 p-7 sm:p-8 flex flex-col justify-between transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2.5 text-xs font-mono">
                      <span className="text-[#EB3B2D] font-semibold">{card.index}.</span>
                      <span className="text-neutral-400 uppercase tracking-wider">
                        {card.eyebrow}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#171717] border border-white/[0.08] text-neutral-300 group-hover:text-[#EB3B2D] group-hover:border-[#DC2626]/40 transition-colors">
                      <Icon size={18} />
                    </div>
                  </div>

                  <h3 className="typo-card-title text-xl sm:text-2xl mb-2.5 group-hover:text-[#EB3B2D] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xl">
                    {card.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4">
                  <span className="text-[11px] font-mono text-neutral-500 truncate">
                    {card.metrics}
                  </span>
                  <span className="text-xs font-display font-semibold text-white group-hover:text-[#EB3B2D] inline-flex items-center gap-1.5 shrink-0 transition-colors">
                    <span>{card.cta}</span>
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Secondary 3-Route Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {secondaryRoutes.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="p-6 rounded-2xl bg-[#111111]/80 border border-white/[0.08] hover:border-white/[0.2] flex items-start justify-between gap-4 transition-colors group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon size={15} className="text-[#EB3B2D]" />
                    <h3 className="font-display text-base font-semibold text-white group-hover:text-[#EB3B2D] transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <ArrowUpRight
                  size={15}
                  className="text-neutral-500 group-hover:text-white shrink-0 mt-1"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Section 03: Primary Conversion Callout */}
      <section className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="rounded-3xl bg-[#111111] border border-white/[0.08] p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="typo-eyebrow">Ready to Create</div>
            <h2 className="typo-section-title">
              Start building inside Omnia 1.0 today.
            </h2>
            <p className="typo-body">
              Launch the live AI workspace immediately or connect with our studio team for custom enterprise onboarding and private beta access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 shrink-0">
            <button
              type="button"
              onClick={handleNavigateToAI}
              className="px-7 py-3.5 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={15} className="text-[#DC2626]" />
              <span>Launch Omnia 1.0</span>
              <ArrowUpRight size={15} />
            </button>
            <Link
              to="/contact"
              className="px-6 py-3.5 rounded-xl bg-[#171717] hover:bg-neutral-800 border border-white/[0.1] text-white font-display font-medium text-sm transition-colors inline-flex items-center gap-2"
            >
              <span>Contact & Early Access</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
