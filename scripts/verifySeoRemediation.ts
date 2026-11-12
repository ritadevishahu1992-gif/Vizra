import fs from 'fs';
import path from 'path';
import http from 'http';
import {
  PUBLIC_INDEXABLE_ROUTES,
  PRIVATE_OR_UTILITY_ROUTES,
  REDIRECT_ALIASES,
  ROUTE_DEFINITIONS,
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
  console.log('   VIZRA — PHASE 2 METADATA, SITEMAP & INDEXING VERIFICATION SUITE    ');
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
    'public/robots.txt & GET /robots.txt allow Googlebot across all routes with Sitemap declared',
    robotsHttp.status === 200 &&
      String(robotsHttp.headers['content-type']).includes('text/plain') &&
      robotsFileContent.trim() === expectedRobots.trim() &&
      robotsBody.trim() === expectedRobots.trim() &&
      !hasDisallow,
    `Status=${robotsHttp.status} | Content-Type=${robotsHttp.headers['content-type']} | Disallow=${hasDisallow ? 'PRESENT' : 'NONE'}`
  );

  // 2. Verify Uniqueness of Titles, Descriptions, and Canonicals across all 12 Public Routes
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const canonicals = new Set<string>();
  for (const route of PUBLIC_INDEXABLE_ROUTES) {
    const def = ROUTE_DEFINITIONS[route];
    titles.add(def.title);
    descriptions.add(def.description);
    canonicals.add(def.canonicalPath);
  }
  record(
    'Metadata Uniqueness',
    'All 12 public indexable routes have 100% unique titles, descriptions, and canonical paths',
    titles.size === PUBLIC_INDEXABLE_ROUTES.length &&
      descriptions.size === PUBLIC_INDEXABLE_ROUTES.length &&
      canonicals.size === PUBLIC_INDEXABLE_ROUTES.length,
    `Unique titles=${titles.size}/12 | Unique descriptions=${descriptions.size}/12 | Unique canonicals=${canonicals.size}/12`
  );

  // 3. Ensure & Verify public/og-image.png (1200x630 PNG)
  const ogPath = ensurePublicOgImageExists(rootDir);
  const ogBuf = fs.readFileSync(ogPath);
  const isPngSig =
    ogBuf[0] === 0x89 &&
    ogBuf[1] === 0x50 &&
    ogBuf[2] === 0x4e &&
    ogBuf[3] === 0x47;
  const pngWidth = ogBuf.readUInt32BE(16);
  const pngHeight = ogBuf.readUInt32BE(20);
  const ogHttp = await httpGet('/og-image.png');
  record(
    'Open Graph Asset',
    'GET /og-image.png returns HTTP 200 and valid 1200x630 PNG',
    ogHttp.status === 200 &&
      String(ogHttp.headers['content-type']).includes('image/png') &&
      isPngSig &&
      pngWidth === 1200 &&
      pngHeight === 630,
    `Status=${ogHttp.status}, Dimensions=${pngWidth}x${pngHeight}, Size=${ogBuf.length} bytes`
  );

  // 4. Verify all 12 Public Indexable Routes (HTTP 200, index/follow, canonical, OG, Twitter, JSON-LD, no duplicate tags)
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
      'Public Indexable Route',
      `GET ${route} initial HTML & headers`,
      ok,
      `HTTP ${res.status} | X-Robots-Tag: "${xRobots}" | Canonical: ${expected.canonicalUrl} | JSON-LD=${jsonLdValid}`
    );
  }

  // 5. Verify 5 Utility, User-Specific & Private Diagnostic Routes (HTTP 200, noindex/nofollow, X-Robots-Tag: noindex, nofollow)
  for (const route of PRIVATE_OR_UTILITY_ROUTES) {
    const res = await httpGet(route);
    const html = res.body.toString('utf-8');
    const xRobots = String(res.headers['x-robots-tag'] || '');
    const hasMetaNoindex = html.includes('<meta name="robots" content="noindex, nofollow" />');
    const jsonLdMatches =
      html.match(/<script[^>]*type="application\/ld\+json"/gi) || [];

    const ok =
      res.status === 200 &&
      xRobots === 'noindex, nofollow' &&
      hasMetaNoindex &&
      jsonLdMatches.length === 0;

    record(
      'Utility / Diagnostic Route (noindex)',
      `GET ${route} enforces noindex, nofollow & X-Robots-Tag`,
      ok,
      `HTTP ${res.status} | X-Robots-Tag: "${xRobots}" | meta noindex=${hasMetaNoindex}`
    );
  }

  // 6. Verify Permanent 301 Redirects for All 6 Alias Routes (including query string preservation)
  for (const [alias, target] of Object.entries(REDIRECT_ALIASES)) {
    const res = await httpGet(alias);
    const locationHeader = String(res.headers['location'] || '');
    const ok = res.status === 301 && locationHeader === target;
    record(
      'Alias Redirect (301)',
      `GET ${alias} -> ${target}`,
      ok,
      `HTTP ${res.status} | Location: "${locationHeader}"`
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

  // 7. Verify Unknown 404 Routes (HTTP 404, noindex/nofollow, NO canonical tag)
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
      `HTTP ${res.status} | X-Robots-Tag: "${xRobots}" | meta noindex=${hasMetaNoindex} | canonical=${hasCanonical}`
    );
  }

  // 8. Verify Sitemap Completeness & Hygiene (Strictly 12 Canonical Public Indexable Pages)
  const sitemapRes = await httpGet('/sitemap.xml');
  const sitemapXml = sitemapRes.body.toString('utf-8');
  const sitemapLocs = (sitemapXml.match(/<loc>(.*?)<\/loc>/g) || []).map((m) =>
    m.replace(/<\/?loc>/g, '').trim()
  );
  const allPublicRoutesInSitemap = PUBLIC_INDEXABLE_ROUTES.every((route) => {
    const fullUrl = `https://vizra.vercel.app${route === '/' ? '/' : route}`;
    return sitemapLocs.includes(fullUrl);
  });
  const excludesNonIndexable = PRIVATE_OR_UTILITY_ROUTES.every(
    (route) => !sitemapLocs.includes(`https://vizra.vercel.app${route}`)
  );
  const excludesAliases = Object.keys(REDIRECT_ALIASES).every(
    (alias) => !sitemapLocs.includes(`https://vizra.vercel.app${alias}`)
  );

  record(
    'Sitemap Hygiene & Coverage',
    '/sitemap.xml contains strictly the 12 canonical indexable public URLs and excludes utility/private/alias URLs',
    sitemapRes.status === 200 &&
      String(sitemapRes.headers['content-type']).includes('application/xml') &&
      sitemapLocs.length === 12 &&
      allPublicRoutesInSitemap &&
      excludesNonIndexable &&
      excludesAliases,
    `HTTP ${sitemapRes.status} | Total URLs=${sitemapLocs.length}/12 | Public present=${allPublicRoutesInSitemap} | Excludes utility/private=${excludesNonIndexable} | Excludes aliases=${excludesAliases}`
  );

  // 9. Verify Internal Link Discoverability & Navigation Hygiene
  const navbarCode = fs.readFileSync(path.join(rootDir, 'src/components/Navbar.tsx'), 'utf-8');
  const footerCode = fs.readFileSync(path.join(rootDir, 'src/components/Footer.tsx'), 'utf-8');
  const landingCode = fs.readFileSync(path.join(rootDir, 'src/pages/LandingPage.tsx'), 'utf-8');
  const combinedPublicNav = `${navbarCode}\n${footerCode}\n${landingCode}`;

  const allPublicReachable = PUBLIC_INDEXABLE_ROUTES.every((route) =>
    combinedPublicNav.includes(`"${route}"`) || combinedPublicNav.includes(`'${route}'`)
  );
  const noPrivateInPublicNav =
    !navbarCode.includes('/seo-diagnostics') &&
    !navbarCode.includes("'/workspace'") &&
    !footerCode.includes("'/seo-diagnostics'") &&
    !footerCode.includes("'/workspace'") &&
    !footerCode.includes("'/history'") &&
    !footerCode.includes("'/settings'");

  record(
    'Internal Linking & Navigation Hygiene',
    'All 12 public routes are reachable via Navbar/Footer/LandingPage and private/user routes are not exposed in public navigation',
    allPublicReachable && noPrivateInPublicNav,
    `All 12 public routes linked=${allPublicReachable} | Private/user routes excluded from Navbar/Footer=${noPrivateInPublicNav}`
  );

  // 10. Verify Pre-Rendered Static Route Files in dist/
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
      'All 12 public routes have pre-rendered dist/<route>/index.html with self-referencing canonicals',
      distPrerenderValid,
      `Verified ${PUBLIC_INDEXABLE_ROUTES.length} static public route HTML files in dist/`
    );
  }

  const failed = results.filter((r) => !r.passed);
  console.log('\n======================================================================');
  console.log(
    `   PHASE 2 VERIFICATION SUMMARY: ${results.length - failed.length}/${
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
