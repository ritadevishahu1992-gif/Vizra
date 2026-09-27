export type KnowledgeTier =
  | 'global'
  | 'vizra'
  | 'omnia'
  | 'workspace'
  | 'project';

export type AccessLevel = 'public' | 'workspace' | 'private';

export type SupportedFileType = 'txt' | 'md' | 'pdf' | 'docx' | 'csv' | 'json';

export type SupportedMimeType =
  | 'text/plain'
  | 'text/markdown'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/csv'
  | 'application/json';

export interface RAGChunkMetadata {
  document_id: string;
  chunk_id: string;
  workspace_id: string;
  project_id: string;
  source_type: 'project_file' | 'workspace_doc' | 'vizra_docs' | 'omnia_arch' | 'global_policy';
  file_name: string;
  section: string;
  created_at: string;
  updated_at: string;
  access_level: AccessLevel;
  content_hash: string;
  token_count: number;
}

export interface RAGChunk {
  id: string;
  text: string;
  metadata: RAGChunkMetadata;
  embedding?: number[];
}

export interface RAGDocument {
  id: string;
  title: string;
  file_name: string;
  file_size: number;
  file_type: SupportedFileType;
  mime_type: string;
  tier: KnowledgeTier;
  workspace_id: string;
  project_id: string;
  access_level: AccessLevel;
  created_at: string;
  updated_at: string;
  content_hash: string;
  chunk_count: number;
  token_count: number;
  raw_content: string;
  status: 'indexed' | 'indexing' | 'error';
  errorMessage?: string;
}

export interface RetrievalResult {
  chunk: RAGChunk;
  denseScore: number;
  sparseScore: number;
  hybridScore: number;
  matchedTerms: string[];
  rank: number;
}

export interface GroundingEvaluation {
  isGrounded: boolean;
  confidence: 'high' | 'medium' | 'low' | 'unverified';
  groundingScore: number; // 0 to 100%
  citations: CitationItem[];
  sourcesUsed: number;
  queryTokens: number;
  retrievedTokens: number;
  retrievalLatencyMs?: number;
}

export interface CitationItem {
  id: string;
  documentId: string;
  chunkId: string;
  fileName: string;
  section: string;
  excerpt: string;
  score: number;
  sourceType: string;
  accessLevel?: string;
}

export interface RAGQueryOptions {
  topK?: number;
  minScore?: number;
  workspaceId?: string;
  projectId?: string;
  tiers?: KnowledgeTier[];
  alpha?: number; // Dense vs Sparse weight (default: 0.6)
  tokenBudget?: number; // Default: 2048 tokens
}

export interface IngestionProgress {
  stage: 'idle' | 'validating' | 'extracting' | 'cleaning' | 'chunking' | 'embedding' | 'storing' | 'done' | 'error';
  message: string;
  progressPercent: number;
  chunksGenerated?: number;
  tokensTotal?: number;
}

export interface RAGSystemStats {
  totalDocuments: number;
  totalChunks: number;
  totalTokens: number;
  vectorDimension: number;
  embeddingModel: string;
  chunkConfig: {
    chunkSize: number;
    overlap: number;
    minChunkSize: number;
    maxChunkSize: number;
  };
  lastIndexedAt?: string;
}
