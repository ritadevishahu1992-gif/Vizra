import fs from 'fs';
import path from 'path';
import {
  PUBLIC_INDEXABLE_ROUTES,
  PRIVATE_OR_UTILITY_ROUTES,
  resolveRouteSeoPayload,
  injectSeoIntoHtml,
} from '../src/seo/routeMetadata';
import { ensurePublicOgImageExists } from '../src/server/seo/ogImageGenerator';

/**
 * Post-build static route HTML pre-renderer for Vercel CDN.
 *
 * Generates `dist/<route>/index.html` for all public indexable routes (with
 * self-referencing canonicals, `index, follow`, and AdSense head script) and all utility/private/diagnostic
 * routes (with `noindex, nofollow` and strict AdSense exclusion) so Vercel's static CDN serves accurate
 * route-level metadata on initial HTTP fetch before JavaScript hydration.
 */
function prerenderStaticRoutes() {
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');

  const publicOgPath = ensurePublicOgImageExists(rootDir);
  if (fs.existsSync(distDir)) {
    const distOgPath = path.join(distDir, 'og-image.png');
    if (!fs.existsSync(distOgPath)) {
      fs.copyFileSync(publicOgPath, distOgPath);
    }
  }

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

  console.log(
    `[Prerender] Generated route-specific static HTML for ${generatedCount} routes in dist/ (${PUBLIC_INDEXABLE_ROUTES.length} indexable + ${PRIVATE_OR_UTILITY_ROUTES.length} noindex utility/diagnostic).`
  );
}

prerenderStaticRoutes();
