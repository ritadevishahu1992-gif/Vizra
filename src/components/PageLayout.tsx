import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { LiquidGlassNavbar } from './ui/LiquidGlassNavbar';
import {
  resolveRouteSeoPayload,
  applySeoToDocument,
} from '../seo/routeMetadata';

export interface PageLayoutProps {
  title: string;
  description: string;
  canonicalPath?: string | null;
  noindex?: boolean;
  children: React.ReactNode;
  className?: string;
  hideBottomNav?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  canonicalPath,
  noindex,
  children,
  className = '',
  hideBottomNav = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Sync route-level SEO metadata, canonical URL, robots directives, JSON-LD, and scroll position
  useEffect(() => {
    const seoPayload = resolveRouteSeoPayload(location.pathname, {
      title,
      description,
      canonicalPath,
      noindex,
    });
    applySeoToDocument(seoPayload);

    const params = new URLSearchParams(location.search);
    const targetSection = params.get('section') || params.get('tab');
    if (targetSection) {
      const targetEl = document.getElementById(targetSection);
      if (targetEl) {
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [title, description, canonicalPath, noindex, location.pathname, location.search]);

  return (
    <div
      className={`min-h-screen bg-neutral-50 dark:bg-[#090909] text-neutral-900 dark:text-white font-inter selection:bg-[#eb3b2d] selection:text-white relative overflow-x-clip flex flex-col justify-between ${className}`}
    >
      <Navbar onLaunchOmnia={() => navigate('/ai')} />
      <main className="flex-1 relative z-10 pb-16">{children}</main>
      <Footer />
      {!hideBottomNav && <LiquidGlassNavbar />}
    </div>
  );
};
