import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { VizraLogo } from './VizraLogo';
import { Menu, X } from 'lucide-react';
import { UserMenu } from './auth/UserMenu';

interface NavbarProps {
  onLaunchOmnia: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLaunchOmnia }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/', isRoute: true },
    { label: 'Explore', href: '/explore', isRoute: true },
    { label: 'Omnia AI', href: '/ai', isRoute: true },
    { label: 'SEO Audit', href: '/seo-diagnostics', isRoute: true },
    { label: 'Studio', href: '/#studio', isRoute: false },
    { label: 'Roadmap', href: '/#coming-soon', isRoute: false },
    { label: 'About', href: '/#philosophy', isRoute: false },
    { label: 'Contact', href: '/#early-access', isRoute: false },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-md border-b border-neutral-900/80'
          : 'bg-transparent'
      }`}
    >
      <nav
        className="w-full px-8 md:px-28 py-4 flex items-center justify-between"
        aria-label="Main Navigation"
      >
        {/* Left Side: Brand Lockup & Navigation Links */}
        <div className="flex items-center gap-12 md:gap-20">
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] rounded-sm"
          >
            <VizraLogo size={26} />
            <span className="text-xl font-bold tracking-tight text-white transition-opacity group-hover:opacity-90">
              Vizra
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-3.5 py-1.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors duration-200 rounded-md hover:bg-white/[0.03] flex items-center gap-1.5"
                >
                  <span>{link.label}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3.5 py-1.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors duration-200 rounded-md hover:bg-white/[0.03]"
                >
                  {link.label}
                </a>
              )
            )}
          </div>
        </div>

        {/* Right Side: Launch Omnia & User Account Actions */}
        <div className="flex items-center gap-3">
          <UserMenu />

          <motion.button
            whileHover={{ scale: 1.02, opacity: 0.95 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLaunchOmnia}
            className="relative px-4 py-2 text-sm font-semibold rounded-lg bg-neutral-900 border border-neutral-800 text-white hover:border-neutral-700 hover:bg-neutral-800/80 transition-all duration-200 shadow-sm flex items-center gap-2 group cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-pulse" />
            <span className="whitespace-nowrap">Launch Omnia</span>
          </motion.button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white focus:outline-none"
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
            className="md:hidden bg-black/95 border-b border-neutral-900 px-8 py-6 space-y-4"
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-neutral-300 hover:text-white transition-colors py-1 flex items-center justify-between"
                  >
                    <span>{link.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[#eb3b2d]">
                      Open
                    </span>
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-neutral-300 hover:text-white transition-colors py-1"
                  >
                    {link.label}
                  </a>
                )
              )}
            </div>
            <div className="pt-4 border-t border-neutral-900">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchOmnia();
                }}
                className="w-full py-3 rounded-lg bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
                Launch Omnia 1.0 Studio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
