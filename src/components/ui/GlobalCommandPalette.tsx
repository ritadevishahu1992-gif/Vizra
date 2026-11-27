import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Sparkles,
  LayoutDashboard,
  Layers,
  FolderOpen,
  BarChart3,
  Terminal,
  KeyRound,
  History,
  Settings,
  Atom,
  Music,
  Radio,
  Database,
  Wrench,
  Globe,
  Brain,
  Code2,
  BookOpen,
  Home,
  Compass,
  CreditCard,
  Newspaper,
  Info,
  Mail,
  ShieldCheck,
  CornerDownLeft,
  Clock,
  Sun,
  Moon,
} from 'lucide-react';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ALL_GLOBAL_COMMANDS,
  GlobalCommandCategory,
  GlobalCommandIconKey,
  GlobalCommandItem,
  scoreGlobalCommandMatch,
} from '../../data/commandPaletteCatalog';

type CategoryTab = 'All' | GlobalCommandCategory;

const CATEGORY_TABS: CategoryTab[] = [
  'All',
  'Workspace',
  'Studio Tools',
  'Documentation',
  'Pages',
];

const RECENT_STORAGE_KEY = 'vizra_global_palette_recent_v1';
const MAX_RECENT_IDS = 4;

function loadRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_RECENT_IDS);
    }
  } catch {
    // Ignore storage access failures
  }
  return [];
}

function saveRecentId(id: string): string[] {
  const prev = loadRecentIds().filter((item) => item !== id);
  const next = [id, ...prev].slice(0, MAX_RECENT_IDS);
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota errors
  }
  return next;
}

function renderCommandIcon(iconKey: GlobalCommandIconKey): React.ReactNode {
  switch (iconKey) {
    case 'sparkles':
      return <Sparkles size={15} className="text-[#EB3B2D]" />;
    case 'dashboard':
      return <LayoutDashboard size={15} className="text-[#EB3B2D]" />;
    case 'layers':
      return <Layers size={15} className="text-neutral-300" />;
    case 'folder':
      return <FolderOpen size={15} className="text-amber-400" />;
    case 'chart':
      return <BarChart3 size={15} className="text-cyan-400" />;
    case 'terminal':
      return <Terminal size={15} className="text-emerald-400" />;
    case 'key':
      return <KeyRound size={15} className="text-amber-400" />;
    case 'history':
      return <History size={15} className="text-neutral-300" />;
    case 'settings':
      return <Settings size={15} className="text-neutral-300" />;
    case 'atom':
      return <Atom size={15} className="text-[#EB3B2D]" />;
    case 'music':
      return <Music size={15} className="text-purple-400" />;
    case 'radio':
      return <Radio size={15} className="text-emerald-400" />;
    case 'database':
      return <Database size={15} className="text-cyan-400" />;
    case 'wrench':
      return <Wrench size={15} className="text-neutral-300" />;
    case 'globe':
      return <Globe size={15} className="text-blue-400" />;
    case 'brain':
      return <Brain size={15} className="text-violet-400" />;
    case 'code':
      return <Code2 size={15} className="text-emerald-400" />;
    case 'book':
      return <BookOpen size={15} className="text-blue-400" />;
    case 'home':
      return <Home size={15} className="text-neutral-300" />;
    case 'compass':
      return <Compass size={15} className="text-amber-400" />;
    case 'creditCard':
      return <CreditCard size={15} className="text-emerald-400" />;
    case 'newspaper':
      return <Newspaper size={15} className="text-neutral-300" />;
    case 'info':
      return <Info size={15} className="text-neutral-400" />;
    case 'mail':
      return <Mail size={15} className="text-neutral-300" />;
    case 'shield':
      return <ShieldCheck size={15} className="text-emerald-400" />;
  }
}

interface PaletteRowItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  path?: string;
  badge?: string;
  icon: React.ReactNode;
  isRecent?: boolean;
  onExecute: () => void;
}

