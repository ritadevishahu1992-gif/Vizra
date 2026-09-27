import React, { useState } from 'react';
import { Info, Sparkles, X, ChevronRight } from 'lucide-react';

interface DemoBannerProps {
  onOpenSettings?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onOpenSettings }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-neutral-950 border-b border-neutral-900 px-4 py-1.5 flex items-center justify-between text-[11px] select-none text-neutral-400">
      <div className="flex items-center gap-2 max-w-2xl">
        <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
        <span className="font-semibold text-neutral-200">Omnia 1.0 Demo Mode:</span>
        <span className="truncate">
          Interactive multimodal workspace preview. Live production architecture with pluggable backend endpoints.
        </span>
      </div>

      <div className="flex items-center gap-3">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>Settings</span>
            <ChevronRight size={12} />
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          title="Dismiss banner"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
