import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Palette,
  Layout,
  Video,
  Code,
  Presentation,
  Search,
  Sliders,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  HardDrive,
  FileSpreadsheet,
  Github,
  Figma,
  Youtube,
  FileCheck,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

type ToolCategoryFilter = 'all' | 'writing' | 'visual' | 'code' | 'research';

interface CreativeToolItem {
  id: string;
  name: string;
  category: ToolCategoryFilter;
  desc: string;
  status: 'available' | 'coming_soon';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  prompt: string;
  outputFormat: string;
}

const TOOLS_LIST: CreativeToolItem[] = [
  {
    id: 'write',
    name: 'Editorial & Script Writing',
    category: 'writing',
    desc: 'Cinematic scripts, brand manifestos, technical documentation, and multilingual narrative treatments.',
    status: 'available',
    icon: FileText,
    prompt: 'Write a compelling cinematic script for a short motion reel about obsidian minimalism.',
    outputFormat: 'Markdown · Screenplay · Structured Copy',
  },
  {
    id: 'design',
    name: 'Design System & Token Architect',
    category: 'visual',
    desc: 'Visual design tokens, WCAG AA contrast scales, typography hierarchies, and layout grids.',
    status: 'available',
    icon: Palette,
    prompt: 'Design a clean dark-mode visual identity palette with crimson accent tokens and Space Grotesk typography.',
    outputFormat: 'CSS Variables · JSON Tokens · Spec Sheet',
  },
  {
    id: 'image',
    name: 'Visual & Procedural Canvas Synthesis',
    category: 'visual',
    desc: 'High-contrast procedural studio frames, architectural concepts, storyboard compositions, and PNG exports with embedded AI provenance.',
    status: 'available',
    icon: Layout,
    prompt: 'Generate an aesthetic architectural render of an obsidian monolith sanctuary with crimson horizon light.',
    outputFormat: 'PNG (with Provenance) · Multi-Aspect Ratio',
  },
  {
    id: 'code',
    name: 'React, TypeScript & GLSL Code',
    category: 'code',
    desc: 'Production-ready React components, interactive 60fps WebGL fragment shaders, and full-stack logic.',
    status: 'available',
    icon: Code,
    prompt: 'Write a 60fps kinetic typography ribbon component in React and TypeScript.',
    outputFormat: 'TypeScript · TSX · GLSL Shaders',
  },
  {
    id: 'presentation',
    name: 'Executive Presentation Builder',
    category: 'writing',
    desc: 'Structured pitch decks, technical architecture reviews, and keynote slide outlines.',
    status: 'available',
    icon: Presentation,
    prompt: 'Create a 6-slide presentation outline for our AI creative workspace product launch.',
    outputFormat: 'Slide Deck Outline · Speaker Notes',
  },
  {
    id: 'research',
    name: 'Grounded Live Web Research',
    category: 'research',
    desc: 'Real-time search grounding with verified primary sources and zero fabricated citations.',
    status: 'available',
    icon: Search,
    prompt: 'Research recent breakthroughs in solid-state battery energy density with verified sources.',
    outputFormat: 'Verified Citations · Synthesis Brief',
  },
  {
    id: 'analyze',
    name: 'Multimodal File & Code Audit',
    category: 'research',
    desc: 'Deep inspection of uploaded PDFs, CSV datasets, images, and architectural codebases.',
    status: 'available',
    icon: Sliders,
    prompt: 'Analyze this system architecture and identify opportunities to improve latency and accessibility.',
    outputFormat: 'Diagnostic Report · Data Tables',
  },
  {
    id: 'video',
    name: 'Temporal Video & Scene Synthesis',
    category: 'visual',
    desc: 'Multi-camera spatial blocking, scene segmentation, and continuous temporal motion rendering.',
    status: 'coming_soon',
    icon: Video,
    prompt: 'Render temporal motion scenes with locked camera trajectories.',
    outputFormat: '4K DCI · 60fps Spline Conditioning',
  },
];

