import { AIMode, Message, Project } from './ai';
import { UserIntent } from '../services/aiService';

/**
 * OMNIA CONTEXTUAL LANGUAGE INTELLIGENCE (CLI)
 * Formal TypeScript Contracts & Internal Interpretation Schema
 */

export type CLILanguageCode = 'english' | 'hindi' | 'hinglish' | 'mixed';

export type CLIScriptType = 'latin' | 'devanagari' | 'mixed' | 'numeric_or_symbol';

export type CLITokenTag =
  | 'en'
  | 'hi_deva'
  | 'hi_latn'
  | 'tech_entity'
  | 'url_or_path'
  | 'code_literal'
  | 'number'
  | 'punctuation';

export interface CLITokenSpan {
  /** Original raw token from user input */
  raw: string;
  /** Canonical normalized token (e.g. "kese" -> "kaise", "kl" -> "kal") */
  normalized: string;
  /** Lowercase form for matching */
  lower: string;
  /** Detected linguistic/functional tag */
  tag: CLITokenTag;
  /** Zero-based token index */
  index: number;
  /** True if token was transliterated or spelling-normalized */
  wasNormalized: boolean;
}

export interface CLILanguageProfile {
  /** Primary detected language category */
  primaryLanguage: CLILanguageCode;
  /** Backward-compatible 3-way label ('english' | 'hindi' | 'hinglish') for existing Omnia callers */
  legacyLanguage: 'english' | 'hindi' | 'hinglish';
  /** Secondary language if code-switching is present */
  secondaryLanguage?: CLILanguageCode;
  /** Detected writing script */
  script: CLIScriptType;
  /** True when user mixes English and Hindi/Hinglish within the same message */
  isCodeSwitched: boolean;
  /** Confidence in language classification [0.0 - 1.0] */
  confidence: number;
  /** Original raw input string */
  rawText: string;
  /** Canonical normalized text with Hinglish spelling variants standardized */
  normalizedText: string;
  /** English semantic gloss of Roman Hindi functional markers when applicable */
  semanticGlossText: string;
  /** Token-level breakdown */
  tokens: CLITokenSpan[];
  /** Preserved technical/domain entities that must not be altered */
  preservedEntities: string[];
}

export type CLIAmbiguityCategory =
  | 'lexical_polysemy'
  | 'homonym'
  | 'referential_pronoun'
  | 'temporal_bidirectional'
  | 'underspecified_intent'
  | 'contradictory_constraint'
  | 'pragmatic_idiom';

export interface CLICandidateSense {
  senseId: string;
  meaning: string;
  domain: string;
  score: number;
  matchedCues: string[];
}

export interface CLIAmbiguityItem {
  term: string;
  category: CLIAmbiguityCategory;
  isResolved: boolean;
  selectedSense?: CLICandidateSense;
  candidateSenses: CLICandidateSense[];
  ambiguityScore: number; // [0.0 = completely clear, 1.0 = maximally ambiguous]
}

export interface CLIResolvedReference {
  /** Pronoun or deictic phrase in current turn (e.g., "it", "this", "woh", "iska", "usme") */
  referringExpression: string;
  /** Resolved entity or topic from conversation history or active project */
  resolvedTarget: string;
  /** Source of resolution */
  source: 'conversation_history' | 'active_project' | 'intra_sentence';
  /** Turn ID or project ID where the target was found */
  sourceId?: string;
  /** Confidence in coreference resolution [0.0 - 1.0] */
  confidence: number;
}

export interface CLIResolvedTemporal {
  /** Original temporal token or phrase (e.g., "kal", "parso", "aaj", "tomorrow") */
  expression: string;
  /** Disambiguated direction */
  direction: 'past' | 'present' | 'future' | 'unspecified';
  /** Normalized English meaning (e.g., "yesterday", "tomorrow", "day after tomorrow") */
  resolvedMeaning: string;
  /** ISO date string (YYYY-MM-DD) in user's local timezone when resolvable */
  resolvedIsoDate?: string;
  /** User's detected IANA timezone */
  timeZone: string;
  /** Grammatical or contextual cue used (e.g., "past tense auxiliary 'tha'", "future verb 'jaana hai'") */
  grammaticalCue: string;
  /** Confidence [0.0 - 1.0] */
  confidence: number;
}

export interface CLIPragmaticCue {
  /** Matched idiom, slang, or pragmatic expression */
  expression: string;
  /** Non-literal intended meaning */
  intendedMeaning: string;
  /** Suggested assistant tone/action adjustment */
  recommendedAdjustment: string;
}

export interface CLISemanticFrame {
  actor?: string;
  action?: string;
  targetObject?: string;
  modifiers: string[];
  constraints: string[];
}

export type CLIActionPolicy =
  | 'DIRECT_EXECUTE'
  | 'ASSUME_AND_PROCEED'
  | 'ASK_CLARIFICATION';

export interface CLIClarificationDecision {
  /** Calibrated overall interpretation confidence [0.0 - 1.0] */
  overallConfidence: number;
  /** Selected action policy based on calibrated thresholds */
  actionPolicy: CLIActionPolicy;
  /** True only when overallConfidence < 0.55 and clarification is genuinely needed */
  shouldClarify: boolean;
  /** Stated assumption when 0.55 <= overallConfidence < 0.80 */
  statedAssumption?: string;
  /** Concise, natural 1-sentence clarification question in the user's language */
  clarificationQuestion?: string;
  /** Reason for the confidence score */
  rationale: string;
}

export interface CLIInterpretationOptions {
  mode?: AIMode;
  activeProject?: Project | null;
  timeZone?: string;
  referenceTimestamp?: number;
}

/**
 * Master Internal Interpretation Contract produced by OMNIA CLI
 */
export interface CLIInterpretationContract {
  contractVersion: '1.0.0';
  timestamp: string;
  processingLatencyMs: number;
  languageProfile: CLILanguageProfile;
  primaryIntent: UserIntent;
  secondaryIntent?: UserIntent;
  ambiguities: CLIAmbiguityItem[];
  resolvedReferences: CLIResolvedReference[];
  resolvedTemporals: CLIResolvedTemporal[];
  pragmaticCues: CLIPragmaticCue[];
  semanticFrame: CLISemanticFrame;
  clarificationDecision: CLIClarificationDecision;
  /** Compact, sanitized context block ready for injection into Gemini system/RAG context */
  enrichedPromptContext: string;
}
