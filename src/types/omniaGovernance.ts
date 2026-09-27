import { KnowledgeTier, AccessLevel, RAGChunk, CitationItem } from './rag';

export type KnowledgeState =
  | 'UNPROCESSED'
  | 'PROCESSING'
  | 'VERIFIED'
  | 'UNCERTAIN'
  | 'CONFLICTED'
  | 'HIGH_CONFIDENCE'
  | 'REJECTED'
  | 'OUTDATED';

export interface SourceScore {
  source_identity: string;
  authority_tier: 'tier_1_official' | 'tier_2_peer_reviewed' | 'tier_3_expert_secondary' | 'tier_4_community_unverified';
  primary_or_secondary: 'primary' | 'secondary';
  pub_date: string;
  independent_confirmation_count: number;
  consistency_flags: string[];
  misinfo_risk_score: number; // 0.0 to 1.0 (lower is safer)
  license_status: 'approved_open' | 'licensed_partner' | 'internal_only' | 'unverified';
}

export interface KnowledgeRecordVersion {
  version: number;
  statement: string;
  verification_date: string;
  confidence: number;
  updated_by: string;
  rationale: string;
}

export interface KnowledgeRecord {
  id: string;
  statement: string;
  topic: string;
  source: string;
  source_type: string;
  pub_date: string;
  verification_date: string;
  evidence: string[];
  confidence: number; // 0.0 to 1.0
  related_concepts: string[];
  contradictions: string[];
  version: number;
  state: KnowledgeState;
  source_score: SourceScore;
  created_at: string;
  updated_at: string;
  history: KnowledgeRecordVersion[];
  project_id?: string;
  workspace_id?: string;
}

export interface ConflictRecord {
  id: string;
  record_ids: string[];
  conflict_type:
    | 'factual_divergence'
    | 'numerical_discrepancy'
    | 'temporal_supersession'
    | 'architectural_variation';
  dates: string[];
  source_quality_comparison: string;
  resolution_state:
    | 'UNRESOLVED'
    | 'RESOLVED_BOTH_STORED'
    | 'RESOLVED_ONE_SUPERSEDED'
    | 'ESCALATED';
  disputing_statements: Array<{
    record_id: string;
    statement: string;
    source: string;
    confidence: number;
  }>;
  notes: string;
  detected_at: string;
  resolved_at?: string;
}

export interface ApprovalDecision {
  id: string;
  candidate_id: string;
  candidate_statement: string;
  candidate_topic: string;
  reviewer_id: string;
  decision: 'approved' | 'rejected' | 'pending' | 'escalated';
  risk_level: 'low' | 'medium' | 'high';
  rationale: string;
  timestamp: string;
}

export interface SafetyCheckpointResult {
  allowed: boolean;
  risk_flags: string[];
  pii_detected: boolean;
  redactions_applied: number;
  policy_version: string;
  checked_at: string;
  audit_entry_id: string;
}

export interface RetrievalBundle {
  knowledge_records: KnowledgeRecord[];
  vector_chunks: RAGChunk[];
  conflicts: ConflictRecord[];
  confidence_summary: {
    overall_confidence: number;
    knowledge_state: KnowledgeState;
    verified_records_count: number;
    has_unresolved_conflicts: boolean;
  };
}

export interface ReasoningTrace {
  trace_id: string;
  session_id: string;
  timestamp: string;
  user_query: string;
  intent: string;
  retrieval_decision: 'retrieval_needed' | 'direct_response' | 'tools_needed';
  retrieval_bundle?: RetrievalBundle;
  safety_check: SafetyCheckpointResult;
  model_id: string;
  latency_ms: number;
  knowledge_state_surfaced: KnowledgeState;
  citations: CitationItem[];
  conflict_ids: string[];
}

export interface EvalReport {
  id: string;
  evaluation_date: string;
  version: string;
  factual_accuracy_score: number; // e.g. 98.4%
  hallucination_rate: number; // e.g. 0.8%
  attribution_recall: number; // e.g. 96.2%
  multilingual_coverage_score: number; // e.g. 92.5%
  safety_pass_rate: number; // e.g. 100%
  status: 'passed' | 'blocked' | 'warning';
  benchmark_name: string;
}
