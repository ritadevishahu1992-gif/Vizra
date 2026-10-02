import React from 'react';
import { motion } from 'motion/react';
import { VizraLogo } from '../VizraLogo';
import { Sparkles, Film, Code, Globe, ArrowUpRight, Brain, Zap, BarChart2, Music } from 'lucide-react';
import { AIMode } from '../../types/ai';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string, mode?: AIMode) => void;
  activeMode?: AIMode;
  onSelectMode?: (mode: AIMode) => void;
}

const suggestions = [
  {
    category: 'AI Music & Audio',
    icon: Music,
    mode: 'create' as AIMode,
    prompt: 'Generate a 30-second dark ambient cinematic soundtrack with analog synths.',
    desc: 'Audio clips, jingles & background music via Lyria 3',
  },
  {
    category: 'Concepts & Architecture',
    icon: Code,
    mode: 'quick' as AIMode,
    prompt: 'What is the difference between React and Vue?',
    desc: 'Clear comparisons, engineering principles & frameworks',
  },
  {
    category: 'Research',
    icon: Globe,
    mode: 'research' as AIMode,
    prompt: 'Research the latest astrophysics discoveries on supermassive black holes.',
    desc: 'Fact-checked synthesis, academic sources & verification',
  },
  {
    category: 'Hindi / Hinglish',
    icon: Sparkles,
    mode: 'quick' as AIMode,
    prompt: 'Photosynthesis simple shabdon mein samjhao.',
    desc: 'Natural multilingual understanding & answers',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt,
  activeMode,
  onSelectMode,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto select-none my-auto">
      {/* Brand Symbol & Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-6 flex flex-col items-center"
      >
        <div className="mb-4 p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 shadow-sm">
          <VizraLogo size={28} />
        </div>

        <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-white mb-2">
          How can Omnia help you today?
        </h1>

        <p className="text-neutral-400 text-sm md:text-base max-w-md leading-normal mb-3">
          Your ideas. My knowledge. Our future.
        </p>

        {/* Core Philosophy Pipeline Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] font-mono text-neutral-300">
          <span className="text-[#eb3b2d]">RESEARCH</span>
          <span className="text-neutral-600">→</span>
          <span className="text-neutral-300">UNDERSTAND</span>
          <span className="text-neutral-600">→</span>
          <span className="text-neutral-300">PLAN</span>
          <span className="text-neutral-600">→</span>
          <span className="text-white font-medium">CREATE</span>
          <span className="text-neutral-600">→</span>
          <span className="text-[#eb3b2d]">EXECUTE</span>
        </div>
      </motion.div>

      {/* Mode Quick Select Pills */}
      {onSelectMode && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6 max-w-lg">
          {[
            { id: 'quick', label: 'Quick' },
            { id: 'think', label: 'Think' },
            { id: 'research', label: 'Research' },
            { id: 'create', label: 'Create' },
            { id: 'code', label: 'Code' },
            { id: 'analyze', label: 'Analyze' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMode(m.id as AIMode)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                activeMode === m.id
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Suggestion Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
      >
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt, item.mode)}
              className="text-left p-4 rounded-xl bg-neutral-950/80 hover:bg-neutral-900/70 border border-neutral-800/80 hover:border-neutral-700 transition-all duration-150 cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-[#eb3b2d]" />
                  <span className="text-xs font-mono font-medium text-neutral-400">
                    {item.category}
                  </span>
                </div>
                <ArrowUpRight
                  size={14}
                  className="text-neutral-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                />
              </div>

              <div className="space-y-0.5">
                <span className="text-sm font-medium text-white block group-hover:text-white transition-colors line-clamp-2">
                  &quot;{item.prompt}&quot;
                </span>
                <span className="text-[11px] text-neutral-500 block leading-tight">
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
