import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  BookOpen,
  Layers,
  Cpu,
  ArrowLeft,
  Search,
  X,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { BlogArticleView } from '../components/blog/BlogArticleView';
import { BLOG_POSTS, getPublishedBlogPost } from '../data/blogPosts';

function formatShortDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const BlogPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const activePost = slug ? getPublishedBlogPost(slug) : undefined;

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return BLOG_POSTS;
    return BLOG_POSTS.filter((post) => {
      return (
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.primaryKeyword.toLowerCase().includes(q) ||
        post.secondaryKeywords.some((kw) => kw.toLowerCase().includes(q)) ||
        post.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Individual Article View (/blog/:slug) when a published post exists
  if (slug && activePost) {
    return (
      <PageLayout
        title={activePost.seoTitle}
        description={activePost.description}
        canonicalPath={`/blog/${activePost.slug}`}
      >
        <BlogArticleView post={activePost} allPosts={BLOG_POSTS} />
      </PageLayout>
    );
  }

  // Non-existent article slug (/blog/:slug when slug does not match any published post)
  if (slug && !activePost) {
    return (
      <PageLayout
        title="Article Not Found — Vizra Blog"
        description="The requested article URL does not match a published VIZRA Blog entry. Browse all verified AI Foundations articles on the Vizra Blog."
        canonicalPath={null}
        noindex={true}
      >
        <section className="pt-28 md:pt-36 pb-24 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
          <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/[0.08] space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-[#171717] border border-neutral-200 dark:border-white/[0.1] flex items-center justify-center text-[#EB3B2D] mx-auto">
              <FileText size={20} />
            </div>
            <div className="space-y-2">
              <div className="typo-eyebrow">VIZRA Editorial · Article Not Found</div>
              <h1 className="typo-section-title text-neutral-950 dark:text-white">
                Article not found.
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
                The requested path (
                <code className="text-neutral-800 dark:text-neutral-300 font-mono text-xs">
                  /blog/{slug}
                </code>
                ) does not match a published article. Explore our verified AI Foundations series below.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/blog"
                className="px-5 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-black font-display font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Browse All Articles</span>
              </Link>
              <Link
                to="/docs"
                className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-[#171717] border border-neutral-200 dark:border-white/[0.1] hover:border-neutral-400 dark:hover:border-white/[0.2] text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <BookOpen size={14} className="text-[#EB3B2D]" />
                <span>Read Documentation</span>
              </Link>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  const isSearching = searchQuery.trim().length > 0;
  const leadPost = !isSearching ? filteredPosts[0] : undefined;
  const featuredGridPosts = !isSearching ? filteredPosts.slice(1, 5) : [];
  const archivePosts = !isSearching ? filteredPosts.slice(5) : filteredPosts;

  // Primary Blog Landing View (/blog)
  return (
    <PageLayout
      title="AI Foundations & Technical Editorial — Vizra Blog"
      description="In-depth, fact-checked guides on artificial intelligence, machine learning, deep learning, neural networks, computing history, data engineering, NLP, and computer vision from VIZRA."
      canonicalPath="/blog"
    >
      {/* Editorial Masthead */}
      <section className="pt-28 md:pt-36 pb-12 px-5 sm:px-8 lg:px-12 max-w-[1220px] mx-auto border-b border-neutral-200 dark:border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-3xl space-y-4">
            <div className="typo-eyebrow">
              VIZRA Editorial · Batch 1 · AI Foundations Series
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-[-0.03em] leading-[1.06] text-neutral-950 dark:text-white [text-wrap:balance]">
              Technical Monographs on Modern Artificial Intelligence
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-300 max-w-[64ch]">
              Ten independently audited, source-verified essays examining how modern AI works—from early symbolic logic and computing hardware to neural networks, learning paradigms, data engineering, natural language processing, and computer vision.
            </p>
            <div className="pt-1 text-xs font-mono uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400 tabular-nums">
              {BLOG_POSTS.length} Published Monographs · Fact-Checked Primary Citations · KaTeX Mathematics
            </div>
          </div>

          {/* Clean Editorial Search Input */}
          <div className="w-full lg:w-80 shrink-0">
            <label htmlFor="vizra-blog-search" className="sr-only">
              Search AI Foundations articles
            </label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
              />
              <input
                id="vizra-blog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, math, models..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Editorial Catalog */}
      <section className="py-14 md:py-20 px-5 sm:px-8 lg:px-12 max-w-[1220px] mx-auto space-y-16">
        {filteredPosts.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/[0.08] text-center space-y-4">
            <h2 className="font-display text-xl font-semibold text-neutral-950 dark:text-white">
              No articles matched &ldquo;{searchQuery}&rdquo;.
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Try searching for terms such as neural networks, transformers, gradient descent, computer vision, or data pipelines.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-black text-xs font-display font-semibold hover:opacity-90 transition-opacity"
            >
              Show All 10 Articles
            </button>
          </div>
        ) : (
          <>
            {/* Tier 1: Lead Monograph */}
            {leadPost && (
              <div className="space-y-4">
                <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                  Lead Monograph · Start the Series
                </div>
                <Link
                  to={`/blog/${leadPost.slug}`}
                  className="group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] hover:border-[#EB3B2D]/60 transition-colors overflow-hidden p-5 sm:p-7"
                >
                  <div className="lg:col-span-7 aspect-video w-full overflow-hidden rounded-xl bg-[#0c0c0c]">
                    <img
                      src={leadPost.featuredImage}
                      alt={leadPost.featuredImageAlt}
                      width={1280}
                      height={720}
                      loading="eager"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                  <div className="lg:col-span-5 space-y-4">
                    <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#EB3B2D] tabular-nums">
                      Article {String(leadPost.number).padStart(2, '0')} ·{' '}
                      {leadPost.category} · {formatShortDate(leadPost.publishedAt)}
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.02em] leading-[1.16] text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors [text-wrap:balance]">
                      {leadPost.title}
                    </h2>
                    <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {leadPost.excerpt}
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-neutral-200 dark:border-white/[0.08] text-xs font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                      <span>
                        {leadPost.readTimeMinutes} min read · {leadPost.sources.length} sources
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors font-medium">
                        <span>Read Monograph</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Tier 2: Core Technical Guides (Articles 02–05) */}
            {featuredGridPosts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-baseline justify-between border-b border-neutral-200 dark:border-white/[0.08] pb-3">
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-neutral-950 dark:text-white">
                    Core Architectural Guides
                  </h2>
                  <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-500 tabular-nums">
                    Articles 02 – 05
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredGridPosts.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="group rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] hover:border-[#EB3B2D]/60 transition-colors overflow-hidden flex flex-col"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-[#0c0c0c]">
                        <img
                          src={post.featuredImage}
                          alt={post.featuredImageAlt}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#EB3B2D] tabular-nums">
                            Article {String(post.number).padStart(2, '0')} ·{' '}
                            {post.readTimeMinutes} min read · {post.sources.length} sources
                          </div>
                          <h3 className="font-display text-xl font-semibold leading-snug text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors [text-wrap:balance]">
                            {post.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="pt-4 mt-2 border-t border-neutral-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono text-neutral-500">
                          <span>{formatShortDate(post.publishedAt)}</span>
                          <span className="inline-flex items-center gap-1 text-neutral-900 dark:text-neutral-200 group-hover:text-[#EB3B2D] transition-colors">
                            <span>Read</span>
                            <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tier 3: Hardware, Paradigms, Data, NLP & Vision Archive (Articles 06–10 or Search Results) */}
            {archivePosts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-baseline justify-between border-b border-neutral-200 dark:border-white/[0.08] pb-3">
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-neutral-950 dark:text-white">
                    {isSearching
                      ? `Search Results (${archivePosts.length})`
                      : 'Systems, Data, Language & Vision'}
                  </h2>
                  {!isSearching && (
                    <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-neutral-500 tabular-nums">
                      Articles 06 – 10
                    </span>
                  )}
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-white/[0.08] border-b border-neutral-200 dark:border-white/[0.08]">
                  {archivePosts.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="group py-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center hover:bg-neutral-100/50 dark:hover:bg-white/[0.015] -mx-3 px-3 rounded-xl transition-colors"
                    >
                      <div className="md:col-span-3 aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-[#0c0c0c]">
                        <img
                          src={post.featuredImage}
                          alt={post.featuredImageAlt}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      </div>
                      <div className="md:col-span-7 space-y-2">
                        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#EB3B2D] tabular-nums">
                          Article {String(post.number).padStart(2, '0')} ·{' '}
                          {post.category} · {formatShortDate(post.publishedAt)}
                        </div>
                        <h3 className="font-display text-lg sm:text-xl font-semibold leading-snug text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="md:col-span-2 flex md:flex-col md:items-end justify-between gap-2 text-xs font-mono text-neutral-500 tabular-nums">
                        <span>{post.readTimeMinutes} min read</span>
                        <span>{post.sources.length} sources</span>
                        <span className="inline-flex items-center gap-1 text-neutral-900 dark:text-white group-hover:text-[#EB3B2D] transition-colors">
                          <span>Read</span>
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Cross-Site VIZRA Navigation Footer Strip */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 dark:border-white/[0.08]">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-neutral-500">
              VIZRA Platform Resources
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Apply these AI foundations directly inside the Omnia 1.0 studio and technical documentation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/docs"
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#171717] border border-neutral-200 dark:border-white/[0.1] hover:border-[#EB3B2D]/60 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors inline-flex items-center gap-2"
            >
              <BookOpen size={14} className="text-[#EB3B2D]" />
              <span>Documentation</span>
            </Link>
            <Link
              to="/features"
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#171717] border border-neutral-200 dark:border-white/[0.1] hover:border-[#EB3B2D]/60 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors inline-flex items-center gap-2"
            >
              <Layers size={14} className="text-[#EB3B2D]" />
              <span>Platform Features</span>
            </Link>
            <Link
              to="/studio"
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#171717] border border-neutral-200 dark:border-white/[0.1] hover:border-[#EB3B2D]/60 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors inline-flex items-center gap-2"
            >
              <Cpu size={14} className="text-[#EB3B2D]" />
              <span>Creative Studio</span>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
