import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Sparkles, History as HistoryIcon, Settings } from 'lucide-react';

export interface LiquidGlassNavbarProps {
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', path: '/', icon: Home },
  { id: 'ai', label: 'AI', path: '/ai', icon: Sparkles },
  { id: 'history', label: 'History', path: '/history', icon: HistoryIcon },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

/**
 * Component 01 — Liquid Glass Navbar (Waterline)
 * Adapted from 21st.dev / Nimbus UI — Liquid Navbar by guglielmogiannatasio.it.
 * Bottom floating navigation dock for VIZRA with charcoal & crimson liquid-glass physics,
 * active indicator water tension pill, tactile spring movement, and haptic-friendly targets.
 */
export const LiquidGlassNavbar: React.FC<LiquidGlassNavbarProps> = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getActiveId = () => {
    const current = location.pathname;
    if (current === '/') return 'home';
    if (current.startsWith('/ai')) return 'ai';
    if (current.startsWith('/history')) return 'history';
    if (current.startsWith('/settings')) return 'settings';
    return null;
  };

  const activeId = getActiveId();

  return (
    <nav
      aria-label="Liquid Glass Primary Bottom Navigation"
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 select-none ${className}`}
    >
      {/* Outer Floating Dock Shell */}
      <div
        className="relative flex items-center gap-1.5 p-1.5 sm:p-2 rounded-full border border-white/10 dark:border-white/10 border-neutral-300 bg-neutral-900/85 dark:bg-neutral-950/85 bg-white/85 shadow-[0_12px_36px_rgba(0,0,0,0.45)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Subtle Liquid Waterline Ambient Glow */}
        <div
          className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 120%, rgba(235,59,45,0.45) 0%, transparent 70%)',
          }}
        />

        {/* Liquid Highlight Top Border (Liquid Glass Spec) */}
        <div
          className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          const isHovered = hoveredId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 dark:hover:text-white'
              }`}
            >
              {/* Active State Waterline Tension Capsule */}
              {isActive && (
                <motion.div
                  layoutId="liquid-navbar-waterline"
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-neutral-800 to-neutral-900 border border-white/15 dark:border-white/15 shadow-[0_4px_16px_rgba(235,59,45,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] pointer-events-none"
                >
                  {/* Internal Liquid Crimson Droplet Refraction */}
                  <div
                    className="absolute inset-0 rounded-full opacity-60"
                    style={{
                      background:
                        'radial-gradient(circle at 50% 0%, rgba(235,59,45,0.35) 0%, transparent 60%)',
                    }}
                  />
                </motion.div>
              )}

              {/* Hover Wave Effect (When Not Active) */}
              {!isActive && isHovered && (
                <motion.div
                  layoutId="liquid-navbar-hover"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 rounded-full bg-white/5 dark:bg-white/5 pointer-events-none"
                />
              )}

              {/* Icon & Label */}
              <div className="relative z-10 flex items-center gap-1.5">
                <Icon
                  size={16}
                  className={`transition-transform duration-200 ${
                    isActive
                      ? 'text-[#eb3b2d] scale-110'
                      : isHovered
                      ? 'text-neutral-200 scale-105'
                      : 'text-neutral-400'
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#eb3b2d] animate-pulse hidden sm:inline-block" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
