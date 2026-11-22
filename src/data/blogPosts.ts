import type { BlogPost } from './blog/types';
import { article01 } from './blog/article01';
import { article02 } from './blog/article02';
import { article03 } from './blog/article03';
import { article04 } from './blog/article04';
import { article05 } from './blog/article05';
import { article06 } from './blog/article06';
import { article07 } from './blog/article07';
import { article08 } from './blog/article08';
import { article09 } from './blog/article09';
import { article10 } from './blog/article10';

export type {
  BlogPost,
  BlogSection,
  BlogBlock,
  BlogFaqItem,
  BlogSource,
  BlogInternalLink,
} from './blog/types';

/**
 * Published Batch 1 (AI Foundations, Articles 01–10) editorial monographs
 * for /blog and /blog/:slug.
 */
export const BLOG_POSTS: BlogPost[] = [
  article01,
  article02,
  article03,
  article04,
  article05,
  article06,
  article07,
  article08,
  article09,
  article10,
];

export function getPublishedBlogPost(slug?: string): BlogPost | undefined {
  if (!slug) return undefined;
  return BLOG_POSTS.find((post) => post.slug === slug);
}
