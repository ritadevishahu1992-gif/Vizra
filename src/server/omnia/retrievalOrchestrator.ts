import crypto from 'crypto';
import { blogKnowledgeBase, type RetrievedBlogChunk } from '../blog/blogKnowledgeBase';

export interface HistoryTurn {
  role: 'user' | 'model';
  content: string;
}

export type SourceLayer =
  | 'uploaded_files'
  | 'workspace_rag'
  | 'vizra_blog'
  | 'approved_learning'
  | 'google_search'
  | 'conversation_context';

export interface SourceRetrievalPlan {
  layers: SourceLayer[];
  shouldSearchBlog: boolean;
  explicitBlogIntent: boolean;
  shouldUseWebSearch: boolean;
  isFollowUp: boolean;
  isDocumentFocused: boolean;
  reason: string;
}

export interface RetrievedBlogSourceResult {
  chunks: RetrievedBlogChunk[];
  contextText: string;
  sources: Array<{
    sourceId: string;
    id: string;
    title: string;
    url: string;
    domain: string;
    sourceType: 'document';
    retrievedAt: number;
    relevantExcerpt: string;
    snippet: string;
    claimsSupported: string[];
    priorityCategory: 'official_docs';
    reliability: 'verified';
    isFact: boolean;
    score: number;
    documentId: string;
    section: string;
    validationStatus: 'verified';
  }>;
  usedFallback: boolean;
  queryUsed: string;
}

export interface RetrievalTraceDocument {
  id: string;
  title: string;
  provider: 'vizra_blog' | 'workspace_rag' | 'uploaded_file' | 'approved_learning' | 'google_search';
  score?: number;
}

export interface OmniaRetrievalTrace {
  requestId: string;
  timestamp: string;
  originalQuery: string;
  rewrittenQuery: string;
  isFollowUp: boolean;
  sourcePlan: {
    layers: SourceLayer[];
    reason: string;
  };
  retrievalProviders: string[];
  documentsRetrievedCount: number;
  retrievedDocuments: RetrievalTraceDocument[];
  contextStats: {
    totalChars: number;
    estimatedTokens: number;
    attachmentCount: number;
    workspaceRagChars: number;
    vizraBlogChars: number;
    approvedLearningChars: number;
  };
  grounding: {
    webSearchRequested: boolean;
    webSearchInvoked: boolean;
    webSearchFailedFallback: boolean;
    groundingChunksReceived: number;
    webSearchQueries: string[];
    verifiedSourcesReturned: number;
  };
  generation: {
    model: string;
    fallbackUsed: boolean;
    latencyMs: number;
    outputChars: number;
    finishReason: string;
  };
  reliability?: {
    queueDurationMs: number;
    retrievalDurationMs: number;
    retryCount: number;
    providerStatus?: number;
    failureCategory: string;
    fallbackActivated: boolean;
    cacheHit: boolean;
    coalesced: boolean;
  };
  errors: string[];
}

const FOLLOW_UP_PATTERN =
  /\b(this\s+(article|post|doc|document|file|paper|guide|topic|section|report|one)|that\s+(article|post|doc|document|file|paper|guide|topic|section|one)|the\s+(article|post|doc|document|file|above)|it|its|they|them|their|those|these|more\s+about|tell\s+me\s+more|go\s+deeper|elaborate|expand\s+on|what\s+about|how\s+does\s+it|why\s+does\s+it|summarize\s+it|main\s+purpose|key\s+takeaways|continue|and\s+what\s+about)\b/i;

