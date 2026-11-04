import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { EngageContentItem } from '../../../types/engage';

interface PartnerPresentationPlaceholderProps {
  item?: EngageContentItem;
  /**
   * Phase 2 Mandate:
   * Must remain disabled or hidden by default in Phase 2 unless explicitly
   * rendered with neutral internal demo metadata.
   * Never displays fabricated partner names, logos, offers, or sponsorship claims.
   */
  enabled?: boolean;
}

export const PartnerPresentationPlaceholder: React.FC<
  PartnerPresentationPlaceholderProps
> = React.memo(({ item, enabled = false }) => {
  if (!enabled) {
    return null;
  }

  return (
    <div
      className="flex items-start gap-3 sm:gap-3.5 p-3 rounded-xl bg-neutral-900/50 border border-dashed border-neutral-800"
      aria-label="Neutral Partner Presentation Slot Structure"
    >
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <ShieldCheck size={18} className="text-neutral-400" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
            Internal Presentation Slot
          </span>
        </div>
        <h4 className="text-xs font-semibold text-neutral-200 break-words">
          {item?.title || 'Future Approved Partner Presentation Slot'}
        </h4>
        <p className="text-[11px] text-neutral-400 leading-relaxed break-words">
          {item?.body ||
            'Neutral structural container reserved for future governance-verified partner cards. Inactive during Phase 2.'}
        </p>
      </div>
    </div>
  );
});
PartnerPresentationPlaceholder.displayName = 'PartnerPresentationPlaceholder';
