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
      className={`liquid-glass inline-flex flex-col sm:flex-row items-center gap-2.5 p-2 rounded-2xl sm:rounded-full ${className}`}
    >
      {/* Primary Button: Start Creating */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={onStartCreating}
        onKeyDown={(e) => handleTriggerKey(e, onStartCreating)}
        aria-label="Start Creating in Omnia 1.0 Studio"
        className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-black rounded-xl sm:rounded-full px-7 py-3.5 text-sm sm:text-base font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.45)] hover:bg-neutral-100 transition-colors cursor-pointer select-none whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <span>Start Creating</span>
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/10 group-hover:bg-[#eb3b2d] group-hover:text-white group-focus-visible:bg-[#eb3b2d] group-focus-visible:text-white transition-colors duration-150">
          <ArrowUpRight
            size={13}
            className="text-black group-hover:text-white group-focus-visible:text-white transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </motion.button>

      {/* Secondary Button: Watch Demo (uses .liquid-glass) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={onWatchDemo}
        onKeyDown={(e) => handleTriggerKey(e, onWatchDemo)}
        aria-pressed={isDemoActive}
        aria-label={isDemoActive ? 'Stop interactive Omnia demo' : 'Watch interactive Omnia demo'}
        className={`liquid-glass group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl sm:rounded-full px-7 py-3.5 text-sm sm:text-base font-medium transition-colors duration-150 cursor-pointer select-none whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
          isDemoActive
            ? 'text-white bg-white/[0.08]'
            : 'text-neutral-200 hover:text-white hover:bg-white/[0.05]'
        }`}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors duration-150 ${
            isDemoActive
              ? 'border-[#eb3b2d] bg-[#eb3b2d]/20 text-[#eb3b2d]'
              : 'border-white/20 bg-white/[0.04] text-neutral-300 group-hover:border-[#eb3b2d]/60 group-hover:bg-[#eb3b2d]/15 group-hover:text-[#eb3b2d] group-focus-visible:border-[#eb3b2d]/60 group-focus-visible:text-[#eb3b2d]'
          }`}
        >
          <Play size={10} className="fill-current ml-0.5" />
        </span>
        <span>{isDemoActive ? 'Playing Live Demo' : 'Watch Demo'}</span>
      </motion.button>
    </div>
  );
};
