import React from 'react';

interface LiquidGlassPillProps {
  className?: string;
  onClick?: () => void;
}

export const LiquidGlassPill: React.FC<LiquidGlassPillProps> = ({
  className = '',
  onClick,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Meet Omnia 1.0 — Vizra's AI creative intelligence. Activate to explore Vizra."
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`liquid-glass inline-flex items-center gap-3 px-3 py-2 rounded-lg mb-6 cursor-pointer select-none transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] ${className}`}
    >
      <span className="bg-white text-black rounded-md text-sm font-medium px-2 py-0.5 tracking-tight shadow-sm shrink-0">
        AI
      </span>
      <span className="text-sm font-medium text-neutral-400 tracking-tight flex items-center gap-1.5">
        Meet Omnia 1.0 — Vizra&apos;s AI creative intelligence
      </span>
    </div>
  );
};
