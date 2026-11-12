import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, ArrowLeft, Sparkles, Layers, BookOpen, Wrench } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

export const NotFoundPage: React.FC = () => {
  const location = useLocation();

  const quickDestinations = [
    {
      label: 'Features Overview',
      desc: 'Explore the 4 Pillars, 5-step pipeline, and Omnia 1.0 capabilities.',
      to: '/features',
      icon: Layers,
    },
    {
      label: 'AI Tools & Create Hub',
      desc: 'Launch specialized tools for writing, design, coding, and research.',
      to: '/tools',
      icon: Wrench,
    },
    {
      label: '3D Creative Showcase',
      desc: 'Enter the 3D perspective tunnel and inspect curated AI works.',
      to: '/explore',
      icon: Compass,
    },
    {
      label: 'Platform Documentation',
      desc: 'Read technical guides on model routing, workflows, and APIs.',
      to: '/docs',
      icon: BookOpen,
    },
  ];

  return (
    <PageLayout
      title="404 Page Not Found — Vizra AI Creative Studio"
      description="The requested route could not be found on the Vizra AI Creative Studio platform."
    >
      <section className="pt-32 md:pt-40 pb-24 px-6 sm:px-10 lg:px-16 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#111111] border border-white/[0.08] space-y-8">
          <div className="space-y-4 max-w-2xl">
            <div className="typo-eyebrow">HTTP 404 · Route Not Found</div>
            <h1 className="typo-page-title">
              This route does not exist in the Vizra workspace.
            </h1>
            <p className="typo-body">
              The path <code className="px-2 py-0.5 rounded bg-[#090909] border border-white/[0.1] font-mono text-xs text-[#EB3B2D]">{location.pathname}</code> could not be resolved. Choose a verified destination below or return home.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-white text-black font-display font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Return to Home</span>
              </Link>
              <Link
                to="/ai"
                className="px-5 py-2.5 rounded-xl bg-[#171717] hover:bg-neutral-800 border border-white/[0.12] text-white font-display font-semibold text-xs sm:text-sm transition-colors inline-flex items-center gap-2"
              >
                <Sparkles size={14} className="text-[#EB3B2D]" />
                <span>Launch Omnia 1.0</span>
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickDestinations.map((dest) => {
              const Icon = dest.icon;
              return (
                <Link
                  key={dest.to}
                  to={dest.to}
                  className="p-5 rounded-2xl bg-[#090909] border border-white/[0.06] hover:border-[#DC2626]/60 transition-colors group flex items-start gap-3.5"
                >
                  <div className="p-2.5 rounded-xl bg-[#141414] border border-white/[0.08] text-[#EB3B2D] shrink-0">
                    <Icon size={17} />
                  </div>
                  <div>
                    <h2 className="font-display text-sm font-semibold text-white group-hover:text-[#EB3B2D] transition-colors">
                      {dest.label}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      {dest.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
