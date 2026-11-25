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
      ? { width: 'w-12', height: 'h-7', knob: 'w-5 h-5', icon: 11, xDark: 22, xLight: 2 }
      : size === 'lg'
      ? { width: 'w-20', height: 'h-10', knob: 'w-7 h-7', icon: 15, xDark: 42, xLight: 3 }
      : { width: 'w-14', height: 'h-8', knob: 'w-6 h-6', icon: 13, xDark: 26, xLight: 2 };

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
      className={`relative inline-flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] select-none shrink-0 ${dimensions.width} ${dimensions.height} ${
        isDark
          ? 'bg-[#141418] hover:bg-[#1B1B21] border border-white/[0.12] hover:border-white/[0.2]'
          : 'bg-neutral-200 hover:bg-neutral-300/80 border border-neutral-300'
      } ${className}`}
    >
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 480,
          damping: 32,
          mass: 0.75,
        }}
        animate={{
          x: isDark ? dimensions.xDark : dimensions.xLight,
        }}
        className={`relative rounded-full flex items-center justify-center transition-colors duration-200 ${dimensions.knob} ${
          isDark
            ? 'bg-[#26262E] text-neutral-100 border border-white/[0.16] shadow-sm'
            : 'bg-white text-amber-500 border border-neutral-200 shadow-sm'
        }`}
      >
        {isDark ? (
          <Moon size={dimensions.icon} className="text-neutral-200" />
        ) : (
          <Sun size={dimensions.icon} className="text-amber-500" />
        )}
      </motion.div>

      <span className="sr-only">{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
    </button>
  );
};
