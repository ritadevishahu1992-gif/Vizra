import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Cpu,
  Layers,
  Terminal,
  ShieldCheck,
  Copy,
  Check,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

type DocSectionId = 'overview' | 'routing' | 'workflows' | 'api' | 'security';

interface DocSection {
  id: DocSectionId;
  title: string;
  eyebrow: string;
  summary: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  codeTitle?: string;
  codeBlock?: string;
  points: { heading: string; body: string }[];
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: 'overview',
    title: 'Platform Overview & Omnia 1.0',
    eyebrow: '01 · Core Architecture',
    summary:
      'Vizra is an intelligent creative workspace powered by Omnia 1.0. Unlike single-turn chat interfaces, Vizra combines conversational reasoning, multimodal file analysis, grounded web research, and 10-stage project workflows.',
    icon: BookOpen,
    codeTitle: 'omnia-session-config.json',
    codeBlock: `{\n  "platform": "Vizra Creative Studio",\n  "engine": "Omnia 1.0",\n  "modes": ["quick", "think", "research", "image", "music"],\n  "grounding": {\n    "webSearch": true,\n    "requireVerifiedHttps": true,\n    "fabricateSources": false\n  }\n}`,
    points: [
      {
        heading: 'Proportional Response Architecture',
        body: 'Simple questions receive direct, concise conversational answers without unnecessary headings or academic bloat. Complex engineering or creative requests receive structured breakdowns.',
      },
      {
        heading: 'Multilingual Fluency',
        body: 'Omnia 1.0 natively detects and responds in English, Hindi (Devanagari), and conversational Hinglish while preserving technical accuracy.',
      },
    ],
  },
  {
    id: 'routing',
    title: 'Intent Classification & Model Routing',
    eyebrow: '02 · Neural Routing',
    summary:
      'Every prompt submitted to Omnia 1.0 passes through a deterministic and semantic Query Router before model invocation, ensuring zero internal project contamination on general knowledge queries.',
    icon: Cpu,
    codeTitle: 'queryRouter.ts',
    codeBlock: `// Automatic intent classification pipeline\nconst route = classifyUserIntent(prompt, attachments);\n// Routes: GENERAL_KNOWLEDGE | LIVE_RESEARCH | CODE_SYNTHESIS |\n//         IMAGE_UNDERSTANDING | DOCUMENT_ANALYSIS | PROJECT_WORKFLOW`,
    points: [
      {
        heading: 'Cross-Request Context Isolation',
        body: 'General knowledge questions (science, history, mathematics) execute in a clean context window with zero internal project leakage.',
      },
      {
        heading: 'Deterministic Math & Code Validation',
        body: 'Arithmetic expressions and linear equations are verified deterministically, and generated TypeScript/GLSL code passes through syntax balance gates.',
      },
    ],
  },
  {
    id: 'workflows',
    title: '10-Stage Project Workflows & Memory',
    eyebrow: '03 · Project Context',
    summary:
      'When building a multi-part creative or engineering project, Vizra organizes work across a persistent 10-stage pipeline stored in your Workspace Console.',
    icon: Layers,
    codeTitle: 'project-stages.ts',
    codeBlock: `export const VIZRA_PROJECT_STAGES = [\n  "01. Ideation & Concept Brief",\n  "02. Research & Verified Grounding",\n  "03. Visual & Typographic Direction",\n  "04. Technical Architecture",\n  "05. Prototype Synthesis",\n  "06. Multimodal Asset Generation",\n  "07. Timeline & Motion Integration",\n  "08. Quality & Accessibility Audit",\n  "09. Deck & Documentation Export",\n  "10. Production Release"\n];`,
    points: [
      {
        heading: 'Unified Artifact Storage',
        body: 'Each project binds together conversation threads, uploaded PDFs/CSVs, grounded citations, and generated outputs so you never have to re-explain prior decisions.',
      },
      {
        heading: 'Credit Usage Telemetry',
        body: 'Real-time credit consumption is tracked per category (Chat, Image, Music, Research, Video) and visualized in the Workspace D3 Usage Analytics dashboard.',
      },
    ],
  },
  {
    id: 'api',
    title: 'Server-Side API & Developer Console',
    eyebrow: '04 · REST & Streaming Endpoints',
    summary:
      'All AI synthesis and diagnostic operations execute through authenticated, rate-limited Express server endpoints with sliding-window quotas.',
    icon: Terminal,
    codeTitle: 'POST /api/ai/chat',
    codeBlock: `curl -X POST https://vizra.vercel.app/api/ai/chat \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "prompt": "Design a 60fps WebGL particle shader in TypeScript",\n    "mode": "think",\n    "history": []\n  }'`,
    points: [
      {
        heading: 'Input Protection & Payload Limits',
        body: 'Prompts are validated up to 50,000 characters with up to 5 multimodal attachments (15MB max base64 payload) to guarantee predictable latency.',
      },
      {
        heading: 'Live Credit Synchronization',
        body: 'Query GET /api/credits/usage or POST /api/credits/consume to synchronize real-time studio credit balances across header and sidebar indicators.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security, Privacy & SSRF Governance',
    eyebrow: '05 · Defense in Depth',
    summary:
      'Vizra enforces strict server-side security controls across all crawler diagnostics, user sessions, and Firestore document collections.',
    icon: ShieldCheck,
    codeTitle: 'ssrfDefense.ts',
    codeBlock: `// Blocks RFC1918 private subnets, loopback (127.0.0.1, ::1),\n// cloud metadata (169.254.169.254), and non-HTTP(S) schemes.\nvalidatePublicTargetUrl(targetUrl);`,
    points: [
      {
        heading: 'SSRF-Hardened URL Inspection',
        body: 'Any external URL inspected by the SEO Diagnostic suite is validated against private IP ranges, localhost aliases, and cloud metadata endpoints.',
      },
      {
        heading: 'Authenticated Diagnostic Endpoints',
        body: 'Technical crawler and diagnostic routes (/api/diagnostics/*) require valid administrator bearer session tokens and enforce HTTP 401 on unauthenticated requests.',
      },
    ],
  },
];

export const DocsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState<DocSectionId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const requested = (searchParams.get('section') || searchParams.get('topic')) as DocSectionId | null;
    if (requested && DOC_SECTIONS.some((s) => s.id === requested)) {
      setActiveId(requested);
    }
  }, [searchParams]);

  const handleSelectSection = (id: DocSectionId) => {
    setActiveId(id);
    setSearchParams({ section: id });
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const visibleSections = searchQuery.trim()
    ? DOC_SECTIONS.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.points.some(
            (p) =>
              p.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.body.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : DOC_SECTIONS;

  const currentSection =
    visibleSections.find((s) => s.id === activeId) ||
    visibleSections[0] ||
    DOC_SECTIONS[0];

  return (
    <PageLayout
      title="Documentation & API Reference — Vizra AI Creative Studio"
      description="Technical documentation for Vizra and Omnia 1.0: intent routing, 10-stage project workflows, REST API endpoints, and SSRF security governance."
    >
      {/* Page Header */}
      <section className="pt-28 md:pt-36 pb-12 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <div className="typo-eyebrow">Technical Documentation · Omnia 1.0</div>
            <h1 className="typo-page-title">
              Vizra Platform & Architecture Docs
            </h1>
            <p className="typo-body-lg">
              Reference guides for Omnia 1.0 intent routing, 10-stage creative project memory, server-side API endpoints, and security governance.
            </p>
          </div>

          {/* Search Filter Input */}
          <div className="relative w-full lg:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter documentation topics..."
              aria-label="Filter documentation topics"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111111] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-xs text-white placeholder-neutral-500"
            />
          </div>
        </div>
      </section>

      {/* Main Documentation Layout: Sidebar + Content View */}
      <section className="py-14 md:py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-4 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 px-3 pb-2">
              Documentation Modules
            </div>
            {DOC_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isSelected = currentSection.id === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleSelectSection(sec.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[#111111] border-[#DC2626]/60 text-white'
                      : 'bg-transparent border-white/[0.06] text-neutral-400 hover:text-white hover:bg-[#111111]/60'
                  }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 mt-0.5 ${
                      isSelected ? 'text-[#EB3B2D]' : 'text-neutral-500'
                    }`}
                  />
                  <div>
                    <div className="text-[10px] font-mono uppercase text-neutral-500">
                      {sec.eyebrow}
                    </div>
                    <div className="font-display text-sm font-semibold mt-0.5">
                      {sec.title}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-2">
              <Link
                to="/workspace?tab=developer"
                className="w-full px-4 py-3 rounded-xl bg-[#111111] border border-white/[0.08] hover:border-white/[0.2] text-xs font-medium text-neutral-200 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>Open Developer API Console</span>
                <ArrowUpRight size={14} className="text-[#EB3B2D]" />
              </Link>
              <Link
                to="/ai"
                className="w-full px-4 py-3 rounded-xl bg-white text-black font-display font-semibold text-xs hover:bg-neutral-200 flex items-center justify-between transition-colors"
              >
                <span>Test Live in Omnia 1.0</span>
                <ArrowUpRight size={14} className="text-[#DC2626]" />
              </Link>
            </div>
          </aside>

          {/* Right Documentation Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {visibleSections.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#111111] border border-white/[0.08] text-center space-y-3">
                <p className="text-sm text-neutral-300">
                  No documentation modules matched “{searchQuery}”.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <article className="p-6 sm:p-8 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-6">
                <div className="space-y-2 border-b border-white/[0.06] pb-6">
                  <div className="typo-eyebrow">{currentSection.eyebrow}</div>
                  <h2 className="typo-section-title">{currentSection.title}</h2>
                  <p className="typo-body pt-1">{currentSection.summary}</p>
                </div>

                {/* Key Architectural Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentSection.points.map((pt) => (
                    <div
                      key={pt.heading}
                      className="p-5 rounded-xl bg-[#090909] border border-white/[0.06] space-y-2"
                    >
                      <h3 className="typo-card-title text-base">{pt.heading}</h3>
                      <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                        {pt.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Code / Specification Block */}
                {currentSection.codeBlock && (
                  <div className="rounded-xl bg-[#090909] border border-white/[0.08] overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between text-xs font-mono text-neutral-400">
                      <span>{currentSection.codeTitle}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyCode(currentSection.id, currentSection.codeBlock!)
                        }
                        className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white cursor-pointer"
                      >
                        {copiedId === currentSection.id ? (
                          <>
                            <Check size={13} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-5 text-xs font-mono text-neutral-200 overflow-x-auto leading-relaxed">
                      <code>{currentSection.codeBlock}</code>
                    </pre>
                  </div>
                )}
              </article>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
