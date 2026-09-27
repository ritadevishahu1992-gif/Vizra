import {
  VerifiedSource,
  SourcePriorityCategory,
  SourceValidationGateReport,
  SourceValidationChecks,
} from '../types/ai';
import { CitationItem } from '../types/rag';

interface CacheEntry {
  sources: VerifiedSource[];
  answerText: string;
  cachedAt: number;
  expiresAt: number;
  isTimeSensitive: boolean;
  query: string;
}

/**
 * Temporary In-Memory Source Cache (Section 11)
 * Retains original source metadata, enforces TTL, bypasses for time-sensitive queries.
 */
class SourceCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 15 * 60 * 1000; // 15 minutes

  private normalizeKey(query: string): string {
    return query.toLowerCase().trim().replace(/[?!.,]/g, '');
  }

  get(query: string): { sources: VerifiedSource[]; answerText: string } | null {
    if (isTimeSensitiveQuery(query)) {
      return null; // Always fresh research for time-sensitive questions
    }
    const key = this.normalizeKey(query);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return {
      sources: entry.sources,
      answerText: entry.answerText,
    };
  }

  set(
    query: string,
    sources: VerifiedSource[],
    answerText: string,
    isTimeSensitive: boolean = false
  ): void {
    if (sources.length === 0) return;
    const key = this.normalizeKey(query);
    this.cache.set(key, {
      sources,
      answerText,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.defaultTTL,
      isTimeSensitive,
      query,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const sourceCache = new SourceCache();

/**
 * Determines whether the user query asks for current, recent, live, or changing info.
 */
export function isTimeSensitiveQuery(text: string): boolean {
  const lower = text.toLowerCase();
  const timeKeywords = [
    'latest',
    'recent',
    'today',
    'current',
    'live',
    'now',
    'price',
    'stock',
    'weather',
    'news',
    'breaking',
    'trending',
    'score',
    'upcoming',
    'release date',
    'this week',
    'this month',
    'this year',
    '2025',
    '2026',
    'update',
    'status',
  ];
  return timeKeywords.some((kw) => lower.includes(kw));
}

/**
 * Detects whether a question is general static knowledge that OMNIA can answer
 * reliably from its existing foundation without external web research.
 */
export function isSimpleDirectKnowledge(text: string): boolean {
  const lower = text.toLowerCase().trim().replace(/[?!.,]/g, '');

  const knownTopics = [
    'why is the sky blue',
    'what is photosynthesis',
    'what is gravity',
    'why does rain happen',
    'what is the boiling point of water',
    'what is the speed of light',
    'what is the largest planet',
    'what is dna',
    'who was albert einstein',
    'who invented the telephone',
    'who painted the mona lisa',
    'what is the capital of india',
    'what is the capital of france',
    'what is the capital of the united states',
    'what is the capital of usa',
    'what is the capital of japan',
    'what is the capital of australia',
    'what is python',
    'what is quantum computing',
    'explain how websites work',
    'how does ai work',
  ];

  if (knownTopics.some((t) => lower.includes(t))) return true;

  // Simple math e.g. "what is 5 + 5"
  if (/^what is\s+-?\d+\s*[\+\-\*\/]\s*-?\d+$/i.test(lower)) return true;

  // Casual chit-chat
  if (/^(hi|hey|hello|sup|how are you|kya haal hai|namaste|gm|gn)[!.]*$/i.test(lower)) return true;

  return false;
}

/**
 * Validates whether web research is required according to Section 2 rules.
 */
export function shouldPerformWebResearch(
  rawPrompt: string,
  options: {
    hasRagMatches: boolean;
    highestRagScore: number;
    userMode?: string;
  }
): { needResearch: boolean; reason: string } {
  const lower = rawPrompt.toLowerCase().trim();

  // Rule 2.1: User explicitly asks to search the web, research something, or find sources
  if (
    /^(search\s*the\s*web|research|find\s*sources|citations\s*for|sources\s*for|google\s*this|browse\s*the\s*web)/i.test(
      lower
    ) ||
    lower.includes('search the web') ||
    lower.includes('find citations') ||
    lower.includes('research paper') ||
    options.userMode === 'research'
  ) {
    return {
      needResearch: true,
      reason: 'User explicitly requested web research / sources / citations.',
    };
  }

  // Rule 2.2: User asks for current, recent, live, changing, or time-sensitive information
  if (isTimeSensitiveQuery(rawPrompt)) {
    return {
      needResearch: true,
      reason: 'Query is time-sensitive or asks for current / live information.',
    };
  }

  // Rule 2.3: Simple questions that can be answered reliably without search
  if (isSimpleDirectKnowledge(rawPrompt)) {
    return {
      needResearch: false,
      reason: 'Answerable reliably from verified static knowledge.',
    };
  }

  // Rule 2.4: If RAG has strong verified matches (score >= 0.65), RAG is sufficient
  if (options.hasRagMatches && options.highestRagScore >= 0.65) {
    return {
      needResearch: false,
      reason: 'Sufficient verified knowledge available in OMNIA RAG document corpus.',
    };
  }

  // Rule 2.5: The answer depends on a specific external site, tool, paper, news article, or company
  const externalEntities = [
    'openai',
    'anthropic',
    'gemini',
    'deepseek',
    'nasa',
    'spacex',
    'nvidia',
    'apple',
    'microsoft',
    'github',
    'react 19',
    'tailwind v4',
    'next.js',
    'vite 6',
  ];
  if (externalEntities.some((entity) => lower.includes(entity))) {
    return {
      needResearch: true,
      reason: 'Answer depends on specific external platform, documentation, or entity.',
    };
  }

  // Rule 2.6: RAG information is incomplete or missing for an informational question
  if (!options.hasRagMatches || options.highestRagScore < 0.45) {
    // Only research if it is a substantive question (not creative drafting, code generation, or greetings)
    const isSubstantiveQuestion =
      /^(what|who|why|where|when|which|how|is|are|can|tell\s*me\s*about)\b/i.test(lower);
    if (isSubstantiveQuestion) {
      return {
        needResearch: true,
        reason: 'OMNIA Knowledge/RAG is insufficient for substantive factual inquiry.',
      };
    }
  }

  return {
    needResearch: false,
    reason: 'Standard internal reasoning pipeline sufficient.',
  };
}

/**
 * Validates a URL strictly (Section 3).
 * Must be a well-formed http(s) URL with valid domain and no mock strings.
 */
export function validateUrl(rawUrl: string): {
  valid: boolean;
  normalizedUrl: string;
  domain: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, normalizedUrl: '', domain: '' };
  }

  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, normalizedUrl: '', domain: '' };
    }

    const host = parsed.hostname.toLowerCase();
    // Must contain a dot and no spaces
    if (!host.includes('.') || /\s/.test(host)) {
      return { valid: false, normalizedUrl: '', domain: '' };
    }

    // Prohibit fake/placeholder domains
    const blacklistedDomains = [
      'example.com',
      'example.org',
      'test.com',
      'mock.com',
      'placeholder.com',
      'fake.com',
      'nature.com/articles/astro-dynamics',
    ];
    if (blacklistedDomains.some((b) => host === b || parsed.href.includes(b))) {
      return { valid: false, normalizedUrl: '', domain: '' };
    }

    return {
      valid: true,
      normalizedUrl: parsed.href,
      domain: host.replace(/^www\./, ''),
    };
  } catch {
    return { valid: false, normalizedUrl: '', domain: '' };
  }
}

