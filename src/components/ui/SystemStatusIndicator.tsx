import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import {
  useSystemStatus,
  type SystemStatusLevel,
} from '../../context/SystemStatusContext';

export interface SystemStatusIndicatorProps {
  /** Visual presentation mode for different header layouts */
  variant?: 'default' | 'compact' | 'row';
  /** Corner geometry to harmonize with Navbar (rounded) vs AIHeader (pill) */
  shape?: 'rounded' | 'pill';
  /** Breakpoint visibility class for the status text label in default variant */
  labelClassName?: string;
  /** Optional extra classes for the root container */
  className?: string;
}

interface LevelVisualStyle {
  dotClass: string;
  ringClass: string;
  textClass: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  availabilityLabel: string;
}

const LEVEL_STYLES: Record<SystemStatusLevel, LevelVisualStyle> = {
  normal: {
    dotClass: 'bg-emerald-500',
    ringClass: 'bg-emerald-400/50',
    textClass: 'text-emerald-400',
    badgeBgClass: 'bg-emerald-950/30',
    badgeBorderClass: 'border-emerald-500/30',
    availabilityLabel: 'Operational',
  },
  heavy_traffic: {
    dotClass: 'bg-amber-400',
    ringClass: 'bg-amber-400/50',
    textClass: 'text-amber-400',
    badgeBgClass: 'bg-amber-950/30',
    badgeBorderClass: 'border-amber-500/35',
    availabilityLabel: 'High Load',
  },
  limited_access: {
    dotClass: 'bg-red-500',
    ringClass: 'bg-red-500/50',
    textClass: 'text-red-400',
    badgeBgClass: 'bg-red-950/30',
    badgeBorderClass: 'border-red-500/35',
    availabilityLabel: 'Limited',
  },
};

function formatLastChecked(date: Date | null): string {
  if (!date) return 'Checking...';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin}m ago`;
}

export const SystemStatusIndicator: React.FC<SystemStatusIndicatorProps> = ({
  variant = 'default',
  shape = 'rounded',
  labelClassName = 'hidden xl:inline',
  className = '',
}) => {
  const { level, label, latencyMs, lastCheckedAt, isChecking, details, refresh } =
    useSystemStatus();
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const style = LEVEL_STYLES[level];
  const radiusClass = shape === 'pill' ? 'rounded-full' : 'rounded-lg';

  // Keep relative "Updated Xs ago" fresh while popover is open
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, [open]);

  // Close popover on outside click or Escape key
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const statusSummaryTitle = `System Status: ${label}${
    latencyMs !== null ? ` (${latencyMs} ms)` : ''
  }`;

  // Full-width row layout for mobile drawers & workspace menus
  if (variant === 'row') {
    return (
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[#141418] border border-[#23232A] ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${style.ringClass}`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${style.dotClass}`}
            />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-neutral-400">
                System Status
              </span>
              <span className={`text-xs font-semibold ${style.textClass}`}>
                {label}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 truncate">
              {latencyMs !== null ? `Latency ${latencyMs} ms` : 'Checking connection'}
              {details.queuedRequests > 0 ? ` · ${details.queuedRequests} queued` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={isChecking}
          aria-label="Refresh system status"
          className="h-7 w-7 rounded-lg bg-[#111114] hover:bg-[#1B1B21] border border-[#23232A] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={statusSummaryTitle}
        title={statusSummaryTitle}
        className={`inline-flex items-center justify-center gap-2 border border-[#23232A] bg-[#141418] hover:bg-[#1B1B21] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] ${radiusClass} ${
          variant === 'compact'
            ? 'h-9 w-9 p-0'
            : 'h-9 px-2.5 text-xs font-medium'
        }`}
      >
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping ${style.ringClass}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${style.dotClass}`}
          />
        </span>

        {variant !== 'compact' && (
          <span className={`whitespace-nowrap leading-none ${labelClassName}`}>
            <span className={`font-medium ${style.textClass}`}>{label}</span>
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="System Status Details"
          className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl bg-[#111114] border border-[#23232A] shadow-2xl p-3.5 z-50 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Activity size={13} className="text-neutral-400 shrink-0" />
              <span className="text-xs font-semibold text-white truncate">
                System Status
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold shrink-0 ${style.badgeBgClass} ${style.badgeBorderClass} ${style.textClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`} />
              <span>{label}</span>
            </span>
          </div>

          {/* Summary message */}
          <p className="mt-2.5 text-[11px] leading-relaxed text-neutral-300">
            {details.reason}
          </p>

          {/* Key Metrics */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#141418] border border-[#23232A] px-2.5 py-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Latency
              </div>
              <div className="mt-0.5 text-xs font-semibold font-mono text-white">
                {latencyMs !== null ? `${latencyMs} ms` : 'Unavailable'}
              </div>
            </div>

            <div className="rounded-lg bg-[#141418] border border-[#23232A] px-2.5 py-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Availability
              </div>
              <div className={`mt-0.5 text-xs font-semibold ${style.textClass}`}>
                {style.availabilityLabel}
              </div>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="mt-2.5 space-y-1.5 rounded-lg bg-[#141418] border border-[#23232A] px-2.5 py-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">API Gateway</span>
              <span
                className={
                  details.apiReachable
                    ? 'text-emerald-400 font-medium'
                    : 'text-red-400 font-medium'
                }
              >
                {details.apiReachable ? 'Online' : 'Unreachable'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Omnia AI Engine</span>
              <span
                className={
                  !details.aiServiceReady
                    ? 'text-red-400 font-medium'
                    : details.degradedModels.length > 0
                    ? 'text-amber-400 font-medium'
                    : 'text-emerald-400 font-medium'
                }
              >
                {!details.aiServiceReady
                  ? 'Unavailable'
                  : details.degradedModels.length > 0
                  ? 'Fallback Active'
                  : 'Ready'}
              </span>
            </div>
            {details.queuedRequests > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Traffic Queue</span>
                <span className="text-amber-400 font-mono font-medium">
                  {details.queuedRequests} waiting
                </span>
              </div>
            )}
          </div>

          {/* Footer: Last Checked & Manual Refresh */}
          <div className="mt-3 pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
            <span className="text-[10px] text-neutral-500">
              Updated {formatLastChecked(lastCheckedAt)}
            </span>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isChecking}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={11} className={isChecking ? 'animate-spin' : ''} />
              <span>{isChecking ? 'Checking' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
