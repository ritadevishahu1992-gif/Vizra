import fs from 'fs';
import path from 'path';
import { getPublishedBlogPosts, type BlogPost } from '../../data/blogPosts';
import {
  SITE_ORIGIN,
  ROUTE_DEFINITIONS,
  PRIVATE_OR_UTILITY_ROUTES,
  REDIRECT_ALIASES,
  resolveRouteSeoPayload,
} from '../../seo/routeMetadata';

const SITEMAP_XMLNS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const MAX_URLS_PER_SITEMAP = 45_000; // Protocol hard limit: 50,000
const MAX_BYTES_PER_SITEMAP = 45 * 1024 * 1024; // Protocol hard limit: 50 MB

export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
}

export interface SitemapChildRecord {
  fileName: string;
  publicPath: string;
  loc: string;
  lastmod?: string;
  urlCount: number;
  xml: string;
}

export interface SitemapBundle {
  indexXml: string;
  children: SitemapChildRecord[];
  stats: {
    totalPublicPages: number;
    totalBlogHubs: number;
    totalPublishedArticles: number;
    totalSitemapUrls: number;
    childSitemapCount: number;
  };
}

/**
 * Verified real last-modification dates for static pages that carry an explicit,
 * factual revision date in the codebase. Pages without an authoritative tracked
 * modification date intentionally omit <lastmod> rather than fabricating dates.
 */
const VERIFIED_STATIC_PAGE_LASTMOD: Readonly<Record<string, string>> = {
  '/about': '2026-11-27', // Updated with The People Behind VIZRA founder profiles
  '/terms-and-conditions': '2026-11-18', // Policy v2026-11 effective update
  '/privacy-policy': '2026-11-18', // Policy v2026-11 effective update
  '/cookie-policy': '2026-11-18', // Policy v2026-11 effective update
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeIsoDate(raw?: string): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = Date.parse(`${trimmed}T00:00:00Z`);
    if (!Number.isNaN(parsed)) return trimmed;
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString().slice(0, 10);
}

function getLatestDate(dates: (string | undefined)[]): string | undefined {
  const valid = dates
    .map((d) => normalizeIsoDate(d))
    .filter((d): d is string => Boolean(d))
    .sort();
  return valid.length > 0 ? valid[valid.length - 1] : undefined;
}

function toCanonicalUrl(routePath: string): string {
  const clean = routePath === '/' ? '/' : `/${routePath.replace(/^\/+|\/+$/g, '')}`;
  return `${SITE_ORIGIN}${clean}`;
}

function isExcludedRoute(routePath: string): boolean {
  const clean = routePath === '/' ? '/' : `/${routePath.replace(/^\/+|\/+$/g, '')}`;
  if ((PRIVATE_OR_UTILITY_ROUTES as readonly string[]).includes(clean)) return true;
  if (Object.prototype.hasOwnProperty.call(REDIRECT_ALIASES, clean)) return true;
  if (clean.startsWith('/api/') || clean === '/live') return true;
  return false;
}

function renderUrlSetXml(entries: SitemapUrlEntry[]): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${SITEMAP_XMLNS}">`,
  ];

  for (const entry of entries) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);
    if (entry.lastmod) {
      lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
    }
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}

