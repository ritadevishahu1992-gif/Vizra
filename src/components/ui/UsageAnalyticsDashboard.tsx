import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import {
  Activity,
  BarChart3,
  Zap,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  Plus,
  Minus,
  Layers,
  Globe,
  Image as ImageIcon,
  Music,
  Clock,
} from 'lucide-react';
import {
  CREDITS_EVENT_NAME,
  recordAICreditUsage,
  useAnimatedNumber,
} from './CreditUsageIndicator';

export interface MonthlyCreditRecord {
  id: string;
  month: string;
  label: string;
  reasoning: number;
  grounding: number;
  visuals: number;
  audio: number;
  totalUsed: number;
  limit: number;
}

export interface CreditEventRecord {
  id: string;
  timestamp: number;
  category: string;
  delta: number;
  balanceAfter: number;
  description: string;
}

const FALLBACK_MONTHLY_HISTORY: MonthlyCreditRecord[] = [
  {
    id: '2026-06',
    month: 'Jun',
    label: 'Jun 2026',
    reasoning: 16,
    grounding: 9,
    visuals: 7,
    audio: 3,
    totalUsed: 35,
    limit: 60,
  },
  {
    id: '2026-07',
    month: 'Jul',
    label: 'Jul 2026',
    reasoning: 21,
    grounding: 12,
    visuals: 9,
    audio: 4,
    totalUsed: 46,
    limit: 60,
  },
  {
    id: '2026-08',
    month: 'Aug',
    label: 'Aug 2026',
    reasoning: 19,
    grounding: 11,
    visuals: 8,
    audio: 3,
    totalUsed: 41,
    limit: 60,
  },
  {
    id: '2026-09',
    month: 'Sep',
    label: 'Sep 2026',
    reasoning: 24,
    grounding: 14,
    visuals: 11,
    audio: 5,
    totalUsed: 54,
    limit: 60,
  },
  {
    id: '2026-10',
    month: 'Oct',
    label: 'Oct 2026',
    reasoning: 22,
    grounding: 13,
    visuals: 10,
    audio: 4,
    totalUsed: 49,
    limit: 60,
  },
  {
    id: '2026-11',
    month: 'Nov',
    label: 'Nov 2026',
    reasoning: 7,
    grounding: 4,
    visuals: 2,
    audio: 1,
    totalUsed: 14,
    limit: 60,
  },
];

const CATEGORY_KEYS = ['reasoning', 'grounding', 'visuals', 'audio'] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; color: string; icon: React.ElementType }
> = {
  reasoning: {
    label: 'Omnia Reasoning',
    color: '#DC2626',
    icon: Layers,
  },
  grounding: {
    label: 'Web Citations',
    color: '#F87171',
    icon: Globe,
  },
  visuals: {
    label: 'Visual Synthesis',
    color: '#A3A3A3',
    icon: ImageIcon,
  },
  audio: {
    label: 'Lyria 3 Audio',
    color: '#525252',
    icon: Music,
  },
};

/**
 * Usage Analytics Dashboard Component (Powered by D3)
 * Visualizes historical monthly credit consumption trends, stacked category breakdowns,
 * and live backend credit ledger events.
 */