const EXPLICIT_BLOG_PATTERN =
  /\b(vizra\s+(blog|article|articles|post|posts|guide|guides|monograph|website|site|docs|documentation)|on\s+vizra|in\s+vizra|vizra'?s\s+(blog|article|articles|guide|guides|site|website)|this\s+article|the\s+article|published\s+articles?|blog\s+posts?)\b/i;

const EXPLICIT_WEB_SEARCH_PATTERN =
  /\b(search\s+(the\s+)?(web|internet|google|online)|look\s+up|find\s+sources|latest|current|recent|newest|today|yesterday|this\s+week|this\s+month|this\s+year|2025|2026|2027|news|price|stock|weather|election|score|release\s+date|version|changelog|who\s+is\s+(the\s+)?current|according\s+to\s+.*docs?)\b/i;

const EXTERNAL_FACTUAL_PATTERN =
  /\b(what\s+(is|are|was|were)|who\s+(is|are|was|were|discovered|invented|founded|created)|when\s+(did|was|were)|where\s+(is|are|was|were)|why\s+(did|does|is|are)|how\s+(many|much|does|did|do|far|tall|old)|compare|comparison|versus|vs\.?|difference\s+between|history\s+of|causes?\s+of|definition\s+of|explain\s+|tell\s+me\s+about)\b/i;

const PURE_CREATIVE_OR_CHAT_PATTERN =
  /^(hi|hey|hello|sup|yo|namaste|thanks|thank\s+you|ok|okay|cool|nice|bye|goodbye|write\s+a\s+(poem|story|haiku|joke|caption|script|email)|brainstorm|give\s+me\s+ideas|rewrite\s+this|fix\s+my\s+grammar|translate\s+this)\b/i;

const INTERNAL_IDENTITY_PATTERN =
  /^(who\s+are\s+you|what\s+is\s+vizra|what\s+is\s+omnia|who\s+created\s+you|who\s+made\s+vizra|who\s+built\s+omnia|are\s+you\s+an?\s+ai)\b/i;

const DOCUMENT_REFERENCE_PATTERN =
  /\b(this\s+(file|document|doc|pdf|csv|sheet|code|snippet|image|attachment|upload|report|text)|attached|uploaded|in\s+the\s+(file|document|pdf|csv|attachment|table)|from\s+the\s+(file|document|pdf|attachment))\b/i;

const TRACE_STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'had', 'was',
  'one', 'our', 'out', 'has', 'how', 'who', 'did', 'its', 'say', 'use', 'that', 'with',
  'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'what', 'about',
  'which', 'their', 'there', 'would', 'could', 'should', 'where', 'while', 'does', 'into',
  'also', 'being', 'between', 'both', 'each', 'most', 'other', 'same', 'these', 'those',
  'explain', 'tell', 'please', 'help', 'give', 'main', 'purpose', 'summary', 'summarize',
  'article', 'blog', 'post', 'vizra', 'omnia', 'question', 'answer',
]);

