import { CitationItem, GroundingEvaluation } from './rag';
import { KnowledgeState, ConflictRecord } from './omniaGovernance';

export type AIMode = 'quick' | 'think' | 'research' | 'create' | 'code' | 'analyze' | 'science';

export type AIActionTrigger =
  | 'create_project'
  | 'open_creation_tools'
  | 'connect_integration'
  | 'open_file_upload';

export interface AIModeOption {
  id: AIMode;
  name: string;
  shortDesc: string;
  description: string;
  icon: string;
  badge?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'document' | 'file' | 'audio' | 'csv';
  size?: string;
  previewUrl?: string;
  content?: string; // Text content or parsed CSV/document
}

export type SourceType = 'web' | 'document';

export type SourcePriorityCategory =
  | 'official_docs'
  | 'primary'
  | 'government'
  | 'academic'
  | 'news'
  | 'technical'
  | 'other';

export interface SourceValidationChecks {
  exists: boolean;
  urlValid: boolean;
  domainVerified: boolean;
  contentRetrieved: boolean;
  claimSupported: boolean;
  metadataAuthentic: boolean;
}

export interface VerifiedSource {
  sourceId: string;
  title: string;
  name?: string; // Brand/Site display name, e.g. "OpenAI", "NASA", "GitHub"
  url: string;
  domain: string;
  favicon?: string;
  sourceType: SourceType;
  retrievedAt: number; // Unix timestamp
  relevantExcerpt: string;
  claimsSupported: string[];
  priorityCategory?: SourcePriorityCategory;
  reliability?: 'verified' | 'academic' | 'news' | 'community' | 'official';
  isFact?: boolean;
  score?: number;
  documentId?: string;
  section?: string;
  validationStatus: 'verified' | 'unverified' | 'rejected';
  validationChecks: SourceValidationChecks;
  // For backwards compatibility
  id?: string;
  snippet?: string;
}

export type ResearchSource = VerifiedSource;

export interface SourceValidationGateReport {
  passed: boolean;
  totalEvaluated: number;
  totalVerified: number;
  totalRejected: number;
  rejectionReasons?: string[];
  timestamp: number;
}

export interface ThoughtStep {
  step: number;
  title: string;
  detail: string;
}

export interface SmartSuggestion {
  id: string;
  label: string;
  action: 'prompt' | 'create_project' | 'research' | 'code' | 'summarize';
  promptValue?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  status?: 'sending' | 'streaming' | 'done' | 'error';
  isDemo?: boolean;
  mode?: AIMode;
  thoughtProcess?: ThoughtStep[];
  sources?: VerifiedSource[];
  webSearchQueries?: string[];
  sourceValidationGate?: SourceValidationGateReport;
  suggestions?: SmartSuggestion[];
  canCreateProject?: boolean;
  projectDraft?: Partial<Project>;
  actionTrigger?: AIActionTrigger;
  actionPayload?: any;
  grounding?: GroundingEvaluation;
  citations?: CitationItem[];
  reasoning_trace_id?: string;
  knowledge_state?: KnowledgeState;
  conflicts?: ConflictRecord[];
}

export interface ProjectWorkflowStage {
  id: string;
  index: number;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  content: string;
  updatedAt: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  stageId?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ProjectMemory {
  goal: string;
  targetAudience: string;
  style: string;
  requirements: string[];
  previousDecisions: string[];
  currentProgress: string;
}

export interface Project {
  id: string;
  title: string;
  category: 'video' | 'animation' | 'campaign' | 'app' | 'research' | 'writing' | 'general';
  description: string;
  createdAt: number;
  updatedAt: number;
  stages: ProjectWorkflowStage[];
  memory: ProjectMemory;
  tasks: ProjectTask[];
  notes: string;
  files: Attachment[];
  conversationId?: string;
}

export interface PersonalMemoryItem {
  id: string;
  category: 'language' | 'style' | 'format' | 'preference' | 'workflow';
  content: string;
  createdAt: number;
}

export interface Integration {
  id: string;
  name: string;
  category: 'files' | 'creative' | 'productivity' | 'development' | 'creator';
  icon: string;
  description: string;
  status: 'connected' | 'connect' | 'coming_soon';
  scopeRequired?: string;
  connectedAt?: string;
}

export interface UserPreferences {
  language: 'auto' | 'en' | 'hi' | 'hinglish' | 'es' | 'ja';
  theme: 'pure_black' | 'charcoal';
  defaultMode: AIMode;
  responseStyle: 'concise' | 'detailed' | 'step_by_step' | 'kinetic';
  memoryEnabled: boolean;
  streamSpeed: 'realtime' | 'turbo';
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  group: 'today' | 'yesterday' | 'previous7Days';
  mode?: AIMode;
  projectId?: string;
}

export type OmniaModel = 'omnia-1.0' | 'omnia-creative' | 'omnia-fast';

export interface ModelOption {
  id: OmniaModel;
  name: string;
  badge: string;
  description: string;
  status: 'available' | 'planned';
}

export interface CapabilityItem {
  name: string;
  description: string;
  status: 'available' | 'planned';
}
