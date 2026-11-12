import fs from 'fs';
import path from 'path';
import {
  PUBLIC_INDEXABLE_ROUTES,
  resolveRouteSeoPayload,
  injectSeoIntoHtml,
} from '../src/seo/routeMetadata';
import { ensurePublicOgImageExists } from '../src/server/seo/ogImageGenerator';

/**
 * Post-build static route HTML pre-renderer for Vercel CDN.
 *
 * Because Vercel serves static Vite builds from `dist/`, a single `dist/index.html`
 * with `<link rel="canonical" href="https://vizra.vercel.app/" />` causes every
 * sub-route (`/features`, `/tools`, `/studio`, `/ai`, etc.) to serve the homepage's
 * canonical tag and title on initial HTTP fetch before JavaScript hydration.
 *
 * This script generates `dist/<route>/index.html` for every public VIZRA route
 * with route-specific `<title>`, `<meta name="description">`, `<meta name="robots" content="index, follow">`,
 * self-referencing `<link rel="canonical" href="https://vizra.vercel.app/<route>">`,
 * OpenGraph/Twitter tags, JSON-LD, and accessible pre-hydration `<main>` content.
 */
function prerenderStaticRoutes() {
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');

  // Ensure public/og-image.png exists and copy it to dist/og-image.png if needed
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
  const routesToPrerender = [...PUBLIC_INDEXABLE_ROUTES, '/seo-diagnostics'];

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
    `[Prerender] Generated route-specific static HTML with self-referencing canonicals for ${generatedCount} routes in dist/.`
  );
}

prerenderStaticRoutes();
