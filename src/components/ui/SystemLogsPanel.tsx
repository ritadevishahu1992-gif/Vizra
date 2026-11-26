import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Terminal,
  RefreshCw,
  Search,
  Download,
  X,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';

export interface SystemApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  level: 'info' | 'warn' | 'error';
  category: 'ai' | 'health' | 'workspace' | 'content' | 'other';
}

export interface SystemLogsSummary {
  totalTracked: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  maxLatencyMs: number;
  errorCount: number;
  warnCount: number;
  successRatePct: number;
}

export interface SystemLogsProps {
  buildAuthHeaders: () => Promise<Record<string, string>>;
  onClose?: () => void;
  onLogCountChange?: (count: number) => void;
}

type LevelFilter = 'all' | 'info' | 'warn' | 'error';

const AUTO_REFRESH_INTERVAL_MS = 10_000;

function formatLogTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--:--';
  }
}

function getMethodBadgeStyle(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-blue-950/40 text-blue-400 border-blue-500/25';
    case 'POST':
      return 'bg-emerald-950/30 text-emerald-400 border-emerald-500/25';
    case 'DELETE':
      return 'bg-red-950/30 text-red-400 border-red-500/30';
    case 'PUT':
    case 'PATCH':
      return 'bg-amber-950/30 text-amber-400 border-amber-500/30';
    default:
      return 'bg-[#171717] text-neutral-300 border-white/[0.1]';
  }
}

function getStatusBadgeStyle(status: number): string {
  if (status >= 500) {
    return 'bg-red-950/30 text-red-400 border-red-500/35';
  }
  if (status >= 400) {
    return 'bg-amber-950/30 text-amber-400 border-amber-500/35';
  }
  return 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30';
}

function getLatencyColor(durationMs: number, status: number): string {
  if (status >= 500 || durationMs >= 1200) return 'text-red-400';
  if (status >= 400 || durationMs >= 450) return 'text-amber-400';
  return 'text-emerald-400';
}

function getLatencyBarColor(durationMs: number, status: number): string {
  if (status >= 500 || durationMs >= 1200) return 'bg-red-500';
  if (status >= 400 || durationMs >= 450) return 'bg-amber-400';
  return 'bg-emerald-500';
}

