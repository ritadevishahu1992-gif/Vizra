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
  knowledgeApproved: number;
  knowledgeRejected: number;
  conflictsDetected: number;
  errors: string[];
  logs: WorkflowLog[];
}
