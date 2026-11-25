import crypto from 'crypto';
import type { BlogBlock, BlogPost, BlogSection } from '../../data/blog/types';
import { getPublishedBlogPosts } from '../../data/blogPosts';

export interface IndexedArticleChunk {
  chunkId: string;
  slug: string;
  articleNumber: number;
  title: string;
  series: string;
  category: string;
  url: string;
  sectionId: string;
  sectionHeading: string;
  chunkType: 'overview' | 'section' | 'faq' | 'sources';
  text: string;
  tokens: Map<string, number>;
  tokenCount: number;
  headingTokens: Set<string>;
  keywordTokens: Set<string>;
}

export interface RetrievedBlogChunk {
  slug: string;
  articleNumber: number;
  title: string;
  series: string;
  category: string;
  url: string;
  sectionId: string;
  sectionHeading: string;
  chunkType: 'overview' | 'section' | 'faq' | 'sources';
  text: string;
  score: number;
  matchedTermCount: number;
  domainMatchCount: number;
}

export interface ArticleAgentIntent {
  mode: 'general' | 'current_article' | 'blog_corpus' | 'hybrid' | 'web_research';
  useCurrentArticle: boolean;
  useBlogKnowledge: boolean;
  useWebSearch: boolean;
  reason: string;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'had', 'her', 'was',
  'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old',
  'see', 'two', 'way', 'who', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'that',
  'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good',
  'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make',
  'many', 'more', 'only', 'over', 'such', 'take', 'than', 'them', 'well', 'were', 'what',
  'about', 'which', 'their', 'there', 'would', 'could', 'should', 'where', 'while', 'does',
  'into', 'also', 'being', 'between', 'both', 'each', 'most', 'other', 'same', 'these',
  'those', 'through', 'under', 'using', 'used', 'explain', 'tell', 'please', 'help', 'give',
  'article', 'post', 'blog', 'read', 'reading',
]);

/**
 * Semantic concept expansion table so technical synonyms & acronyms retrieve relevant VIZRA monographs.
 */
const SEMANTIC_EXPANSIONS: Record<string, string[]> = {
  ai: ['artificial', 'intelligence', 'symbolic', 'neural', 'agent'],
  ml: ['machine', 'learning', 'supervised', 'unsupervised', 'training'],
  dl: ['deep', 'learning', 'neural', 'network', 'backpropagation'],
  llm: ['large', 'language', 'model', 'foundation', 'transformer', 'attention'],
  llms: ['large', 'language', 'model', 'foundation', 'transformer', 'attention'],
  nlp: ['natural', 'language', 'processing', 'tokenization', 'discourse', 'transformer'],
  cv: ['computer', 'vision', 'convolutional', 'image', 'segmentation', 'detection'],
  cnn: ['convolutional', 'neural', 'computer', 'vision', 'kernel'],
  rnn: ['recurrent', 'sequence', 'lstm', 'transformer'],
  rl: ['reinforcement', 'learning', 'reward', 'policy', 'mdp', 'agent'],
  rlhf: ['reinforcement', 'alignment', 'human', 'feedback', 'policy'],
  agi: ['artificial', 'general', 'intelligence', 'reasoning', 'benchmark'],
  backprop: ['backpropagation', 'gradient', 'descent', 'chain', 'derivative', 'loss'],
  sgd: ['stochastic', 'gradient', 'descent', 'optimization', 'adam'],
  gpu: ['hardware', 'accelerator', 'tpu', 'cuda', 'compute', 'memory', 'bandwidth'],
  tpu: ['hardware', 'accelerator', 'gpu', 'compute', 'matrix'],
  rag: ['retrieval', 'augmented', 'generation', 'context', 'grounding'],
  edge: ['quantization', 'pruning', 'distillation', 'mobile', 'device', 'latency'],
  hallucination: ['hallucinations', 'grounding', 'calibration', 'benchmark', 'evaluation'],
  overfitting: ['generalization', 'regularization', 'variance', 'bias', 'dropout'],
  underfitting: ['generalization', 'bias', 'capacity', 'training'],
  transformer: ['attention', 'self', 'positional', 'foundation', 'llm'],
  transformers: ['attention', 'self', 'positional', 'foundation', 'llm'],
  data: ['dataset', 'pipeline', 'curation', 'cleaning', 'labeling', 'engineering'],
  benchmark: ['evaluation', 'metrics', 'saturation', 'contamination', 'mmlu'],
  quantum: ['neuromorphic', 'photonic', 'future', 'computing', 'hardware'],
};