export const SystemLogs: React.FC<SystemLogsProps> = ({
  buildAuthHeaders,
  onClose,
  onLogCountChange,
}) => {
  const [logs, setLogs] = useState<SystemApiLogEntry[]>([]);
  const [summary, setSummary] = useState<SystemLogsSummary>({
    totalTracked: 0,
    averageLatencyMs: 0,
    p95LatencyMs: 0,
    maxLatencyMs: 0,
    errorCount: 0,
    warnCount: 0,
    successRatePct: 100,
  });
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const mountedRef = useRef(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await buildAuthHeaders();
      const params = new URLSearchParams({
        limit: '80',
        level: levelFilter,
      });
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim().slice(0, 64));
      }

      const res = await fetch(`/api/system-logs?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        headers,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (mountedRef.current) {
          setErrorMessage(
            errBody?.error?.message || `Unable to load system logs (HTTP ${res.status}).`
          );
        }
        return;
      }

      const data = await res.json();
      if (mountedRef.current) {
        const nextLogs: SystemApiLogEntry[] = Array.isArray(data?.logs) ? data.logs : [];
        setLogs(nextLogs);
        if (data?.summary) {
          setSummary(data.summary);
          onLogCountChange?.(Number(data.summary.totalTracked ?? nextLogs.length));
        } else {
          onLogCountChange?.(nextLogs.length);
        }
        setErrorMessage(null);
        setLastUpdatedAt(new Date());
      }
    } catch {
      if (mountedRef.current) {
        setErrorMessage('Backend logs endpoint is temporarily unreachable.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [buildAuthHeaders, levelFilter, searchQuery, onLogCountChange]);

  useEffect(() => {
    mountedRef.current = true;
    const debounceId = window.setTimeout(() => {
      void fetchLogs();
    }, 120);
    return () => {
      mountedRef.current = false;
      window.clearTimeout(debounceId);
    };
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchLogs();
      }
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [autoRefresh, fetchLogs]);

  // Latency bar ceiling for proportional visualization
  const maxVisibleLatency = useMemo(() => {
    if (logs.length === 0) return 500;
    return Math.max(250, ...logs.map((l) => l.durationMs));
  }, [logs]);

  // Chronological slice (oldest -> newest) for the latency distribution sparkline
  const sparklineEntries = useMemo(() => {
    return [...logs].slice(0, 32).reverse();
  }, [logs]);

  const handleExportLogs = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      summary,
      filters: { level: levelFilter, search: searchQuery.trim() || null },
      logs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vizra-system-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-label="System Logs"
      className="rounded-2xl bg-[#111111] border border-white/[0.08] overflow-hidden shadow-xl"
    >
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#171717] border border-white/[0.08] flex items-center justify-center text-[#EB3B2D] shrink-0">
            <Terminal size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white truncate">System Logs</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#171717] border border-white/[0.08] text-[10px] font-mono text-neutral-300">
                {summary.totalTracked} calls
              </span>
            </div>
            <p className="text-xs text-neutral-400 truncate">
              Recent backend API call history and response latency telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            aria-pressed={autoRefresh}
            className={`h-8 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-950/30 border-emerald-500/35 text-emerald-400'
                : 'bg-[#171717] border-white/[0.08] text-neutral-400 hover:text-white'
            }`}
            title="Toggle automatic 10-second live refresh"
          >
            <Radio size={12} className={autoRefresh ? 'animate-pulse' : ''} />
            <span>{autoRefresh ? 'Live' : 'Paused'}</span>
          </button>

          <button
            type="button"
            onClick={() => void fetchLogs()}
            disabled={isLoading}
            className="h-8 px-2.5 rounded-lg bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh logs now"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            className="h-8 px-2.5 rounded-lg bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            title="Export log history as JSON"
          >
            <Download size={12} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Hide System Logs"
              className="h-8 w-8 rounded-lg bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-neutral-400 hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer"
              title="Hide System Logs"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Latency & Reliability Summary Strip */}
      <div className="px-5 py-3.5 border-b border-white/[0.06] bg-[#090909]/60 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-[#111111] border border-white/[0.08] px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Avg Latency</span>
            <Clock size={12} className="text-[#EB3B2D]" />
          </div>
          <div className="mt-1 text-base font-bold font-mono text-white">
            {summary.averageLatencyMs} ms
          </div>
        </div>

        <div className="rounded-xl bg-[#111111] border border-white/[0.08] px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>P95 Latency</span>
            <Activity size={12} className="text-[#EB3B2D]" />
          </div>
          <div className="mt-1 text-base font-bold font-mono text-white">
            {summary.p95LatencyMs} ms
          </div>
        </div>

        <div className="rounded-xl bg-[#111111] border border-white/[0.08] px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Success Rate</span>
            <CheckCircle2 size={12} className="text-emerald-400" />
          </div>
          <div className="mt-1 text-base font-bold font-mono text-emerald-400">
            {summary.successRatePct}%
          </div>
        </div>

        <div className="rounded-xl bg-[#111111] border border-white/[0.08] px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>4xx / 5xx Events</span>
            <AlertTriangle
              size={12}
              className={
                summary.errorCount > 0
                  ? 'text-red-400'
                  : summary.warnCount > 0
                  ? 'text-amber-400'
                  : 'text-neutral-500'
              }
            />
          </div>
          <div className="mt-1 text-base font-bold font-mono text-white">
            <span className={summary.warnCount > 0 ? 'text-amber-400' : 'text-neutral-300'}>
              {summary.warnCount}
            </span>
            <span className="text-neutral-500 mx-1">/</span>
            <span className={summary.errorCount > 0 ? 'text-red-400' : 'text-neutral-300'}>
              {summary.errorCount}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Latency Distribution Bar Strip */}
      {sparklineEntries.length > 0 && (
        <div className="px-5 py-3 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-[11px] font-mono text-neutral-400 shrink-0">
            Latency Trend ({sparklineEntries.length} calls · peak {summary.maxLatencyMs} ms)
          </div>
          <div
            className="flex-1 h-8 flex items-end gap-1 px-2 py-1 rounded-lg bg-[#090909] border border-white/[0.06]"
            aria-label="Recent API latency trend"
          >
            {sparklineEntries.map((entry) => {
              const heightPct = Math.max(
                14,
                Math.min(100, Math.round((entry.durationMs / maxVisibleLatency) * 100))
              );
              return (
                <div
                  key={entry.id}
                  title={`${entry.method} ${entry.path} · ${entry.status} · ${entry.durationMs} ms`}
                  className={`flex-1 min-w-[4px] max-w-[14px] rounded-t-sm transition-all ${getLatencyBarColor(
                    entry.durationMs,
                    entry.status
                  )} opacity-85 hover:opacity-100`}
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="px-5 py-3 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'info', label: '2xx OK' },
              { id: 'warn', label: '4xx Warn' },
              { id: 'error', label: '5xx Error' },
            ] as const
          ).map((item) => {
            const active = levelFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLevelFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#DC2626]/15 border-[#DC2626]/50 text-white'
                    : 'bg-[#090909] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-[#171717]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter endpoint, method, or status..."
            aria-label="Filter system logs"
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#090909] border border-white/[0.1] focus:border-[#DC2626] focus:outline-none text-xs text-white placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mx-5 mt-3 px-3.5 py-2.5 rounded-xl bg-red-950/30 border border-red-500/35 text-xs text-red-400 flex items-center justify-between gap-2">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => void fetchLogs()}
            className="underline font-medium hover:text-white cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Log History Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="py-10 px-5 text-center text-xs text-neutral-400">
            {isLoading
              ? 'Loading recent backend API logs...'
              : 'No matching backend API calls recorded yet.'}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#141418] border-b border-white/[0.08] text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="py-2.5 pl-5 pr-3">Time</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 pl-3 pr-5 text-right hidden sm:table-cell">Request ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-xs">
              {logs.map((entry) => {
                const barWidthPct = Math.max(
                  6,
                  Math.min(100, Math.round((entry.durationMs / maxVisibleLatency) * 100))
                );
                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-2.5 pl-5 pr-3 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                      {formatLogTime(entry.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono font-semibold ${getMethodBadgeStyle(
                          entry.method
                        )}`}
                      >
                        {entry.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-white max-w-[260px] truncate">
                      {entry.path}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono font-semibold ${getStatusBadgeStyle(
                          entry.status
                        )}`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[11px] font-semibold w-14 ${getLatencyColor(
                            entry.durationMs,
                            entry.status
                          )}`}
                        >
                          {entry.durationMs} ms
                        </span>
                        <div className="hidden md:block w-16 h-1.5 rounded-full bg-[#171717] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getLatencyBarColor(
                              entry.durationMs,
                              entry.status
                            )}`}
                            style={{ width: `${barWidthPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 pr-5 text-right font-mono text-[10px] text-neutral-500 whitespace-nowrap hidden sm:table-cell">
                      {entry.id.slice(0, 18)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-white/[0.06] bg-[#090909]/60 flex items-center justify-between text-[11px] font-mono text-neutral-500">
        <span>Showing {logs.length} of {summary.totalTracked} recent backend API calls</span>
        <span>
          {lastUpdatedAt
            ? `Synced ${lastUpdatedAt.toLocaleTimeString([], { hour12: false })}`
            : 'Ready'}
        </span>
      </div>
    </section>
  );
};
