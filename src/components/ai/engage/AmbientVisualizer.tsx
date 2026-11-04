import React, { useId } from 'react';
import { AIMode } from '../../../types/ai';
import { EngageContentItem, EngageCoarseIntent } from '../../../types/engage';

interface AmbientVisualizerProps {
  item: EngageContentItem;
  mode: AIMode;
  coarseIntent?: EngageCoarseIntent;
  prefersReducedMotion?: boolean;
}

const MODE_LABELS: Record<AIMode, { stage: string; nodes: [string, string, string] }> = {
  quick: {
    stage: 'Low-Latency Stream Routing',
    nodes: ['Intent Parse', 'Fast Context', 'Token Emit'],
  },
  think: {
    stage: 'Multi-Step Chain Synthesis',
    nodes: ['Deconstruct', 'Verify Logic', 'Synthesize'],
  },
  research: {
    stage: 'Epistemic Grounding Gate',
    nodes: ['Retrieve', 'Cross-Check', 'Cite Sources'],
  },
  create: {
    stage: 'Creative Direction Matrix',
    nodes: ['Concept', 'Structure', 'Craft'],
  },
  code: {
    stage: 'AST & Architecture Synthesis',
    nodes: ['Type Graph', 'Pattern Match', 'Code Gen'],
  },
  analyze: {
    stage: 'Structured Data Decomposition',
    nodes: ['Extract', 'Correlate', 'Summarize'],
  },
  science: {
    stage: 'Scientific Literature & Structure Gate',
    nodes: ['Pathway Map', 'Validation', 'Evidence'],
  },
};

export const AmbientVisualizer: React.FC<AmbientVisualizerProps> = React.memo(
  ({ item, mode, prefersReducedMotion = false }) => {
    const rawId = useId();
    const gradientId = `vizra-neural-edge-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const meta = MODE_LABELS[mode] || MODE_LABELS.quick;

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4">
        {/* Neural / Particle SVG Canvas */}
        <div
          className="w-full sm:w-36 h-24 rounded-xl bg-neutral-900/90 border border-neutral-800/90 flex items-center justify-center shrink-0 relative overflow-hidden"
          aria-hidden="true"
        >
          <svg viewBox="0 0 144 88" className="w-full h-full">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#eb3b2d" stopOpacity="0.75" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#eb3b2d" stopOpacity="0.75" />
              </linearGradient>
            </defs>

            {/* Subtle background grid lines */}
            <line x1="0" y1="22" x2="144" y2="22" stroke="#262626" strokeWidth="0.5" />
            <line x1="0" y1="44" x2="144" y2="44" stroke="#262626" strokeWidth="0.5" />
            <line x1="0" y1="66" x2="144" y2="66" stroke="#262626" strokeWidth="0.5" />

            {/* Neural topology edges */}
            <line
              x1="24"
              y1="24"
              x2="72"
              y2="44"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.25"
            />
            <line
              x1="24"
              y1="64"
              x2="72"
              y2="44"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.25"
            />
            <line
              x1="72"
              y1="44"
              x2="120"
              y2="26"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.25"
            />
            <line
              x1="72"
              y1="44"
              x2="120"
              y2="62"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.25"
            />
            <line
              x1="24"
              y1="24"
              x2="120"
              y2="26"
              stroke="#404040"
              strokeWidth="0.75"
              strokeDasharray="2 3"
            />
            <line
              x1="24"
              y1="64"
              x2="120"
              y2="62"
              stroke="#404040"
              strokeWidth="0.75"
              strokeDasharray="2 3"
            />

            {/* Input Layer Nodes */}
            <circle cx="24" cy="24" r="4" fill="#eb3b2d" />
            <circle cx="24" cy="64" r="4" fill="#eb3b2d" />

            {/* Central Synthesis Core */}
            {!prefersReducedMotion && (
              <circle
                cx="72"
                cy="44"
                r="11"
                fill="none"
                stroke="#eb3b2d"
                strokeWidth="1"
                strokeOpacity="0.4"
                className="animate-ping"
              />
            )}
            <circle
              cx="72"
              cy="44"
              r="6"
              fill="#ffffff"
              className={prefersReducedMotion ? '' : 'animate-pulse'}
            />

            {/* Output Layer Nodes */}
            <circle cx="120" cy="26" r="3.5" fill="#d4d4d4" />
            <circle cx="120" cy="62" r="3.5" fill="#d4d4d4" />
          </svg>

          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-neutral-400">
            <span className="truncate">{meta.nodes[0]}</span>
            <span className="text-white truncate px-1">{meta.nodes[1]}</span>
            <span className="truncate">{meta.nodes[2]}</span>
          </div>
        </div>

        {/* Narrative Description */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#eb3b2d]">
              {item.subtitle || meta.stage}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug break-words">
            {item.title}
          </h4>
          <p className="text-xs text-neutral-300 leading-relaxed break-words">
            {item.body}
          </p>
          {item.takeaway && (
            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] shrink-0" />
              <span className="break-words">{item.takeaway}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
AmbientVisualizer.displayName = 'AmbientVisualizer';
