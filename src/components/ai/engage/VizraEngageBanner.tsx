import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Minimize2, Maximize2 } from 'lucide-react';
import { AIMode } from '../../../types/ai';
import {
  EngageContentItem,
  EngageLifecycleState,
  EngageCoarseIntent,
} from '../../../types/engage';
import { EngageErrorBoundary } from './EngageErrorBoundary';
import { EngageRenderer } from './EngageRenderer';
import { logSafeInteractionEvent } from '../../../services/engageEventLogger';

export interface VizraEngageBannerProps {
  lifecycleState: EngageLifecycleState;
  mode?: AIMode;
  coarseIntent?: EngageCoarseIntent;
  hasStreamedTokens?: boolean;
  enablePartnerPlaceholderDemo?: boolean;
  forceReducedMotion?: boolean;
  simulateRenderError?: boolean;
  onInsertPrompt?: (promptText: string) => void;
}

export const VIZRA_ENGAGE_TAGLINE = 'Make every second of waiting worth experiencing.';

export function deriveCoarseIntentFromMode(mode: AIMode = 'quick'): EngageCoarseIntent {
  switch (mode) {
    case 'code':
      return 'coding';
    case 'research':
      return 'research';
    case 'create':
      return 'creative';
    case 'analyze':
    case 'think':
      return 'analysis';
    case 'science':
      return 'science';
    case 'quick':
    default:
      return 'general';
  }
}