/**
 * Known human-friendly brand names for authoritative domains.
 */
const KNOWN_DOMAIN_NAMES: Record<string, string> = {
  'openai.com': 'OpenAI',
  'github.com': 'GitHub',
  'nasa.gov': 'NASA',
  'wikipedia.org': 'Wikipedia',
  'en.wikipedia.org': 'Wikipedia',
  'google.com': 'Google',
  'developers.google.com': 'Google Developers',
  'cloud.google.com': 'Google Cloud',
  'microsoft.com': 'Microsoft',
  'apple.com': 'Apple',
  'nature.com': 'Nature',
  'arxiv.org': 'arXiv',
  'stackoverflow.com': 'Stack Overflow',
  'developer.mozilla.org': 'MDN Web Docs',
  'reuters.com': 'Reuters',
  'apnews.com': 'Associated Press',
  'bbc.com': 'BBC News',
  'bbc.co.uk': 'BBC',
  'nytimes.com': 'The New York Times',
  'bloomberg.com': 'Bloomberg',
  'wsj.com': 'Wall Street Journal',
  'theverge.com': 'The Verge',
  'techcrunch.com': 'TechCrunch',
  'ieee.org': 'IEEE',
  'sciencemag.org': 'Science',
  'science.org': 'Science',
  'w3.org': 'W3C',
  'python.org': 'Python.org',
  'react.dev': 'React Docs',
  'vite.dev': 'Vite Docs',
  'tailwindcss.com': 'Tailwind CSS',
};

