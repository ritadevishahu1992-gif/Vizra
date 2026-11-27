import fs from 'fs';
import path from 'path';
import http from 'http';
import {
  PUBLIC_INDEXABLE_ROUTES,
  PRIVATE_OR_UTILITY_ROUTES,
  REDIRECT_ALIASES,
  ROUTE_DEFINITIONS,
  resolveRouteSeoPayload,
  applySeoToDocument,
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

function countTag(html: string, regex: RegExp): number {
  return (html.match(regex) || []).length;
}

function extractMetaContent(
  html: string,
  attrName: 'name' | 'property',
  attrVal: string
): string | null {
  const escaped = attrVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<meta\\s+${attrName}="${escaped}"\\s+content="([^"]*)"`,
    'i'
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

/**
 * Lightweight DOM shim to test client-side applySeoToDocument across forward,
 * private-route, 404, and browser back/forward (popstate) navigations.
 */
function runClientNavigationSimulation(): { passed: boolean; details: string } {
  interface MockElement {
    tagName: string;
    id: string;
    type: string;
    textContent: string;
    attrs: Record<string, string>;
    setAttribute(k: string, v: string): void;
    getAttribute(k: string): string | null;
    remove(): void;
  }

  const headChildren: MockElement[] = [];

  const createMockElement = (tag: string): MockElement => {
    const el: MockElement = {
      tagName: tag.toUpperCase(),
      id: '',
      type: '',
      textContent: '',
      attrs: {},
      setAttribute(k: string, v: string) {
        this.attrs[k] = v;
      },
      getAttribute(k: string) {
        return this.attrs[k] ?? null;
      },
      remove() {
        const idx = headChildren.indexOf(this);
        if (idx !== -1) headChildren.splice(idx, 1);
      },
    };
    return el;
  };

  const mockDocument = {
    title: '',
    createElement: (tag: string) => createMockElement(tag),
    head: {
      appendChild: (el: MockElement) => {
        if (!headChildren.includes(el)) headChildren.push(el);
        return el;
      },
      querySelectorAll: (selector: string): MockElement[] => {
        const metaMatch = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
        if (metaMatch) {
          const [, attr, val] = metaMatch;
          return headChildren.filter(
            (el) => el.tagName === 'META' && el.getAttribute(attr) === val
          );
        }
        if (selector === 'link[rel="canonical"]') {
          return headChildren.filter(
            (el) => el.tagName === 'LINK' && el.getAttribute('rel') === 'canonical'
          );
        }
        if (selector === 'script[type="application/ld+json"]') {
          return headChildren.filter(
            (el) =>
              el.tagName === 'SCRIPT' &&
              (el.type === 'application/ld+json' ||
                el.getAttribute('type') === 'application/ld+json')
          );
        }
        if (selector === 'script') {
          return headChildren.filter((el) => el.tagName === 'SCRIPT');
        }
        return [];
      },
    },
  };

  const prevDoc = (globalThis as any).document;
  (globalThis as any).document = mockDocument;

  try {
    const navSequence = [
      '/',
      '/features',
      '/pricing',
      '/docs',
      '/workspace', // Private route — must strip OG & Twitter tags
      '/explore', // Back to public route — must restore OG & Twitter tags
      '/non-existent-404', // Unknown 404 — must strip canonical, OG & Twitter tags
      '/studio', // Browser back/forward to public route
    ];

    for (const route of navSequence) {
      const payload = resolveRouteSeoPayload(route);
      applySeoToDocument(payload);

      if (mockDocument.title !== payload.title) {
        return {
          passed: false,
          details: `Title mismatch on ${route}: got "${mockDocument.title}"`,
        };
      }

      const ogTitleEls = mockDocument.head.querySelectorAll('meta[property="og:title"]');
      const ogImageEls = mockDocument.head.querySelectorAll('meta[property="og:image"]');
      const twitterCardEls = mockDocument.head.querySelectorAll('meta[name="twitter:card"]');
      const canonicalEls = mockDocument.head.querySelectorAll('link[rel="canonical"]');

      if (payload.includeSocialPreview) {
        if (
          ogTitleEls.length !== 1 ||
          ogImageEls.length !== 1 ||
          twitterCardEls.length !== 1 ||
          canonicalEls.length !== 1
        ) {
          return {
            passed: false,
            details: `Duplicate or missing social/canonical tags after navigating to ${route}`,
          };
        }
        if (
          ogTitleEls[0].getAttribute('content') !== payload.ogTitle ||
          ogImageEls[0].getAttribute('content') !== 'https://vizra.vercel.app/og-image.png' ||
          canonicalEls[0].getAttribute('href') !== payload.canonicalUrl
        ) {
          return {
            passed: false,
            details: `Stale attribute values after navigating to ${route}`,
          };
        }
      } else {
        // Private or 404 route must have 0 OG/Twitter tags in DOM
        if (ogTitleEls.length !== 0 || ogImageEls.length !== 0 || twitterCardEls.length !== 0) {
          return {
            passed: false,
            details: `Social tags were not removed when navigating to non-public route ${route}`,
          };
        }
        if (payload.httpStatus === 404 && canonicalEls.length !== 0) {
          return {
            passed: false,
            details: `Canonical tag was not removed on 404 route ${route}`,
          };
        }
      }
    }

    const adSenseScriptEls = mockDocument.head
      .querySelectorAll('script')
      .filter((el) =>
        (el.getAttribute('src') || '').includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')
      );

    if (adSenseScriptEls.length !== 1) {
      return {
        passed: false,
        details: `Expected strictly 1 AdSense script after client navigation across public routes, found ${adSenseScriptEls.length}`,
      };
    }

    return {
      passed: true,
      details: `Verified 8 sequential client-side & popstate route transitions (/ -> /features -> /pricing -> /docs -> /workspace -> /explore -> /non-existent-404 -> /studio) with 0 duplicates and single AdSense script`,
    };
  } finally {
    (globalThis as any).document = prevDoc;
  }
}

