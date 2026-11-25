import type { BlogPost, BlogSection } from '../data/blog/types';

export interface ArticleSuggestion {
  id: string;
  label: string;
  prompt: string;
  kind: 'section' | 'concept' | 'terminology' | 'limitations' | 'cross_article';
}

/**
 * Strips section numbering prefixes like "1. ", "2.3 ", "Section 4: " for cleaner natural phrasing.
 */
function cleanHeadingLabel(heading: string): string {
  return heading
    .replace(/^(?:section\s+)?\d+(?:\.\d+)*[:.)\-\s]+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncates long phrases cleanly on word boundaries without mid-word breaks.
 */
function concisePhrase(text: string, maxLen = 58): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  const slice = cleaned.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > maxLen * 0.55 ? slice.slice(0, lastSpace) : slice).replace(/[,:;—\-]+$/, '')}…`;
}

/**
 * Extracts concrete domain terms present in the article (backticks, bold terms, secondary keywords).
 */
function extractKeyTermsFromPost(post: BlogPost): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  const pushTerm = (raw: string) => {
    const cleaned = raw.trim().replace(/^[`"']+|[`"']+$/g, '');
    if (cleaned.length < 3 || cleaned.length > 44) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    terms.push(cleaned);
  };

  if (post.primaryKeyword) pushTerm(post.primaryKeyword);
  for (const kw of post.secondaryKeywords || []) {
    pushTerm(kw);
  }

  for (const sec of post.sections) {
    for (const blk of sec.blocks) {
      if (blk.type === 'paragraph' || blk.type === 'callout') {
        const boldMatches = blk.text.matchAll(/\*\*([^*]{3,42})\*\*/g);
        for (const m of boldMatches) {
          if (m[1]) pushTerm(m[1]);
          if (terms.length >= 10) break;
        }
      }
      if (terms.length >= 10) break;
    }
    if (terms.length >= 10) break;
  }

  return terms;
}

/**
 * Finds the most relevant section matching a given regex pattern (e.g., limitations, applications, math, architecture).
 */
function findMatchingSection(sections: BlogSection[], pattern: RegExp): BlogSection | undefined {
  return sections.find((s) => pattern.test(s.heading));
}

/**
 * Dynamically generates 4 concise, non-repetitive, strictly article-specific suggestions
 * directly from the current article's title, headings, blocks, keywords, FAQs, and active section.
 * Never uses generic unrelated templates.
 */
