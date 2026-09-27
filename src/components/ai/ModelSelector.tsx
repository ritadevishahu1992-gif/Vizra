import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles, Zap, Wand2 } from 'lucide-react';
import { OmniaModel, ModelOption } from '../../types/ai';

interface ModelSelectorProps {
  currentModel: OmniaModel;
  onSelectModel: (model: OmniaModel) => void;
}

const modelOptions: ModelOption[] = [
  {
    id: 'omnia-1.0',
    name: 'Omnia 1.0',
    badge: 'Flagship',
    description: 'High-intelligence multimodal creative reasoning and motion logic.',
    status: 'available',
  },
  {
    id: 'omnia-creative',
    name: 'Omnia Creative',
    badge: 'Generative',
    description: 'Specialized for kinetic motion curves, typography, and visual shaders.',
    status: 'available',
  },
  {
    id: 'omnia-fast',
    name: 'Omnia Fast',
    badge: 'Low Latency',
    description: 'Instant prompt ideation and lightweight conversational iterations.',
    status: 'available',
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModel = modelOptions.find((m) => m.id === currentModel) || modelOptions[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-sm font-medium text-white transition-colors cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-neutral-700"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
        <span>{activeModel.name}</span>
        <ChevronDown size={14} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-72 rounded-xl bg-neutral-950 border border-neutral-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500 border-b border-neutral-900 mb-1">
            Omnia Model Family
          </div>

          <div className="space-y-1">
            {modelOptions.map((model) => {
              const isSelected = model.id === currentModel;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'hover:bg-neutral-900/60 text-neutral-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{model.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-tight">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-[#eb3b2d] shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Planned Models Section */}
          <div className="mt-2 pt-2 border-t border-neutral-900 px-3 py-2 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>More models (Omnia 2.0, Deep Creative)</span>
            <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
              Planned
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