const PHASE2_CURATED_ITEMS: EngageContentItem[] = [
  {
    id: 'p2-vis-neural-topology',
    title: 'Multi-Stage Context & Reasoning Synthesis',
    subtitle: 'OMNIA 1.0 Neural Topology',
    body: 'OMNIA cross-validates semantic context, structured workspace memory, and domain verification gates in parallel before emitting response tokens.',
    takeaway: 'Zero-blocking asynchronous visual layer • Independent of response generation',
    type: 'visualization',
    category: 'Ambient AI Visualizer',
    targetModes: ['quick', 'think', 'research', 'create', 'code', 'analyze', 'science'],
    targetIntents: ['general', 'coding', 'research', 'creative', 'analysis', 'science'],
    sponsorshipLabel: 'None',
    priority: 98,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 25,
    createdBy: 'system@vizra.ai',
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
  {
    id: 'p2-know-epistemic-gate',
    title: '6-Point Epistemic Verification Gate',
    subtitle: 'Educational Knowledge Card',
    body: 'In Research and Science modes, factual claims are cross-checked against domain authority, retrieval freshness, and semantic entailment to prevent hallucinated citations.',
    takeaway: 'Verified citations only appear when backed by retrieved primary evidence.',
    type: 'knowledge_card',
    category: 'Epistemic Architecture',
    targetModes: ['research', 'science', 'think', 'analyze', 'quick'],
    targetIntents: ['research', 'science', 'analysis', 'general'],
    sponsorshipLabel: 'None',
    priority: 94,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 20,
    createdBy: 'system@vizra.ai',
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
  {
    id: 'p2-tip-studio-workflow',
    title: 'Promote Any Blueprint Into a 10-Stage Project',
    subtitle: 'Creative & Productivity Tip',
    body: 'Switch reasoning modes on the fly or convert architectural plans into structured 10-stage studio workspaces with persistent project memory.',
    shortcutKeys: ['Cmd/Ctrl', 'K'],
    takeaway: 'Works across Code, Create, Research, and Science modes.',
    type: 'creative_tip',
    category: 'Studio Productivity',
    targetModes: ['create', 'code', 'quick', 'think', 'analyze'],
    targetIntents: ['creative', 'coding', 'project', 'general'],
    sponsorshipLabel: 'None',
    priority: 92,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 20,
    createdBy: 'system@vizra.ai',
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
  {
    id: 'p2-exp-prompt-craft',
    title: 'High-Signal Prompt Structuring',
    subtitle: 'Interactive Learning • Prompt Craft',
    body: 'Adding explicit constraints (target runtime, output schema, and edge cases) improves first-pass accuracy on complex engineering and creative tasks.',
    type: 'mini_experience',
    category: 'Prompt Engineering',
    targetModes: ['code', 'create', 'think', 'quick', 'analyze'],
    targetIntents: ['coding', 'creative', 'analysis', 'general'],
    sponsorshipLabel: 'None',
    interactiveConfig: {
      kind: 'prompt_improvement',
      beforePrompt: 'Write a rate limiter in TypeScript.',
      afterPrompt:
        'Implement a token-bucket rate limiter in TypeScript for Express with per-IP sliding windows, bounded memory cleanup, and typed headers.',
    },
    priority: 90,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 15,
    createdBy: 'system@vizra.ai',
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
  {
    id: 'p2-exp-concept-flashcard',
    title: 'Hybrid RAG Retrieval Architecture',
    subtitle: 'Interactive Learning • Concept Flashcard',
    body: 'Test your intuition on how dense vector embeddings and lexical matching combine during context retrieval.',
    type: 'mini_experience',
    category: 'AI Systems Flashcard',
    targetModes: ['research', 'science', 'code', 'think', 'analyze'],
    targetIntents: ['research', 'science', 'coding', 'analysis'],
    sponsorshipLabel: 'None',
    interactiveConfig: {
      kind: 'flashcard',
      flashcardFront:
        'Why combine dense semantic embeddings with BM25 lexical scoring in technical retrieval?',
      flashcardBack:
        'Dense embeddings capture conceptual similarity, while lexical matching guarantees exact hits on identifiers, protein PDB codes, error codes, and function names.',
    },
    priority: 88,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 15,
    createdBy: 'system@vizra.ai',
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
  {
    id: 'p2-exp-creative-decision',
    title: 'Quick Architecture Pulse',
    subtitle: 'Interactive Learning • Micro-Decision',
    body: 'Select the strongest isolation pattern for multi-project AI workspaces:',
    type: 'mini_experience',
    category: 'Architecture Challenge',
    targetModes: ['code', 'think', 'research', 'science', 'analyze', 'quick', 'create'],
    targetIntents: ['coding', 'research', 'analysis', 'general'],
    sponsorshipLabel: 'None',
    interactiveConfig: {
      kind: 'creative_decision',
      question:
        'Which layer guarantees zero cross-tenant context leakage during retrieval?',
      options: [
        'Strict namespace partitioning + verified UID pre-filters',
        'Post-generation regex redaction only',
        'Shared global cache with client-side filtering',
      ],
      correctIndex: 0,
      explanation:
        'Namespace partitioning combined with cryptographic UID pre-filtering prevents unauthorized records from ever entering the retrieval candidate pool.',
    },
    priority: 86,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 15,
    createdBy: 'system@vizra.ai',
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
  {
    id: 'p2-exp-shortcut-trainer',
    title: 'Rapid Mode & Workspace Switching',
    subtitle: 'Interactive Learning • Keyboard Shortcut',
    body: 'Keep your hands on the keyboard while moving between Quick Chat, Deep Think, Code, and Science modes.',
    type: 'mini_experience',
    category: 'Keyboard Mastery',
    targetModes: ['quick', 'code', 'create', 'think', 'research', 'analyze', 'science'],
    targetIntents: ['general', 'coding', 'creative'],
    sponsorshipLabel: 'None',
    interactiveConfig: {
      kind: 'shortcut_learning',
      shortcutKeys: ['Cmd / Ctrl', 'Enter'],
      shortcutAction: 'Dispatch prompt immediately from any multiline editor state',
    },
    priority: 84,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 15,
    createdBy: 'system@vizra.ai',
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
  {
    id: 'p2-ann-vizra-science',
    title: 'VIZRA Announcement: Integrated Science & 3D Molecular Suite',
    subtitle: 'VIZRA Platform Update',
    body: 'Switch to Science Mode to query live RCSB PDB protein structures, PubChem compound properties, and PubMed peer-reviewed literature directly inside your workspace.',
    takeaway: 'Available now in the mode selector bar.',
    type: 'announcement',
    category: 'VIZRA Announcement',
    targetModes: ['science', 'research', 'quick', 'think', 'analyze', 'create', 'code'],
    targetIntents: ['science', 'research', 'general'],
    sponsorshipLabel: 'None',
    priority: 82,
    approvalStatus: 'approved',
    enabled: true,
    frequencyCapPerSession: 15,
    createdBy: 'system@vizra.ai',
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
];

export const VizraEngageBanner: React.FC<VizraEngageBannerProps> = React.memo((props) => {
  const { lifecycleState, hasStreamedTokens = false } = props;

  // Strictly guarantee Engage never renders in idle, completed, cancelled, or failed states
  if (
    lifecycleState === 'idle' ||
    lifecycleState === 'completed' ||
    lifecycleState === 'cancelled' ||
    lifecycleState === 'failed'
  ) {
    return null;
  }

  return (
    <EngageErrorBoundary
      lifecycleState={lifecycleState}
      hasStreamedTokens={hasStreamedTokens}
      resetKey={`${props.mode || 'quick'}-${lifecycleState}`}
    >
      <VizraEngageBannerInner {...props} />
    </EngageErrorBoundary>
  );
});
VizraEngageBanner.displayName = 'VizraEngageBanner';

const VizraEngageBannerInner: React.FC<VizraEngageBannerProps> = ({
  lifecycleState,
  mode = 'quick',
  coarseIntent,
  hasStreamedTokens = false,
  enablePartnerPlaceholderDemo = false,
  forceReducedMotion = false,
  simulateRenderError = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [expandedDuringStream, setExpandedDuringStream] = useState(false);
  const [osReducedMotion, setOsReducedMotion] = useState(false);
  const lastLoggedStateRef = useRef<string | null>(null);

  if (simulateRenderError) {
    throw new Error('Simulated Engage component rendering failure');
  }

  const effectiveReducedMotion = forceReducedMotion || osReducedMotion;
  const effectiveCoarseIntent = useMemo(
    () => coarseIntent ?? deriveCoarseIntentFromMode(mode),
    [coarseIntent, mode]
  );

  // Detect OS/browser reduced-motion preference with safe listener cleanup
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setOsReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setOsReducedMotion(e.matches);
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }, []);

  // Reset transient user dismissal/expansion state when a new generation wait begins
  useEffect(() => {
    if (lifecycleState === 'generating') {
      setDismissed(false);
      setExpandedDuringStream(false);
    }
  }, [lifecycleState]);

  // Select and rank local privacy-safe items using only coarse AIMode and coarseIntent
  const contextualItems = useMemo(() => {
    const scored = PHASE2_CURATED_ITEMS.filter((item) => item.enabled).map((item) => {
      const modeMatch = item.targetModes.includes(mode) ? 20 : 0;
      const intentMatch = item.targetIntents?.includes(effectiveCoarseIntent) ? 15 : 0;
      return {
        item,
        score: item.priority + modeMatch + intentMatch,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const list = scored.map((entry) => entry.item);

    if (enablePartnerPlaceholderDemo) {
      list.push({
        id: 'p2-partner-neutral-slot',
        title: 'Future Approved Partner Presentation Slot',
        subtitle: 'Neutral Structure Demo',
        body: 'Reusable presentation component reserved for future governance-verified partner content. Disabled by default in Phase 2.',
        type: 'partner_placeholder',
        category: 'Internal Slot Demo',
        targetModes: ['quick', 'think', 'research', 'create', 'code', 'analyze', 'science'],
        sponsorshipLabel: 'None',
        priority: 10,
        approvalStatus: 'approved',
        enabled: true,
        frequencyCapPerSession: 5,
        createdBy: 'system@vizra.ai',
        createdAt: 1740000000000,
        updatedAt: 1740000000000,
      });
    }

    return list;
  }, [mode, effectiveCoarseIntent, enablePartnerPlaceholderDemo]);

  // Reset index if mode or coarseIntent changes
  useEffect(() => {
    setActiveIndex(0);
  }, [mode, effectiveCoarseIntent]);

  // Auto-rotate cards only while waiting for first token (generating state) and when reduced motion is off
  const isGeneratingWait =
    lifecycleState === 'generating' ||
    (lifecycleState === 'streaming' && !hasStreamedTokens);
  const isActivelyStreamingTokens =
    lifecycleState === 'streaming' && Boolean(hasStreamedTokens);

  useEffect(() => {
    if (
      dismissed ||
      effectiveReducedMotion ||
      !isGeneratingWait ||
      contextualItems.length <= 1
    ) {
      return undefined;
    }
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % contextualItems.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [dismissed, effectiveReducedMotion, isGeneratingWait, contextualItems.length]);

  // Log privacy-compliant lifecycle transitions without PII
  useEffect(() => {
    const stateKey = `${lifecycleState}-${Boolean(hasStreamedTokens)}-${mode}`;
    if (lastLoggedStateRef.current !== stateKey) {
      lastLoggedStateRef.current = stateKey;
      logSafeInteractionEvent('engage_lifecycle_transition', {
        lifecycleState,
        hasStreamedTokens: Boolean(hasStreamedTokens),
        mode,
        coarseIntent: effectiveCoarseIntent,
      });
    }
  }, [lifecycleState, hasStreamedTokens, mode, effectiveCoarseIntent]);

  const safeActiveIndex =
    contextualItems.length > 0 ? activeIndex % contextualItems.length : 0;
  const currentItem = contextualItems[safeActiveIndex] || contextualItems[0];

  const handleCardInteract = useCallback(() => {
    if (!currentItem) return;
    logSafeInteractionEvent('engage_card_interaction', {
      contentId: currentItem.id,
      contentType: currentItem.type,
      mode,
      action: 'interact',
    });
  }, [currentItem, mode]);

  // Immediately remove Engage on idle, completed, cancelled, or failed states
  if (
    lifecycleState === 'idle' ||
    lifecycleState === 'completed' ||
    lifecycleState === 'cancelled' ||
    lifecycleState === 'failed'
  ) {
    return null;
  }

  // If user dismissed Engage while still waiting for first token, show minimal unobtrusive synthesis pulse
  if (dismissed || !currentItem) {
    if (isGeneratingWait) {
      return (
        <div
          className="flex items-center gap-2 text-xs font-mono text-neutral-400 py-1.5"
          role="status"
          aria-live="polite"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full bg-[#eb3b2d] ${
              effectiveReducedMotion ? '' : 'animate-pulse'
            }`}
          />
          <span>OMNIA 1.0 is synthesizing…</span>
        </div>
      );
    }
    return null;
  }

  // STREAMING STATE (First response token has arrived):
  // Immediately prioritize OMNIA's generated answer by collapsing into a compact,
  // unobtrusive indicator unless the user explicitly expands it.
  if (isActivelyStreamingTokens && !expandedDuringStream) {
    return (
      <div
        className="mb-2.5 px-3 py-1.5 rounded-xl bg-neutral-950/90 border border-neutral-800/80 flex items-center justify-between gap-2 sm:gap-3 w-full max-w-2xl"
        role="status"
        aria-label="VIZRA Engage Compact Streaming Indicator"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] shrink-0" />
          <span className="text-[11px] font-mono text-neutral-300 truncate">
            OMNIA 1.0 • Streaming response
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-neutral-500 truncate">
            — {currentItem.title}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setExpandedDuringStream(true);
              logSafeInteractionEvent('engage_card_interaction', {
                contentId: currentItem.id,
                contentType: currentItem.type,
                mode,
                action: 'expand',
              });
            }}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Expand Engage card"
            aria-label="Expand Engage card"
          >
            <Maximize2 size={11} />
            <span className="hidden sm:inline">Peek</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              logSafeInteractionEvent('engage_card_interaction', {
                contentId: currentItem.id,
                contentType: currentItem.type,
                mode,
                action: 'dismiss',
              });
            }}
            className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Dismiss indicator"
            aria-label="Dismiss indicator"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  // GENERATING STATE (or explicitly expanded during streaming):
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="vizra-engage-phase2-container"
        initial={effectiveReducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={effectiveReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={
          effectiveReducedMotion
            ? { duration: 0 }
            : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
        }
        className="my-2 rounded-2xl bg-neutral-950/95 border border-neutral-800/90 overflow-hidden shadow-lg w-full max-w-2xl"
        role="region"
        aria-label="VIZRA Engage Waiting Experience"
      >
        {/* Top Status Header */}
        <div className="px-3 sm:px-4 py-2.5 bg-neutral-900/70 border-b border-neutral-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              {!effectiveReducedMotion && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#eb3b2d] opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#eb3b2d]" />
            </span>
            <span className="text-[11px] font-mono font-semibold text-white tracking-tight truncate">
              {isActivelyStreamingTokens
                ? 'OMNIA 1.0 • Streaming Answer'
                : 'OMNIA 1.0 • Synthesizing Response'}
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 uppercase shrink-0">
              {mode} mode
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 max-w-[160px] truncate">
              {currentItem.category}
            </span>

            {contextualItems.length > 1 && (
              <div className="flex items-center gap-0.5 ml-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(
                      (prev) => (prev - 1 + contextualItems.length) % contextualItems.length
                    );
                    logSafeInteractionEvent('engage_card_interaction', {
                      contentId: currentItem.id,
                      contentType: currentItem.type,
                      mode,
                      action: 'navigate',
                    });
                  }}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Previous card"
                  aria-label="Previous card"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex((prev) => (prev + 1) % contextualItems.length);
                    logSafeInteractionEvent('engage_card_interaction', {
                      contentId: currentItem.id,
                      contentType: currentItem.type,
                      mode,
                      action: 'navigate',
                    });
                  }}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Next card"
                  aria-label="Next card"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {isActivelyStreamingTokens && (
              <button
                type="button"
                onClick={() => {
                  setExpandedDuringStream(false);
                  logSafeInteractionEvent('engage_card_interaction', {
                    contentId: currentItem.id,
                    contentType: currentItem.type,
                    mode,
                    action: 'collapse',
                  });
                }}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Collapse to compact bar"
                aria-label="Collapse to compact bar"
              >
                <Minimize2 size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                logSafeInteractionEvent('engage_card_interaction', {
                  contentId: currentItem.id,
                  contentType: currentItem.type,
                  mode,
                  action: 'dismiss',
                });
              }}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors cursor-pointer"
              title="Minimize Engage experience"
              aria-label="Minimize Engage experience"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Modular Content Body */}
        <div className="p-3 sm:p-4 min-h-[108px] flex flex-col justify-center">
          <EngageRenderer
            item={currentItem}
            mode={mode}
            coarseIntent={effectiveCoarseIntent}
            prefersReducedMotion={effectiveReducedMotion}
            enablePartnerPlaceholderDemo={enablePartnerPlaceholderDemo}
            onInteract={handleCardInteract}
          />
        </div>

        {/* Footer Bar with Tagline & Pagination Dots */}
        <div className="px-3 sm:px-4 py-1.5 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between gap-2 text-[10px] font-mono text-neutral-500">
          <span className="truncate">{VIZRA_ENGAGE_TAGLINE}</span>
          {contextualItems.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              {contextualItems.map((it, idx) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    logSafeInteractionEvent('engage_card_interaction', {
                      contentId: it.id,
                      contentType: it.type,
                      mode,
                      action: 'navigate',
                    });
                  }}
                  className={`h-1 rounded-full transition-colors cursor-pointer ${
                    idx === safeActiveIndex
                      ? 'w-4 bg-[#eb3b2d]'
                      : 'w-1.5 bg-neutral-800 hover:bg-neutral-700'
                  }`}
                  aria-label={`Show Engage card ${idx + 1}: ${it.title}`}
                  aria-current={idx === safeActiveIndex ? 'true' : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
