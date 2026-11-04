import React from 'react';
import { AIMode } from '../../../types/ai';
import { EngageContentItem, EngageCoarseIntent } from '../../../types/engage';
import { AmbientVisualizer } from './AmbientVisualizer';
import { KnowledgeCard } from './KnowledgeCard';
import { CreativeTipCard } from './CreativeTipCard';
import { InteractiveExperience } from './InteractiveExperience';
import { PartnerPresentationPlaceholder } from './PartnerPresentationPlaceholder';

interface EngageRendererProps {
  item: EngageContentItem;
  mode: AIMode;
  coarseIntent?: EngageCoarseIntent;
  prefersReducedMotion?: boolean;
  enablePartnerPlaceholderDemo?: boolean;
  onInteract?: () => void;
}

export const EngageRenderer: React.FC<EngageRendererProps> = React.memo(
  ({
    item,
    mode,
    coarseIntent,
    prefersReducedMotion = false,
    enablePartnerPlaceholderDemo = false,
    onInteract,
  }) => {
    switch (item.type) {
      case 'visualization':
        return (
          <AmbientVisualizer
            item={item}
            mode={mode}
            coarseIntent={coarseIntent}
            prefersReducedMotion={prefersReducedMotion}
          />
        );

      case 'knowledge_card':
        return <KnowledgeCard item={item} />;

      case 'creative_tip':
      case 'announcement':
        return <CreativeTipCard item={item} />;

      case 'mini_experience':
        return (
          <InteractiveExperience
            key={item.id}
            item={item}
            onInteract={onInteract}
          />
        );

      case 'partner_placeholder':
      case 'sponsored_card':
      case 'affiliate_card':
        return (
          <PartnerPresentationPlaceholder
            item={item}
            enabled={enablePartnerPlaceholderDemo}
          />
        );

      default:
        return <KnowledgeCard item={item} />;
    }
  }
);
EngageRenderer.displayName = 'EngageRenderer';