export const UsageAnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<'trend' | 'stacked'>('trend');
  const [windowMonths, setWindowMonths] = useState<3 | 6>(6);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyCreditRecord[]>(
    FALLBACK_MONTHLY_HISTORY
  );
  const [recentEvents, setRecentEvents] = useState<CreditEventRecord[]>([]);
  const [balance, setBalance] = useState({
    used: 14,
    limit: 60,
    remaining: 46,
    planId: 'starter',
    planName: 'Creator Free',
  });
  const [hoveredMonthId, setHoveredMonthId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsageAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedPlan =
        typeof window !== 'undefined'
          ? localStorage.getItem('vizra_active_plan_v1') || 'starter'
          : 'starter';
      const res = await fetch(
        `/api/credits/usage?plan=${encodeURIComponent(savedPlan)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.monthlyHistory) && data.monthlyHistory.length > 0) {
          setMonthlyHistory(data.monthlyHistory);
        }
        if (Array.isArray(data.recentEvents)) {
          setRecentEvents(data.recentEvents);
        }
        if (data.balance) {
          setBalance({
            used: Number(data.balance.used ?? 14),
            limit: Number(data.balance.limit ?? 60),
            remaining: Number(data.balance.remaining ?? 46),
            planId: data.balance.planId || 'starter',
            planName: data.balance.planName || 'Creator Free',
          });
        }
      }
    } catch {
      // Keep fallback data
    } finally {
      window.setTimeout(() => setIsLoading(false), 200);
    }
  }, []);

  useEffect(() => {
    fetchUsageAnalytics();
  }, [fetchUsageAnalytics]);

  useEffect(() => {
    const handleCreditsUpdated = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.monthlyHistory && custom.detail?.balance) {
        setMonthlyHistory(custom.detail.monthlyHistory);
        setBalance({
          used: Number(custom.detail.balance.used),
          limit: Number(custom.detail.balance.limit),
          remaining: Number(custom.detail.balance.remaining),
          planId: custom.detail.balance.planId || 'starter',
          planName: custom.detail.balance.planName || 'Creator Free',
        });
        if (Array.isArray(custom.detail.recentEvents)) {
          setRecentEvents(custom.detail.recentEvents);
        }
      } else {
        fetchUsageAnalytics();
      }
    };

    window.addEventListener(CREDITS_EVENT_NAME, handleCreditsUpdated);
    return () =>
      window.removeEventListener(CREDITS_EVENT_NAME, handleCreditsUpdated);
  }, [fetchUsageAnalytics]);

  const visibleHistory = useMemo(
    () => monthlyHistory.slice(-windowMonths),
    [monthlyHistory, windowMonths]
  );

  // Aggregate KPI metrics across visible months
  const totalSixMonthCredits = useMemo(
    () => d3.sum(visibleHistory, (d) => d.totalUsed),
    [visibleHistory]
  );
  const averageMonthlyCredits = useMemo(
    () =>
      visibleHistory.length > 0
        ? Math.round(totalSixMonthCredits / visibleHistory.length)
        : 0,
    [totalSixMonthCredits, visibleHistory.length]
  );
  const peakMonthRecord = useMemo(() => {
    if (visibleHistory.length === 0) return null;
    return visibleHistory.reduce((best, cur) =>
      cur.totalUsed > best.totalUsed ? cur : best
    );
  }, [visibleHistory]);

  // Animated numbers for top KPI summary cards
  const { displayValue: animRemaining, direction: remDir } = useAnimatedNumber(
    balance.remaining,
    680
  );
  const { displayValue: animUsed } = useAnimatedNumber(balance.used, 680);
  const { displayValue: animTotalWindow } = useAnimatedNumber(
    totalSixMonthCredits,
    680
  );
  const { displayValue: animAvgMonthly } = useAnimatedNumber(
    averageMonthlyCredits,
    680
  );

  // ===========================================================================
  // D3 SCALES, GENERATORS & STACKS
  // ===========================================================================
  const svgWidth = 720;
  const svgHeight = 270;
  const margin = { top: 24, right: 24, bottom: 36, left: 48 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  const d3Geometry = useMemo(() => {
    const maxDataY =
      d3.max(visibleHistory, (d) => Math.max(d.totalUsed, d.limit)) || 60;
    const yMax = Math.ceil(maxDataY * 1.12);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0])
      .nice();

    const xPointScale = d3
      .scalePoint<string>()
      .domain(visibleHistory.map((d) => d.id))
      .range([24, innerWidth - 24]);

    const xBandScale = d3
      .scaleBand<string>()
      .domain(visibleHistory.map((d) => d.id))
      .range([12, innerWidth - 12])
      .padding(0.38);

    // D3 Monotone Area & Line Generators for Trend View
    const areaGenerator = d3
      .area<MonthlyCreditRecord>()
      .x((d) => xPointScale(d.id) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.totalUsed))
      .curve(d3.curveMonotoneX);

    const lineGenerator = d3
      .line<MonthlyCreditRecord>()
      .x((d) => xPointScale(d.id) ?? 0)
      .y((d) => yScale(d.totalUsed))
      .curve(d3.curveMonotoneX);

    const reasoningLineGenerator = d3
      .line<MonthlyCreditRecord>()
      .x((d) => xPointScale(d.id) ?? 0)
      .y((d) => yScale(d.reasoning))
      .curve(d3.curveMonotoneX);

    // D3 Stack Generator for Category Breakdown View
    const stackGenerator = d3
      .stack<MonthlyCreditRecord, CategoryKey>()
      .keys(CATEGORY_KEYS);
    const stackedSeries = stackGenerator(visibleHistory);

    const yTicks = yScale.ticks(5).map((val) => ({
      value: val,
      y: yScale(val),
    }));

    return {
      yScale,
      xPointScale,
      xBandScale,
      areaPath: areaGenerator(visibleHistory) || '',
      linePath: lineGenerator(visibleHistory) || '',
      reasoningLinePath: reasoningLineGenerator(visibleHistory) || '',
      stackedSeries,
      yTicks,
      quotaY: yScale(balance.limit),
    };
  }, [visibleHistory, innerWidth, innerHeight, balance.limit]);

  const activeHoveredRecord = useMemo(
    () =>
      visibleHistory.find((d) => d.id === hoveredMonthId) ||
      visibleHistory[visibleHistory.length - 1] ||
      null,
    [visibleHistory, hoveredMonthId]
  );

  return (
    <div className="rounded-3xl bg-[#111111] border border-white/[0.08] p-6 text-white space-y-6 select-none shadow-xl">
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#DC2626]/15 border border-[#DC2626]/30 text-[#EB3B2D]">
              <Activity size={14} />
            </span>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">
              Usage Analytics & Historical Credit Consumption
            </h2>
            <span className="px-2 py-0.5 rounded bg-[#171717] border border-white/[0.08] text-[10px] font-mono text-neutral-400">
              D3 Engine
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Monthly AI generation credit trends across Omnia Reasoning, Grounded Citations, Visual Synthesis, and Lyria 3 Audio.
          </p>
        </div>

        {/* Right Toolbar: Live Backend Credit Test Controls + Chart Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Interactive Backend Ledger Controls to test real-time numerical animations */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#090909] border border-white/[0.08]">
            <button
              type="button"
              onClick={() =>
                recordAICreditUsage(
                  3,
                  'reasoning',
                  'consume',
                  'Batch Omnia 1.0 synthesis (-3 credits)'
                )
              }
              className="px-2.5 py-1 rounded-lg bg-[#171717] hover:bg-neutral-800 text-[11px] font-mono text-[#EB3B2D] flex items-center gap-1 transition-colors cursor-pointer"
              title="Record 3 credits consumed on backend and watch counters animate down"
            >
              <Minus size={11} />
              <span>Use 3 Credits</span>
            </button>
            <button
              type="button"
              onClick={() =>
                recordAICreditUsage(
                  10,
                  'reasoning',
                  'refill',
                  'Workspace credit refill (+10 credits)'
                )
              }
              className="px-2.5 py-1 rounded-lg bg-[#171717] hover:bg-neutral-800 text-[11px] font-mono text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
              title="Top up 10 credits on backend and watch counters animate up"
            >
              <Plus size={11} />
              <span>Top-Up +10</span>
            </button>
          </div>

          {/* 3M / 6M Window Selector */}
          <div
            role="group"
            aria-label="Historical month window"
            className="inline-flex items-center p-0.5 rounded-xl bg-[#090909] border border-white/[0.08] text-[11px] font-mono"
          >
            {([3, 6] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setWindowMonths(m)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  windowMonths === m
                    ? 'bg-[#171717] text-white font-semibold border border-white/[0.1]'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>

          {/* D3 Chart Mode Switcher */}
          <div
            role="group"
            aria-label="D3 chart mode"
            className="inline-flex items-center p-0.5 rounded-xl bg-[#090909] border border-white/[0.08] text-[11px]"
          >
            <button
              type="button"
              onClick={() => setChartType('trend')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                chartType === 'trend'
                  ? 'bg-[#DC2626] text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Activity size={12} />
              <span>Monthly Trend</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('stacked')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                chartType === 'stacked'
                  ? 'bg-[#DC2626] text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BarChart3 size={12} />
              <span>Category Stack</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchUsageAnalytics}
            className="p-2 rounded-xl bg-[#090909] hover:bg-[#171717] border border-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Sync with backend credit ledger"
            aria-label="Sync credit analytics"
          >
            <RefreshCw
              size={13}
              className={isLoading ? 'animate-spin text-[#EB3B2D]' : ''}
            />
          </button>
        </div>
      </div>

      {/* 4 Animated KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#090909] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Remaining Credits</span>
            <Zap size={13} className="text-[#EB3B2D]" />
          </div>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span
              className={`text-2xl font-bold transition-colors duration-200 ${
                remDir === 'up'
                  ? 'text-emerald-400'
                  : remDir === 'down'
                  ? 'text-[#EB3B2D]'
                  : 'text-white'
              }`}
            >
              {animRemaining}
            </span>
            <span className="text-xs font-mono text-neutral-500">
              / {balance.limit} ({balance.planName})
            </span>
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            Used this cycle: <span className="text-neutral-300">{animUsed}</span> credits
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090909] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>{windowMonths}-Month Total Consumption</span>
            <Sparkles size={13} className="text-[#EB3B2D]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {animTotalWindow}
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            Cumulative studio generations
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090909] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Monthly Average Burn</span>
            <Activity size={13} className="text-[#EB3B2D]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {animAvgMonthly}{' '}
            <span className="text-xs font-mono font-normal text-neutral-500">
              credits / mo
            </span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400">
            {Math.round((animAvgMonthly / Math.max(balance.limit, 1)) * 100)}% of monthly tier capacity
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090909] border border-white/[0.07] space-y-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Peak Usage Month</span>
              <BarChart3 size={13} className="text-[#EB3B2D]" />
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {peakMonthRecord
                ? `${peakMonthRecord.label} (${peakMonthRecord.totalUsed} cr)`
                : 'Nov 2026'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/#pricing')}
            className="text-[11px] font-mono text-[#EB3B2D] hover:text-white flex items-center gap-1 transition-colors cursor-pointer pt-1"
          >
            <span>Expand monthly credit ceiling</span>
            <ArrowUpRight size={11} />
          </button>
        </div>
      </div>

      {/* Main D3 Visualization & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: D3 SVG Chart Canvas */}
        <div className="lg:col-span-8 rounded-2xl bg-[#090909] border border-white/[0.07] p-4 sm:p-5 space-y-3">
          {/* Legend & Hovered Month Readout */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {chartType === 'trend' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
                    <span className="text-neutral-300 font-medium">
                      Total Monthly Credits
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-neutral-400" />
                    <span className="text-neutral-400">Omnia Reasoning</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 border-t border-dashed border-[#EB3B2D]" />
                    <span className="text-neutral-500 font-mono text-[11px]">
                      Plan Ceiling ({balance.limit})
                    </span>
                  </div>
                </>
              ) : (
                CATEGORY_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: CATEGORY_META[key].color }}
                    />
                    <span className="text-neutral-300 text-[11px]">
                      {CATEGORY_META[key].label}
                    </span>
                  </div>
                ))
              )}
            </div>

            {activeHoveredRecord && (
              <div className="px-2.5 py-1 rounded-lg bg-[#111111] border border-white/[0.08] font-mono text-[11px] flex items-center gap-2">
                <span className="text-neutral-400">{activeHoveredRecord.label}:</span>
                <span className="text-[#EB3B2D] font-bold">
                  {activeHoveredRecord.totalUsed} credits
                </span>
              </div>
            )}
          </div>

          {/* Responsive D3 SVG */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              role="img"
              aria-label="D3 Monthly Credit Consumption Chart"
              className="w-full h-auto overflow-visible"
              onMouseLeave={() => setHoveredMonthId(null)}
            >
              <defs>
                <linearGradient id="d3VizraCrimsonArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DC2626" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <g transform={`translate(${margin.left}, ${margin.top})`}>
                {/* Horizontal Y-Axis Gridlines & Labels */}
                {d3Geometry.yTicks.map((t) => (
                  <g key={t.value}>
                    <line
                      x1={0}
                      y1={t.y}
                      x2={innerWidth}
                      y2={t.y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray={t.value === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={-10}
                      y={t.y + 4}
                      textAnchor="end"
                      className="fill-neutral-500 text-[10px] font-mono"
                    >
                      {t.value}
                    </text>
                  </g>
                ))}

                {/* Plan Quota Ceiling Reference Line */}
                {d3Geometry.quotaY >= 0 && d3Geometry.quotaY <= innerHeight && (
                  <line
                    x1={0}
                    y1={d3Geometry.quotaY}
                    x2={innerWidth}
                    y2={d3Geometry.quotaY}
                    stroke="rgba(235, 59, 45, 0.45)"
                    strokeWidth="1.2"
                    strokeDasharray="5 4"
                  />
                )}

                {/* MODE 1: D3 MONOTONE AREA & LINE TREND */}
                {chartType === 'trend' && (
                  <>
                    <path
                      d={d3Geometry.areaPath}
                      fill="url(#d3VizraCrimsonArea)"
                    />
                    <path
                      d={d3Geometry.reasoningLinePath}
                      fill="none"
                      stroke="#737373"
                      strokeWidth="1.75"
                      strokeDasharray="4 3"
                    />
                    <path
                      d={d3Geometry.linePath}
                      fill="none"
                      stroke="#DC2626"
                      strokeWidth="2.5"
                    />

                    {visibleHistory.map((d) => {
                      const cx = d3Geometry.xPointScale(d.id) ?? 0;
                      const cy = d3Geometry.yScale(d.totalUsed);
                      const isHovered = activeHoveredRecord?.id === d.id;
                      return (
                        <g
                          key={d.id}
                          onMouseEnter={() => setHoveredMonthId(d.id)}
                          className="cursor-pointer"
                        >
                          {isHovered && (
                            <line
                              x1={cx}
                              y1={0}
                              x2={cx}
                              y2={innerHeight}
                              stroke="rgba(220,38,38,0.4)"
                              strokeDasharray="2 2"
                            />
                          )}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 5.5 : 3.8}
                            fill={isHovered ? '#ffffff' : '#DC2626'}
                            stroke="#DC2626"
                            strokeWidth={isHovered ? 2.5 : 1.5}
                          />
                          <rect
                            x={cx - 24}
                            y={0}
                            width={48}
                            height={innerHeight}
                            fill="transparent"
                          />
                          <text
                            x={cx}
                            y={innerHeight + 22}
                            textAnchor="middle"
                            className={`text-[10px] font-mono ${
                              isHovered
                                ? 'fill-white font-semibold'
                                : 'fill-neutral-500'
                            }`}
                          >
                            {d.month}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* MODE 2: D3 STACKED CATEGORY BAR CHART */}
                {chartType === 'stacked' && (
                  <>
                    {d3Geometry.stackedSeries.map((layer) => {
                      const catKey = layer.key as CategoryKey;
                      const color = CATEGORY_META[catKey].color;
                      return (
                        <g key={catKey} fill={color}>
                          {layer.map((segment) => {
                            const d = segment.data;
                            const x = d3Geometry.xBandScale(d.id) ?? 0;
                            const bw = d3Geometry.xBandScale.bandwidth();
                            const yTop = d3Geometry.yScale(segment[1]);
                            const yBottom = d3Geometry.yScale(segment[0]);
                            const barHeight = Math.max(0, yBottom - yTop);
                            return (
                              <rect
                                key={`${catKey}-${d.id}`}
                                x={x}
                                y={yTop}
                                width={bw}
                                height={barHeight}
                                rx={2}
                                onMouseEnter={() => setHoveredMonthId(d.id)}
                                className="cursor-pointer transition-opacity hover:opacity-90"
                              />
                            );
                          })}
                        </g>
                      );
                    })}

                    {visibleHistory.map((d) => {
                      const x =
                        (d3Geometry.xBandScale(d.id) ?? 0) +
                        d3Geometry.xBandScale.bandwidth() / 2;
                      const isHovered = activeHoveredRecord?.id === d.id;
                      return (
                        <text
                          key={d.id}
                          x={x}
                          y={innerHeight + 22}
                          textAnchor="middle"
                          className={`text-[10px] font-mono ${
                            isHovered
                              ? 'fill-white font-semibold'
                              : 'fill-neutral-500'
                          }`}
                        >
                          {d.month}
                        </text>
                      );
                    })}
                  </>
                )}
              </g>
            </svg>
          </div>
        </div>

        {/* Right 4 Cols: Hovered Month Category Breakdown & Live Credit Ledger Feed */}
        <div className="lg:col-span-4 space-y-4">
          {activeHoveredRecord && (
            <div className="p-4 rounded-2xl bg-[#090909] border border-white/[0.07] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    {activeHoveredRecord.label} Breakdown
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {activeHoveredRecord.totalUsed} of {activeHoveredRecord.limit} credits used
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#171717] border border-white/[0.08] font-mono text-[10px] text-[#EB3B2D]">
                  {Math.round(
                    (activeHoveredRecord.totalUsed /
                      Math.max(activeHoveredRecord.limit, 1)) *
                      100
                  )}
                  %
                </span>
              </div>

              <div className="space-y-2.5">
                {CATEGORY_KEYS.map((key) => {
                  const meta = CATEGORY_META[key];
                  const Icon = meta.icon;
                  const val = activeHoveredRecord[key];
                  const pct = Math.round(
                    (val / Math.max(activeHoveredRecord.totalUsed, 1)) * 100
                  );
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-neutral-300">
                          <Icon size={12} className="text-[#EB3B2D]" />
                          <span>{meta.label}</span>
                        </span>
                        <span className="font-mono text-[11px] text-white tabular-nums">
                          {val} cr <span className="text-neutral-500">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(4, pct)}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Backend Credit Ledger Transactions */}
          <div className="p-4 rounded-2xl bg-[#090909] border border-white/[0.07] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-[#EB3B2D]" />
                <span className="text-xs font-semibold text-white">
                  Recent Credit Ledger Events
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">Live</span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {recentEvents.length === 0 ? (
                <div className="text-[11px] text-neutral-500 py-3 text-center">
                  No recent credit events recorded.
                </div>
              ) : (
                recentEvents.slice(0, 5).map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#111111] border border-white/[0.05] text-[11px]"
                  >
                    <div className="min-w-0">
                      <div className="text-neutral-200 truncate font-medium">
                        {evt.description}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        Balance after: {evt.balanceAfter} cr
                      </div>
                    </div>
                    <span
                      className={`font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                        evt.delta > 0
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : 'bg-red-950/60 text-[#EB3B2D] border border-red-800/40'
                      }`}
                    >
                      {evt.delta > 0 ? `+${evt.delta}` : evt.delta}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
