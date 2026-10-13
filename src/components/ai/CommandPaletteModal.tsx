import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Command,
  X,
  Zap,
  Brain,
  Globe,
  Sparkles,
  Terminal,
  BarChart2,
  Atom,
  Music,
  Radio,
  Database,
  Sliders,
  Plus,
  PanelLeft,
  Keyboard,
  Layers,
  ArrowRight,
  Trash2,
  Download,
  Check,
  Cpu,
} from 'lucide-react';
import { AIMode, OmniaModel } from '../../types/ai';
import { modKey } from '../../hooks/useKeyboardShortcuts';

export interface CommandPaletteAction {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation & Hubs' | 'AI Modes' | 'Omnia Models' | 'Chat & Actions';
  shortcut?: string;
  icon: React.ReactNode;
  iconBg?: string;
  onSelect: () => void;
  keywords?: string[];
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Navigation callbacks
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenScienceHub: () => void;
  onOpenMusicStudio: () => void;
  onOpenLiveVoice: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenCreateHub: () => void;
  onOpenCreationTools: () => void;
  onOpenShortcutsHelp: () => void;
  onFocusComposer: () => void;
  onClearHistory?: () => void;
  onExportConversation?: () => void;
  // Mode & Model setters
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
  currentModel: OmniaModel;
  onSelectModel: (model: OmniaModel) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNewChat,
  onToggleSidebar,
  onOpenSettings,
  onOpenScienceHub,
  onOpenMusicStudio,
  onOpenLiveVoice,
  onOpenKnowledgeBase,
  onOpenCreateHub,
  onOpenCreationTools,
  onOpenShortcutsHelp,
  onFocusComposer,
  onClearHistory,
  onExportConversation,
  currentMode,
  onSelectMode,
  currentModel,
  onSelectModel,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Define full command actions registry
  const actions: CommandPaletteAction[] = useMemo(() => [
    // Navigation & Hubs
    {
      id: 'nav-science',
      title: 'Omnia Science Suite',
      subtitle: 'Query AlphaFold 3D protein structures, PubChem, and PubMed literature',
      category: 'Navigation & Hubs',
      shortcut: `${modKey}+Shift+S`,
      icon: <Atom size={16} className="text-[#eb3b2d]" />,
      iconBg: 'bg-[#eb3b2d]/10',
      keywords: ['alphafold', 'proteins', 'pubchem', 'chemistry', 'biology', 'pubmed', 'papers'],
      onSelect: () => {
        onClose();
        onOpenScienceHub();
      },
    },
    {
      id: 'nav-music',
      title: 'AI Music & Audio Studio',
      subtitle: 'Create original tracks, soundtracks, and ambient audio with Lyria 3',
      category: 'Navigation & Hubs',
      shortcut: `${modKey}+Shift+M`,
      icon: <Music size={16} className="text-purple-400" />,
      iconBg: 'bg-purple-500/10',
      keywords: ['lyria', 'song', 'audio', 'soundtrack', 'compose', 'beat'],
      onSelect: () => {
        onClose();
        onOpenMusicStudio();
      },
    },
    {
      id: 'nav-live-voice',
      title: 'Live Voice Conversation',
      subtitle: 'Real-time two-way spoken dialogue with gemini-3.8-live',
      category: 'Navigation & Hubs',
      shortcut: `${modKey}+Shift+L`,
      icon: <Radio size={16} className="text-emerald-400" />,
      iconBg: 'bg-emerald-500/10',
      keywords: ['speech', 'mic', 'speak', 'audio', 'call', 'live'],
      onSelect: () => {
        onClose();
        onOpenLiveVoice();
      },
    },
    {
      id: 'nav-create-hub',
      title: 'Omnia Create Hub',
      subtitle: 'Browse 8 creative disciplines (Storytelling, Brand, Video, Code, etc.)',
      category: 'Navigation & Hubs',
      shortcut: `${modKey}+Shift+C`,
      icon: <Sparkles size={16} className="text-amber-400" />,
      iconBg: 'bg-amber-500/10',
      keywords: ['templates', 'creative', 'disciplines', 'writing', 'video'],
      onSelect: () => {
        onClose();
        onOpenCreateHub();
      },
    },
    {
      id: 'nav-knowledge',
      title: 'RAG Knowledge Base Explorer',
      subtitle: 'Inspect grounded citations, ingested documents, and verified entities',
      category: 'Navigation & Hubs',
      shortcut: `${modKey}+Shift+K`,
      icon: <Database size={16} className="text-cyan-400" />,
      iconBg: 'bg-cyan-500/10',
      keywords: ['rag', 'sources', 'grounding', 'documents', 'citations'],
      onSelect: () => {
        onClose();
        onOpenKnowledgeBase();
      },
    },
    {
      id: 'nav-tools',
      title: 'Creative Tools & Workflows',
      subtitle: 'Explore specialized project generation and prompt presets',
      category: 'Navigation & Hubs',
      icon: <Layers size={16} className="text-neutral-300" />,
      iconBg: 'bg-neutral-800',
      keywords: ['tools', 'workflows', 'presets'],
      onSelect: () => {
        onClose();
        onOpenCreationTools();
      },
    },
    {
      id: 'nav-settings',
      title: 'Settings & Personal Memory',
      subtitle: 'Configure AI response style, memory retention, and integrations',
      category: 'Navigation & Hubs',
      shortcut: `${modKey}+,`,
      icon: <Sliders size={16} className="text-neutral-300" />,
      iconBg: 'bg-neutral-800',
      keywords: ['preferences', 'memory', 'privacy', 'config', 'integrations'],
      onSelect: () => {
        onClose();
        onOpenSettings();
      },
    },
    {
      id: 'nav-sidebar',
      title: 'Toggle Conversation Sidebar',
      subtitle: 'Show or hide the workspace history sidebar',
      category: 'Navigation & Hubs',
      shortcut: `${modKey}+B`,
      icon: <PanelLeft size={16} className="text-neutral-400" />,
      iconBg: 'bg-neutral-800',
      keywords: ['sidebar', 'history', 'collapse', 'expand'],
      onSelect: () => {
        onClose();
        onToggleSidebar();
      },
    },

    // AI Modes
    {
      id: 'mode-quick',
      title: 'Quick Mode',
      subtitle: 'Fast, responsive, conversational intelligence',
      category: 'AI Modes',
      shortcut: `${modKey}+1`,
      icon: <Zap size={16} className="text-yellow-400" />,
      iconBg: 'bg-yellow-500/10',
      keywords: ['fast', 'chat', 'direct'],
      onSelect: () => {
        onSelectMode('quick');
        onClose();
      },
    },
    {
      id: 'mode-think',
      title: 'Think Mode',
      subtitle: 'Deep reasoning, logic analysis & multi-step thinking',
      category: 'AI Modes',
      shortcut: `${modKey}+2`,
      icon: <Brain size={16} className="text-violet-400" />,
      iconBg: 'bg-violet-500/10',
      keywords: ['reasoning', 'logic', 'math', 'chain of thought'],
      onSelect: () => {
        onSelectMode('think');
        onClose();
      },
    },
    {
      id: 'mode-research',
      title: 'Research Mode',
      subtitle: 'Real-time web retrieval with live source grounding and citations',
      category: 'AI Modes',
      shortcut: `${modKey}+3`,
      icon: <Globe size={16} className="text-blue-400" />,
      iconBg: 'bg-blue-500/10',
      keywords: ['web', 'google search', 'citations', 'facts', 'sources'],
      onSelect: () => {
        onSelectMode('research');
        onClose();
      },
    },
    {
      id: 'mode-science',
      title: 'Science Mode',
      subtitle: 'DeepMind Science Suite (Proteins, Compounds, PubMed & Biology)',
      category: 'AI Modes',
      shortcut: `${modKey}+4`,
      icon: <Atom size={16} className="text-[#eb3b2d]" />,
      iconBg: 'bg-[#eb3b2d]/10',
      keywords: ['alphafold', 'pubchem', 'uniprot', 'pdb', 'genomics', 'chemistry'],
      onSelect: () => {
        onSelectMode('science');
        onClose();
      },
    },
    {
      id: 'mode-create',
      title: 'Create Mode',
      subtitle: 'Long-form narrative, scripts, marketing copy & creative design',
      category: 'AI Modes',
      shortcut: `${modKey}+5`,
      icon: <Sparkles size={16} className="text-amber-400" />,
      iconBg: 'bg-amber-500/10',
      keywords: ['writing', 'story', 'copy', 'script', 'ideas'],
      onSelect: () => {
        onSelectMode('create');
        onClose();
      },
    },
    {
      id: 'mode-code',
      title: 'Code Mode',
      subtitle: 'Full-stack software engineering, algorithms, and debugging',
      category: 'AI Modes',
      shortcut: `${modKey}+6`,
      icon: <Terminal size={16} className="text-emerald-400" />,
      iconBg: 'bg-emerald-500/10',
      keywords: ['programming', 'typescript', 'python', 'bug', 'developer'],
      onSelect: () => {
        onSelectMode('code');
        onClose();
      },
    },
    {
      id: 'mode-analyze',
      title: 'Analyze Mode',
      subtitle: 'Tabular datasets, financial figures, CSV audits & structured comparisons',
      category: 'AI Modes',
      shortcut: `${modKey}+7`,
      icon: <BarChart2 size={16} className="text-cyan-400" />,
      iconBg: 'bg-cyan-500/10',
      keywords: ['data', 'metrics', 'csv', 'sheets', 'statistics'],
      onSelect: () => {
        onSelectMode('analyze');
        onClose();
      },
    },

    // Omnia Models
    {
      id: 'model-1-0',
      title: 'Omnia 1.0',
      subtitle: 'Flagship multimodal engine tuned for conversational craft & creation',
      category: 'Omnia Models',
      icon: <Cpu size={16} className="text-[#eb3b2d]" />,
      iconBg: 'bg-[#eb3b2d]/10',
      keywords: ['flagship', 'gemini', '3.7 flash', 'default'],
      onSelect: () => {
        onSelectModel('omnia-1.0');
        onClose();
      },
    },
    {
      id: 'model-creative',
      title: 'Omnia Creative Pro',
      subtitle: 'Optimized for high-aesthetic generative storytelling and ideation',
      category: 'Omnia Models',
      icon: <Sparkles size={16} className="text-purple-400" />,
      iconBg: 'bg-purple-500/10',
      keywords: ['artistic', 'narrative', 'expressive'],
      onSelect: () => {
        onSelectModel('omnia-creative');
        onClose();
      },
    },
    {
      id: 'model-fast',
      title: 'Omnia Fast',
      subtitle: 'Ultra low-latency lightweight pipeline for instantaneous responses',
      category: 'Omnia Models',
      icon: <Zap size={16} className="text-amber-400" />,
      iconBg: 'bg-amber-500/10',
      keywords: ['speed', 'instant', 'quick'],
      onSelect: () => {
        onSelectModel('omnia-fast');
        onClose();
      },
    },

    // Chat & Actions
    {
      id: 'action-new-chat',
      title: 'New Conversation',
      subtitle: 'Start a clean thread with fresh context',
      category: 'Chat & Actions',
      shortcut: `${modKey}+N`,
      icon: <Plus size={16} className="text-[#eb3b2d]" />,
      iconBg: 'bg-[#eb3b2d]/10',
      keywords: ['clear', 'reset', 'blank', 'start'],
      onSelect: () => {
        onClose();
        onNewChat();
      },
    },
    {
      id: 'action-focus-composer',
      title: 'Focus Message Composer',
      subtitle: 'Jump immediately to the prompt input',
      category: 'Chat & Actions',
      shortcut: '/',
      icon: <ArrowRight size={16} className="text-neutral-400" />,
      iconBg: 'bg-neutral-800',
      keywords: ['type', 'input', 'prompt', 'chat'],
      onSelect: () => {
        onClose();
        onFocusComposer();
      },
    },
    {
      id: 'action-shortcuts',
      title: 'Keyboard Shortcuts Reference',
      subtitle: 'View cheat sheet of all navigation shortcuts',
      category: 'Chat & Actions',
      shortcut: `${modKey}+/`,
      icon: <Keyboard size={16} className="text-neutral-300" />,
      iconBg: 'bg-neutral-800',
      keywords: ['keys', 'hotkeys', 'cheat sheet', 'help'],
      onSelect: () => {
        onClose();
        onOpenShortcutsHelp();
      },
    },
    ...(onExportConversation
      ? [
          {
            id: 'action-export',
            title: 'Export Conversation Transcript',
            subtitle: 'Download the current chat as formatted Markdown',
            category: 'Chat & Actions' as const,
            icon: <Download size={16} className="text-neutral-300" />,
            iconBg: 'bg-neutral-800',
            keywords: ['download', 'save', 'markdown', 'transcript'],
            onSelect: () => {
              onClose();
              onExportConversation();
            },
          },
        ]
      : []),
    ...(onClearHistory
      ? [
          {
            id: 'action-clear-all',
            title: 'Clear All Conversation History',
            subtitle: 'Permanently remove past chat threads and cached messages',
            category: 'Chat & Actions' as const,
            icon: <Trash2 size={16} className="text-red-400" />,
            iconBg: 'bg-red-500/10',
            keywords: ['delete', 'wipe', 'reset'],
            onSelect: () => {
              onClose();
              onClearHistory();
            },
          },
        ]
      : []),
  ], [
    onClose,
    onOpenScienceHub,
    onOpenMusicStudio,
    onOpenLiveVoice,
    onOpenCreateHub,
    onOpenKnowledgeBase,
    onOpenCreationTools,
    onOpenSettings,
    onToggleSidebar,
    onSelectMode,
    onSelectModel,
    onNewChat,
    onFocusComposer,
    onOpenShortcutsHelp,
    onExportConversation,
    onClearHistory,
  ]);