export function generateArticleSuggestions(
  post: BlogPost,
  options?: {
    currentSectionId?: string | null;
    relatedTitles?: string[];
  }
): ArticleSuggestion[] {
  const suggestions: ArticleSuggestion[] = [];
  const usedPrompts = new Set<string>();

  const addSuggestion = (item: ArticleSuggestion) => {
    const normalized = item.prompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!normalized || usedPrompts.has(normalized)) return;
    usedPrompts.add(normalized);
    suggestions.push(item);
  };

  const currentSection = options?.currentSectionId
    ? post.sections.find((s) => s.id === options.currentSectionId)
    : undefined;

  const h2Sections = post.sections.filter((s) => s.level === 2);
  const keyTerms = extractKeyTermsFromPost(post);

  const hasMath = post.sections.some((s) => s.blocks.some((b) => b.type === 'math'));
  const hasCode = post.sections.some((s) => s.blocks.some((b) => b.type === 'code'));
  const hasTable = post.sections.some((s) => s.blocks.some((b) => b.type === 'table'));

  // 1. Active section-aware suggestion (if reader has scrolled into a specific section)
  if (currentSection && currentSection.id !== post.sections[0]?.id) {
    const cleanHeading = concisePhrase(cleanHeadingLabel(currentSection.heading), 52);
    addSuggestion({
      id: `sec-${currentSection.id}`,
      kind: 'section',
      label: `Explain "${cleanHeading}"`,
      prompt: `Break down the "${cleanHeadingLabel(currentSection.heading)}" section of this article in plain terms.`,
    });
  } else if (h2Sections[0]) {
    const coreHeading = concisePhrase(cleanHeadingLabel(h2Sections[0].heading), 52);
    addSuggestion({
      id: `core-${h2Sections[0].id}`,
      kind: 'concept',
      label: `Core concepts: ${coreHeading}`,
      prompt: `What are the main concepts explained in "${post.title}", especially around ${cleanHeadingLabel(h2Sections[0].heading)}?`,
    });
  }

  // 2. Technical terminology, math formula, code, or comparison table drawn directly from this article
  if (hasMath) {
    const mathSec = post.sections.find((s) => s.blocks.some((b) => b.type === 'math'));
    const mathTopic = mathSec ? cleanHeadingLabel(mathSec.heading) : post.primaryKeyword;
    addSuggestion({
      id: 'math-walkthrough',
      kind: 'terminology',
      label: `Walk through the math in ${concisePhrase(mathTopic, 36)}`,
      prompt: `Walk me step-by-step through the mathematical formulas in "${mathTopic}" from this article.`,
    });
  } else if (hasCode) {
    const codeSec = post.sections.find((s) => s.blocks.some((b) => b.type === 'code'));
    const codeTopic = codeSec ? cleanHeadingLabel(codeSec.heading) : post.primaryKeyword;
    addSuggestion({
      id: 'code-walkthrough',
      kind: 'terminology',
      label: `Explain the code in ${concisePhrase(codeTopic, 38)}`,
      prompt: `Explain how the code example in "${codeTopic}" works line by line.`,
    });
  } else if (hasTable) {
    const tableSec = post.sections.find((s) => s.blocks.some((b) => b.type === 'table'));
    const tableTopic = tableSec ? cleanHeadingLabel(tableSec.heading) : post.primaryKeyword;
    addSuggestion({
      id: 'table-comparison',
      kind: 'terminology',
      label: `Compare trade-offs in ${concisePhrase(tableTopic, 36)}`,
      prompt: `Summarize the key trade-offs and comparisons in "${tableTopic}" from this article.`,
    });
  } else if (keyTerms.length >= 2) {
    addSuggestion({
      id: 'key-terms',
      kind: 'terminology',
      label: `Clarify ${concisePhrase(keyTerms[0], 24)} & ${concisePhrase(keyTerms[1], 24)}`,
      prompt: `Clarify the technical terminology in this article, especially ${keyTerms[0]} and ${keyTerms[1]}.`,
    });
  }

  // 3. Limitations, challenges, practical applications, or an authentic article FAQ
  const limitOrAppSec =
    findMatchingSection(
      post.sections,
      /limit|challenge|risk|failure|trade-?off|bottleneck|caveat|safety|bias|hallucinat/i
    ) ||
    findMatchingSection(
      post.sections,
      /applicat|use case|production|real-?world|deploy|industry|practice|engineer/i
    ) ||
    h2Sections[Math.min(2, Math.max(1, h2Sections.length - 1))];

  if (limitOrAppSec && limitOrAppSec.id !== currentSection?.id) {
    const headingClean = cleanHeadingLabel(limitOrAppSec.heading);
    addSuggestion({
      id: `focus-${limitOrAppSec.id}`,
      kind: 'limitations',
      label: concisePhrase(headingClean, 52),
      prompt: `What does this article explain about "${headingClean}" and why does it matter in practice?`,
    });
  } else if (post.faqs[0]?.question) {
    addSuggestion({
      id: 'faq-primary',
      kind: 'concept',
      label: concisePhrase(post.faqs[0].question, 54),
      prompt: post.faqs[0].question,
    });
  }

  // 4. Cross-article connection within the VIZRA blog ecosystem
  const topicAnchor = post.primaryKeyword || concisePhrase(post.title, 42);
  addSuggestion({
    id: 'related-vizra',
    kind: 'cross_article',
    label: `Related VIZRA articles on ${concisePhrase(topicAnchor, 30)}`,
    prompt: `Which other published VIZRA articles connect to "${post.title}" and what should I read next?`,
  });

  // Backfill up to 4 suggestions from remaining article FAQs or headings if any deduplicated
  if (suggestions.length < 4 && post.faqs.length > 0) {
    for (let i = 0; i < post.faqs.length && suggestions.length < 4; i++) {
      const q = post.faqs[i].question;
      addSuggestion({
        id: `faq-${i}`,
        kind: 'concept',
        label: concisePhrase(q, 54),
        prompt: q,
      });
    }
  }

  if (suggestions.length < 4) {
    for (const sec of h2Sections) {
      if (suggestions.length >= 4) break;
      const headingClean = cleanHeadingLabel(sec.heading);
      addSuggestion({
        id: `sec-fill-${sec.id}`,
        kind: 'section',
        label: `Explain ${concisePhrase(headingClean, 44)}`,
        prompt: `Explain the "${headingClean}" section of "${post.title}" with a concrete example.`,
      });
    }
  }

  return suggestions.slice(0, 4);
}
