import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Cpu, Film, Sparkles, Layers, Sliders, Play, Code } from 'lucide-react';

interface EngineItem {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  metrics: string;
  codeSnippet: string;
}

const engines: EngineItem[] = [
  {
    id: 'motion',
    number: '01',
    title: 'Temporal Motion Synthesis',
    category: 'Kinetic Physics',
    description:
      'Synthesize continuous 60fps fluid motion paths, camera trajectories, and organic physics interactions from natural language prompts without manual keyframing.',
    metrics: '60 FPS · Zero Drift · Bezier Output',
    codeSnippet: 'omnia.synthesize({\n  trajectory: "procedural_spiral",\n  damping: 0.18,\n  fps: 60\n});',
  },
  {
    id: 'director',
    number: '02',
    title: 'Omnia Neural Direction',
    category: 'Creative Control',
    description:
      'Direct cinematic lighting vectors, depth-of-field focal stops, and obsidian-grade aesthetic color grading with real-time prompt feedback.',
    metrics: 'Multi-layer · PBR Lighting · 4K',
    codeSnippet: 'omnia.setLighting({\n  lumens: 1200,\n  tint: "#EB3B2D",\n  falloff: "cinematic_soft"\n});',
  },
  {
    id: 'shader',
    number: '03',
    title: 'Procedural Shader Synthesis',
    category: 'Code & WebGL',
    description:
      'Generate production-ready GLSL fragment shaders, raymarching volumetric effects, and node graphs ready for export into WebGL, Three.js, or game engines.',
    metrics: 'GLSL · WebGL2 · Pure Math',
    codeSnippet: 'vec3 color = mix(obsidian, crimson, smoothstep(0.2, 0.8, wave));',
  },
  {
    id: 'typography',
    number: '04',
    title: 'Kinetic Spatial Typography',
    category: 'Editorial Motion',
    description:
      'Harmonize variable fonts, procedural kerning, and dimensional text deformation in sync with audio frequency bands and kinetic force fields.',
    metrics: 'Variable Axes · Audio Reactive · SVG',
    codeSnippet: 'omnia.animateType({\n  font: "Instrument Serif",\n  weight: [400, 700],\n  velocity: 1.4\n});',
  },
];

export const StudioEngines: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => {
  const [activeEngine, setActiveEngine] = useState<string>('motion');

  const current = engines.find((e) => e.id === activeEngine) || engines[0];

  return (
    <section id="studio" className="py-24 md:py-32 px-8 md:px-28 bg-black border-t border-neutral-900 selection:bg-[#eb3b2d] selection:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-3 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Studio Capabilities</span>
              <span>·</span>
              <span>Omnia 1.0 Architecture</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white leading-tight">
              Four Core Engines.
              <br />
              <span className="text-neutral-500">One Unified Intelligence.</span>
            </h2>
          </div>

          <p className="text-neutral-400 text-sm md:text-base max-w-md leading-relaxed">
            Built for motion designers, animators, and creative developers seeking raw speed
            without sacrificing surgical typographic or compositional control.
          </p>
        </div>

        {/* Asymmetric Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Numbered Service List */}
          <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
            {engines.map((engine) => {
              const isSelected = engine.id === activeEngine;
              return (
                <button
                  key={engine.id}
                  onClick={() => setActiveEngine(engine.id)}
                  className={`w-full text-left p-6 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-950 border-neutral-700 shadow-lg'
                      : 'bg-transparent border-neutral-900 hover:border-neutral-800 hover:bg-neutral-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-mono font-medium ${
                          isSelected ? 'text-[#eb3b2d]' : 'text-neutral-500'
                        }`}
                      >
                        {engine.number}.
                      </span>
                      <span className="text-xs text-neutral-500">{engine.category}</span>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    {engine.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed line-clamp-2">
                    {engine.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Live Engine Inspector & Synthesis Preview */}
          <div className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-950/90 p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background red accent aura */}
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10 blur-[90px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, #eb3b2d 0%, transparent 80%)' }}
            />

            <div>
              {/* Header metadata */}
              <div className="flex items-center justify-between pb-6 border-b border-neutral-900 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#eb3b2d]">{current.number}</span>
                  <span className="text-white font-medium">{current.title}</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  {current.metrics}
                </div>
              </div>

              {/* Detailed Description */}
              <div className="my-8">
                <p className="text-base md:text-lg text-neutral-200 leading-relaxed">
                  {current.description}
                </p>
              </div>

              {/* Code Snippet / Parameter Terminal */}
              <div className="rounded-xl bg-black border border-neutral-900 p-4 font-mono text-xs text-neutral-300">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-900/60 text-[11px] text-neutral-500">
                  <span>vizra_kernel.ts</span>
                  <span className="text-[#eb3b2d]">LIVE COMPILE</span>
                </div>
                <pre className="overflow-x-auto text-neutral-300 text-xs leading-5">
                  <code>{current.codeSnippet}</code>
                </pre>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-8 mt-6 border-t border-neutral-900 flex items-center justify-between">
              <div className="text-xs text-neutral-500">
                Ready in Omnia 1.0 Private Release
              </div>
              <button
                onClick={onLaunch}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Test in Studio</span>
                <ArrowUpRight size={13} className="text-[#eb3b2d]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
