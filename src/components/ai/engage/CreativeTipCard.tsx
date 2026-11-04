import React from 'react';
import { Lightbulb, Sparkles, Command } from 'lucide-react';
import { EngageContentItem } from '../../../types/engage';

interface CreativeTipCardProps {
  item: EngageContentItem;
}

export const CreativeTipCard: React.FC<CreativeTipCardProps> = React.memo(({ item }) => {
  const isAnnouncement = item.type === 'announcement';

  return (
    <div className="flex items-start gap-3 sm:gap-3.5">
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        {isAnnouncement ? (
          <Sparkles size={18} className="text-[#eb3b2d]" />
        ) : (
          <Lightbulb size={18} className="text-[#eb3b2d]" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        {item.subtitle && (
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            {item.subtitle}
          </div>
        )}
        <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug break-words">
          {item.title}
        </h4>
        <p className="text-xs text-neutral-300 leading-relaxed break-words">
          {item.body}
        </p>

        {item.shortcutKeys && item.shortcutKeys.length > 0 && (
          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400">
              <Command size={11} className="text-[#eb3b2d]" />
              <span>Shortcut:</span>
            </span>
            {item.shortcutKeys.map((key, idx) => (
              <kbd
                key={`${item.id}-key-${key}-${idx}`}
                className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-200 bg-neutral-900 border border-neutral-700 rounded"
              >
                {key}
              </kbd>
            ))}
          </div>
        )}

        {item.takeaway && (
          <div className="text-[11px] font-mono text-neutral-400 pt-0.5 break-words">
            {item.takeaway}
          </div>
        )}
      </div>
    </div>
  );
});
CreativeTipCard.displayName = 'CreativeTipCard';
