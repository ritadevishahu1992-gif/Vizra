import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  BookOpen,
  Layers,
  Cpu,
  ArrowLeft,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { BLOG_POSTS, getPublishedBlogPost } from '../data/blogPosts';

export const BlogPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const activePost = slug ? getPublishedBlogPost(slug) : undefined;

  // Individual Article View (/blog/:slug) when a published post exists
  if (slug && activePost) {
    return (
      <PageLayout
        title={`${activePost.title} — Vizra Blog`}
        description={activePost.description}
        canonicalPath={`/blog/${activePost.slug}`}
      >
        <article className="pt-28 md:pt-36 pb-20 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 border-b border-white/[0.06] pb-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Back to Vizra Blog</span>
            </Link>
            <div className="typo-eyebrow">
              {activePost.category} · {activePost.publishedAt} · {activePost.readTimeMinutes} min read
            </div>
            <h1 className="typo-page-title">{activePost.title}</h1>
            <p className="typo-body-lg">{activePost.description}</p>
            <div className="text-xs font-mono text-neutral-500">
              By {activePost.author}
            </div>
          </div>

          <div className="space-y-5 text-sm sm:text-base text-neutral-300 leading-relaxed">
            {activePost.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>
      </PageLayout>
    );
  }

  // Non-existent article slug (/blog/:slug when slug does not match any published post)
  if (slug && !activePost) {
    return (
      <PageLayout
        title="Article Not Found — Vizra Blog"
        description="The requested article could not be found. No articles have been published at this URL yet."
        canonicalPath={null}
        noindex={true}
      >
        <section className="pt-28 md:pt-36 pb-24 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
          <div className="p-8 sm:p-12 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-white/[0.1] flex items-center justify-center text-[#EB3B2D] mx-auto">
              <FileText size={20} />
            </div>
            <div className="space-y-2">
              <div className="typo-eyebrow">VIZRA Editorial · Article Not Found</div>
              <h1 className="typo-section-title">No articles published yet.</h1>
              <p className="text-sm text-neutral-400 max-w-lg mx-auto">
                The requested article path (<code className="text-neutral-300 font-mono text-xs">/blog/{slug}</code>) does not match a published post.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/blog"
                className="px-5 py-2.5 rounded-xl bg-white text-black font-display font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Return to Blog</span>
              </Link>
              <Link
                to="/docs"
                className="px-5 py-2.5 rounded-xl bg-[#171717] border border-white/[0.1] hover:border-white/[0.2] text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-2"
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

  // Primary Blog Landing View (/blog)
  return (
    <PageLayout
      title="Blog & Studio Updates — Vizra AI Creative Studio"
      description="Official blog and editorial updates for VIZRA AI Creative Studio and Omnia 1.0."
      canonicalPath="/blog"
    >
      {/* Header */}
      <section className="pt-28 md:pt-36 pb-14 px-6 sm:px-10 lg:px-16 max-w-5xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl space-y-4">
          <div className="typo-eyebrow">VIZRA Editorial &amp; Studio Updates</div>
          <h1 className="typo-page-title">Blog</h1>
          <p className="typo-body-lg">
            Product announcements, engineering notes, and creative workflow guides from VIZRA AI Creative Studio.
          </p>
        </div>
      </section>

      {/* Main Content Area: Real Published Posts or Clean Empty State */}
      <section className="py-16 md:py-24 px-6 sm:px-10 lg:px-16 max-w-5xl mx-auto space-y-10">
        {BLOG_POSTS.length === 0 ? (
          <div className="p-8 sm:p-14 rounded-2xl bg-[#111111] border border-white/[0.08] text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-white/[0.1] flex items-center justify-center text-[#EB3B2D] mx-auto">
              <FileText size={20} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-white">
                No articles published yet.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                New technical guides and studio announcements will appear here once published. In the meantime, explore our documentation and live studio features.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/docs"
                className="px-5 py-2.5 rounded-xl bg-white text-black font-display font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
              >
                <BookOpen size={14} />
                <span>Browse Documentation</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/features"
                className="px-5 py-2.5 rounded-xl bg-[#171717] border border-white/[0.1] hover:border-white/[0.2] text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <Layers size={14} className="text-[#EB3B2D]" />
                <span>Explore Features</span>
              </Link>
              <Link
                to="/studio"
                className="px-5 py-2.5 rounded-xl bg-[#171717] border border-white/[0.1] hover:border-white/[0.2] text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <Cpu size={14} className="text-[#EB3B2D]" />
                <span>Creative Studio</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="p-6 rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-[#DC2626]/50 transition-colors group space-y-3"
              >
                <div className="text-[11px] font-mono text-[#EB3B2D]">
                  {post.category} · {post.publishedAt}
                </div>
                <h2 className="typo-card-title group-hover:text-[#EB3B2D] transition-colors">
                  {post.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  {post.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
};
