import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Command,
  FilePlus2,
  History,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { Conversation } from '../../types/ai';
import { createInitialConversations } from '../../services/conversationSeeds';
import { getAllProjects } from '../../services/projectService';
import {
  PromptPresetId,
  getPresetById,
  optimizeCreativePrompt,
} from '../../utils/promptOptimizerEngine';
import { useToast } from '../ui/Toast';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { modKey } from '../../hooks/useKeyboardShortcuts';

export const OPTIMIZER_DRAFT_STORAGE_KEY = 'vizra_optimizer_draft';
const CONVERSATIONS_STORAGE_KEY = 'omnia_conversations_v1';

export interface StudioQuickActionsMenuProps {
  context: 'workspace' | 'ai';
  onNewDraft: () => void;
  onOptimizePrompt?: (optimizedPrompt: string, rawPrompt: string) => void;
  onSelectConversation?: (conversationId: string) => void;
  onOpenCommandPalette?: () => void;
  lastPromptOverride?: string | null;
  conversationsOverride?: Conversation[];
}

function readStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Conversation[];
      }
    }
  } catch {
    // Fallback to initial seeded conversations below
  }
  return createInitialConversations();
}

function extractLatestPromptFromConversations(conversations: Conversation[]): string | null {
  const sorted = [...conversations].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  for (const conv of sorted) {
    const messages = conv.messages || [];
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.trim().length > 0) {
        return msg.content.trim();
      }
    }
  }
  return null;
}

