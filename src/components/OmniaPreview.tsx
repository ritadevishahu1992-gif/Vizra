import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, MotionValue } from 'motion/react';
import {
  Play,
  Pause,
  Layers,
  Sparkles,
  Maximize2,
  Film,
  Cpu,
  RotateCcw,
  Compass,
  MousePointer2,
  Aperture,
  Sliders,
  MessageSquare,
  Check,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { VizraLogo } from './VizraLogo';

export interface OmniaPreviewProps {
  yTransform?: MotionValue<number>;
  onOpenWorkspace?: () => void;
  isDemoMode?: boolean;
  onStopDemo?: () => void;
}

type StudioToolId = 'select' | 'lens' | 'shader' | 'chat';
type PipelineStageId = 'prompt' | 'geometry' | 'temporal';

interface ConversationPreset {
  id: string;
  chipLabel: string;
  userMessage: string;
  aiResponse: string;
  latency: string;
  intensityBoost: number;
  flareEnabled: boolean;
}

const CONVERSATION_PRESETS: ConversationPreset[] = [
  {
    id: 'refraction',
    chipLabel: 'Anamorphic flare',
    userMessage: 'Add subtle crimson lens refraction along the primary curve',
    aiResponse: 'Applied 2.39:1 anamorphic shader pass with crimson falloff.',
    latency: '0.11s',
    intensityBoost: 1.25,
    flareEnabled: true,
  },
  {
    id: 'harmonic',
    chipLabel: 'Harmonic pulse',
    userMessage: 'Increase harmonic wave cadence to match 60fps camera track',
    aiResponse: 'Synchronized spline harmonics to 60Hz temporal keyframe curve.',
    latency: '0.14s',
    intensityBoost: 1.55,
    flareEnabled: false,
  },
  {
    id: 'minimal',
    chipLabel: 'Deep obsidian',
    userMessage: 'Attenuate ambient fill and isolate the primary red filament',
    aiResponse: 'Reduced ambient fill by 40% and isolated core crimson vector.',
    latency: '0.09s',
    intensityBoost: 0.85,
    flareEnabled: true,
  },
];

const STUDIO_TOOLS: {
  id: StudioToolId;
  label: string;
  shortcut: string;
  icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { id: 'select', label: 'Vector Nodes', shortcut: 'V', icon: MousePointer2 },
  { id: 'lens', label: 'Anamorphic Optics', shortcut: 'L', icon: Aperture },
  { id: 'shader', label: 'Shader Harmonics', shortcut: 'S', icon: Sliders },
  { id: 'chat', label: 'Omnia Co-Pilot', shortcut: 'C', icon: MessageSquare },
];

const PIPELINE_STAGES: {
  id: PipelineStageId;
  label: string;
  status: string;
  detail: string;
}[] = [
  {
    id: 'prompt',
    label: 'Input Prompt',
    status: 'OK',
    detail: 'Semantic intent parsed · 12 tokens',
  },
  {
    id: 'geometry',
    label: 'Latent Geometry',
    status: '0.14s',
    detail: 'Bezier spline field · 5 harmonic layers',
  },
  {
    id: 'temporal',
    label: 'Temporal Warp',
    status: '60 FPS',
    detail: 'Zero-jitter optical motion interpolation',
  },
];

export const OmniaPreview: React.FC<OmniaPreviewProps> = ({
  yTransform,
  onOpenWorkspace,
  isDemoMode = false,
  onStopDemo,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<'canvas' | 'nodes' | 'timeline' | 'shaders'>('canvas');
  const [activePreset, setActivePreset] = useState<'ribbon' | 'typography' | 'particles'>('ribbon');
  const [activeTool, setActiveTool] = useState<StudioToolId>('lens');
  const [hoveredTool, setHoveredTool] = useState<StudioToolId | null>(null);
  const [activePipeline, setActivePipeline] = useState<PipelineStageId>('prompt');
  const [showChatBubbles, setShowChatBubbles] = useState(true);
  const [activeConversationIndex, setActiveConversationIndex] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [progress, setProgress] = useState(38);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentConversation = CONVERSATION_PRESETS[activeConversationIndex];

  // Universal keyboard activation helper for Enter and Space keys
  const handleActivateKey = (
    e: React.KeyboardEvent<HTMLElement>,
    action?: () => void
  ) => {
    if (!action) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Handle interactive conversation preset selection with brief synthesis feedback
  const handleSelectConversationPreset = (index: number) => {
    if (index === activeConversationIndex && !isSynthesizing) return;
    setIsSynthesizing(true);
    setActiveConversationIndex(index);
    setTimeout(() => {
      setIsSynthesizing(false);
    }, 320);
  };

  const handleCycleConversationPreset = () => {
    handleSelectConversationPreset(
      (activeConversationIndex + 1) % CONVERSATION_PRESETS.length
    );
  };

  // Handle tool click
  const handleToolClick = (toolId: StudioToolId) => {
    setActiveTool(toolId);
    if (toolId === 'chat') {
      setShowChatBubbles((prev) => !prev);
    }
  };

  // Timeline scrubber keyboard navigation (Enter/Space to toggle play, ArrowLeft/Right to scrub)
  const handleTimelineKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsPlaying((prev) => !prev);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setProgress((prev) => Math.min(100, prev + 5));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setProgress((prev) => Math.max(0, prev - 5));
    }
  };

  // Automated walkthrough when 'Watch Demo' is active
  useEffect(() => {
    if (!isDemoMode) return;
    setIsPlaying(true);
    setShowChatBubbles(true);

    const presets: ('ribbon' | 'typography' | 'particles')[] = ['ribbon', 'typography', 'particles'];
    const tools: StudioToolId[] = ['lens', 'select', 'shader', 'chat'];
    let step = 0;

    const demoInterval = setInterval(() => {
      step += 1;
      setActivePreset(presets[step % presets.length]);
      setActiveTool(tools[step % tools.length]);
      setActiveConversationIndex(step % CONVERSATION_PRESETS.length);
    }, 3200);

    return () => clearInterval(demoInterval);
  }, [isDemoMode]);

  // High-performance procedural generative canvas simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark obsidian clear with subtle trail
      ctx.fillStyle = 'rgba(5, 5, 5, 0.28)';
      ctx.fillRect(0, 0, width, height);

      const intensity =
        currentConversation.intensityBoost * (activeTool === 'shader' ? 1.25 : 1.0);
      const showVectorNodes = activeTool === 'select' || activeTab === 'nodes';
      const showAnamorphicFlare = activeTool === 'lens' || currentConversation.flareEnabled;

      // Optional subtle anamorphic horizontal crimson flare
      if (showAnamorphicFlare) {
        const flareY = height * 0.5 + Math.sin(t * 0.7) * 18;
        const flareGrad = ctx.createLinearGradient(0, flareY, width, flareY);
        flareGrad.addColorStop(0, 'rgba(235, 59, 45, 0)');
        flareGrad.addColorStop(0.3, 'rgba(235, 59, 45, 0.04)');
        flareGrad.addColorStop(0.5, 'rgba(255, 120, 105, 0.11)');
        flareGrad.addColorStop(0.7, 'rgba(235, 59, 45, 0.04)');
        flareGrad.addColorStop(1, 'rgba(235, 59, 45, 0)');
        ctx.fillStyle = flareGrad;
        ctx.fillRect(0, flareY - 18, width, 36);
      }

      if (activePreset === 'ribbon') {
        ctx.lineWidth = activeTool === 'shader' ? 2.0 : 1.6;
        const curvesCount = 5;

        for (let i = 0; i < curvesCount; i++) {
          ctx.beginPath();
          const offset = i * 0.35;
          const isAccent = i === 2;

          ctx.strokeStyle = isAccent
            ? 'rgba(235, 59, 45, 0.88)'
            : `rgba(255, 255, 255, ${0.1 + i * 0.075})`;

          for (let x = 0; x <= width; x += 12) {
            const normalizedX = x / width;
            const wave1 = Math.sin(normalizedX * 4 + t + offset) * (42 * intensity);
            const wave2 = Math.cos(normalizedX * 2.5 - t * 0.8) * (28 * intensity);
            const wave3 = Math.sin((normalizedX + t * 0.1) * 6) * 14;
            const y = height / 2 + wave1 + wave2 + wave3;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Draw laser filament focal particles along the active red wave
        const particleCount = showVectorNodes ? 7 : 4;
        for (let p = 0; p < particleCount; p++) {
          const px = (t * 42 + p * (width / particleCount)) % width;
          const normX = px / width;
          const py =
            height / 2 +
            Math.sin(normX * 4 + t + 0.7) * (42 * intensity) +
            Math.cos(normX * 2.5 - t * 0.8) * (28 * intensity);

          ctx.beginPath();
          ctx.arc(px, py, showVectorNodes ? 3.2 : 2.2, 0, Math.PI * 2);
          ctx.fillStyle = '#EB3B2D';
          ctx.fill();

          if (showVectorNodes) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px - 5, py - 5, 10, 10);
          }
        }
      } else if (activePreset === 'typography') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '500 24px Inter, sans-serif';
        const words = ['OMNIA', '1.0', 'SYNTHESIS', 'KINETIC', 'TEMPORAL'];
        const rowY = height / 2 - 20;

        words.forEach((word, idx) => {
          const shift = Math.sin(t * 1.5 + idx) * (12 * intensity);
          const alpha = 0.25 + Math.abs(Math.cos(t + idx * 0.5)) * 0.7;
          ctx.fillStyle = idx === 1 ? '#EB3B2D' : `rgba(255, 255, 255, ${alpha})`;
          ctx.fillText(word, 80 + idx * 115, rowY + shift);
        });

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 40; x < width; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 40);
          ctx.lineTo(x, height - 40);
          ctx.stroke();
        }
      } else {
        const pCount = 36;
        for (let i = 0; i < pCount; i++) {
          const angle = (i / pCount) * Math.PI * 2 + t * 0.4;
          const radius = (58 + Math.sin(t * 2 + i) * 34) * intensity;
          const cx = width / 2 + Math.cos(angle) * radius * 1.8;
          const cy = height / 2 + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.arc(cx, cy, i % 6 === 0 ? 3 : 1.5, 0, Math.PI * 2);
          ctx.fillStyle = i % 6 === 0 ? '#EB3B2D' : 'rgba(255, 255, 255, 0.6)';
          ctx.fill();
        }
      }

      if (isPlaying) {
        t += 0.024;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, activePreset, activeTool, activeTab, currentConversation]);

  // Scrubbing loop simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.4));
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div
      id="omnia-preview"
      className="relative w-screen aspect-[16/10] md:aspect-[16/9] min-h-[580px] md:min-h-[700px] overflow-hidden"
      style={{ marginLeft: 'calc(-50vw + 50%)' }}
    >
      {/* Background Visual: Transparent ambient halo complementing HeroBackground */}
      <div className="absolute inset-0 bg-transparent pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] rounded-full opacity-15 blur-[130px] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(235,59,45,0.4) 0%, rgba(20,20,20,0.08) 70%, transparent 100%)',
          }}
        />
      </div>

      {/* Main Interface Window Preview: Absolutely Positioned & Centered with Parallax */}
      <motion.div
        style={yTransform ? { y: yTransform } : undefined}
        role="region"
        aria-label="Omnia 1.0 Interactive Studio Preview"
        className={`absolute top-6 md:top-12 left-1/2 -translate-x-1/2 max-w-5xl w-[92%] rounded-2xl border bg-neutral-950/90 shadow-2xl backdrop-blur-xl overflow-hidden z-20 transition-colors duration-300 ${
          isDemoMode ? 'border-[#eb3b2d]/45' : 'border-neutral-800/80 hover:border-neutral-700/80'
        }`}
      >
        {/* Workspace Titlebar */}
        <div className="px-4 py-3 border-b border-neutral-900 bg-black/60 flex items-center justify-between text-xs text-neutral-400 select-none">
          {/* Left: Window Controls & Vizra Omnia Brand Lockup */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 group/dots">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 group-hover/dots:bg-[#eb3b2d]/80 transition-colors duration-150" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 group-hover/dots:bg-neutral-600 transition-colors duration-150" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 group-hover/dots:bg-neutral-500 transition-colors duration-150" />
            </div>
            <div className="h-3.5 w-px bg-neutral-800 mx-1" />
            <div className="flex items-center gap-2">
              <VizraLogo size={16} />
              <span className="text-white font-medium tracking-tight">Omnia 1.0 Studio</span>
              <span className="text-neutral-500 font-mono text-[11px] hidden sm:inline">
                / sequence_01.vzr
              </span>
            </div>
          </div>

          {/* Center: Interactive Tool Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Omnia workspace views"
            className="hidden sm:flex items-center gap-1 bg-neutral-900/60 p-0.5 rounded-lg border border-neutral-800/60"
          >
            {(
              [
                { id: 'canvas', label: 'Canvas', icon: Compass },
                { id: 'nodes', label: 'Flow Nodes', icon: Layers },
                { id: 'timeline', label: 'Temporal Track', icon: Film },
                { id: 'shaders', label: 'Shaders', icon: Cpu },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleActivateKey(e, () => setActiveTab(tab.id))}
                  className={`group flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                    isActive
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon
                    size={12}
                    className={`transition-colors duration-150 ${
                      isActive
                        ? 'text-[#eb3b2d]'
                        : 'text-neutral-500 group-hover:text-[#eb3b2d]/80'
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Interactive AI Status & Launch Action */}
          <div className="flex items-center gap-2.5">
            {isDemoMode && onStopDemo && (
              <button
                type="button"
                onClick={onStopDemo}
                onKeyDown={(e) => handleActivateKey(e, onStopDemo)}
                aria-label="Exit Demo Tour"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eb3b2d]/15 border border-[#eb3b2d]/40 text-[11px] font-mono text-[#eb3b2d] hover:bg-[#eb3b2d]/25 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
              >
                <span>Demo Tour</span>
                <X size={11} />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenWorkspace}
              onKeyDown={(e) => handleActivateKey(e, onOpenWorkspace)}
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 hover:border-[#eb3b2d]/40 text-[11px] font-mono transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
              title="Open live Omnia 1.0 Studio"
            >
              <span className="text-neutral-300 group-hover:text-white transition-colors">
                Omnia Neural Core
              </span>
              <span className="text-neutral-500 hidden md:inline">· 60 FPS</span>
              <ArrowUpRight
                size={11}
                className="text-neutral-500 group-hover:text-[#eb3b2d] transition-colors"
              />
            </button>
            <button
              type="button"
              onClick={onOpenWorkspace}
              onKeyDown={(e) => handleActivateKey(e, onOpenWorkspace)}
              className="text-neutral-400 hover:text-[#eb3b2d] transition-colors p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
              aria-label="Open Full Omnia Workspace"
              title="Launch full Omnia workspace"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Workspace Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[340px] md:min-h-[410px]">
          {/* Left Tool Sidebar (3 cols desktop) */}
          <div className="hidden md:flex md:col-span-3 flex-col justify-between p-4 border-r border-neutral-900 bg-neutral-950/50 text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
                  Creative Mode
                </span>
                <div className="space-y-1" role="group" aria-label="Creative simulation modes">
                  {[
                    { id: 'ribbon', name: 'Procedural Ribbon', desc: 'Fluid 60fps vector physics' },
                    { id: 'typography', name: 'Kinetic Typography', desc: 'Realtime variable type' },
                    { id: 'particles', name: 'Spatial Vortex', desc: 'Neural particle matrix' },
                  ].map((p) => {
                    const isSelected = activePreset === p.id;
                    const selectMode = () =>
                      setActivePreset(p.id as 'ribbon' | 'typography' | 'particles');
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={selectMode}
                        onKeyDown={(e) => handleActivateKey(e, selectMode)}
                        className={`group w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                          isSelected
                            ? 'bg-white/[0.05] border-[#eb3b2d]/45 text-white'
                            : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.025] hover:border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs group-hover:translate-x-0.5 transition-transform duration-150">
                            {p.name}
                          </span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                              isSelected
                                ? 'bg-[#eb3b2d] scale-100'
                                : 'bg-neutral-700 opacity-0 group-hover:opacity-100'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-500 block mt-0.5">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Node Pipeline Preview */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
                  Omnia Pipeline
                </span>
                <div className="space-y-1.5 font-mono text-[11px]" role="group" aria-label="Omnia pipeline stages">
                  {PIPELINE_STAGES.map((stage) => {
                    const isStageActive = activePipeline === stage.id;
                    const selectStage = () => setActivePipeline(stage.id);
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        aria-pressed={isStageActive}
                        onClick={selectStage}
                        onKeyDown={(e) => handleActivateKey(e, selectStage)}
                        className={`group w-full text-left px-2.5 py-1.5 rounded-md border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                          isStageActive
                            ? 'bg-neutral-900/90 border-[#eb3b2d]/35 text-white'
                            : 'bg-neutral-900/40 border-transparent hover:border-neutral-800 hover:bg-neutral-900/70 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="group-hover:text-white transition-colors">
                            {stage.label}
                          </span>
                          <span
                            className={`transition-colors ${
                              isStageActive || stage.status === 'OK'
                                ? 'text-[#eb3b2d]'
                                : 'text-neutral-400 group-hover:text-[#eb3b2d]/80'
                            }`}
                          >
                            {stage.status}
                          </span>
                        </div>
                        {isStageActive && (
                          <span className="block text-[9px] text-neutral-500 mt-0.5 font-sans truncate">
                            {stage.detail}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Left: Studio Metadata */}
            <div className="pt-3 border-t border-neutral-900 text-[11px] text-neutral-500 space-y-1 font-mono">
              <div className="flex justify-between hover:text-neutral-300 transition-colors">
                <span>Model</span>
                <span className="text-neutral-300">Omnia 1.0</span>
              </div>
              <div className="flex justify-between hover:text-neutral-300 transition-colors">
                <span>Optics</span>
                <span className="text-neutral-300">
                  {activeTool === 'lens' ? 'Anamorphic 2.39' : 'Standard 16:9'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Render</span>
                <span className="text-[#eb3b2d]">
                  {isSynthesizing ? 'Updating...' : 'Realtime'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Visual Canvas Area (9 cols desktop) */}
          <div className="col-span-1 md:col-span-9 flex flex-col justify-between bg-black/40 relative">
            {/* Center Live Canvas */}
            <div className="relative flex-1 min-h-[280px] md:min-h-[325px] flex items-center justify-center p-3">
              <canvas
                ref={canvasRef}
                width={720}
                height={320}
                className="w-full h-full max-h-[330px] rounded-lg object-cover bg-neutral-950 border border-neutral-900/70"
              />

              {/* Top-Left Overlay Studio Tag */}
              <div className="absolute top-6 left-6 pointer-events-none flex items-center gap-2 font-mono text-[11px] text-neutral-400">
                <span className="text-[#eb3b2d] font-semibold">OMNIA 1.0</span>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-400 uppercase">
                  {activeTab === 'canvas' ? activePreset : activeTab}
                </span>
              </div>

              {/* Left Floating Interactive Micro-Tool Rail */}
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 p-1.5 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 shadow-lg z-10"
                role="toolbar"
                aria-label="Omnia Canvas Tools"
              >
                {STUDIO_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const isToolActive =
                    tool.id === 'chat' ? showChatBubbles : activeTool === tool.id;
                  const isHovered = hoveredTool === tool.id;

                  return (
                    <div key={tool.id} className="relative flex items-center">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        onMouseEnter={() => setHoveredTool(tool.id)}
                        onMouseLeave={() => setHoveredTool(null)}
                        onFocus={() => setHoveredTool(tool.id)}
                        onBlur={() => setHoveredTool(null)}
                        onClick={() => handleToolClick(tool.id)}
                        onKeyDown={(e) => handleActivateKey(e, () => handleToolClick(tool.id))}
                        aria-label={`${tool.label} (${tool.shortcut})`}
                        aria-pressed={isToolActive}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                          isToolActive
                            ? 'bg-[#eb3b2d]/15 text-[#eb3b2d] border border-[#eb3b2d]/45'
                            : 'text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                        }`}
                      >
                        <Icon size={14} />
                      </motion.button>

                      {/* Minimalist Hover / Focus Tooltip */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-10 px-2.5 py-1 rounded-md bg-neutral-900/95 border border-neutral-800 text-[11px] text-white whitespace-nowrap pointer-events-none shadow-md flex items-center gap-2 z-30"
                          >
                            <span>{tool.label}</span>
                            <span className="text-[10px] font-mono text-[#eb3b2d]">
                              {tool.shortcut}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Right-Side Playback & Reset Micro-Controls */}
              <div className="absolute top-6 right-6 flex items-center gap-1 bg-neutral-900/85 backdrop-blur-md px-2 py-1 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 z-10">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  onKeyDown={(e) => handleActivateKey(e, () => setIsPlaying((prev) => !prev))}
                  className="hover:text-[#eb3b2d] transition-colors p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
                  aria-label={isPlaying ? 'Pause canvas simulation' : 'Play canvas simulation'}
                  title={isPlaying ? 'Pause canvas' : 'Resume canvas'}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => setProgress(0)}
                  onKeyDown={(e) => handleActivateKey(e, () => setProgress(0))}
                  className="hover:text-[#eb3b2d] transition-colors p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
                  aria-label="Restart timeline"
                  title="Reset timeline"
                >
                  <RotateCcw size={12} />
                </button>
              </div>

              {/* Subtle Interactive AI Co-Pilot Conversation Bubbles (Bottom-Right of Canvas) */}
              <AnimatePresence>
                {showChatBubbles && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-5 right-5 max-w-[290px] sm:max-w-[330px] w-full flex flex-col gap-2 z-20"
                  >
                    {/* User Prompt Bubble (Keyboard Accessible Button) */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.15 }}
                      onClick={handleCycleConversationPreset}
                      onKeyDown={(e) => handleActivateKey(e, handleCycleConversationPreset)}
                      aria-label={`Director prompt: ${currentConversation.userMessage}. Press Enter or Space to cycle studio instruction.`}
                      title="Click or press Enter/Space to cycle studio instruction"
                      className="group self-end max-w-[90%] text-left rounded-2xl rounded-br-sm bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-3.5 py-2 text-[11px] text-neutral-200 shadow-lg backdrop-blur-md cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
                    >
                      <div className="flex items-center justify-between gap-3 mb-0.5 text-[10px] text-neutral-500 font-mono">
                        <span>Director Prompt</span>
                        <span className="group-hover:text-[#eb3b2d] group-focus-visible:text-[#eb3b2d] transition-colors">
                          Cycle ↻
                        </span>
                      </div>
                      <p className="leading-snug text-neutral-200">
                        &ldquo;{currentConversation.userMessage}&rdquo;
                      </p>
                    </motion.button>

                    {/* Omnia 1.0 Assistant Response Bubble */}
                    <motion.div
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.15 }}
                      className="group self-start w-full rounded-2xl rounded-bl-sm bg-neutral-950/92 border border-neutral-800/90 hover:border-[#eb3b2d]/45 px-3.5 py-2.5 text-[11px] text-neutral-300 shadow-xl backdrop-blur-md transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <Sparkles size={11} className="text-[#eb3b2d]" />
                          <span className="text-white font-medium">Omnia 1.0</span>
                          <span className="text-neutral-600">·</span>
                          <span className="text-neutral-400" aria-live="polite">
                            {isSynthesizing ? 'Synthesizing...' : currentConversation.latency}
                          </span>
                        </div>
                        <Check size={11} className="text-[#eb3b2d]" />
                      </div>
                      <p className="text-neutral-300 leading-snug mb-2">
                        {currentConversation.aiResponse}
                      </p>

                      {/* Interactive Micro-Chips to Adjust Live Shader State */}
                      <div
                        role="group"
                        aria-label="Shader preset adjustments"
                        className="flex items-center gap-1.5 pt-1.5 border-t border-white/[0.06] overflow-x-auto no-scrollbar"
                      >
                        {CONVERSATION_PRESETS.map((preset, idx) => {
                          const isCurrent = idx === activeConversationIndex;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              aria-pressed={isCurrent}
                              onClick={() => handleSelectConversationPreset(idx)}
                              onKeyDown={(e) =>
                                handleActivateKey(e, () => handleSelectConversationPreset(idx))
                              }
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                                isCurrent
                                  ? 'bg-[#eb3b2d]/15 border-[#eb3b2d]/50 text-white'
                                  : 'bg-white/[0.03] border-white/[0.06] text-neutral-400 hover:text-white hover:border-[#eb3b2d]/35'
                              }`}
                            >
                              {preset.chipLabel}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Timeline Scrubber Bar */}
            <div className="px-4 py-2 border-t border-neutral-900 bg-neutral-950/60 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                onKeyDown={(e) => handleActivateKey(e, () => setIsPlaying((prev) => !prev))}
                className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 hover:text-[#eb3b2d] text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>

              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                00:0{Math.floor(progress * 0.05)}:
                {String(Math.floor((progress * 60) % 60)).padStart(2, '0')}
              </span>

              {/* Keyboard-Accessible Timeline Progress Slider */}
              <div
                role="slider"
                tabIndex={0}
                aria-label="Timeline playback position"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                onKeyDown={handleTimelineKeyDown}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  setProgress(Math.max(0, Math.min(100, (clickX / rect.width) * 100)));
                }}
                className="flex-1 h-1.5 bg-neutral-800 rounded-full relative cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
              >
                <div
                  className="h-full bg-white/40 group-hover:bg-white/60 rounded-full transition-all duration-75 relative"
                  style={{ width: `${progress}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#eb3b2d] rounded-full shadow-sm ring-2 ring-black group-hover:scale-125 transition-transform" />
                </div>
              </div>

              <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                00:05:00
              </span>
            </div>

            {/* Interactive Prompt Input / Generation Bar */}
            <div className="p-3 border-t border-neutral-900 bg-black/80 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCycleConversationPreset}
                onKeyDown={(e) => handleActivateKey(e, handleCycleConversationPreset)}
                aria-label={`Current studio prompt: ${currentConversation.userMessage}. Press Enter or Space to cycle prompt.`}
                className="group flex-1 flex items-center justify-between gap-2 bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-[#eb3b2d]/40 rounded-lg px-3 py-2 text-xs text-left transition-all duration-150 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
                title="Click or press Enter/Space to test another studio prompt"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles
                    size={14}
                    className="text-[#eb3b2d] shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-neutral-300 group-hover:text-white font-mono truncate transition-colors">
                    &ldquo;{currentConversation.userMessage}&rdquo;
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 group-hover:text-[#eb3b2d] shrink-0 hidden sm:inline transition-colors">
                  Try Prompt ↻
                </span>
              </button>
              <button
                type="button"
                onClick={onOpenWorkspace}
                onKeyDown={(e) => handleActivateKey(e, onOpenWorkspace)}
                aria-label="Synthesize prompt in Omnia 1.0 Studio"
                className="group px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
              >
                <span>Synthesize</span>
                <span className="text-[10px] text-neutral-600 group-hover:text-[#eb3b2d] font-mono transition-colors">
                  ↵
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Gradient: Smoothly Blends Hero Visual into Next Section */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent z-30 pointer-events-none" />
    </div>
  );
};