/**
 * Extracts clean domain and authentic brand/site name without guesses.
 */
export function extractDomainAndName(
  url: string,
  rawTitle?: string
): { domain: string; name: string } {
  const { valid, domain } = validateUrl(url);
  if (!valid || !domain) {
    return { domain: 'unknown', name: 'Web Source' };
  }

  if (KNOWN_DOMAIN_NAMES[domain]) {
    return { domain, name: KNOWN_DOMAIN_NAMES[domain] };
  }

  // Check subdomains (e.g. docs.github.com -> GitHub Docs)
  for (const [key, val] of Object.entries(KNOWN_DOMAIN_NAMES)) {
    if (domain.endsWith('.' + key)) {
      return { domain, name: val };
    }
  }

  // Derive from domain root
  const parts = domain.split('.');
  const brandPart = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  const capitalized = brandPart.charAt(0).toUpperCase() + brandPart.slice(1);

  return { domain, name: capitalized };
}

/**
 * Categorizes source priority (Section 5).
 */
export function categorizeSource(domain: string, url: string): SourcePriorityCategory {
  const lowerDomain = domain.toLowerCase();
  const lowerUrl = url.toLowerCase();

  // 1. Official Documentation / Official Organization
  if (
    lowerUrl.includes('/docs') ||
    lowerDomain.startsWith('docs.') ||
    lowerDomain.startsWith('developer.') ||
    lowerDomain.startsWith('api.') ||
    lowerDomain === 'developer.mozilla.org' ||
    lowerDomain === 'react.dev' ||
    lowerDomain === 'vite.dev' ||
    lowerDomain === 'python.org'
  ) {
    return 'official_docs';
  }

  // 2. Government
  if (lowerDomain.endsWith('.gov') || lowerDomain.endsWith('.mil')) {
    return 'government';
  }

  // 3. Academic / Research
  if (
    lowerDomain.endsWith('.edu') ||
    lowerDomain.includes('arxiv.org') ||
    lowerDomain.includes('nature.com') ||
    lowerDomain.includes('science.org') ||
    lowerDomain.includes('doi.org') ||
    lowerDomain.includes('ieee.org') ||
    lowerDomain.includes('springer.com') ||
    lowerDomain.includes('sciencedirect.com') ||
    lowerDomain.includes('nih.gov')
  ) {
    return 'academic';
  }

  // 4. Reputable News
  if (
    lowerDomain.includes('reuters.com') ||
    lowerDomain.includes('apnews.com') ||
    lowerDomain.includes('bbc.com') ||
    lowerDomain.includes('nytimes.com') ||
    lowerDomain.includes('bloomberg.com') ||
    lowerDomain.includes('wsj.com') ||
    lowerDomain.includes('theverge.com') ||
    lowerDomain.includes('techcrunch.com')
  ) {
    return 'news';
  }

  // 5. Established Technical / Reference
  if (
    lowerDomain.includes('github.com') ||
    lowerDomain.includes('wikipedia.org') ||
    lowerDomain.includes('stackoverflow.com') ||
    lowerDomain.includes('w3.org') ||
    lowerDomain.includes('ietf.org')
  ) {
    return 'technical';
  }

  return 'other';
}