export const GlobalCommandPalette: React.FC = () => {
  const { isOpen, closePalette } = useCommandPalette();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecentIds());

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const currentFullPath = `${location.pathname}${location.search}`;

  const executeNavigation = useCallback(
    (item: GlobalCommandItem) => {
      setRecentIds(saveRecentId(item.id));
      closePalette();
      navigate(item.path);
    },
    [closePalette, navigate]
  );

  // Reset state & focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveTab('All');
      setSelectedIndex(0);
      setRecentIds(loadRecentIds());
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  // Build filtered & ranked command rows
  const items = useMemo<PaletteRowItem[]>(() => {
    const trimmed = query.trim();

    const matches = ALL_GLOBAL_COMMANDS.filter((item) => {
      if (activeTab !== 'All' && item.category !== activeTab) return false;
      return scoreGlobalCommandMatch(item, trimmed) > 0;
    });

    const sorted = trimmed
      ? [...matches].sort(
          (a, b) => scoreGlobalCommandMatch(b, trimmed) - scoreGlobalCommandMatch(a, trimmed)
        )
      : matches;

    // Limit unfiltered documentation spam in "All" view while keeping all docs searchable
    const visibleCommands =
      !trimmed && activeTab === 'All'
        ? [
            ...sorted.filter((c) => c.category === 'Workspace'),
            ...sorted.filter((c) => c.category === 'Studio Tools').slice(0, 8),
            ...sorted.filter((c) => c.category === 'Documentation').slice(0, 6),
            ...sorted.filter((c) => c.category === 'Pages').slice(0, 5),
          ]
        : sorted.slice(0, 40);

    const rows: PaletteRowItem[] = [];

    // Prepend Recent jumps when browsing without a query on "All"
    if (!trimmed && activeTab === 'All' && recentIds.length > 0) {
      for (const rId of recentIds) {
        const found = ALL_GLOBAL_COMMANDS.find((c) => c.id === rId);
        if (found) {
          rows.push({
            id: `recent-${found.id}`,
            title: found.title,
            subtitle: found.subtitle,
            category: 'Recent',
            path: found.path,
            badge: found.category,
            icon: <Clock size={15} className="text-[#EB3B2D]" />,
            isRecent: true,
            onExecute: () => executeNavigation(found),
          });
        }
      }
    }

    for (const cmd of visibleCommands) {
      rows.push({
        id: cmd.id,
        title: cmd.title,
        subtitle: cmd.subtitle,
        category: cmd.category,
        path: cmd.path,
        badge: cmd.badge,
        icon: renderCommandIcon(cmd.iconKey),
        onExecute: () => executeNavigation(cmd),
      });
    }

    // Add quick theme switch when query mentions theme/light/dark or in All view
    const themeKeywords = ['theme', 'dark', 'light', 'mode', 'appearance'];
    const wantsTheme =
      !trimmed ||
      themeKeywords.some((kw) => kw.includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(kw));
    if (activeTab === 'All' && wantsTheme) {
      const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      rows.push({
        id: 'quick-toggle-theme',
        title: nextTheme === 'light' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: 'Toggle application appearance between Obsidian Dark and Light Mode',
        category: 'Quick Action',
        icon:
          nextTheme === 'light' ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-blue-400" />
          ),
        onExecute: () => {
          setTheme(nextTheme);
          closePalette();
        },
      });
    }

    return rows;
  }, [query, activeTab, recentIds, resolvedTheme, executeNavigation, setTheme, closePalette]);

  // Reset active highlight when list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTab]);

  // Keep selected item scrolled into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(1, items.length)) % Math.max(1, items.length));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const idx = CATEGORY_TABS.indexOf(activeTab);
      const nextIdx = e.shiftKey
        ? (idx - 1 + CATEGORY_TABS.length) % CATEGORY_TABS.length
        : (idx + 1) % CATEGORY_TABS.length;
      setActiveTab(CATEGORY_TABS[nextIdx]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = items[selectedIndex];
      if (target) {
        target.onExecute();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center pt-14 sm:pt-24 px-4 select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Global Search Command Palette"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            onClick={closePalette}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-[#111114] border border-[#23232A] shadow-2xl overflow-hidden flex flex-col max-h-[78vh]"
          >
            {/* Search Input Header */}
            <div className="px-4 py-3.5 border-b border-white/[0.08] flex items-center gap-3">
              <Search size={17} className="text-neutral-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search workspace routes, studio tools, or documentation..."
                aria-label="Search workspace routes, studio tools, and documentation"
                className="w-full bg-transparent text-white placeholder-neutral-500 text-sm sm:text-[15px] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search query"
                  className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={closePalette}
                className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 hover:text-white bg-[#141418] border border-[#23232A] rounded cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Category Tabs */}
            <div className="px-4 py-2 border-b border-white/[0.06] bg-[#0A0A0C]/90 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 border ${
                      isActive
                        ? 'bg-[#DC2626]/15 border-[#DC2626]/50 text-white'
                        : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 space-y-0.5"
              role="listbox"
              aria-label="Search results"
            >
              {items.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-1.5">
                  <p className="text-sm font-medium text-neutral-300">
                    No matching routes, tools, or docs for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-neutral-500">
                    Try searching &ldquo;workspace&rdquo;, &ldquo;music&rdquo;, &ldquo;science&rdquo;, &ldquo;logs&rdquo;, or &ldquo;security&rdquo;.
                  </p>
                </div>
              ) : (
                items.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const prevCategory = idx > 0 ? items[idx - 1].category : null;
                  const showGroupHeader = item.category !== prevCategory;
                  const isCurrentRoute =
                    item.path !== undefined &&
                    (item.path === currentFullPath ||
                      (!item.path.includes('?') && item.path === location.pathname && !location.search));

                  return (
                    <React.Fragment key={item.id}>
                      {showGroupHeader && (
                        <div className="px-3 pt-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                          {item.category}
                        </div>
                      )}
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-active={isSelected}
                        onClick={item.onExecute}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#1B1B21] text-white'
                            : 'text-neutral-300 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#141418] border border-[#23232A] flex items-center justify-center shrink-0">
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-medium text-white truncate">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 rounded bg-[#141418] border border-[#23232A] text-[10px] font-mono text-neutral-400 shrink-0">
                                  {item.badge}
                                </span>
                              )}
                              {isCurrentRoute && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 shrink-0">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.path && (
                            <span className="hidden md:inline-block text-[10px] font-mono text-neutral-500 max-w-[140px] truncate">
                              {item.path}
                            </span>
                          )}
                          {isSelected && (
                            <CornerDownLeft size={13} className="text-[#EB3B2D]" />
                          )}
                        </div>
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2.5 border-t border-white/[0.06] bg-[#0A0A0C]/90 flex items-center justify-between text-[11px] font-mono text-neutral-500 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[#141418] border border-[#23232A] rounded text-[10px]">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 bg-[#141418] border border-[#23232A] rounded text-[10px]">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[#141418] border border-[#23232A] rounded text-[10px]">
                    ↵
                  </kbd>
                  <span>Open</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[#141418] border border-[#23232A] rounded text-[10px]">
                    Tab
                  </kbd>
                  <span>Filter</span>
                </span>
              </div>
              <span>{items.length} results</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
