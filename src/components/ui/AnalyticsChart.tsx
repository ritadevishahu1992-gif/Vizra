import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Activity, Calendar } from 'lucide-react';

export type ChartMode = 'area' | 'line' | 'bar';
export type DateRangeFilter = '24h' | '7d' | '30d' | 'all';

export interface ChartDataPoint {
  label: string;
  primary: number;
  secondary?: number;
  unit?: string;
  timestamp?: number;
}

export interface AnalyticsChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  defaultMode?: ChartMode;
  allowModeSwitch?: boolean;
  allowDateFilter?: boolean;
  onDateRangeChange?: (range: DateRangeFilter) => void;
  height?: number;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
}

/**
 * 05 · Analytics Chart
 * Adapted from 21st.dev `chart` pattern using pure responsive SVG + TypeScript
 * with Line, Bar, and Area chart modes, interactive hover tooltips, date range filters,
 * and screen-reader accessible summary tables.
 */
export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title,
  subtitle,
  data,
  primaryLabel = 'Primary Metric',
  secondaryLabel,
  defaultMode = 'area',
  allowModeSwitch = true,
  allowDateFilter = true,
  onDateRangeChange,
  height = 240,
  valueFormatter = (v) => v.toLocaleString(),
  emptyMessage = 'No telemetry events recorded in this window yet.',
}) => {
  const [mode, setMode] = useState<ChartMode>(defaultMode);
  const [dateRange, setDateRange] = useState<DateRangeFilter>('7d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (dateRange === '24h') return data.slice(-Math.min(data.length, 6));
    if (dateRange === '7d') return data.slice(-Math.min(data.length, 10));
    if (dateRange === '30d') return data.slice(-Math.min(data.length, 16));
    return data;
  }, [data, dateRange]);

  const maxValue = useMemo(() => {
    if (filteredData.length === 0) return 100;
    const maxVal = Math.max(
      ...filteredData.map((d) => Math.max(d.primary, d.secondary ?? 0)),
      1
    );
    return Math.ceil(maxVal * 1.15);
  }, [filteredData]);

  const svgWidth = 680;
  const svgHeight = height;
  const padLeft = 44;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 32;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getCoords = (idx: number, val: number) => {
    const count = Math.max(filteredData.length - 1, 1);
    const x =
      filteredData.length === 1
        ? padLeft + plotW / 2
        : padLeft + (idx / count) * plotW;
    const y = padTop + plotH - (Math.max(0, val) / maxValue) * plotH;
    return { x, y };
  };

  const primaryPoints = filteredData.map((d, i) => getCoords(i, d.primary));
  const secondaryPoints = filteredData.map((d, i) =>
    getCoords(i, d.secondary ?? 0)
  );

  const buildLinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  };

  const buildAreaPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    const line = buildLinePath(pts);
    const firstX = pts[0].x.toFixed(1);
    const lastX = pts[pts.length - 1].x.toFixed(1);
    const baseY = (padTop + plotH).toFixed(1);
    return `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(maxValue * ratio),
    y: padTop + plotH - ratio * plotH,
  }));

  const activePoint = hoveredIndex !== null ? filteredData[hoveredIndex] : null;

  return (
    <div className="rounded-2xl bg-[#111111] border border-white/[0.08] p-5 text-white select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Filter */}
          {allowDateFilter && (
            <div
              role="group"
              aria-label="Date range filter"
              className="inline-flex items-center p-0.5 rounded-xl bg-[#090909] border border-white/[0.07] text-[11px] font-mono"
            >
              <Calendar size={12} className="text-neutral-500 ml-2 mr-1" />
              {(['24h', '7d', '30d', 'all'] as DateRangeFilter[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => {
                    setDateRange(range);
                    onDateRangeChange?.(range);
                  }}
                  className={`px-2 py-1 rounded-lg uppercase transition-colors cursor-pointer ${
                    dateRange === range
                      ? 'bg-[#171717] text-white font-semibold border border-white/[0.1]'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}

          {/* Chart Mode Switcher */}
          {allowModeSwitch && (
            <div
              role="group"
              aria-label="Chart visualization type"
              className="inline-flex items-center p-0.5 rounded-xl bg-[#090909] border border-white/[0.07] text-[11px]"
            >
              <button
                type="button"
                onClick={() => setMode('area')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  mode === 'area'
                    ? 'bg-[#DC2626] text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Area chart"
              >
                <Activity size={12} />
                <span>Area</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('line')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  mode === 'line'
                    ? 'bg-[#DC2626] text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Line chart"
              >
                <TrendingUp size={12} />
                <span>Line</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('bar')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  mode === 'bar'
                    ? 'bg-[#DC2626] text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Bar chart"
              >
                <BarChart3 size={12} />
                <span>Bar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Legend & Live Hover Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
            <span className="text-neutral-300 font-medium">{primaryLabel}</span>
          </div>
          {secondaryLabel && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-neutral-400" />
              <span className="text-neutral-400 font-medium">{secondaryLabel}</span>
            </div>
          )}
        </div>

        {activePoint ? (
          <div className="flex items-center gap-3 px-2.5 py-1 rounded-lg bg-[#090909] border border-white/[0.1] font-mono text-[11px]">
            <span className="text-neutral-400">{activePoint.label}:</span>
            <span className="text-[#EB3B2D] font-semibold">
              {valueFormatter(activePoint.primary)}
            </span>
            {secondaryLabel && typeof activePoint.secondary === 'number' && (
              <span className="text-neutral-300">
                · {valueFormatter(activePoint.secondary)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-neutral-500">
            Hover data points to inspect exact values
          </span>
        )}
      </div>

      {/* Responsive SVG Chart Container */}
      {filteredData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-xs text-neutral-500 font-mono border border-dashed border-white/[0.06] rounded-xl mt-2">
          {emptyMessage}
        </div>
      ) : (
        <div className="relative w-full overflow-hidden pt-1">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            role="img"
            aria-label={`${title} (${mode} chart)`}
            className="w-full h-auto overflow-visible"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="vizraCrimsonArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="vizraSecondaryArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A3A3A3" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#A3A3A3" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Y-Axis Labels */}
            {yTicks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={t.y}
                  x2={svgWidth - padRight}
                  y2={t.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray={idx === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={t.y + 4}
                  textAnchor="end"
                  className="fill-neutral-500 text-[10px] font-mono"
                >
                  {t.value}
                </text>
              </g>
            ))}

            {/* AREA MODE */}
            {mode === 'area' && (
              <>
                {secondaryLabel && (
                  <>
                    <path
                      d={buildAreaPath(secondaryPoints)}
                      fill="url(#vizraSecondaryArea)"
                    />
                    <path
                      d={buildLinePath(secondaryPoints)}
                      fill="none"
                      stroke="#A3A3A3"
                      strokeWidth="1.75"
                    />
                  </>
                )}
                <path d={buildAreaPath(primaryPoints)} fill="url(#vizraCrimsonArea)" />
                <path
                  d={buildLinePath(primaryPoints)}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="2.25"
                />
              </>
            )}

            {/* LINE MODE */}
            {mode === 'line' && (
              <>
                {secondaryLabel && (
                  <path
                    d={buildLinePath(secondaryPoints)}
                    fill="none"
                    stroke="#A3A3A3"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}
                <path
                  d={buildLinePath(primaryPoints)}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="2.5"
                />
              </>
            )}

            {/* BAR MODE */}
            {mode === 'bar' &&
              filteredData.map((d, i) => {
                const slotW = plotW / Math.max(filteredData.length, 1);
                const barW = Math.min(28, Math.max(8, slotW * (secondaryLabel ? 0.34 : 0.55)));
                const centerX =
                  filteredData.length === 1
                    ? padLeft + plotW / 2
                    : padLeft + slotW * i + slotW / 2;
                const pCoords = getCoords(i, d.primary);
                const pBarH = Math.max(2, padTop + plotH - pCoords.y);

                const sCoords = getCoords(i, d.secondary ?? 0);
                const sBarH = Math.max(2, padTop + plotH - sCoords.y);

                return (
                  <g
                    key={d.label + i}
                    onMouseEnter={() => setHoveredIndex(i)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={secondaryLabel ? centerX - barW - 2 : centerX - barW / 2}
                      y={pCoords.y}
                      width={barW}
                      height={pBarH}
                      rx={4}
                      fill={hoveredIndex === i ? '#EB3B2D' : '#DC2626'}
                    />
                    {secondaryLabel && typeof d.secondary === 'number' && (
                      <rect
                        x={centerX + 2}
                        y={sCoords.y}
                        width={barW}
                        height={sBarH}
                        rx={4}
                        fill="#737373"
                      />
                    )}
                  </g>
                );
              })}

            {/* Interactive Data Nodes & X-Axis Labels */}
            {primaryPoints.map((pt, i) => {
              const d = filteredData[i];
              const isHovered = hoveredIndex === i;
              return (
                <g
                  key={d.label + i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  className="cursor-pointer"
                >
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={padTop}
                      x2={pt.x}
                      y2={padTop + plotH}
                      stroke="rgba(220,38,38,0.45)"
                      strokeDasharray="2 2"
                    />
                  )}
                  {mode !== 'bar' && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : 3.2}
                      fill={isHovered ? '#ffffff' : '#DC2626'}
                      stroke="#DC2626"
                      strokeWidth={isHovered ? 2.5 : 1.5}
                    />
                  )}
                  {/* Invisible wider hit target */}
                  <rect
                    x={pt.x - 16}
                    y={padTop}
                    width={32}
                    height={plotH}
                    fill="transparent"
                  />
                  <text
                    x={pt.x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className={`text-[10px] font-mono ${
                      isHovered ? 'fill-white font-semibold' : 'fill-neutral-500'
                    }`}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Screen-Reader Accessible Summary Table */}
          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th>Period</th>
                <th>{primaryLabel}</th>
                {secondaryLabel && <th>{secondaryLabel}</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.label}</td>
                  <td>{valueFormatter(row.primary)}</td>
                  {secondaryLabel && <td>{valueFormatter(row.secondary ?? 0)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
