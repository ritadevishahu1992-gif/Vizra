import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Menu,
  ArrowRight,
  ArrowUpRight,
  X,
  Compass,
  ShieldCheck,
  Sparkles,
  Wrench,
  HelpCircle,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import {
  ALL_DOC_ARTICLES,
  DOC_SECTION_GROUPS,
  findDocArticleBySlug,
  getAdjacentArticles,
  getArticlesBySection,
} from '../data/publicDocs';
import { DocArticle, DocSectionGroupId } from '../data/publicDocs/types';
import {
  DocsArticleReader,
  DocsMobileDrawer,
  StatusLabel,
} from '../components/docs/DocsLayoutPrimitives';
import { DocsSidebar } from '../components/docs/DocsSidebar';
import { DocsDiagramFigure } from '../components/docs/DocsDiagrams';

export const DocsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const requestedParam =
    searchParams.get('doc') ||
    searchParams.get('section') ||
    searchParams.get('topic');

  const activeArticle: DocArticle | null = useMemo(
    () => findDocArticleBySlug(requestedParam),
    [requestedParam]
  );

  // Detect whether URL asked for a section overview anchor (?cat=A..H or ?section=A..H)
  const requestedSectionLetter = useMemo<DocSectionGroupId | null>(() => {
    const upper = (searchParams.get('cat') || requestedParam || '')
      .trim()
      .toUpperCase();
    if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(upper)) {
      return upper as DocSectionGroupId;
    }
    return null;
  }, [searchParams, requestedParam]);

  const isUnknownTopic =
    Boolean(requestedParam) && !activeArticle && !requestedSectionLetter;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeArticle?.slug]);

  const handleSelectHome = () => {
    setSearchParams({});
  };

  const handleSelectArticle = (slug: string) => {
    setSearchParams({ doc: slug });
  };

  const handleJumpToSection = (sectionId: DocSectionGroupId) => {
    if (!activeArticle) {
      setSearchParams({ cat: sectionId });
      window.setTimeout(() => {
        const card = document.getElementById(`doc-section-card-${sectionId}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 40);
    }
  };

  // Search filtering across titles, summaries, codes, statuses, and block bodies
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_DOC_ARTICLES.filter((art) => {
      if (
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.code.toLowerCase().includes(q) ||
        art.sectionTitle.toLowerCase().includes(q) ||
        (art.status && art.status.toLowerCase().includes(q))
      ) {
        return true;
      }
      return art.blocks.some(
        (b) =>
          b.heading.toLowerCase().includes(q) ||
          b.paragraphs?.some((p) => p.toLowerCase().includes(q)) ||
          b.bullets?.some((li) => li.toLowerCase().includes(q)) ||
          b.steps?.some((st) => st.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  const adjacent = activeArticle
    ? getAdjacentArticles(activeArticle.slug)
    : { prev: null, next: null };

  const starterCards = [
    {
      title: 'Welcome & Getting Started',
      desc: 'Start using Omnia 1.0, pick a capability mode, and run your first session.',
      slug: 'getting-started',
      tag: 'Section A · 07',
      icon: Compass,
    },
    {
      title: 'Feature & Tool Status Matrix',
      desc: 'Clear live status labels for chat, research, files, audio, voice, and staged connectors.',
      slug: 'ai-service-availability',
      tag: 'Section H · 46',
      icon: Wrench,
    },
    {
      title: 'OMNIA Prompting & Guides',
      desc: 'Learn effective prompting habits, file ingestion workflows, and 10-stage project planning.',
      slug: 'prompting-effectively',
      tag: 'Section D · 19',
      icon: Sparkles,
    },
    {
      title: 'Privacy, Security & FAQs',
      desc: 'Review data protection, 18+ safety policies, self-service deletion, and common troubleshooting.',
      slug: 'security-overview',
      tag: 'Section F · 30',
      icon: ShieldCheck,
    },
  ];

  const featureStatusDirectory = getArticlesBySection('C');

  return (
    <PageLayout
      title={
        activeArticle
          ? `${activeArticle.title} — VIZRA Public Documentation`
          : 'Public Documentation Centre (A–Z) — Vizra AI Creative Studio'
      }
      description="Complete A–Z Public Documentation Centre for VIZRA and Omnia 1.0 covering platform guides, verified feature availability, prompting, privacy, security, and troubleshooting."
      canonicalPath="/docs"
    >
      {/* Mobile Slide-Over Section Drawer */}
      <DocsMobileDrawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activeSlug={activeArticle?.slug || null}
        activeSectionFilter={requestedSectionLetter}
        onSelectHome={handleSelectHome}
        onSelectArticle={handleSelectArticle}
        onJumpToSection={handleJumpToSection}
      />

      {/* Top Documentation Header & In-Docs Search */}
      <section className="pt-28 md:pt-32 pb-10 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto border-b border-neutral-200 dark:border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="typo-eyebrow flex items-center gap-2">
              <BookOpen size={12} />
              <span>Public Documentation Centre · Sections A–H</span>
            </div>
            <h1 className="typo-page-title text-neutral-900 dark:text-white">
              VIZRA Documentation
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              Verified guides for creators, visitors, and teams covering OMNIA 1.0, studio tools, 10-stage workflows, privacy &amp; safety controls, and troubleshooting.
            </p>
          </div>

          {/* Search Bar + Mobile Drawer Trigger */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/[0.1] text-xs font-medium text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-2 shrink-0 cursor-pointer"
              aria-label="Open documentation menu"
            >
              <Menu size={15} className="text-[#EB3B2D]" />
              <span>Topics</span>
            </button>

            <div className="relative flex-1 lg:w-80">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search docs, tools, statuses, FAQs…"
                aria-label="Search public documentation"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-xs text-neutral-900 dark:text-white placeholder-neutral-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout Container: Left Desktop Sidebar + Right Content */}
      <section className="py-10 md:py-14 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Sticky Sidebar */}
          <DocsSidebar
            className="hidden lg:block lg:col-span-3"
            activeSlug={activeArticle?.slug || null}
            activeSectionFilter={requestedSectionLetter}
            onSelectHome={handleSelectHome}
            onSelectArticle={handleSelectArticle}
            onJumpToSection={handleJumpToSection}
          />

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-8">
            {/* Search Results State */}
            {searchQuery.trim() ? (
              <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-white/[0.06]">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#EB3B2D]">
                      In-Docs Search
                    </div>
                    <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">
                      {searchResults.length} result
                      {searchResults.length === 1 ? '' : 's'} for “{searchQuery}”
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#181818] border border-neutral-200 dark:border-white/[0.08] text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:border-[#EB3B2D] cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <HelpCircle
                      size={28}
                      className="mx-auto text-neutral-400"
                    />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      No documentation topics matched “{searchQuery}”. Try searching for “OMNIA”, “file upload”, “privacy”, “music”, or “API”.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((res) => (
                      <button
                        key={res.slug}
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          handleSelectArticle(res.slug);
                        }}
                        className="p-4 rounded-xl bg-neutral-50 dark:bg-[#090909] border border-neutral-200 dark:border-white/[0.08] hover:border-[#EB3B2D]/60 text-left transition-colors cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-[#EB3B2D] uppercase">
                            {res.sectionTitle} · {res.code}
                          </span>
                          {res.status && <StatusLabel status={res.status} />}
                        </div>
                        <div className="font-display text-sm font-semibold text-neutral-900 dark:text-white">
                          {res.title}
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {res.summary}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Unknown ?doc= Fallback Banner */}
                {isUnknownTopic && (
                  <div className="p-5 rounded-2xl border border-amber-300 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-amber-950 dark:text-amber-100">
                      The requested documentation topic “{requestedParam}” could not be found. Browse the A–Z directory below or use search.
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectHome}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#111111] border border-neutral-300 dark:border-white/[0.12] font-medium text-neutral-900 dark:text-white shrink-0 cursor-pointer"
                    >
                      View Docs Home
                    </button>
                  </div>
                )}

                {activeArticle ? (
                  <DocsArticleReader
                    article={activeArticle}
                    prevArticle={adjacent.prev}
                    nextArticle={adjacent.next}
                    onSelectHome={handleSelectHome}
                    onSelectArticle={handleSelectArticle}
                  />
                ) : (
                  /* DOCUMENTATION HOMEPAGE VIEW */
                  <div className="space-y-10">
                    {/* Hero Quick-Start Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {starterCards.map((card) => {
                        const Icon = card.icon;
                        return (
                          <button
                            key={card.slug}
                            type="button"
                            onClick={() => handleSelectArticle(card.slug)}
                            className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] hover:border-[#EB3B2D]/60 text-left transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-[#EB3B2D]">
                                  {card.tag}
                                </span>
                                <Icon
                                  size={16}
                                  className="text-neutral-500 group-hover:text-[#EB3B2D] transition-colors"
                                />
                              </div>
                              <h2 className="font-display text-base sm:text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-[#EB3B2D] transition-colors">
                                {card.title}
                              </h2>
                              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {card.desc}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                              <span>Read guide</span>
                              <ArrowRight
                                size={13}
                                className="text-[#EB3B2D] group-hover:translate-x-0.5 transition-transform"
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Platform Overview Diagram */}
                    <DocsDiagramFigure diagramId="platform-overview" />

                    {/* Live Feature Status Directory (Section C Summary) */}
                    <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] p-6 sm:p-8 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-white/[0.06]">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-wider text-[#EB3B2D]">
                            Section C · Verified Capability Status
                          </div>
                          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
                            Features &amp; Tools Directory
                          </h2>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-500">
                          {featureStatusDirectory.length} documented features
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {featureStatusDirectory.map((feat) => (
                          <button
                            key={feat.slug}
                            type="button"
                            onClick={() => handleSelectArticle(feat.slug)}
                            className="p-4 rounded-xl bg-neutral-50 dark:bg-[#090909] border border-neutral-200 dark:border-white/[0.06] hover:border-[#EB3B2D]/60 text-left transition-colors cursor-pointer flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="font-display text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                                {feat.code} · {feat.title}
                              </div>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                {feat.summary}
                              </p>
                            </div>
                            {feat.status && <StatusLabel status={feat.status} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Complete A–H Sections Index */}
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[#EB3B2D]">
                          Complete Knowledge Index
                        </div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                          Browse All Sections (A–H)
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {DOC_SECTION_GROUPS.map((group) => {
                          const groupArticles = getArticlesBySection(group.id);
                          const isHighlighted = requestedSectionLetter === group.id;

                          return (
                            <div
                              key={group.id}
                              id={`doc-section-card-${group.id}`}
                              className={`scroll-mt-24 p-5 sm:p-6 rounded-2xl border bg-white dark:bg-[#111111] flex flex-col justify-between space-y-4 ${
                                isHighlighted
                                  ? 'border-[#EB3B2D]'
                                  : 'border-neutral-200 dark:border-white/[0.08]'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold text-[#EB3B2D]">
                                    SECTION {group.letter}
                                  </span>
                                  <span className="font-mono text-[10px] text-neutral-500">
                                    {group.subtitle}
                                  </span>
                                </div>
                                <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">
                                  {group.title}
                                </h3>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                  {group.description}
                                </p>
                              </div>

                              <ul className="pt-3 border-t border-neutral-200 dark:border-white/[0.06] space-y-1.5">
                                {groupArticles.map((art) => (
                                  <li key={art.slug}>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectArticle(art.slug)}
                                      className="w-full text-left text-xs text-neutral-700 dark:text-neutral-300 hover:text-[#EB3B2D] dark:hover:text-[#EB3B2D] py-1 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                                    >
                                      <span className="truncate">
                                        <span className="font-mono text-[10px] text-neutral-500 mr-2">
                                          {art.code}
                                        </span>
                                        {art.title}
                                      </span>
                                      <ArrowRight size={11} className="shrink-0 opacity-60" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Helpful Links */}
                    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-display text-sm font-semibold text-neutral-900 dark:text-white">
                          Need Additional Help or Privacy Disclosures?
                        </h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          Review our legal governance pages or reach our support team directly via the Contact page.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <Link
                          to="/privacy-policy"
                          className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-[#090909] border border-neutral-200 dark:border-white/[0.08] text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:border-[#EB3B2D]/60 transition-colors"
                        >
                          Privacy Policy
                        </Link>
                        <Link
                          to="/terms-and-conditions"
                          className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-[#090909] border border-neutral-200 dark:border-white/[0.08] text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:border-[#EB3B2D]/60 transition-colors"
                        >
                          Terms
                        </Link>
                        <Link
                          to="/contact"
                          className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-display font-semibold text-xs inline-flex items-center gap-1.5"
                        >
                          <span>Contact Support</span>
                          <ArrowUpRight size={13} className="text-[#EB3B2D]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
