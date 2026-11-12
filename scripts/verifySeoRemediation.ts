import fs from 'fs';
import path from 'path';
import http from 'http';
import {
  PUBLIC_INDEXABLE_ROUTES,
  REDIRECT_ALIASES,
  resolveRouteSeoPayload,
} from '../src/seo/routeMetadata';
import { ensurePublicOgImageExists } from '../src/server/seo/ogImageGenerator';

interface CheckResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];

function record(category: string, name: string, passed: boolean, details: string) {
  results.push({ category, name, passed, details });
  const icon = passed ? '✓' : '✗';
  console.log(`  ${icon} [${passed ? 'PASS' : 'FAIL'}] (${category}) ${name} — ${details}`);
}

function httpGet(
  urlPath: string,
  userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://127.0.0.1:3000${urlPath}`,
      {
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': userAgent,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${urlPath}`));
    });
    req.end();
  });
}

async function runVerification() {
  console.log('======================================================================');
  console.log('   VIZRA — GOOGLE SEARCH CRAWLING & INDEXING VERIFICATION SUITE       ');
  console.log('======================================================================\n');

  const rootDir = process.cwd();

  // 1. Verify robots.txt (File + HTTP endpoint)
  const expectedRobots = `User-agent: *\nAllow: /\n\nSitemap: https://vizra.vercel.app/sitemap.xml\n`;
  const robotsFileContent = fs
    .readFileSync(path.join(rootDir, 'public/robots.txt'), 'utf-8')
    .replace(/\r\n/g, '\n');
  const robotsHttp = await httpGet('/robots.txt');
  const robotsBody = robotsHttp.body.toString('utf-8').replace(/\r\n/g, '\n');
  const hasDisallow = /Disallow:/i.test(robotsBody);

  record(
    'Robots.txt',
    'public/robots.txt & GET /robots.txt match intended default configuration with zero Disallow rules',
    robotsHttp.status === 200 &&
      String(robotsHttp.headers['content-type']).includes('text/plain') &&
      robotsFileContent.trim() === expectedRobots.trim() &&
      robotsBody.trim() === expectedRobots.trim() &&
      !hasDisallow,
    `Status=${robotsHttp.status} | Content-Type=${robotsHttp.headers['content-type']} | Disallow rules=${hasDisallow ? 'PRESENT' : 'NONE'}`
  );

  // 2. Ensure & Verify public/og-image.png (1200x630 PNG)
  const ogPath = ensurePublicOgImageExists(rootDir);
  const ogBuf = fs.readFileSync(ogPath);
  const isPngSig =
    ogBuf[0] === 0x89 &&
    ogBuf[1] === 0x50 &&
    ogBuf[2] === 0x4e &&
    ogBuf[3] === 0x47;
  const pngWidth = ogBuf.readUInt32BE(16);
  const pngHeight = ogBuf.readUInt32BE(20);
  record(
    'Open Graph Image',
    'public/og-image.png exists with exact 1200x630 PNG dimensions',
    isPngSig && pngWidth === 1200 && pngHeight === 630,
    `Signature valid=${isPngSig}, Dimensions=${pngWidth}x${pngHeight}, Size=${ogBuf.length} bytes`
  );

  const ogHttp = await httpGet('/og-image.png');
  record(
    'Open Graph Image',
    'GET /og-image.png returns HTTP 200 and Content-Type: image/png',
    ogHttp.status === 200 && String(ogHttp.headers['content-type']).includes('image/png'),
    `Status=${ogHttp.status}, Content-Type=${ogHttp.headers['content-type']}, Bytes=${ogHttp.body.length}`
  );

  // 3. Verify all 16 Public Indexable Routes (HTTP 200, index/follow, canonical, OG, Twitter, JSON-LD, no noindex)
  for (const route of PUBLIC_INDEXABLE_ROUTES) {
    const res = await httpGet(route);
    const html = res.body.toString('utf-8');
    const expected = resolveRouteSeoPayload(route);

    const titleMatches = html.match(/<title[^>]*>([\s\S]*?)<\/title>/gi) || [];
    const descMatches = html.match(/<meta\s+name="description"/gi) || [];
    const canonicalMatches = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/gi) || [];
    const ogImageMatches = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/gi) || [];
    const twitterCardMatches = html.match(/<meta\s+name="twitter:card"/gi) || [];
    const jsonLdMatches =
      html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];

    const xRobots = String(res.headers['x-robots-tag'] || '');
    const hasExactCanonical = html.includes(`href="${expected.canonicalUrl}"`);
    const hasIndexFollowMeta = html.includes('<meta name="robots" content="index, follow" />');
    const hasNoNoindex = !/noindex/i.test(html) && !/noindex/i.test(xRobots);
    const hasNoAriaHiddenMain = !/<main[^>]*aria-hidden="true"/i.test(html);

    let jsonLdValid = false;
    if (jsonLdMatches.length === 1) {
      const inner = jsonLdMatches[0]
        .replace(/^<script[^>]*>/i, '')
        .replace(/<\/script>$/i, '');
      try {
        const parsed = JSON.parse(inner);
        jsonLdValid = Boolean(parsed);
      } catch {
        jsonLdValid = false;
      }
    }

    const ok =
      res.status === 200 &&
      xRobots === 'index, follow' &&
      hasIndexFollowMeta &&
      hasNoNoindex &&
      titleMatches.length === 1 &&
      descMatches.length === 1 &&
      canonicalMatches.length === 1 &&
      ogImageMatches.length === 1 &&
      twitterCardMatches.length === 1 &&
      hasExactCanonical &&
      hasNoAriaHiddenMain &&
      jsonLdValid;

    record(
      'Public Indexable Route (Googlebot)',
      `GET ${route} initial HTML & headers`,
      ok,
      `HTTP ${res.status} | X-Robots-Tag: "${xRobots}" | Canonical: ${expected.canonicalUrl} | No noindex=${hasNoNoindex} | JSON-LD valid=${jsonLdValid}`
    );
  }

  // 4. Verify Permanent 301 Redirects for All 6 Alias Routes (including query string preservation)
  for (const [alias, target] of Object.entries(REDIRECT_ALIASES)) {
    const res = await httpGet(alias);
    const locationHeader = String(res.headers['location'] || '');
    const xRobots = String(res.headers['x-robots-tag'] || '');
    const ok = res.status === 301 && locationHeader === target && !/noindex/i.test(xRobots);
    record(
      'Alias Redirect (301)',
      `GET ${alias} -> ${target}`,
      ok,
      `HTTP ${res.status} | Location: "${locationHeader}" | X-Robots-Tag: "${xRobots || 'none'}"`
    );
  }

  const queryRedirectRes = await httpGet('/roadmap?section=roadmap');
  record(
    'Alias Redirect (Query Preservation)',
    'GET /roadmap?section=roadmap -> /studio?section=roadmap',
    queryRedirectRes.status === 301 &&
      queryRedirectRes.headers['location'] === '/studio?section=roadmap',
    `HTTP ${queryRedirectRes.status} | Location: "${queryRedirectRes.headers['location']}"`
  );

  // 5. Verify Unknown 404 Routes (HTTP 404, noindex/nofollow, NO canonical tag)
  for (const unknownPath of ['/non-existent-route-xyz', '/random-404-check']) {
    const res = await httpGet(unknownPath);
    const html = res.body.toString('utf-8');
    const xRobots = String(res.headers['x-robots-tag'] || '');
    const hasMetaNoindex = html.includes('<meta name="robots" content="noindex, nofollow" />');
    const hasCanonical = /<link\s+rel="canonical"/i.test(html);

    const ok =
      res.status === 404 &&
      xRobots === 'noindex, nofollow' &&
      hasMetaNoindex &&
      !hasCanonical;

    record(
      '404 Status & Soft-404 Prevention',
      `GET ${unknownPath} returns HTTP 404 without canonical`,
      ok,
      `HTTP ${res.status} | X-Robots-Tag: "${xRobots}" | meta noindex=${hasMetaNoindex} | canonical present=${hasCanonical}`
    );
  }

  // 6. Verify Sitemap Completeness & Hygiene
  const sitemapRes = await httpGet('/sitemap.xml');
  const sitemapXml = sitemapRes.body.toString('utf-8');
  const sitemapLocs = (sitemapXml.match(/<loc>(.*?)<\/loc>/g) || []).map((m) =>
    m.replace(/<\/?loc>/g, '').trim()
  );
  const allPublicRoutesInSitemap = PUBLIC_INDEXABLE_ROUTES.every((route) => {
    const fullUrl = `https://vizra.vercel.app${route === '/' ? '/' : route}`;
    return sitemapLocs.includes(fullUrl);
  });

  record(
    'Sitemap Verification',
    '/sitemap.xml contains all 16 canonical indexable public URLs',
    sitemapRes.status === 200 &&
      String(sitemapRes.headers['content-type']).includes('application/xml') &&
      sitemapLocs.length === PUBLIC_INDEXABLE_ROUTES.length &&
      allPublicRoutesInSitemap,
    `HTTP ${sitemapRes.status} | Content-Type=${sitemapRes.headers['content-type']} | Total URLs=${sitemapLocs.length}/${PUBLIC_INDEXABLE_ROUTES.length} | All public routes present=${allPublicRoutesInSitemap}`
  );

  // 7. Verify Pre-Rendered Static Route Files in dist/ (for Vercel CDN)
  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    let distPrerenderValid = true;
    for (const route of PUBLIC_INDEXABLE_ROUTES) {
      const targetHtmlPath =
        route === '/'
          ? path.join(distDir, 'index.html')
          : path.join(distDir, route.replace(/^\/+/, ''), 'index.html');
      if (!fs.existsSync(targetHtmlPath)) {
        distPrerenderValid = false;
        break;
      }
      const distHtml = fs.readFileSync(targetHtmlPath, 'utf-8');
      const expected = resolveRouteSeoPayload(route);
      if (
        !distHtml.includes(`href="${expected.canonicalUrl}"`) ||
        !distHtml.includes('<meta name="robots" content="index, follow" />')
      ) {
        distPrerenderValid = false;
        break;
      }
    }
    record(
      'Vercel Static Build Prerender',
      'All 16 public routes have pre-rendered dist/<route>/index.html with self-referencing canonicals',
      distPrerenderValid,
      `Verified ${PUBLIC_INDEXABLE_ROUTES.length} static route HTML files in dist/`
    );
  }

  const failed = results.filter((r) => !r.passed);
  console.log('\n======================================================================');
  console.log(
    `   CRAWLING & INDEXING VERIFICATION SUMMARY: ${results.length - failed.length}/${
      results.length
    } PASSED`
  );
  console.log('======================================================================\n');

  if (failed.length > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification suite error:', err);
  process.exit(1);
});
