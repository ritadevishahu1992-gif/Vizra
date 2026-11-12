import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { VizraLogo } from './VizraLogo';
import {
  Menu,
  X,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Cpu,
  ShieldCheck,
  Compass,
  Layers,
  BookOpen,
  ArrowUpRight,
  Wrench,
  CreditCard,
  Info,
  Mail,
} from 'lucide-react';
import { UserMenu } from './auth/UserMenu';
import { NotificationCenterTrigger } from './ui/Toast';
import { LiquidGlassToggle } from './ui/LiquidGlassToggle';

export interface NavbarProps {
  onLaunchOmnia?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLaunchOmnia }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformMenuOpen, setPlatformMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleLaunch = () => {
    if (onLaunchOmnia) {
      onLaunchOmnia();
    } else {
      navigate('/ai');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setPlatformMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPlatformMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const platformDropdownItems = [
    {
      label: 'Omnia 1.0 AI Studio',
      desc: 'Grounded multimodal reasoning, Lyria 3 music, and 10-stage creative workflows.',
      href: '/ai',
      icon: Sparkles,
      tag: 'Live Workspace',
    },
    {
      label: 'Features Overview',
      desc: 'Core architecture, 5-step Idea-to-Finish pipeline, and persistent project context.',
      href: '/features',
      icon: Layers,
      tag: 'Architecture',
    },
    {
      label: 'AI Tools & Create Hub',
      desc: 'Write, Design, Image, Code, Presentation, Research, and Analyze tools.',
      href: '/tools',
      icon: Wrench,
      tag: '8 Disciplines',
    },
    {
      label: 'Creative Studio & Roadmap',
      desc: '60fps kinetic motion engines, GLSL shader synthesis, and upcoming prototypes.',
      href: '/studio',
      icon: Cpu,
      tag: 'Engines',
    },
    {
      label: 'Workspace & Developer Console',
      desc: 'Unified dashboard for projects, assets, D3 usage analytics, and API keys.',
      href: '/workspace',
      icon: LayoutDashboard,
      tag: 'Dashboard',
    },
  ];

  const primaryLinks = [
    { label: 'Features', href: '/features', icon: Layers },
    { label: 'AI Tools', href: '/tools', icon: Wrench },
    { label: 'Studio', href: '/studio', icon: Cpu },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Pricing', href: '/pricing', icon: CreditCard },
    { label: 'Docs', href: '/docs', icon: BookOpen },
    { label: 'About', href: '/about', icon: Info },
    { label: 'Contact', href: '/contact', icon: Mail },
  ];

  const isRouteActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const isPlatformRouteActive = ['/ai', '/features', '/tools', '/studio', '/workspace', '/seo-diagnostics'].some(
    (path) => isRouteActive(path)
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 select-none ${
        isScrolled
          ? 'bg-[#090909]/92 backdrop-blur-xl border-b border-white/[0.08]'
          : 'bg-[#090909]/75 backdrop-blur-md border-b border-white/[0.05]'
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4"
        aria-label="Main Navigation"
      >
        {/* Left Zone: Brand Lockup & Desktop Links */}
        <div className="flex items-center gap-6 xl:gap-8 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] rounded-sm shrink-0"
          >
            <VizraLogo size={24} />
            <span className="font-display text-lg font-bold tracking-tight text-white transition-opacity group-hover:opacity-90 whitespace-nowrap">
              Vizra
            </span>
          </Link>

          {/* Desktop Navigation Menu */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* Platform Dropdown Trigger */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setPlatformMenuOpen((prev) => !prev)}
                onMouseEnter={() => setPlatformMenuOpen(true)}
                aria-expanded={platformMenuOpen}
                className={`px-3 py-1.5 text-xs xl:text-sm font-medium transition-colors duration-150 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  platformMenuOpen || isPlatformRouteActive
                    ? 'text-white bg-white/[0.05]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>Platform</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-150 ${
                    platformMenuOpen ? 'rotate-180 text-[#EB3B2D]' : 'text-neutral-500'
                  }`}
                />
              </button>

              <AnimatePresence>
                {platformMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    onMouseLeave={() => setPlatformMenuOpen(false)}
                    className="absolute left-0 mt-2 w-[420px] rounded-2xl bg-[#111111] border border-white/[0.1] shadow-2xl p-2.5 z-50"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center justify-between border-b border-white/[0.06] mb-1.5">
                      <span>VIZRA Platform Architecture</span>
                      <span className="text-[#EB3B2D]">Omnia 1.0</span>
                    </div>
                    <div className="space-y-1">
                      {platformDropdownItems.map((item) => {
                        const Icon = item.icon;
                        const active = isRouteActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setPlatformMenuOpen(false)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors group ${
                              active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-xl border transition-colors shrink-0 mt-0.5 ${
                                active
                                  ? 'bg-[#DC2626]/15 border-[#DC2626]/50 text-[#EB3B2D]'
                                  : 'bg-[#171717] border-white/[0.08] text-neutral-300 group-hover:text-[#EB3B2D] group-hover:border-[#DC2626]/40'
                              }`}
                            >
                              <Icon size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display text-xs font-semibold text-white group-hover:text-[#EB3B2D] transition-colors">
                                  {item.label}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-400">
                                  {item.tag}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct Top-Level Page Links with Active Indicators */}
            {primaryLinks.map((link) => {
              const active = isRouteActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-3 py-1.5 text-xs xl:text-sm font-medium transition-colors duration-150 rounded-lg whitespace-nowrap ${
                    active
                      ? 'text-white bg-white/[0.05]'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{link.label}</span>
                  {active && (
                    <span className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full bg-[#EB3B2D]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Zone: Theme Toggle, Notifications, User Menu, Primary CTA & Mobile Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <LiquidGlassToggle size="sm" className="hidden sm:inline-flex" />
          <NotificationCenterTrigger />
          <UserMenu />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLaunch}
            className="relative px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-display font-semibold rounded-xl bg-white text-black hover:bg-neutral-200 transition-all duration-150 shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>Launch Omnia</span>
            <ArrowUpRight size={14} className="text-[#DC2626]" />
          </motion.button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-400 hover:text-white focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-[#090909]/98 border-b border-white/[0.08] px-6 py-6 space-y-5 overflow-y-auto max-h-[calc(100vh-4rem)]"
          >
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-2 pb-1">
                Pages & Navigation
              </div>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                    : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>Home</span>
                {location.pathname === '/' && (
                  <span className="text-[10px] font-mono text-[#EB3B2D]">Active</span>
                )}
              </Link>
              {primaryLinks.map((link) => {
                const active = isRouteActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                        : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={15} className={active ? 'text-[#EB3B2D]' : 'text-neutral-500'} />
                      <span>{link.label}</span>
                    </span>
                    {active && (
                      <span className="text-[10px] font-mono text-[#EB3B2D]">Active</span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-1 pt-3 border-t border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-2 pb-1">
                Workspaces & Consoles
              </div>
              <Link
                to="/ai"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <span>Omnia 1.0 AI Studio</span>
                <span className="text-[10px] font-mono text-[#EB3B2D]">/ai</span>
              </Link>
              <Link
                to="/workspace"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <span>Workspace & Developer Console</span>
                <span className="text-[10px] font-mono text-neutral-500">/workspace</span>
              </Link>
              <Link
                to="/seo-diagnostics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <span>Technical SEO & Crawler Audit</span>
                <span className="text-[10px] font-mono text-neutral-500">Admin</span>
              </Link>
            </div>

            <div className="pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLaunch();
                }}
                className="w-full py-3 rounded-xl bg-white text-black font-display font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Omnia 1.0 Workspace</span>
                <ArrowUpRight size={15} className="text-[#DC2626]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