function scrubLogText(input: string, maxLen = 220): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_KEY]')
    .replace(/sk-[0-9A-Za-z_-]{16,}/g, '[REDACTED_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/\b(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, '[REDACTED_PHONE]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * Rewrites short or pronoun-dependent follow-up queries using recent conversation turns
 * so downstream vector, BM25, and web retrieval get full topical context.
 */
export function rewriteQueryWithHistory(
  prompt: string,
  history: HistoryTurn[] = []
): { rewrittenQuery: string; isFollowUp: boolean } {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt || history.length === 0) {
    return { rewrittenQuery: cleanPrompt, isFollowUp: false };
  }

  const wordCount = cleanPrompt.split(/\s+/).length;
  const hasAnaphora = FOLLOW_UP_PATTERN.test(cleanPrompt);
  const isShortFollowUp = wordCount <= 6 && !/^(what\s+is|who\s+is|define)\s+[a-z0-9-]{4,}/i.test(cleanPrompt);
  const isFollowUp = hasAnaphora || isShortFollowUp;

  if (!isFollowUp) {
    return { rewrittenQuery: cleanPrompt, isFollowUp: false };
  }

  // Pull up to the last 2 user turns and the last model turn's opening sentence/title
  const recentTurns = history.slice(-4);
  const contextSnippets: string[] = [];

  for (let i = recentTurns.length - 1; i >= 0; i--) {
    const turn = recentTurns[i];
    if (!turn?.content) continue;
    const text = turn.content.trim();
    if (!text) continue;

    if (turn.role === 'user' && text.toLowerCase() !== cleanPrompt.toLowerCase()) {
      contextSnippets.unshift(text.slice(0, 160));
    } else if (turn.role === 'model' && contextSnippets.length < 2) {
      // Extract only the first sentence / heading to avoid noise
      const firstLine = text.split(/\n/)[0].replace(/^#+\s*/, '').slice(0, 140);
      if (firstLine.length > 15) {
        contextSnippets.push(firstLine);
      }
    }
    if (contextSnippets.length >= 2) break;
  }

  if (contextSnippets.length === 0) {
    return { rewrittenQuery: cleanPrompt, isFollowUp };
  }

  const rewrittenQuery = `${cleanPrompt} ${contextSnippets.join(' ')}`.replace(/\s+/g, ' ').trim().slice(0, 420);
  return { rewrittenQuery, isFollowUp: true };
}

/**
 * Classifies which source layers should be consulted for a given question.
 * Keeps uploaded files, workspace RAG, VIZRA website/blog articles, Google Search,
 * and conversation context cleanly separated.
 */
export function planSourceRetrieval(params: {
  prompt: string;
  rewrittenQuery: string;
  isFollowUp: boolean;
  hasAttachments: boolean;
  hasClientRag: boolean;
  needWebResearch: boolean;
  mode?: string;
  hasHistory: boolean;
}): SourceRetrievalPlan {
  const {
    prompt,
    rewrittenQuery,
    isFollowUp,
    hasAttachments,
    hasClientRag,
    needWebResearch,
    mode,
    hasHistory,
  } = params;

  const lower = prompt.toLowerCase().trim();
  const layers: SourceLayer[] = [];
  const reasons: string[] = [];

  const isPureChatOrCreative =
    PURE_CREATIVE_OR_CHAT_PATTERN.test(lower) && !hasAttachments && !needWebResearch;
  const isInternalIdentity = INTERNAL_IDENTITY_PATTERN.test(lower);
  const explicitBlogIntent = EXPLICIT_BLOG_PATTERN.test(prompt) || EXPLICIT_BLOG_PATTERN.test(rewrittenQuery);
  const isDocumentFocused =
    hasAttachments ||
    mode === 'analyze' ||
    DOCUMENT_REFERENCE_PATTERN.test(lower);

  if (hasAttachments) {
    layers.push('uploaded_files');
    reasons.push('User provided file/media attachments');
  }
  if (hasClientRag) {
    layers.push('workspace_rag');
    reasons.push('Workspace/KB RAG chunks supplied');
  }
  if (hasHistory && isFollowUp) {
    layers.push('conversation_context');
    reasons.push('Conversational follow-up detected');
  }

  // Always check VIZRA published blog knowledge base for non-trivial queries
  // (strict relevance thresholds ensure irrelevant blog chunks are never injected).
  const shouldSearchBlog =
    !isPureChatOrCreative &&
    !isInternalIdentity &&
    !(hasAttachments && DOCUMENT_REFERENCE_PATTERN.test(lower) && !explicitBlogIntent) &&
    rewrittenQuery.trim().length >= 4;

  if (shouldSearchBlog) {
    layers.push('vizra_blog');
    reasons.push(explicitBlogIntent ? 'Explicit VIZRA article/website reference' : 'Candidate check against VIZRA published articles');
  }

  if (!isPureChatOrCreative) {
    layers.push('approved_learning');
  }

  // Decide Google Search grounding cleanly:
  // - Never skip when explicitly requested, mode === 'research', time-sensitive, or factual external question
  // - Skip when purely asking about an uploaded attachment, internal identity, pure creative writing,
  //   or purely asking about a VIZRA blog article without external web intent.
  const explicitWebIntent = EXPLICIT_WEB_SEARCH_PATTERN.test(lower);
  const factualExternalIntent = EXTERNAL_FACTUAL_PATTERN.test(lower);

  let shouldUseWebSearch = false;
  if (mode === 'research' || explicitWebIntent) {
    shouldUseWebSearch = true;
    reasons.push('Explicit web research / time-sensitive query');
  } else if (isPureChatOrCreative || isInternalIdentity) {
    shouldUseWebSearch = false;
  } else if (hasAttachments && DOCUMENT_REFERENCE_PATTERN.test(lower)) {
    shouldUseWebSearch = false;
    reasons.push('Focused on uploaded attachment');
  } else if (explicitBlogIntent && !explicitWebIntent) {
    // Wait until after blog retrieval to see if blog answered it; default false unless blog misses
    shouldUseWebSearch = false;
    reasons.push('Prioritizing VIZRA blog knowledge base before web search');
  } else if (needWebResearch || factualExternalIntent) {
    shouldUseWebSearch = true;
    reasons.push('External/factual query eligible for Google Search grounding');
  }

  if (shouldUseWebSearch) {
    layers.push('google_search');
  }

  return {
    layers,
    shouldSearchBlog,
    explicitBlogIntent,
    shouldUseWebSearch,
    isFollowUp,
    isDocumentFocused,
    reason: reasons.join('; ') || 'Standard conversational query',
  };
}

/**
 * Extracts high-signal keywords from a query for fallback retrieval when the primary search misses.
 */
function extractFallbackKeywordQuery(query: string): string {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !TRACE_STOPWORDS.has(w));
  return Array.from(new Set(words)).slice(0, 8).join(' ');
}

