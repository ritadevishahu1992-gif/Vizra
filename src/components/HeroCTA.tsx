import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Play } from 'lucide-react';

export interface HeroCTAProps {
  onStartCreating: () => void;
  onWatchDemo: () => void;
  isDemoActive?: boolean;
  className?: string;
}

export const HeroCTA: React.FC<HeroCTAProps> = ({
  onStartCreating,
  onWatchDemo,
  isDemoActive = false,
  className = '',
}) => {
  const handleTriggerKey = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    callback: () => void
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <div
      role="group"
      aria-label="Hero primary actions"
      className={`flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto ${className}`}
    >
      {/* Primary Hero CTA: Start Creating */}
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        onClick={onStartCreating}
        onKeyDown={(e) => handleTriggerKey(e, onStartCreating)}
        aria-label="Start Creating in Omnia 1.0 Studio"
        className="group relative w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2.5 bg-white text-[#09090B] rounded-xl px-6 sm:px-7 text-sm sm:text-[15px] font-display font-semibold shadow-[0_8px_28px_rgba(0,0,0,0.45)] hover:bg-neutral-100 transition-colors cursor-pointer select-none whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
      >
        <span>Start Creating</span>
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/[0.08] group-hover:bg-[#EB3B2D] group-focus-visible:bg-[#EB3B2D] transition-colors duration-150">
          <ArrowUpRight
            size={13}
            className="text-[#09090B] group-hover:text-white group-focus-visible:text-white transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </motion.button>

      {/* Secondary Hero CTA: Watch Demo */}
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        onClick={onWatchDemo}
        onKeyDown={(e) => handleTriggerKey(e, onWatchDemo)}
        aria-pressed={isDemoActive}
        aria-label={isDemoActive ? 'Stop interactive Omnia demo' : 'Watch interactive Omnia demo'}
        className={`group relative w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2.5 rounded-xl px-6 text-sm sm:text-[15px] font-display font-medium border transition-colors duration-150 cursor-pointer select-none whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] ${
          isDemoActive
            ? 'bg-[#191416] border-[#EB3B2D]/50 text-white'
            : 'bg-[#121216]/90 hover:bg-[#19191F] border-white/[0.12] hover:border-white/[0.22] text-neutral-200 hover:text-white'
        }`}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors duration-150 ${
            isDemoActive
              ? 'border-[#EB3B2D] bg-[#EB3B2D]/20 text-[#EB3B2D]'
              : 'border-white/20 bg-white/[0.04] text-neutral-300 group-hover:border-[#EB3B2D]/60 group-hover:text-[#EB3B2D]'
          }`}
        >
          <Play size={9} className="fill-current ml-0.5" />
        </span>
        <span>{isDemoActive ? 'Playing Live Demo' : 'Watch Demo'}</span>
      </motion.button>
    </div>
  );
};