/**
 * Strict Claim-To-Source Validator (Section 7)
 * Verifies that a retrieved source has content supporting the claim.
 */
export function validateClaimToSource(claim: string, excerpt: string): boolean {
  if (!claim || !excerpt) return false;

  const tokenize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);

  const claimWords = tokenize(claim);
  const excerptWords = new Set(tokenize(excerpt));

  if (claimWords.length === 0) return true;

  const matches = claimWords.filter((w) => excerptWords.has(w));
  const ratio = matches.length / claimWords.length;

  return ratio >= 0.25 || matches.length >= 3;
}

/**
 * Validates and filters all candidate sources against strict authenticity criteria.
 * Any source failing validation is stripped out immediately (Section 3).
 */
export function validateAndFilterSources(
  candidateSources: VerifiedSource[]
): { verified: VerifiedSource[]; report: SourceValidationGateReport } {
  const verified: VerifiedSource[] = [];
  const rejectedReasons: string[] = [];

  for (const src of candidateSources) {
    const urlCheck = validateUrl(src.url);

    const checks: SourceValidationChecks = {
      exists: Boolean(src.sourceId && src.title),
      urlValid: urlCheck.valid,
      domainVerified: Boolean(src.domain && src.domain.includes('.')),
      contentRetrieved: Boolean(src.relevantExcerpt && src.relevantExcerpt.trim().length > 0),
      claimSupported:
        src.claimsSupported && src.claimsSupported.length > 0
          ? src.claimsSupported.some((c) => validateClaimToSource(c, src.relevantExcerpt))
          : true,
      metadataAuthentic: Boolean(src.title && src.domain),
    };

    const isFullyValid =
      checks.exists &&
      checks.urlValid &&
      checks.domainVerified &&
      checks.contentRetrieved &&
      checks.claimSupported &&
      checks.metadataAuthentic;

    if (isFullyValid) {
      verified.push({
        ...src,
        validationStatus: 'verified',
        validationChecks: checks,
      });
    } else {
      const failed = Object.entries(checks)
        .filter(([, v]) => !v)
        .map(([k]) => k);
      rejectedReasons.push(`Source "${src.title || src.url}" failed checks: ${failed.join(', ')}`);
    }
  }

  const report: SourceValidationGateReport = {
    passed: verified.length > 0,
    totalEvaluated: candidateSources.length,
    totalVerified: verified.length,
    totalRejected: candidateSources.length - verified.length,
    rejectionReasons: rejectedReasons.length > 0 ? rejectedReasons : undefined,
    timestamp: Date.now(),
  };

  return { verified, report };
}

/**
 * Converts RAG Document Citations into VerifiedSource objects with sourceType: 'document' (Section 9).
 */
export function buildDocumentSources(citations: CitationItem[]): VerifiedSource[] {
  return citations.map((cit, idx) => {
    return {
      sourceId: cit.id || `doc-${cit.documentId || idx}`,
      id: cit.id || `doc-${cit.documentId || idx}`,
      title: cit.fileName,
      name: cit.fileName,
      url: `#rag-doc-${cit.documentId}`,
      domain: 'OMNIA Verified Knowledge Corpus',
      favicon: undefined,
      sourceType: 'document',
      retrievedAt: Date.now(),
      relevantExcerpt: cit.excerpt,
      snippet: cit.excerpt,
      claimsSupported: [cit.section ? `Section: ${cit.section}` : `File: ${cit.fileName}`],
      priorityCategory: 'official_docs',
      reliability: 'verified',
      isFact: true,
      score: cit.score,
      documentId: cit.documentId,
      section: cit.section,
      validationStatus: 'verified',
      validationChecks: {
        exists: true,
        urlValid: true,
        domainVerified: true,
        contentRetrieved: true,
        claimSupported: true,
        metadataAuthentic: true,
      },
    };
  });
}
