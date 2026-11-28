import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import type { BlogBlock, BlogPost } from '../../data/blog/types';
import { BlogRichText } from './BlogRichText';
import { BlogMathBlock } from './BlogMathBlock';
import { BlogTableOfContents, type TocEntry } from './BlogTableOfContents';
import { BlogArticleAgent } from './BlogArticleAgent';
import { useCopyToClipboard } from '../../utils/clipboard';
import { toSafeExternalHref } from '../../utils/safeUrl';
import { trackConversionEvent } from '../../services/conversionTracking';

interface BlogArticleViewProps {
  post: BlogPost;
  allPosts: BlogPost[];
}

function formatEditorialDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export const BlogArticleView: React.FC<BlogArticleViewProps> = ({
  post,
  allPosts,
}) => {
  const [readProgress, setReadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<{ id: string; heading: string } | null>(
    post.sections[0] ? { id: post.sections[0].id, heading: post.sections[0].heading } : null
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const { copy: copySnippet } = useCopyToClipboard({
    defaultLabel: 'Code snippet copied to clipboard.',
  });

  useEffect(() => {
    setHeroImgFailed(false);
    setOpenFaqIndex(0);
    setActiveSection(
      post.sections[0] ? { id: post.sections[0].id, heading: post.sections[0].heading } : null
    );
  }, [post.slug, post.sections]);

  useEffect(() => {
    const updateProgressAndSection = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setReadProgress(0);
      } else {
        const ratio = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
        setReadProgress(ratio);
      }

      // Determine the current section closest above the upper reading line (160px from top)
      let current: { id: string; heading: string } | null =
        post.sections[0] ? { id: post.sections[0].id, heading: post.sections[0].heading } : null;

      for (const sec of post.sections) {
        const el = document.getElementById(sec.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 170) {
          current = { id: sec.id, heading: sec.heading };
        } else {
          break;
        }
      }

      setActiveSection((prev) =>
        prev?.id === current?.id ? prev : current
      );
    };

    updateProgressAndSection();
    window.addEventListener('scroll', updateProgressAndSection, { passive: true });
    return () => window.removeEventListener('scroll', updateProgressAndSection);
  }, [post.slug, post.sections]);

  const tocEntries: TocEntry[] = React.useMemo(() => {
    const items: TocEntry[] = post.sections.map((section) => ({
      id: section.id,
      heading: section.heading,
      level: section.level,
    }));
    if (post.faqs.length > 0) {
      items.push({
        id: 'frequently-asked-questions',
        heading: 'Frequently Asked Questions',
        level: 2,
      });
    }
    if (post.sources.length > 0) {
      items.push({
        id: 'sources',
        heading: `Sources (${post.sources.length})`,
        level: 2,
      });
    }
    return items;
  }, [post]);

  const currentIdx = allPosts.findIndex((item) => item.slug === post.slug);
  const prevPost = currentIdx > 0 ? allPosts[currentIdx - 1] : undefined;
  const nextPost =
    currentIdx >= 0 && currentIdx < allPosts.length - 1
      ? allPosts[currentIdx + 1]
      : undefined;

  const relatedPosts = React.useMemo(() => {
    const bySlug = new Map(allPosts.map((p) => [p.slug, p]));
    return post.relatedSlugs
      .map((s) => bySlug.get(s))
      .filter((p): p is BlogPost => Boolean(p && p.slug !== post.slug));
  }, [allPosts, post.relatedSlugs, post.slug]);

  const renderBlock = (block: BlogBlock, blockIdx: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p
            key={blockIdx}
            className="text-[16px] sm:text-[17px] leading-[1.82] text-neutral-700 dark:text-neutral-300"
          >
            <BlogRichText text={block.text} sources={post.sources} />
          </p>
        );

      case 'math':
        return (
          <BlogMathBlock
            key={blockIdx}
            latex={block.latex}
            caption={block.caption}
          />
        );

      case 'list': {
        const ListTag = block.ordered ? 'ol' : 'ul';
        return (
          <ListTag
            key={blockIdx}
            className={`my-5 space-y-2.5 pl-5 text-[15.5px] sm:text-[16.5px] leading-[1.75] text-neutral-700 dark:text-neutral-300 ${
              block.ordered ? 'list-decimal' : 'list-disc'
            } marker:text-[#EB3B2D]`}
          >
            {block.items.map((item, i) => (
              <li key={i} className="pl-1">
                <BlogRichText text={item} sources={post.sources} />
              </li>
            ))}
          </ListTag>
        );
      }

      case 'table':
        return (
          <figure key={blockIdx} className="my-8">
            <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0e0e0e]">
              <table className="w-full min-w-[540px] border-collapse text-left text-[13.5px] leading-relaxed tabular-nums">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/[0.1] bg-neutral-100/80 dark:bg-white/[0.03]">
                    {block.headers.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        scope="col"
                        className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] font-semibold text-neutral-900 dark:text-white whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/80 dark:divide-white/[0.06]">
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-4 py-3 align-top ${
                            cIdx === 0
                              ? 'font-medium text-neutral-950 dark:text-white'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <BlogRichText text={cell} sources={post.sources} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {block.caption && (
              <figcaption className="mt-2.5 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'callout': {
        const isVerification = block.variant === 'verification';
        return (
          <aside
            key={blockIdx}
            className="my-7 rounded-xl border border-neutral-200 dark:border-white/[0.09] bg-neutral-100/70 dark:bg-[#111111] p-5 sm:p-6 space-y-2"
          >
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-[#EB3B2D]">
              {isVerification ? (
                <AlertCircle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span>{block.title}</span>
            </div>
            <p className="text-[14.5px] sm:text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300">
              <BlogRichText text={block.text} sources={post.sources} />
            </p>
          </aside>
        );
      }

      case 'code': {
        const codeKey = `code-${blockIdx}-${block.code.slice(0, 20)}`;
        const isCodeCopied = copiedCodeKey === codeKey;
        return (
          <figure key={blockIdx} className="my-7">
            <div className="rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-neutral-950 overflow-hidden">
              <div className="px-4 py-2 border-b border-white/[0.08] flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                <div className="flex items-center gap-3 min-w-0">
                  <span>{block.language}</span>
                  {block.caption && (
                    <span className="normal-case tracking-normal truncate">{block.caption}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copySnippet(block.code, `${block.language || 'Code'} snippet copied to clipboard.`);
                    if (ok) {
                      setCopiedCodeKey(codeKey);
                      window.setTimeout(
                        () => setCopiedCodeKey((prev) => (prev === codeKey ? null : prev)),
                        2000
                      );
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 text-neutral-300 hover:text-white normal-case tracking-normal transition-colors cursor-pointer shrink-0"
                >
                  {isCodeCopied ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 sm:p-5 overflow-x-auto text-xs sm:text-[13px] leading-relaxed font-mono text-neutral-200">
                <code>{block.code}</code>
              </pre>
            </div>
          </figure>
        );
      }

      case 'image':
        return (
          <figure key={blockIdx} className="my-8">
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-[#0a0c11] select-none"
            >
              <img
                src={block.src}
                alt={block.alt}
                width={block.width || 1200}
                height={block.height || 675}
                loading="lazy"
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
                className="w-full h-auto block pointer-events-none select-none"
              />
            </div>
            {block.caption && (
              <figcaption className="mt-2.5 text-xs font-instrument-serif italic text-neutral-500 dark:text-neutral-400 tracking-wide">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
    }
  };

  return (
    <div className="relative">
      {/* Subtle editorial reading progress line */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none"
      >
        <div
          className="h-full bg-[#EB3B2D] transition-[width] duration-150 ease-out"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <article className="pt-28 md:pt-36 pb-24 px-5 sm:px-8 lg:px-12 max-w-[1220px] mx-auto">
        {/* Top Breadcrumb & Back Link */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-white/[0.08] pb-5"
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={14} className="text-[#EB3B2D]" />
            <span>All Blog Articles</span>
          </Link>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400 tabular-nums">
            {post.series} · Article {String(post.number).padStart(2, '0')} of {allPosts.length}
          </div>
        </nav>

        {/* Editorial Header */}
        <header className="max-w-4xl space-y-5">
          <div className="text-xs font-mono uppercase tracking-[0.16em] text-[#EB3B2D] tabular-nums">
            {post.category} · {formatEditorialDate(post.publishedAt)} ·{' '}
            {post.readTimeMinutes} min read
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.95rem] font-semibold tracking-[-0.025em] leading-[1.1] text-neutral-950 dark:text-white [text-wrap:balance]">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg lg:text-[1.15rem] leading-[1.68] text-neutral-600 dark:text-neutral-300 max-w-[66ch]">
            {post.excerpt}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
            <span>
              By <strong className="font-medium text-neutral-800 dark:text-neutral-200">{post.author}</strong> — {post.authorRole}
            </span>
            {post.updatedAt && (
              <span>Updated {formatEditorialDate(post.updatedAt)}</span>
            )}
            <span>{post.sources.length} verified references</span>
          </div>
        </header>

        {/* Featured 16:9 Editorial Artwork */}
        <figure className="mt-10 mb-12">
          <div
            onContextMenu={(e) => e.preventDefault()}
            className="aspect-video w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-[#111111] select-none"
          >
            {!heroImgFailed ? (
              <img
                src={post.featuredImage}
                alt={post.featuredImageAlt}
                width={1280}
                height={720}
                loading="eager"
                fetchPriority="high"
                draggable={false}
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#161616] via-[#0d0d0d] to-[#1a0b0a]">
                <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#EB3B2D]">
                  VIZRA Editorial Monograph · {String(post.number).padStart(2, '0')}
                </span>
                <span className="mt-2 font-display text-xl text-white max-w-lg">
                  {post.title}
                </span>
              </div>
            )}
          </div>
          <figcaption className="mt-3 text-xs font-instrument-serif italic text-neutral-500 dark:text-neutral-400 tracking-wide">
            Fig. {String(post.number).padStart(2, '0')} — {post.featuredImageCaption}
          </figcaption>
        </figure>

        {/* Mobile TOC */}
        <div className="mb-10">
          <BlogTableOfContents entries={tocEntries} variant="mobile" />
        </div>

        {/* Two-Column Asymmetric Reading Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)] gap-10 xl:gap-14 items-start">
          {/* Sticky Desktop TOC */}
          <BlogTableOfContents entries={tocEntries} variant="desktop" />

          {/* Main Reading Column (constrained 68-74ch measure for effortless legibility) */}
          <div className="min-w-0 max-w-[74ch]">
            {/* Key Takeaways Strip */}
            {post.keyTakeaways.length > 0 && (
              <section
                aria-label="Key takeaways"
                className="mb-12 py-6 border-y border-neutral-200 dark:border-white/[0.1] space-y-3.5"
              >
                <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#EB3B2D]">
                  Key Takeaways
                </div>
                <ul className="space-y-2.5 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 list-disc pl-5 marker:text-[#EB3B2D]">
                  {post.keyTakeaways.map((point, idx) => (
                    <li key={idx}>
                      <BlogRichText text={point} sources={post.sources} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Structured Article Sections */}
            <div className="space-y-12">
              {post.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 space-y-5"
                >
                  {section.level === 2 ? (
                    <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em] leading-[1.22] text-neutral-950 dark:text-white pt-2 border-t border-neutral-200/70 dark:border-white/[0.06] [text-wrap:balance]">
                      {section.heading}
                    </h2>
                  ) : (
                    <h3 className="font-display text-xl sm:text-[1.35rem] font-semibold tracking-[-0.015em] leading-[1.28] text-neutral-900 dark:text-neutral-100 pt-1">
                      {section.heading}
                    </h3>
                  )}

                  <div className="space-y-5">
                    {section.blocks.map((block, bIdx) =>
                      renderBlock(block, bIdx)
                    )}
                  </div>
                </section>
              ))}
            </div>

            {/* Frequently Asked Questions */}
            {post.faqs.length > 0 && (
              <section
                id="frequently-asked-questions"
                className="mt-16 pt-10 border-t border-neutral-200 dark:border-white/[0.1] scroll-mt-28 space-y-6"
              >
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#EB3B2D]">
                    Reader Reference
                  </div>
                  <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-neutral-950 dark:text-white">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-white/[0.08] border-y border-neutral-200 dark:border-white/[0.08]">
                  {post.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={idx} className="py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFaqIndex(isOpen ? null : idx)
                          }
                          aria-expanded={isOpen}
                          className="w-full flex items-start justify-between gap-4 text-left"
                        >
                          <span className="font-display text-base sm:text-[17px] font-medium text-neutral-950 dark:text-white leading-snug">
                            {faq.question}
                          </span>
                          <span className="mt-0.5 shrink-0 text-neutral-500">
                            {isOpen ? (
                              <ChevronUp size={17} />
                            ) : (
                              <ChevronDown size={17} />
                            )}
                          </span>
                        </button>
                        {isOpen && (
                          <p className="mt-3 text-[15px] leading-[1.75] text-neutral-600 dark:text-neutral-300 pr-6">
                            <BlogRichText
                              text={faq.answer}
                              sources={post.sources}
                            />
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Dedicated Sources Section */}
            {post.sources.length > 0 && (
              <section
                id="sources"
                className="mt-16 pt-10 border-t border-neutral-200 dark:border-white/[0.1] scroll-mt-28 space-y-6"
              >
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#EB3B2D]">
                    Primary References &amp; Citations
                  </div>
                  <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-neutral-950 dark:text-white">
                    Sources
                  </h2>
                </div>

                <ol className="space-y-4">
                  {post.sources.map((source) => (
                    <li
                      key={source.id}
                      id={`source-${source.id}`}
                      className="scroll-mt-28 grid grid-cols-[2.25rem_minmax(0,1fr)] gap-2 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-400"
                    >
                      <span className="font-mono text-xs text-[#EB3B2D] pt-0.5 tabular-nums">
                        [{source.id}]
                      </span>
                      <div className="space-y-1 min-w-0">
                        <div className="text-neutral-900 dark:text-neutral-200">
                          {source.authors ? `${source.authors}. ` : ''}
                          <span className="font-medium">{source.title}</span>
                          {source.venue ? ` — ${source.venue}` : ''}
                          {source.date ? ` (${source.date})` : ''}.
                        </div>
                        {toSafeExternalHref(source.url) ? (
                          <a
                            href={toSafeExternalHref(source.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono text-[12px] text-neutral-500 hover:text-[#EB3B2D] transition-colors break-all"
                          >
                            <span>{source.url}</span>
                            <ExternalLink size={11} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="font-mono text-[12px] text-neutral-500 break-all">
                            {source.url}
                          </span>
                        )}
                        {source.verificationNote && (
                          <div className="text-[12px] font-mono text-amber-600 dark:text-amber-400/90">
                            Editorial note: {source.verificationNote}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Contextual VIZRA Product Discovery CTA */}
            <aside
              aria-label="Try VIZRA AI Creative Studio"
              className="mt-14 rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-neutral-50 dark:bg-[#111111] p-6 sm:p-7 space-y-4"
            >
              <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#EB3B2D]">
                Put These Concepts Into Practice
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-xl font-semibold text-neutral-950 dark:text-white">
                  Explore AI Workflows Inside VIZRA &amp; Omnia 1.0
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
                  Test structured prompting with our zero-signup AI Prompt Optimizer, or open Omnia 1.0 on the Creator Free tier for verified Google Search citations, 5-file document auditing, React/GLSL code synthesis, and instrumental audio.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/ai"
                  onClick={() =>
                    trackConversionEvent('article_to_product_click', {
                      articleSlug: post.slug,
                      target: '/ai',
                      placement: 'article_footer_cta',
                    })
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-black font-display font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity"
                >
                  <span>Launch Omnia 1.0 Free</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/free-ai-prompt-optimizer"
                  onClick={() =>
                    trackConversionEvent('article_to_product_click', {
                      articleSlug: post.slug,
                      target: '/free-ai-prompt-optimizer',
                      placement: 'article_footer_cta',
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-white/[0.14] text-neutral-900 dark:text-white font-display font-medium text-xs sm:text-sm hover:border-[#EB3B2D] transition-colors"
                >
                  <span>Try Free AI Prompt Optimizer</span>
                </Link>
                <Link
                  to="/ai-creative-studio"
                  onClick={() =>
                    trackConversionEvent('article_to_product_click', {
                      articleSlug: post.slug,
                      target: '/ai-creative-studio',
                      placement: 'article_footer_cta',
                    })
                  }
                  className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-[#EB3B2D] transition-colors px-2 py-2"
                >
                  Explore AI Creative Studio →
                </Link>
              </div>
            </aside>

            {/* Internal VIZRA Links */}
            {post.internalLinks.length > 0 && (
              <section className="mt-14 pt-10 border-t border-neutral-200 dark:border-white/[0.1] space-y-5">
                <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                  Continue Exploring on VIZRA
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {post.internalLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() =>
                        trackConversionEvent('article_to_product_click', {
                          articleSlug: post.slug,
                          target: link.href,
                          placement: 'article_internal_links',
                        })
                      }
                      className="p-4 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] hover:border-[#EB3B2D]/60 transition-colors group space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm font-display font-semibold text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors">
                        <span>{link.label}</span>
                        <ArrowRight size={14} className="shrink-0" />
                      </div>
                      <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {link.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related Articles in AI Foundations Series */}
            {relatedPosts.length > 0 && (
              <section className="mt-14 pt-10 border-t border-neutral-200 dark:border-white/[0.1] space-y-5">
                <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#EB3B2D]">
                  Related in {post.series}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {relatedPosts.slice(0, 4).map((rel) => (
                    <Link
                      key={rel.slug}
                      to={`/blog/${rel.slug}`}
                      className="group rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] hover:border-[#EB3B2D]/50 transition-colors overflow-hidden flex flex-col"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-[#0c0c0c]">
                        <img
                          src={rel.featuredImage}
                          alt={rel.featuredImageAlt}
                          width={1280}
                          height={720}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-500 tabular-nums">
                            Article {String(rel.number).padStart(2, '0')} ·{' '}
                            {rel.readTimeMinutes} min read
                          </div>
                          <h3 className="font-display text-[15px] font-semibold leading-snug text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors">
                            {rel.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Sequential Series Navigation (Previous / Next) */}
            <nav
              aria-label="Article series navigation"
              className="mt-14 pt-8 border-t border-neutral-200 dark:border-white/[0.1] grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {prevPost ? (
                <Link
                  to={`/blog/${prevPost.slug}`}
                  className="p-5 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] hover:border-[#EB3B2D]/50 transition-colors group space-y-1.5"
                >
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-500">
                    <ArrowLeft size={12} />
                    <span>Previous · Article {String(prevPost.number).padStart(2, '0')}</span>
                  </div>
                  <div className="font-display text-sm sm:text-base font-semibold text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors leading-snug">
                    {prevPost.title}
                  </div>
                </Link>
              ) : (
                <Link
                  to="/blog"
                  className="p-5 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] hover:border-[#EB3B2D]/50 transition-colors group space-y-1.5"
                >
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-500">
                    <BookOpen size={12} />
                    <span>Series Index</span>
                  </div>
                  <div className="font-display text-sm sm:text-base font-semibold text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors leading-snug">
                    Browse all {allPosts.length} VIZRA Blog articles
                  </div>
                </Link>
              )}

              {nextPost ? (
                <Link
                  to={`/blog/${nextPost.slug}`}
                  className="p-5 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] hover:border-[#EB3B2D]/50 transition-colors group space-y-1.5 sm:text-right"
                >
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-500 sm:justify-end w-full">
                    <span>Next · Article {String(nextPost.number).padStart(2, '0')}</span>
                    <ArrowRight size={12} />
                  </div>
                  <div className="font-display text-sm sm:text-base font-semibold text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors leading-snug">
                    {nextPost.title}
                  </div>
                </Link>
              ) : (
                <Link
                  to="/docs"
                  className="p-5 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] hover:border-[#EB3B2D]/50 transition-colors group space-y-1.5 sm:text-right"
                >
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-500 sm:justify-end w-full">
                    <span>End of Series</span>
                    <ArrowRight size={12} />
                  </div>
                  <div className="font-display text-sm sm:text-base font-semibold text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors leading-snug">
                    Explore VIZRA Public Documentation
                  </div>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </article>

      {/* VIZRA Article Agent (rendered via Portal outside <main> stacking context) */}
      <BlogArticleAgent
        post={post}
        currentSection={activeSection}
        allPosts={allPosts}
      />
    </div>
  );
};
