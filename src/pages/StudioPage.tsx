import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Cpu, Layers } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { StudioEngines } from '../components/StudioEngines';
import { VizraComingSoon } from '../components/VizraComingSoon';

export const StudioPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageLayout
      title="Creative Studio & Roadmap — Vizra AI Creative Studio"
      description="Inspect Vizra's four 60fps creative studio engines—Temporal Motion, Neural Direction, Procedural Shaders, and Kinetic Typography—plus upcoming R&D prototypes."
    >
      {/* Page Header */}
      <section className="pt-28 md:pt-36 pb-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl space-y-5">
          <div className="typo-eyebrow">Creative Studio · Engines & R&D</div>
          <h1 className="typo-page-title">
            Precision creative engines built for motion, shaders, and spatial direction.
          </h1>
          <p className="typo-body-lg">
            Explore the four production engines powering Vizra Creative Studio today, then test interactive concept prototypes from our upcoming product roadmap below.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/ai')}
              className="px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Cpu size={15} className="text-[#DC2626]" />
              <span>Test Engines in Omnia</span>
              <ArrowUpRight size={15} />
            </button>
            <Link
              to="/studio?section=roadmap"
              className="px-5 py-3 rounded-xl bg-[#111111] border border-white/[0.1] hover:border-white/[0.2] text-sm font-medium text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <Layers size={15} className="text-[#EB3B2D]" />
              <span>Jump to Future Roadmap</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 01: Four Core Studio Engines */}
      <div id="engines">
        <StudioEngines onLaunch={() => navigate('/ai')} />
      </div>

      {/* Section 02: Future of VIZRA Interactive Roadmap */}
      <div id="roadmap">
        <VizraComingSoon />
      </div>
    </PageLayout>
  );
};