/**
 * Retrieves relevant published VIZRA website/blog articles with:
 * 1. Primary hybrid semantic + BM25 search
 * 2. Fallback relaxed keyword / title-catalog search when explicit article intent or weak first pass
 * 3. Strict relevance filtering (no irrelevant chunks from weak keyword coincidence)
 * 4. Deduplication & source attribution with real `/blog/:slug` URLs
 */
export function retrieveVizraBlogSources(params: {
  originalQuery: string;
  rewrittenQuery: string;
  explicitBlogIntent: boolean;
  topK?: number;
}): RetrievedBlogSourceResult {
  const { originalQuery, rewrittenQuery, explicitBlogIntent, topK = 4 } = params;

  const emptyResult: RetrievedBlogSourceResult = {
    chunks: [],
    contextText: '',
    sources: [],
    usedFallback: false,
    queryUsed: rewrittenQuery,
  };

  // Ensure published articles are indexed
  const publishedArticles = blogKnowledgeBase.getAllPublishedArticles();
  if (publishedArticles.length === 0) {
    return emptyResult;
  }

  // Pass 1: Hybrid search on rewritten query
  let queryUsed = rewrittenQuery;
  let candidates = blogKnowledgeBase.search(rewrittenQuery, {
    topK: Math.max(topK + 2, 6),
    minScore: explicitBlogIntent ? 0.8 : 1.4,
  });
  let usedFallback = false;

  // Pass 2 (Fallback retrieval): If pass 1 returned nothing or weak hits,
  // try extracted high-signal keywords or direct title/slug/topic catalog match.
  const strongPrimary = candidates.filter((c) => c.domainMatchCount >= 1 && c.score >= (explicitBlogIntent ? 1.0 : 2.2));

  if (strongPrimary.length === 0) {
    const keywordQuery = extractFallbackKeywordQuery(rewrittenQuery || originalQuery);
    if (keywordQuery && keywordQuery !== rewrittenQuery.toLowerCase()) {
      const fallbackHits = blogKnowledgeBase.search(keywordQuery, {
        topK: Math.max(topK + 2, 6),
        minScore: explicitBlogIntent ? 0.6 : 1.6,
      });
      if (fallbackHits.length > 0) {
        candidates = fallbackHits;
        queryUsed = keywordQuery;
        usedFallback = true;
      }
    }

    // If still empty and the user explicitly asked about Vizra's blog/articles, match titles/slugs/topics directly
    if (candidates.length === 0 && explicitBlogIntent) {
      const qLower = `${originalQuery} ${rewrittenQuery}`.toLowerCase();
      const matchedArticles = publishedArticles.filter((article) => {
        const titleWords = article.title
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((w) => w.length >= 4 && !TRACE_STOPWORDS.has(w));
        const hits = titleWords.filter((w) => qLower.includes(w));
        return (
          qLower.includes(article.slug.replace(/-/g, ' ')) ||
          qLower.includes(article.title.toLowerCase()) ||
          hits.length >= 1
        );
      });

      const fallbackArticleList =
        matchedArticles.length > 0
          ? matchedArticles.slice(0, 3)
          : /\b(list|all|what\s+articles|which\s+articles|topics|published)\b/i.test(qLower)
            ? publishedArticles.slice(0, 4)
            : [];

      if (fallbackArticleList.length > 0) {
        usedFallback = true;
        candidates = fallbackArticleList.map((article) => ({
          slug: article.slug,
          articleNumber: article.number,
          title: article.title,
          series: article.series,
          category: article.category,
          url: `/blog/${article.slug}`,
          sectionId: 'overview',
          sectionHeading: 'Article Overview',
          chunkType: 'overview' as const,
          text: `${article.title} — ${article.description}. ${article.excerpt}`,
          score: matchedArticles.length > 0 ? 3.0 : 2.0,
          matchedTermCount: 1,
          domainMatchCount: 1,
        }));
      }
    }
  }

  // Strict relevance gate & deduplication:
  // - Require genuine domain term match unless user explicitly asked to list Vizra articles
  // - For non-explicit queries, demand higher confidence (score >= 3.2 and >= 2 matched terms, or >= 4.5 single exact domain match)
  //   so general questions like "capital of France" never pull unrelated AI blog articles!
  const filtered: RetrievedBlogChunk[] = [];
  const seenKeys = new Set<string>();
  const perArticleCounts = new Map<string, number>();

  for (const chunk of candidates) {
    const passesThreshold = explicitBlogIntent
      ? chunk.score >= 0.8 && (chunk.domainMatchCount >= 1 || usedFallback)
      : chunk.domainMatchCount >= 1 &&
        ((chunk.matchedTermCount >= 2 && chunk.score >= 3.2) || chunk.score >= 5.2);

    if (!passesThreshold) continue;

    const dedupeKey = `${chunk.slug}::${chunk.sectionId}`;
    if (seenKeys.has(dedupeKey)) continue;

    const articleCount = perArticleCounts.get(chunk.slug) || 0;
    if (articleCount >= 2) continue;

    seenKeys.add(dedupeKey);
    perArticleCounts.set(chunk.slug, articleCount + 1);
    filtered.push(chunk);

    if (filtered.length >= topK) break;
  }

  if (filtered.length === 0) {
    return { ...emptyResult, usedFallback, queryUsed };
  }

  // Format clean source-grounded context text for the LLM
  const contextBlocks = filtered.map((chunk, idx) => {
    const cleanBody = chunk.text.length > 1800 ? `${chunk.text.slice(0, 1800)}...` : chunk.text;
    return [
      `[VIZRA PUBLISHED ARTICLE #${idx + 1}]`,
      `Title: ${chunk.title}`,
      `URL: ${chunk.url}`,
      `Series: ${chunk.series} | Category: ${chunk.category}`,
      `Section: ${chunk.sectionHeading}`,
      `Relevance Score: ${chunk.score.toFixed(2)}`,
      `Content:\n${cleanBody}`,
    ].join('\n');
  });

  // Deduplicate source attributions by article slug
  const uniqueBySlug = new Map<string, RetrievedBlogChunk>();
  for (const chunk of filtered) {
    if (!uniqueBySlug.has(chunk.slug)) {
      uniqueBySlug.set(chunk.slug, chunk);
    }
  }

  const now = Date.now();
  const sources = Array.from(uniqueBySlug.values()).map((chunk) => {
    const normalizedScore = Math.min(99, Math.max(70, Math.round(70 + chunk.score * 4)));
    const excerpt = chunk.text.replace(/\s+/g, ' ').trim().slice(0, 260);
    return {
      sourceId: `vizra-blog-${chunk.slug}`,
      id: `vizra-blog-${chunk.slug}`,
      title: `${chunk.title} — VIZRA`,
      url: chunk.url,
      domain: 'vizra.ai',
      sourceType: 'document' as const,
      retrievedAt: now,
      relevantExcerpt: excerpt,
      snippet: excerpt,
      claimsSupported: [chunk.sectionHeading],
      priorityCategory: 'official_docs' as const,
      reliability: 'verified' as const,
      isFact: true,
      score: normalizedScore,
      documentId: chunk.slug,
      section: chunk.sectionHeading,
      validationStatus: 'verified' as const,
    };
  });

  return {
    chunks: filtered,
    contextText: contextBlocks.join('\n\n---\n\n'),
    sources,
    usedFallback,
    queryUsed,
  };
}