function renderSitemapIndexXml(children: SitemapChildRecord[]): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<sitemapindex xmlns="${SITEMAP_XMLNS}">`,
  ];

  for (const child of children) {
    lines.push('  <sitemap>');
    lines.push(`    <loc>${escapeXml(child.loc)}</loc>`);
    if (child.lastmod) {
      lines.push(`    <lastmod>${escapeXml(child.lastmod)}</lastmod>`);
    }
    lines.push('  </sitemap>');
  }

  lines.push('</sitemapindex>');
  return `${lines.join('\n')}\n`;
}

function chunkSitemapEntries(
  baseName: string,
  entries: SitemapUrlEntry[]
): SitemapChildRecord[] {
  const chunks: SitemapUrlEntry[][] = [];
  let current: SitemapUrlEntry[] = [];
  let currentByteEstimate = 128;

  for (const entry of entries) {
    const entryBytes =
      48 + entry.loc.length + (entry.lastmod ? 28 + entry.lastmod.length : 0);
    if (
      current.length > 0 &&
      (current.length >= MAX_URLS_PER_SITEMAP ||
        currentByteEstimate + entryBytes > MAX_BYTES_PER_SITEMAP)
    ) {
      chunks.push(current);
      current = [];
      currentByteEstimate = 128;
    }
    current.push(entry);
    currentByteEstimate += entryBytes;
  }

  if (current.length > 0 || chunks.length === 0) {
    chunks.push(current);
  }

  return chunks.map((chunkEntries, idx) => {
    const fileName =
      chunks.length === 1 ? `${baseName}.xml` : `${baseName}-${idx + 1}.xml`;
    const publicPath = `/sitemaps/${fileName}`;
    return {
      fileName,
      publicPath,
      loc: `${SITE_ORIGIN}${publicPath}`,
      lastmod: getLatestDate(chunkEntries.map((e) => e.lastmod)),
      urlCount: chunkEntries.length,
      xml: renderUrlSetXml(chunkEntries),
    };
  });
}

function collectArticleEntries(
  posts: BlogPost[],
  globalSeen: Set<string>,
  validateAgainstRouteRegistry = true
): SitemapUrlEntry[] {
  const entries: SitemapUrlEntry[] = [];
  for (const post of posts) {
    if (!post.slug || post.status === 'draft') continue;
    const cleanSlug = post.slug.replace(/^\/+|\/+$/g, '');
    if (!cleanSlug || cleanSlug.includes('/')) continue;

    const routePath = `/blog/${cleanSlug}`;
    if (isExcludedRoute(routePath)) continue;

    let loc: string;
    if (validateAgainstRouteRegistry) {
      const seo = resolveRouteSeoPayload(routePath);
      if (!seo.isIndexable || seo.httpStatus !== 200 || !seo.canonicalUrl) {
        continue;
      }
      loc = seo.canonicalUrl;
    } else {
      loc = toCanonicalUrl(routePath);
    }

    if (globalSeen.has(loc)) continue;
    globalSeen.add(loc);

    const lastmod = normalizeIsoDate(post.updatedAt || post.publishedAt);
    entries.push(lastmod ? { loc, lastmod } : { loc });
  }
  return entries;
}

/**
 * Dynamically builds the complete VIZRA XML sitemap index and child sitemaps
 * directly from the authoritative route metadata and published article catalog.
 */
export function buildSitemapBundle(
  overridePosts?: BlogPost[]
): SitemapBundle {
  const globalSeen = new Set<string>();
  const publishedPosts = (overridePosts ?? getPublishedBlogPosts()).filter(
    (p) => p.status !== 'draft'
  );

  // 1. Core public pages (/sitemaps/pages.xml)
  const pageEntries: SitemapUrlEntry[] = [];
  for (const [routePath, def] of Object.entries(ROUTE_DEFINITIONS)) {
    // Dedicated to /sitemaps/blogs.xml and /sitemaps/articles.xml
    if (routePath === '/blog' || routePath.startsWith('/blog/')) continue;
    if (isExcludedRoute(routePath)) continue;
    if (!def.isIndexable || def.robots !== 'index, follow') continue;

    const seo = resolveRouteSeoPayload(routePath);
    if (!seo.isIndexable || seo.httpStatus !== 200 || !seo.canonicalUrl) {
      continue;
    }

    const loc = seo.canonicalUrl;
    if (globalSeen.has(loc)) continue;
    globalSeen.add(loc);

    const lastmod = normalizeIsoDate(VERIFIED_STATIC_PAGE_LASTMOD[routePath]);
    pageEntries.push(lastmod ? { loc, lastmod } : { loc });
  }

  // 2. Published blog hub(s) (/sitemaps/blogs.xml)
  const blogEntries: SitemapUrlEntry[] = [];
  const blogHubSeo = resolveRouteSeoPayload('/blog');
  if (
    blogHubSeo.isIndexable &&
    blogHubSeo.httpStatus === 200 &&
    blogHubSeo.canonicalUrl &&
    !globalSeen.has(blogHubSeo.canonicalUrl)
  ) {
    globalSeen.add(blogHubSeo.canonicalUrl);
    const latestArticleMod = getLatestDate(
      publishedPosts.map((p) => p.updatedAt || p.publishedAt)
    );
    blogEntries.push(
      latestArticleMod
        ? { loc: blogHubSeo.canonicalUrl, lastmod: latestArticleMod }
        : { loc: blogHubSeo.canonicalUrl }
    );
  }

  // 3. Individual published articles (/sitemaps/articles.xml, auto-split at 45k URLs / 45MB)
  const articleEntries = collectArticleEntries(
    publishedPosts,
    globalSeen,
    !overridePosts
  );

  const children: SitemapChildRecord[] = [
    ...chunkSitemapEntries('pages', pageEntries),
    ...chunkSitemapEntries('blogs', blogEntries),
    ...chunkSitemapEntries('articles', articleEntries),
  ];

  const indexXml = renderSitemapIndexXml(children);

  return {
    indexXml,
    children,
    stats: {
      totalPublicPages: pageEntries.length,
      totalBlogHubs: blogEntries.length,
      totalPublishedArticles: articleEntries.length,
      totalSitemapUrls:
        pageEntries.length + blogEntries.length + articleEntries.length,
      childSitemapCount: children.length,
    },
  };
}

/**
 * Resolves `/sitemap.xml` or `/sitemaps/<name>.xml` dynamically at runtime.
 */
export function getSitemapXmlByPath(requestPath: string): string | null {
  const clean = requestPath.split('?')[0].replace(/\/+$/, '') || '/';
  const bundle = buildSitemapBundle();

  if (clean === '/sitemap.xml') {
    return bundle.indexXml;
  }

  const matchedChild = bundle.children.find((c) => c.publicPath === clean);
  return matchedChild ? matchedChild.xml : null;
}

/**
 * Writes `/sitemap.xml` and `/sitemaps/*.xml` to `public/` (and optionally `dist/`),
 * removing any obsolete child sitemap files from previous builds.
 */
export function writePublicSitemaps(
  rootDir: string,
  distDir?: string
): SitemapBundle {
  const bundle = buildSitemapBundle();
  const targetDirs = [path.resolve(rootDir, 'public')];
  if (distDir && fs.existsSync(distDir)) {
    targetDirs.push(path.resolve(distDir));
  }

  const expectedChildNames = new Set(bundle.children.map((c) => c.fileName));

  for (const baseDir of targetDirs) {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    fs.writeFileSync(path.join(baseDir, 'sitemap.xml'), bundle.indexXml, 'utf-8');

    const childDir = path.join(baseDir, 'sitemaps');
    if (!fs.existsSync(childDir)) {
      fs.mkdirSync(childDir, { recursive: true });
    }

    // Remove stale child sitemaps that are no longer emitted
    for (const existing of fs.readdirSync(childDir)) {
      if (existing.endsWith('.xml') && !expectedChildNames.has(existing)) {
        fs.unlinkSync(path.join(childDir, existing));
      }
    }

    for (const child of bundle.children) {
      fs.writeFileSync(path.join(childDir, child.fileName), child.xml, 'utf-8');
    }
  }

  return bundle;
}

export { toCanonicalUrl };
