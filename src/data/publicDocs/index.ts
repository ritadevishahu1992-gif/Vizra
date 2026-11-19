import { DocArticle, DocSectionGroup, DocSectionGroupId } from './types';
import { INTRO_AND_PLATFORM_DOCS } from './sectionsIntroAndPlatform';
import { FEATURES_AND_OMNIA_DOCS } from './sectionsFeaturesAndOmnia';
import { GUIDES_TRUST_TECH_DOCS } from './sectionsGuidesTrustTech';

export const DOC_SECTION_GROUPS: DocSectionGroup[] = [
  {
    id: 'A',
    letter: 'A',
    title: 'Introduction',
    subtitle: 'Topics 01–08',
    description:
      'What VIZRA is, product philosophy, adult studio eligibility, getting started, and core terminology.',
  },
  {
    id: 'B',
    letter: 'B',
    title: 'Understanding the Platform',
    subtitle: 'Topics 09–15',
    description:
      'Platform architecture, how OMNIA assists users, workflows, workspace navigation, UI, and devices.',
  },
  {
    id: 'C',
    letter: 'C',
    title: 'Features & Tools',
    subtitle: '17 Feature Guides',
    description:
      'Dedicated how-to references, inputs, outputs, limits, and transparent status labels for every verified tool.',
  },
  {
    id: 'D',
    letter: 'D',
    title: 'OMNIA Documentation',
    subtitle: 'Topics 16–22',
    description:
      'Deep guide to OMNIA 1.0, prompting habits, working with results, external sources, and AI boundaries.',
  },
  {
    id: 'E',
    letter: 'E',
    title: 'User Guides',
    subtitle: 'Topics 23–29',
    description:
      'Step-by-step walkthroughs for first-time creators, chat, creative tools, settings, and workflows.',
  },
  {
    id: 'F',
    letter: 'F',
    title: 'Security, Privacy & Trust',
    subtitle: 'Topics 30–36',
    description:
      'Security controls, data minimization, responsible AI rules, user duties, data rights, and reporting.',
  },
  {
    id: 'G',
    letter: 'G',
    title: 'Troubleshooting',
    subtitle: 'Topics 37–43',
    description:
      'Fixing AI output issues, loading hiccups, browser quirks, account questions, FAQs, and support.',
  },
  {
    id: 'H',
    letter: 'H',
    title: 'Technical Information',
    subtitle: 'Topics 44–49',
    description:
      'Compatibility matrix, browser requirements, live availability table, limitations, and version history.',
  },
];

export const ALL_DOC_ARTICLES: DocArticle[] = [
  ...INTRO_AND_PLATFORM_DOCS,
  ...FEATURES_AND_OMNIA_DOCS,
  ...GUIDES_TRUST_TECH_DOCS,
];

export const LEGACY_SECTION_REDIRECTS: Record<string, string> = {
  overview: 'what-is-vizra',
  routing: 'understanding-omnia',
  workflows: 'feature-project-workflows',
  security: 'security-overview',
};

export function getArticlesBySection(sectionId: DocSectionGroupId): DocArticle[] {
  return ALL_DOC_ARTICLES.filter((a) => a.sectionId === sectionId);
}

export function findDocArticleBySlug(rawSlug: string | null): DocArticle | null {
  if (!rawSlug) return null;
  const normalized = rawSlug.trim().toLowerCase();
  const resolvedSlug = LEGACY_SECTION_REDIRECTS[normalized] || normalized;
  return ALL_DOC_ARTICLES.find((a) => a.slug === resolvedSlug) || null;
}

export function getAdjacentArticles(slug: string): {
  prev: DocArticle | null;
  next: DocArticle | null;
} {
  const index = ALL_DOC_ARTICLES.findIndex((a) => a.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? ALL_DOC_ARTICLES[index - 1] : null,
    next: index < ALL_DOC_ARTICLES.length - 1 ? ALL_DOC_ARTICLES[index + 1] : null,
  };
}