function normalizeToken(raw: string): string {
  let token = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (token.length > 5 && token.endsWith('ing')) token = token.slice(0, -3);
  else if (token.length > 4 && token.endsWith('ies')) token = `${token.slice(0, -3)}y`;
  else if (token.length > 4 && token.endsWith('es')) token = token.slice(0, -2);
  else if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) token = token.slice(0, -1);
  return token;
}

function tokenizeText(input: string, expandSemantics = false): string[] {
  const rawWords = input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2);

  const tokens: string[] = [];
  for (const raw of rawWords) {
    if (STOPWORDS.has(raw)) continue;
    const norm = normalizeToken(raw);
    if (norm.length >= 2 && !STOPWORDS.has(norm)) {
      tokens.push(norm);
    }
    if (expandSemantics) {
      const expanded = SEMANTIC_EXPANSIONS[raw] || SEMANTIC_EXPANSIONS[norm];
      if (expanded) {
        for (const syn of expanded) {
          const synNorm = normalizeToken(syn);
          if (synNorm.length >= 2) tokens.push(synNorm);
        }
      }
    }
  }
  return tokens;
}

function countTermFrequencies(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  return tf;
}

/**
 * Serializes EVERY structured block type (paragraph, list, callout, math, table, code)
 * so the knowledge base understands full article content — never dropping tables or code snippets.
 */
export function serializeBlogBlock(block: BlogBlock): string {
  switch (block.type) {
    case 'paragraph':
      return block.text;
    case 'list':
      return block.items.map((item, idx) => (block.ordered ? `${idx + 1}. ${item}` : `- ${item}`)).join('\n');
    case 'callout':
      return `[${block.title}]: ${block.text}`;
    case 'math':
      return `Formula: ${block.latex}${block.caption ? ` (${block.caption})` : ''}`;
    case 'table': {
      const headerLine = block.headers.join(' | ');
      const rowLines = block.rows.map((r) => r.join(' | ')).join('\n');
      return `${block.caption ? `Table (${block.caption}):\n` : 'Table:\n'}${headerLine}\n${rowLines}`;
    }
    case 'code':
      return `Code (${block.language}${block.caption ? ` — ${block.caption}` : ''}):\n${block.code}`;
    case 'image':
      return block.caption ? `Figure: ${block.caption}` : '';
  }
}

export function serializeBlogSection(section: BlogSection): string {
  const parts = section.blocks.map(serializeBlogBlock).filter(Boolean);
  return `## ${section.heading}\n${parts.join('\n')}`;
}

export function isPublishedArticle(post: BlogPost | undefined | null): post is BlogPost {
  return Boolean(post && post.slug && post.status !== 'draft');
}

/**
 * In-memory, dynamically synchronizable Published Blog Knowledge Base.
 * - Indexes full content of all published VIZRA articles at section granularity.
 * - Excludes unpublished/draft articles strictly.
 * - Supports runtime upsert (publish/update), removal (unpublish/delete), and full resync.
 */
export class BlogKnowledgeBase {
  private articles = new Map<string, BlogPost>();
  private chunks: IndexedArticleChunk[] = [];
  private documentFrequency = new Map<string, number>();
  private avgChunkLength = 120;
  private versionHash = '';
  private lastSyncedAt = new Date().toISOString();

  constructor() {
    this.syncFromSource(getPublishedBlogPosts());
  }

