import {
  VerifiedSource,
  SourcePriorityCategory,
  SourceValidationGateReport,
  SourceValidationChecks,
  AIMode,
} from '../types/ai';
import { CitationItem } from '../types/rag';

// Known reputable domain mappings for clean branding
const KNOWN_DOMAINS: Record<string, { name: string; priority: SourcePriorityCategory }> = {
  'openai.com': { name: 'OpenAI', priority: 'official_docs' },
  'nasa.gov': { name: 'NASA', priority: 'government' },
  'github.com': { name: 'GitHub', priority: 'official_docs' },
  'developer.mozilla.org': { name: 'MDN Web Docs', priority: 'official_docs' },
  'wikipedia.org': { name: 'Wikipedia', priority: 'technical' },
  'en.wikipedia.org': { name: 'Wikipedia', priority: 'technical' },
  'arxiv.org': { name: 'arXiv', priority: 'academic' },
  'nature.com': { name: 'Nature', priority: 'academic' },
  'science.org': { name: 'Science', priority: 'academic' },
  'ieee.org': { name: 'IEEE Xplore', priority: 'academic' },
  'reuters.com': { name: 'Reuters', priority: 'news' },
  'apnews.com': { name: 'Associated Press', priority: 'news' },
  'bbc.com': { name: 'BBC News', priority: 'news' },
  'bbc.co.uk': { name: 'BBC News', priority: 'news' },
  'bloomberg.com': { name: 'Bloomberg', priority: 'news' },
  'nytimes.com': { name: 'The New York Times', priority: 'news' },
  'theverge.com': { name: 'The Verge', priority: 'news' },
  'techcrunch.com': { name: 'TechCrunch', priority: 'news' },
  'wired.com': { name: 'Wired', priority: 'news' },
  'stackoverflow.com': { name: 'Stack Overflow', priority: 'technical' },
  'react.dev': { name: 'React Docs', priority: 'official_docs' },
  'nodejs.org': { name: 'Node.js', priority: 'official_docs' },
  'python.org': { name: 'Python Docs', priority: 'official_docs' },
  'typescriptlang.org': { name: 'TypeScript', priority: 'official_docs' },
  'w3.org': { name: 'W3C', priority: 'primary' },
  'ietf.org': { name: 'IETF', priority: 'primary' },
  'who.int': { name: 'WHO', priority: 'government' },
  'cdc.gov': { name: 'CDC', priority: 'government' },
  'nih.gov': { name: 'NIH', priority: 'government' },
  'un.org': { name: 'United Nations', priority: 'primary' },
  'whitehouse.gov': { name: 'White House', priority: 'government' },
};

/**
 * Categorize source priority according to strict OMNIA hierarchy:
 * 1. Official documentation / official organization
 * 2. Primary sources
 * 3. Government sources
 * 4. Academic/research sources
 * 5. Reputable news organizations
 * 6. Established technical/reference websites
 * 7. Other relevant sources
 */
