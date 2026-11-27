import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Zap,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Layers,
  Plus,
} from 'lucide-react';
import { getOrCreateVizraClientId } from '../../utils/apiErrorHandler';

export type CreditIndicatorVariant = 'header' | 'sidebar' | 'rail';

export interface CreditUsageState {
  used: number;
  limit: number;
  remaining: number;
  percentRemaining: number;
  percentUsed: number;
  planId: 'starter' | 'pro' | 'studio';
  planName: string;
  isLow: boolean;
  isExhausted: boolean;
}

export interface CreditUsageIndicatorProps {
  /** Placement layout: 'header' (compact pill + popover), 'sidebar' (expanded card), or 'rail' (collapsed icon rail) */
  variant?: CreditIndicatorVariant;
  /** Optional explicit override for used credits */
  usedOverride?: number;
  /** Optional explicit override for total credit limit */
  limitOverride?: number;
  /** Optional explicit override for plan name */
  planNameOverride?: string;
  /** Optional className */
  className?: string;
}

const CREDITS_USED_STORAGE_KEY = 'vizra_ai_credits_used_v1';
const PLAN_STORAGE_KEY = 'vizra_active_plan_v1';
export const CREDITS_EVENT_NAME = 'vizra:credits-updated';

const PLAN_LIMITS: Record<'starter' | 'pro' | 'studio', { name: string; limit: number }> = {
  starter: { name: 'Creator Free', limit: 60 },
  pro: { name: 'Omnia Pro', limit: 240 },
  studio: { name: 'VIZRA Studio', limit: 1000 },
};

/**
 * Smoothly interpolates a numeric value up or down whenever targetValue changes.
 * Respects `prefers-reduced-motion` and returns both the current animated integer
 * and the active transition direction ('up' | 'down' | 'idle').
 */
