import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  Info,
  Lightbulb,
  AlertTriangle,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  DocArticle,
  DocSectionGroupId,
  FeatureAvailabilityStatus,
} from '../../data/publicDocs/types';
import { DocsDiagramFigure } from './DocsDiagrams';
import { StickyDocsSidebar } from './StickyDocsSidebar';

export { StickyDocsSidebar as DocsSidebarNav };

export const StatusLabel: React.FC<{ status: FeatureAvailabilityStatus }> = ({
  status,
}) => {
  const styles: Record<FeatureAvailabilityStatus, string> = {
    AVAILABLE:
      'border-emerald-600/40 dark:border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    LIMITED:
      'border-amber-600/40 dark:border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    UNAVAILABLE:
      'border-red-600/40 dark:border-[#EB3B2D]/40 bg-red-500/10 text-red-700 dark:text-[#EB3B2D]',
    'COMING SOON':
      'border-neutral-400/50 dark:border-white/20 bg-neutral-200/70 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border font-mono text-[10px] font-semibold uppercase tracking-wider shrink-0 ${styles[status]}`}
    >
      {status}
    </span>
  );
};

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlug: string | null;
  activeSectionFilter?: DocSectionGroupId | null;
  onSelectHome: () => void;
  onSelectArticle: (slug: string) => void;
  onJumpToSection?: (sectionId: DocSectionGroupId) => void;
}

