import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { EngageContentItem } from '../../../types/engage';

interface KnowledgeCardProps {
  item: EngageContentItem;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = React.memo(({ item }) => {
  return (
    <div className="flex items-start gap-3 sm:gap-3.5">
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <BookOpen size={18} className="text-[#eb3b2d]" />
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

        {item.takeaway && (
          <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800/90 flex items-center gap-2 text-[11px] text-neutral-300">
            <ShieldCheck size={13} className="text-[#eb3b2d] shrink-0" />
            <span className="break-words">{item.takeaway}</span>
          </div>
        )}
      </div>
    </div>
  );
});
KnowledgeCard.displayName = 'KnowledgeCard';
