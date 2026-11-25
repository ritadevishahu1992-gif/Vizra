export type BlogBlock =
  | {
      type: 'paragraph';
      text: string;
    }
  | {
      type: 'math';
      latex: string;
      caption?: string;
    }
  | {
      type: 'list';
      ordered?: boolean;
      items: string[];
    }
  | {
      type: 'table';
      caption?: string;
      headers: string[];
      rows: string[][];
    }
  | {
      type: 'callout';
      title: string;
      text: string;
      variant?: 'note' | 'verification';
    }
  | {
      type: 'code';
      language: string;
      code: string;
      caption?: string;
    }
  | {
      type: 'image';
      src: string;
      alt: string;
      caption?: string;
      width?: number;
      height?: number;
    };

export interface BlogSection {
  id: string;
  heading: string;
  level: 2 | 3;
  blocks: BlogBlock[];
}

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogSource {
  id: number;
  title: string;
  authors?: string;
  venue?: string;
  date?: string;
  url: string;
  verificationNote?: string;
}

export interface BlogInternalLink {
  label: string;
  href: string;
  description: string;
}

export interface BlogPost {
  number: number;
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  /** Publication visibility; omitted defaults to 'published'. Drafts are strictly excluded from public & agent indexes. */
  status?: 'published' | 'draft';
  category: string;
  series: string;
  author: string;
  authorRole: string;
  readTimeMinutes: number;
  primaryKeyword: string;
  secondaryKeywords: string[];
  featuredImage: string;
  featuredImageAlt: string;
  featuredImageCaption: string;
  keyTakeaways: string[];
  sections: BlogSection[];
  faqs: BlogFaqItem[];
  sources: BlogSource[];
  relatedSlugs: string[];
  internalLinks: BlogInternalLink[];
  /** Plain-text paragraph summary kept for backwards compatibility with SEO/prerender consumers */
  body: string[];
}
