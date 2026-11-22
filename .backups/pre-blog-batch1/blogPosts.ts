export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  author: string;
  readTimeMinutes: number;
  body: string[];
}

/**
 * Published editorial articles for /blog and /blog/:slug.
 * Kept empty until verified articles are authored and approved for publication.
 */
export const BLOG_POSTS: BlogPost[] = [];

export function getPublishedBlogPost(slug?: string): BlogPost | undefined {
  if (!slug) return undefined;
  return BLOG_POSTS.find((post) => post.slug === slug);
}
