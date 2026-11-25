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
import { article11 } from './blog/article11';
import { article12 } from './blog/article12';
import { article13 } from './blog/article13';
import { article14 } from './blog/article14';
import { article15 } from './blog/article15';
import { article16 } from './blog/article16';
import { article17 } from './blog/article17';
import { article18 } from './blog/article18';
import { article19 } from './blog/article19';
import { article20 } from './blog/article20';

export type {
  BlogPost,
  BlogSection,
  BlogBlock,
  BlogFaqItem,
  BlogSource,
  BlogInternalLink,
} from './blog/types';

/**
 * Published VIZRA Blog editorial monographs:
 * - Batch 1: AI Foundations (Articles 01–10)
 * - Batch 2: Machine Learning and Advanced AI (Articles 11–20)
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
  article11,
  article12,
  article13,
  article14,
  article15,
  article16,
  article17,
  article18,
  article19,
  article20,
];

export function isBlogPostPublished(post: BlogPost): boolean {
  return post.status !== 'draft';
}

export function getPublishedBlogPosts(): BlogPost[] {
  return BLOG_POSTS.filter(isBlogPostPublished);
}

export function getPublishedBlogPost(slug?: string): BlogPost | undefined {
  if (!slug) return undefined;
  return BLOG_POSTS.find((post) => post.slug === slug && isBlogPostPublished(post));
}
