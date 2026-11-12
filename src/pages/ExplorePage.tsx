import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Sparkles, Wrench, Cpu } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { PerspectiveTunnelHero } from '@/components/ui/perspective-tunnel-hero';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLaunchWithPrompt = (prompt: string) => {
    sessionStorage.setItem('vizra_initial_prompt', prompt);
    navigate('/ai');
  };

  const creatorProfiles = [
    {
      role: 'Creators & Directors',
      desc: 'Synthesize motion concepts, cinematic treatments, and visual direction without losing creative momentum.',
      prompt: 'Create a 3-act visual storyboard for a neo-brutalist architectural film.',
    },
    {
      role: 'Designers & Art Directors',
      desc: 'Iterate visual tokens, typography hierarchies, and high-contrast obsidian color systems with direct prompt control.',
      prompt: 'Design a dark-mode typographic hierarchy pairing Space Grotesk with Inter.',
    },
    {
      role: 'Creative Developers',
      desc: 'Generate clean React and TypeScript components, 60fps WebGL shaders, and architectural diagnostics.',
      prompt: 'Write a 60fps interactive WebGL raymarched shader component in React.',
    },
    {
      role: 'Students & Researchers',
      desc: 'Ask complex scientific and academic questions and receive clear, grounded explanations with verified sources.',
      prompt: 'Explain quantum entanglement clearly with real-world physical analogies.',
    },
    {
      role: 'Writers & Storytellers',
      desc: 'Brainstorm storylines, scripts, and editorial articles naturally in English, Hindi, or Hinglish.',
      prompt: 'Draft an opening monologue for a sci-fi short film set in orbital research station 09.',
    },
    {
      role: 'Beginners & Explorers',
      desc: 'Turn your first raw idea into a structured 10-stage project without needing years of specialized software mastery.',
      prompt: 'Help me plan and structure my first interactive digital portfolio project.',
    },
  ];

  return (
    <PageLayout
      title="Explore 3D Creative Showcase — Vizra AI Creative Studio"
      description="Enter the Vizra 3D Creative Universe Showcase. Explore curated AI visuals inside an interactive perspective tunnel, inspect prompts, and launch in Omnia 1.0."
      canonicalPath="/explore"
    >
      {/* Section 01: 3D Perspective Tunnel Creative Showcase */}
      <div className="pt-16">
        <PerspectiveTunnelHero
          id="creative-showcase"
          headingLevel="h1"
          onSelectCard={(item) => handleLaunchWithPrompt(item.prompt)}
        />
      </div>

      {/* Section 02: Built For Every Creative Discipline */}
      <section className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-3">
            <div className="typo-eyebrow">Diverse Disciplines</div>
            <h2 className="typo-section-title">
              Built for anyone with an idea.
            </h2>
            <p className="typo-body">
              Vizra scales from rapid conversational questions to full 10-stage creative production. Select any creator profile below to test a tailored prompt in Omnia 1.0.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/tools"
              className="px-4 py-2.5 rounded-xl bg-[#111111] border border-white/[0.1] hover:border-white/[0.2] text-xs font-medium text-neutral-200 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <Wrench size={14} className="text-[#EB3B2D]" />
              <span>All AI Tools</span>
            </Link>
            <Link
              to="/studio"
              className="px-4 py-2.5 rounded-xl bg-[#111111] border border-white/[0.1] hover:border-white/[0.2] text-xs font-medium text-neutral-200 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <Cpu size={14} className="text-[#EB3B2D]" />
              <span>Studio Engines</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatorProfiles.map((profile) => (
            <div
              key={profile.role}
              className="p-6 rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-[#DC2626]/60 transition-all flex flex-col justify-between group"
            >
              <div>
                <h3 className="typo-card-title mb-2 group-hover:text-[#EB3B2D] transition-colors">
                  {profile.role}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-5">
                  {profile.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-neutral-500 truncate">
                  Try Starter Prompt
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchWithPrompt(profile.prompt)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-[#DC2626] text-white text-xs font-display font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Sparkles size={12} />
                  <span>Open in Omnia</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 03: Next-Step Navigation Strip */}
      <section className="pb-20 md:pb-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="p-8 rounded-2xl bg-[#111111] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="typo-card-title text-lg">
              Want to see how Omnia 1.0 structures full 10-stage projects?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Explore the complete platform architecture or jump directly into the AI studio workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/features"
              className="px-5 py-2.5 rounded-xl bg-[#171717] hover:bg-neutral-800 border border-white/[0.1] text-xs font-display font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <span>View Features Overview</span>
              <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={() => navigate('/ai')}
              className="px-5 py-2.5 rounded-xl bg-white text-black font-display font-semibold text-xs hover:bg-neutral-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Launch Omnia AI</span>
              <ArrowUpRight size={13} className="text-[#DC2626]" />
            </button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