  // Filter actions based on query and category chip
  const filteredActions = useMemo(() => {
    let result = actions;
    if (selectedCategory !== 'All') {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter((a) => {
        return (
          a.title.toLowerCase().includes(q) ||
          (a.subtitle && a.subtitle.toLowerCase().includes(q)) ||
          a.category.toLowerCase().includes(q) ||
          (a.keywords && a.keywords.some((k) => k.toLowerCase().includes(q)))
        );
      });
    }
    return result;
  }, [actions, query, selectedCategory]);

  // Reset selectedIndex whenever filtered actions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredActions]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setSelectedCategory('All');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const categories = ['All', 'Navigation & Hubs', 'AI Modes', 'Omnia Models', 'Chat & Actions'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Command Palette Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#0d0d0d] border border-neutral-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-10 flex flex-col max-h-[75vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Search Bar */}
          <div className="relative px-4 py-3.5 border-b border-neutral-800/80 flex items-center gap-3">
            <Search size={18} className="text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search studio actions... (e.g. Science, Music, Quick Mode)"
              className="w-full bg-transparent text-white placeholder-neutral-500 text-sm md:text-base focus:outline-none font-sans"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded text-neutral-400 hover:text-white"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 rounded">
              ESC
            </kbd>
          </div>

          {/* Category Filter Chips */}
          <div className="px-4 py-2 border-b border-neutral-850 bg-neutral-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Action List */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-2 py-2 space-y-1 divide-y divide-neutral-900/60"
          >
            {filteredActions.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-sm">
                No matching studio commands found for "{query}".
              </div>
            ) : (
              filteredActions.map((action, idx) => {
                const isSelected = idx === selectedIndex;
                const isCurrentActive =
                  (action.id.startsWith('mode-') && action.id.replace('mode-', '') === currentMode) ||
                  (action.id === 'model-1-0' && currentModel === 'omnia-1.0') ||
                  (action.id === 'model-creative' && currentModel === 'omnia-creative') ||
                  (action.id === 'model-fast' && currentModel === 'omnia-fast');

                return (
                  <div
                    key={action.id}
                    data-selected={isSelected}
                    onClick={() => action.onSelect()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-neutral-850 text-white'
                        : 'text-neutral-300 hover:bg-neutral-900/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          action.iconBg || 'bg-neutral-800'
                        }`}
                      >
                        {action.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium text-white truncate">
                            {action.title}
                          </span>
                          {isCurrentActive && (
                            <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#eb3b2d]/20 text-[#eb3b2d] border border-[#eb3b2d]/30 shrink-0">
                              <Check size={10} />
                              Active
                            </span>
                          )}
                        </div>
                        {action.subtitle && (
                          <p className="text-[11px] text-neutral-400 truncate">
                            {action.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] text-neutral-500 font-medium">
                        {action.category}
                      </span>
                      {action.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-300 bg-neutral-900 border border-neutral-700/60 rounded shadow-sm">
                          {action.shortcut}
                        </kbd>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Palette Footer */}
          <div className="px-4 py-2.5 border-t border-neutral-850 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[10px]">↑</kbd>
                <kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[10px]">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[10px]">↵</kbd>
                Select
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>{filteredActions.length} commands</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
