import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { VizraLogo } from '../VizraLogo';
import { AIMode } from '../../types/ai';

export interface OmniaResponseSkeletonProps {
  /** Active OMNIA capability mode to tailor skeleton layout geometry */
  mode?: AIMode;
  /** Accessible status label */
  ariaLabel?: string;
}

/**
 * Mode-aware editorial skeleton displayed inside the message list while awaiting
 * the first OMNIA response tokens. Pre-allocates vertical space to prevent
 * layout shift (CLS) when streaming begins.
 */
export const OmniaResponseSkeleton: React.FC<OmniaResponseSkeletonProps> = React.memo(
  ({ mode = 'quick', ariaLabel = 'Awaiting OMNIA response' }) => {
    const prefersReducedMotion = useReducedMotion();
    const pulseClass = prefersReducedMotion
      ? ''
      : 'animate-pulse motion-reduce:animate-none';

    const showReasoningBar = mode === 'think' || mode === 'science';
    const showGroundingBar = mode === 'research' || mode === 'science' || mode === 'analyze';
    const showStructuredBlock = mode === 'code' || mode === 'create' || mode === 'analyze';

    return (
      <motion.div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={ariaLabel}
        data-testid="omnia-response-skeleton"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full min-h-[140px] space-y-3 pt-1 select-none"
      >
        <span className="sr-only">{ariaLabel}...</span>

        {/* Optional Grounding / Retrieval Skeleton Bar */}
        {showGroundingBar && (
          <div
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 border border-neutral-800/70 ${pulseClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]/70 shrink-0" />
            <div className="h-2.5 w-28 rounded bg-neutral-800/90" />
            <span className="text-neutral-700 text-[10px]">•</span>
            <div className="h-2.5 w-16 rounded bg-neutral-800/70" />
            <span className="text-neutral-700 text-[10px]">•</span>
            <div className="h-2.5 w-20 rounded bg-neutral-800/60" />
          </div>
        )}

        {/* Optional Reasoning Steps Header Skeleton */}
        {showReasoningBar && (
          <div
            className={`px-3.5 py-2 rounded-xl border border-neutral-800/70 bg-neutral-950/60 flex items-center justify-between ${pulseClass}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-[#eb3b2d]/20 border border-[#eb3b2d]/40" />
              <div className="h-3 w-44 rounded bg-neutral-800/80" />
            </div>
            <div className="w-3.5 h-3.5 rounded bg-neutral-800/60" />
          </div>
        )}

        {/* Primary Editorial Paragraph Skeleton Lines */}
        <div className={`space-y-2.5 pt-0.5 ${pulseClass}`}>
          <div className="h-3.5 w-[94%] rounded-md bg-neutral-800/85" />
          <div className="h-3.5 w-[88%] rounded-md bg-neutral-800/70" />
          <div className="h-3.5 w-[79%] rounded-md bg-neutral-800/65" />
          <div className="h-3.5 w-[62%] rounded-md bg-neutral-800/50" />
        </div>

        {/* Optional Structured Code / Artifact Block Skeleton */}
        {showStructuredBlock && (
          <div
            className={`p-3.5 rounded-xl bg-neutral-950/85 border border-neutral-800/75 space-y-2 ${pulseClass}`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-neutral-900">
              <div className="h-2.5 w-24 rounded bg-neutral-800/80" />
              <div className="h-2.5 w-12 rounded bg-neutral-900" />
            </div>
            <div className="h-3 w-[86%] rounded bg-neutral-800/65" />
            <div className="h-3 w-[72%] rounded bg-neutral-800/55" />
            <div className="h-3 w-[64%] rounded bg-neutral-800/45" />
          </div>
        )}

        {/* Subtle Bottom Action Toolbar Skeleton */}
        <div className="flex items-center gap-2 pt-1">
          <div
            className={`h-6 w-6 rounded-lg bg-neutral-900/70 border border-neutral-800/50 ${pulseClass}`}
          />
          <div
            className={`h-6 w-6 rounded-lg bg-neutral-900/70 border border-neutral-800/50 ${pulseClass}`}
          />
          <div
            className={`h-6 w-16 rounded-lg bg-neutral-900/70 border border-neutral-800/50 ${pulseClass}`}
          />
        </div>
      </motion.div>
    );
  }
);

OmniaResponseSkeleton.displayName = 'OmniaResponseSkeleton';

export interface MessageListSkeletonProps {
  /** Number of user + assistant exchange turns to render (default: 2) */
  turns?: number;
  /** Optional active mode for tailoring assistant response skeletons */
  mode?: AIMode;
  /** Render full conversation history skeleton or single awaiting-response row */
  variant?: 'conversation' | 'awaiting-response';
  /** Optional accessible label override */
  ariaLabel?: string;
}

const TURN_PATTERNS = [
  {
    userWidth: 'w-56 sm:w-72',
    assistantLines: ['w-[96%]', 'w-[90%]', 'w-[76%]'],
    hasSecondaryBlock: false,
  },
  {
    userWidth: 'w-64 sm:w-80',
    assistantLines: ['w-[94%]', 'w-[86%]', 'w-[82%]', 'w-[60%]'],
    hasSecondaryBlock: true,
  },
  {
    userWidth: 'w-48 sm:w-64',
    assistantLines: ['w-[92%]', 'w-[78%]'],
    hasSecondaryBlock: false,
  },
];

export const MessageListSkeleton: React.FC<MessageListSkeletonProps> = React.memo(
  ({
    turns = 2,
    mode = 'quick',
    variant = 'conversation',
    ariaLabel = 'Loading conversation messages',
  }) => {
    const prefersReducedMotion = useReducedMotion();
    const safeTurns = Math.max(1, Math.min(turns, 4));
    const pulseClass = prefersReducedMotion
      ? ''
      : 'animate-pulse motion-reduce:animate-none';

    if (variant === 'awaiting-response') {
      return (
        <div
          role="status"
          aria-busy="true"
          aria-live="polite"
          aria-label="Awaiting OMNIA response"
          data-testid="message-list-awaiting-skeleton"
          className="py-4 w-full flex justify-start select-none"
        >
          <div className="w-full max-w-[92%] md:max-w-[85%] mr-auto space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <VizraLogo size={18} />
              <span className="text-xs font-semibold text-white tracking-tight">
                Omnia 1.0
              </span>
              {mode && mode !== 'quick' && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase">
                  {mode}
                </span>
              )}
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-ping motion-reduce:animate-none"
                aria-hidden="true"
              />
            </div>
            <OmniaResponseSkeleton mode={mode} />
          </div>
        </div>
      );
    }

    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={ariaLabel}
        data-testid="message-list-skeleton"
        className="w-full max-w-3xl mx-auto py-4 space-y-4 select-none"
      >
        <span className="sr-only">{ariaLabel}...</span>

        {Array.from({ length: safeTurns }).map((_, index) => {
          const pattern = TURN_PATTERNS[index % TURN_PATTERNS.length];
          const isLastTurn = index === safeTurns - 1;

          return (
            <React.Fragment key={`skeleton-turn-${index}`}>
              {/* User Message Skeleton Row — matches ChatMessage user bubble geometry */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="py-4 w-full flex justify-end"
              >
                <div className="max-w-[92%] md:max-w-[85%] ml-auto">
                  <div
                    className={`bg-neutral-900/90 px-4 py-3.5 rounded-2xl border border-neutral-800/80 shadow-sm space-y-2 ${pulseClass}`}
                  >
                    <div
                      className={`h-3.5 rounded-md bg-neutral-800/90 ${pattern.userWidth}`}
                    />
                    {index % 2 === 1 && (
                      <div className="h-3.5 w-36 sm:w-48 rounded-md bg-neutral-800/60" />
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Omnia Assistant Message Skeleton Row — matches ChatMessage editorial layout */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 + 0.04 }}
                className="py-4 w-full flex justify-start"
              >
                <div className="w-full max-w-[92%] md:max-w-[85%] mr-auto space-y-3">
                  {/* Model & Status Lockup Skeleton */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="opacity-70">
                      <VizraLogo size={18} />
                    </div>
                    <div
                      className={`h-3 w-16 rounded bg-neutral-800/90 ${pulseClass}`}
                    />
                    <div
                      className={`h-3.5 w-12 rounded bg-neutral-900 border border-neutral-800/80 ${pulseClass}`}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]/60"
                      aria-hidden="true"
                    />
                  </div>

                  {isLastTurn ? (
                    <OmniaResponseSkeleton mode={mode} />
                  ) : (
                    <>
                      {/* Primary Editorial Paragraph Lines */}
                      <div className={`space-y-2.5 pt-0.5 ${pulseClass}`}>
                        {pattern.assistantLines.map((widthClass, lineIdx) => (
                          <div
                            key={`line-${index}-${lineIdx}`}
                            className={`h-3.5 rounded-md ${
                              lineIdx === 0
                                ? 'bg-neutral-800/90'
                                : 'bg-neutral-800/70'
                            } ${widthClass}`}
                          />
                        ))}
                      </div>

                      {/* Optional Secondary Structured Block (Code / Callout / Key Takeaways) */}
                      {pattern.hasSecondaryBlock && (
                        <div
                          className={`p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/70 space-y-2 ${pulseClass}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="h-2.5 w-24 rounded bg-neutral-800/80" />
                            <div className="h-2.5 w-10 rounded bg-neutral-900" />
                          </div>
                          <div className="h-3 w-[88%] rounded bg-neutral-800/60" />
                          <div className="h-3 w-[68%] rounded bg-neutral-800/50" />
                        </div>
                      )}

                      {/* Subtle Bottom Action Toolbar Skeleton */}
                      <div className="flex items-center gap-2 pt-1.5">
                        <div
                          className={`h-6 w-6 rounded-lg bg-neutral-900/80 border border-neutral-800/60 ${pulseClass}`}
                        />
                        <div
                          className={`h-6 w-6 rounded-lg bg-neutral-900/80 border border-neutral-800/60 ${pulseClass}`}
                        />
                        <div
                          className={`h-6 w-16 rounded-lg bg-neutral-900/80 border border-neutral-800/60 ${pulseClass}`}
                        />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);

MessageListSkeleton.displayName = 'MessageListSkeleton';

