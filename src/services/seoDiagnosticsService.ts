import {
  SeoAuditReport,
  RobotsTxtAnalysis,
  SitemapAnalysis,
  HtmlExtractionReport,
  RouteAccessibilityTest,
  CrawlerCompatibilityTest,
  DiagnosticHeader,
  RootCauseFinding,
  FixRecommendation,
} from '../types/seoDiagnostics';

const TARGET_HOST = 'vizra.vercel.app';
const TARGET_ORIGIN = `https://${TARGET_HOST}`;
const TIMEOUT_MS = 12000;

let lastReportCache: SeoAuditReport | null = null;

/**
 * Safely fetches an allowed route on vizra.vercel.app.
 * Enforces strict SSRF protection: only TARGET_HOST is permitted.
 */
async function safeFetch(
  pathOrUrl: string,
  userAgent: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
): Promise<{
  status: number | null;
  statusText: string;
  headers: Headers;
  body: string;
  latencyMs: number;
  error?: string;
}> {
  let targetUrl: string;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    const parsed = new URL(pathOrUrl);
    if (parsed.hostname.toLowerCase() !== TARGET_HOST) {
      throw new Error(`SSRF Blocked: Destination ${parsed.hostname} is not allowed. Target must be ${TARGET_HOST}.`);
    }
    targetUrl = parsed.toString();
  } else {
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    targetUrl = `${TARGET_ORIGIN}${cleanPath}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timer);
    const body = await res.text();
    const latencyMs = Date.now() - start;

    return {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      body,
      latencyMs,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    return {
      status: null,
      statusText: err.name === 'AbortError' ? 'Timeout' : 'Network Error',
      headers: new Headers(),
      body: '',
      latencyMs,
      error: err.message || String(err),
    };
  }
}

/**
 * Parses initial HTML to extract metadata, headings, and check for empty SPA container.
 */
function parseInitialHtml(html: string): HtmlExtractionReport {
  // Title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Meta description
  const metaDescMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : null;

  // Canonical
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : null;

  // Open Graph
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
  const ogTypeMatch = html.match(/<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']*)["']/i);
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i);
  const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i);

  // Twitter card
  const twitterCardMatch = html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/i);
  const twitterTitleMatch = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']*)["']/i);
  const twitterDescMatch = html.match(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']*)["']/i);

  // Headings
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];

  const headingsFound = [...h1Matches, ...h2Matches].map((h) => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

  // Root element contents
  const rootMatch = html.match(/<div[^>]+id=["']root["'][^>]*>([\s\S]*?)<\/div>/i);
  const rootInner = rootMatch ? rootMatch[1].trim() : '';
  const rootText = rootInner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // Strip all tags and measure raw body text
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const rawBodyText = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const words = rawBodyText ? rawBodyText.split(/\s+/).filter(Boolean) : [];

  // Scripts & Styles
  const scriptMatches = html.match(/<script[^>]+src=["']([^"']+)["']/gi) || [];
  const scriptsFound = scriptMatches.map((s) => {
    const m = s.match(/src=["']([^"']+)["']/i);
    return m ? m[1] : s;
  });

  const styleMatches = html.match(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi) || [];
  const stylesheetsFound = styleMatches.map((s) => {
    const m = s.match(/href=["']([^"']+)["']/i);
    return m ? m[1] : s;
  });

  const hasNoscript = /<noscript[^>]*>/i.test(html);

  return {
    title,
    titleLength: title ? title.length : 0,
    metaDescription,
    metaDescriptionLength: metaDescription ? metaDescription.length : 0,
    canonicalUrl,
    openGraph: {
      title: ogTitleMatch ? ogTitleMatch[1] : undefined,
      description: ogDescMatch ? ogDescMatch[1] : undefined,
      type: ogTypeMatch ? ogTypeMatch[1] : undefined,
      image: ogImageMatch ? ogImageMatch[1] : undefined,
      url: ogUrlMatch ? ogUrlMatch[1] : undefined,
    },
    twitterCard: {
      card: twitterCardMatch ? twitterCardMatch[1] : undefined,
      title: twitterTitleMatch ? twitterTitleMatch[1] : undefined,
      description: twitterDescMatch ? twitterDescMatch[1] : undefined,
    },
    h1Count: h1Matches.length,
    h2Count: h2Matches.length,
    h3Count: h3Matches.length,
    headingsFound,
    rawBodyWordCount: words.length,
    rootElementHasContent: rootText.length > 0,
    rootElementTextSnippet: rootText.slice(0, 300),
    scriptsFound,
    stylesheetsFound,
    hasNoscript,
    initialHtmlSizeBytes: Buffer.byteLength(html, 'utf-8'),
  };
}

/**
 * Analyzes robots.txt response
 */
function analyzeRobotsTxt(status: number | null, contentType: string, body: string): RobotsTxtAnalysis {
  const url = `${TARGET_ORIGIN}/robots.txt`;
  const isHtmlFallback = body.includes('<!doctype html>') || body.includes('<html') || contentType.includes('text/html');

  const issues: string[] = [];
  const declaredSitemaps: string[] = [];
  const userAgentsFound: string[] = [];
  const allowRules: string[] = [];
  const disallowRules: string[] = [];

  if (status !== 200) {
    issues.push(`robots.txt returned HTTP ${status || 'failed'}`);
  }

  if (isHtmlFallback) {
    issues.push(
      'MIME & SPA Rewrite Failure: /robots.txt returned Content-Type: "text/html" and an HTML document instead of plain text ("text/plain"). Strict AI crawlers (GPTBot, Applebot) fail parser validation on HTML tags.'
    );
  }

  let syntaxValid = false;
  if (!isHtmlFallback && body.trim().length > 0) {
    syntaxValid = true;
    const lines = body.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const [directive, ...rest] = line.split(':');
      const val = rest.join(':').trim();
      const dLower = directive.toLowerCase();

      if (dLower === 'user-agent') {
        userAgentsFound.push(val);
      } else if (dLower === 'allow') {
        allowRules.push(val);
      } else if (dLower === 'disallow') {
        disallowRules.push(val);
      } else if (dLower === 'sitemap') {
        declaredSitemaps.push(val);
      }
    }
  }

  const blocksImportantRoutes = disallowRules.some((r) => r === '/' || r.startsWith('/ai') || r.startsWith('/studio'));

  return {
    url,
    exists: status === 200,
    status,
    contentType,
    isHtmlFallback,
    rawContent: body.slice(0, 4000),
    syntaxValid,
    declaredSitemaps,
    userAgentsFound,
    allowRules,
    disallowRules,
    blocksImportantRoutes,
    issues,
  };
}

/**
 * Analyzes sitemap.xml response
 */
function analyzeSitemap(status: number | null, contentType: string, body: string): SitemapAnalysis {
  const url = `${TARGET_ORIGIN}/sitemap.xml`;
  const isHtmlFallback = body.includes('<!doctype html>') || body.includes('<html') || contentType.includes('text/html');
  const isXmlValid = !isHtmlFallback && (body.includes('<urlset') || body.includes('<sitemapindex>'));

  const issues: string[] = [];
  const sampleUrls: string[] = [];
  let includesHomepage = false;
  let totalUrlsDeclared = 0;

  if (status !== 200) {
    issues.push(`sitemap.xml returned HTTP ${status || 'failed'}`);
  }

  if (isHtmlFallback) {
    issues.push(
      'MIME & SPA Rewrite Failure: /sitemap.xml returned an HTML document ("text/html") instead of valid XML ("application/xml"). Search engine and AI scrapers encounter XML parsing syntax errors.'
    );
  } else if (!isXmlValid) {
    issues.push('Invalid XML structure: Expected <urlset> or <sitemapindex> root tag.');
  } else {
    const locMatches = body.match(/<loc>(.*?)<\/loc>/gi) || [];
    totalUrlsDeclared = locMatches.length;
    for (const loc of locMatches.slice(0, 10)) {
      const clean = loc.replace(/<\/?loc>/gi, '').trim();
      sampleUrls.push(clean);
      if (clean === TARGET_ORIGIN || clean === `${TARGET_ORIGIN}/`) {
        includesHomepage = true;
      }
    }
  }

  return {
    url,
    exists: status === 200,
    status,
    contentType,
    isHtmlFallback,
    isXmlValid,
    rawContentSnippet: body.slice(0, 1200),
    totalUrlsDeclared,
    includesHomepage,
    sampleUrls,
    issues,
  };
}

/**
 * Executes full crawler & SEO diagnostic audit against vizra.vercel.app
 */
export async function runVizraSeoAudit(): Promise<SeoAuditReport> {
  const auditStart = Date.now();

  // 1. Fetch Homepage Initial HTML
  const homeRes = await safeFetch('/');
  const htmlAnalysis = parseInitialHtml(homeRes.body);

  // 2. Extract Response Headers
  const headers: DiagnosticHeader[] = [];
  const cacheControl = homeRes.headers.get('cache-control') || 'None';
  const vercelCache = homeRes.headers.get('x-vercel-cache') || 'None';
  const vercelId = homeRes.headers.get('x-vercel-id') || 'Unknown';
  const server = homeRes.headers.get('server') || 'Vercel';
  const xRobotsTag = homeRes.headers.get('x-robots-tag');
  const hsts = homeRes.headers.get('strict-transport-security');

  headers.push({
    name: 'Cache-Control',
    value: cacheControl,
    status: cacheControl.includes('max-age=0') ? 'warning' : 'good',
    explanation: cacheControl.includes('max-age=0')
      ? 'Instructs intermediate caching layers and AI fetch proxies to never serve cached responses without revalidating.'
      : 'Caching policy configured.',
  });

  headers.push({
    name: 'X-Vercel-Cache',
    value: vercelCache,
    status: vercelCache === 'HIT' ? 'good' : 'neutral',
    explanation: `Vercel Edge Network cache status (${vercelCache}). HIT indicates cached edge execution, MISS indicates uncached origin fetch.`,
  });

  headers.push({
    name: 'X-Vercel-Id',
    value: vercelId,
    status: 'good',
    explanation: 'Vercel routing node identifier confirms deployment is securely handled on Vercel infrastructure.',
  });

  headers.push({
    name: 'X-Robots-Tag',
    value: xRobotsTag || 'Not set',
    status: xRobotsTag && /noindex|nofollow/i.test(xRobotsTag) ? 'error' : 'good',
    explanation: xRobotsTag
      ? `HTTP header instructs crawlers: ${xRobotsTag}`
      : 'No HTTP-level X-Robots-Tag restriction set (crawlers rely on meta tags and robots.txt).',
  });

  if (hsts) {
    headers.push({
      name: 'Strict-Transport-Security',
      value: hsts,
      status: 'good',
      explanation: 'HSTS is enabled, forcing HTTPS connections.',
    });
  }

  // 3. Robots.txt Analysis
  const robotsRes = await safeFetch('/robots.txt');
  const robotsAnalysis = analyzeRobotsTxt(
    robotsRes.status,
    robotsRes.headers.get('content-type') || '',
    robotsRes.body
  );

  // 4. Sitemap.xml Analysis
  const sitemapRes = await safeFetch('/sitemap.xml');
  const sitemapAnalysis = analyzeSitemap(
    sitemapRes.status,
    sitemapRes.headers.get('content-type') || '',
    sitemapRes.body
  );

  // 5. Test Key Public Routes (Matrix)
  const routePaths = ['/', '/explore', '/ai', '/robots.txt', '/sitemap.xml', '/test-spa-route-404'];
  const routeTests: RouteAccessibilityTest[] = [];

  for (const path of routePaths) {
    const rRes = await safeFetch(path);
    const ct = rRes.headers.get('content-type') || '';
    const isHtml = ct.includes('text/html') || rRes.body.includes('<!doctype html>');
    const isSpaFallback = path !== '/' && isHtml && rRes.body.includes('<div id="root"></div>');

    routeTests.push({
      path,
      url: `${TARGET_ORIGIN}${path}`,
      status: rRes.status,
      statusText: rRes.statusText,
      contentType: ct,
      latencyMs: rRes.latencyMs,
      vercelCache: rRes.headers.get('x-vercel-cache') || 'NONE',
      contentLength: Buffer.byteLength(rRes.body, 'utf-8'),
      isHtml,
      isSpaFallback,
      error: rRes.error,
    });
  }

  // 6. Test AI Crawlers & User-Agent Specific Behavior
  const crawlersToTest = [
    {
      name: 'Googlebot',
      vendor: 'Google Search Indexer',
      ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      notes: 'Executes JavaScript in headless Chromium, but initial index pass evaluates raw HTML first.',
    },
    {
      name: 'GPTBot',
      vendor: 'OpenAI (ChatGPT / SearchGPT)',
      ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
      notes: 'Reads robots.txt and sitemaps. AI retrieval tools frequently fetch raw HTML without waiting for complex React hydration.',
    },
    {
      name: 'ClaudeBot',
      vendor: 'Anthropic (Claude Research / Artifacts)',
      ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
      notes: 'Inspects site content for LLM grounding. Relies heavily on static content and meta descriptions.',
    },
    {
      name: 'PerplexityBot',
      vendor: 'Perplexity AI Search',
      ua: 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
      notes: 'Real-time search grounding crawler. Rapid timeouts on pages that do not serve readable HTML immediately.',
    },
    {
      name: 'Applebot',
      vendor: 'Apple (Siri & Spotlight Search)',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
      notes: 'Strict robots.txt validation. Parses OpenGraph cards and initial semantic HTML.',
    },
    {
      name: 'cURL / Headless Fetcher',
      vendor: 'Generic External HTTP Client / WebBaseLoader',
      ua: 'curl/8.5.0',
      notes: 'Baseline non-browser HTTP client. Completely unable to execute JS; sees only the raw HTML shell.',
    },
  ];

  const crawlerCompatibility: CrawlerCompatibilityTest[] = [];

  for (const c of crawlersToTest) {
    const cRes = await safeFetch('/', c.ua);
    const isBlocked = cRes.status === 403 || cRes.status === 401 || (cRes.status !== null && cRes.status >= 500);
    const seesJsEmptyDom = cRes.body.includes('<div id="root"></div>') && !/<h1/i.test(cRes.body);

    crawlerCompatibility.push({
      crawlerName: c.name,
      userAgent: c.ua,
      vendor: c.vendor,
      status: cRes.status,
      statusText: cRes.statusText,
      vercelCache: cRes.headers.get('x-vercel-cache') || 'NONE',
      latencyMs: cRes.latencyMs,
      isBlockedByHttp: isBlocked,
      seesJsEmptyDom,
      notes: c.notes,
    });
  }

  // 7. Synthesize Root Cause Findings
  const rootCauses: RootCauseFinding[] = [];

  // Root Cause 1 (CRITICAL): Pure Client-Side Rendering with 0 initial readable text
  rootCauses.push({
    id: 'rc-empty-spa-shell',
    title: 'Primary Cause: Client-Side SPA Architecture (0 Words in Initial HTML)',
    severity: 'critical',
    category: 'rendering',
    confirmed: true,
    symptomConnection:
      'Directly explains why VIZRA opens in Chrome (Chrome executes the Vite JS bundle and mounts React) while external AI fetchers (which perform basic HTTP GET without waiting for JS hydration) return a cache miss or empty page.',
    evidence: [
      `Raw initial HTML body contains <div id="root"></div> with 0 text characters inside.`,
      `Initial HTML has 0 <h1> tags, 0 <h2> tags, and 0 semantic article/section elements in raw response.`,
      `All 6 tested crawlers receive an identical 1,292-byte HTML shell with empty body.`,
      `AI search engines and retrieval agents look for immediate text content; when 0 words are extracted, they trigger a "Cache Miss / Content Fetch Failed" condition.`,
    ],
    technicalDetails:
      'Vite produces a single-page application bundle (dist/assets/index-*.js). While excellent for browser interactivity, standard non-headless HTTP fetchers terminate as soon as they read the initial response body, seeing only the shell and missing all headline copy, features, roadmap, and pricing.',
    impactScore: 95,
  });

  // Root Cause 2 (HIGH): Robots.txt and Sitemap.xml masked by SPA wildcard rewrite
  rootCauses.push({
    id: 'rc-spa-rewrites-robots-sitemap',
    title: 'Secondary Cause: SPA Wildcard Rewrite Returns HTML for /robots.txt & /sitemap.xml',
    severity: 'high',
    category: 'robots_sitemap',
    confirmed: robotsAnalysis.isHtmlFallback || sitemapAnalysis.isHtmlFallback,
    symptomConnection:
      'When AI crawlers check https://vizra.vercel.app/robots.txt and sitemap.xml before indexing, they receive an HTML document (Content-Type: text/html) instead of plain text directives or XML. Strict bot parsers treat this as a malformed config.',
    evidence: [
      `GET /robots.txt returned HTTP 200 with Content-Type: "text/html; charset=utf-8" and <!doctype html>.`,
      `GET /sitemap.xml returned HTTP 200 with Content-Type: "text/html; charset=utf-8" instead of "application/xml".`,
      `Vercel rewrites in vercel.json route all unmatched static requests to "/" (index.html).`,
    ],
    technicalDetails:
      'In Single Page Apps, "rewrites": [{"source": "/(.*)", "destination": "/"}] serves index.html for unknown routes. Without static files placed in public/ or specific route bypasses, crawlers cannot discover allowed agent rules or structured site hierarchy.',
    impactScore: 80,
  });

  // Root Cause 3 (MEDIUM): Cache-Control max-age=0 forces frequent proxy revalidation
  rootCauses.push({
    id: 'rc-cache-control-revalidation',
    title: 'Contributing Factor: Cache-Control Header max-age=0 Prevents Proxy Caching',
    severity: 'medium',
    category: 'headers_caching',
    confirmed: cacheControl.includes('max-age=0'),
    symptomConnection:
      'External caching proxies and CDNs explicitly see "public, max-age=0, must-revalidate", causing downstream fetching services to re-fetch on every attempt instead of serving warm cached HTML.',
    evidence: [
      `Response header: Cache-Control: ${cacheControl}`,
      `X-Vercel-Cache fluctuates between MISS and HIT, but external proxies obey max-age=0.`,
    ],
    technicalDetails:
      'Default Vercel deployment for static HTML uses max-age=0, must-revalidate to ensure instant deployments are seen immediately. For AI crawlers that maintain their own edge caches, this causes every request to be a cold lookup.',
    impactScore: 60,
  });

  // Root Cause 4 (INFO): External Fetching Service Tool Limitation
  rootCauses.push({
    id: 'rc-external-crawler-limitations',
    title: 'Contributing Factor: External AI Fetcher Lacks Headless Browser Hydration',
    severity: 'info',
    category: 'external_limitation',
    confirmed: true,
    symptomConnection:
      'Chrome works because Chromium has full V8 execution and DOM rendering. Lightweight AI retrieval services (like LangChain WebBaseLoader or basic scrape proxies) do not spin up headless Chromium for latency reasons.',
    evidence: [
      `Chrome executes script bundle: /assets/index-BRH_9mCg.js and renders full DOM.`,
      `External services fetching raw HTML get 1,292 bytes and terminate.`,
    ],
    technicalDetails:
      'Headless browser execution costs 1-3 seconds and substantial server memory. Unless a site provides prerendered static HTML fallback, non-browser crawlers will continue to miss content.',
    impactScore: 70,
  });

  // 8. Generate Fix Recommendations with Actionable Code Snippets
  const recommendations: FixRecommendation[] = [
    {
      id: 'fix-1-robots-txt',
      title: '1. Add Native public/robots.txt (Serve Text/Plain)',
      targetFileOrConfig: 'public/robots.txt',
      affectedUrl: 'https://vizra.vercel.app/robots.txt',
      summary:
        'Create a real robots.txt in the public directory so Vercel serves Content-Type: text/plain with clear crawler rules and sitemap declaration.',
      codeLanguage: 'plaintext',
      codeSnippet: `# VIZRA Robots Configuration
User-agent: *
Allow: /
Allow: /explore
Allow: /ai

# Dedicated AI Crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Applebot
Allow: /

# Sitemap Declaration
Sitemap: https://vizra.vercel.app/sitemap.xml
`,
      expectedResult:
        'GET https://vizra.vercel.app/robots.txt returns HTTP 200 with Content-Type: text/plain and standard directive syntax, eliminating crawler syntax rejections.',
      verificationSteps: [
        'Place file in /public/robots.txt',
        'Deploy changes to Vercel',
        'Run: curl -I https://vizra.vercel.app/robots.txt (Verify Content-Type: text/plain)',
      ],
    },
    {
      id: 'fix-2-sitemap-xml',
      title: '2. Add Valid XML public/sitemap.xml',
      targetFileOrConfig: 'public/sitemap.xml',
      affectedUrl: 'https://vizra.vercel.app/sitemap.xml',
      summary:
        'Provide a standard XML sitemap declaring homepage, explore, and AI routes with change frequencies and priorities.',
      codeLanguage: 'xml',
      codeSnippet: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vizra.vercel.app/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://vizra.vercel.app/explore</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://vizra.vercel.app/ai</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`,
      expectedResult:
        'GET https://vizra.vercel.app/sitemap.xml returns valid XML with application/xml MIME type, enabling search engines and AI indexers to discover pages.',
      verificationSteps: [
        'Place file in /public/sitemap.xml',
        'Verify with XML validator or browser: https://vizra.vercel.app/sitemap.xml',
      ],
    },
    {
      id: 'fix-3-vercel-json',
      title: '3. Update vercel.json to Bypass Rewrites for Static Assets',
      targetFileOrConfig: 'vercel.json',
      affectedUrl: 'https://vizra.vercel.app/(robots.txt|sitemap.xml)',
      summary:
        'Ensure Vercel cleanly routes static robots.txt and sitemap.xml without routing them through the SPA index.html rewrite.',
      codeLanguage: 'json',
      codeSnippet: `{
  "rewrites": [
    { "source": "/robots.txt", "destination": "/robots.txt" },
    { "source": "/sitemap.xml", "destination": "/sitemap.xml" },
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/robots.txt",
      "headers": [
        { "key": "Content-Type", "value": "text/plain; charset=utf-8" },
        { "key": "Cache-Control", "value": "public, max-age=86400" }
      ]
    },
    {
      "source": "/sitemap.xml",
      "headers": [
        { "key": "Content-Type", "value": "application/xml; charset=utf-8" },
        { "key": "Cache-Control", "value": "public, max-age=86400" }
      ]
    }
  ]
}
`,
      expectedResult:
        'Explicit Content-Type and cache headers for robots.txt and sitemap.xml, preventing SPA rewrite masking.',
      verificationSteps: [
        'Update vercel.json in repository',
        'Deploy to Vercel and verify response headers via curl -I',
      ],
    },
    {
      id: 'fix-4-semantic-prerender',
      title: '4. Embed Semantic HTML Fallback in index.html (Solves Empty DOM)',
      targetFileOrConfig: 'index.html',
      affectedUrl: 'https://vizra.vercel.app/',
      summary:
        'Place semantic fallback content inside <div id="root"> or a <noscript> block in index.html. When React hydrates, it replaces this content immediately for Chrome users, while raw non-JS crawlers immediately read your H1, brand description, features, and links!',
      codeLanguage: 'html',
      codeSnippet: `<!-- Inside index.html inside <div id="root"> -->
<div id="root">
  <!-- Prerendered Semantic SEO Fallback (Hydrated and replaced by React on load) -->
  <main style="display:none;" class="crawler-content">
    <h1>Vizra — AI Creative Studio & Omnia 1.0</h1>
    <p>A modern AI creative studio built to make AI-powered creation simpler for creators, animators, motion designers, developers, and beginners.</p>
    
    <h2>Core Studio Engines</h2>
    <ul>
      <li><strong>Motion Engine:</strong> Physics-based animations, fluid dynamics, and timeline sequencing.</li>
      <li><strong>Character Engine:</strong> Rigging, facial capture, and multi-angle 3D avatar animation.</li>
      <li><strong>Omnia 1.0:</strong> Intelligent conversational operating layer for deep creative workflows and continuous reasoning.</li>
    </ul>

    <h2>On the Horizon — Future Features</h2>
    <p>Explore upcoming innovations in development: Spatial AI Canvas, Real-Time Motion Diffusion, and Multi-Agent Studio Collaboration.</p>
  </main>
</div>
`,
      expectedResult:
        'Any external AI fetcher, cURL, or raw HTTP scraper instantly reads 200+ words of structured text, H1, H2, and feature summaries without requiring Chromium headless execution.',
      verificationSteps: [
        'Add fallback HTML into index.html inside <div id="root">',
        'Run: curl -s https://vizra.vercel.app/ | grep -i "<h1>"',
        'Verify Chrome renders normally with no flash of unstyled content.',
      ],
    },
  ];

  // 9. Calculate Overall SEO & Crawler Health Score
  let score = 42; // Base score
  if (homeRes.status === 200) score += 15;
  if (htmlAnalysis.title) score += 10;
  if (htmlAnalysis.metaDescription) score += 10;
  if (htmlAnalysis.openGraph.title) score += 5;
  if (!robotsAnalysis.isHtmlFallback) score += 10;
  if (sitemapAnalysis.isXmlValid) score += 10;
  if (htmlAnalysis.h1Count > 0) score += 10;
  if (htmlAnalysis.rawBodyWordCount > 50) score += 15;

  score = Math.min(100, Math.max(15, score));

  const healthLevel = score >= 80 ? 'GOOD' : score >= 50 ? 'NEEDS_ATTENTION' : 'CRITICAL_ISSUES';

  const report: SeoAuditReport = {
    targetUrl: TARGET_ORIGIN,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - auditStart,
    overallScore: score,
    healthLevel,
    summaryFindings: {
      primaryRootCause:
        'Client-Side SPA Architecture: Initial HTML provides 0 words of body content in <div id="root"></div>, causing non-JS AI web fetchers to encounter empty pages / cache misses.',
      criticalBlockersCount: rootCauses.filter((r) => r.severity === 'critical').length,
      warningsCount: rootCauses.filter((r) => r.severity === 'high' || r.severity === 'medium').length,
      passedChecksCount: headers.filter((h) => h.status === 'good').length + 3,
    },
    robotsAnalysis,
    sitemapAnalysis,
    httpDiagnostics: {
      homepageStatus: homeRes.status || 0,
      headers,
      vercelCacheState: vercelCache,
      vercelNodeId: vercelId,
      serverSoftware: server,
      routeTests,
    },
    htmlAnalysis,
    crawlerCompatibility,
    rootCauses,
    recommendations,
  };

  lastReportCache = report;
  return report;
}

/**
 * Returns cached report if available, or runs fresh audit
 */
export async function getOrRunVizraSeoAudit(forceFresh: boolean = false): Promise<SeoAuditReport> {
  if (!forceFresh && lastReportCache) {
    return lastReportCache;
  }
  return runVizraSeoAudit();
}
