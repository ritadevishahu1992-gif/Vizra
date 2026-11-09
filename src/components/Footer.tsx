import React from 'react';
import { Link } from 'react-router-dom';
import { VizraLogo } from './VizraLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-neutral-900 bg-black text-neutral-400 py-12 px-8 md:px-28">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-xs">
        {/* Zone 1: Wordmark & Brand Identity */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <VizraLogo size={22} />
            <span className="text-base font-bold tracking-tight text-white">
              Vizra
            </span>
          </div>
          <p className="text-neutral-500 text-[11px] max-w-xs">
            AI creative studio and technology platform powered by Omnia 1.0.
          </p>
        </div>

        {/* Zone 2: Navigation Links */}
        <div className="flex flex-wrap items-center gap-6 text-neutral-400">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/explore" className="hover:text-white transition-colors">
            Explore
          </Link>
          <Link to="/ai" className="hover:text-white text-neutral-300 flex items-center gap-1 transition-colors">
            <span>Omnia AI</span>
            <span className="w-1 h-1 rounded-full bg-[#eb3b2d]" />
          </Link>
          <a href="#studio" className="hover:text-white transition-colors">
            Studio
          </a>
          <a href="#coming-soon" className="hover:text-white transition-colors">
            Roadmap
          </a>
          <a href="#philosophy" className="hover:text-white transition-colors">
            Philosophy
          </a>
          <a href="#early-access" className="hover:text-white transition-colors">
            Early Access
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* Zone 3: Status & Copyright */}
        <div className="flex flex-col md:items-end gap-1.5 font-mono text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
            <span className="text-neutral-300">Omnia 1.0 Core Active</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Vizra Technologies Inc.</span>
        </div>
      </div>
    </footer>
  );
};