/**
 * Builds the concise, high-signal source grounding & direct-answer directive injected into /api/chat.
 */
export function buildOmniaGroundingDirective(params: {
  hasAttachments: boolean;
  hasWorkspaceRag: boolean;
  hasVizraBlog: boolean;
  hasApprovedLearning: boolean;
  webSearchInvoked: boolean;
  webSearchFailedFallback: boolean;
  explicitBlogIntent: boolean;
}): string {
  const {
    hasAttachments,
    hasWorkspaceRag,
    hasVizraBlog,
    hasApprovedLearning,
    webSearchInvoked,
    webSearchFailedFallback,
    explicitBlogIntent,
  } = params;

  const activeSources: string[] = [];
  if (hasAttachments) activeSources.push('User-uploaded files/attachments');
  if (hasWorkspaceRag) activeSources.push('Indexed workspace/knowledge-base documents');
  if (hasVizraBlog) activeSources.push('Published VIZRA website/blog articles');
  if (hasApprovedLearning) activeSources.push('Verified Omnia platform knowledge');
  if (webSearchInvoked && !webSearchFailedFallback) activeSources.push('Live Google Search grounding');

  const lines: string[] = [
    '[SOURCE GROUNDING & DIRECT ANSWER PROTOCOL]',
    '1. ANSWER DIRECTLY FIRST: Understand the user\'s actual question and state the direct answer immediately in the opening sentence. Skip generic intros, throat-clearing, and irrelevant background.',
    '2. EXTRACT FROM RETRIEVED SOURCES: When retrieved source content answers the question, base your answer directly on that retrieved content rather than giving generic textbook filler.',
    '3. RESPECT SOURCE SEPARATION: Never confuse uploaded files, workspace documents, published VIZRA blog articles, live web results, and prior conversation turns. Attribute the exact source when citing it (for VIZRA articles, you may reference the title and its `/blog/...` link).',
    '4. INTELLECTUAL HONESTY: If no retrieved source contains the answer to a specific document, article, or unverified factual query, state clearly that the information could not be retrieved from available sources. Never fabricate facts, document quotes, numbers, URLs, or citations. Clearly distinguish retrieved source facts from general model knowledge.',
    `Active source layers for this turn: ${activeSources.length > 0 ? activeSources.join(', ') : 'General model knowledge & conversation context only'}.`,
  ];

  if (explicitBlogIntent && !hasVizraBlog) {
    lines.push(
      'NOTE: The user asked about a VIZRA article or website document, but no matching published VIZRA article was found in the knowledge base. State this honestly instead of inventing article content.'
    );
  }

  if (webSearchFailedFallback) {
    lines.push(
      'NOTE: Live Google Search grounding could not be completed for this request due to upstream search limits. Do NOT claim to have searched the web or invent live URLs/citations. If the question requires live/current data you cannot verify, say so clearly; otherwise answer transparently from general model knowledge or the provided documents.'
    );
  }

  return lines.join('\n');
}

