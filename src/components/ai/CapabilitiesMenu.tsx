import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Check, Clock } from 'lucide-react';
import { CapabilityItem } from '../../types/ai';

const capabilities: CapabilityItem[] = [
  { name: 'Science & Discovery', description: 'AlphaFold 3D structures, PubChem & PubMed', status: 'available' },
  { name: 'AI Music & Audio', description: 'Soundtracks, jingles & background audio (Lyria 3)', status: 'available' },
  { name: 'Live Voice Conversations', description: 'Real-time two-way dialogue (gemini-3.8-live)', status: 'available' },
  { name: 'Reasoning', description: 'Advanced problem decomposition & logic', status: 'available' },
  { name: 'Creative Generation', description: 'Motion concepts, storyboards & direction', status: 'available' },
  { name: 'Coding', description: 'GLSL shaders, TypeScript & animation curves', status: 'available' },
  { name: 'Image Understanding', description: 'Inspect uploaded compositions & palettes', status: 'available' },
  { name: 'File Analysis', description: 'Parse project briefs & creative docs', status: 'available' },
  { name: 'Web Research', description: 'Live real-time reference retrieval & grounding', status: 'available' },
];

export const CapabilitiesMenu: React.FC = () => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors cursor-pointer select-none"
        aria-label="View Omnia Capabilities"
      >
        <Sparkles size={13} className="text-[#eb3b2d]" />
        <span>Capabilities</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-72 rounded-xl bg-neutral-950 border border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-neutral-500 border-b border-neutral-900 mb-1.5 flex items-center justify-between">
            <span>Omnia 1.0 Capabilities</span>
            <span className="text-[10px] text-[#eb3b2d]">Live Matrix</span>
          </div>

          <div className="space-y-1">
            {capabilities.map((cap) => (
              <div
                key={cap.name}
                className="p-2 rounded-lg hover:bg-neutral-900/60 transition-colors flex items-start justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-white block">{cap.name}</span>
                  <span className="text-[11px] text-neutral-400 block">{cap.description}</span>
                </div>
                {cap.status === 'available' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-800 shrink-0 mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-[#eb3b2d]" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900/40 text-neutral-500 border border-neutral-900 shrink-0 mt-0.5">
                    <Clock size={10} />
                    Planned
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
