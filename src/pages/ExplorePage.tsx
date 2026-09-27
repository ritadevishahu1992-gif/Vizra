import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Code,
  Layers,
  Film,
  Search,
  CheckCircle2,
  Clock,
  Zap,
  ChevronRight,
  Globe,
  Sliders,
  Terminal,
  ExternalLink,
  MessageSquare,
  FileCheck,
  Video,
  FileText,
  Palette,
  Layout,
  Presentation,
  Check,
  FolderGit2,
  HardDrive,
  FileSpreadsheet,
  Github,
  Figma,
  Youtube,
  Cpu,
  Brain,
  Layers3,
  HelpCircle,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { VizraLogo } from '../components/VizraLogo';
import { Footer } from '../components/Footer';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState<'ask' | 'create' | 'build'>('ask');
  const [copiedDemo, setCopiedDemo] = useState(false);
  const [selectedCreateCategory, setSelectedCreateCategory] = useState<string | null>(null);
  const [comingSoonToast, setComingSoonToast] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLaunchWithPrompt = (prompt: string) => {
    sessionStorage.setItem('vizra_initial_prompt', prompt);
    navigate('/ai');
  };

  const handleCreateSelect = (cat: { id: string; name: string; status: 'available' | 'coming_soon'; prompt: string }) => {
    if (cat.status === 'coming_soon') {
      setComingSoonToast(`${cat.name} engine is currently in staging and coming in an upcoming release.`);
      setTimeout(() => setComingSoonToast(null), 3200);
      return;
    }
    handleLaunchWithPrompt(cat.prompt);
  };

  return (
    <div className="min-h-screen bg-black text-white font-inter selection:bg-[#eb3b2d] selection:text-white relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] opacity-15 blur-[160px]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(235,59,45,0.45) 0%, rgba(20,20,20,0.1) 65%, transparent 100%)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Floating Toast Notice */}
      <AnimatePresence>
        {comingSoonToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-neutral-900 border border-neutral-700 shadow-2xl text-xs text-white flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
            <span>{comingSoonToast}</span>
            <span className="text-[10px] font-mono uppercase text-[#eb3b2d] bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
              Coming Soon
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-xl border-b border-neutral-900/90 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] rounded-sm"
              title="Vizra Home"
            >
              <VizraLogo size={22} />
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white transition-opacity group-hover:opacity-90">
                  Vizra
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                  Overview
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-neutral-400">
              <a href="#what-is-vizra" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/[0.04] transition-colors">
                What is Vizra
              </a>
              <a href="#meet-omnia" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/[0.04] transition-colors">
                Omnia 1.0
              </a>
              <a href="#the-difference" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/[0.04] transition-colors">
                The Difference
              </a>
              <a href="#interactive-demo" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/[0.04] transition-colors">
                Live Demos
              </a>
              <a href="#create-hub" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/[0.04] transition-colors">
                Create Hub
              </a>
              <a href="#project-workspace" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/[0.04] transition-colors">
                Project Context
              </a>
              <a href="#integrations" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/[0.04] transition-colors">
                Integrations
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-neutral-400 hover:text-white transition-colors hidden sm:inline px-3 py-1.5">
              Home
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/ai')}
              className="relative px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-white text-black hover:bg-neutral-100 transition-all duration-200 shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Try Omnia</span>
              <ArrowUpRight size={13} className="text-black" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 pt-24 md:pt-32">
        {/* ================================================== */}
        {/* SECTION 01 — HERO                                  */}
        {/* ================================================== */}
        <section className="relative px-6 md:px-12 max-w-6xl mx-auto pt-8 pb-20 md:pb-28 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-400 mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-pulse" />
              <span className="text-neutral-300">VIZRA PLATFORM OVERVIEW</span>
              <span className="text-neutral-600">·</span>
              <span className="text-[#eb3b2d]">OMNIA 1.0</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl tracking-[-2px] font-medium leading-[1.05] text-white mb-6"
            >
              Meet Vizra.
              <br />
              <span className="font-instrument-serif italic font-normal text-neutral-200">
                An intelligent creative workspace powered by Omnia 1.0.
              </span>
            </motion.h1>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl mx-auto mb-10"
            >
              Vizra brings intelligence, creativity and workflow into one place — helping you move
              from an idea to something real.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/ai')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black font-semibold text-base hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5 cursor-pointer"
              >
                <span>Try Omnia</span>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/10 text-black">
                  <ArrowUpRight size={13} />
                </span>
              </motion.button>

              <a
                href="#what-is-vizra"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium text-base hover:text-white hover:border-neutral-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>See How It Works</span>
                <ChevronRight size={15} className="rotate-90 text-neutral-500" />
              </a>
            </motion.div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 02 — WHAT IS VIZRA?                        */}
        {/* ================================================== */}
        <section
          id="what-is-vizra"
          className="py-24 md:py-32 px-6 md:px-12 max-w-6xl mx-auto border-t border-neutral-900"
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Core Purpose</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
              What is Vizra?
            </h2>
            <p className="text-lg md:text-xl text-neutral-300 font-normal leading-relaxed">
              Vizra brings intelligence, creativity and workflow into one place — helping you move
              from an idea to something real.
            </p>
          </div>

          {/* 4 Pillars: THINK, CREATE, BUILD, EXPLORE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'THINK',
                subtitle: 'Conversational Reasoning',
                desc: 'Ask general knowledge questions, brainstorm ideas, analyze concepts, or talk naturally in English, Hindi, or Hinglish.',
                icon: Brain,
              },
              {
                label: 'CREATE',
                subtitle: 'Generative Synthesis',
                desc: 'Draft scripts, generate visual concepts, write clean React code, synthesize GLSL shaders, or create presentation slides.',
                icon: Sparkles,
              },
              {
                label: 'BUILD',
                subtitle: 'Project Architecture',
                desc: 'Turn loose thoughts into 10-stage milestones with tasks, files, research notes, and persistent context memory.',
                icon: Layers,
              },
              {
                label: 'EXPLORE',
                subtitle: 'Verifiable Grounding',
                desc: 'Live real-time search with authenticated citations, cross-verified sources, and unbiased fact analysis without fake links.',
                icon: Globe,
              },
            ].map((col) => {
              const Icon = col.icon;
              return (
                <div
                  key={col.label}
                  className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-[#eb3b2d]">
                        {col.label}
                      </span>
                      <Icon size={18} className="text-neutral-500" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1.5">{col.subtitle}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">{col.desc}</p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-neutral-900 text-[11px] font-mono text-neutral-600">
                    Omnia 1.0 Native
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 03 — MEET OMNIA 1.0                        */}
        {/* ================================================== */}
        <section
          id="meet-omnia"
          className="py-24 md:py-32 px-6 md:px-12 max-w-6xl mx-auto border-t border-neutral-900 bg-neutral-950/40"
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>The Brain Behind Vizra</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-4">
              Meet Omnia 1.0
            </h2>
            <p className="text-neutral-300 text-lg">
              Intelligence behind Vizra.
            </p>
            <p className="text-neutral-400 text-sm mt-2 max-w-xl mx-auto">
              Omnia is engineered to understand diverse intents accurately before taking action.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
            {[
              { title: 'Questions', desc: 'Direct, concise factual answers.' },
              { title: 'Conversations', desc: 'Natural dialogue without robotic essays.' },
              { title: 'Context', desc: 'Remembers project files, notes & decisions.' },
              { title: 'Files', desc: 'Reads PDFs, images, data spreadsheets & code.' },
              { title: 'Creative Tasks', desc: 'Crafts scripts, visual prompts & slide copy.' },
              { title: 'Research', desc: 'Verified live search with authentic links.' },
              { title: 'Code', desc: 'Generates TypeScript, React & GLSL shaders.' },
              { title: 'Projects', desc: 'Orchestrates multi-phase workflows.' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                  <Check size={12} className="text-[#eb3b2d]" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/ai')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-100 transition-all cursor-pointer shadow-lg"
            >
              <span>Talk to Omnia</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 04 — THE DIFFERENCE (VISUAL PIPELINE)      */}
        {/* ================================================== */}
        <section
          id="the-difference"
          className="py-24 md:py-32 px-6 md:px-12 max-w-6xl mx-auto border-t border-neutral-900"
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Product Architecture</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
              Your work shouldn&apos;t start from zero every time.
            </h2>
            <p className="text-neutral-400 text-sm md:text-base">
              A unified pipeline that carries momentum from mental intuition to final deliverables.
            </p>
          </div>

          {/* Visual: IDEA -> CONTEXT -> CREATION -> PROJECT -> RESULT */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto bg-neutral-950 p-6 md:p-8 rounded-2xl border border-neutral-800/80">
            {[
              { step: '01', title: 'IDEA', desc: 'Raw prompt or spark' },
              { step: '02', title: 'CONTEXT', desc: 'Shared project memory' },
              { step: '03', title: 'CREATION', desc: 'Direct asset synthesis' },
              { step: '04', title: 'PROJECT', desc: 'Multi-stage milestones' },
              { step: '05', title: 'RESULT', desc: 'Exportable production work' },
            ].map((node, i, arr) => (
              <React.Fragment key={node.title}>
                <div className="flex-1 w-full p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center">
                  <span className="text-[10px] font-mono text-[#eb3b2d] block mb-1">{node.step}</span>
                  <h4 className="text-base font-bold text-white mb-1">{node.title}</h4>
                  <p className="text-xs text-neutral-400">{node.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="text-neutral-600 font-mono text-xs hidden md:block">↓</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 05 — REALISTIC INTERACTIVE DEMO            */}
        {/* ================================================== */}
        <section
          id="interactive-demo"
          className="py-24 md:py-32 px-6 md:px-12 max-w-6xl mx-auto border-t border-neutral-900 bg-neutral-950/30"
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Realistic Demonstrations</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
              See Omnia in Action
            </h2>
            <p className="text-neutral-400 text-sm md:text-base">
              Test how Omnia behaves across General Intelligence, Creative Generation, and Workflow Planning.
            </p>
          </div>

          {/* Demo Category Switcher Tabs */}
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto mb-8 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveDemo('ask')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeDemo === 'ask'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              1. ASK OMNIA
            </button>
            <button
              onClick={() => setActiveDemo('create')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeDemo === 'create'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              2. CREATE WITH OMNIA
            </button>
            <button
              onClick={() => setActiveDemo('build')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeDemo === 'build'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              3. BUILD WITH OMNIA
            </button>
          </div>

          {/* Interactive Demo Card */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
            {/* Window Top Bar */}
            <div className="px-5 py-3 border-b border-neutral-900 bg-black/60 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                </div>
                <span className="font-mono text-neutral-300 text-[11px]">
                  omnia_interactive_showcase // {activeDemo}.demo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[#eb3b2d]">
                  {activeDemo === 'ask' && 'INTENT: QUESTION (GENERAL AI)'}
                  {activeDemo === 'create' && 'INTENT: CREATE (SYNTHESIS)'}
                  {activeDemo === 'build' && 'INTENT: PROJECT (WORKFLOW)'}
                </span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* User Message */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-[11px] font-semibold text-neutral-300 shrink-0">
                  U
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-medium text-white">
                  {activeDemo === 'ask' && 'Explain black holes simply.'}
                  {activeDemo === 'create' && 'Create a science exhibition poster concept.'}
                  {activeDemo === 'build' && 'Plan my portfolio website.'}
                </div>
              </div>

              {/* Omnia Assistant Response */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#eb3b2d]/10 border border-[#eb3b2d]/40 flex items-center justify-center text-[#eb3b2d] shrink-0">
                  <VizraLogo size={14} />
                </div>
                <div className="flex-1 space-y-4">
                  {activeDemo === 'ask' && (
                    <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-sm text-neutral-200 leading-relaxed space-y-3">
                      <p>
                        A black hole is a region in space where gravity is so strong that nothing—not even light—can escape.
                      </p>
                      <p className="text-xs text-neutral-400">
                        It forms when a massive star exhausts its nuclear fuel and collapses in on itself under its own weight, compressing astronomical mass into an infinitely dense point called a <strong>singularity</strong>, encircled by the <strong>event horizon</strong>.
                      </p>
                      <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-neutral-500">
                        <CheckCircle2 size={13} className="text-[#eb3b2d]" />
                        <span>Direct factual answer · No unrequested project setup</span>
                      </div>
                    </div>
                  )}

                  {activeDemo === 'create' && (
                    <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-sm text-neutral-200 space-y-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#eb3b2d] tracking-wider">Concept Blueprint</span>
                        <h4 className="text-base font-semibold text-white mt-0.5">“Cosmic Horizons: The Physics of Tomorrow”</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-black/60 border border-neutral-900 space-y-1">
                          <strong className="text-white block">Visual Direction</strong>
                          <p className="text-neutral-400">Deep obsidian background with a central refraction prism splitting crimson laser vectors.</p>
                        </div>
                        <div className="p-3 rounded-lg bg-black/60 border border-neutral-900 space-y-1">
                          <strong className="text-white block">Typography System</strong>
                          <p className="text-neutral-400">Instrument Serif bold italic header paired with high-contrast mono metadata tracks.</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-black/60 border border-neutral-900 text-xs space-y-1">
                        <strong className="text-white block">Key Zones</strong>
                        <p className="text-neutral-400">1. Interactive Quantum Physics Hub · 2. Space Robotics Pavilion · 3. Student Keynote Stage.</p>
                      </div>
                    </div>
                  )}

                  {activeDemo === 'build' && (
                    <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-xs text-neutral-200 space-y-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#eb3b2d] tracking-wider">Project Architecture</span>
                        <h4 className="text-base font-semibold text-white mt-0.5">Editorial Motion & Creative Dev Portfolio</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-black/60 border border-neutral-900 space-y-1">
                          <strong className="text-white text-xs block">Goal</strong>
                          <p className="text-neutral-400 text-[11px]">Showcase 60fps kinetic motion & clean full-stack code with sub-second load times.</p>
                        </div>
                        <div className="p-3 rounded-lg bg-black/60 border border-neutral-900 space-y-1">
                          <strong className="text-white text-xs block">Pages</strong>
                          <p className="text-neutral-400 text-[11px]">/ (Hero + Feed), /work/:slug (Deep dive), /shaders (Playground), /contact.</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-black/60 border border-neutral-900 space-y-2">
                        <strong className="text-white text-xs block">5-Stage Execution Plan</strong>
                        <div className="space-y-1 text-[11px] font-mono text-neutral-400">
                          <div>Stage 01: Typography system & obsidian color tokens</div>
                          <div>Stage 02: Procedural kinetic ribbon hero canvas</div>
                          <div>Stage 03: Case study CMS schema & video embeds</div>
                          <div>Stage 04: Interactive WebGL shader playground</div>
                          <div>Stage 05: Performance audit & 60fps optimization</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-mono text-neutral-500">
                      {activeDemo === 'ask' && 'Purpose: Demonstrate general intelligence.'}
                      {activeDemo === 'create' && 'Purpose: Demonstrate creative synthesis.'}
                      {activeDemo === 'build' && 'Purpose: Demonstrate workflow intelligence.'}
                    </span>

                    <button
                      onClick={() =>
                        handleLaunchWithPrompt(
                          activeDemo === 'ask'
                            ? 'Explain black holes simply.'
                            : activeDemo === 'create'
                            ? 'Create a science exhibition poster concept.'
                            : 'Plan my portfolio website.'
                        )
                      }
                      className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open in Omnia</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 06 — OMNIA WORKSPACE PREVIEW               */}
        {/* ================================================== */}
        <section className="py-24 md:py-32 px-6 md:px-12 max-w-6xl mx-auto border-t border-neutral-900">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Workspace UI Preview</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
              The Omnia 1.0 Studio Workspace
            </h2>
            <p className="text-neutral-400 text-sm md:text-base">
              A single cohesive environment housing your conversations, multimodal inputs, project context, and creative tools.
            </p>
          </div>

          <div className="max-w-5xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 md:p-8 shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: UI Features */}
              <div className="md:col-span-4 space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="font-semibold text-white mb-1">Sidebar & History</div>
                  <p className="text-neutral-400">Searchable threads organized by date with one-click export and archiving.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="font-semibold text-white mb-1">Omnia 1.0 Selector</div>
                  <p className="text-neutral-400">Server-side neural core with zero-hallucination web research and grounded citations.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="font-semibold text-white mb-1">+ Button & Context</div>
                  <p className="text-neutral-400">Attach local files, connect external workflows, or trigger presentation and doc builders.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="font-semibold text-white mb-1">Project Context Drawer</div>
                  <p className="text-neutral-400">Unified memory holding files, research, notes, and milestones for persistent work.</p>
                </div>
              </div>

              {/* Right Column: Visual Mockup of Composer */}
              <div className="md:col-span-8 bg-black/60 rounded-xl border border-neutral-800 p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-500 pb-2 border-b border-neutral-900">
                    <span className="font-mono">omnia_workspace // active_thread</span>
                    <span className="text-[#eb3b2d] font-mono">60 FPS ENGINE READY</span>
                  </div>

                  <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800/80 text-xs font-mono text-neutral-300">
                    &ldquo;Hey! I can answer questions across science, history, coding, and general knowledge, explain complex concepts, or help you build creative projects whenever you&apos;re ready. What are you working on today?&rdquo;
                  </div>
                </div>

                {/* Simulated Prompt Composer */}
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <div className="text-xs text-neutral-400 font-mono">
                    Ask anything, upload assets, or type &ldquo;Create a project&rdquo;...
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-neutral-800 text-[#eb3b2d] font-bold text-xs">+</span>
                      <span className="text-[11px] font-mono text-neutral-500">Attach · Connect · Create</span>
                    </div>
                    <button
                      onClick={() => navigate('/ai')}
                      className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Omnia</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 07 — CREATE HUB                            */}
        {/* ================================================== */}
        <section
          id="create-hub"
          className="py-24 md:py-32 px-6 md:px-12 max-w-6xl mx-auto border-t border-neutral-900 bg-neutral-950/40"
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Create Hub</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-3">
              One intelligence. Many ways to create.
            </h2>
            <p className="text-neutral-400 text-sm md:text-base">
              Everything flows through Omnia. Tap any discipline to start directly in the workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              {
                id: 'write',
                name: 'WRITE',
                desc: 'Scripts, manifestos, copy & narrative treatments',
                status: 'available' as const,
                icon: FileText,
                prompt: 'Write a compelling cinematic script for a short motion reel about obsidian minimalism.',
              },
              {
                id: 'design',
                name: 'DESIGN',
                desc: 'Visual tokens, color grading & layout systems',
                status: 'available' as const,
                icon: Palette,
                prompt: 'Design a clean dark-mode visual identity palette with crimson accent tokens.',
              },
              {
                id: 'image',
                name: 'IMAGE',
                desc: 'Diffusion concepts, texture maps & aesthetic framing',
                status: 'available' as const,
                icon: Layout,
                prompt: 'Generate an aesthetic image prompt for obsidian fluid refraction ribbons.',
              },
              {
                id: 'video',
                name: 'VIDEO',
                desc: 'Scene segmentation & temporal motion rendering',
                status: 'coming_soon' as const,
                icon: Video,
                prompt: 'Render temporal motion scenes.',
              },
              {
                id: 'code',
                name: 'CODE',
                desc: 'React components, WebGL shaders & TypeScript logic',
                status: 'available' as const,
                icon: Code,
                prompt: 'Write a 60fps kinetic typography ribbon component in React and TypeScript.',
              },
              {
                id: 'presentation',
                name: 'PRESENTATION',
                desc: 'Executive pitch decks & structured slide outlines',
                status: 'available' as const,
                icon: Presentation,
                prompt: 'Create a 6-slide presentation outline for our AI creative workspace product launch.',
              },
              {
                id: 'research',
                name: 'RESEARCH',
                desc: 'Grounded live search & verified citations',
                status: 'available' as const,
                icon: Search,
                prompt: 'Research recent breakthroughs in solid-state battery energy density with verified sources.',
              },
              {
                id: 'analyze',
                name: 'ANALYZE',
                desc: 'File inspection, data tables & code audits',
                status: 'available' as const,
                icon: Sliders,
                prompt: 'Analyze this architecture and identify areas to streamline performance.',
              },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCreateSelect(cat)}
                  className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Icon size={18} className="text-[#eb3b2d]" />
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          cat.status === 'available'
                            ? 'bg-neutral-900 text-neutral-400'
                            : 'bg-[#eb3b2d]/10 text-[#eb3b2d]'
                        }`}
                      >
                        {cat.status === 'available' ? 'LAUNCH' : 'COMING SOON'}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1 group-hover:text-[#eb3b2d] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-snug">{cat.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-900 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                    <span>{cat.status === 'available' ? 'Open in Omnia' : 'In Staging'}</span>
                    {cat.status === 'available' && <ArrowUpRight size={12} />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 08 — PROJECT WORKSPACE                     */}
        {/* ================================================== */}
        <section
          id="project-workspace"
          className="py-24 md:py-32 px-6 md:px-12 max-w-6xl mx-auto border-t border-neutral-900"
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Project Context Concept</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
              Keep the whole idea together.
            </h2>
            <p className="text-neutral-400 text-sm md:text-base">
              A project in Vizra is not just a chat thread. It unites conversation, files, research, notes, and outputs under a single intelligence.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 md:p-8 space-y-6">
            {/* Example Case: Smart Medicine Dispenser */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-900">
              <div>
                <span className="text-[10px] font-mono text-[#eb3b2d] uppercase">Active Project Context</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Smart Medicine Dispenser</h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                Category: Engineering & IoT
              </span>
            </div>

            {/* Context Elements Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              {[
                { label: 'Conversations', count: '4 Threads', active: true },
                { label: 'Files', count: '2 PDFs, 1 CSV', active: true },
                { label: 'Research', count: '6 Grounded Citations', active: true },
                { label: 'Notes', count: 'Hardware Specs', active: true },
                { label: 'Content', count: 'Poster & Script', active: true },
                { label: 'Outputs', count: 'PPT Outline', active: true },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-center">
                  <div className="text-[11px] font-medium text-white mb-1">{item.label}</div>
                  <div className="text-[10px] font-mono text-neutral-400">{item.count}</div>
                </div>
              ))}
            </div>

            {/* Conversation Callout */}
            <div className="p-4 rounded-xl bg-black/60 border border-neutral-900 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="font-semibold text-white">User:</span>
                <span>&ldquo;Make the PPT.&rdquo;</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-300 pt-2 border-t border-neutral-900">
                <span className="font-semibold text-[#eb3b2d] shrink-0">Omnia:</span>
                <span className="leading-relaxed">
                  &ldquo;Creating the presentation outline for the <strong>Smart Medicine Dispenser</strong> project based on your existing hardware specs, dispensing schedules, and mobile companion app architecture...&rdquo;
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2">
              <span>Omnia never asks you to re-explain what you already built together.</span>
              <span className="text-neutral-400">Project Memory: Active</span>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 09 — INTEGRATIONS                          */}
        {/* ================================================== */}
        <section
          id="integrations"
          className="py-24 md:py-32 px-6 md:px-12 max-w-6xl mx-auto border-t border-neutral-900 bg-neutral-950/30"
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Ecosystem & Tools</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
              Connect Your Tools
            </h2>
            <p className="text-neutral-400 text-sm md:text-base">
              Only authentic features are presented. Clear separation between what is live and what is coming next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Available Integrations */}
            <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-base font-semibold text-white">AVAILABLE NOW</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                  LIVE
                </span>
              </div>

              <div className="space-y-3 text-xs text-neutral-300">
                {[
                  { name: 'Local File Uploads', desc: 'Instant parsing for PDF, DOC, TXT, CSV, Code, Images' },
                  { name: 'Live Web Grounding', desc: 'Real-time search with authenticated references' },
                  { name: 'Interactive Canvas', desc: '60fps procedural animations & WebGL rendering' },
                  { name: 'Full-Stack Code Export', desc: 'Clean TypeScript, React & Tailwind code generation' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80 flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-xs">{item.name}</strong>
                      <span className="text-neutral-400 text-[11px]">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coming Soon Integrations */}
            <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#eb3b2d]" />
                  <h3 className="text-base font-semibold text-white">COMING SOON</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#eb3b2d]/10 border border-[#eb3b2d]/30 text-[#eb3b2d]">
                  IN STAGING
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                {[
                  { name: 'Google Drive', icon: HardDrive },
                  { name: 'Google Docs', icon: FileText },
                  { name: 'Google Sheets', icon: FileSpreadsheet },
                  { name: 'GitHub', icon: Github },
                  { name: 'Figma', icon: Figma },
                  { name: 'Canva', icon: Palette },
                  { name: 'YouTube', icon: Youtube },
                  { name: 'Notion', icon: FileCheck },
                  { name: 'Dropbox', icon: HardDrive },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/60 text-center space-y-1.5"
                    >
                      <Icon size={16} className="text-neutral-400 mx-auto" />
                      <div className="text-[11px] font-medium text-neutral-300 truncate">{item.name}</div>
                      <span className="text-[9px] font-mono text-[#eb3b2d] block">Coming Soon</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 10 — BUILT FOR                             */}
        {/* ================================================== */}
        <section className="py-24 md:py-32 px-6 md:px-12 max-w-6xl mx-auto border-t border-neutral-900">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Diverse Creators</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
              Built For Anyone with an Idea
            </h2>
            <p className="text-neutral-400 text-sm md:text-base">
              Vizra is not restricted to any single profession. It scales from quick questions to professional digital production.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { role: 'Creators', desc: 'Synthesize motion ideas, aesthetic reels, and creative treatments without getting stuck.' },
              { role: 'Designers', desc: 'Iterate visual tokens, layouts, and procedural color systems with direct prompt control.' },
              { role: 'Developers', desc: 'Generate clean React/TypeScript components, shaders, and bug fixes without bloat.' },
              { role: 'Students', desc: 'Ask complex scientific and academic questions and get crystal-clear direct answers.' },
              { role: 'Writers', desc: 'Brainstorm storylines, scripts, and editorial articles in English, Hindi, or Hinglish.' },
              { role: 'Beginners', desc: 'Turn your first idea into a working reality without needing 5 years of software mastery.' },
            ].map((p, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                <h3 className="text-base font-semibold text-white mb-1.5">{p.role}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 11 — VIZRA PHILOSOPHY                      */}
        {/* ================================================== */}
        <section className="py-28 md:py-36 px-6 md:px-12 max-w-5xl mx-auto text-center border-t border-neutral-900">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Core Creed</span>
            </div>

            <h2 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-white leading-tight">
              “Don&apos;t just ask AI.
              <br />
              <span className="font-instrument-serif italic font-normal text-neutral-200">
                Work with it.”
              </span>
            </h2>

            <div className="pt-6 max-w-xl mx-auto">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300">
                Conversation + Context + Creativity + Workflow = Vizra
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 12 — FUTURE HONESTY                        */}
        {/* ================================================== */}
        <section className="py-20 md:py-28 px-6 md:px-12 max-w-5xl mx-auto border-t border-neutral-900 bg-neutral-950/20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-mono uppercase text-[#eb3b2d] tracking-wider block mb-2">
              Honest Engineering
            </span>
            <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2">Planned Capabilities</h3>
            <p className="text-xs text-neutral-400">
              We never pretend unreleased features are functional. These capabilities are in active development.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-white">Audio Speech Engine</strong>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">Planned</span>
              </div>
              <p className="text-[11px] text-neutral-500">Direct speech-to-text and tone synthesis.</p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-white">Video Understanding</strong>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">In Staging</span>
              </div>
              <p className="text-[11px] text-neutral-500">Scene timestamp indexing and visual search.</p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-white">Multiplayer Canvas</strong>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">Planned</span>
              </div>
              <p className="text-[11px] text-neutral-500">Real-time collaborative editing on projects.</p>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION 13 — FINAL CTA                             */}
        {/* ================================================== */}
        <section className="py-28 md:py-36 px-6 md:px-12 max-w-4xl mx-auto text-center border-t border-neutral-900 relative">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[280px] opacity-20 blur-[130px] pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(235,59,45,0.5) 0%, rgba(20,20,20,0.1) 70%, transparent 100%)',
            }}
          />

          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-white leading-tight">
              “Your next idea starts here.”
            </h2>

            <p className="text-neutral-400 text-sm md:text-base max-w-md mx-auto">
              Launch Omnia 1.0 to ask a question, start a research thread, or build your next project.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/ai')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black font-semibold text-base hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 shadow-2xl cursor-pointer"
              >
                <span>Try Omnia</span>
                <ArrowUpRight size={14} />
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-medium text-sm hover:text-white hover:border-neutral-700 transition-all flex items-center justify-center"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
