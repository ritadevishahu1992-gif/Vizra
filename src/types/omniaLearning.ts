import { KnowledgeTier, AccessLevel } from './rag';

export type LearningSourceType =
  | 'document'
  | 'url'
  | 'documentation'
  | 'internal'
  | 'manual'
  | 'correction'
  | 'dataset'
  | 'connector';

export type LearningStatus =
  | 'PENDING'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'OUTDATED'
  | 'CONFLICTED';

export type TrustLevel =
  | 'verified_internal'
  | 'official_doc'
  | 'trusted_partner'
  | 'user_correction'
  | 'unverified_web';

export type LearningLevel = 1 | 2 | 3 | 4 | 5 | 6;
// Level 1: Basic (Definitions, Facts, Terminology)
// Level 2: Understanding (Relationships, Comparisons, Applications, Mistakes)
// Level 3: Procedural (Steps, Workflows, Methods, I/O)
// Level 4: Logical (Rules, Conditions, Exceptions, Dependencies)
// Level 5: Advanced (Patterns, Cross-topic abstractions, Reusable logic)
// Level 6: Expert (Deep domain rigor from authoritative sources)

export interface HumanizedConcept {
  id: string;
  topic: string;
  subtopic?: string;
  concept: string;
  level: LearningLevel;
  simpleExplanation: string;
  technicalExplanation: string;
  practicalMeaning: string;
  example: string;
  whenToUse: string[];
  whenNotToUse: string[];
  commonMistakes: string[];
  relatedConcepts: string[];
  facts: string[];
  rawKnowledge: string;
  sourceId: string;
  sourceType: LearningSourceType;
  confidence: number;
  status: LearningStatus;
  version: number;
  supersedes?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export type LogicType =
  | 'RULE'
  | 'IF_THEN'
  | 'CAUSE_EFFECT'
  | 'CONDITION_ACTION'
  | 'INPUT_PROCESS_OUTPUT'
  | 'PROCEDURE'
  | 'EXCEPTION'
  | 'DECISION_TREE'
  | 'COMPARISON'
  | 'CONSTRAINT'
  | 'DEPENDENCY'
  | 'PATTERN';

export interface LogicStep {
  step: number;
  title: string;
  action: string;
  expectedOutput?: string;
  onFail?: string;
}

export interface LogicMemoryItem {
  id: string;
  conceptId?: string;
  topic: string;
  logicType: LogicType;
  name: string;
  condition: string;
  action: string;
  exception?: string;
  steps?: LogicStep[];
  inputs?: string[];
  outputs?: string[];
  dependencies?: string[];
  examples?: string[];
  sourceId: string;
  status: LearningStatus;
  confidence: number;
  version: number;
  supersedes?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export type GraphRelationType =
  | 'related_to'
  | 'depends_on'
  | 'causes'
  | 'exception_to'
  | 'implements'
  | 'prerequisite_for'
  | 'conflicts_with'
  | 'subclass_of'
  | 'contrasts_with';

export interface KnowledgeGraphRelation {
  id: string;
  fromConcept: string;
  relationType: GraphRelationType;
  toConcept: string;
  description?: string;
  sourceId: string;
  confidence: number;
  createdAt: string;
}

export interface LearningSource {
  sourceId: string;
  title: string;
  sourceType: LearningSourceType;
  sourceUrl?: string;
  contentHash: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  status: LearningStatus;
  trustLevel: TrustLevel;
  rawContent: string;
  cleanedContent?: string;
  summary?: string;
  chunkCount: number;
  tokenCount: number;
  tier?: KnowledgeTier;
  accessLevel?: AccessLevel;
  workspaceId?: string;
  projectId?: string;
  validationScore?: number;
  validationNotes?: string[];
  extractedConceptsCount?: number;
  extractedRulesCount?: number;
  conflictDetails?: {
    conflictingSourceId: string;
    conflictingTopic: string;
    reason: string;
    detectedAt: string;
  };
}

export type WorkflowStage =
  | 'QUEUED'
  | 'RUNNING'
  | 'PROCESSING'
  | 'UNDERSTANDING'
  | 'HUMANIZING'
  | 'EXTRACTING_CONCEPTS'
  | 'EXTRACTING_LOGIC'
  | 'CHECKING_CONTRADICTIONS'
  | 'VALIDATING'
  | 'INDEXING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING';

export interface WorkflowLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  stage: WorkflowStage;
  message: string;
  sourceId?: string;
  sourceTitle?: string;
  details?: Record<string, any>;
}

export interface LearningMetrics {
  documentsProcessed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  conceptsExtracted: number;
  rulesExtracted: number;
  graphRelationsCount: number;
  knowledgeApproved: number;
  knowledgeRejected: number;
  conflictsDetected: number;
  lastSuccessfulTrainingTime: string | null;
  lastSyncTime: string | null;
  activeStatus: 'Active' | 'Idle' | 'Training' | 'Error';
  failedJobs: number;
}

export type FeedbackType = 'HELPFUL' | 'NOT_HELPFUL' | 'CORRECTION' | 'REPORT';

export interface UserFeedbackItem {
  id: string;
  question: string;
  answer: string;
  retrievedSources?: Array<{
    title: string;
    url?: string;
    score?: number;
  }>;
  userFeedback: FeedbackType;
  correction?: string;
  timestamp: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  sourceCreatedId?: string;
}

export interface OmniaConflictItem {
  id: string;
  sourceAId: string;
  sourceBId: string;
  sourceATitle: string;
  sourceBTitle: string;
  topic: string;
  statementA: string;
  statementB: string;
  detectedAt: string;
  resolutionRule: 'PREFER_NEWER' | 'PREFER_HIGHER_TRUST' | 'MANUAL_REVIEW';
  status: 'UNRESOLVED' | 'RESOLVED_PREFER_A' | 'RESOLVED_PREFER_B' | 'RESOLVED_BOTH_PRESERVED';
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface OmniaReasoningBundle {
  matchedConcepts: HumanizedConcept[];
  matchedRules: LogicMemoryItem[];
  matchedProcedures: LogicMemoryItem[];
  matchedGraphRelations: KnowledgeGraphRelation[];
  conflicts: OmniaConflictItem[];
  reasoningGuidance: string[];
  contextString: string;
  queryIntent?: string;
  domain?: string;
}

export interface TrainingExecutionResult {
  runId: string;
  startedAt: string;
  completedAt: string;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  sourcesEvaluated: number;
  sourcesProcessed: number;
  sourcesSkippedUnchanged: number;
  chunksGenerated: number;
  embeddingsGenerated: number;
  conceptsExtracted: number;
  rulesExtracted: number;
  graphRelationsExtracted: number;
  knowledgeApproved: number;
  knowledgeRejected: number;
  conflictsDetected: number;
  errors: string[];
  logs: WorkflowLog[];
}