function inferPromptPreset(promptText: string): PromptPresetId {
  const lower = promptText.toLowerCase();
  if (/\b(glsl|shader|webgl|three\.?js|typescript|react|code|component|css|api|function)\b/.test(lower)) {
    return 'creative-code';
  }
  if (/\b(music|audio|track|synth|soundtrack|beat|bpm|ambient|jingle|sound design)\b/.test(lower)) {
    return 'music-audio';
  }
  if (/\b(storyboard|script|scene|dialogue|screenplay|voiceover|shot list)\b/.test(lower)) {
    return 'storyboard-script';
  }
  if (/\b(brand|identity|logo|palette|typography system|design system|style guide)\b/.test(lower)) {
    return 'brand-system';
  }
  if (/\b(research|paper|study|benchmark|analysis|literature|citation|report)\b/.test(lower)) {
    return 'research-brief';
  }
  if (/\b(photo|photography|editorial|lighting|composition|portrait|architecture|render)\b/.test(lower)) {
    return 'visual-direction';
  }
  return 'motion-design';
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function truncateText(text: string, maxLength: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

export const StudioQuickActionsMenu: React.FC<StudioQuickActionsMenuProps> = ({
  context,
  onNewDraft,
  onOptimizePrompt,
  onSelectConversation,
  onOpenCommandPalette,
  lastPromptOverride,
  conversationsOverride,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openPalette } = useCommandPalette();
  const prefersReducedMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [panelView, setPanelView] = useState<'actions' | 'history'>('actions');
  const [storedConversations, setStoredConversations] = useState<Conversation[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshLocalHistory = useCallback(() => {
    if (!conversationsOverride) {
      setStoredConversations(readStoredConversations());
    }
  }, [conversationsOverride]);

  useEffect(() => {
    if (isOpen) {
      refreshLocalHistory();
    } else {
      setPanelView('actions');
    }
  }, [isOpen, refreshLocalHistory]);

  // Dismiss on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  // Keyboard shortcuts: Alt+Q to toggle, Escape to step back or close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'q') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        if (panelView === 'history') {
          setPanelView('actions');
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, panelView]);

  const effectiveConversations = useMemo(() => {
    const source = conversationsOverride ?? storedConversations;
    return [...source].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [conversationsOverride, storedConversations]);

  const recentHistory = useMemo(
    () => effectiveConversations.slice(0, 4),
    [effectiveConversations]
  );

  const latestPrompt = useMemo(() => {
    if (lastPromptOverride && lastPromptOverride.trim().length > 0) {
      return lastPromptOverride.trim();
    }
    const fromChats = extractLatestPromptFromConversations(effectiveConversations);
    if (fromChats) return fromChats;

    try {
      const projects = getAllProjects();
      const firstProject = projects[0];
      if (firstProject?.description?.trim()) return firstProject.description.trim();
      if (firstProject?.title?.trim()) return firstProject.title.trim();
    } catch {
      // Ignore storage read issues
    }
    return null;
  }, [lastPromptOverride, effectiveConversations]);

  const handleNewDraftClick = () => {
    setIsOpen(false);
    onNewDraft();
    toast({
      type: 'success',
      title: context === 'ai' ? 'New draft ready' : 'New project draft opened',
      description:
        context === 'ai'
          ? 'Started a fresh Omnia thread and focused the prompt composer.'
          : 'Configure your new 10-stage creative project brief.',
      durationMs: 3200,
    });
  };

  const handleOptimizeLastPrompt = () => {
    setIsOpen(false);

    if (!latestPrompt) {
      toast({
        type: 'info',
        title: 'Opening Prompt Optimizer',
        description: 'No recent prompt found yet — start refining a fresh creative brief.',
        durationMs: 3600,
      });
      navigate('/free-ai-prompt-optimizer');
      return;
    }

    if (onOptimizePrompt) {
      const presetId = inferPromptPreset(latestPrompt);
      const preset = getPresetById(presetId);
      const result = optimizeCreativePrompt({
        rawIdea: latestPrompt,
        presetId,
        targetFormat: preset.defaultFormat,
        tone: preset.defaultTone,
        detailLevel: 'production',
        audience: '',
        exclusions: preset.sampleExclusions,
      });

      onOptimizePrompt(result.optimizedPrompt, latestPrompt);
      toast({
        type: 'success',
        title: 'Last prompt optimized',
        description: `Applied ${preset.shortLabel} structure (${result.wordCountBefore} → ${result.wordCountAfter} words) in the composer.`,
        durationMs: 5200,
        actionLabel: 'Fine-tune',
        onAction: () => {
          try {
            sessionStorage.setItem(OPTIMIZER_DRAFT_STORAGE_KEY, latestPrompt);
          } catch {
            // Ignore storage errors
          }
          navigate('/free-ai-prompt-optimizer');
        },
      });
      return;
    }

    try {
      sessionStorage.setItem(OPTIMIZER_DRAFT_STORAGE_KEY, latestPrompt);
    } catch {
      // Ignore storage errors
    }
    toast({
      type: 'success',
      title: 'Loaded last prompt in Optimizer',
      description: truncateText(latestPrompt, 84),
      durationMs: 3600,
    });
    navigate('/free-ai-prompt-optimizer');
  };

  const handleOpenConversation = (conversation: Conversation) => {
    setIsOpen(false);
    if (onSelectConversation) {
      onSelectConversation(conversation.id);
      toast({
        type: 'info',
        title: 'Switched conversation',
        description: truncateText(conversation.title || 'Untitled session', 68),
        durationMs: 2600,
      });
      return;
    }

    try {
      sessionStorage.setItem('omnia_open_conversation_id', conversation.id);
    } catch {
      // Ignore storage errors
    }
    navigate('/ai');
  };

  const handleOpenFullHistory = () => {
    setIsOpen(false);
    navigate('/history');
  };

  const handleSwitchStudioSurface = () => {
    setIsOpen(false);
    navigate(context === 'ai' ? '/workspace' : '/ai');
  };

  const handleTriggerCommandPalette = () => {
    setIsOpen(false);
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
    } else {
      openPalette();
    }
  };

  const positionClass =
    context === 'ai'
      ? 'fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40'
      : 'fixed bottom-6 right-6 z-40';

  return (
    <div ref={containerRef} className={positionClass}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="studio-quick-actions-popover"
            role="menu"
            aria-label="Studio Quick Actions"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 w-[320px] sm:w-[348px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 dark:bg-[#111114]/95 backdrop-blur-xl border border-neutral-200 dark:border-white/[0.12] shadow-2xl shadow-black/25 dark:shadow-black/75 overflow-hidden text-neutral-900 dark:text-white"
          >
            {panelView === 'actions' ? (
              <div>
                {/* Header */}
                <div className="px-4 py-3 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#EB3B2D]/12 text-[#EB3B2D] flex items-center justify-center shrink-0">
                      <Zap size={13} />
                    </span>
                    <span className="text-xs font-semibold tracking-tight text-neutral-900 dark:text-white truncate">
                      Quick Actions
                    </span>
                  </div>
                  <kbd className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] shrink-0">
                    Alt+Q
                  </kbd>
                </div>

                {/* Primary Actions */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleNewDraftClick}
                    className="w-full min-h-[48px] px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] active:scale-[0.99] transition-colors flex items-center gap-3 text-left cursor-pointer group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#EB3B2D]/10 text-[#EB3B2D] flex items-center justify-center shrink-0">
                      <FilePlus2 size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                        New Draft
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {context === 'ai'
                          ? 'Start a fresh Omnia chat session'
                          : 'Launch a new 10-stage studio project'}
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors shrink-0"
                    />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleOptimizeLastPrompt}
                    className="w-full min-h-[48px] px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] active:scale-[0.99] transition-colors flex items-center gap-3 text-left cursor-pointer group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-200 group-hover:text-[#EB3B2D] flex items-center justify-center shrink-0 transition-colors">
                      <Wand2 size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                        Optimize Last Prompt
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {latestPrompt
                          ? truncateText(latestPrompt, 46)
                          : 'Open structured prompt optimizer'}
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors shrink-0"
                    />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setPanelView('history')}
                    className="w-full min-h-[48px] px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] active:scale-[0.99] transition-colors flex items-center gap-3 text-left cursor-pointer group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-200 group-hover:text-[#EB3B2D] flex items-center justify-center shrink-0 transition-colors">
                      <History size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                        View Recent History
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums truncate">
                        {effectiveConversations.length > 0
                          ? `${effectiveConversations.length} saved session${effectiveConversations.length === 1 ? '' : 's'} ready to resume`
                          : 'Browse past studio conversations'}
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors shrink-0"
                    />
                  </button>
                </div>

                {/* Secondary Workspace Actions */}
                <div className="p-1.5 border-t border-neutral-200/80 dark:border-white/[0.08] flex items-center gap-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSwitchStudioSurface}
                    className="flex-1 min-h-[40px] px-2.5 py-2 rounded-xl bg-neutral-100/80 dark:bg-white/[0.04] hover:bg-neutral-200/80 dark:hover:bg-white/[0.08] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    {context === 'ai' ? (
                      <>
                        <LayoutDashboard size={13} className="text-[#EB3B2D] shrink-0" />
                        <span>Workspace</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-[#EB3B2D] shrink-0" />
                        <span>Omnia AI</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleTriggerCommandPalette}
                    className="flex-1 min-h-[40px] px-2.5 py-2 rounded-xl bg-neutral-100/80 dark:bg-white/[0.04] hover:bg-neutral-200/80 dark:hover:bg-white/[0.08] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Command size={13} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
                    <span>Commands</span>
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                      {modKey}K
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Recent History Sub-panel Header */}
                <div className="px-3 py-2.5 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPanelView('actions')}
                    className="min-h-[32px] px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ArrowLeft size={13} />
                    <span>Recent History</span>
                  </button>
                  <span className="text-[11px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400 pr-1">
                    {recentHistory.length}/{effectiveConversations.length}
                  </span>
                </div>

                {/* Recent Sessions List */}
                <div className="p-1.5 max-h-[264px] overflow-y-auto space-y-0.5">
                  {recentHistory.length === 0 ? (
                    <div className="px-3 py-6 text-center space-y-2">
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        No recent studio threads yet
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Start a new draft to create your first session.
                      </p>
                    </div>
                  ) : (
                    recentHistory.map((conv) => {
                      const msgCount = conv.messages?.length || 0;
                      return (
                        <button
                          key={conv.id}
                          type="button"
                          role="menuitem"
                          onClick={() => handleOpenConversation(conv)}
                          className="w-full min-h-[48px] px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-2.5 text-left cursor-pointer group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 group-hover:text-[#EB3B2D] flex items-center justify-center shrink-0 transition-colors">
                            <MessageSquare size={13} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                              {conv.title || 'Untitled session'}
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums flex items-center gap-1.5">
                              <span>{formatRelativeTime(conv.updatedAt || Date.now())}</span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {msgCount} msg{msgCount === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                          <ArrowUpRight
                            size={13}
                            className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white shrink-0 transition-colors"
                          />
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer Link to Full History Page */}
                <div className="p-1.5 border-t border-neutral-200/80 dark:border-white/[0.08]">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleOpenFullHistory}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-neutral-100/80 dark:bg-white/[0.05] hover:bg-neutral-200/80 dark:hover:bg-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <span>Open Full History</span>
                    <ArrowUpRight size={13} className="text-[#EB3B2D]" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls="studio-quick-actions-popover"
          aria-label={isOpen ? 'Close Quick Actions menu' : 'Open Quick Actions menu'}
          title="Quick Actions (Alt+Q)"
          className={`min-h-[44px] px-3.5 sm:px-4 rounded-full border shadow-xl backdrop-blur-md transition-all active:scale-[0.97] flex items-center gap-2 text-xs font-semibold whitespace-nowrap cursor-pointer ${
            isOpen
              ? 'bg-[#EB3B2D] text-white border-[#EB3B2D] shadow-[#EB3B2D]/25'
              : 'bg-white/95 dark:bg-[#141418]/95 text-neutral-900 dark:text-white border-neutral-200 dark:border-white/[0.14] hover:border-[#EB3B2D]/60 shadow-black/15 dark:shadow-black/60'
          }`}
        >
          {isOpen ? (
            <X size={15} className="shrink-0" />
          ) : (
            <Zap size={15} className="text-[#EB3B2D] shrink-0" />
          )}
          <span className="hidden sm:inline">Quick Actions</span>
        </button>
      </div>
    </div>
  );
};
