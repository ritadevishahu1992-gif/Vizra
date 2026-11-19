import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { VizraLogo } from './VizraLogo';
import { ArrowUpRight, Sliders } from 'lucide-react';
import { openCookiePreferencesModal } from './ui/CookieConsent';

interface FooterLinkItem {
  label: string;
  to?: string;
  href?: string;
  onClick?: () => void;
}

const FOOTER_SECTIONS: { title: string; links: FooterLinkItem[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Features Overview', to: '/features' },
      { label: 'Explore Showcase', to: '/explore' },
      { label: 'Pricing & Plans', to: '/pricing' },
    ],
  },
  {
    title: 'Products / Tools',
    links: [
      { label: 'AI Tools & Create Hub', to: '/tools' },
      { label: 'Creative Studio Engines', to: '/studio' },
      { label: 'Coming Soon Roadmap', to: '/studio?section=roadmap' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', to: '/docs' },
      { label: 'Blog & Updates', to: '/blog' },
      { label: 'Security & Governance', to: '/docs?section=security' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About VIZRA', to: '/about' },
      { label: 'Philosophy & Creed', to: '/about?section=philosophy' },
      { label: 'Contact / Privacy Requests', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms & Conditions', to: '/terms-and-conditions' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Cookie Policy', to: '/cookie-policy' },
      {
        label: 'Manage Cookie Preferences',
        onClick: () => openCookiePreferencesModal('Footer Settings'),
      },
      { label: 'Contact / Privacy Requests', to: '/contact' },
    ],
  },
  {
    title: 'Ecosystem',
    links: [
      { label: 'Omnia AI Workspace', to: '/ai' },
      { label: 'Studio Showcase', to: '/explore' },
      { label: 'System Status & Docs', to: '/docs' },
      { label: 'Studio Inquiries', to: '/contact' },
    ],
  },
];

export const Footer: React.FC = () => {
  const location = useLocation();
  const legalEntityDisplay =
    (import.meta as any).env?.VITE_LEGAL_ENTITY_NAME || 'VIZRA AI Creative Studio';

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#090909] text-neutral-400 pt-16 pb-12 px-6 sm:px-10 lg:px-16 select-none">
      <div className="max-w-7xl mx-auto">
        {/* Top Row: Brand Summary + 6 Structured Link Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-14 border-b border-white/[0.06]">
          {/* Brand Column */}
          <div className="lg:col-span-3 space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] rounded-sm"
            >
              <VizraLogo size={24} />
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Vizra
              </span>
            </Link>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
              An intelligent AI creative studio and multimodal workflow platform powered by Omnia 1.0. Think, create, and build in one unified workspace.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-neutral-500">
              <span>Omnia 1.0 Core</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#EB3B2D]">Production Ready</span>
            </div>
          </div>

          {/* 6 Link Categories Grid */}
          <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-white">
                  {section.title}
                </h3>
                <ul className="space-y-2.5 text-xs">
                  {section.links.map((item) => {
                    if (item.onClick) {
                      return (
                        <li key={item.label}>
                          <button
                            type="button"
                            onClick={item.onClick}
                            className="text-left text-neutral-400 hover:text-white transition-colors leading-snug cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] rounded-sm"
                          >
                            {item.label}
                          </button>
                        </li>
                      );
                    }

                    if (item.to) {
                      const baseRoute = item.to.split('?')[0];
                      const isActive =
                        location.pathname === baseRoute &&
                        (!item.to.includes('?') ||
                          location.search === `?${item.to.split('?')[1]}`);

                      return (
                        <li key={`${section.title}-${item.label}`}>
                          <Link
                            to={item.to}
                            className={`transition-colors block leading-snug ${
                              isActive
                                ? 'text-[#EB3B2D] font-medium'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    }

                    return (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1 leading-snug"
                        >
                          <span>{item.label}</span>
                          <ArrowUpRight size={11} className="text-neutral-600" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Copyright & Persistent Privacy/Cookie Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-3">
            <span>&copy; {new Date().getFullYear()} {legalEntityDisplay}. All rights reserved.</span>
            <span aria-hidden="true">·</span>
            <Link to="/terms-and-conditions" className="hover:text-neutral-300 transition-colors">
              Terms &amp; Conditions
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/privacy-policy" className="hover:text-neutral-300 transition-colors">
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/cookie-policy" className="hover:text-neutral-300 transition-colors">
              Cookie Policy
            </Link>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => openCookiePreferencesModal('Footer Settings')}
              className="hover:text-white text-neutral-400 transition-colors inline-flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] rounded-sm"
            >
              <Sliders size={11} className="text-[#EB3B2D]" />
              <span>Manage Cookie Preferences</span>
            </button>
            <span aria-hidden="true">·</span>
            <Link to="/blog" className="hover:text-neutral-300 transition-colors">
              Blog
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/contact" className="hover:text-neutral-300 transition-colors">
              Contact / Privacy Requests
            </Link>
          </div>

          <div className="font-mono text-[11px] text-neutral-500">
            VIZRA AI Creative Studio · Multi-Page Architecture
          </div>
        </div>
      </div>
    </footer>
  );
};
