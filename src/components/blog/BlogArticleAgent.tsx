import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  RotateCw,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Square,
  RotateCcw,
  ArrowUpRight,
  Compass,
} from 'lucide-react';
import type { BlogPost } from '../../data/blog/types';
import { MarkdownRenderer } from '../ai/MarkdownRenderer';
import { useCopyToClipboard } from '../../utils/clipboard';
import { fetchWithRetry, HIGH_TRAFFIC_MESSAGE } from '../../utils/apiErrorHandler';
import { generateArticleSuggestions } from '../../utils/articleSuggestions';

interface ReferencedArticle {
  slug: string;
  title: string;
  url: string;
  category?: string;
  isCurrent?: boolean;
}

interface VerifiedWebSource {
  title: string;
  url: string;
}

interface BlogAgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  referencedArticles?: ReferencedArticle[];
  webSources?: VerifiedWebSource[];
}

export interface BlogArticleAgentProps {
  post: BlogPost;
  currentSection?: { id: string; heading: string } | null;
  allPosts?: BlogPost[];
}

export const BlogArticleAgent: React.FC<BlogArticleAgentProps> = ({
  post,
  currentSection = null,
  allPosts = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<BlogAgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSlugRef = useRef<string>(post.slug);

  const { copy } = useCopyToClipboard({
    defaultLabel: 'Response copied to clipboard.',
  });

  useEffect(() => {
    setMounted(true);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Reset conversation & cancel in-flight requests cleanly when navigating to another article
  useEffect(() => {
    activeSlugRef.current = post.slug;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([]);
    setInput('');
    setIsLoading(false);
  }, [post.slug]);

  // Auto-scroll to latest message when opened or updated
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // Focus input smoothly when dialog opens & close cleanly on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto-resize composer textarea cleanly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(112, Math.max(38, el.scrollHeight))}px`;
  }, [input, isOpen]);

  // Dynamic, strictly article-specific suggestions derived from actual headings, blocks, terms & active section
  const smartSuggestions = useMemo(() => {
    const bySlug = new Map(allPosts.map((p) => [p.slug, p]));
    const relatedTitles = post.relatedSlugs
      .map((s) => bySlug.get(s)?.title)
      .filter((t): t is string => Boolean(t));

    return generateArticleSuggestions(post, {
      currentSectionId: currentSection?.id || null,
      relatedTitles,
    });
  }, [post, currentSection?.id, allPosts]);

  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const handleResetChat = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([]);
    setInput('');
    setIsLoading(false);
    window.setTimeout(() => textareaRef.current?.focus(), 30);
  }, []);

  const handleAsk = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim();
      if (!trimmed || isLoading) return;

      const requestSlug = post.slug;
      const priorHistory = messages
        .filter((m) => !m.isError)
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const userMsg: BlogAgentMessage = {
        id: `ba-u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const articleContext = {
        articleId: `article-${String(post.number).padStart(2, '0')}`,
        slug: post.slug,
        title: post.title,
        url: `/blog/${post.slug}`,
        headings: post.sections.map((s) => ({
          id: s.id,
          heading: s.heading,
          level: s.level,
        })),
        currentSection: currentSection
          ? { id: currentSection.id, heading: currentSection.heading }
          : null,
      };

      try {
        const res = await fetchWithRetry(
          '/api/blog/agent',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              slug: post.slug,
              question: trimmed,
              history: priorHistory,
              articleContext,
            }),
          },
          { timeoutMs: 30000, maxRetries: 1 }
        );

        // Ignore response if user navigated to another article mid-flight
        if (activeSlugRef.current !== requestSlug) return;

        const data = await res.json().catch(() => null);
        if (res.ok && data?.text) {
          const verifiedRefs: ReferencedArticle[] = Array.isArray(data.referencedArticles)
            ? data.referencedArticles.filter(
                (r: any): r is ReferencedArticle =>
                  Boolean(r && typeof r.slug === 'string' && typeof r.url === 'string' && r.url.startsWith('/blog/'))
              )
            : [];

          const verifiedWeb: VerifiedWebSource[] = Array.isArray(data.webSources)
            ? data.webSources.filter(
                (w: any): w is VerifiedWebSource =>
                  Boolean(w && typeof w.url === 'string' && /^https?:\/\//i.test(w.url))
              )
            : [];

          setMessages((prev) => [
            ...prev,
            {
              id: `ba-a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              role: 'assistant',
              content: String(data.text),
              referencedArticles: verifiedRefs,
              webSources: verifiedWeb,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `ba-e-${Date.now()}`,
              role: 'assistant',
              content: data?.error?.message || HIGH_TRAFFIC_MESSAGE,
              isError: true,
            },
          ]);
        }
      } catch (err: any) {
        if (controller.signal.aborted || err?.name === 'AbortError' || activeSlugRef.current !== requestSlug) {
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `ba-e-${Date.now()}`,
            role: 'assistant',
            content: HIGH_TRAFFIC_MESSAGE,
            isError: true,
          },
        ]);
      } finally {
        if (activeSlugRef.current === requestSlug) {
          setIsLoading(false);
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [isLoading, messages, post, currentSection]
  );

  const handleCopyAnswer = async (msg: BlogAgentMessage) => {
    const ok = await copy(msg.content, 'Response copied to clipboard.');
    if (ok) {
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId((prev) => (prev === msg.id ? null : prev)), 2000);
    }
  };

  const handleRetryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      // Remove trailing error bubble before re-submitting cleanly
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.isError ? prev.slice(0, -1) : prev;
      });
      void handleAsk(lastUser.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleAsk(input);
    }
  };

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  // Rendered into document.body via React Portal at z-[80] so it escapes <main className="relative z-10">
  // and overflow-x-clip stacking traps that previously blocked desktop/mobile clicks and clipped overlays.
  const portalContent = (
    <div
      data-vizra-article-agent="true"
      className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-5 sm:bottom-5 z-[80] pointer-events-none flex justify-end p-3 sm:p-0"
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          aria-label="Open VIZRA Article Agent"
          aria-expanded={false}
          aria-controls="vizra-article-agent-dialog"
          className="pointer-events-auto touch-manipulation group flex items-center gap-2.5 min-h-[44px] px-4 py-2.5 rounded-full bg-white dark:bg-[#111111] hover:bg-neutral-50 dark:hover:bg-[#1a1a1a] text-neutral-950 dark:text-white border border-neutral-300 dark:border-white/15 hover:border-[#EB3B2D]/70 shadow-[0_12px_32px_rgba(0,0,0,0.16)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EB3B2D]" />
          </span>
          <Sparkles size={14} className="text-[#EB3B2D] shrink-0" />
          <span className="text-xs font-display font-semibold tracking-wide">
            Article Agent
          </span>
        </button>
      ) : (
        <section
          id="vizra-article-agent-dialog"
          role="dialog"
          aria-modal="false"
          aria-label={`VIZRA Article Agent for ${post.title}`}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full sm:w-[min(27rem,calc(100vw-2.5rem))] h-[min(82dvh,39rem)] sm:h-[min(39rem,calc(100vh-5.5rem))] rounded-2xl bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.28)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#121212] flex items-start justify-between gap-2 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#EB3B2D]">
                <BookOpen size={12} className="shrink-0" />
                <span>Article Agent</span>
              </div>
              <p className="text-xs font-semibold text-neutral-950 dark:text-white truncate mt-0.5">
                {post.title}
              </p>
              {currentSection && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  <Compass size={11} className="text-[#EB3B2D] shrink-0" />
                  <span className="truncate">Section: {currentSection.heading}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  aria-label="Start a new conversation"
                  title="New chat"
                  className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Article Agent"
                title="Close (Esc)"
                className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-white dark:bg-[#0c0c0c]"
          >
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="rounded-xl p-3.5 bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-white/10 space-y-1.5">
                  <p className="text-[13px] text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    Ask anything about{' '}
                    <strong className="font-semibold text-neutral-950 dark:text-white">
                      {post.title}
                    </strong>
                    , connect ideas across all published VIZRA articles, or ask any general, coding, or research question.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                    Suggested for this article
                  </div>
                  {smartSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void handleAsk(item.prompt)}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] border border-neutral-200 dark:border-white/10 hover:border-[#EB3B2D]/60 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer touch-manipulation leading-snug flex items-start justify-between gap-2 group"
                    >
                      <span className="text-[12.5px] leading-snug">{item.label}</span>
                      <ArrowUpRight
                        size={13}
                        className="shrink-0 mt-0.5 text-neutral-400 group-hover:text-[#EB3B2D] transition-colors"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[88%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-[#EB3B2D] text-white text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`w-full rounded-xl p-3.5 border ${
                        msg.isError
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200'
                          : 'bg-neutral-50 dark:bg-[#141414] border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {msg.isError ? (
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-2">
                            <AlertTriangle
                              size={14}
                              className="text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                            />
                            <p className="text-[12.5px] leading-relaxed">{msg.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRetryLast}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/10 dark:bg-red-500/20 hover:bg-red-600/20 dark:hover:bg-red-500/30 text-[11px] font-medium text-red-700 dark:text-red-200 cursor-pointer touch-manipulation"
                          >
                            <RotateCw size={11} />
                            <span>Retry</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-[13px] [&_p]:text-[13px] [&_li]:text-[13px] [&_h1]:text-base [&_h2]:text-[15px] [&_h3]:text-sm">
                            <MarkdownRenderer content={msg.content} />
                          </div>

                          {/* Verified VIZRA Blog Article References */}
                          {msg.referencedArticles && msg.referencedArticles.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-neutral-200/80 dark:border-white/[0.08] space-y-1.5">
                              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                                VIZRA Articles Referenced
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.referencedArticles.map((art) => (
                                  <Link
                                    key={art.slug}
                                    to={art.url}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.05] hover:bg-neutral-100 dark:hover:bg-white/[0.1] border border-neutral-200 dark:border-white/10 hover:border-[#EB3B2D]/60 text-[11px] text-neutral-800 dark:text-neutral-200 hover:text-[#EB3B2D] transition-colors max-w-full"
                                  >
                                    <BookOpen size={10} className="text-[#EB3B2D] shrink-0" />
                                    <span className="truncate max-w-[14rem]">
                                      {art.isCurrent ? `Current: ${art.title}` : art.title}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Verified External Web Sources (when live web search grounded the answer) */}
                          {msg.webSources && msg.webSources.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-neutral-200/80 dark:border-white/[0.08] space-y-1.5">
                              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                                Verified Web Sources
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.webSources.map((src, sIdx) => (
                                  <a
                                    key={`${src.url}-${sIdx}`}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-white/[0.05] hover:bg-neutral-100 dark:hover:bg-white/[0.1] border border-neutral-200 dark:border-white/10 hover:border-[#EB3B2D]/60 text-[11px] text-neutral-700 dark:text-neutral-300 hover:text-[#EB3B2D] transition-colors max-w-full"
                                  >
                                    <span className="truncate max-w-[13rem]">{src.title}</span>
                                    <ExternalLink size={10} className="shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-2.5 pt-2 border-t border-neutral-200/70 dark:border-white/[0.06] flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleCopyAnswer(msg)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer touch-manipulation"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 font-mono text-[11px] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EB3B2D] animate-pulse shrink-0" />
                <span>Thinking…</span>
              </div>
            )}
          </div>

          {/* Input Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleAsk(input);
            }}
            className="p-3 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#121212] flex items-end gap-2 shrink-0"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this article, VIZRA blog, or anything..."
              disabled={isLoading}
              aria-label="Message the VIZRA Article Agent"
              className="flex-1 resize-none px-3 py-2 rounded-xl bg-white dark:bg-black border border-neutral-300 dark:border-white/15 focus:border-[#EB3B2D] focus:outline-none text-[13px] leading-snug text-neutral-950 dark:text-white placeholder:text-neutral-500 max-h-28 overflow-y-auto"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                aria-label="Stop generating response"
                title="Stop"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-900 dark:text-white cursor-pointer transition-colors shrink-0 touch-manipulation"
              >
                <Square size={13} className="fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message to Article Agent"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-[#EB3B2D] hover:bg-[#dc2626] text-white disabled:opacity-40 cursor-pointer transition-colors shrink-0 touch-manipulation"
              >
                <Send size={14} />
              </button>
            )}
          </form>
        </section>
      )}
    </div>
  );

  return createPortal(portalContent, document.body);
};