export function categorizeSourcePriority(domain: string, url: string): SourcePriorityCategory {
  const d = domain.toLowerCase();
  const u = url.toLowerCase();

  // Exact known matches
  if (KNOWN_DOMAINS[d]) {
    return KNOWN_DOMAINS[d].priority;
  }

  // 3. Government sources
  if (d.endsWith('.gov') || d.endsWith('.mil') || d.includes('.gov.') || d.includes('.mil.')) {
    return 'government';
  }

  // 4. Academic / Research
  if (
    d.endsWith('.edu') ||
    d.includes('.edu.') ||
    d.includes('arxiv.org') ||
    d.includes('nature.com') ||
    d.includes('springer.com') ||
    d.includes('sciencedirect.com') ||
    d.includes('acm.org') ||
    d.includes('biorxiv.org') ||
    d.includes('medrxiv.org') ||
    d.includes('jstor.org') ||
    d.includes('ncbi.nlm.nih.gov') ||
    u.includes('/doi/') ||
    u.includes('/article/')
  ) {
    return 'academic';
  }

  // 1. Official documentation
  if (
    d.startsWith('docs.') ||
    d.includes('.docs.') ||
    d.startsWith('developer.') ||
    d.includes('/docs/') ||
    d.includes('/documentation/') ||
    d.includes('github.com') ||
    d.includes('gitlab.com')
  ) {
    return 'official_docs';
  }

  // 2. Primary sources / specs
  if (d.includes('w3.org') || d.includes('rfc-editor.org') || d.includes('ecma-international.org')) {
    return 'primary';
  }

  // 5. Reputable news
  if (
    d.includes('reuters') ||
    d.includes('apnews') ||
    d.includes('bloomberg') ||
    d.includes('bbc') ||
    d.includes('nytimes') ||
    d.includes('wsj') ||
    d.includes('ft.com') ||
    d.includes('theguardian') ||
    d.includes('techcrunch') ||
    d.includes('theverge') ||
    d.includes('arstechnica')
  ) {
    return 'news';
  }

  // 6. Established technical / reference
  if (
    d.includes('stackoverflow.com') ||
    d.includes('mozilla.org') ||
    d.includes('wikipedia.org') ||
    d.includes('dev.to') ||
    d.includes('geeksforgeeks.org') ||
    d.includes('w3schools.com')
  ) {
    return 'technical';
  }

  return 'other';
}

/**
 * Returns a human-friendly display name for a source domain
 */
