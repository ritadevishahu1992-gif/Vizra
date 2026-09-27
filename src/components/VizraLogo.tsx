import React from 'react';

interface VizraLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const VizraLogo: React.FC<VizraLogoProps> = ({
  className = '',
  size = 28,
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Precision architectural mark for Vizra */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
        aria-label="Vizra Mark"
      >
        {/* Obsidian geometric prism facet */}
        <path
          d="M4 6L16 26L28 6H21.5L16 17.5L10.5 6H4Z"
          fill="#FFFFFF"
          fillOpacity="0.9"
        />
        {/* Vizra signature controlled red accent inner core */}
        <path
          d="M16 26L19 20L16 15L13 20L16 26Z"
          fill="#EB3B2D"
        />
        {/* Architectural upper guide notch */}
        <circle cx="16" cy="7" r="1.5" fill="#EB3B2D" />
      </svg>

      {showText && (
        <span className="text-xl font-bold tracking-tight text-white select-none">
          Vizra
        </span>
      )}
    </div>
  );
};

export const VizraMark: React.FC<{ className?: string }> = ({ className = 'w-14 h-10' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 56 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
        aria-hidden="true"
      >
        {/* Minimalist abstract red mark / quote replacement */}
        <path
          d="M12 8L24 32L36 8"
          stroke="#EB3B2D"
          strokeWidth="3.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <path
          d="M26 8L38 32L50 8"
          stroke="#FFFFFF"
          strokeOpacity="0.25"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <circle cx="24" cy="32" r="2.5" fill="#EB3B2D" />
      </svg>
    </div>
  );
};
