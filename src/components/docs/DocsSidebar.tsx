import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Search,
  X,
  ArrowUpRight,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import {
  DocArticle,
  DocSectionGroupId,
} from '../../data/publicDocs/types';
import {
  ALL_DOC_ARTICLES,
  DOC_SECTION_GROUPS,
  getArticlesBySection,
} from '../../data/publicDocs';

export interface DocsSidebarProps {
  activeSlug: string | null;
  activeSectionFilter?: DocSectionGroupId | null;
  onSelectHome: () => void;
  onSelectArticle: (slug: string) => void;
  onJumpToSection?: (sectionId: DocSectionGroupId) => void;
  variant?: 'sticky' | 'drawer';
  className?: string;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  activeSlug,
  activeSectionFilter = null,
  onSelectHome,
  onSelectArticle,
  onJumpToSection,
  variant = 'sticky',
  className = '',
}) => {
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [openSections, setOpenSections] = useState<
    Record<DocSectionGroupId, boolean>
  >({
    A: true,
    B: true,
    C: true,
    D: false,
    E: false,
    F: false,
    G: false,
    H: false,
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<
    Partial<Record<DocSectionGroupId, HTMLDivElement | null>>
  >({});
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const activeArticleSection = useMemo<DocSectionGroupId | null>(() => {
    if (activeSectionFilter) return activeSectionFilter;
    if (!activeSlug) return null;
    const match = ALL_DOC_ARTICLES.find((a) => a.slug === activeSlug);
    return match ? match.sectionId : null;
  }, [activeSlug, activeSectionFilter]);

  // Expand the section matching the currently viewed article
  useEffect(() => {
    if (!activeArticleSection) return;
    setOpenSections((prev) =>
      prev[activeArticleSection]
        ? prev
        : { ...prev, [activeArticleSection]: true }
    );
  }, [activeArticleSection]);

  // Keep active article visible inside the sticky scroll region
  useEffect(() => {
    if (!activeSlug || !activeItemRef.current) return;
    if (typeof activeItemRef.current.scrollIntoView === 'function') {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeSlug]);

  const normalizedQuery = sidebarQuery.trim().toLowerCase();

  // Map the 8 documentation sections (A-H) and their matching articles
  const mappedSections = useMemo(() => {
    return DOC_SECTION_GROUPS.map((group) => {
      const allGroupArticles = getArticlesBySection(group.id);
      const matchingArticles = !normalizedQuery
        ? allGroupArticles
        : allGroupArticles.filter(
            (art) =>
              art.title.toLowerCase().includes(normalizedQuery) ||
              art.summary.toLowerCase().includes(normalizedQuery) ||
              art.code.toLowerCase().includes(normalizedQuery) ||
              art.sectionTitle.toLowerCase().includes(normalizedQuery) ||
              (art.status && art.status.toLowerCase().includes(normalizedQuery))
          );

      return {
        group,
        totalCount: allGroupArticles.length,
        articles: matchingArticles,
      };
    });
  }, [normalizedQuery]);

  const totalMatchingArticles = useMemo(
    () => mappedSections.reduce((acc, item) => acc + item.articles.length, 0),
    [mappedSections]
  );

  const allExpanded = useMemo(
    () => DOC_SECTION_GROUPS.every((g) => openSections[g.id]),
    [openSections]
  );

  const handleToggleAll = () => {
    const nextValue = !allExpanded;
    setOpenSections({
      A: nextValue,
      B: nextValue,
      C: nextValue,
      D: nextValue,
      E: nextValue,
      F: nextValue,
      G: nextValue,
      H: nextValue,
    });
  };

  const toggleGroup = (id: DocSectionGroupId) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickJumpSection = (sectionId: DocSectionGroupId) => {
    setSidebarQuery('');
    setOpenSections((prev) => ({ ...prev, [sectionId]: true }));

    window.setTimeout(() => {
      const targetEl = sectionRefs.current[sectionId];
      if (targetEl && typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }, 30);

    if (onJumpToSection) {
      onJumpToSection(sectionId);
    }
  };

  const isStickyVariant = variant === 'sticky';

  const navClasses = isStickyVariant
    ? 'flex flex-col max-h-[calc(100vh-7.5rem)] rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] overflow-hidden'
    : 'flex flex-col h-full bg-neutral-50 dark:bg-[#090909]';

  const navContent = (
    <nav aria-label="Documentation Sections A–H" className={navClasses}>
      {/* Fixed Header: Home Link, A-H Section Quick Jump, Filter Input & Expand/Collapse */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-white/[0.08] space-y-3 shrink-0 bg-white dark:bg-[#111111]">
        <button
          type="button"
          onClick={onSelectHome}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-display font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] ${
            !activeSlug
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white'
              : 'bg-neutral-50 dark:bg-[#0B0B0B] border-neutral-200 dark:border-white/[0.08] text-neutral-800 dark:text-neutral-200 hover:border-[#EB3B2D]/60'
          }`}
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Home size={14} className="text-[#EB3B2D] shrink-0" />
            <span>Documentation Home</span>
          </span>
          <span className="font-mono tabular-nums text-[10px] opacity-75">
            {ALL_DOC_ARTICLES.length} topics
          </span>
        </button>

        {/* 8-Section Quick Jump Bar (A - H) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-wider px-0.5">
            <span>Sections A–H</span>
            <button
              type="button"
              onClick={handleToggleAll}
              className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-[#EB3B2D] dark:hover:text-[#EB3B2D] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#EB3B2D] rounded px-1"
              aria-label={
                allExpanded
                  ? 'Collapse all 8 documentation sections'
                  : 'Expand all 8 documentation sections'
              }
            >
              {allExpanded ? (
                <>
                  <ChevronsDownUp size={11} />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronsUpDown size={11} />
                  <span>Expand all</span>
                </>
              )}
            </button>
          </div>

          <div
            className="grid grid-cols-8 gap-1"
            role="group"
            aria-label="Quick jump between documentation sections A through H"
          >
            {DOC_SECTION_GROUPS.map((group) => {
              const isSectionCurrent = activeArticleSection === group.id;
              const isSectionOpen = openSections[group.id];
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleQuickJumpSection(group.id)}
                  title={`Section ${group.letter}: ${group.title}`}
                  aria-label={`Jump to Section ${group.letter}: ${group.title}`}
                  aria-pressed={isSectionCurrent}
                  className={`h-7 rounded-md font-mono text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] ${
                    isSectionCurrent
                      ? 'bg-[#EB3B2D] text-white'
                      : isSectionOpen
                      ? 'bg-neutral-100 dark:bg-white/[0.08] text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/[0.12] hover:border-[#EB3B2D]/60'
                      : 'bg-neutral-50 dark:bg-[#0B0B0B] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.06] hover:text-neutral-900 dark:hover:text-white hover:border-[#EB3B2D]/50'
                  }`}
                >
                  {group.letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline Sidebar Topic Filter */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
          />
          <input
            type="search"
            value={sidebarQuery}
            onChange={(e) => setSidebarQuery(e.target.value)}
            placeholder="Filter sections & articles…"
            aria-label="Filter documentation sidebar topics"
            className="w-full pl-8 pr-8 py-2 rounded-lg bg-neutral-50 dark:bg-[#0B0B0B] border border-neutral-200 dark:border-white/[0.08] focus:border-[#EB3B2D] focus:outline-none text-xs text-neutral-900 dark:text-white placeholder-neutral-500"
          />
          {sidebarQuery && (
            <button
              type="button"
              onClick={() => setSidebarQuery('')}
              aria-label="Clear sidebar filter"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Vertical 8-Section Navigation Menu */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto divide-y divide-neutral-200 dark:divide-white/[0.06]"
      >
        {totalMatchingArticles === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              No articles matched “{sidebarQuery}”.
            </p>
            <button
              type="button"
              onClick={() => setSidebarQuery('')}
              className="text-xs font-medium text-[#EB3B2D] hover:underline cursor-pointer"
            >
              Reset filter
            </button>
          </div>
        ) : (
          mappedSections.map(({ group, totalCount, articles }) => {
            if (normalizedQuery && articles.length === 0) return null;

            const isOpen = Boolean(normalizedQuery) || openSections[group.id];
            const containsActive = articles.some((a) => a.slug === activeSlug);

            return (
              <div
                key={group.id}
                ref={(el) => {
                  sectionRefs.current[group.id] = el;
                }}
                className="scroll-mt-2"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#EB3B2D] ${
                    containsActive
                      ? 'bg-neutral-50 dark:bg-white/[0.04]'
                      : 'hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#EB3B2D] shrink-0">
                        {group.letter}
                      </span>
                      <span
                        className={`font-display text-xs font-semibold truncate ${
                          containsActive
                            ? 'text-neutral-900 dark:text-white'
                            : 'text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {group.title}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono tabular-nums text-neutral-500 mt-0.5 pl-4">
                      {normalizedQuery
                        ? `${articles.length} of ${totalCount} matching`
                        : `${group.subtitle} · ${totalCount} guides`}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown
                      size={14}
                      className="text-neutral-500 shrink-0"
                    />
                  ) : (
                    <ChevronRight
                      size={14}
                      className="text-neutral-500 shrink-0"
                    />
                  )}
                </button>

                {isOpen && (
                  <ul className="py-1 px-2 space-y-0.5 bg-neutral-50/70 dark:bg-[#0B0B0B] border-t border-neutral-200/70 dark:border-white/[0.05]">
                    {articles.map((art: DocArticle) => {
                      const isSelected = activeSlug === art.slug;
                      return (
                        <li key={art.slug}>
                          <button
                            ref={isSelected ? activeItemRef : null}
                            type="button"
                            onClick={() => onSelectArticle(art.slug)}
                            aria-current={isSelected ? 'page' : undefined}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] ${
                              isSelected
                                ? 'bg-[#EB3B2D]/12 text-[#B81D13] dark:text-white font-semibold'
                                : 'text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.05]'
                            }`}
                          >
                            <span className="flex items-start gap-2 min-w-0">
                              <span
                                className={`font-mono tabular-nums text-[10px] shrink-0 pt-0.5 ${
                                  isSelected
                                    ? 'text-[#EB3B2D] font-bold'
                                    : 'text-neutral-500'
                                }`}
                              >
                                {art.code}
                              </span>
                              <span className="leading-snug">{art.title}</span>
                            </span>
                            {art.status && art.status !== 'AVAILABLE' && (
                              <span className="font-mono text-[9px] uppercase text-neutral-500 shrink-0 pt-0.5">
                                {art.status === 'COMING SOON'
                                  ? 'SOON'
                                  : art.status === 'UNAVAILABLE'
                                  ? 'N/A'
                                  : 'LIM'}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pinned Utility Links */}
      <div className="p-3 border-t border-neutral-200 dark:border-white/[0.08] bg-neutral-50/90 dark:bg-[#0D0D0D] space-y-1.5 shrink-0">
        <Link
          to="/contact"
          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#141414] border border-neutral-200 dark:border-white/[0.08] hover:border-[#EB3B2D]/50 text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center justify-between transition-colors whitespace-nowrap"
        >
          <span>Contact &amp; Support</span>
          <ArrowUpRight size={13} className="text-[#EB3B2D] shrink-0" />
        </Link>
        <Link
          to="/ai"
          className="w-full px-3 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black font-display font-semibold text-xs hover:opacity-90 flex items-center justify-between transition-opacity whitespace-nowrap"
        >
          <span>Open Omnia Workspace</span>
          <ArrowUpRight size={13} className="text-[#EB3B2D] shrink-0" />
        </Link>
      </div>
    </nav>
  );

  if (isStickyVariant) {
    return (
      <aside
        aria-label="Sticky documentation navigation sidebar"
        className={`sticky top-24 ${className}`}
      >
        {navContent}
      </aside>
    );
  }

  return navContent;
};