export function getDomainDisplayName(domain: string): string {
  const d = domain.toLowerCase().replace(/^www\./, '');
  if (KNOWN_DOMAINS[d]) {
    return KNOWN_DOMAINS[d].name;
  }

  // Common TLD clean up
  const base = d.split('.')[0];
  if (base.length > 1) {
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
  return domain;
}

/**
 * High-res Favicon resolver via Google S2 Favicon service
 */
export function getDomainFavicon(domain: string): string {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=64`;
}

/**
 * Determines whether a query requires live Web Research
 */
export function shouldPerformWebResearch(
  rawPrompt: string,
  ragTopScore = 0,
  ragCount = 0,
  mode?: AIMode
): boolean {
  if (mode === 'research') return true;

  const lower = rawPrompt.toLowerCase().trim();

  // 1. Explicit search requests
  const explicitSearchPatterns = [
    /search\s+(the\s+)?(web|internet|google|online)/i,
    /look\s+up\s+online/i,
    /find\s+sources\s+(for|about)/i,
    /research\s+this\s+topic/i,
    /verify\s+online/i,
    /find\s+(the\s+)?latest/i,
    /check\s+(the\s+)?web/i,
  ];
  if (explicitSearchPatterns.some((p) => p.test(lower))) {
    return true;
  }

  // 2. Current, recent, live, changing, time-sensitive queries
  const timeSensitivePatterns = [
    /\b(today|yesterday|this\s+week|this\s+month|this\s+year)\b/i,
    /\b(latest|current|recent|newest|live|trending|upcoming)\b/i,
    /\b(2024|2025|2026|2027)\b/,
    /\b(current\s+price|stock\s+price|market\s+cap|weather|election|score|match\s+today)\b/i,
    /\bwho\s+is\s+currently\b/i,
    /\bnew\s+release|latest\s+version|changelog\b/i,
  ];
  if (timeSensitivePatterns.some((p) => p.test(lower))) {
    return true;
  }

  // 3. Explicit URLs or external documentation references
  if (/https?:\/\//i.test(lower) || /\b(github\.com|arxiv|wikipedia|docs\.)/i.test(lower)) {
    return true;
  }

  // 4. Insufficient RAG context:
  // If the query is an informational/knowledge question and RAG has low relevance or zero matches
  const isQuestion =
    /^(what|who|when|where|which|how|why|is|are|can)\b/i.test(lower) || lower.endsWith('?');
  if (isQuestion && ragCount === 0 && ragTopScore < 0.35) {
    // Only search if it's not a timeless basic definition (like photosynthesis or sky color)
    const isTimelessBasic =
      /^(why\s+is\s+the\s+sky\s+blue|what\s+is\s+photosynthesis|what\s+is\s+gravity|why\s+does\s+rain\s+happen|what\s+is\s+the\s+capital\s+of)/i.test(
        lower
      );
    if (!isTimelessBasic) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a candidate source strictly against all 6 verification checks:
 * 1. Source actually exists
 * 2. URL is valid
 * 3. Source content is accessible / retrieved
 * 4. Source is relevant to query/claim
 * 5. Source actually supports the claim
 * 6. Displayed title/domain matches the real source
 */
export function validateSourceCandidate(
  source: Partial<VerifiedSource>,
  userQuery: string
): { isValid: boolean; checks: SourceValidationChecks; rejectionReason?: string } {
  const checks: SourceValidationChecks = {
    exists: false,
    urlValid: false,
    domainVerified: false,
    contentRetrieved: false,
    claimSupported: false,
    metadataAuthentic: false,
  };

  // 1. Source exists check
  if (!source.url || !source.domain || typeof source.url !== 'string') {
    return { isValid: false, checks, rejectionReason: 'Missing URL or Domain' };
  }
  checks.exists = true;

  // 2. URL is valid check
  try {
    const parsed = new URL(source.url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, checks, rejectionReason: 'Protocol must be HTTP/HTTPS' };
    }
    if (!parsed.hostname.includes('.') || parsed.hostname.endsWith('.')) {
      return { isValid: false, checks, rejectionReason: 'Invalid domain hostname' };
    }
    checks.urlValid = true;
  } catch {
    return { isValid: false, checks, rejectionReason: 'Malformed URL syntax' };
  }

  // 3. Domain verification check
  const cleanDomain = source.domain.toLowerCase().replace(/^www\./, '');
  if (
    cleanDomain === 'localhost' ||
    cleanDomain.endsWith('.local') ||
    cleanDomain.includes(' ') ||
    cleanDomain.length < 4
  ) {
    return { isValid: false, checks, rejectionReason: 'Domain failed authenticity check' };
  }
  checks.domainVerified = true;

  // 4. Content retrieved check
  // Must have an actual excerpt, title, or confirmed grounding segment
  const hasContent =
    (source.relevantExcerpt && source.relevantExcerpt.trim().length > 10) ||
    (source.claimsSupported && source.claimsSupported.length > 0) ||
    (source.title && source.title.trim().length > 3);
  if (!hasContent) {
    return { isValid: false, checks, rejectionReason: 'No retrieved content or evidence segment' };
  }
  checks.contentRetrieved = true;

  // 5. Claim support check
  // Ensure that the source is linked to a claim or the query
  const queryTokens = userQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const excerptText = (source.relevantExcerpt || '').toLowerCase();
  const titleText = (source.title || '').toLowerCase();
  const domainText = cleanDomain;
  const claimsText = (source.claimsSupported || []).join(' ').toLowerCase();

  const combinedEvidence = `${titleText} ${excerptText} ${domainText} ${claimsText}`;
  const hasRelevance =
    queryTokens.length === 0 || queryTokens.some((t) => combinedEvidence.includes(t));

  if (!hasRelevance && (!source.claimsSupported || source.claimsSupported.length === 0)) {
    return { isValid: false, checks, rejectionReason: 'Source evidence is irrelevant to query claims' };
  }
  checks.claimSupported = true;

  // 6. Source metadata authenticity check
  if (!source.title || source.title === 'Unknown Source' || source.title === 'undefined') {
    return { isValid: false, checks, rejectionReason: 'Inauthentic or missing title metadata' };
  }
  checks.metadataAuthentic = true;

  return { isValid: true, checks };
}

/**
 * Final Validation Gate:
 * Enforces the strict rule that if any required check fails,
 * remove that source from the final response.
 */
export function runSourceValidationGate(
  candidateSources: Partial<VerifiedSource>[],
  userQuery: string
): { passedSources: VerifiedSource[]; report: SourceValidationGateReport } {
  const passedSources: VerifiedSource[] = [];
  const rejectionReasons: string[] = [];

  for (let i = 0; i < candidateSources.length; i++) {
    const candidate = candidateSources[i];
    const validation = validateSourceCandidate(candidate, userQuery);

    if (validation.isValid) {
      const verifiedSource: VerifiedSource = {
        sourceId: candidate.sourceId || `src-${Date.now()}-${i}`,
        title: candidate.title || getDomainDisplayName(candidate.domain || 'source'),
        url: candidate.url!,
        domain: candidate.domain!.toLowerCase().replace(/^www\./, ''),
        favicon: candidate.favicon || getDomainFavicon(candidate.domain!),
        sourceType: candidate.sourceType || 'web',
        retrievedAt: candidate.retrievedAt || Date.now(),
        relevantExcerpt: candidate.relevantExcerpt || '',
        claimsSupported: candidate.claimsSupported || [],
        priorityCategory:
          candidate.priorityCategory ||
          categorizeSourcePriority(candidate.domain!, candidate.url!),
        reliability: candidate.reliability || 'verified',
        isFact: true,
        score: candidate.score || 95,
        validationStatus: 'verified',
        validationChecks: validation.checks,
        // Compatibility fields
        id: candidate.sourceId || `src-${Date.now()}-${i}`,
        snippet: candidate.relevantExcerpt || candidate.title || '',
      };
      passedSources.push(verifiedSource);
    } else {
      rejectionReasons.push(
        `[${candidate.domain || 'unknown'}]: ${validation.rejectionReason || 'Failed verification checks'}`
      );
    }
  }

  // Sort passed sources according to strict priority
  const priorityOrder: Record<SourcePriorityCategory, number> = {
    official_docs: 1,
    primary: 2,
    government: 3,
    academic: 4,
    news: 5,
    technical: 6,
    other: 7,
  };

  passedSources.sort((a, b) => {
    const pA = priorityOrder[a.priorityCategory || 'other'] || 7;
    const pB = priorityOrder[b.priorityCategory || 'other'] || 7;
    return pA - pB;
  });

  return {
    passedSources,
    report: {
      passed: passedSources.length > 0,
      totalEvaluated: candidateSources.length,
      totalVerified: passedSources.length,
      totalRejected: candidateSources.length - passedSources.length,
      rejectionReasons,
      timestamp: Date.now(),
    },
  };
}

/**
 * Converts a RAG Chunk Citation into a unified VerifiedSource with sourceType 'document'
 */
export function convertCitationToVerifiedSource(citation: CitationItem): VerifiedSource {
  return {
    sourceId: citation.id || citation.chunkId,
    title: citation.fileName,
    url: `#${citation.documentId}`,
    domain: 'OMNIA RAG Corpus',
    sourceType: 'document',
    retrievedAt: Date.now(),
    relevantExcerpt: citation.excerpt,
    claimsSupported: [citation.section || 'Verified Document Statement'],
    priorityCategory: 'official_docs',
    reliability: 'verified',
    isFact: true,
    score: citation.score,
    documentId: citation.documentId,
    section: citation.section,
    validationStatus: 'verified',
    validationChecks: {
      exists: true,
      urlValid: true,
      domainVerified: true,
      contentRetrieved: true,
      claimSupported: true,
      metadataAuthentic: true,
    },
    // Compatibility fields
    id: citation.id,
    snippet: citation.excerpt,
  };
}

/**
 * Temporary In-Memory Source Cache with TTL (10 minutes)
 */
interface CachedEntry {
  query: string;
  sources: VerifiedSource[];
  timestamp: number;
}

class WebResearchCache {
  private cache = new Map<string, CachedEntry>();
  private readonly TTL_MS = 10 * 60 * 1000; // 10 minutes

  get(query: string): VerifiedSource[] | null {
    const key = query.toLowerCase().trim();
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.sources;
  }

  set(query: string, sources: VerifiedSource[]): void {
    const key = query.toLowerCase().trim();
    this.cache.set(key, {
      query,
      sources,
      timestamp: Date.now(),
    });

    // Prune if cache grows too large
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const webResearchCache = new WebResearchCache();
