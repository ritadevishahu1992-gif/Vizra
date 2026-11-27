import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { BrandStatement } from '../components/BrandStatement';
import { AboutDevelopersSection } from '../components/AboutDevelopersSection';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section') || location.hash.replace(/^#/, '');
    if (!section) return;
    const target = document.getElementById(section);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.search, location.hash]);

  const corePrinciples = [
    {
      index: '01',
      title: 'Response Proportionality',
      desc: 'Simple questions receive direct, conversational answers. Complex engineering and creative challenges receive structured, in-depth execution.',
    },
    {
      index: '02',
      title: 'Zero Fabricated Citations',
      desc: 'Omnia never invents fake source labels or unverified links. Citations are displayed strictly when grounded web retrieval verifies the source.',
    },
    {
      index: '03',
      title: 'Persistent Studio Context',
      desc: 'Creativity compounds when your conversations, files, research notes, and milestones stay united inside one workspace.',
    },
    {
      index: '04',
      title: 'Architectural Honesty',
      desc: 'We maintain a crystal-clear boundary between capabilities live in production today and upcoming R&D features in staging.',
    },
  ];

  return (
    <PageLayout
      title="About VIZRA & Core Philosophy — Vizra AI Creative Studio"
      description="Learn about Vizra’s mission, the founders behind VIZRA, the Omnia 1.0 philosophy, and our commitment to response proportionality, verified citations, and persistent studio context."
      canonicalPath="/about"
    >
      {/* Page Hero */}
      <section className="pt-28 md:pt-36 pb-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl space-y-5">
          <div className="typo-eyebrow">About VIZRA · Core Creed</div>
          <h1 className="typo-page-title">
            “Don’t just ask AI.{' '}
            <span className="font-instrument-serif italic font-normal text-neutral-200">
              Work with it.”
            </span>
          </h1>
          <p className="typo-body-lg">
            Vizra was created to bridge the gap between fleeting AI chat threads and real finished creative work—uniting conversation, context, creativity, and workflow under one platform.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/ai')}
              className="px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Experience Omnia 1.0</span>
              <ArrowUpRight size={15} className="text-[#DC2626]" />
            </button>
            <Link
              to="/features"
              className="px-5 py-3 rounded-xl bg-[#111111] border border-white/[0.1] hover:border-white/[0.2] text-sm font-medium text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <span>Explore Platform Features</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll-Driven Philosophy Word Reveal */}
      <div id="philosophy">
        <BrandStatement />
      </div>

      {/* About the Developers — The People Behind VIZRA */}
      <AboutDevelopersSection />

      {/* Core Architectural Principles */}
      <section className="py-20 md:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="typo-eyebrow">Foundational Principles</div>
          <h2 className="typo-section-title">How We Engineer Vizra</h2>
          <p className="typo-body">
            Every design and engineering decision inside Vizra is governed by four non-negotiable standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {corePrinciples.map((item) => (
            <div
              key={item.index}
              className="p-7 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3"
            >
              <div className="text-xs font-mono text-[#EB3B2D] font-medium">
                {item.index}. Principle
              </div>
              <h3 className="typo-card-title">{item.title}</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Future Honesty & Product Transparency */}
      <section className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-8 md:p-10 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="typo-eyebrow">Transparency Commitment</div>
            <h2 className="typo-section-title">What’s Live Today vs. What’s Coming Next</h2>
            <p className="typo-body">
              We never present mockup features as finished products. Here is the exact live status of the Vizra ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-[#090909] border border-white/[0.06] space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-display text-sm font-semibold">
                <CheckCircle2 size={16} />
                <span>Live in Production Now</span>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Omnia 1.0 Multilingual Conversational Intelligence</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Grounded Web Research with Verified Citations</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>10-Stage Project Context Memory & Workspace Console</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Multimodal File Analysis (PDF, CSV, Code, Images)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Lyria 3 AI Music Studio & D3 Credit Usage Analytics</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-[#090909] border border-white/[0.06] space-y-4">
              <div className="flex items-center gap-2 text-[#EB3B2D] font-display text-sm font-semibold">
                <Clock size={16} />
                <span>In Active R&D Staging</span>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="text-[#EB3B2D]">·</span>
                  <span>Omnia Spatial Director (Multi-camera 3D virtual blocking)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EB3B2D]">·</span>
                  <span>Third-Party Cloud Connectors (Google Drive, Figma, Notion)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EB3B2D]">·</span>
                  <span>Multiplayer Real-Time Team Production Timeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EB3B2D]">·</span>
                  <span>Edge Omnia Offline Apple Silicon / RTX Runtime</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#EB3B2D]" />
              <span>SSRF-Hardened Backend · Firestore RBAC · Zero Unverified Claims</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/studio?section=roadmap" className="text-white hover:text-[#EB3B2D] font-medium">
                Inspect Roadmap Prototypes →
              </Link>
              <Link to="/contact" className="text-white hover:text-[#EB3B2D] font-medium">
                Contact Us →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
