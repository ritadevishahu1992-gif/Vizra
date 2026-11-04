import {
  CLIInterpretationContract,
  CLIInterpretationOptions,
  CLILanguageProfile,
} from '../../types/cli';
import { Message } from '../../types/ai';
import { classifyUserIntent } from '../aiService';
import { normalizeMultilingualInput } from './languageNormalizer';

/**
 * OMNIA CONTEXTUAL LANGUAGE INTELLIGENCE (CLI) — PHASE 2 ENGINE
 *
 * Phase 2 Scope:
 * - Layer 1: Multilingual, Hinglish & Code-Switching Normalization
 * - Core Interpretation Contract assembly (`CLIInterpretationContract` v1.0.0)
 * - Fast bounded LRU cache (< 2ms execution, zero extra LLM network latency)
 * - Clean extension hooks for Phases 3–5 (WSD, Reference/Temporal Resolution, Clarification)
 */

const CACHE_MAX_ENTRIES = 120;

class OmniaCliEngine {
  private cache: Map<string, CLIInterpretationContract> = new Map();

  /**
   * Executes Layer 1 normalization directly
   */
  public normalizeLanguage(rawInput: string): CLILanguageProfile {
    return normalizeMultilingualInput(rawInput);
  }

  /**
   * Produces a complete CLIInterpretationContract for the given user message
   */
  public interpretMessage(
    rawPrompt: string,
    conversationHistory: Message[] = [],
    options: CLIInterpretationOptions = {}
  ): CLIInterpretationContract {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const safePrompt = typeof rawPrompt === 'string' ? rawPrompt.slice(0, 8000) : '';
    const lastTurnId = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1].id : 'none';
    const cacheKey = `${safePrompt}::${lastTurnId}::${options.mode || 'quick'}::${options.activeProject?.id || 'no_proj'}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Layer 1: Multilingual, Hinglish & Code-Switching Normalization
    const languageProfile = normalizeMultilingualInput(safePrompt);

    // 2. Intent Classification using normalized text to improve Hinglish spelling variant tolerance
    const primaryIntent = classifyUserIntent(
      languageProfile.normalizedText || safePrompt,
      conversationHistory,
      []
    );

    // 3. Build sanitized enriched prompt context block
    const contextLines: string[] = [
      `[OMNIA CLI INTERPRETATION v1.0]`,
      `- Detected Language: ${languageProfile.primaryLanguage}${
        languageProfile.isCodeSwitched ? ' (code-switched with English)' : ''
      }`,
    ];

    if (languageProfile.normalizedText !== languageProfile.rawText.trim()) {
      contextLines.push(`- Canonical Normalized Input: ${languageProfile.normalizedText}`);
    }

    if (languageProfile.preservedEntities.length > 0) {
      contextLines.push(`- Preserved Technical Entities: ${languageProfile.preservedEntities.join(', ')}`);
    }

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const processingLatencyMs = Math.max(0.1, Number((endTime - startTime).toFixed(2)));

    const contract: CLIInterpretationContract = {
      contractVersion: '1.0.0',
      timestamp: new Date(options.referenceTimestamp || Date.now()).toISOString(),
      processingLatencyMs,
      languageProfile,
      primaryIntent,
      ambiguities: [],
      resolvedReferences: [],
      resolvedTemporals: [],
      pragmaticCues: [],
      semanticFrame: {
        modifiers: [],
        constraints: [],
      },
      clarificationDecision: {
        overallConfidence: primaryIntent === 'AMBIGUOUS' ? 0.45 : languageProfile.confidence,
        actionPolicy: primaryIntent === 'AMBIGUOUS' ? 'ASK_CLARIFICATION' : 'DIRECT_EXECUTE',
        shouldClarify: primaryIntent === 'AMBIGUOUS',
        rationale:
          primaryIntent === 'AMBIGUOUS'
            ? 'Short underspecified noun prompt requires intent clarification.'
            : 'Clear intent and normalized multilingual profile.',
      },
      enrichedPromptContext: contextLines.join('\n'),
    };

    // Store in bounded LRU cache
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(cacheKey, contract);

    return contract;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const omniaCliEngine = new OmniaCliEngine();
