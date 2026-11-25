import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Sparkles, History as HistoryIcon, Settings } from 'lucide-react';

export interface LiquidGlassNavbarProps {
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', path: '/', icon: Home },
  { id: 'ai', label: 'AI', path: '/ai', icon: Sparkles },
  { id: 'history', label: 'History', path: '/history', icon: HistoryIcon },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

/**
 * Application Workspace Bottom Navigation Dock
 * Mounted strictly inside workspace companion views (/history, /settings)
 * for quick switching between Home, Omnia AI, History, and Settings.
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
      aria-label="Workspace Quick Navigation"
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 select-none ${className}`}
    >
      <div className="relative flex items-center gap-1 p-1.5 rounded-full border border-neutral-300 dark:border-white/[0.12] bg-white/95 dark:bg-[#111114]/92 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.75)]">
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
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="workspace-navbar-active"
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 rounded-full bg-[#1C1C22] border border-white/[0.14] shadow-sm pointer-events-none"
                />
              )}

              {!isActive && isHovered && (
                <motion.div
                  layoutId="workspace-navbar-hover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  className="absolute inset-0 rounded-full bg-black/[0.04] dark:bg-white/[0.05] pointer-events-none"
                />
              )}

              <div className="relative z-10 flex items-center gap-1.5">
                <Icon
                  size={15}
                  className={`transition-colors duration-150 ${
                    isActive
                      ? 'text-[#eb3b2d]'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
