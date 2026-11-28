import fs from 'fs';
import path from 'path';
import {
  PUBLIC_INDEXABLE_ROUTES,
  PRIVATE_OR_UTILITY_ROUTES,
  resolveRouteSeoPayload,
  injectSeoIntoHtml,
} from '../src/seo/routeMetadata';
import { ensurePublicOgImageExists } from '../src/server/seo/ogImageGenerator';
import {
  BRAND_STATIC_ASSET_FILES,
  ensurePublicBrandAssets,
} from '../src/server/seo/brandAssetsGenerator';
import { writePublicSitemaps } from '../src/server/seo/sitemapGenerator';

/**
 * Post-build static route HTML pre-renderer for Edge CDN.
 *
 * Generates `dist/<route>/index.html` for all public indexable routes (with
 * self-referencing canonicals, `index, follow`, and AdSense head script) and all utility/private/diagnostic
 * routes (with `noindex, nofollow` and strict AdSense exclusion) so static CDN serves accurate
 * route-level metadata on initial HTTP fetch before JavaScript hydration.
 */
function prerenderStaticRoutes() {
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');

  const publicOgPath = ensurePublicOgImageExists(rootDir, { force: true });
  ensurePublicBrandAssets(rootDir, { force: true });
  const sitemapBundle = writePublicSitemaps(
    rootDir,
    fs.existsSync(distDir) ? distDir : undefined
  );

  if (fs.existsSync(distDir)) {
    fs.copyFileSync(publicOgPath, path.join(distDir, 'og-image.png'));
    for (const asset of BRAND_STATIC_ASSET_FILES) {
      const srcPath = path.resolve(rootDir, 'public', asset.fileName);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(distDir, asset.fileName));
      }
    }
  }

  console.log(
    `[Sitemap] Generated /sitemap.xml index + ${sitemapBundle.stats.childSitemapCount} child sitemaps (${sitemapBundle.stats.totalSitemapUrls} canonical URLs).`
  );

  if (!fs.existsSync(distIndexPath)) {
    console.warn('[Prerender] dist/index.html not found; skipping static route pre-rendering.');
    return;
  }

  const baseHtml = fs.readFileSync(distIndexPath, 'utf-8');
  const routesToPrerender = [...PUBLIC_INDEXABLE_ROUTES, ...PRIVATE_OR_UTILITY_ROUTES];

  let generatedCount = 0;
  for (const route of routesToPrerender) {
    const payload = resolveRouteSeoPayload(route);
    const routeHtml = injectSeoIntoHtml(baseHtml, payload);

    if (route === '/') {
      fs.writeFileSync(distIndexPath, routeHtml, 'utf-8');
      generatedCount++;
      continue;
    }

    const cleanSegment = route.replace(/^\/+/, '');
    const routeDir = path.join(distDir, cleanSegment);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), routeHtml, 'utf-8');
    generatedCount++;
  }

  // Generate dedicated static 404.html with noindex, nofollow for edge CDN 404 responses
  const notFoundPayload = resolveRouteSeoPayload('/__404__');
  const notFoundHtml = injectSeoIntoHtml(baseHtml, notFoundPayload);
  fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtml, 'utf-8');

  console.log(
    `[Prerender] Generated route-specific static HTML for ${generatedCount} routes + 404.html in dist/ (${PUBLIC_INDEXABLE_ROUTES.length} indexable + ${PRIVATE_OR_UTILITY_ROUTES.length} noindex utility/diagnostic).`
  );
}

prerenderStaticRoutes();
