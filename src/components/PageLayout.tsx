import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export interface PageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Sync route-level SEO metadata and scroll position
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute(attr, value);
      }
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta(
      'meta[property="og:url"]',
      'content',
      `${window.location.origin}${location.pathname}`
    );
    setMeta(
      'link[rel="canonical"]',
      'href',
      `${window.location.origin}${location.pathname}`
    );

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
  }, [title, description, location.pathname, location.search]);

  return (
    <div
      className={`min-h-screen bg-[#090909] text-white font-inter selection:bg-[#eb3b2d] selection:text-white relative overflow-x-clip flex flex-col justify-between ${className}`}
    >
      <Navbar onLaunchOmnia={() => navigate('/ai')} />
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
    </div>
  );
};
