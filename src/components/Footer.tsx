import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { VizraLogo } from './VizraLogo';
import { ArrowUpRight } from 'lucide-react';

interface FooterLinkItem {
  label: string;
  to?: string;
  href?: string;
}

const FOOTER_SECTIONS: { title: string; links: FooterLinkItem[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Features Overview', to: '/features' },
      { label: 'Explore Showcase', to: '/explore' },
      { label: 'Omnia 1.0 AI Studio', to: '/ai' },
      { label: 'Workspace Console', to: '/workspace' },
    ],
  },
  {
    title: 'Products / Tools',
    links: [
      { label: 'AI Tools & Create Hub', to: '/tools' },
      { label: 'Creative Studio Engines', to: '/studio' },
      { label: 'Coming Soon Roadmap', to: '/studio?section=roadmap' },
      { label: 'Pricing & Plans', to: '/pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', to: '/docs' },
      { label: 'Developer API Reference', to: '/docs?section=api' },
      { label: 'Project Context Guide', to: '/docs?section=workflows' },
      { label: 'SEO & Crawler Audit', to: '/seo-diagnostics' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About VIZRA', to: '/about' },
      { label: 'Philosophy & Creed', to: '/about?section=philosophy' },
      { label: 'Contact & Early Access', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Security & SSRF Governance', to: '/docs?section=security' },
    ],
  },
  {
    title: 'Social Media',
    links: [
      { label: 'GitHub', href: 'https://github.com' },
      { label: 'X (Twitter)', href: 'https://x.com' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com' },
      { label: 'YouTube', href: 'https://www.youtube.com' },
    ],
  },
];

export const Footer: React.FC = () => {
  const location = useLocation();

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
                    if (item.to) {
                      const baseRoute = item.to.split('?')[0];
                      const isActive =
                        location.pathname === baseRoute &&
                        (!item.to.includes('?') ||
                          location.search === `?${item.to.split('?')[1]}`);

                      return (
                        <li key={item.label}>
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

        {/* Bottom Copyright & Route Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-3">
            <span>&copy; {new Date().getFullYear()} Vizra Technologies Inc. All rights reserved.</span>
            <span aria-hidden="true">·</span>
            <Link to="/privacy" className="hover:text-neutral-300 transition-colors">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-neutral-300 transition-colors">
              Terms
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/docs" className="hover:text-neutral-300 transition-colors">
              Documentation
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
