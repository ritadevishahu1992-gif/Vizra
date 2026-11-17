export type DocSectionGroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type FeatureAvailabilityStatus =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'UNAVAILABLE'
  | 'COMING SOON';

export type DocDiagramId =
  | 'platform-overview'
  | 'user-journey'
  | 'omnia-interaction'
  | 'creative-workflow'
  | 'guide-prompt-cycle'
  | 'responsible-grounding';

export interface DocCodeExample {
  title: string;
  language?: string;
  content: string;
}

export interface DocTableBlock {
  headers: string[];
  rows: string[][];
}

export interface DocCallout {
  variant: 'info' | 'warning' | 'limitation' | 'tip';
  title: string;
  body: string;
}

export interface DocContentBlock {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
  table?: DocTableBlock;
  example?: DocCodeExample;
  callout?: DocCallout;
}

export interface DocRelatedLink {
  label: string;
  to: string;
  description?: string;
}

export interface DocArticle {
  slug: string;
  code: string;
  sectionId: DocSectionGroupId;
  sectionTitle: string;
  title: string;
  summary: string;
  status?: FeatureAvailabilityStatus;
  statusNote?: string;
  diagramId?: DocDiagramId;
  blocks: DocContentBlock[];
  relatedLinks?: DocRelatedLink[];
}

export interface DocSectionGroup {
  id: DocSectionGroupId;
  letter: string;
  title: string;
  subtitle: string;
  description: string;
}
