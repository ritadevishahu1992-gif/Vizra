import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { VizraLogo } from '../VizraLogo';
import {
  Code,
  Globe,
  ArrowUpRight,
  Music,
  Atom,
  EyeOff,
  Clock,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { AIMode } from '../../types/ai';
import { Tooltip } from '../ui/Tooltip';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string, mode?: AIMode) => void;
  activeMode?: AIMode;
  onSelectMode?: (mode: AIMode) => void;
  isTemporaryChat?: boolean;
  temporaryTtlMinutes?: number;
  onChangeTemporaryTtl?: (minutes: number) => void;
  temporaryInstructions?: string;
  onChangeTemporaryInstructions?: (value: string) => void;
}

const MODE_TOOLTIPS: Record<AIMode, string> = {
  quick: 'Fast, concise answers for everyday questions.',
  think: 'Deep step-by-step reasoning for complex logic and math.',
  research: 'Live web research with verified source citations.',
  science: 'Analyze proteins, chemical molecules, and PubMed papers.',
  create: 'Draft scripts, storyboards, and 10-stage creative projects.',
  code: 'Write, debug, and refactor production-ready code.',
  analyze: 'Inspect uploaded PDFs, CSV spreadsheets, and images.',
};

const suggestions = [
  {
    category: 'Science & Discovery',
    icon: Atom,
    mode: 'science' as AIMode,
    prompt: 'Analyze human p53 (TP53) structure in AlphaFold DB and find associated PubMed clinical trials.',
    desc: 'AlphaFold DB predictions, PubChem chemical structures & PubMed citations',
  },
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
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt,
  activeMode,
  onSelectMode,
  isTemporaryChat = false,
  temporaryTtlMinutes = 30,
  onChangeTemporaryTtl,
  temporaryInstructions = '',
  onChangeTemporaryInstructions,
}) => {
  if (isTemporaryChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto my-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full space-y-5 text-center"
        >
          <div className="flex flex-col items-center">
            <div className="mb-3 p-3 rounded-2xl bg-[#eb3b2d]/10 border border-[#eb3b2d]/30 text-[#eb3b2d]">
              <EyeOff size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
              Temporary Chat
            </h1>
            <p className="text-neutral-400 text-sm max-w-lg mt-2 leading-relaxed">
              Messages in this session stay strictly in client memory, are never saved to your sidebar history or Firestore, and are excluded from analytics and continuous learning logs.
            </p>
          </div>

          {/* Session TTL & Custom Instructions Card */}
          <div className="text-left rounded-2xl bg-[#0e0e0e] border border-neutral-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <Clock size={14} className="text-[#eb3b2d]" />
                <span>Auto-Wipe Session Expiration</span>
              </div>
              {onChangeTemporaryTtl && (
                <div className="flex items-center gap-1.5">
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => onChangeTemporaryTtl(mins)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                        temporaryTtlMinutes === mins
                          ? 'bg-white text-black border-white font-semibold'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              )}
            </div>

            {onChangeTemporaryInstructions && (
              <div className="space-y-1.5">
                <label
                  htmlFor="temp-session-instructions"
                  className="flex items-center gap-1.5 text-xs font-medium text-neutral-300"
                >
                  <Sliders size={12} className="text-[#eb3b2d]" />
                  <span>Session-Only Instructions (Optional)</span>
                </label>
                <textarea
                  id="temp-session-instructions"
                  rows={2}
                  maxLength={1500}
                  value={temporaryInstructions}
                  onChange={(e) => onChangeTemporaryInstructions(e.target.value)}
                  placeholder="e.g., Reply in concise bullet points. Focus strictly on TypeScript architecture..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-[#eb3b2d] focus:outline-none text-xs text-white placeholder-neutral-500 resize-none"
                />
              </div>
            )}

            <div className="flex items-start gap-2.5 pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 leading-relaxed">
              <ShieldAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-neutral-200 font-medium">Retention Disclosure:</strong> VIZRA does not persist Temporary Chat transcripts to your account or local history. Prompts sent for AI inference are still transmitted via HTTPS proxy to our upstream model provider (Google Gemini API) subject to provider processing terms. Use of this mode is governed by our{' '}
                <Link
                  to="/terms-and-conditions"
                  className="text-white underline underline-offset-2 hover:text-[#eb3b2d]"
                >
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy-policy"
                  className="text-white underline underline-offset-2 hover:text-[#eb3b2d]"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
          What can I help you with?
        </h1>

        <p className="text-neutral-400 text-sm md:text-base max-w-md leading-normal mb-3">
          Your ideas. My knowledge. Our future.
        </p>

        {/* Core Philosophy Pipeline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[11px] font-mono text-neutral-300">
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

      {/* Mode Quick Select */}
      {onSelectMode && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6 max-w-lg">
          {[
            { id: 'quick' as AIMode, label: 'Quick' },
            { id: 'think' as AIMode, label: 'Think' },
            { id: 'research' as AIMode, label: 'Research' },
            { id: 'science' as AIMode, label: 'Science' },
            { id: 'create' as AIMode, label: 'Create' },
            { id: 'code' as AIMode, label: 'Code' },
            { id: 'analyze' as AIMode, label: 'Analyze' },
          ].map((m) => (
            <Tooltip
              key={m.id}
              label={`${m.label} Mode`}
              text={MODE_TOOLTIPS[m.id]}
              position="top"
            >
              <button
                type="button"
                onClick={() => onSelectMode(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  activeMode === m.id
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                }`}
              >
                {m.label}
              </button>
            </Tooltip>
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
              type="button"
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