/**
 * Emits a structured server-side retrieval & reliability trace log.
 * Privacy rule: NEVER logs API keys, private user prompts, emails, or raw private documents.
 */
export function emitRetrievalTraceLog(trace: OmniaRetrievalTrace): void {
  const queryHash = crypto
    .createHash('sha256')
    .update(trace.originalQuery || '')
    .digest('hex')
    .slice(0, 12);

  const safePayload = {
    requestId: trace.requestId,
    timestamp: trace.timestamp,
    queryHash,
    queryLength: (trace.originalQuery || '').length,
    rewrittenQueryLength: (trace.rewrittenQuery || '').length,
    queryWasRewritten: trace.rewrittenQuery !== trace.originalQuery,
    isFollowUp: trace.isFollowUp,
    sourcePlan: trace.sourcePlan,
    retrievalProviders: trace.retrievalProviders,
    documentsRetrievedCount: trace.documentsRetrievedCount,
    retrievedDocuments: trace.retrievedDocuments.slice(0, 15).map((doc) => ({
      id: String(doc.id).slice(0, 80),
      provider: doc.provider,
      // Only log public titles (never private uploaded filenames/user doc text)
      ...(doc.provider === 'vizra_blog' || doc.provider === 'google_search' || doc.provider === 'approved_learning'
        ? { title: scrubLogText(doc.title, 100) }
        : {}),
      ...(typeof doc.score === 'number' ? { score: Number(doc.score.toFixed(3)) } : {}),
    })),
    contextStats: trace.contextStats,
    grounding: {
      ...trace.grounding,
      webSearchQueriesCount: trace.grounding.webSearchQueries.length,
      webSearchQueries: undefined,
    },
    generation: trace.generation,
    reliability: trace.reliability,
    errors: trace.errors.slice(0, 8).map((e) => scrubLogText(e, 180)),
  };

  console.info('[Omnia Reliability & Retrieval Trace]', JSON.stringify(safePayload));
}
