import React from 'react';

interface LiquidGlassPillProps {
  className?: string;
  onClick?: () => void;
}

export const LiquidGlassPill: React.FC<LiquidGlassPillProps> = ({
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`liquid-glass inline-flex items-center gap-3 px-3 py-2 rounded-lg mb-6 cursor-pointer select-none transition-transform hover:scale-[1.01] ${className}`}
      role="banner"
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
