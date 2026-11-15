import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Brain,
  Sparkles,
  Layers,
  Globe,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  FolderGit2,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { WhyVizraSection } from '../components/WhyVizraSection';
import { VizraLogo } from '../components/VizraLogo';

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState<'ask' | 'create' | 'build'>('ask');

  const handleLaunchWithPrompt = (prompt: string) => {
    sessionStorage.setItem('vizra_initial_prompt', prompt);
    navigate('/ai');
  };

  const pillars = [
    {
      index: '01',
      label: 'THINK',
      subtitle: 'Conversational Reasoning',
      desc: 'Ask general knowledge questions, brainstorm ideas, analyze concepts, or talk naturally in English, Hindi, or Hinglish.',
      icon: Brain,
    },
    {
      index: '02',
      label: 'CREATE',
      subtitle: 'Generative Synthesis',
      desc: 'Draft scripts, generate visual concepts, write clean React code, synthesize GLSL shaders, or create presentation slides.',
      icon: Sparkles,
    },
    {
      index: '03',
      label: 'BUILD',
      subtitle: 'Project Architecture',
      desc: 'Turn loose thoughts into 10-stage milestones with tasks, files, research notes, and persistent context memory.',
      icon: Layers,
    },
    {
      index: '04',
      label: 'EXPLORE',
      subtitle: 'Verifiable Grounding',
      desc: 'Live real-time search with authenticated citations, cross-verified sources, and unbiased fact analysis without fake links.',
      icon: Globe,
    },
  ];

  const omniaCapabilities = [
    { title: 'Questions', desc: 'Direct, concise factual answers matched to your question length.' },
    { title: 'Conversations', desc: 'Natural dialogue without robotic academic essays.' },
    { title: 'Context', desc: 'Remembers project files, notes, and milestone decisions.' },
    { title: 'Files', desc: 'Reads PDFs, images, data spreadsheets, and source code.' },
    { title: 'Creative Tasks', desc: 'Crafts scripts, visual prompts, and structured slide copy.' },
    { title: 'Research', desc: 'Verified live web search with authentic HTTPS source links.' },
    { title: 'Code', desc: 'Generates TypeScript, React components, and GLSL shaders.' },
    { title: 'Projects', desc: 'Orchestrates multi-phase 10-stage studio workflows.' },
  ];

  return (
    <PageLayout
      title="Features & Architecture — Vizra AI Creative Studio"
      description="Explore the 4 Core Pillars of Vizra (Think, Create, Build, Explore), our 5-step Idea-to-Finish pipeline, and 10-stage persistent project memory in Omnia 1.0."
      canonicalPath="/features"
    >
      {/* Page Header */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl space-y-5">
          <div className="typo-eyebrow">Platform Architecture · Omnia 1.0</div>
          <h1 className="typo-page-title">
            Engineered to carry your work from initial spark to finished production.
          </h1>
          <p className="typo-body-lg">
            Vizra brings conversational intelligence, generative synthesis, and structured workflow memory into one cohesive workspace—eliminating disconnected chats and lost context.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/ai')}
              className="px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Omnia Workspace</span>
              <ArrowUpRight size={15} className="text-[#DC2626]" />
            </button>
            <Link
              to="/tools"
              className="px-5 py-3 rounded-xl bg-[#111111] border border-white/[0.1] hover:border-white/[0.2] text-sm font-medium text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <span>Browse AI Tools</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 01: The 4 Core Pillars */}
      <section className="py-20 md:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12 space-y-3">
          <div className="typo-eyebrow">01. Core Capabilities</div>
          <h2 className="typo-section-title">Four Pillars of the Vizra Platform</h2>
          <p className="typo-body">
            Every interaction in Vizra is routed intelligently across four foundational modes so simple questions get direct answers and ambitious projects get structured execution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((col, idx) => {
            const Icon = col.icon;
            return (
              <motion.div
                key={col.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="p-6 rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/[0.18] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-mono text-[#EB3B2D] font-medium">
                      {col.index} · {col.label}
                    </span>
                    <Icon size={18} className="text-neutral-400" />
                  </div>
                  <h3 className="typo-card-title mb-2">{col.subtitle}</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    {col.desc}
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-neutral-500">
                  Omnia 1.0 Native
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Section 02: 5-Step Unified Pipeline (Reusing WhyVizraSection) */}
      <WhyVizraSection />

      {/* Section 03: Meet Omnia 1.0 & Interactive Intent Demo */}
      <section
        id="meet-omnia"
        className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Omnia 1.0 Overview & 8 Capabilities */}
          <div className="lg:col-span-5 space-y-6">
            <div className="typo-eyebrow">03. Neural Operating Layer</div>
            <h2 className="typo-section-title">Meet Omnia 1.0</h2>
            <p className="typo-body">
              Omnia 1.0 is the intelligence engine inside Vizra. It classifies intent before acting—distinguishing between a conversational question, a multimodal synthesis task, and a multi-stage studio project.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {omniaCapabilities.map((item) => (
                <div
                  key={item.title}
                  className="p-4 rounded-xl bg-[#111111] border border-white/[0.07]"
                >
                  <div className="flex items-center gap-2 text-xs font-display font-semibold text-white mb-1">
                    <Check size={13} className="text-[#EB3B2D] shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Live Intent Switcher */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="typo-card-title">Interactive Intent Demonstration</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Switch modes below to inspect how Omnia adapts its output structure.
                </p>
              </div>

              <div className="inline-flex items-center p-1 rounded-xl bg-[#111111] border border-white/[0.08]">
                {[
                  { id: 'ask' as const, label: '1. Ask Omnia' },
                  { id: 'create' as const, label: '2. Create' },
                  { id: 'build' as const, label: '3. Build Project' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDemo(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeDemo === tab.id
                        ? 'bg-white text-black font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.1] bg-[#111111] shadow-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.06] bg-[#090909] flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono text-neutral-300">
                  Omnia 1.0 Intent Router · {activeDemo.toUpperCase()}
                </span>
                <span className="font-mono text-[11px] text-[#EB3B2D]">
                  {activeDemo === 'ask' && 'Mode: Conversational Direct'}
                  {activeDemo === 'create' && 'Mode: Creative Synthesis'}
                  {activeDemo === 'build' && 'Mode: 10-Stage Workflow'}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* User Prompt */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-200 shrink-0">
                    U
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#171717] border border-white/[0.08] text-sm text-white">
                    {activeDemo === 'ask' && 'Explain black holes simply.'}
                    {activeDemo === 'create' && 'Create a science exhibition poster concept.'}
                    {activeDemo === 'build' && 'Plan my portfolio website.'}
                  </div>
                </div>

                {/* Omnia Response */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#EB3B2D]/15 border border-[#EB3B2D]/40 flex items-center justify-center shrink-0">
                    <VizraLogo size={14} />
                  </div>
                  <div className="flex-1 space-y-4">
                    {activeDemo === 'ask' && (
                      <div className="p-5 rounded-xl bg-[#090909] border border-white/[0.08] text-sm text-neutral-200 leading-relaxed space-y-3">
                        <p>
                          A black hole is a region in space where gravity is so strong that nothing—not even light—can escape.
                        </p>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          It forms when a massive star exhausts its nuclear fuel and collapses under its own weight, compressing mass into a dense center called a <strong>singularity</strong> surrounded by the <strong>event horizon</strong>.
                        </p>
                        <div className="pt-2 flex items-center gap-2 text-xs font-mono text-neutral-400">
                          <CheckCircle2 size={13} className="text-[#EB3B2D]" />
                          <span>Direct conversational answer · Zero unrequested report bloat</span>
                        </div>
                      </div>
                    )}

                    {activeDemo === 'create' && (
                      <div className="p-5 rounded-xl bg-[#090909] border border-white/[0.08] text-sm text-neutral-200 space-y-3">
                        <div>
                          <span className="text-[11px] font-mono uppercase text-[#EB3B2D]">
                            Concept Blueprint
                          </span>
                          <h4 className="font-display text-base font-semibold text-white mt-0.5">
                            “Cosmic Horizons: The Physics of Tomorrow”
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-[#141414] border border-white/[0.06] space-y-1">
                            <strong className="text-white block">Visual Direction</strong>
                            <p className="text-neutral-400">
                              Deep obsidian background with a central refraction prism splitting crimson optical vectors.
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-[#141414] border border-white/[0.06] space-y-1">
                            <strong className="text-white block">Typography System</strong>
                            <p className="text-neutral-400">
                              Space Grotesk geometric display headline paired with high-contrast Inter metadata tracks.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDemo === 'build' && (
                      <div className="p-5 rounded-xl bg-[#090909] border border-white/[0.08] text-xs text-neutral-200 space-y-4">
                        <div>
                          <span className="text-[11px] font-mono uppercase text-[#EB3B2D]">
                            Project Architecture
                          </span>
                          <h4 className="font-display text-base font-semibold text-white mt-0.5">
                            Editorial Motion & Creative Dev Portfolio
                          </h4>
                        </div>
                        <div className="p-3.5 rounded-lg bg-[#141414] border border-white/[0.06] space-y-1.5 font-mono text-neutral-300">
                          <div>01. Typography system & obsidian color tokens</div>
                          <div>02. Procedural kinetic ribbon hero canvas</div>
                          <div>03. Case study schema & interactive media embeds</div>
                          <div>04. Real-time WebGL shader playground</div>
                          <div>05. Performance audit & 60fps verification</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-neutral-500">
                        Test this exact prompt inside the live workspace
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleLaunchWithPrompt(
                            activeDemo === 'ask'
                              ? 'Explain black holes simply.'
                              : activeDemo === 'create'
                              ? 'Create a science exhibition poster concept.'
                              : 'Plan my portfolio website.'
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-white text-black text-xs font-display font-semibold hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Run in Omnia</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Persistent Project Context Memory */}
      <section className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="typo-eyebrow">04. Persistent Project Memory</div>
          <h2 className="typo-section-title">Keep the entire idea together.</h2>
          <p className="typo-body">
            A project in Vizra is more than a chat thread. It unites conversations, uploaded files, grounded web research, technical notes, and generated deliverables under one persistent context.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#171717] border border-white/[0.08] text-[#EB3B2D]">
                <FolderGit2 size={20} />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#EB3B2D] uppercase">
                  Active Workspace Project
                </span>
                <h3 className="typo-card-title">Cinema Camera Motion Control Rig</h3>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span>Cinematography & Robotics</span>
              <span aria-hidden="true">·</span>
              <Link
                to="/workspace"
                className="text-white hover:text-[#EB3B2D] font-medium inline-flex items-center gap-1 transition-colors"
              >
                <span>Open Workspace Console</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Conversations', count: '4 Threads' },
              { label: 'Files', count: '2 PDFs · 1 CSV' },
              { label: 'Research', count: '6 Citations' },
              { label: 'Notes', count: 'Hardware Specs' },
              { label: 'Content', count: 'Poster & Script' },
              { label: 'Outputs', count: 'Slide Deck' },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-xl bg-[#090909] border border-white/[0.06]"
              >
                <div className="text-xs font-display font-semibold text-white mb-1">
                  {item.label}
                </div>
                <div className="text-xs font-mono text-neutral-400 tabular-nums">
                  {item.count}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-[#090909] border border-white/[0.06] space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="font-semibold text-white">Creator:</span>
              <span>“Generate the presentation deck from our current specs.”</span>
            </div>
            <div className="flex items-start gap-2 text-neutral-300 pt-2.5 border-t border-white/[0.06]">
              <span className="font-semibold text-[#EB3B2D] shrink-0">Omnia:</span>
              <span className="leading-relaxed">
                “Synthesizing the 6-slide architecture presentation for the <strong>Cinema Camera Motion Control Rig</strong> using your uploaded microcontroller pinout PDF, keyframe motion CSV, and studio monitor notes…”
              </span>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
