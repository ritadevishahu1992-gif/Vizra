import fs from 'fs';
import path from 'path';
import http from 'http';
import {
  PUBLIC_INDEXABLE_ROUTES,
  PRIVATE_OR_UTILITY_ROUTES,
  REDIRECT_ALIASES,
} from '../src/seo/routeMetadata';

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
  userAgent = 'Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)'
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://127.0.0.1:3000${urlPath}`,
      {
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf-8'),
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

function extractReadableBodyText(html: string): string {
  const rootMatch = html.match(/<div[^>]+id=["']root["'][^>]*>([\s\S]*?)<\/div>/i);
  const target = rootMatch ? rootMatch[1] : html;
  return target
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runTests() {
  console.log('======================================================================');
  console.log('   VIZRA — AI CRAWLER ACCESSIBILITY & EXTRACTION VERIFICATION SUITE   ');
  console.log('======================================================================\n');

  const rootDir = process.cwd();

  // 1. Test /llms.txt and /llms-full.txt (HTTP + Content-Type + Plaintext + Accurate Content)
  for (const llmsPath of ['/llms.txt', '/llms-full.txt']) {
    const res = await httpGet(llmsPath, 'ChatGPT-User/1.0');
    const ct = String(res.headers['content-type'] || '');
    const isHtml = /<!doctype|<html|<script|<div/i.test(res.body);
    const hasCoreTerms =
      res.body.includes('VIZRA') &&
      res.body.includes('Omnia 1.0') &&
      res.body.includes('https://vizra.vercel.app/') &&
      res.body.includes('Creator Free');

    record(
      'AI Discovery Files',
      `GET ${llmsPath} returns plain text Markdown with verified VIZRA documentation`,
      res.status === 200 && ct.includes('text/plain') && !isHtml && hasCoreTerms && res.body.length > 500,
      `HTTP ${res.status} | Content-Type=${ct} | Bytes=${Buffer.byteLength(res.body, 'utf-8')} | HTML leaked=${isHtml}`
    );
  }

  // 2. Test /robots.txt & /sitemap.xml
  const robotsRes = await httpGet('/robots.txt', 'GPTBot/1.2');
  const robotsBody = robotsRes.body;
  const botsDeclared = [
    'Googlebot',
    'Google-Extended',
    'Bingbot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'GPTBot',
    'PerplexityBot',
    'Claude-SearchBot',
    'ClaudeBot',
    'Applebot',
  ].every((b) => robotsBody.includes(`User-agent: ${b}`));
  const privateDisallowed = [
    'Disallow: /api/',
    'Disallow: /live',
    'Disallow: /ai',
    'Disallow: /history',
    'Disallow: /settings',
    'Disallow: /workspace',
    'Disallow: /seo-diagnostics',
    'Disallow: /dashboard',
    'Disallow: /crawler-audit',
  ].every((d) => robotsBody.includes(d));

  record(
    'Robots.txt',
    'Explicit AI/Search crawler rules & private/API path Disallow entries',
    robotsRes.status === 200 &&
      String(robotsRes.headers['content-type']).includes('text/plain') &&
      botsDeclared &&
      privateDisallowed &&
      robotsBody.includes('Sitemap: https://vizra.vercel.app/sitemap.xml'),
    `HTTP ${robotsRes.status} | Bots declared=${botsDeclared} | Private disallowed=${privateDisallowed}`
  );

  const sitemapRes = await httpGet('/sitemap.xml', 'Googlebot/2.1');
  const locs = (sitemapRes.body.match(/<loc>(.*?)<\/loc>/g) || []).map((x) =>
    x.replace(/<\/?loc>/g, '').trim()
  );
  record(
    'Sitemap.xml',
    'Returns valid XML with strictly 12 canonical public URLs',
    sitemapRes.status === 200 &&
      String(sitemapRes.headers['content-type']).includes('application/xml') &&
      locs.length === 12 &&
      !locs.some((u) => u.includes('/ai') || u.includes('/workspace') || u.includes('localhost')),
    `HTTP ${sitemapRes.status} | Count=${locs.length}`
  );

  // 3. Test Google Search Console & Bing Webmaster verification files
  const gscRes = await httpGet('/googlef66bb3a90d865a89.html');
  const bingRes = await httpGet('/BingSiteAuth.xml');
  record(
    'Verification Assets',
    'Google Search Console & BingSiteAuth.xml verification files remain intact',
    gscRes.status === 200 &&
      gscRes.body.includes('google-site-verification: googlef66bb3a90d865a89.html') &&
      bingRes.status === 200 &&
      String(bingRes.headers['content-type']).includes('application/xml') &&
      bingRes.body.includes('<users>'),
    `GSC=HTTP ${gscRes.status} | Bing=HTTP ${bingRes.status}`
  );

  // 4. Test Rich Semantic Extraction on All 12 Public Routes (Without JS Execution)
  const routeSpecificAssertions: Record<string, string[]> = {
    '/': ['Omnia 1.0', 'Features', 'Pricing', 'Explore'],
    '/features': ['Think', 'Create', 'Build', 'Explore', '10-stage'],
    '/tools': ['Editorial & Script Writing', 'Temporal Video & Scene Synthesis', 'In Staging'],
    '/studio': ['Temporal Motion Synthesis', 'Omnia Neural Direction', 'Project Aether', 'HarmoniX'.replace('X', 'x')],
    '/explore': ['ENTER THE CREATIVE UNIVERSE', 'Creators & Directors', 'Creative Developers'],
    '/pricing': ['Creator Free', '$0', 'Omnia Pro', '$19', '$24', 'VIZRA Studio', '$64', '$79'],
    '/about': ['Don’t just ask AI. Work with it', 'Zero Fabricated Citations'],
    '/contact': ['Under 4 Hours', 'Under 24 Hours', '/api/contact'],
    '/docs': ['Sections A–H', '50,000', '10 MB', '169.254.169.254', 'UNAVAILABLE'],
    '/terms-and-conditions': ['STRICT_18_PLUS', 'USCO', '17 U.S.C.', '50(2)'],
    '/privacy-policy': ['DELETE /api/account/data', 'Google Cloud', 'DPDP'],
    '/cookie-policy': ['vizra_cookie_consent_v1', '@vercel/analytics', 'Cookieless'],
  };

  for (const route of PUBLIC_INDEXABLE_ROUTES) {
    const res = await httpGet(route);
    const extracted = extractReadableBodyText(res.body);
    const wordCount = extracted ? extracted.split(/\s+/).length : 0;
    const hasHeaderNav = /<header\b[^>]*>[\s\S]*<nav\b/i.test(res.body);
    const hasFooterNav = /<footer\b[^>]*>[\s\S]*<\/footer>/i.test(res.body);
    const hasH1 = /<h1\b[^>]*>[\s\S]+?<\/h1>/i.test(res.body);
    const hasH2 = /<h2\b[^>]*>[\s\S]+?<\/h2>/i.test(res.body);
    const hasSrOnlyHiding = /<main[^>]+class=["'][^"']*sr-only/i.test(res.body);
    const requiredSnippets = routeSpecificAssertions[route] || [];
    const snippetsPresent = requiredSnippets.every((s) =>
      extracted.toLowerCase().includes(s.toLowerCase())
    );

    record(
      'No-JS Public Extraction',
      `GET ${route} delivers rich visible semantic HTML (>=85 words, H1+H2, Header+Footer Nav)`,
      res.status === 200 &&
        String(res.headers['x-robots-tag']) === 'index, follow' &&
        !hasSrOnlyHiding &&
        hasHeaderNav &&
        hasFooterNav &&
        hasH1 &&
        hasH2 &&
        wordCount >= 85 &&
        snippetsPresent,
      `HTTP ${res.status} | Words=${wordCount} | Nav=${hasHeaderNav && hasFooterNav} | Snippets=${snippetsPresent} | HiddenSrOnly=${hasSrOnlyHiding}`
    );
  }

  // 5. Simulate All Target AI Crawlers + Standard Chrome Browser User-Agent
  const userAgents = [
    { name: 'Desktop Chrome', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
    { name: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
    { name: 'Google-Extended', ua: 'Google-Extended/1.0' },
    { name: 'Bingbot', ua: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
    { name: 'OAI-SearchBot', ua: 'OAI-SearchBot/1.0; +https://openai.com/searchbot' },
    { name: 'ChatGPT-User', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot' },
    { name: 'GPTBot', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot' },
    { name: 'PerplexityBot', ua: 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)' },
    { name: 'Claude-SearchBot', ua: 'Claude-SearchBot/1.0' },
    { name: 'ClaudeBot', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' },
    { name: 'Applebot', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)' },
    { name: 'curl', ua: 'curl/8.5.0' },
  ];

  for (const client of userAgents) {
    const home = await httpGet('/', client.ua);
    const pricing = await httpGet('/pricing', client.ua);
    const llms = await httpGet('/llms.txt', client.ua);
    const homeWords = extractReadableBodyText(home.body).split(/\s+/).length;
    const pricingHasTiers = extractReadableBodyText(pricing.body).includes('Omnia Pro');

    record(
      'Bot/UA Simulation',
      `${client.name} reads /, /pricing, and /llms.txt cleanly without challenge or empty DOM`,
      home.status === 200 &&
        pricing.status === 200 &&
        llms.status === 200 &&
        homeWords >= 100 &&
        pricingHasTiers,
      `Home=${home.status}(${homeWords}w) | Pricing=${pricing.status}(tiers=${pricingHasTiers}) | llms.txt=${llms.status}`
    );
  }

  // 6. Verify Private Routes Remain Isolated & Admin API Still Authenticated
  for (const pRoute of PRIVATE_OR_UTILITY_ROUTES) {
    const res = await httpGet(`${pRoute}?token=leak_test_999`, 'GPTBot/1.2');
    const leakesToken = res.body.includes('leak_test_999');
    record(
      'Private Route Isolation',
      `${pRoute} enforces noindex, nofollow & zero token leakage`,
      res.status === 200 &&
        res.headers['x-robots-tag'] === 'noindex, nofollow' &&
        res.body.includes('content="noindex, nofollow"') &&
        !leakesToken,
      `HTTP ${res.status} | X-Robots-Tag=${res.headers['x-robots-tag']} | Leaked=${leakesToken}`
    );
  }

  const adminRes = await httpGet('/api/seo-diagnostics/report', 'GPTBot/1.2');
  record(
    'Admin API Auth Boundary',
    'GET /api/seo-diagnostics/report rejects unauthenticated bots with HTTP 401',
    adminRes.status === 401,
    `HTTP ${adminRes.status}`
  );

  // 7. Verify Legacy Aliases (301) & Unknown 404 Route
  for (const [alias, target] of Object.entries(REDIRECT_ALIASES)) {
    const res = await httpGet(alias, 'Googlebot/2.1');
    record(
      'Alias 301 Redirect',
      `GET ${alias} -> ${target}`,
      res.status === 301 && res.headers['location'] === target,
      `HTTP ${res.status} | Location=${res.headers['location']}`
    );
  }

  const notFoundRes = await httpGet('/nonexistent-ai-crawler-check-404', 'OAI-SearchBot/1.0');
  record(
    '404 Hygiene',
    'Unknown path returns HTTP 404 with noindex, nofollow',
    notFoundRes.status === 404 && notFoundRes.headers['x-robots-tag'] === 'noindex, nofollow',
    `HTTP ${notFoundRes.status} | X-Robots-Tag=${notFoundRes.headers['x-robots-tag']}`
  );

  const apiHealthRes = await httpGet('/api/health', 'GPTBot/1.2');
  const liveHttpRes = await httpGet('/live', 'GPTBot/1.2');
  record(
    'API & Live Isolation',
    '/api/health and /live enforce HTTP X-Robots-Tag: noindex, nofollow',
    apiHealthRes.status === 200 &&
      apiHealthRes.headers['x-robots-tag'] === 'noindex, nofollow' &&
      liveHttpRes.status === 404 &&
      liveHttpRes.headers['x-robots-tag'] === 'noindex, nofollow',
    `/api/health=${apiHealthRes.status}(${apiHealthRes.headers['x-robots-tag']}) | /live=${liveHttpRes.status}(${liveHttpRes.headers['x-robots-tag']})`
  );

  // 8. Verify vercel.json & built dist/ artifacts if built
  const vercelRaw = fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf-8');
  const vercelCfg = JSON.parse(vercelRaw);
  const rewritesOk =
    vercelCfg.trailingSlash === false &&
    vercelCfg.rewrites.some((r: any) => r.source === '/llms.txt' && r.destination === '/llms.txt') &&
    vercelCfg.rewrites.some((r: any) => r.source === '/llms-full.txt' && r.destination === '/llms-full.txt') &&
    vercelCfg.headers.some((h: any) => h.source === '/api/(.*)' && h.headers?.some((kv: any) => kv.key === 'X-Robots-Tag' && kv.value === 'noindex, nofollow'));
  const distDir = path.join(rootDir, 'dist');
  const distFilesOk =
    fs.existsSync(path.join(distDir, 'llms.txt')) &&
    fs.existsSync(path.join(distDir, 'llms-full.txt')) &&
    fs.existsSync(path.join(distDir, 'robots.txt')) &&
    fs.existsSync(path.join(distDir, 'sitemap.xml')) &&
    fs.existsSync(path.join(distDir, 'BingSiteAuth.xml')) &&
    fs.existsSync(path.join(distDir, 'pricing', 'index.html')) &&
    fs.existsSync(path.join(distDir, 'docs', 'index.html')) &&
    extractReadableBodyText(fs.readFileSync(path.join(distDir, 'pricing', 'index.html'), 'utf-8')).includes('Creator Free') &&
    extractReadableBodyText(fs.readFileSync(path.join(distDir, 'docs', 'index.html'), 'utf-8')).includes('VIZRA Documentation');

  record(
    'Vercel & Build Artifacts',
    'vercel.json configures llms/noindex/trailingSlash & dist/ includes static TXT/XML + rich prerendered HTML',
    rewritesOk && distFilesOk,
    `vercel.json=${rewritesOk} | dist/ artifacts=${distFilesOk}`
  );

  const failed = results.filter((r) => !r.passed);
  console.log('\n======================================================================');
  console.log(
    `   AI CRAWLER ACCESSIBILITY SUMMARY: ${results.length - failed.length}/${results.length} PASSED`
  );
  console.log('======================================================================\n');

  if (failed.length > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('AI crawler accessibility suite error:', err);
  process.exit(1);
});
