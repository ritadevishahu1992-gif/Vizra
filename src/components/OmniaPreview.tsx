import React, { useState, useEffect, useRef } from 'react';
import { motion, MotionValue } from 'motion/react';
import {
  Play,
  Pause,
  Sliders,
  Layers,
  Sparkles,
  Maximize2,
  Volume2,
  Film,
  Cpu,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { VizraLogo } from './VizraLogo';

interface OmniaPreviewProps {
  yTransform?: MotionValue<number>;
  onOpenWorkspace?: () => void;
}

export const OmniaPreview: React.FC<OmniaPreviewProps> = ({
  yTransform,
  onOpenWorkspace,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<'canvas' | 'nodes' | 'timeline' | 'shaders'>('canvas');
  const [activePreset, setActivePreset] = useState<'ribbon' | 'typography' | 'particles'>('ribbon');
  const [progress, setProgress] = useState(38);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

      if (activePreset === 'ribbon') {
        // Draw elegant fluid obsidian & crimson procedural ribbon
        ctx.lineWidth = 1.6;
        const curvesCount = 5;

        for (let i = 0; i < curvesCount; i++) {
          ctx.beginPath();
          const offset = i * 0.35;
          const isAccent = i === 2; // Controlled red accent curve

          ctx.strokeStyle = isAccent
            ? 'rgba(235, 59, 45, 0.85)'
            : `rgba(255, 255, 255, ${0.12 + i * 0.08})`;

          for (let x = 0; x <= width; x += 12) {
            const normalizedX = x / width;
            const wave1 = Math.sin(normalizedX * 4 + t + offset) * 45;
            const wave2 = Math.cos(normalizedX * 2.5 - t * 0.8) * 30;
            const wave3 = Math.sin((normalizedX + t * 0.1) * 6) * 15;
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
        for (let p = 0; p < 4; p++) {
          const px = ((t * 40 + p * (width / 4)) % width);
          const normX = px / width;
          const py = height / 2 + Math.sin(normX * 4 + t + 0.7) * 45 + Math.cos(normX * 2.5 - t * 0.8) * 30;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = '#EB3B2D';
          ctx.fill();
        }
      } else if (activePreset === 'typography') {
        // Kinetic Typography procedural vector grid
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '500 24px Inter, sans-serif';
        const words = ['OMNIA', '1.0', 'SYNTHESIS', 'KINETIC', 'TEMPORAL'];
        const rowY = height / 2 - 20;

        words.forEach((word, idx) => {
          const shift = Math.sin(t * 1.5 + idx) * 12;
          const alpha = 0.25 + Math.abs(Math.cos(t + idx * 0.5)) * 0.7;
          ctx.fillStyle = idx === 1 ? '#EB3B2D' : `rgba(255, 255, 255, ${alpha})`;
          ctx.fillText(word, 80 + idx * 115, rowY + shift);
        });

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 40; x < width; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 40);
          ctx.lineTo(x, height - 40);
          ctx.stroke();
        }
      } else {
        // Spatial particles simulation
        const pCount = 35;
        for (let i = 0; i < pCount; i++) {
          const angle = (i / pCount) * Math.PI * 2 + t * 0.4;
          const radius = 60 + Math.sin(t * 2 + i) * 35;
          const cx = width / 2 + Math.cos(angle) * radius * 1.8;
          const cy = height / 2 + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.arc(cx, cy, i % 6 === 0 ? 3 : 1.5, 0, Math.PI * 2);
          ctx.fillStyle = i % 7 === 0 ? '#EB3B2D' : 'rgba(255, 255, 255, 0.6)';
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
  }, [isPlaying, activePreset]);

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
      className="relative w-screen aspect-[16/10] md:aspect-[16/9] min-h-[560px] md:min-h-[700px] overflow-hidden"
      style={{ marginLeft: 'calc(-50vw + 50%)' }}
    >
      {/* Background Visual: Atmospheric Dark Creative AI Ambient Backdrop */}
      <div className="absolute inset-0 bg-black pointer-events-none">
        {/* Subtle radial light gradient with controlled faint red energy */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] rounded-full opacity-20 blur-[130px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(235,59,45,0.45) 0%, rgba(20,20,20,0.1) 70%, transparent 100%)',
          }}
        />
        {/* Subtle architectural horizontal guide lines */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Main Interface Window Preview: Absolutely Positioned & Centered with Parallax */}
      <motion.div
        style={yTransform ? { y: yTransform } : undefined}
        className="absolute top-8 md:top-14 left-1/2 -translate-x-1/2 max-w-5xl w-[92%] rounded-2xl border border-neutral-800/80 bg-neutral-950/90 shadow-2xl backdrop-blur-xl overflow-hidden z-20 transition-all duration-300"
      >
        {/* Workspace Titlebar */}
        <div className="px-4 py-3 border-b border-neutral-900 bg-black/60 flex items-center justify-between text-xs text-neutral-400 select-none">
          {/* Left: Window Dots & Vizra Omnia Brand Lockup */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
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

          {/* Center: Tool Navigation Tabs */}
          <div className="hidden sm:flex items-center gap-1 bg-neutral-900/60 p-0.5 rounded-lg border border-neutral-800/60">
            {(
              [
                { id: 'canvas', label: 'Canvas', icon: Compass },
                { id: 'nodes', label: 'Flow Nodes', icon: Layers },
                { id: 'timeline', label: 'Temporal Track', icon: Film },
                { id: 'shaders', label: 'Shaders', icon: Cpu },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon size={12} className={activeTab === tab.id ? 'text-[#eb3b2d]' : ''} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: AI Status Indicator & Fullscreen */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-pulse" />
              <span className="text-neutral-300">Omnia Neural Core</span>
              <span className="text-neutral-500 hidden md:inline">· 60 FPS</span>
            </div>
            <button
              onClick={onOpenWorkspace}
              className="text-neutral-400 hover:text-white transition-colors p-1"
              aria-label="Open Workspace"
              title="Launch full Omnia workspace"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Workspace Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[320px] md:min-h-[400px]">
          {/* Left Tool Sidebar (3 cols desktop) */}
          <div className="hidden md:flex md:col-span-3 flex-col justify-between p-4 border-r border-neutral-900 bg-neutral-950/50 text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
                  Creative Mode
                </span>
                <div className="space-y-1">
                  {[
                    { id: 'ribbon', name: 'Procedural Ribbon', desc: 'Fluid 60fps vector physics' },
                    { id: 'typography', name: 'Kinetic Typography', desc: 'Realtime variable type' },
                    { id: 'particles', name: 'Spatial Vortex', desc: 'Neural particle matrix' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePreset(p.id as any)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors border ${
                        activePreset === p.id
                          ? 'bg-white/[0.04] border-[#eb3b2d]/40 text-white'
                          : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs">{p.name}</span>
                        {activePreset === p.id && (
                          <span className="w-1 h-1 rounded-full bg-[#eb3b2d]" />
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Node Pipeline Preview */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
                  Omnia Pipeline
                </span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-neutral-900/60 text-neutral-300">
                    <span>Input Prompt</span>
                    <span className="text-[#eb3b2d]">OK</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-neutral-900/60 text-neutral-300">
                    <span>Latent Geometry</span>
                    <span className="text-neutral-400">0.14s</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-neutral-900/60 text-neutral-300">
                    <span>Temporal Warp</span>
                    <span className="text-neutral-400">60 FPS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Left: Studio Metadata */}
            <div className="pt-3 border-t border-neutral-900 text-[11px] text-neutral-500 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Model</span>
                <span className="text-neutral-300">Omnia 1.0</span>
              </div>
              <div className="flex justify-between">
                <span>Engine</span>
                <span className="text-neutral-300">TensorFlow GL</span>
              </div>
              <div className="flex justify-between">
                <span>Render</span>
                <span className="text-[#eb3b2d]">Active</span>
              </div>
            </div>
          </div>

          {/* Main Visual Canvas Area (9 cols desktop) */}
          <div className="col-span-1 md:col-span-9 flex flex-col justify-between bg-black/40 relative">
            {/* Center Live Canvas */}
            <div className="relative flex-1 min-h-[260px] md:min-h-[310px] flex items-center justify-center p-3">
              <canvas
                ref={canvasRef}
                width={720}
                height={320}
                className="w-full h-full max-h-[320px] rounded-lg object-cover bg-neutral-950 border border-neutral-900/70"
              />

              {/* Overlay Studio Watermark / Tag */}
              <div className="absolute top-6 left-6 pointer-events-none flex items-center gap-2 font-mono text-[11px] text-neutral-500">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
                <span>VIZRA OMNIA 1.0 CANVAS</span>
              </div>

              {/* Right side floating mini-controls */}
              <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-sm px-2 py-1 rounded-md border border-neutral-800 text-[11px] text-neutral-400">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:text-white transition-colors p-1"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  onClick={() => setProgress(0)}
                  className="hover:text-white transition-colors p-1"
                  aria-label="Restart"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {/* Timeline Scrubber Bar */}
            <div className="px-4 py-2 border-t border-neutral-900 bg-neutral-950/60 flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>

              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                00:0{Math.floor((progress * 0.05))}:
                {String(Math.floor((progress * 60) % 60)).padStart(2, '0')}
              </span>

              {/* Progress Bar with Crimson Playhead */}
              <div
                className="flex-1 h-1.5 bg-neutral-800 rounded-full relative cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  setProgress((clickX / rect.width) * 100);
                }}
              >
                <div
                  className="h-full bg-white/40 rounded-full transition-all duration-75 relative"
                  style={{ width: `${progress}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#eb3b2d] rounded-full shadow-sm ring-2 ring-black" />
                </div>
              </div>

              <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                00:05:00
              </span>
            </div>

            {/* Prompt Input / Generation Bar */}
            <div className="p-3 border-t border-neutral-900 bg-black/80 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-neutral-900/70 border border-neutral-800 rounded-lg px-3 py-2 text-xs">
                <Sparkles size={14} className="text-[#eb3b2d] shrink-0" />
                <span className="text-neutral-300 font-mono truncate">
                  &quot;Create obsidian fluid ribbon with crimson laser refraction and kinetic velocity curves&quot;
                </span>
              </div>
              <button
                onClick={onOpenWorkspace}
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Synthesize</span>
                <span className="text-[10px] text-neutral-600 font-mono">↵</span>
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