export const ToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ToolCategoryFilter>('all');
  const [stagingNotice, setStagingNotice] = useState<string | null>(null);

  const filteredTools =
    activeFilter === 'all'
      ? TOOLS_LIST
      : TOOLS_LIST.filter((t) => t.category === activeFilter);

  const handleLaunchTool = (tool: CreativeToolItem) => {
    if (tool.status === 'coming_soon') {
      setStagingNotice(
        `${tool.name} is currently in staging on the Studio Roadmap. Redirecting you to inspect the interactive prototype...`
      );
      setTimeout(() => {
        setStagingNotice(null);
      }, 4000);
      return;
    }
    sessionStorage.setItem('vizra_initial_prompt', tool.prompt);
    navigate('/ai');
  };

  return (
    <PageLayout
      title="AI Tools & Create Hub — Vizra AI Creative Studio"
      description="Launch 8 specialized AI creative tools in Omnia 1.0 for scriptwriting, design systems, visual synthesis, React and GLSL shaders, presentations, and research."
      canonicalPath="/tools"
    >
      {/* Staging Toast Notice */}
      <AnimatePresence>
        {stagingNotice && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#141414] border border-white/[0.15] shadow-2xl text-xs text-white flex items-center gap-3"
          >
            <span className="text-[#EB3B2D] font-mono uppercase">Staging</span>
            <span>{stagingNotice}</span>
            <Link
              to="/studio?section=roadmap"
              className="text-[#EB3B2D] hover:underline font-medium whitespace-nowrap"
            >
              View Roadmap →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <section className="pt-28 md:pt-36 pb-14 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-3xl space-y-4">
            <div className="typo-eyebrow">Create Hub · Specialized Disciplines</div>
            <h1 className="typo-page-title">
              One intelligence. Every creative discipline.
            </h1>
            <p className="typo-body-lg">
              Select any specialized tool below to pre-configure Omnia 1.0 with the appropriate model routing, output schema, and workspace controls.
            </p>
          </div>

          {/* Interactive Discipline Filter Bar */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-[#111111] border border-white/[0.08] self-start">
            {[
              { id: 'all' as const, label: 'All Tools (8)' },
              { id: 'writing' as const, label: 'Writing & Decks' },
              { id: 'visual' as const, label: 'Visual & Design' },
              { id: 'code' as const, label: 'Code & Shaders' },
              { id: 'research' as const, label: 'Research & Audit' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-white text-black font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 01: Create Hub Interactive Tool Grid */}
      <section className="py-16 md:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="p-6 rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-[#DC2626]/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-[#171717] border border-white/[0.08] text-[#EB3B2D]">
                      <Icon size={18} />
                    </div>
                    <span
                      className={`text-[11px] font-mono ${
                        tool.status === 'available'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {tool.status === 'available' ? 'Live in Omnia' : 'In Staging'}
                    </span>
                  </div>

                  <h2 className="typo-card-title mb-2 group-hover:text-[#EB3B2D] transition-colors">
                    {tool.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-4">
                    {tool.desc}
                  </p>

                  <div className="p-3 rounded-xl bg-[#090909] border border-white/[0.06] mb-5">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                      Starter Prompt
                    </span>
                    <p className="text-xs text-neutral-300 font-mono line-clamp-2">
                      “{tool.prompt}”
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-neutral-500 truncate">
                    {tool.outputFormat}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchTool(tool)}
                    className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-[#DC2626] text-white text-xs font-display font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{tool.status === 'available' ? 'Launch' : 'Preview'}</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 02: Omnia 1.0 Studio Workspace Architecture */}
      <section className="py-20 md:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="typo-eyebrow">Workspace Interface</div>
          <h2 className="typo-section-title">The Omnia 1.0 Studio Workspace</h2>
          <p className="typo-body">
            A cohesive creative environment housing your searchable threads, multimodal attachments, Lyria 3 music studio, and 10-stage project context drawer.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
              {[
                {
                  title: 'Searchable Thread History',
                  desc: 'Organized conversations with instant markdown export and archiving.',
                },
                {
                  title: 'Omnia 1.0 Mode Selector',
                  desc: 'Switch seamlessly between Quick, Think, Research, Image, and Music synthesis.',
                },
                {
                  title: 'Multimodal Attachment Engine',
                  desc: 'Upload local PDFs, CSVs, images, and code files directly into the prompt bar.',
                },
                {
                  title: 'Project Context Drawer',
                  desc: 'Persistent memory holding files, research citations, and 10-stage milestones.',
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="p-4 rounded-xl bg-[#090909] border border-white/[0.06]"
                >
                  <h3 className="font-display text-sm font-semibold text-white mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-8 rounded-xl bg-[#090909] border border-white/[0.08] p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 pb-3 border-b border-white/[0.06]">
                  <span className="font-mono">Omnia 1.0 Active Session</span>
                  <span className="font-mono text-[#EB3B2D]">Multimodal Core Ready</span>
                </div>
                <div className="p-5 rounded-xl bg-[#111111] border border-white/[0.06] text-xs sm:text-sm text-neutral-200 leading-relaxed">
                  “Hey! I can answer questions across science, history, coding, and general knowledge, synthesize visual concepts, or help you build 10-stage creative projects whenever you're ready. What are you working on today?”
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.08] space-y-3">
                <div className="text-xs text-neutral-400 font-mono">
                  Ask anything, attach files, or launch a specialized creation mode…
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                    <span>Attach Files</span>
                    <span aria-hidden="true">·</span>
                    <span>Web Grounding</span>
                    <span aria-hidden="true">·</span>
                    <span>Project Memory</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Link
                      to="/workspace"
                      className="px-3.5 py-2 rounded-lg bg-[#1c1c1c] hover:bg-neutral-800 text-neutral-200 text-xs font-medium transition-colors"
                    >
                      Dashboard Console
                    </Link>
                    <button
                      type="button"
                      onClick={() => navigate('/ai')}
                      className="px-4 py-2 rounded-lg bg-white text-black font-display font-semibold text-xs hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Omnia AI</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Ecosystem & Integrations */}
      <section
        id="integrations"
        className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]"
      >
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="typo-eyebrow">Ecosystem & Connectors</div>
          <h2 className="typo-section-title">Connect Your Workflow Tools</h2>
          <p className="typo-body">
            Clear separation between capabilities that are live in production today and third-party workspace connectors currently in staging.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Now */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <h3 className="typo-card-title">Available Now in Production</h3>
              <span className="text-xs font-mono text-emerald-400">Live</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: 'Local Multimodal File Ingestion',
                  desc: 'Instant parsing for PDF, DOC, TXT, CSV, TypeScript/JS code, and high-res images.',
                },
                {
                  name: 'Live Google Search Grounding',
                  desc: 'Real-time factual synthesis with verified HTTPS source citations.',
                },
                {
                  name: 'Interactive 60fps WebGL & Shader Canvas',
                  desc: 'Procedural animations, D3 usage telemetry charts, and GLSL code synthesis.',
                },
                {
                  name: 'Full-Stack Code & Markdown Export',
                  desc: 'Clean TypeScript, React, Tailwind CSS, and structured document exports.',
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="p-4 rounded-xl bg-[#090909] border border-white/[0.06] flex items-start gap-3"
                >
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-display text-sm font-semibold text-white block">
                      {item.name}
                    </strong>
                    <span className="text-xs text-neutral-400 leading-relaxed">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon Connectors */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <h3 className="typo-card-title">Third-Party Connectors in Staging</h3>
                <span className="text-xs font-mono text-[#EB3B2D]">Roadmap</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Google Drive', icon: HardDrive },
                  { name: 'Google Docs', icon: FileText },
                  { name: 'Google Sheets', icon: FileSpreadsheet },
                  { name: 'GitHub Repos', icon: Github },
                  { name: 'Figma Tokens', icon: Figma },
                  { name: 'Canva Studio', icon: Palette },
                  { name: 'YouTube Transcripts', icon: Youtube },
                  { name: 'Notion Pages', icon: FileCheck },
                  { name: 'Dropbox Sync', icon: HardDrive },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.06] text-center space-y-1.5"
                    >
                      <Icon size={17} className="text-neutral-400 mx-auto" />
                      <div className="text-xs font-medium text-neutral-200 truncate">
                        {item.name}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 block">
                        In Staging
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
              <span>Want priority access to external workspace connectors?</span>
              <Link
                to="/contact"
                className="text-white hover:text-[#EB3B2D] font-medium inline-flex items-center gap-1"
              >
                <span>Request Beta Access</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
