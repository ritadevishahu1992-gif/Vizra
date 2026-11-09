export interface DiagnosticHeader {
  name: string;
  value: string;
  status: 'good' | 'warning' | 'neutral' | 'error';
  explanation: string;
}

export interface RouteAccessibilityTest {
  path: string;
  url: string;
  status: number | null;
  statusText: string;
  contentType: string;
  latencyMs: number;
  vercelCache: string;
  contentLength: number;
  isHtml: boolean;
  isSpaFallback: boolean;
  error?: string;
}

export interface CrawlerCompatibilityTest {
  crawlerName: string;
  userAgent: string;
  vendor: string;
  status: number | null;
  statusText: string;
  vercelCache: string;
  latencyMs: number;
  isBlockedByHttp: boolean;
  seesJsEmptyDom: boolean;
  notes: string;
}

export interface HtmlExtractionReport {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  canonicalUrl: string | null;
  openGraph: {
    title?: string;
    description?: string;
    type?: string;
    image?: string;
    url?: string;
  };
  twitterCard: {
    card?: string;
    title?: string;
    description?: string;
  };
  h1Count: number;
  h2Count: number;
  h3Count: number;
  headingsFound: string[];
  rawBodyWordCount: number;
  rootElementHasContent: boolean;
  rootElementTextSnippet: string;
  scriptsFound: string[];
  stylesheetsFound: string[];
  hasNoscript: boolean;
  initialHtmlSizeBytes: number;
}

export interface RobotsTxtAnalysis {
  url: string;
  exists: boolean;
  status: number | null;
  contentType: string;
  isHtmlFallback: boolean;
  rawContent: string;
  syntaxValid: boolean;
  declaredSitemaps: string[];
  userAgentsFound: string[];
  allowRules: string[];
  disallowRules: string[];
  blocksImportantRoutes: boolean;
  issues: string[];
}

export interface SitemapAnalysis {
  url: string;
  exists: boolean;
  status: number | null;
  contentType: string;
  isHtmlFallback: boolean;
  isXmlValid: boolean;
  rawContentSnippet: string;
  totalUrlsDeclared: number;
  includesHomepage: boolean;
  sampleUrls: string[];
  issues: string[];
}

export interface RootCauseFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  category: 'rendering' | 'robots_sitemap' | 'headers_caching' | 'external_limitation' | 'server';
  confirmed: boolean;
  symptomConnection: string;
  evidence: string[];
  technicalDetails: string;
  impactScore: number; // 0-100
}

export interface FixRecommendation {
  id: string;
  title: string;
  targetFileOrConfig: string;
  affectedUrl: string;
  summary: string;
  codeSnippet: string;
  codeLanguage: string;
  expectedResult: string;
  verificationSteps: string[];
}

export interface SeoAuditReport {
  targetUrl: string;
  scannedAt: string;
  durationMs: number;
  overallScore: number;
  healthLevel: 'CRITICAL_ISSUES' | 'NEEDS_ATTENTION' | 'GOOD';
  summaryFindings: {
    primaryRootCause: string;
    criticalBlockersCount: number;
    warningsCount: number;
    passedChecksCount: number;
  };
  robotsAnalysis: RobotsTxtAnalysis;
  sitemapAnalysis: SitemapAnalysis;
  httpDiagnostics: {
    homepageStatus: number;
    headers: DiagnosticHeader[];
    vercelCacheState: string;
    vercelNodeId: string;
    serverSoftware: string;
    routeTests: RouteAccessibilityTest[];
  };
  htmlAnalysis: HtmlExtractionReport;
  crawlerCompatibility: CrawlerCompatibilityTest[];
  rootCauses: RootCauseFinding[];
  recommendations: FixRecommendation[];
}