export const DocsMobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeSlug,
  activeSectionFilter = null,
  onSelectHome,
  onSelectArticle,
  onJumpToSection,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden flex"
      role="dialog"
      aria-modal="true"
      aria-label="Documentation Navigation Drawer"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-[86%] max-w-sm h-full bg-neutral-50 dark:bg-[#090909] border-r border-neutral-200 dark:border-white/[0.1] flex flex-col overflow-hidden">
        <div className="px-4 py-3.5 border-b border-neutral-200 dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#EB3B2D]">
              VIZRA Public Docs
            </div>
            <div className="font-display text-sm font-semibold text-neutral-900 dark:text-white">
              Browse Sections A–H
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close documentation menu"
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <StickyDocsSidebar
            isDrawer
            activeSlug={activeSlug}
            activeSectionFilter={activeSectionFilter}
            onSelectHome={() => {
              onSelectHome();
              onClose();
            }}
            onSelectArticle={(slug) => {
              onSelectArticle(slug);
              onClose();
            }}
            onJumpToSection={(sectionId) => {
              if (onJumpToSection) {
                onJumpToSection(sectionId);
              }
              if (!activeSlug) {
                onClose();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface ArticleReaderProps {
  article: DocArticle;
  prevArticle: DocArticle | null;
  nextArticle: DocArticle | null;
  onSelectHome: () => void;
  onSelectArticle: (slug: string) => void;
}

export const DocsArticleReader: React.FC<ArticleReaderProps> = ({
  article,
  prevArticle,
  nextArticle,
  onSelectHome,
  onSelectArticle,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 2000);
  };

  const scrollToHeading = (blockId: string) => {
    const el = document.getElementById(`doc-block-${blockId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* Main Article Column */}
      <article className="xl:col-span-9 rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] p-6 sm:p-8 lg:p-10 space-y-8">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-neutral-500"
        >
          <Link
            to="/"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={onSelectHome}
            className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Docs
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-neutral-600 dark:text-neutral-400">
            {article.sectionTitle}
          </span>
          <span aria-hidden="true">/</span>
          <span className="text-[#EB3B2D] font-semibold">
            {article.code} · {article.title}
          </span>
        </nav>

        {/* Article Header */}
        <header className="space-y-3 pb-6 border-b border-neutral-200 dark:border-white/[0.08]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-[#EB3B2D]">
              {article.sectionTitle} · Topic {article.code}
            </span>
            {article.status && <StatusLabel status={article.status} />}
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {article.title}
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl">
            {article.summary}
          </p>

          {article.statusNote && (
            <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-[#090909] border border-neutral-200 dark:border-white/[0.08] text-xs font-mono text-neutral-700 dark:text-neutral-300">
              Status Note: {article.statusNote}
            </div>
          )}
        </header>

        {/* Mobile / Tablet Inline On-This-Page TOC */}
        {article.blocks.length > 1 && (
          <div className="xl:hidden p-4 rounded-xl bg-neutral-50 dark:bg-[#090909] border border-neutral-200 dark:border-white/[0.06] space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              On This Page
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              {article.blocks.map((block) => (
                <li key={block.id}>
                  <button
                    type="button"
                    onClick={() => scrollToHeading(block.id)}
                    className="text-neutral-700 dark:text-neutral-300 hover:text-[#EB3B2D] underline-offset-4 hover:underline cursor-pointer text-left"
                  >
                    {block.heading}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Optional Conceptual SVG Diagram */}
        {article.diagramId && <DocsDiagramFigure diagramId={article.diagramId} />}

        {/* Content Blocks */}
        <div className="space-y-8">
          {article.blocks.map((block) => (
            <section
              key={block.id}
              id={`doc-block-${block.id}`}
              className="scroll-mt-24 space-y-3.5"
            >
              <h3 className="font-display text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white tracking-tight">
                {block.heading}
              </h3>

              {block.paragraphs?.map((p, idx) => (
                <p
                  key={idx}
                  className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed"
                >
                  {p}
                </p>
              ))}

              {block.bullets && (
                <ul className="space-y-2 pl-5 list-disc text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {block.bullets.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}

              {block.steps && (
                <ol className="space-y-2.5 pl-0 list-none">
                  {block.steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-[#090909] border border-neutral-200 dark:border-white/[0.06] text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed"
                    >
                      <span className="font-mono text-xs font-bold text-[#EB3B2D] shrink-0 pt-0.5">
                        0{idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {block.table && (
                <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-[#090909]">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-white/[0.08] bg-neutral-100/80 dark:bg-white/[0.03] font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                        {block.table.headers.map((header) => (
                          <th key={header} className="py-3 px-4 font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-white/[0.06]">
                      {block.table.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`py-3 px-4 align-top leading-relaxed ${
                                cIdx === 0
                                  ? 'font-medium text-neutral-900 dark:text-white whitespace-nowrap'
                                  : 'text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {block.example && (
                <div className="rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-neutral-900 dark:bg-[#090909] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between text-xs font-mono text-neutral-300">
                    <span>{block.example.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(`${article.slug}-${block.id}`, block.example!.content)
                      }
                      className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white cursor-pointer"
                    >
                      {copiedKey === `${article.slug}-${block.id}` ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 sm:p-5 text-xs font-mono text-neutral-100 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    <code>{block.example.content}</code>
                  </pre>
                </div>
              )}

              {block.callout && (
                <div
                  className={`p-4 rounded-xl border text-xs sm:text-sm space-y-1 ${
                    block.callout.variant === 'warning' || block.callout.variant === 'limitation'
                      ? 'bg-amber-50 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/40 text-amber-950 dark:text-amber-100'
                      : 'bg-neutral-100 dark:bg-[#090909] border-neutral-200 dark:border-white/[0.1] text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="font-display font-semibold flex items-center gap-2">
                    {block.callout.variant === 'warning' ? (
                      <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : block.callout.variant === 'limitation' ? (
                      <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : block.callout.variant === 'tip' ? (
                      <Lightbulb size={15} className="text-[#EB3B2D] shrink-0" />
                    ) : (
                      <Info size={15} className="text-[#EB3B2D] shrink-0" />
                    )}
                    <span>{block.callout.title}</span>
                  </div>
                  <p className="leading-relaxed opacity-90 pl-6">
                    {block.callout.body}
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Related Links Strip */}
        {article.relatedLinks && article.relatedLinks.length > 0 && (
          <div className="pt-6 border-t border-neutral-200 dark:border-white/[0.08] space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Related Pages &amp; Next Steps
            </div>
            <div className="flex flex-wrap gap-2.5">
              {article.relatedLinks.map((rl) => (
                <Link
                  key={rl.to + rl.label}
                  to={rl.to}
                  className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-[#090909] border border-neutral-200 dark:border-white/[0.08] hover:border-[#EB3B2D]/60 text-xs font-medium text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>{rl.label}</span>
                  <ArrowUpRight size={12} className="text-[#EB3B2D]" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Previous / Next Navigation Footer */}
        <footer className="pt-6 border-t border-neutral-200 dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevArticle ? (
            <button
              type="button"
              onClick={() => onSelectArticle(prevArticle.slug)}
              className="p-4 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-[#090909] hover:border-[#EB3B2D]/60 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-neutral-500 mb-1">
                <ArrowLeft size={12} className="text-[#EB3B2D]" />
                <span>Previous · {prevArticle.code}</span>
              </div>
              <div className="font-display text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-[#EB3B2D] transition-colors">
                {prevArticle.title}
              </div>
            </button>
          ) : (
            <div />
          )}

          {nextArticle ? (
            <button
              type="button"
              onClick={() => onSelectArticle(nextArticle.slug)}
              className="p-4 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-[#090909] hover:border-[#EB3B2D]/60 text-right transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-end gap-1.5 font-mono text-[10px] uppercase text-neutral-500 mb-1">
                <span>Next · {nextArticle.code}</span>
                <ArrowRight size={12} className="text-[#EB3B2D]" />
              </div>
              <div className="font-display text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-[#EB3B2D] transition-colors">
                {nextArticle.title}
              </div>
            </button>
          ) : (
            <div />
          )}
        </footer>
      </article>

      {/* Right Desktop Sticky "On This Page" TOC */}
      <aside
        aria-label="On this page"
        className="hidden xl:block xl:col-span-3 sticky top-24 rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] p-5 space-y-3"
      >
        <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
          On This Page
        </div>
        <ul className="space-y-2 text-xs">
          {article.blocks.map((block) => (
            <li key={block.id}>
              <button
                type="button"
                onClick={() => scrollToHeading(block.id)}
                className="text-left text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white leading-snug transition-colors cursor-pointer"
              >
                {block.heading}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
};
