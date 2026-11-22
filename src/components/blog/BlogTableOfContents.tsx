import React, { useEffect, useState } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

export interface TocEntry {
  id: string;
  heading: string;
  level: 2 | 3;
}

interface BlogTableOfContentsProps {
  entries: TocEntry[];
  variant: 'desktop' | 'mobile';
}

export const BlogTableOfContents: React.FC<BlogTableOfContentsProps> = ({
  entries,
  variant,
}) => {
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? '');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (entries.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY + 140;
      let current = entries[0].id;
      for (const entry of entries) {
        const el = document.getElementById(entry.id);
        if (el && el.offsetTop <= scrollY) {
          current = entry.id;
        }
      }
      setActiveId(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [entries]);

  const handleJump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 104;
      window.scrollTo({ top, behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
      setActiveId(id);
    }
    setMobileOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className="lg:hidden rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left text-xs font-mono uppercase tracking-[0.14em] text-neutral-700 dark:text-neutral-300"
        >
          <span className="inline-flex items-center gap-2">
            <List size={14} className="text-[#EB3B2D]" />
            <span>Table of Contents ({entries.length})</span>
          </span>
          {mobileOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {mobileOpen && (
          <nav
            aria-label="Article table of contents"
            className="px-4 pb-4 pt-1 border-t border-neutral-200 dark:border-white/[0.06] max-h-80 overflow-y-auto"
          >
            <ol className="space-y-2 text-xs">
              {entries.map((entry) => {
                const isActive = activeId === entry.id;
                return (
                  <li
                    key={entry.id}
                    className={entry.level === 3 ? 'pl-3.5' : ''}
                  >
                    <a
                      href={`#${entry.id}`}
                      onClick={(e) => handleJump(e, entry.id)}
                      className={`block py-0.5 leading-snug transition-colors ${
                        isActive
                          ? 'text-[#EB3B2D] font-medium'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                      }`}
                    >
                      {entry.heading}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
    );
  }

  return (
    <aside
      aria-label="Table of contents"
      className="hidden lg:block sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-2"
    >
      <div className="pb-3 mb-3 border-b border-neutral-200 dark:border-white/[0.08]">
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
          <List size={13} className="text-[#EB3B2D]" />
          <span>Contents</span>
        </div>
      </div>
      <nav aria-label="Article sections">
        <ol className="space-y-2.5 text-[13px] leading-snug">
          {entries.map((entry) => {
            const isActive = activeId === entry.id;
            return (
              <li
                key={entry.id}
                className={entry.level === 3 ? 'pl-3.5 text-[12px]' : ''}
              >
                <a
                  href={`#${entry.id}`}
                  onClick={(e) => handleJump(e, entry.id)}
                  className={`block transition-colors ${
                    isActive
                      ? 'text-[#EB3B2D] font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {entry.heading}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
};
