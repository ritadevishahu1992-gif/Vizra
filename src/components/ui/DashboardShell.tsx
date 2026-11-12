import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  FolderOpen,
  BarChart3,
  KeyRound,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Zap,
  ShieldCheck,
  ExternalLink,
  Command,
} from 'lucide-react';
import { VizraLogo } from '../VizraLogo';
import { UserMenu } from '../auth/UserMenu';
import { NotificationCenterTrigger } from './Toast';
import { CreditUsageIndicator } from './CreditUsageIndicator';

export type DashboardSectionId =
  | 'overview'
  | 'projects'
  | 'assets'
  | 'analytics'
  | 'developer'
  | 'team'
  | 'settings';

export interface DashboardNavItem {
  id: DashboardSectionId | 'ai-studio' | 'seo-audit';
  label: string;
  icon: React.ElementType;
  badge?: string;
  href?: string;
}

export interface DashboardShellProps {
  activeSection: DashboardSectionId;
  onSelectSection: (section: DashboardSectionId) => void;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  creditUsed?: number;
  creditLimit?: number;
  planName?: string;
  onOpenCommandPalette?: () => void;
  children: React.ReactNode;
}

/**
 * 02 · Collapsible Application Sidebar & 04 · Dashboard Shell
 * Adapted from 21st.dev `sidebar` and `dashboard-with-collapsible-sidebar` patterns.
 * Provides an expandable/collapsible desktop icon rail (68px <-> 256px), mobile drawer,
 * Credit Usage Indicator, and unified top workspace header.
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({
  activeSection,
  onSelectSection,
  title,
  subtitle,
  headerActions,
  creditUsed,
  creditLimit,
  planName,
  onOpenCommandPalette,
  children,
}) => {
  const navigate = useNavigate();
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isExpanded = isPinnedExpanded || isHovered;

  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Workspace', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Layers, badge: '10-Stage' },
    { id: 'ai-studio', label: 'AI Studio', icon: Sparkles, badge: 'Omnia', href: '/ai' },
    { id: 'assets', label: 'Assets & Upload', icon: FolderOpen },
    { id: 'analytics', label: 'Telemetry Charts', icon: BarChart3 },
    { id: 'developer', label: 'API & Developer', icon: KeyRound },
    { id: 'team', label: 'Team & Governance', icon: Users },
    { id: 'seo-audit', label: 'SEO Crawler 🔒', icon: ShieldCheck, href: '/seo-diagnostics' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (item: DashboardNavItem) => {
    if (item.href) {
      navigate(item.href);
      setMobileDrawerOpen(false);
      return;
    }
    onSelectSection(item.id as DashboardSectionId);
    setMobileDrawerOpen(false);
  };

  const renderSidebarContent = (forceExpanded: boolean) => {
    const showLabels = forceExpanded || isExpanded;

    return (
      <div className="h-full flex flex-col justify-between bg-[#090909] border-r border-white/[0.08] select-none overflow-hidden">
        {/* Top Brand & Collapse Toggle */}
        <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 min-w-0 focus:outline-none"
            title="Return to VIZRA Homepage"
          >
            <div className="shrink-0">
              <VizraLogo size={24} />
            </div>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-w-0"
              >
                <span className="text-sm font-bold tracking-tight text-white block leading-none">
                  VIZRA
                </span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mt-0.5 truncate">
                  Studio Console
                </span>
              </motion.div>
            )}
          </Link>

          {!forceExpanded && (
            <button
              type="button"
              onClick={() => setIsPinnedExpanded((prev) => !prev)}
              className="hidden md:flex p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0"
              aria-label={isPinnedExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              title={isPinnedExpanded ? 'Collapse sidebar rail' : 'Pin sidebar expanded'}
            >
              {isPinnedExpanded ? (
                <PanelLeftClose size={15} />
              ) : (
                <PanelLeftOpen size={15} />
              )}
            </button>
          )}

          {forceExpanded && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white"
              aria-label="Close mobile navigation drawer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          aria-label="Workspace Sidebar Navigation"
          className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeSection && !item.href;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                title={!showLabels ? item.label : undefined}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-[#171717] text-white border border-white/[0.1] shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    size={16}
                    className={`shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#EB3B2D]'
                        : 'text-neutral-400 group-hover:text-white'
                    }`}
                  />
                  {showLabels && (
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  )}
                </div>

                {showLabels && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0 ${
                      item.id === 'ai-studio'
                        ? 'bg-[#DC2626]/20 text-[#EB3B2D] border border-[#DC2626]/30'
                        : 'bg-[#111111] text-neutral-400 border border-white/[0.06]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Credit Usage Indicator & Studio Link */}
        <div className="p-3 border-t border-white/[0.06] bg-[#111111]/60 shrink-0 space-y-2.5 flex flex-col items-center">
          {showLabels ? (
            <CreditUsageIndicator
              variant="sidebar"
              usedOverride={creditUsed}
              limitOverride={creditLimit}
              planNameOverride={planName}
              className="w-full"
            />
          ) : (
            <CreditUsageIndicator
              variant="rail"
              usedOverride={creditUsed}
              limitOverride={creditLimit}
              planNameOverride={planName}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#090909] text-white flex overflow-hidden font-inter">
      {/* Desktop Collapsible Sidebar Rail */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 256 : 68 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => {
          if (!isPinnedExpanded) setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        className="hidden md:block h-screen shrink-0 z-30"
      >
        {renderSidebarContent(false)}
      </motion.aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-64 h-full"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Workspace Header */}
        <header className="h-16 px-4 sm:px-8 border-b border-white/[0.08] bg-[#090909]/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 z-20 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#111111] border border-white/[0.08] text-neutral-300 hover:text-white"
              aria-label="Open navigation drawer"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-white truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-neutral-400 truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <CreditUsageIndicator
              variant="header"
              usedOverride={creditUsed}
              limitOverride={creditLimit}
              planNameOverride={planName}
            />
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-[#171717] border border-white/[0.08] text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Open Command Palette (⌘K)"
              >
                <Command size={12} className="text-[#EB3B2D]" />
                <span>Command</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#090909] border border-white/[0.08] rounded text-neutral-400">
                  ⌘K
                </kbd>
              </button>
            )}
            {headerActions}
            <NotificationCenterTrigger />
            <UserMenu />
          </div>
        </header>

        {/* Scrollable Dashboard Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
