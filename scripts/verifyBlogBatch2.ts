import fs from 'fs';
import path from 'path';
import katex from 'katex';
import { BLOG_POSTS, getPublishedBlogPost } from '../src/data/blogPosts';
import {
  PUBLIC_INDEXABLE_ROUTES,
  resolveRouteSeoPayload,
} from '../src/seo/routeMetadata';

function extractInlineMath(text: string): string[] {
  const matches: string[] = [];
  const regex = /(?<!\\)\$([^$\n]+?)(?<!\\)\$/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

function extractCitations(text: string): number[] {
  const ids: number[] = [];
  const regex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    for (const part of m[1].split(',')) {
      const n = Number(part.trim());
      if (Number.isFinite(n) && n > 0) ids.push(n);
    }
  }
  return ids;
}

function main() {
  const rootDir = process.cwd();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (BLOG_POSTS.length !== 20) {
    errors.push(`Expected 20 published articles (Batch 1 + Batch 2), found ${BLOG_POSTS.length}`);
  }

  const seenSlugs = new Set<string>();
  const seenSeoTitles = new Set<string>();
  const seenDescriptions = new Set<string>();
  const articlesSitemapPath = path.join(rootDir, 'public/sitemaps/articles.xml');
  const sitemapXml = fs.readFileSync(
    fs.existsSync(articlesSitemapPath)
      ? articlesSitemapPath
      : path.join(rootDir, 'public/sitemap.xml'),
    'utf-8'
  );

  let totalWords = 0;
  let batch2Words = 0;
  let totalDisplayMath = 0;
  let batch2DisplayMath = 0;
  let totalInlineMath = 0;
  let totalTables = 0;
  let batch2Tables = 0;
  let totalInlineImages = 0;
  let batch2InlineImages = 0;
  let totalFaqs = 0;
  let batch2Faqs = 0;
  let totalSources = 0;
  let batch2Sources = 0;

  for (let idx = 0; idx < BLOG_POSTS.length; idx++) {
    const post = BLOG_POSTS[idx];
    const isBatch2 = post.number >= 11;
    const tag = `Article ${String(post.number).padStart(2, '0')} (${post.slug})`;

    if (post.number !== idx + 1) {
      errors.push(`${tag}: Expected sequential number ${idx + 1}, got ${post.number}`);
    }

    // 1. Unique slug, SEO title, description
    if (seenSlugs.has(post.slug)) errors.push(`${tag}: Duplicate slug`);
    seenSlugs.add(post.slug);

    if (seenSeoTitles.has(post.seoTitle))
      errors.push(`${tag}: Duplicate SEO title`);
    seenSeoTitles.add(post.seoTitle);

    if (seenDescriptions.has(post.description))
      errors.push(`${tag}: Duplicate meta description`);
    seenDescriptions.add(post.description);

    if (post.slug.includes('/')) {
      errors.push(`${tag}: Slug contains slash`);
    }

    // 2. Lookup & SEO route metadata
    if (!getPublishedBlogPost(post.slug)) {
      errors.push(`${tag}: getPublishedBlogPost failed`);
    }
    const expectedRoute = `/blog/${post.slug}`;
    if (!PUBLIC_INDEXABLE_ROUTES.includes(expectedRoute)) {
      errors.push(`${tag}: Missing from PUBLIC_INDEXABLE_ROUTES`);
    }
    if (!sitemapXml.includes(`https://vizra.vercel.app${expectedRoute}`)) {
      errors.push(`${tag}: Missing from public/sitemap.xml`);
    }

    const seo = resolveRouteSeoPayload(expectedRoute);
    if (seo.httpStatus !== 200 || !seo.isIndexable) {
      errors.push(`${tag}: SEO payload not 200/indexable`);
    }
    if (seo.canonicalUrl !== `https://vizra.vercel.app${expectedRoute}`) {
      errors.push(`${tag}: Bad canonicalUrl ${seo.canonicalUrl}`);
    }
    if (!seo.ogImage?.includes(`/images/blog/${post.slug}.jpg`)) {
      errors.push(`${tag}: Bad ogImage ${seo.ogImage}`);
    }

    // 3. Featured image exists on disk
    const imgPath = path.join(rootDir, 'public', post.featuredImage);
    if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size < 10_000) {
      errors.push(`${tag}: Missing or tiny featured image at ${imgPath}`);
    }

    // 4. Sources validation
    const sourceIds = new Set<number>();
    totalSources += post.sources.length;
    if (isBatch2) batch2Sources += post.sources.length;
    if (post.sources.length < 15) {
      errors.push(`${tag}: Too few sources (${post.sources.length})`);
    }
    for (const src of post.sources) {
      if (sourceIds.has(src.id)) {
        errors.push(`${tag}: Duplicate source id [${src.id}]`);
      }
      sourceIds.add(src.id);
      if (!src.url.startsWith('https://')) {
        errors.push(`${tag}: Source [${src.id}] non-HTTPS URL: ${src.url}`);
      }
      if (/\s/.test(src.url)) {
        errors.push(`${tag}: Source [${src.id}] URL contains whitespace: ${src.url}`);
      }
    }

    // 5. Related slugs resolve to published posts
    for (const relSlug of post.relatedSlugs) {
      if (!getPublishedBlogPost(relSlug)) {
        errors.push(`${tag}: Related slug "${relSlug}" does not match any published post`);
      }
    }

    // 6. Collect all prose strings for defect, math, image, and citation checks
    const textEntries: { loc: string; text: string }[] = [
      { loc: 'excerpt', text: post.excerpt },
      ...post.keyTakeaways.map((t, i) => ({ loc: `takeaway[${i}]`, text: t })),
      ...post.faqs.map((f, i) => ({ loc: `faq[${i}].q`, text: f.question })),
      ...post.faqs.map((f, i) => ({ loc: `faq[${i}].a`, text: f.answer })),
    ];

    totalFaqs += post.faqs.length;
    if (isBatch2) batch2Faqs += post.faqs.length;
    if (post.faqs.length !== 8) {
      warnings.push(`${tag}: Expected 8 FAQs, found ${post.faqs.length}`);
    }

    let artWords = 0;
    let artMath = 0;
    let artTables = 0;
    let artInlineImages = 0;

    for (const sec of post.sections) {
      for (let bi = 0; bi < sec.blocks.length; bi++) {
        const b = sec.blocks[bi];
        if (b.type === 'paragraph') {
          artWords += b.text.split(/\s+/).length;
          textEntries.push({ loc: `${sec.id}.p[${bi}]`, text: b.text });
        } else if (b.type === 'list') {
          for (let li = 0; li < b.items.length; li++) {
            artWords += b.items[li].split(/\s+/).length;
            textEntries.push({ loc: `${sec.id}.li[${bi}.${li}]`, text: b.items[li] });
          }
        } else if (b.type === 'callout') {
          artWords += b.text.split(/\s+/).length;
          textEntries.push({ loc: `${sec.id}.callout[${bi}]`, text: b.text });
        } else if (b.type === 'image') {
          artInlineImages++;
          totalInlineImages++;
          if (isBatch2) batch2InlineImages++;
          const inlinePath = path.join(rootDir, 'public', b.src);
          if (!fs.existsSync(inlinePath) || fs.statSync(inlinePath).size < 1_000) {
            errors.push(`${tag}: Missing or tiny inline image at ${b.src}`);
          }
          if (!b.alt || b.alt.trim().length < 15) {
            errors.push(`${tag}: Inline image ${b.src} has missing/short alt text`);
          }
        } else if (b.type === 'table') {
          artTables++;
          totalTables++;
          if (isBatch2) batch2Tables++;
          if (b.headers.length < 2 || b.rows.length < 2) {
            errors.push(`${tag}: Malformed table in ${sec.id}`);
          }
          for (let ri = 0; ri < b.rows.length; ri++) {
            if (b.rows[ri].length !== b.headers.length) {
              errors.push(
                `${tag}: Table row length mismatch in ${sec.id} row ${ri} (${b.rows[ri].length} vs ${b.headers.length})`
              );
            }
            for (let ci = 0; ci < b.rows[ri].length; ci++) {
              const cellVal = b.rows[ri][ci];
              if (isBatch2 && (!cellVal || !cellVal.trim())) {
                errors.push(`${tag}: Empty table cell in ${sec.id} [${ri},${ci}]`);
              }
              textEntries.push({
                loc: `${sec.id}.tbl[${bi}][${ri},${ci}]`,
                text: cellVal,
              });
            }
          }
        } else if (b.type === 'math') {
          artMath++;
          totalDisplayMath++;
          if (isBatch2) batch2DisplayMath++;
          try {
            katex.renderToString(b.latex, {
              displayMode: true,
              throwOnError: true,
              strict: false,
            });
          } catch (err) {
            errors.push(
              `${tag}: KaTeX display math error in ${sec.id}: ${b.latex} -> ${(err as Error).message}`
            );
          }
        }
      }
    }

    if (isBatch2 && artInlineImages < 5) {
      errors.push(`${tag}: Expected at least 5 inline diagrams, found ${artInlineImages}`);
    }

    totalWords += artWords;
    if (isBatch2) batch2Words += artWords;

    const defectPatterns: [string, RegExp][] = [
      ['placeholder @@PH', /@@PH\d+@@/],
      ['raw tab char', /\t/],
      ['empty citation bracket', /\[\s*\]/],
      ['PUA glyph', /[\uE000-\uF8FF]/],
      ['kerning Fr om', /\bFr om\b/],
      ['kerning traf fic', /\btraf fic\b/],
      ['kerning of fset', /\bof fset\b/],
      ['ligature confifidence', /confifidence/],
    ];

    for (const { loc, text } of textEntries) {
      for (const [label, regex] of defectPatterns) {
        if (regex.test(text)) {
          errors.push(`${tag} ${loc}: Defect "${label}" matched in "${text.slice(0, 140)}"`);
        }
      }

      // Check inline KaTeX
      const inlineMaths = extractInlineMath(text);
      for (const expr of inlineMaths) {
        totalInlineMath++;
        try {
          katex.renderToString(expr, {
            displayMode: false,
            throwOnError: true,
            strict: false,
          });
        } catch (err) {
          errors.push(
            `${tag} ${loc}: KaTeX inline math error "$${expr}$" -> ${(err as Error).message}`
          );
        }
      }

      // Check inline citations map to existing source IDs
      for (const cid of extractCitations(text)) {
        if (!sourceIds.has(cid)) {
          errors.push(`${tag} ${loc}: Orphan inline citation [${cid}]`);
        }
      }
    }

    // 7. Check prerendered dist/blog/<slug>/index.html if dist exists
    const distHtmlPath = path.join(rootDir, 'dist', 'blog', post.slug, 'index.html');
    if (fs.existsSync(path.join(rootDir, 'dist'))) {
      if (!fs.existsSync(distHtmlPath)) {
        errors.push(`${tag}: Missing prerendered HTML at ${distHtmlPath}`);
      } else {
        const html = fs.readFileSync(distHtmlPath, 'utf-8');
        if (!html.includes(`rel="canonical" href="https://vizra.vercel.app${expectedRoute}"`)) {
          errors.push(`${tag}: Prerendered HTML missing canonical URL`);
        }
        if (!html.includes('"@type":"BlogPosting"')) {
          errors.push(`${tag}: Prerendered HTML missing BlogPosting JSON-LD`);
        }
        if (post.faqs.length > 0 && !html.includes('"@type":"FAQPage"')) {
          errors.push(`${tag}: Prerendered HTML missing FAQPage JSON-LD`);
        }
        if (!html.includes(`/images/blog/${post.slug}.jpg`)) {
          errors.push(`${tag}: Prerendered HTML missing og:image`);
        }
      }
    }

    console.log(
      `✓ Art ${String(post.number).padStart(2, '0')} | ${post.slug.slice(0, 48).padEnd(48)} | words=${String(artWords).padStart(4)} | imgs=${artInlineImages + 1} | tbls=${artTables} | math=${artMath} | faqs=${post.faqs.length} | refs=${post.sources.length}`
    );
  }

  console.log('\n--- BATCH 2 (ARTICLES 11–20) TOTALS ---');
  console.log(
    `Articles: 10/10 | Words: ${batch2Words.toLocaleString()} | Visuals: ${batch2InlineImages + 10} (10 featured + ${batch2InlineImages} diagrams) | Tables: ${batch2Tables} | Display Math: ${batch2DisplayMath} | FAQs: ${batch2Faqs} | Sources: ${batch2Sources}`
  );
  console.log('\n--- FULL BLOG (ARTICLES 01–20) TOTALS ---');
  console.log(
    `Articles: ${BLOG_POSTS.length}/20 | Words: ${totalWords.toLocaleString()} | Inline Diagrams: ${totalInlineImages} | Tables: ${totalTables} | Display Math: ${totalDisplayMath} | Inline Math: ${totalInlineMath} | FAQs: ${totalFaqs} | Sources: ${totalSources}`
  );

  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  ! ${w}`));
  }
  if (errors.length > 0) {
    console.error(`\nFAILED with ${errors.length} error(s):`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log('\nALL BATCH 1 + BATCH 2 VERIFICATION CHECKS PASSED (0 ERRORS).');
}

main();
