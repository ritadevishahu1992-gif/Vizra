import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => string | number;
}

export interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  headerActions?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

/**
 * VIZRA-Specific Component · Data Table / Data Grid & Empty State
 * Supports search filtering, column sorting, and structured empty states.
 */
export function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  rowKey,
  searchPlaceholder = 'Filter records…',
  searchFilter,
  emptyTitle = 'No matching records found',
  emptyDescription = 'Create a new project, upload an asset, or adjust your search filter.',
  emptyAction,
  headerActions,
  onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const processedRows = useMemo(() => {
    let rows = [...data];
    if (query.trim() && searchFilter) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((r) => searchFilter(r, q));
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        rows.sort((a, b) => {
          const valA = col.getValue ? col.getValue(a) : (a as any)[sortKey];
          const valB = col.getValue ? col.getValue(b) : (b as any)[sortKey];
          if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDir === 'asc' ? valA - valB : valB - valA;
          }
          const strA = String(valA ?? '').toLowerCase();
          const strB = String(valB ?? '').toLowerCase();
          return sortDir === 'asc'
            ? strA.localeCompare(strB)
            : strB.localeCompare(strA);
        });
      }
    }

    return rows;
  }, [data, query, searchFilter, sortKey, sortDir, columns]);

  return (
    <div className="rounded-2xl bg-[#111111] border border-white/[0.08] overflow-hidden text-white select-none">
      {/* Header Bar */}
      {(title || searchFilter || headerActions) && (
        <div className="p-4 sm:px-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {title && (
              <h3 className="text-sm font-semibold tracking-tight text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {searchFilter && (
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-[#090909] border border-white/[0.08] focus:border-[#DC2626] focus:outline-none text-xs text-white placeholder-neutral-500 w-48 sm:w-56 transition-colors"
                />
              </div>
            )}
            {headerActions}
          </div>
        </div>
      )}

      {/* Table or Empty State */}
      {processedRows.length === 0 ? (
        <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
          <div className="w-11 h-11 rounded-2xl bg-[#171717] border border-white/[0.08] flex items-center justify-center text-neutral-400 mb-3">
            <Inbox size={18} className="text-[#EB3B2D]" />
          </div>
          <h4 className="text-xs font-semibold text-white">{emptyTitle}</h4>
          <p className="text-[11px] text-neutral-400 mt-1 max-w-sm leading-relaxed">
            {emptyDescription}
          </p>
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#090909]/60 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`py-3 px-4 font-semibold ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>{col.header}</span>
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ArrowUp size={11} className="text-[#EB3B2D]" />
                            ) : (
                              <ArrowDown size={11} className="text-[#EB3B2D]" />
                            )
                          ) : (
                            <ArrowUpDown size={11} className="text-neutral-600" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {processedRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    onRowClick
                      ? 'hover:bg-white/[0.03] cursor-pointer'
                      : 'hover:bg-white/[0.015]'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 text-neutral-300 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
