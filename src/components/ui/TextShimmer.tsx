import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

/**
 * 12 · AI Loading / Streaming Shimmer
 * Adapted from 21st.dev `text-shimmer` pattern for VIZRA's dark obsidian & crimson design system.
 * Respects `prefers-reduced-motion` automatically.
 */
export const TextShimmer: React.FC<TextShimmerProps> = ({
  children,
  as: Component = 'span',
  className = '',
  duration = 2,
  spread = 2,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const MotionComponent = useMemo(() => motion.create(Component as any), [Component]);

  const dynamicSpread = useMemo(() => {
    return Math.max(children.length * spread, 16);
  }, [children, spread]);

  if (prefersReducedMotion) {
    return (
      <Component className={`inline-block text-neutral-300 font-medium ${className}`}>
        {children}
      </Component>
    );
  }

  return (
    <MotionComponent
      className={`relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent [--base-color:#737373] [--base-gradient-color:#ffffff] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box] ${className}`}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
        } as React.CSSProperties
      }
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
    >
      {children}
    </MotionComponent>
  );
};

export interface AIStatusShimmerProps {
  status: 'thinking' | 'generating' | 'exporting' | 'syncing' | 'searching';
  label?: string;
  progress?: number; // Optional measurable progress 0-100
  subtext?: string;
  className?: string;
}

const DEFAULT_LABELS: Record<AIStatusShimmerProps['status'], string> = {
  thinking: 'Omnia 1.0 is evaluating reasoning steps…',
  generating: 'Synthesizing multimodal response…',
  exporting: 'Preparing high-resolution project export…',
  syncing: 'Synchronizing workspace state…',
  searching: 'Verifying live web citations & primary sources…',
};

export const AIStatusShimmer: React.FC<AIStatusShimmerProps> = ({
  status,
  label,
  progress,
  subtext,
  className = '',
}) => {
  const displayLabel = label || DEFAULT_LABELS[status];
  const hasProgress = typeof progress === 'number' && Number.isFinite(progress);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex flex-col gap-1.5 px-3.5 py-2 rounded-xl bg-[#111111] border border-white/[0.08] text-xs ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC2626]" />
        </span>
        <TextShimmer className="font-mono text-xs tracking-tight" duration={1.8}>
          {displayLabel}
        </TextShimmer>
        {hasProgress && (
          <span className="ml-auto font-mono text-[11px] text-neutral-400">
            {Math.round(Math.max(0, Math.min(100, progress!)))}%
          </span>
        )}
      </div>

      {hasProgress && (
        <div className="w-full h-1 rounded-full bg-neutral-900 overflow-hidden">
          <div
            className="h-full bg-[#DC2626] transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, progress!))}%` }}
          />
        </div>
      )}

      {subtext && <p className="text-[11px] text-neutral-500 pl-4">{subtext}</p>}
    </div>
  );
};