async function runVerification() {
  console.log('======================================================================');
  console.log('   VIZRA — PHASE 3 SOCIAL SEO & METADATA VERIFICATION SUITE           ');
  console.log('======================================================================\n');

  const rootDir = process.cwd();

  // 1. Verify robots.txt (File + HTTP endpoint)
  const robotsFileContent = fs
    .readFileSync(path.join(rootDir, 'public/robots.txt'), 'utf-8')
    .replace(/\r\n/g, '\n');
  const robotsHttp = await httpGet('/robots.txt');
  const robotsBody = robotsHttp.body.toString('utf-8').replace(/\r\n/g, '\n');
  const requiredBotTokens = [
    'User-agent: *',
    'User-agent: Googlebot',
    'User-agent: Google-Extended',
    'User-agent: Bingbot',
    'User-agent: OAI-SearchBot',
    'User-agent: ChatGPT-User',
    'User-agent: GPTBot',
    'User-agent: PerplexityBot',
    'User-agent: Claude-SearchBot',
    'User-agent: ClaudeBot',
    'Allow: /',
    'Allow: /llms.txt',
    'Allow: /llms-full.txt',
    'Allow: /og-image.png',
    'Disallow: /api/',
    'Disallow: /ai',
    'Disallow: /workspace',
    'Disallow: /seo-diagnostics',
    'Sitemap: https://vizra.vercel.app/sitemap.xml',
  ];
  const robotsHasRequiredRules = requiredBotTokens.every(
    (token) => robotsFileContent.includes(token) && robotsBody.includes(token)
  );
  const robotsAllowsRoot = !/^\s*Disallow:\s*\/\s*$/im.test(robotsBody);

  record(
    'Robots.txt',
    'public/robots.txt & GET /robots.txt allow public routes/AI crawlers & protect private/API routes',
    robotsHttp.status === 200 &&
      String(robotsHttp.headers['content-type']).includes('text/plain') &&
      robotsFileContent.trim() === robotsBody.trim() &&
      robotsHasRequiredRules &&
      robotsAllowsRoot,
    `Status=${robotsHttp.status} | Content-Type=${robotsHttp.headers['content-type']} | Required rules=${robotsHasRequiredRules} | Public root allowed=${robotsAllowsRoot}`
  );

  // 1b. Verify public/ads.txt & GET /ads.txt
  const adsFileContent = fs
    .readFileSync(path.join(rootDir, 'public/ads.txt'), 'utf-8')
    .trim();
  const adsHttp = await httpGet('/ads.txt');
  const adsBody = adsHttp.body.toString('utf-8').trim();
  const expectedAdsLine = 'google.com, pub-2808034055890408, DIRECT, f08c47fec0942fa0';

  record(
    'AdSense Ads.txt',
    'public/ads.txt & GET /ads.txt return exact single publisher authorization record with HTTP 200',
    adsHttp.status === 200 &&
      String(adsHttp.headers['content-type']).includes('text/plain') &&
      adsFileContent === expectedAdsLine &&
      adsBody === expectedAdsLine,
    `Status=${adsHttp.status} | Content-Type=${adsHttp.headers['content-type']} | Exact match=${adsBody === expectedAdsLine}`
  );

  // 2. Verify Uniqueness of Titles, Descriptions, and Canonicals across all Public Routes
  const expectedPublicCount = PUBLIC_INDEXABLE_ROUTES.length;
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
    `All ${expectedPublicCount} public indexable routes have 100% unique titles, descriptions, and canonical paths`,
    titles.size === expectedPublicCount &&
      descriptions.size === expectedPublicCount &&
      canonicals.size === expectedPublicCount,
    `Unique titles=${titles.size}/${expectedPublicCount} | Unique descriptions=${descriptions.size}/${expectedPublicCount} | Unique canonicals=${canonicals.size}/${expectedPublicCount}`
  );

  // 3. Verify Social Image Asset (public/og-image.png & GET /og-image.png)
  const ogPath = ensurePublicOgImageExists(rootDir);
  const ogBuf = fs.readFileSync(ogPath);
  const isPngSig =
    ogBuf[0] === 0x89 &&
    ogBuf[1] === 0x50 &&
    ogBuf[2] === 0x4e &&
    ogBuf[3] === 0x47;
  const pngWidth = ogBuf.readUInt32BE(16);
  const pngHeight = ogBuf.readUInt32BE(20);
  const ogHttp = await httpGet(
    '/og-image.png',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
  );
  record(
    'Social Image Asset',
    'GET /og-image.png returns HTTP 200, Content-Type: image/png, and exact 1200x630 dimensions (< 300KB for WhatsApp)',
    ogHttp.status === 200 &&
      String(ogHttp.headers['content-type']).includes('image/png') &&
      isPngSig &&
      pngWidth === 1200 &&
      pngHeight === 630 &&
      ogBuf.length < 300 * 1024,
    `Status=${ogHttp.status} | Content-Type=${ogHttp.headers['content-type']} | Dimensions=${pngWidth}x${pngHeight} | Size=${ogBuf.length} bytes`
  );

  // 4. Verify all 12 Public Indexable Routes (Complete Open Graph + Twitter/X Card + No Duplicates)
  for (const route of PUBLIC_INDEXABLE_ROUTES) {
    const res = await httpGet(
      route,
      'Twitterbot/1.0'
    );
    const html = res.body.toString('utf-8');
    const expected = resolveRouteSeoPayload(route);

    // Check tag counts (must be strictly 1 each — zero duplicates)
    const singleTagCountsOk =
      countTag(html, /<title[^>]*>/gi) === 1 &&
      countTag(html, /<meta\s+name="description"/gi) === 1 &&
      countTag(html, /<link\s+rel="canonical"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:title"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:description"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:type"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:url"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:image"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:image:width"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:image:height"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:image:alt"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:site_name"/gi) === 1 &&
      countTag(html, /<meta\s+property="og:locale"/gi) === 1 &&
      countTag(html, /<meta\s+name="twitter:card"/gi) === 1 &&
      countTag(html, /<meta\s+name="twitter:title"/gi) === 1 &&
      countTag(html, /<meta\s+name="twitter:description"/gi) === 1 &&
      countTag(html, /<meta\s+name="twitter:image"/gi) === 1 &&
      countTag(html, /<meta\s+name="twitter:image:alt"/gi) === 1;

    const ogTitle = extractMetaContent(html, 'property', 'og:title');
    const ogDesc = extractMetaContent(html, 'property', 'og:description');
    const ogType = extractMetaContent(html, 'property', 'og:type');
    const ogUrl = extractMetaContent(html, 'property', 'og:url');
    const ogImage = extractMetaContent(html, 'property', 'og:image');
    const ogWidth = extractMetaContent(html, 'property', 'og:image:width');
    const ogHeight = extractMetaContent(html, 'property', 'og:image:height');
    const ogAlt = extractMetaContent(html, 'property', 'og:image:alt');
    const ogSiteName = extractMetaContent(html, 'property', 'og:site_name');
    const ogLocale = extractMetaContent(html, 'property', 'og:locale');

    const twCard = extractMetaContent(html, 'name', 'twitter:card');
    const twTitle = extractMetaContent(html, 'name', 'twitter:title');
    const twDesc = extractMetaContent(html, 'name', 'twitter:description');
    const twImage = extractMetaContent(html, 'name', 'twitter:image');
    const twAlt = extractMetaContent(html, 'name', 'twitter:image:alt');

    const xRobots = String(res.headers['x-robots-tag'] || '');
    const hasExactCanonical = html.includes(`href="${expected.canonicalUrl}"`);

    const ogValuesOk =
      Boolean(ogTitle && ogTitle.length > 10) &&
      Boolean(ogDesc && ogDesc.length > 30) &&
      (ogType === 'website' || ogType === 'article') &&
      ogUrl === expected.canonicalUrl &&
      ogImage === expected.ogImage &&
      ogWidth === expected.ogImageWidth &&
      ogHeight === expected.ogImageHeight &&
      Boolean(ogAlt && ogAlt.length > 10) &&
      ogSiteName === 'VIZRA' &&
      ogLocale === 'en_US';

    const twitterValuesOk =
      twCard === 'summary_large_image' &&
      twTitle === ogTitle &&
      twDesc === ogDesc &&
      twImage === expected.twitterImage &&
      twAlt === ogAlt;

    const adSenseMatches = countTag(
      html,
      /<script[^>]+pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-2808034055890408/gi
    );

    const ok =
      res.status === 200 &&
      xRobots === 'index, follow' &&
      hasExactCanonical &&
      singleTagCountsOk &&
      ogValuesOk &&
      twitterValuesOk &&
      adSenseMatches === 1;

    record(
      'Public Social SEO & AdSense Route',
      `GET ${route} (OG + Twitter Card + Canonical + Single AdSense)`,
      ok,
      `HTTP ${res.status} | og:type=${ogType} | og:url=${ogUrl} | twitter:card=${twCard} | AdSense=${adSenseMatches}/1 | No duplicate tags=${singleTagCountsOk}`
    );
  }

  // 5. Verify Private / Utility / Diagnostic Routes Privacy & AdSense Isolation
  for (const route of PRIVATE_OR_UTILITY_ROUTES) {
    const res = await httpGet(`${route}?session_token=secret_12345&user=private_user`);
    const html = res.body.toString('utf-8');
    const xRobots = String(res.headers['x-robots-tag'] || '');
    const hasMetaNoindex = html.includes('<meta name="robots" content="noindex, nofollow" />');
    const ogTagCount = countTag(html, /<meta\s+property="og:/gi);
    const twitterTagCount = countTag(html, /<meta\s+name="twitter:/gi);
    const adSenseCount = countTag(html, /adsbygoogle\.js/gi);
    const leaksQueryToken = html.includes('secret_12345') || html.includes('private_user');

    const ok =
      res.status === 200 &&
      xRobots === 'noindex, nofollow' &&
      hasMetaNoindex &&
      ogTagCount === 0 &&
      twitterTagCount === 0 &&
      adSenseCount === 0 &&
      !leaksQueryToken;

    record(
      'Private Route Isolation',
      `GET ${route} excludes public OG/Twitter & AdSense tags and prevents token leakage`,
      ok,
      `HTTP ${res.status} | X-Robots-Tag: "${xRobots}" | OG tags=${ogTagCount} | AdSense=${adSenseCount} | Token leaked=${leaksQueryToken}`
    );
  }

  // 6. Verify Client-Side Navigation & Browser Back/Forward (popstate) Metadata Updates
  const clientSim = runClientNavigationSimulation();
  record(
    'Client Navigation & Popstate Sync',
    'applySeoToDocument updates OG, Twitter, title, description & canonical across client routes without duplicates',
    clientSim.passed,
    clientSim.details
  );

  // 7. Verify Permanent 301 Redirects for All 6 Alias Routes (including query string preservation)
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

  // 8. Verify Unknown 404 Routes (HTTP 404, noindex/nofollow, NO canonical, NO OG/Twitter, NO AdSense)
  for (const unknownPath of ['/non-existent-route-xyz', '/random-404-check', '/blog/nonexistent-post-slug']) {
    const res = await httpGet(unknownPath);
    const html = res.body.toString('utf-8');
    const xRobots = String(res.headers['x-robots-tag'] || '');
    const hasMetaNoindex = html.includes('<meta name="robots" content="noindex, nofollow" />');
    const hasCanonical = /<link\s+rel="canonical"/i.test(html);
    const ogCount = countTag(html, /<meta\s+property="og:/gi);
    const twCount = countTag(html, /<meta\s+name="twitter:/gi);
    const adCount = countTag(html, /adsbygoogle\.js/gi);

    const ok =
      res.status === 404 &&
      xRobots === 'noindex, nofollow' &&
      hasMetaNoindex &&
      !hasCanonical &&
      ogCount === 0 &&
      twCount === 0 &&
      adCount === 0;

    record(
      '404 Status & AdSense/Social Prevention',
      `GET ${unknownPath} returns HTTP 404 without canonical, OG tags, or AdSense`,
      ok,
      `HTTP ${res.status} | X-Robots-Tag: "${xRobots}" | canonical=${hasCanonical} | OG=${ogCount} | AdSense=${adCount}`
    );
  }

  // 9. Verify Sitemap Completeness & Hygiene (Strictly canonical public indexable pages)
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

  record(
    'Sitemap Hygiene & Coverage',
    `/sitemap.xml contains strictly the ${expectedPublicCount} canonical indexable public URLs`,
    sitemapRes.status === 200 &&
      String(sitemapRes.headers['content-type']).includes('application/xml') &&
      sitemapLocs.length === expectedPublicCount &&
      allPublicRoutesInSitemap &&
      excludesNonIndexable,
    `HTTP ${sitemapRes.status} | Total URLs=${sitemapLocs.length}/${expectedPublicCount} | Public present=${allPublicRoutesInSitemap} | Excludes private=${excludesNonIndexable}`
  );

  // 10. Verify Pre-Rendered Static Route Files in dist/ (Initial HTML before hydration on Vercel CDN)
  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    let distPublicValid = true;
    let distPrivateIsolated = true;
    const distAdsTxtOk =
      fs.existsSync(path.join(distDir, 'ads.txt')) &&
      fs.readFileSync(path.join(distDir, 'ads.txt'), 'utf-8').trim() === expectedAdsLine;

    for (const route of PUBLIC_INDEXABLE_ROUTES) {
      const targetHtmlPath =
        route === '/'
          ? path.join(distDir, 'index.html')
          : path.join(distDir, route.replace(/^\/+/, ''), 'index.html');
      if (!fs.existsSync(targetHtmlPath)) {
        distPublicValid = false;
        break;
      }
      const distHtml = fs.readFileSync(targetHtmlPath, 'utf-8');
      const expected = resolveRouteSeoPayload(route);
      if (
        !distHtml.includes(`href="${expected.canonicalUrl}"`) ||
        extractMetaContent(distHtml, 'property', 'og:url') !== expected.canonicalUrl ||
        extractMetaContent(distHtml, 'property', 'og:image') !==
          expected.ogImage ||
        extractMetaContent(distHtml, 'name', 'twitter:card') !== 'summary_large_image' ||
        countTag(distHtml, /adsbygoogle\.js/gi) !== 1
      ) {
        distPublicValid = false;
        break;
      }
    }

    for (const route of PRIVATE_OR_UTILITY_ROUTES) {
      const targetHtmlPath = path.join(distDir, route.replace(/^\/+/, ''), 'index.html');
      if (!fs.existsSync(targetHtmlPath)) {
        distPrivateIsolated = false;
        break;
      }
      const distHtml = fs.readFileSync(targetHtmlPath, 'utf-8');
      if (
        countTag(distHtml, /<meta\s+property="og:/gi) !== 0 ||
        countTag(distHtml, /<meta\s+name="twitter:/gi) !== 0 ||
        countTag(distHtml, /adsbygoogle\.js/gi) !== 0
      ) {
        distPrivateIsolated = false;
        break;
      }
    }

    record(
      'Vercel Static Build Prerender',
      `dist/ static HTML files contain full OG/Twitter + single AdSense for ${expectedPublicCount} public routes, dist/ads.txt intact & zero AdSense/social on 5 private routes`,
      distPublicValid && distPrivateIsolated && distAdsTxtOk,
      `Public dist/ valid=${distPublicValid} | Private dist/ isolated=${distPrivateIsolated} | dist/ads.txt=${distAdsTxtOk}`
    );
  }

  const failed = results.filter((r) => !r.passed);
  console.log('\n======================================================================');
  console.log(
    `   PHASE 3 SOCIAL SEO VERIFICATION SUMMARY: ${results.length - failed.length}/${
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
