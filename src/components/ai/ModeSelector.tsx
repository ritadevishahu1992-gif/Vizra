import React, { useState, useRef, useEffect } from 'react';
import { Zap, Brain, Globe, Sparkles, Terminal, BarChart2, Atom, ChevronDown, Check } from 'lucide-react';
import { AIMode, AIModeOption } from '../../types/ai';

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
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeOption = AI_MODES.find((m) => m.id === currentMode) || AI_MODES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg border transition-all cursor-pointer select-none ${
          compact
            ? 'px-2 py-1 bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-xs text-neutral-200'
            : 'px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-xs text-white'
        }`}
        title="Switch Omnia AI Mode"
      >
        <span className="text-[#eb3b2d]">
          {renderIcon(activeOption.icon, 13)}
        </span>
        <span className="font-medium">{activeOption.name}</span>
        <ChevronDown
          size={12}
          className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-neutral-950 border border-neutral-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-500 tracking-wider mb-1">
            Omnia Capability Mode
          </div>
          <div className="space-y-0.5">
            {AI_MODES.map((mode) => {
              const isSelected = mode.id === currentMode;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onSelectMode(mode.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 border border-neutral-800'
                      : 'hover:bg-neutral-900/60'
                  }`}
                >
                  <div className={`mt-0.5 ${isSelected ? 'text-[#eb3b2d]' : 'text-neutral-400'}`}>
                    {renderIcon(mode.icon, 14)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                        {mode.name}
                      </span>
                      {mode.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#eb3b2d]/15 text-[#eb3b2d] border border-[#eb3b2d]/30">
                          {mode.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-tight line-clamp-1 mt-0.5">
                      {mode.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check size={13} className="text-[#eb3b2d] shrink-0 mt-0.5" />
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