export function useAnimatedNumber(
  targetValue: number,
  durationMs: number = 680
): { displayValue: number; direction: 'up' | 'down' | 'idle'; delta: number } {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(targetValue);
  const [direction, setDirection] = useState<'up' | 'down' | 'idle'>('idle');
  const [delta, setDelta] = useState<number>(0);
  const currentRef = useRef<number>(targetValue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = currentRef.current;
    const diff = targetValue - startVal;
    if (diff === 0) return;

    setDelta(diff);
    setDirection(diff > 0 ? 'up' : 'down');

    if (prefersReducedMotion || durationMs <= 0) {
      currentRef.current = targetValue;
      setDisplayValue(targetValue);
      const resetTimer = window.setTimeout(() => setDirection('idle'), 300);
      return () => window.clearTimeout(resetTimer);
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out for crisp deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(startVal + diff * eased);
      currentRef.current = nextVal;
      setDisplayValue(nextVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        currentRef.current = targetValue;
        setDisplayValue(targetValue);
        window.setTimeout(() => setDirection('idle'), 450);
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, durationMs, prefersReducedMotion]);

  return { displayValue, direction, delta };
}

/**
 * Helper to record AI generation credit consumption or refill via the backend (`/api/credits/usage`)
 * and broadcast live updates so all mounted CreditUsageIndicator instances count up/down smoothly.
 */
export function recordAICreditUsage(
  amount: number = 1,
  category: 'reasoning' | 'grounding' | 'visuals' | 'audio' = 'reasoning',
  action: 'consume' | 'refill' = 'consume',
  description?: string
): number {
  let optimisticNext = 14;
  try {
    const raw = localStorage.getItem(CREDITS_USED_STORAGE_KEY);
    const current = raw ? Math.max(0, parseInt(raw, 10) || 0) : 14;
    optimisticNext =
      action === 'refill'
        ? Math.max(0, current - Math.max(1, amount))
        : current + Math.max(1, amount);
    localStorage.setItem(CREDITS_USED_STORAGE_KEY, String(optimisticNext));
    window.dispatchEvent(
      new CustomEvent(CREDITS_EVENT_NAME, { detail: { used: optimisticNext } })
    );
  } catch {
    // Ignore storage error
  }

  // Synchronize with authoritative backend ledger asynchronously (server owns plan/tier & pricing)
  const clientId = getOrCreateVizraClientId();
  fetch('/api/credits/usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Vizra-Client-Id': clientId,
    },
    body: JSON.stringify({
      action,
      amount: Math.max(1, Math.min(50, Math.trunc(amount))),
      category,
      description,
    }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((payload) => {
      if (payload?.balance && typeof payload.balance.used === 'number') {
        try {
          localStorage.setItem(
            CREDITS_USED_STORAGE_KEY,
            String(payload.balance.used)
          );
          if (
            payload.balance.planId === 'starter' ||
            payload.balance.planId === 'pro' ||
            payload.balance.planId === 'studio'
          ) {
            localStorage.setItem(PLAN_STORAGE_KEY, payload.balance.planId);
          }
          window.dispatchEvent(
            new CustomEvent(CREDITS_EVENT_NAME, { detail: payload })
          );
        } catch {
          // Ignore
        }
      }
    })
    .catch(() => {
      // Non-fatal fallback
    });

  return optimisticNext;
}

export function getStoredCreditState(
  usedOverride?: number,
  limitOverride?: number,
  planNameOverride?: string
): CreditUsageState {
  let planId: 'starter' | 'pro' | 'studio' = 'starter';
  try {
    const savedPlan = localStorage.getItem(PLAN_STORAGE_KEY);
    if (savedPlan === 'pro' || savedPlan === 'studio' || savedPlan === 'starter') {
      planId = savedPlan;
    }
  } catch {
    // Ignore storage error
  }

  let storedUsed = 14;
  try {
    const rawUsed = localStorage.getItem(CREDITS_USED_STORAGE_KEY);
    if (rawUsed !== null) {
      const parsed = parseInt(rawUsed, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        storedUsed = parsed;
      }
    } else {
      localStorage.setItem(CREDITS_USED_STORAGE_KEY, String(storedUsed));
    }
  } catch {
    // Ignore storage error
  }

  const planMeta = PLAN_LIMITS[planId];
  const limit =
    typeof limitOverride === 'number' && limitOverride > 0
      ? limitOverride
      : planMeta.limit;
  const used =
    typeof usedOverride === 'number' && usedOverride >= 0
      ? usedOverride
      : storedUsed;
  const planName = planNameOverride || planMeta.name;

  const remaining = Math.max(0, limit - used);
  const percentRemaining = Math.max(
    0,
    Math.min(100, Math.round((remaining / Math.max(limit, 1)) * 100))
  );
  const percentUsed = Math.max(0, Math.min(100, 100 - percentRemaining));
  const isExhausted = remaining === 0;
  const isLow = !isExhausted && percentRemaining <= 25;

  return {
    used,
    limit,
    remaining,
    percentRemaining,
    percentUsed,
    planId,
    planName,
    isLow,
    isExhausted,
  };
}

/**
 * VIZRA Credit Usage Indicator
 * Displays the user's remaining AI generation credits in the header or sidebar
 * with smooth numerical count-up/count-down animations when updated via the backend,
 * and links directly to the pricing section (/#pricing) to upgrade when needed.
 */
export const CreditUsageIndicator: React.FC<CreditUsageIndicatorProps> = ({
  variant = 'header',
  usedOverride,
  limitOverride,
  planNameOverride,
  className = '',
}) => {
  const navigate = useNavigate();
  const [state, setState] = useState<CreditUsageState>(() =>
    getStoredCreditState(usedOverride, limitOverride, planNameOverride)
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Smoothly animated numerical counters
  const {
    displayValue: animatedRemaining,
    direction: remainingDirection,
    delta: remainingDelta,
  } = useAnimatedNumber(state.remaining, 680);
  const { displayValue: animatedUsed } = useAnimatedNumber(state.used, 680);
  const { displayValue: animatedLimit } = useAnimatedNumber(state.limit, 680);
  const { displayValue: animatedPercent } = useAnimatedNumber(
    state.percentRemaining,
    680
  );

  const syncWithBackendCredits = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/credits/usage', {
        headers: {
          'X-Vizra-Client-Id': getOrCreateVizraClientId(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const serverUsed = Number(data?.balance?.used);
        if (Number.isFinite(serverUsed) && serverUsed >= 0) {
          try {
            localStorage.setItem(CREDITS_USED_STORAGE_KEY, String(serverUsed));
            if (
              data?.balance?.planId === 'starter' ||
              data?.balance?.planId === 'pro' ||
              data?.balance?.planId === 'studio'
            ) {
              localStorage.setItem(PLAN_STORAGE_KEY, data.balance.planId);
            }
            window.dispatchEvent(
              new CustomEvent(CREDITS_EVENT_NAME, { detail: data })
            );
          } catch {
            // Ignore
          }
        }
      }
    } catch {
      // Non-fatal fallback to local state
    } finally {
      setState(getStoredCreditState(usedOverride, limitOverride, planNameOverride));
      window.setTimeout(() => setIsSyncing(false), 260);
    }
  }, [usedOverride, limitOverride, planNameOverride]);

  useEffect(() => {
    setState(getStoredCreditState(usedOverride, limitOverride, planNameOverride));
  }, [usedOverride, limitOverride, planNameOverride]);

  // Initial backend sync on mount
  useEffect(() => {
    syncWithBackendCredits();
  }, [syncWithBackendCredits]);

  useEffect(() => {
    const handleUpdate = () => {
      setState(getStoredCreditState(usedOverride, limitOverride, planNameOverride));
    };
    window.addEventListener(CREDITS_EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(CREDITS_EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [usedOverride, limitOverride, planNameOverride]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNavigateToPricing = () => {
    setIsOpen(false);
    navigate('/pricing');
  };

  const barColorClass = state.isExhausted
    ? 'bg-[#DC2626]'
    : state.isLow
    ? 'bg-amber-500'
    : 'bg-[#DC2626]';

  const statusTextColor = state.isExhausted
    ? 'text-[#EB3B2D]'
    : state.isLow
    ? 'text-amber-400'
    : 'text-emerald-400';

  const numberHighlightClass =
    remainingDirection === 'up'
      ? 'text-emerald-400 scale-105'
      : remainingDirection === 'down'
      ? 'text-[#EB3B2D] scale-105'
      : 'text-white scale-100';

  // ---------------------------------------------------------------------------
  // VARIANT 1: COLLAPSED ICON RAIL (60px / 68px width)
  // ---------------------------------------------------------------------------
  if (variant === 'rail') {
    return (
      <button
        type="button"
        onClick={handleNavigateToPricing}
        className={`group flex flex-col items-center justify-center w-11 py-1.5 rounded-xl bg-[#111111] hover:bg-[#171717] border border-white/[0.08] hover:border-[#DC2626]/50 transition-all cursor-pointer select-none ${className}`}
        title={`${state.remaining} of ${state.limit} AI generation credits remaining (${state.planName}) — Click to upgrade`}
        aria-label={`${state.remaining} AI credits remaining. Upgrade plan`}
      >
        <Zap
          size={14}
          className={
            state.isExhausted || state.isLow
              ? 'text-[#EB3B2D] animate-pulse'
              : 'text-[#EB3B2D]'
          }
        />
        <span
          className={`text-[9px] font-mono font-semibold tabular-nums transition-all duration-200 mt-0.5 ${
            remainingDirection === 'up'
              ? 'text-emerald-400'
              : remainingDirection === 'down'
              ? 'text-[#EB3B2D]'
              : 'text-neutral-300 group-hover:text-white'
          }`}
        >
          {animatedRemaining}
        </span>
      </button>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 2: EXPANDED SIDEBAR CARD
  // ---------------------------------------------------------------------------
  if (variant === 'sidebar') {
    return (
      <div
        className={`p-3 rounded-xl bg-[#090909] border border-white/[0.08] space-y-2 select-none ${className}`}
        role="region"
        aria-label="AI Generation Credit Usage"
      >
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Zap size={12} className="text-[#EB3B2D] shrink-0" />
            <span>AI Credits</span>
            <AnimatePresence>
              {remainingDirection !== 'idle' && remainingDelta !== 0 && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    remainingDirection === 'up'
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                      : 'bg-red-950/70 text-[#EB3B2D] border border-red-800/50'
                  }`}
                >
                  {remainingDelta > 0 ? `+${remainingDelta}` : remainingDelta}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <span className="font-mono text-[10px] text-neutral-300 tabular-nums">
            <strong
              className={`inline-block transition-all duration-200 ${numberHighlightClass}`}
            >
              {animatedRemaining}
            </strong>{' '}
            / {animatedLimit} left
          </span>
        </div>

        {/* Smooth Spring Remaining / Used Progress Bar */}
        <div
          className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden"
          role="progressbar"
          aria-valuenow={state.remaining}
          aria-valuemin={0}
          aria-valuemax={state.limit}
          aria-label="Remaining AI generation credits"
        >
          <motion.div
            initial={false}
            animate={{ width: `${Math.max(6, state.percentRemaining)}%` }}
            transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            className={`h-full ${barColorClass} rounded-full`}
          />
        </div>

        {/* Low / Exhausted Warning Callout */}
        {(state.isLow || state.isExhausted) && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg px-2 py-1">
            <AlertTriangle size={11} className="text-amber-400 shrink-0" />
            <span className="truncate">
              {state.isExhausted
                ? 'Credits depleted — upgrade for priority compute'
                : `Low credit balance (${animatedRemaining} remaining)`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
          <span className="text-neutral-500 truncate">Tier: {state.planName}</span>
          <button
            type="button"
            onClick={handleNavigateToPricing}
            className="text-[#EB3B2D] hover:text-white font-semibold flex items-center gap-0.5 transition-colors cursor-pointer shrink-0"
          >
            <span>{state.planId === 'studio' ? 'Manage Plan' : 'Upgrade'}</span>
            <ArrowUpRight size={10} />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 3: COMPACT HEADER PILL WITH INTERACTIVE POPOVER
  // ---------------------------------------------------------------------------
  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) syncWithBackendCredits();
        }}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
          state.isExhausted
            ? 'bg-red-950/40 border-[#DC2626]/60 text-white'
            : state.isLow
            ? 'bg-amber-950/30 border-amber-700/50 text-white'
            : 'bg-[#111111] hover:bg-[#171717] border-white/[0.09] text-neutral-200 hover:text-white'
        }`}
        aria-expanded={isOpen}
        aria-label={`AI Credits: ${state.remaining} of ${state.limit} remaining`}
        title="Inspect AI generation credits & upgrade options"
      >
        <Zap
          size={13}
          className={
            state.isExhausted || state.isLow
              ? 'text-[#EB3B2D] animate-pulse shrink-0'
              : 'text-[#EB3B2D] shrink-0'
          }
        />
        <span className="font-mono text-[11px] font-semibold whitespace-nowrap tabular-nums">
          <span
            className={`inline-block transition-all duration-200 ${numberHighlightClass}`}
          >
            {animatedRemaining}
          </span>
          <span className="text-neutral-500 font-normal hidden sm:inline">
            /{animatedLimit}
          </span>
        </span>
        <span className="hidden lg:inline text-[11px] text-neutral-400">
          Credits
        </span>

        {/* Mini visual progress pill on desktop */}
        <div className="hidden md:block w-10 h-1.5 rounded-full bg-neutral-900 overflow-hidden shrink-0">
          <motion.div
            initial={false}
            animate={{ width: `${Math.max(8, state.percentRemaining)}%` }}
            transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            className={`h-full ${barColorClass} rounded-full`}
          />
        </div>
      </button>

      {/* Detailed Credit Breakdown & Upgrade Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#111111] border border-white/[0.1] shadow-2xl p-4 z-50 text-white space-y-3.5"
          >
            {/* Popover Header */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#EB3B2D]" />
                  <h4 className="text-xs font-semibold text-white tracking-tight">
                    AI Generation Credits
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                  Active Plan: {state.planName}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    recordAICreditUsage(
                      5,
                      'reasoning',
                      'refill',
                      'Bonus studio credit top-up (+5)'
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Simulate backend credit top-up (+5 credits)"
                >
                  <Plus size={10} />
                  <span>+5</span>
                </button>
                <button
                  type="button"
                  onClick={syncWithBackendCredits}
                  className="p-1.5 rounded-lg bg-[#171717] hover:bg-neutral-800 border border-white/[0.07] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Sync live usage telemetry from backend"
                  aria-label="Sync credit usage"
                >
                  <RefreshCw
                    size={12}
                    className={isSyncing ? 'animate-spin text-[#EB3B2D]' : ''}
                  />
                </button>
              </div>
            </div>

            {/* Primary Remaining Balance Readout */}
            <div className="p-3 rounded-xl bg-[#090909] border border-white/[0.07] space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="tabular-nums">
                  <span
                    className={`text-2xl font-bold tracking-tight inline-block transition-all duration-200 ${numberHighlightClass}`}
                  >
                    {animatedRemaining}
                  </span>
                  <span className="text-xs font-mono text-neutral-400 ml-1.5">
                    / {animatedLimit} remaining
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold tabular-nums ${statusTextColor}`}
                >
                  {animatedPercent}% available
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${Math.max(4, state.percentRemaining)}%` }}
                  transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                  className={`h-full ${barColorClass} rounded-full`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 tabular-nums">
                <span>Used this cycle: {animatedUsed} credits</span>
                <span className="flex items-center gap-1 text-neutral-400">
                  <CheckCircle2 size={10} className="text-emerald-400" />
                  Auto-renews
                </span>
              </div>
            </div>

            {/* Credit Allocation Breakdown */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Layers size={11} className="text-[#EB3B2D]" />
                  Omnia Reasoning & Web Grounding
                </span>
                <span className="font-mono text-neutral-300">1 credit / turn</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={11} className="text-[#EB3B2D]" />
                  Visual & Lyria 3 Audio Synthesis
                </span>
                <span className="font-mono text-neutral-300">Included</span>
              </div>
            </div>

            {/* Upgrade Call to Action linking to /#pricing */}
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <button
                type="button"
                onClick={handleNavigateToPricing}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Zap size={13} />
                <span>
                  {state.planId === 'starter'
                    ? 'Need more credits? Upgrade to Pro'
                    : 'View Pricing & Upgrade Options'}
                </span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
