import React, { useState } from 'react';
import {
  X,
  FileText,
  Palette,
  Layout,
  Video,
  Code,
  Presentation,
  Search,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Layers,
} from 'lucide-react';
import { AIMode } from '../../types/ai';

export interface CreateHubCategory {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  status: 'available' | 'coming_soon';
  mode: AIMode;
  promptTemplate: string;
}

export const createHubCategories: CreateHubCategory[] = [
  {
    id: 'write',
    name: 'WRITE',
    tagline: 'Narrative & Scriptwriting',
    description: 'Cinematic video scripts, storyboards, product briefs, and editorial articles.',
    icon: FileText,
    status: 'available',
    mode: 'create',
    promptTemplate: 'Write a compelling script for a 30-second motion graphic reel about obsidian minimalism.',
  },
  {
    id: 'design',
    name: 'DESIGN',
    tagline: 'Visual Systems & Tokens',
    description: 'Design systems, high-contrast dark mode palettes, kinetic typography scales, and UI layouts.',
    icon: Palette,
    status: 'available',
    mode: 'create',
    promptTemplate: 'Design a clean dark-mode visual identity system with high-contrast crimson accents.',
  },
  {
    id: 'image',
    name: 'IMAGE',
    tagline: 'Diffusion Prompts & Concepts',
    description: 'Craft diffusion prompts, texture map concepts, composition framing, and lighting coordinates.',
    icon: Layout,
    status: 'available',
    mode: 'create',
    promptTemplate: 'Generate an obsidian aesthetic image concept with fluid crimson refractive ribbons.',
  },
  {
    id: 'video',
    name: 'VIDEO',
    tagline: 'Temporal Motion Synthesis',
    description: 'Scene segmentation, kinetic physics, and multi-track video timeline synthesis.',
    icon: Video,
    status: 'coming_soon',
    mode: 'create',
    promptTemplate: 'Render temporal motion scenes.',
  },
  {
    id: 'code',
    name: 'CODE',
    tagline: 'Interactive Engineering',
    description: 'React, TypeScript, WebGL shaders, Tailwind components, and procedural canvas animations.',
    icon: Code,
    status: 'available',
    mode: 'code',
    promptTemplate: 'Write a 60fps kinetic typography ribbon canvas component in React and TypeScript.',
  },
  {
    id: 'presentation',
    name: 'PRESENTATION',
    tagline: 'Pitch Decks & Outlines',
    description: 'Structured keynote slides, executive summaries, data callouts, and presentation outlines.',
    icon: Presentation,
    status: 'available',
    mode: 'create',
    promptTemplate: 'Create a 6-slide presentation outline for our AI creative workspace product launch.',
  },
  {
    id: 'research',
    name: 'RESEARCH',
    tagline: 'Grounded Fact Verification',
    description: 'Live real-time search with authenticated citations, unbiased fact analysis, and source verification.',
    icon: Search,
    status: 'available',
    mode: 'research',
    promptTemplate: 'Research recent breakthroughs in solid-state battery energy density with verified sources.',
  },
  {
    id: 'analyze',
    name: 'ANALYZE',
    tagline: 'Multimodal Inspection',
    description: 'Inspect uploaded designs, benchmark code performance, parse data tables, and extract insights.',
    icon: Sliders,
    status: 'available',
    mode: 'analyze',
    promptTemplate: 'Analyze this architecture and identify areas to streamline performance and reduce latency.',
  },
];

interface CreateHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: CreateHubCategory) => void;
}

export const CreateHubModal: React.FC<CreateHubModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const [comingSoonNotice, setComingSoonNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (cat: CreateHubCategory) => {
    if (cat.status === 'coming_soon') {
      setComingSoonNotice(`${cat.name} engine is currently in staging and coming in an upcoming release.`);
      setTimeout(() => setComingSoonNotice(null), 3000);
      return;
    }
    onSelectCategory(cat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-900 bg-neutral-900/30 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span className="text-[11px] font-mono text-[#eb3b2d] uppercase tracking-wider">
                Create Hub
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              One intelligence. Many ways to create.
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-1">
              Choose a creative discipline. Every workflow flows directly through Omnia 1.0.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Close Create Hub"
          >
            <X size={18} />
          </button>
        </div>

        {/* Temporary Notice */}
        {comingSoonNotice && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>{comingSoonNotice}</span>
            </div>
            <span className="text-[10px] font-mono text-[#eb3b2d] uppercase">Coming Soon</span>
          </div>
        )}

        {/* Grid of 8 Categories */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {createHubCategories.map((cat) => {
            const Icon = cat.icon;
            const isComingSoon = cat.status === 'coming_soon';

            return (
              <div
                key={cat.id}
                onClick={() => handleSelect(cat)}
                className={`p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between group cursor-pointer ${
                  isComingSoon ? 'opacity-70 hover:opacity-90' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white group-hover:text-[#eb3b2d] transition-colors">
                      <Icon size={16} />
                    </div>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                        isComingSoon
                          ? 'bg-[#eb3b2d]/10 text-[#eb3b2d] border border-[#eb3b2d]/30'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {isComingSoon ? 'Coming Soon' : 'Active'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-[#eb3b2d] transition-colors mb-0.5">
                    {cat.name}
                  </h3>
                  <div className="text-[11px] font-mono text-neutral-400 mb-2">{cat.tagline}</div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{cat.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-900/80 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <span>{isComingSoon ? 'In Staging' : 'Launch Omnia'}</span>
                  {isComingSoon ? (
                    <Clock size={12} className="text-[#eb3b2d]" />
                  ) : (
                    <ArrowUpRight size={13} className="text-neutral-400 group-hover:text-white" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-900 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-500">
          <span className="font-mono">Omnia 1.0 Creative Engine</span>
          <span className="text-neutral-400">All creations remain editable and exportable.</span>
        </div>
      </div>
    </div>
  );
};