  /**
   * Rebuilds the index strictly from published articles. Any draft article is excluded.
   */
  public syncFromSource(sourcePosts: BlogPost[]): {
    publishedCount: number;
    draftsExcluded: number;
    chunkCount: number;
    versionHash: string;
    lastSyncedAt: string;
  } {
    this.articles.clear();
    let draftsExcluded = 0;

    for (const post of sourcePosts) {
      if (!isPublishedArticle(post)) {
        draftsExcluded++;
        continue;
      }
      this.articles.set(post.slug, post);
    }

    this.rebuildIndex();
    return {
      publishedCount: this.articles.size,
      draftsExcluded,
      chunkCount: this.chunks.length,
      versionHash: this.versionHash,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  /**
   * Synchronizes a newly published or updated article into the live index.
   * If `post.status === 'draft'`, removes it from the index to preserve draft isolation.
   */
  public upsertArticle(post: BlogPost): { action: 'indexed' | 'removed_draft'; slug: string; versionHash: string } {
    const slug = post.slug;
    if (!isPublishedArticle(post)) {
      this.articles.delete(slug);
      this.rebuildIndex();
      return { action: 'removed_draft', slug, versionHash: this.versionHash };
    }

    this.articles.set(slug, post);
    this.rebuildIndex();
    return { action: 'indexed', slug, versionHash: this.versionHash };
  }

  /**
   * Removes an unpublished or deleted article immediately from the live index.
   */
  public removeArticle(slug: string): { removed: boolean; slug: string; versionHash: string } {
    const removed = this.articles.delete(slug);
    if (removed) {
      this.rebuildIndex();
    }
    return { removed, slug, versionHash: this.versionHash };
  }

  public getPublishedArticle(slug?: string): BlogPost | undefined {
    if (!slug) return undefined;
    const found = this.articles.get(slug.trim());
    return isPublishedArticle(found) ? found : undefined;
  }

  public getAllPublishedArticles(): BlogPost[] {
    return Array.from(this.articles.values()).sort((a, b) => a.number - b.number);
  }

  public getStatus(): {
    publishedArticleCount: number;
    indexedChunkCount: number;
    versionHash: string;
    lastSyncedAt: string;
    draftIsolationEnforced: true;
  } {
    return {
      publishedArticleCount: this.articles.size,
      indexedChunkCount: this.chunks.length,
      versionHash: this.versionHash,
      lastSyncedAt: this.lastSyncedAt,
      draftIsolationEnforced: true,
    };
  }

  /**
   * Compact catalog index (titles, slugs, categories, keywords) so the model knows
   * what exists across the published VIZRA blog without loading all full articles.
   */
  public getCompactCatalogSummary(): string {
    return this.getAllPublishedArticles()
      .map(
        (p) =>
          `- [#${String(p.number).padStart(2, '0')} ${p.title}](/blog/${p.slug}) — ${p.series} · ${p.category} · Keywords: ${[p.primaryKeyword, ...p.secondaryKeywords.slice(0, 3)].join(', ')}`
      )
      .join('\n');
  }

  /**
   * Builds a rich, complete context dossier for the CURRENT article being read,
   * prioritizing the active reading section (if available) plus all headings and relevant sections
   * without dropping code blocks or tables.
   */
  public buildCurrentArticleDossier(
    post: BlogPost,
    options?: {
      question?: string;
      currentSectionId?: string | null;
      maxChars?: number;
    }
  ): {
    dossier: string;
    matchedCurrentSection: BlogSection | null;
  } {
    const maxChars = options?.maxChars ?? 18000;
    const currentSection = options?.currentSectionId
      ? post.sections.find((s) => s.id === options.currentSectionId) || null
      : null;

    const queryTokens = options?.question ? new Set(tokenizeText(options.question, true)) : new Set<string>();

    // Score each section of the current article so the most relevant sections are never truncated out
    const scoredSections = post.sections.map((sec, idx) => {
      const fullText = serializeBlogSection(sec);
      let relevance = 0;
      if (currentSection && sec.id === currentSection.id) relevance += 50;
      if (queryTokens.size > 0) {
        const secTokens = tokenizeText(`${sec.heading} ${fullText}`, false);
        let hits = 0;
        for (const t of secTokens) {
          if (queryTokens.has(t)) hits++;
        }
        relevance += Math.min(35, hits * 2);
        const headingTokens = tokenizeText(sec.heading, false);
        for (const ht of headingTokens) {
          if (queryTokens.has(ht)) relevance += 8;
        }
      }
      return { sec, idx, fullText, relevance };
    });

    const outlineList = post.sections
      .map((s) => `${s.level === 3 ? '  - ' : '- '}${s.heading} (#${s.id})`)
      .join('\n');

    const headerPart = [
      `ARTICLE ID: article-${String(post.number).padStart(2, '0')} (slug: ${post.slug})`,
      `TITLE: ${post.title}`,
      `URL: /blog/${post.slug}`,
      `SERIES: ${post.series} · CATEGORY: ${post.category} · PUBLISHED: ${post.publishedAt}${post.updatedAt ? ` · UPDATED: ${post.updatedAt}` : ''}`,
      `AUTHOR: ${post.author} (${post.authorRole})`,
      `EXCERPT: ${post.excerpt}`,
      currentSection ? `READER CURRENTLY VIEWING SECTION: "${currentSection.heading}" (#${currentSection.id})` : '',
      `KEY TAKEAWAYS:\n${post.keyTakeaways.map((k) => `- ${k}`).join('\n')}`,
      `ARTICLE OUTLINE (ALL SECTIONS):\n${outlineList}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    // Prioritize high-relevance sections with generous budget, then preserve document order
    const topPriorityIds = new Set(
      [...scoredSections]
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5)
        .map((item) => item.sec.id)
    );

    let remainingBudget = Math.max(4000, maxChars - headerPart.length - 2500);
    const sectionSnippets: string[] = [];

    for (const item of scoredSections) {
      const perSecCap = topPriorityIds.has(item.sec.id) ? 2600 : 1200;
      const snippet = item.fullText.slice(0, Math.min(perSecCap, remainingBudget));
      if (snippet.length > 0) {
        sectionSnippets.push(snippet);
        remainingBudget -= snippet.length;
      }
      if (remainingBudget <= 200) break;
    }

    const faqPart = post.faqs
      .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n')
      .slice(0, 2200);

    const sourcesPart = post.sources
      .slice(0, 20)
      .map((s) => `[${s.id}] ${s.title}${s.venue ? ` (${s.venue})` : ''}${s.url ? ` — ${s.url}` : ''}`)
      .join('\n');

    const dossier = [
      headerPart,
      `FULL ARTICLE SECTIONS:\n${sectionSnippets.join('\n\n')}`,
      faqPart ? `ARTICLE FAQS:\n${faqPart}` : '',
      sourcesPart ? `ARTICLE PRIMARY REFERENCES:\n${sourcesPart}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      dossier: dossier.slice(0, maxChars + 2500),
      matchedCurrentSection: currentSection,
    };
  }

  /**
   * Hybrid BM25 + semantic expansion + heading/keyword retrieval across all published VIZRA articles.
   */
  public search(
    query: string,
    options?: {
      topK?: number;
      excludeSlug?: string;
      minScore?: number;
      maxPerArticle?: number;
    }
  ): RetrievedBlogChunk[] {
    const topK = options?.topK ?? 6;
    const minScore = options?.minScore ?? 1.8;
    const maxPerArticle = options?.maxPerArticle ?? 2;

    const queryLower = query.toLowerCase();
    const rawTokens = tokenizeText(query, false);
    const expandedTokens = tokenizeText(query, true);

    if (expandedTokens.length === 0 || this.chunks.length === 0) {
      return [];
    }

    const rawTokenSet = new Set(rawTokens);
    const uniqueQueryTokens = Array.from(new Set(expandedTokens));
    const totalDocs = this.chunks.length;
    const k1 = 1.5;
    const b = 0.72;

    const scored: RetrievedBlogChunk[] = [];

    for (const chunk of this.chunks) {
      if (options?.excludeSlug && chunk.slug === options.excludeSlug) continue;

      let score = 0;
      let directHits = 0;
      let domainHits = 0;

      for (const qt of uniqueQueryTokens) {
        const tf = chunk.tokens.get(qt) || 0;
        if (tf === 0) continue;

        const df = this.documentFrequency.get(qt) || 1;
        const idf = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5));
        const bm25 = (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (chunk.tokenCount / this.avgChunkLength)));

        const isDirect = rawTokenSet.has(qt);
        const weight = isDirect ? 1.0 : 0.42;
        score += bm25 * weight;

        if (isDirect) {
          directHits++;
          const inHeading = chunk.headingTokens.has(qt);
          const inKeyword = chunk.keywordTokens.has(qt);
          if (inHeading) score += 1.45;
          if (inKeyword) score += 1.2;
          if (inHeading || inKeyword) domainHits++;
        }
      }

      // Exact phrase bonus on title or section heading
      if (queryLower.length >= 6) {
        if (chunk.title.toLowerCase().includes(queryLower)) score += 5.0;
        if (chunk.sectionHeading.toLowerCase().includes(queryLower)) score += 3.5;
      }

      // Multi-term coverage boost
      if (rawTokenSet.size >= 2 && directHits >= 2) {
        score *= 1 + Math.min(0.45, (directHits / rawTokenSet.size) * 0.45);
      }

      if (score >= minScore) {
        scored.push({
          slug: chunk.slug,
          articleNumber: chunk.articleNumber,
          title: chunk.title,
          series: chunk.series,
          category: chunk.category,
          url: chunk.url,
          sectionId: chunk.sectionId,
          sectionHeading: chunk.sectionHeading,
          chunkType: chunk.chunkType,
          text: chunk.text,
          score: Number(score.toFixed(3)),
          matchedTermCount: directHits,
          domainMatchCount: domainHits,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    // Enforce article diversity so multi-article questions synthesize across multiple articles
    const perArticleCounts = new Map<string, number>();
    const results: RetrievedBlogChunk[] = [];
    for (const hit of scored) {
      const count = perArticleCounts.get(hit.slug) || 0;
      if (count >= maxPerArticle) continue;
      perArticleCounts.set(hit.slug, count + 1);
      results.push(hit);
      if (results.length >= topK) break;
    }

    return results;
  }

  private rebuildIndex(): void {
    const nextChunks: IndexedArticleChunk[] = [];
    const nextDf = new Map<string, number>();
    let totalTokenLen = 0;

    const hashBuilder = crypto.createHash('sha256');

    for (const post of this.getAllPublishedArticles()) {
      hashBuilder.update(`${post.slug}:${post.updatedAt || post.publishedAt}:${post.title}:${post.sections.length}|`);
      const url = `/blog/${post.slug}`;
      const keywordTokens = new Set(
        tokenizeText([post.title, post.primaryKeyword, ...post.secondaryKeywords, post.category, post.series].join(' '), false)
      );

      const pushChunk = (
        chunkId: string,
        sectionId: string,
        sectionHeading: string,
        chunkType: IndexedArticleChunk['chunkType'],
        rawText: string
      ) => {
        const cleanText = rawText.trim();
        if (!cleanText) return;
        const tokens = tokenizeText(`${post.title} ${sectionHeading} ${cleanText}`, false);
        const tf = countTermFrequencies(tokens);
        const headingTokens = new Set(tokenizeText(`${post.title} ${sectionHeading}`, false));

        for (const uniqueTerm of tf.keys()) {
          nextDf.set(uniqueTerm, (nextDf.get(uniqueTerm) || 0) + 1);
        }

        totalTokenLen += tokens.length;
        nextChunks.push({
          chunkId,
          slug: post.slug,
          articleNumber: post.number,
          title: post.title,
          series: post.series,
          category: post.category,
          url,
          sectionId,
          sectionHeading,
          chunkType,
          text: cleanText.slice(0, 2600),
          tokens: tf,
          tokenCount: Math.max(1, tokens.length),
          headingTokens,
          keywordTokens,
        });
      };

      // Overview chunk (Title + Excerpt + Key Takeaways)
      pushChunk(
        `${post.slug}::overview`,
        'overview',
        'Overview & Key Takeaways',
        'overview',
        `${post.title}\n${post.excerpt}\nKey Takeaways:\n${post.keyTakeaways.map((k) => `- ${k}`).join('\n')}`
      );

      // Every section (including paragraphs, lists, math, tables, code, callouts)
      for (const sec of post.sections) {
        pushChunk(`${post.slug}::sec::${sec.id}`, sec.id, sec.heading, 'section', serializeBlogSection(sec));
      }

      // FAQs chunk
      if (post.faqs.length > 0) {
        pushChunk(
          `${post.slug}::faqs`,
          'frequently-asked-questions',
          'Frequently Asked Questions',
          'faq',
          post.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
        );
      }
    }

    this.chunks = nextChunks;
    this.documentFrequency = nextDf;
    this.avgChunkLength = nextChunks.length > 0 ? totalTokenLen / nextChunks.length : 120;
    this.versionHash = hashBuilder.digest('hex').slice(0, 16);
    this.lastSyncedAt = new Date().toISOString();
  }
}

/**
 * Classifies user query intent across the three intelligence pillars:
 * A. General-purpose assistant (coding, debugging, writing, everyday Q&A, math, reasoning)
 * B. VIZRA Blog knowledge base (multi-article retrieval, cross-article synthesis, references)
 * C. Current article intelligence (article-specific explanations, sections, formulas, terminology)
 * Plus live Web Research (Google Search grounding) when external/current info is needed.
 */
export function classifyArticleAgentIntent(params: {
  question: string;
  currentPost?: BlogPost;
  currentSectionHeading?: string | null;
  corpusHits: RetrievedBlogChunk[];
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}): ArticleAgentIntent {
  const q = params.question.trim();
  const qLower = q.toLowerCase();

  // 1. Explicit current-article cues
  const explicitArticleCue =
    /\b(this article|this post|this monograph|this guide|this page|this piece|this section|current section|current article|what am i reading|reading right now|this paragraph|this table|this formula|this equation|this diagram|this code|the author|above|mentioned here|discussed here|explained here|covered here|key takeaways?|summarize this|tl;dr|tldr)\b/i.test(
      q
    );

  // 2. Explicit cross-article / VIZRA blog ecosystem cues
  const explicitBlogCue =
    /\b(vizra|other articles?|related articles?|which articles?|what articles?|blog|series|monographs?|across (?:your|the|vizra) articles?|read next|compare.*articles?|published on vizra|in your blog)\b/i.test(
      q
    );

  // 3. Explicit external / live web research cues
  const explicitWebCue =
    /\b(latest|recent|recently|today|currently|right now|this week|this month|this year|2025|2026|news|breaking|live|stock price|weather|who won|current ceo|release date|latest version|verify online|search the web|web search|real[- ]?world update|state of the art now)\b/i.test(
      q
    );

  // 4. Strong general-purpose / coding / debugging / everyday cues (unrelated to article unless explicitly tied)
  const strongCodingOrEverydayCue =
    /\b(write a (?:python|javascript|typescript|js|ts|sql|bash|react|html|css|java|c\+\+|go|rust)|debug\s+(?:this|my)|fix\s+(?:this|my)\s+(?:\w+\s+)?(?:bug|error|code|function|snippet)|regex|sql query|css grid|flexbox|recipe|workout|travel itinerary|cover letter|email draft|translate to|solve for x|quadratic)\b/i.test(
      q
    ) || /```/.test(q);

  // Check lexical overlap with the current article's title, headings, and keywords
  let currentArticleOverlap = 0;
  if (params.currentPost) {
    const qTokens = tokenizeText(q, false);
    const articleTerms = new Set(
      tokenizeText(
        [
          params.currentPost.title,
          params.currentPost.primaryKeyword,
          ...params.currentPost.secondaryKeywords,
          ...params.currentPost.sections.map((s) => s.heading),
          params.currentSectionHeading || '',
        ].join(' '),
        false
      )
    );
    for (const t of qTokens) {
      if (articleTerms.has(t)) currentArticleOverlap++;
    }
  }

  // Check if a short follow-up refers back to prior conversation about the article
  const isShortFollowUp =
    q.split(/\s+/).length <= 10 &&
    /\b(it|that|this|they|them|more|example|simpler|why|how so|elaborate|expand|go deeper|clarify)\b/i.test(qLower) &&
    Boolean(params.history && params.history.length > 0);

  const qTokensForMatch = tokenizeText(q, false);
  const topHit = params.corpusHits[0];
  const topCorpusScore = topHit?.score ?? 0;
  const topMatchedTerms = topHit?.matchedTermCount ?? 0;
  const topDomainMatches = topHit?.domainMatchCount ?? 0;
  const crossArticleCue = /\b(connect|relate|related|other|next|compare|across|series|more articles|further reading)\b/i.test(qLower);
  const hasStrongBlogMatch =
    topCorpusScore >= 7.0 &&
    topDomainMatches >= 1 &&
    (qTokensForMatch.length <= 2 ? topMatchedTerms >= 1 : topMatchedTerms >= 2);

  const useCurrentArticle = Boolean(
    params.currentPost &&
      (explicitArticleCue ||
        isShortFollowUp ||
        (!strongCodingOrEverydayCue && currentArticleOverlap >= 2) ||
        (explicitBlogCue && params.currentPost))
  );

  const useBlogKnowledge = Boolean(
    explicitBlogCue ||
      (useCurrentArticle && crossArticleCue) ||
      (!explicitArticleCue && !strongCodingOrEverydayCue && !explicitWebCue && hasStrongBlogMatch)
  );

  const useWebSearch = Boolean(
    explicitWebCue ||
      (!useCurrentArticle && !useBlogKnowledge && /\b(who is|when did|what happened|latest|benchmark|paper|release|price|population|capital of)\b/i.test(qLower))
  );

  if (useCurrentArticle && (useBlogKnowledge || useWebSearch)) {
    return {
      mode: 'hybrid',
      useCurrentArticle: true,
      useBlogKnowledge,
      useWebSearch,
      reason: 'Combines current article context with broader VIZRA knowledge or live web verification.',
    };
  }

  if (useCurrentArticle) {
    return {
      mode: 'current_article',
      useCurrentArticle: true,
      useBlogKnowledge: false,
      useWebSearch: false,
      reason: 'Grounded primarily in the article currently being read.',
    };
  }

  if (useBlogKnowledge) {
    return {
      mode: 'blog_corpus',
      useCurrentArticle: false,
      useBlogKnowledge: true,
      useWebSearch,
      reason: 'Retrieves relevant sections across published VIZRA blog articles.',
    };
  }

  if (useWebSearch) {
    return {
      mode: 'web_research',
      useCurrentArticle: false,
      useBlogKnowledge: false,
      useWebSearch: true,
      reason: 'Uses live web research grounding for current or external factual verification.',
    };
  }

  return {
    mode: 'general',
    useCurrentArticle: false,
    useBlogKnowledge: false,
    useWebSearch: false,
    reason: 'General-purpose AI assistance (coding, reasoning, writing, education, or everyday query).',
  };
}

export const blogKnowledgeBase = new BlogKnowledgeBase();
