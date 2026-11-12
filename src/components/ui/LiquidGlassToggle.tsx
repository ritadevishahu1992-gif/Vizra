import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface LiquidGlassToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Component 02 — Liquid Glass Toggle (Surface Tension)
 * Adapted from 21st.dev / Nimbus UI for VIZRA.
 * Global Dark Mode / Light Mode switch with liquid-glass refraction,
 * spring surface tension physics, keyboard accessibility, and CSS fallback.
 */
export const LiquidGlassToggle: React.FC<LiquidGlassToggleProps> = ({
  className = '',
  size = 'md',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const dimensions =
    size === 'sm'
      ? { width: 'w-14', height: 'h-7', knob: 'w-5 h-5', icon: 11, xDark: 28, xLight: 2 }
      : size === 'lg'
      ? { width: 'w-20', height: 'h-10', knob: 'w-7 h-7', icon: 15, xDark: 42, xLight: 3 }
      : { width: 'w-16', height: 'h-8', knob: 'w-6 h-6', icon: 13, xDark: 34, xLight: 2 };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Toggle dark mode. Currently ${isDark ? 'Dark Mode' : 'Light Mode'}`}
      onClick={toggleTheme}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      }}
      className={`relative inline-flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] select-none ${dimensions.width} ${dimensions.height} ${
        isDark
          ? 'bg-neutral-900/90 border border-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]'
          : 'bg-neutral-200/90 border border-neutral-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]'
      } ${className}`}
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Background Liquid Shimmer Track */}
      <div
        className="absolute inset-0 rounded-full opacity-30 pointer-events-none transition-opacity duration-300"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 80% 50%, rgba(235,59,45,0.3) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 20% 50%, rgba(251,191,36,0.35) 0%, transparent 60%)',
        }}
      />

      {/* Surface Tension Liquid Floating Pill / Knob */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 450,
          damping: 28,
          mass: 0.8,
        }}
        animate={{
          x: isDark ? dimensions.xDark : dimensions.xLight,
          rotate: isDark ? 0 : 180,
        }}
        className={`relative rounded-full flex items-center justify-center transition-shadow duration-300 ${dimensions.knob} ${
          isDark
            ? 'bg-gradient-to-b from-neutral-800 to-neutral-950 text-white border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)]'
            : 'bg-gradient-to-b from-white to-neutral-100 text-amber-500 border border-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)]'
        }`}
      >
        {/* Liquid Glass Highlight Rim */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: isDark
              ? 'inset 0 1px 1px rgba(255,255,255,0.3), 0 0 10px rgba(235,59,45,0.2)'
              : 'inset 0 1px 1px rgba(255,255,255,0.8), 0 0 8px rgba(245,158,11,0.25)',
          }}
        />

        {isDark ? (
          <Moon size={dimensions.icon} className="text-neutral-200 fill-neutral-200/20" />
        ) : (
          <Sun size={dimensions.icon} className="text-amber-500 fill-amber-500/30" />
        )}
      </motion.div>

      {/* Accessible Tooltip Indicator (Hidden visually, read by screen readers) */}
      <span className="sr-only">{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
    </button>
  );
};
