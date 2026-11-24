import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  RotateCw,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import type { BlogPost } from '../../data/blog/types';
import { MarkdownRenderer } from '../ai/MarkdownRenderer';
import { useCopyToClipboard } from '../../utils/clipboard';
import { fetchWithRetry, HIGH_TRAFFIC_MESSAGE } from '../../utils/apiErrorHandler';

interface BlogAgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

interface BlogArticleAgentProps {
  post: BlogPost;
}

export const BlogArticleAgent: React.FC<BlogArticleAgentProps> = ({ post }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<BlogAgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { copy } = useCopyToClipboard({
    defaultLabel: 'Agent answer copied to clipboard.',
  });

  // Reset conversation cleanly when reader navigates to a different monograph
  useEffect(() => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
  }, [post.slug]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const starterPrompts = [
    'Summarize the key takeaways of this article.',
    `Explain the core technical framework in "${post.title.slice(0, 42)}${post.title.length > 42 ? '…' : ''}".`,
    post.faqs[0]?.question || 'What are the main limitations discussed here?',
  ];

  const handleAsk = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: BlogAgentMessage = {
      id: `ba-u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetchWithRetry(
        '/api/blog/agent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: post.slug,
            question: trimmed,
            history: messages.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        },
        { timeoutMs: 22000, maxRetries: 1 }
      );

      const data = await res.json().catch(() => null);
      if (res.ok && data?.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ba-a-${Date.now()}`,
            role: 'assistant',
            content: String(data.text),
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
    } catch {
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
      setIsLoading(false);
    }
  };

  const handleCopyAnswer = async (msg: BlogAgentMessage) => {
    const ok = await copy(msg.content, 'Agent answer copied to clipboard.');
    if (ok) {
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId((prev) => (prev === msg.id ? null : prev)), 2000);
    }
  };

  const handleRetryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      handleAsk(lastUser.content);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Article Reading Agent"
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#111111] hover:bg-[#191919] text-white border border-white/15 hover:border-[#EB3B2D]/70 shadow-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D]"
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EB3B2D]" />
          </span>
          <Sparkles size={14} className="text-[#EB3B2D]" />
          <span className="text-xs font-display font-semibold tracking-wide">Agent</span>
        </button>
      ) : (
        <section
          role="dialog"
          aria-label={`Reading Agent for ${post.title}`}
          className="w-[min(24.5rem,calc(100vw-2rem))] h-[min(34rem,calc(100vh-6rem))] rounded-2xl bg-[#0c0c0c] border border-white/15 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-[#121212] flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#EB3B2D]">
                <BookOpen size={12} />
                <span>Article Agent · #{String(post.number).padStart(2, '0')}</span>
              </div>
              <p className="text-xs font-medium text-white truncate mt-0.5">{post.title}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Article Agent"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-neutral-300 leading-relaxed">
                  Ask anything about this monograph. Answers are grounded strictly to{' '}
                  <strong className="text-white">{post.title}</strong> and never consume your studio credits.
                </p>
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    Suggested Questions
                  </div>
                  {starterPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAsk(prompt)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#EB3B2D]/50 text-neutral-200 transition-colors cursor-pointer leading-snug"
                    >
                      {prompt}
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
                    <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tr-sm bg-[#EB3B2D] text-white leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`w-full rounded-xl p-3 border ${
                        msg.isError
                          ? 'bg-red-950/30 border-red-500/30 text-red-200'
                          : 'bg-[#141414] border-white/10 text-neutral-200'
                      }`}
                    >
                      {msg.isError ? (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRetryLast}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[11px] font-medium text-red-200 cursor-pointer"
                          >
                            <RotateCw size={11} />
                            <span>Retry</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="prose-xs">
                            <MarkdownRenderer content={msg.content} />
                          </div>
                          <div className="mt-2 pt-2 border-t border-white/[0.06] flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleCopyAnswer(msg)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={11} className="text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
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
              <div className="p-3 rounded-xl bg-[#141414] border border-white/10 text-neutral-400 font-mono text-[11px] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EB3B2D] animate-pulse" />
                <span>Reading monograph &amp; synthesizing answer…</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(input);
            }}
            className="p-3 border-t border-white/10 bg-[#121212] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this article..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded-xl bg-black border border-white/10 focus:border-[#EB3B2D] focus:outline-none text-xs text-white placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send question to article agent"
              className="p-2 rounded-xl bg-[#EB3B2D] hover:bg-[#dc2626] text-white disabled:opacity-40 cursor-pointer transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
