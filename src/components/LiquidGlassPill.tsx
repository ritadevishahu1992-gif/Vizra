import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface LiquidGlassPillProps {
  className?: string;
  onClick?: () => void;
}

export const LiquidGlassPill: React.FC<LiquidGlassPillProps> = ({
  className = '',
  onClick,
}) => {
  return (
    <button
      type="button"
      aria-label="Vizra Creative Intelligence — Explore showcase"
      onClick={onClick}
      className={`group inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full mb-6 bg-[#121216]/90 hover:bg-[#18181E] border border-white/[0.1] hover:border-white/[0.18] cursor-pointer select-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#EB3B2D] shrink-0" aria-hidden="true" />
      <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.14em] text-neutral-300 group-hover:text-white transition-colors">
        Vizra Creative Intelligence
      </span>
      <ArrowUpRight
        size={13}
        className="text-neutral-500 group-hover:text-[#EB3B2D] transition-colors shrink-0"
      />
    </button>
  );
};
