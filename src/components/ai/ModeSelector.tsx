import React, { useState, useRef, useEffect } from 'react';
import { Zap, Brain, Globe, Sparkles, Terminal, BarChart2, Atom, ChevronDown, Check } from 'lucide-react';
import { AIMode, AIModeOption } from '../../types/ai';
import { Tooltip } from '../ui/Tooltip';

export const AI_MODES: AIModeOption[] = [
  {
    id: 'quick',
    name: 'Quick',
    shortDesc: 'Everyday answers',
    description: 'Fast, direct responses for everyday questions without fluff.',
    icon: 'Zap',
  },
  {
    id: 'think',
    name: 'Think',
    shortDesc: 'Deep reasoning',
    description: 'Step-by-step problem deconstruction and logic verification.',
    icon: 'Brain',
  },
  {
    id: 'research',
    name: 'Research',
    shortDesc: 'Web & citations',
    description: 'Fact-checked synthesis with transparent sources and citations.',
    icon: 'Globe',
  },
  {
    id: 'science',
    name: 'Science',
    shortDesc: 'Bio, chemistry & literature',
    description: 'Proteins (AlphaFold), compounds (PubChem), and PubMed research.',
    icon: 'Atom',
    badge: 'DeepMind',
  },
  {
    id: 'create',
    name: 'Create',
    shortDesc: 'Creative workflows',
    description: 'Storyboards, scripts, 10-stage projects, and visual prompts.',
    icon: 'Sparkles',
    badge: 'Popular',
  },
  {
    id: 'code',
    name: 'Code',
    shortDesc: 'Dev & architecture',
    description: 'Clean syntax, component engineering, refactoring, and bug fixes.',
    icon: 'Terminal',
  },
  {
    id: 'analyze',
    name: 'Analyze',
    shortDesc: 'Files & data',
    description: 'Spreadsheet summaries, image inspection, and document extraction.',
    icon: 'BarChart2',
  },
];

interface ModeSelectorProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
  compact?: boolean;
  direction?: 'up' | 'down';
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  compact = false,
  direction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resolvedDirection = direction ?? (compact ? 'up' : 'down');

  const activeOption = AI_MODES.find((m) => m.id === currentMode) || AI_MODES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const renderIcon = (iconName: string, size = 13, className = '') => {
    switch (iconName) {
      case 'Zap':
        return <Zap size={size} className={className} />;
      case 'Brain':
        return <Brain size={size} className={className} />;
      case 'Globe':
        return <Globe size={size} className={className} />;
      case 'Sparkles':
        return <Sparkles size={size} className={className} />;
      case 'Terminal':
        return <Terminal size={size} className={className} />;
      case 'BarChart2':
        return <BarChart2 size={size} className={className} />;
      case 'Atom':
        return <Atom size={size} className={className} />;
      default:
        return <Zap size={size} className={className} />;
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <Tooltip
        label={`Mode: ${activeOption.name}`}
        text={
          isOpen
            ? ''
            : `${activeOption.description} Click to switch between Quick, Think, Research, Science, Create, Code, or Analyze modes.`
        }
        position={resolvedDirection === 'up' ? 'top' : 'bottom'}
        align="start"
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`flex items-center gap-1.5 rounded-full border transition-all duration-150 cursor-pointer select-none whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#DC143C] ${
            compact
              ? 'h-8 px-2.5 bg-[#1B1B21] hover:bg-[#23232A] border-[#27272F] hover:border-[#DC143C]/40 text-xs text-zinc-200'
              : 'h-9 px-3 bg-[#141418] hover:bg-[#1B1B21] border-[#23232A] hover:border-[#DC143C]/40 text-xs text-white'
          }`}
          aria-label="Switch Omnia AI Mode"
        >
          <span className="text-[#DC143C]">
            {renderIcon(activeOption.icon, 13)}
          </span>
          <span className="font-medium">{activeOption.name}</span>
          <ChevronDown
            size={12}
            className={`text-zinc-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#DC143C]' : ''}`}
          />
        </button>
      </Tooltip>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Omnia capability modes"
          className={`absolute left-0 w-64 rounded-2xl bg-[#141418] border border-[#23232A] shadow-2xl p-1.5 z-50 ${
            resolvedDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-400">
            Omnia Modes
          </div>
          <div className="space-y-0.5">
            {AI_MODES.map((mode) => {
              const isSelected = mode.id === currentMode;
              return (
                <button
                  key={mode.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectMode(mode.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#DC143C]/14 border border-[#DC143C]/35'
                      : 'hover:bg-[#1B1B21] border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 ${isSelected ? 'text-[#DC143C]' : 'text-zinc-400'}`}>
                    {renderIcon(mode.icon, 14)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                        {mode.name}
                      </span>
                      {mode.badge && (
                        <span className="text-[10px] font-medium text-rose-300/90">
                          {mode.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-1 mt-0.5">
                      {mode.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check size={13} className="text-[#DC143C] shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

