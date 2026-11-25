import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { VizraLogo } from './VizraLogo';
import {
  Menu,
  X,
  ChevronDown,
  Cpu,
  Compass,
  Layers,
  BookOpen,
  ArrowUpRight,
  Wrench,
  CreditCard,
  Info,
  Mail,
  Newspaper,
} from 'lucide-react';
import { UserMenu } from './auth/UserMenu';
import { NotificationCenterTrigger } from './ui/Toast';
import { LiquidGlassToggle } from './ui/LiquidGlassToggle';

export interface NavbarProps {
  onLaunchOmnia?: () => void;
}

type OpenDropdown = 'platform' | 'company' | null;

export const Navbar: React.FC<NavbarProps> = ({ onLaunchOmnia }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

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
    setOpenDropdown(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const platformDropdownItems = [
    {
      label: 'Features',
      desc: 'Core architecture, 5-step Idea-to-Finish pipeline, and persistent memory.',
      href: '/features',
      icon: Layers,
      tag: 'Architecture',
    },
    {
      label: 'AI Tools',
      desc: 'Write, Design, Image, Code, Presentation, Research, and Analyze workflows.',
      href: '/tools',
      icon: Wrench,
      tag: '8 Disciplines',
    },
    {
      label: 'Creative Studio',
      desc: '60fps kinetic motion engines, GLSL shader synthesis, and R&D roadmap.',
      href: '/studio',
      icon: Cpu,
      tag: 'Engines',
    },
    {
      label: 'Explore Showcase',
      desc: 'Interactive 3D perspective gallery with curated AI visuals and prompts.',
      href: '/explore',
      icon: Compass,
      tag: '3D Gallery',
    },
  ];

  const companyDropdownItems = [
    {
      label: 'About Vizra',
      desc: 'Studio philosophy, creative creed, and the team behind Omnia 1.0.',
      href: '/about',
      icon: Info,
    },
    {
      label: 'Contact & Access',
      desc: 'Enterprise onboarding, custom studio inquiries, and support.',
      href: '/contact',
      icon: Mail,
    },
  ];

  const directNavLinks = [
    { label: 'Pricing', href: '/pricing', icon: CreditCard },
    { label: 'Docs', href: '/docs', icon: BookOpen },
    { label: 'Blog', href: '/blog', icon: Newspaper },
  ];

  const isRouteActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const isPlatformRouteActive = platformDropdownItems.some((item) => isRouteActive(item.href));
  const isCompanyRouteActive = companyDropdownItems.some((item) => isRouteActive(item.href));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 select-none ${
        isScrolled
          ? 'bg-[#09090B]/92 backdrop-blur-xl border-b border-white/[0.08]'
          : 'bg-[#09090B]/70 backdrop-blur-md border-b border-white/[0.05]'
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4"
        aria-label="Main Navigation"
      >
        {/* Left Zone: Brand Lockup & Consolidated Desktop Navigation */}
        <div className="flex items-center gap-7 lg:gap-9 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] rounded-md shrink-0"
          >
            <VizraLogo size={23} />
            <span className="font-display text-[17px] font-bold tracking-tight text-white transition-opacity group-hover:opacity-90 whitespace-nowrap">
              Vizra
            </span>
          </Link>

          {/* Desktop Navigation: 5 Clean Top-Level Destinations */}
          <div ref={navRef} className="hidden lg:flex items-center gap-1">
            {/* Platform Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('platform')}
              onMouseLeave={() => setOpenDropdown((prev) => (prev === 'platform' ? null : prev))}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown((prev) => (prev === 'platform' ? null : 'platform'))
                }
                aria-expanded={openDropdown === 'platform'}
                aria-haspopup="menu"
                className={`relative h-9 px-3 text-[13px] font-medium transition-colors duration-150 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                  openDropdown === 'platform' || isPlatformRouteActive
                    ? 'text-white bg-white/[0.06]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>Platform</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-150 ${
                    openDropdown === 'platform'
                      ? 'rotate-180 text-[#EB3B2D]'
                      : 'text-neutral-500'
                  }`}
                />
                {isPlatformRouteActive && (
                  <span className="absolute bottom-1 left-3 right-3 h-[1.5px] rounded-full bg-[#EB3B2D]" />
                )}
              </button>

              <AnimatePresence>
                {openDropdown === 'platform' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    role="menu"
                    className="absolute left-0 pt-2 w-[390px] z-50"
                  >
                    <div className="rounded-xl bg-[#111114] border border-white/[0.1] shadow-2xl p-2">
                      <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-500 flex items-center justify-between border-b border-white/[0.06] mb-1">
                        <span>Vizra Platform</span>
                        <span className="text-[#EB3B2D]">Omnia 1.0</span>
                      </div>
                      <div className="space-y-0.5">
                        {platformDropdownItems.map((item) => {
                          const Icon = item.icon;
                          const active = isRouteActive(item.href);
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              role="menuitem"
                              onClick={() => setOpenDropdown(null)}
                              className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                                active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg border transition-colors shrink-0 mt-0.5 ${
                                  active
                                    ? 'bg-[#DC2626]/15 border-[#DC2626]/45 text-[#EB3B2D]'
                                    : 'bg-[#17171C] border-white/[0.08] text-neutral-400 group-hover:text-[#EB3B2D] group-hover:border-[#DC2626]/35'
                                }`}
                              >
                                <Icon size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-display text-xs font-semibold text-white group-hover:text-white transition-colors">
                                    {item.label}
                                  </span>
                                  <span className="text-[10px] font-mono text-neutral-500">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct Top-Level Links: Pricing, Docs, Blog */}
            {directNavLinks.map((link) => {
              const active = isRouteActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative h-9 px-3 text-[13px] font-medium transition-colors duration-150 rounded-lg inline-flex items-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                    active
                      ? 'text-white bg-white/[0.06]'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{link.label}</span>
                  {active && (
                    <span className="absolute bottom-1 left-3 right-3 h-[1.5px] rounded-full bg-[#EB3B2D]" />
                  )}
                </Link>
              );
            })}

            {/* Company Dropdown: About & Contact */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('company')}
              onMouseLeave={() => setOpenDropdown((prev) => (prev === 'company' ? null : prev))}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown((prev) => (prev === 'company' ? null : 'company'))
                }
                aria-expanded={openDropdown === 'company'}
                aria-haspopup="menu"
                className={`relative h-9 px-3 text-[13px] font-medium transition-colors duration-150 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                  openDropdown === 'company' || isCompanyRouteActive
                    ? 'text-white bg-white/[0.06]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>Company</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-150 ${
                    openDropdown === 'company'
                      ? 'rotate-180 text-[#EB3B2D]'
                      : 'text-neutral-500'
                  }`}
                />
                {isCompanyRouteActive && (
                  <span className="absolute bottom-1 left-3 right-3 h-[1.5px] rounded-full bg-[#EB3B2D]" />
                )}
              </button>

              <AnimatePresence>
                {openDropdown === 'company' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    role="menu"
                    className="absolute left-0 pt-2 w-[290px] z-50"
                  >
                    <div className="rounded-xl bg-[#111114] border border-white/[0.1] shadow-2xl p-2 space-y-0.5">
                      {companyDropdownItems.map((item) => {
                        const Icon = item.icon;
                        const active = isRouteActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            role="menuitem"
                            onClick={() => setOpenDropdown(null)}
                            className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
                              active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg border transition-colors shrink-0 mt-0.5 ${
                                active
                                  ? 'bg-[#DC2626]/15 border-[#DC2626]/45 text-[#EB3B2D]'
                                  : 'bg-[#17171C] border-white/[0.08] text-neutral-400 group-hover:text-[#EB3B2D] group-hover:border-[#DC2626]/35'
                              }`}
                            >
                              <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-display text-xs font-semibold text-white block">
                                {item.label}
                              </span>
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
          </div>
        </div>

        {/* Right Zone: Harmonized Utility Controls, Auth & Restrained Workspace Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            <LiquidGlassToggle size="sm" />
            <NotificationCenterTrigger />
          </div>

          <div className="hidden sm:block h-4 w-px bg-white/[0.1] mx-1" aria-hidden="true" />

          <UserMenu />

          <button
            type="button"
            onClick={handleLaunch}
            className="h-9 px-2.5 sm:px-3.5 text-xs sm:text-[13px] font-display font-medium rounded-lg bg-[#16161B] hover:bg-[#1E1E25] text-white border border-white/[0.14] hover:border-[#EB3B2D]/50 transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
          >
            <span>Launch Omnia</span>
            <ArrowUpRight size={14} className="text-[#EB3B2D]" />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
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
            transition={{ duration: 0.18 }}
            className="lg:hidden bg-[#09090B]/98 backdrop-blur-xl border-b border-white/[0.08] px-5 py-5 space-y-5 overflow-y-auto max-h-[calc(100vh-4rem)]"
          >
            {/* Mobile Utilities Row (Theme + Notifications on xs screens) */}
            <div className="flex sm:hidden items-center justify-between px-3 py-2.5 rounded-xl bg-[#111114] border border-white/[0.08]">
              <span className="text-xs font-medium text-neutral-300">Appearance &amp; Alerts</span>
              <div className="flex items-center gap-2">
                <LiquidGlassToggle size="sm" />
                <NotificationCenterTrigger />
              </div>
            </div>

            {/* Platform Group */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-3 pb-1">
                Platform
              </div>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
              {platformDropdownItems.map((item) => {
                const active = isRouteActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                        : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={15} className={active ? 'text-[#EB3B2D]' : 'text-neutral-500'} />
                      <span>{item.label}</span>
                    </span>
                    {active && (
                      <span className="text-[10px] font-mono text-[#EB3B2D]">Active</span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Resources Group */}
            <div className="space-y-1 pt-3 border-t border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-3 pb-1">
                Resources
              </div>
              {directNavLinks.map((link) => {
                const active = isRouteActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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

            {/* Company Group */}
            <div className="space-y-1 pt-3 border-t border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-3 pb-1">
                Company
              </div>
              {companyDropdownItems.map((item) => {
                const active = isRouteActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                        : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={15} className={active ? 'text-[#EB3B2D]' : 'text-neutral-500'} />
                      <span>{item.label}</span>
                    </span>
                    {active && (
                      <span className="text-[10px] font-mono text-[#EB3B2D]">Active</span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Legal & Launch Action */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 text-xs text-neutral-500">
                <Link
                  to="/terms-and-conditions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-neutral-200 transition-colors"
                >
                  Terms
                </Link>
                <Link
                  to="/privacy-policy"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-neutral-200 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  to="/cookie-policy"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-neutral-200 transition-colors"
                >
                  Cookies
                </Link>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLaunch();
                }}
                className="w-full h-11 rounded-xl bg-white text-[#09090B] hover:bg-neutral-200 font-display font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Launch Omnia 1.0</span>
                <ArrowUpRight size={15} className="text-[#DC2626]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
