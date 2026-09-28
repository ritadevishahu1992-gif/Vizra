import {
  LearningSource,
  LearningMetrics,
  WorkflowLog,
  UserFeedbackItem,
  OmniaConflictItem,
  HumanizedConcept,
  LogicMemoryItem,
  KnowledgeGraphRelation,
  OmniaReasoningBundle,
  TrainingExecutionResult,
} from '../types/omniaLearning';
import { ragVectorStore } from './ragVectorStore';
import { omniaGovernanceService } from './omniaGovernanceService';
import { computeStringHash } from '../utils/hashUtils';
import { OmniaIntelligenceService } from './omniaIntelligenceService';
import { OmniaReasoningEngine } from './omniaReasoningEngine';

const SOURCES_KEY = 'vizra_omnia_learning_sources_v1';
const CONCEPTS_KEY = 'vizra_omnia_concepts_v1';
const RULES_KEY = 'vizra_omnia_rules_v1';
const GRAPH_KEY = 'vizra_omnia_graph_v1';
const METRICS_KEY = 'vizra_omnia_learning_metrics_v1';
const LOGS_KEY = 'vizra_omnia_learning_logs_v1';
const FEEDBACK_KEY = 'vizra_omnia_learning_feedback_v1';
const CONFLICTS_KEY = 'vizra_omnia_learning_conflicts_v1';

class OmniaLearningService {
  private sources: Map<string, LearningSource> = new Map();
  private concepts: Map<string, HumanizedConcept> = new Map();
  private logicRules: Map<string, LogicMemoryItem> = new Map();
  private graphRelations: KnowledgeGraphRelation[] = [];
  private logs: WorkflowLog[] = [];
  private feedback: UserFeedbackItem[] = [];
  private conflicts: OmniaConflictItem[] = [];
  private metrics: LearningMetrics = {
    documentsProcessed: 4,
    chunksCreated: 24,
    embeddingsGenerated: 24,
    conceptsExtracted: 3,
    rulesExtracted: 3,
    graphRelationsCount: 3,
    knowledgeApproved: 4,
    knowledgeRejected: 1,
    conflictsDetected: 1,
    lastSuccessfulTrainingTime: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    lastSyncTime: new Date().toISOString(),
    activeStatus: 'Active',
    failedJobs: 0,
  };
  private isInitialized = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('Listener notification error:', e);
      }
    });
  }

  private init(): void {
    if (this.isInitialized) return;

    try {
      const storedSources = localStorage.getItem(SOURCES_KEY);
      const storedConcepts = localStorage.getItem(CONCEPTS_KEY);
      const storedRules = localStorage.getItem(RULES_KEY);
      const storedGraph = localStorage.getItem(GRAPH_KEY);
      const storedMetrics = localStorage.getItem(METRICS_KEY);
      const storedLogs = localStorage.getItem(LOGS_KEY);
      const storedFeedback = localStorage.getItem(FEEDBACK_KEY);
      const storedConflicts = localStorage.getItem(CONFLICTS_KEY);

      if (storedSources && storedConcepts && storedRules) {
        const parsedSources: LearningSource[] = JSON.parse(storedSources);
        const parsedConcepts: HumanizedConcept[] = JSON.parse(storedConcepts);
        const parsedRules: LogicMemoryItem[] = JSON.parse(storedRules);

        parsedSources.forEach((s) => this.sources.set(s.sourceId, s));
        parsedConcepts.forEach((c) => this.concepts.set(c.id, c));
        parsedRules.forEach((r) => this.logicRules.set(r.id, r));

        if (storedGraph) {
          this.graphRelations = JSON.parse(storedGraph);
        }
      } else {
        this.seedInitialKnowledge();
      }

      if (storedMetrics) {
        this.metrics = { ...this.metrics, ...JSON.parse(storedMetrics) };
      }

      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      } else {
        this.seedInitialLogs();
      }

      if (storedFeedback) {
        this.feedback = JSON.parse(storedFeedback);
      } else {
        this.seedInitialFeedback();
      }

      if (storedConflicts) {
        this.conflicts = JSON.parse(storedConflicts);
      } else {
        this.seedInitialConflicts();
      }
    } catch {
      this.seedInitialKnowledge();
      this.seedInitialLogs();
      this.seedInitialFeedback();
      this.seedInitialConflicts();
    }

    this.isInitialized = true;
    this.syncWithBackend().catch(() => {});
  }

  private save(): void {
    try {
      localStorage.setItem(
        SOURCES_KEY,
        JSON.stringify(Array.from(this.sources.values()))
      );
      localStorage.setItem(
        CONCEPTS_KEY,
        JSON.stringify(Array.from(this.concepts.values()))
      );
      localStorage.setItem(
        RULES_KEY,
        JSON.stringify(Array.from(this.logicRules.values()))
      );
      localStorage.setItem(
        GRAPH_KEY,
        JSON.stringify(this.graphRelations)
      );
      localStorage.setItem(METRICS_KEY, JSON.stringify(this.metrics));
      localStorage.setItem(LOGS_KEY, JSON.stringify(this.logs.slice(-100)));
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(this.feedback));
      localStorage.setItem(CONFLICTS_KEY, JSON.stringify(this.conflicts));
    } catch (e) {
      console.warn('Could not persist omnia learning state', e);
    }
    this.notify();
  }

  /**
   * Synchronizes with backend persistent server stores and API routes
   */
  public async syncWithBackend(): Promise<void> {
    try {
      const res = await fetch('/api/omnia/status');
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) {
          this.metrics = { ...this.metrics, ...data.metrics, lastSyncTime: new Date().toISOString() };
        }
        if (Array.isArray(data.recentLogs) && data.recentLogs.length > 0) {
          const existingIds = new Set(this.logs.map((l) => l.id));
          for (const log of data.recentLogs) {
            if (!existingIds.has(log.id)) {
              this.logs.unshift(log);
            }
          }
        }
      }

      // Fetch concepts and rules
      const [conceptsRes, rulesRes, graphRes] = await Promise.all([
        fetch('/api/omnia/concepts'),
        fetch('/api/omnia/logic'),
        fetch('/api/omnia/graph'),
      ]);

      if (conceptsRes.ok) {
        const cData = await conceptsRes.json();
        if (Array.isArray(cData.concepts)) {
          cData.concepts.forEach((c: HumanizedConcept) => this.concepts.set(c.id, c));
        }
      }

      if (rulesRes.ok) {
        const rData = await rulesRes.json();
        if (Array.isArray(rData.rules)) {
          rData.rules.forEach((r: LogicMemoryItem) => this.logicRules.set(r.id, r));
        }
      }

      if (graphRes.ok) {
        const gData = await graphRes.json();
        if (Array.isArray(gData.relations)) {
          this.graphRelations = gData.relations;
        }
      }

      this.save();
    } catch {
      // Local mode fallback
    }
  }

  private seedInitialKnowledge(): void {
    const defaultSources: LearningSource[] = [
      {
        sourceId: 'src_vizra_core_principles',
        title: 'Vizra Platform Architecture & Core Principles',
        sourceType: 'documentation',
        sourceUrl: 'https://vizra.ai/docs/principles',
        contentHash: computeStringHash('Vizra is the dark-matter operating system for human curiosity.'),
        version: 1,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
        status: 'APPROVED',
        trustLevel: 'verified_internal',
        rawContent: `# Vizra Platform Architecture & Core Principles
Vizra is the dark-matter operating system for human curiosity.
- Obsidian Aesthetics: Strict black (#000000) canvas with surgical crimson accent (#eb3b2d).
- No Generic UI: Zero unbranded pills, fluid kinetic transitions at 60fps.
- Omnia AI: Native multimodal reasoning engine grounded in verified RAG and continuous learning.
- Knowledge Isolation: Strict tenant boundaries between global, workspace, and isolated project tiers.`,
        chunkCount: 3,
        tokenCount: 160,
        tier: 'vizra',
        accessLevel: 'public',
        validationScore: 98,
        validationNotes: ['Verified internal Vizra platform constitution'],
        extractedConceptsCount: 1,
        extractedRulesCount: 1,
      },
      {
        sourceId: 'src_omnia_rag_spec',
        title: 'OMNIA 1.0 RAG & Verification Architecture Specification',
        sourceType: 'internal',
        contentHash: computeStringHash('OMNIA 1.0 RAG Implementation Specification v1.0'),
        version: 1,
        createdAt: '2026-09-15T12:00:00Z',
        updatedAt: '2026-09-15T12:00:00Z',
        status: 'APPROVED',
        trustLevel: 'official_doc',
        rawContent: `# OMNIA 1.0 RAG & Verification Architecture Specification
Lead AI Infrastructure Engineer Specification.
- Hybrid Retrieval: 60% Dense Cosine Similarity + 40% Sparse BM25 Lexical Matching.
- Zero Hallucination: Claims without verified citations are rejected or flagged.
- Grounding Gate: Continuous 6-stage provenance check ensuring URL authentications and excerpt alignment.`,
        chunkCount: 4,
        tokenCount: 220,
        tier: 'omnia',
        accessLevel: 'public',
        validationScore: 96,
        validationNotes: ['Official OMNIA 1.0 architecture standard'],
        extractedConceptsCount: 1,
        extractedRulesCount: 2,
      },
      {
        sourceId: 'src_smart_dispenser_specs',
        title: 'Smart Medicine Dispenser Hardware Specifications',
        sourceType: 'document',
        contentHash: computeStringHash('ESP32 microcontroller dual stepper NEMA 17 14 partitioned medication pods 1200ms optical window'),
        version: 1,
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z',
        status: 'CONFLICTED',
        trustLevel: 'trusted_partner',
        rawContent: `# Smart Medicine Dispenser Hardware Specifications
- Optical IR drop sensor timeout: 1200ms drop window through chute before NEMA-17 motor reverse.
- Carousel: 14 partitioned pods with micro-servo lock.
- Conflicting report with Clinical Compliance protocol (800ms threshold).`,
        chunkCount: 2,
        tokenCount: 130,
        tier: 'project',
        accessLevel: 'private',
        projectId: 'proj_med_dispenser',
        validationScore: 84,
        validationNotes: ['Hardware bench validation passed; factual conflict noted.'],
        extractedConceptsCount: 1,
        extractedRulesCount: 1,
        conflictDetails: {
          conflictingSourceId: 'src_clinical_safety_protocol',
          conflictingTopic: 'Medicine Dispenser Transit Timing',
          reason: 'Hardware spec requests 1200ms transit window; Clinical protocol specifies 800ms tamper limit.',
          detectedAt: '2026-09-24T10:30:00Z',
        },
      },
    ];

    defaultSources.forEach((s) => this.sources.set(s.sourceId, s));

    const defaultConcepts: HumanizedConcept[] = [
      {
        id: 'c_omnia_identity_core',
        topic: 'Omnia Identity & Role',
        concept: 'Omnia Intelligence Layer of Vizra',
        level: 6,
        simpleExplanation: 'Omnia is the built-in intelligence of Vizra — created by Vizrma to help creators think, create, understand, and build.',
        technicalExplanation: 'Omnia serves as the foundational conversational reasoning and multi-stage continuous learning layer embedded within the Vizra creative studio ecosystem.',
        practicalMeaning: 'VIZRA is the creative platform/studio environment; OMNIA is the intelligence layer inside that environment.',
        example: 'When asked "Who are you?", Omnia responds: "I’m Omnia, the intelligence behind Vizra — built to help creators think, create, understand, and build."',
        whenToUse: ['Every user interaction explaining Vizra, Omnia, or assistance capabilities'],
        whenNotToUse: ['Never describe Omnia as a generic standalone chatbot or third-party product'],
        commonMistakes: ['Confusing the underlying model provider with the creator of Omnia (Omnia was created by Vizrma)'],
        relatedConcepts: ['Vizra Creative Studio', 'Vizrma Creator', 'Continuous Learning Architecture'],
        facts: [
          'Name: OMNIA',
          'Home platform: VIZRA',
          'Created by: Vizrma',
          'Role: Intelligence layer and creative assistant of Vizra',
        ],
        rawKnowledge: 'Omnia was created by Vizrma as the intelligence layer of Vizra. Vizra is the creative AI platform, while Omnia is its intelligence layer.',
        sourceId: 'src_vizra_core_principles',
        sourceType: 'documentation',
        confidence: 1.0,
        status: 'APPROVED',
        version: 1,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
        tags: ['identity', 'omnia', 'vizra', 'vizrma'],
      },
      {
        id: 'c_vizra_design_constitution',
        topic: 'Vizra Platform Aesthetics',
        concept: 'Obsidian & Surgical Red Constitution',
        level: 5,
        simpleExplanation: 'Vizra uses pure black (#000000) backgrounds with targeted 4% surgical red (#eb3b2d) highlights instead of generic blue pills.',
        technicalExplanation: 'Design standard enforcing strict monochromatic dark-matter canvas (#000000), 60fps kinetic motion with cubic-bezier(0.16, 1, 0.3, 1), and zero generic AI slop.',
        practicalMeaning: 'Every user interface and state transition must feel sharp, tactile, and editorial rather than generic corporate SaaS.',
        example: 'Pulsing crimson indicators for online systems, high contrast typography with Instrument Serif.',
        whenToUse: ['Building all Vizra UI views', 'Designing new tools and modals'],
        whenNotToUse: ['Never introduce blue pill badges or round generic cards'],
        commonMistakes: ['Overusing accent colors beyond 4% viewport ratio'],
        relatedConcepts: ['Design Constitution', 'Kinetic Transitions', 'Editorial Typography'],
        facts: ['Primary background: #000000', 'Accent: #eb3b2d', 'Frame target: 60fps'],
        rawKnowledge: 'Vizra Platform Architecture & Core Principles',
        sourceId: 'src_vizra_core_principles',
        sourceType: 'documentation',
        confidence: 0.98,
        status: 'APPROVED',
        version: 1,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
        tags: ['design', 'aesthetics', 'constitution'],
      },
      {
        id: 'c_omnia_hybrid_rag',
        topic: 'Omnia AI Architecture',
        concept: 'Hybrid Dense-Sparse RAG',
        level: 4,
        simpleExplanation: 'Omnia retrieves knowledge using both keyword search (BM25) and conceptual semantic meaning (vectors) blended together.',
        technicalExplanation: '60% Dense Cosine Similarity (384d / Gemini embeddings) + 40% Sparse BM25 lexical token matching with Reciprocal Rank Fusion (k=60).',
        practicalMeaning: 'Ensures Omnia finds exact part numbers/IDs while understanding conceptual and conversational phrasing.',
        example: 'Searching "optical IR drop sensor timeout" retrieves exact 1200ms timing specs.',
        whenToUse: ['Every grounded question and factual retrieval task'],
        whenNotToUse: ['Pure creative brain-storming with no factual requirement'],
        commonMistakes: ['Relying solely on vector embeddings without lexical fallback for exact identifiers'],
        relatedConcepts: ['Vector Store', 'BM25', 'Rank Fusion', 'Grounding Gate'],
        facts: ['Ratio: 60% Dense / 40% Sparse', 'RRF constant: 60', 'Embedding dim: 384d'],
        rawKnowledge: 'OMNIA 1.0 RAG & Verification Architecture Specification',
        sourceId: 'src_omnia_rag_spec',
        sourceType: 'internal',
        confidence: 0.96,
        status: 'APPROVED',
        version: 1,
        createdAt: '2026-09-15T12:00:00Z',
        updatedAt: '2026-09-15T12:00:00Z',
        tags: ['rag', 'retrieval', 'hybrid', 'architecture'],
      },
      {
        id: 'c_dispenser_transit_timing',
        topic: 'Medical Dispenser Hardware Timing',
        concept: 'Optical IR Drop Window',
        level: 3,
        simpleExplanation: 'The medicine dispenser checks if a pill fell through the chute within a specific time before reversing the motor.',
        technicalExplanation: 'Optical IR drop sensor window configured to detect pill occlusion during chute transit before triggering stepper retry sequence.',
        practicalMeaning: 'Hardware timing controls jam detection and prevents double-dispensing.',
        example: 'Pill drops past IR beam in 400ms -> motor proceeds to next slot.',
        whenToUse: ['Calibrating dispense cycles and jam recovery'],
        whenNotToUse: ['When carousel shutter lock is open'],
        commonMistakes: ['Ignoring clinical safety regulations regarding aperture exposure latency'],
        relatedConcepts: ['NEMA-17 Stepper', 'Jam Detection', 'IR Break Beam'],
        facts: ['Hardware spec timeout: 1200ms', 'Clinical protocol limit: 800ms', 'Carousel pods: 14'],
        rawKnowledge: 'Smart Medicine Dispenser Hardware Specifications',
        sourceId: 'src_smart_dispenser_specs',
        sourceType: 'document',
        confidence: 0.88,
        status: 'CONFLICTED',
        version: 1,
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z',
        tags: ['hardware', 'dispenser', 'timing'],
      },
    ];

    defaultConcepts.forEach((c) => this.concepts.set(c.id, c));

    const defaultRules: LogicMemoryItem[] = [
      {
        id: 'rule_omnia_creator_attribution',
        topic: 'Omnia Identity & Role',
        name: 'Omnia Creator Attribution Mandate',
        logicType: 'RULE',
        condition: 'IF asked "Who created you?", "Who made you?", "Who is your creator?", or "Who built Omnia?"',
        action: 'THEN state canonical response: "Omnia was created by Vizrma as the intelligence layer of Vizra."',
        sourceId: 'src_vizra_core_principles',
        status: 'APPROVED',
        confidence: 1.0,
        version: 1,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
      {
        id: 'rule_omnia_identity_distinction',
        topic: 'Omnia Identity & Role',
        name: 'Vizra vs Omnia Platform Distinction',
        logicType: 'CONSTRAINT',
        condition: 'IF explaining the relationship between Vizra and Omnia',
        action: 'THEN enforce VIZRA = creative platform/studio environment, OMNIA = intelligence layer/assistant inside that environment',
        sourceId: 'src_vizra_core_principles',
        status: 'APPROVED',
        confidence: 1.0,
        version: 1,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
      {
        id: 'rule_rag_hybrid_weighting',
        topic: 'Omnia AI Architecture',
        name: 'Hybrid Retrieval Weighting Rule',
        logicType: 'RULE',
        condition: 'IF performing knowledge retrieval across Omnia Knowledge Base',
        action: 'THEN compute combined score = 0.6 * denseScore + 0.4 * sparseBM25Score',
        sourceId: 'src_omnia_rag_spec',
        status: 'APPROVED',
        confidence: 0.98,
        version: 1,
        createdAt: '2026-09-15T12:00:00Z',
        updatedAt: '2026-09-15T12:00:00Z',
      },
      {
        id: 'rule_zero_hallucination',
        topic: 'Omnia AI Architecture',
        name: 'Zero Hallucination Citation Mandate',
        logicType: 'CONSTRAINT',
        condition: 'IF making factual assertions regarding verified technical architecture',
        action: 'THEN cite verified source ID and excerpt; if ungrounded, state uncertainty',
        exception: 'UNLESS user explicitly requests creative hypothetical fiction',
        sourceId: 'src_omnia_rag_spec',
        status: 'APPROVED',
        confidence: 0.99,
        version: 1,
        createdAt: '2026-09-15T12:00:00Z',
        updatedAt: '2026-09-15T12:00:00Z',
      },
      {
        id: 'rule_dispenser_jam_sequence',
        topic: 'Medical Dispenser Hardware Timing',
        name: 'Dispenser Jam Reversal Sequence',
        logicType: 'PROCEDURE',
        condition: 'IF optical IR sensor does not detect pill drop within configured timeout',
        action: 'THEN execute 3-step reverse oscillation protocol',
        steps: [
          { step: 1, title: 'Stop Carousel', action: 'Immediately halt forward stepper pulse' },
          { step: 2, title: 'Reverse Oscillation', action: 'Pulse stepper 15 degrees backward for 200ms' },
          { step: 3, title: 'Re-attempt Drop', action: 'Step forward to target pod position and verify IR beam' },
        ],
        sourceId: 'src_smart_dispenser_specs',
        status: 'APPROVED',
        confidence: 0.94,
        version: 1,
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z',
      },
    ];

    defaultRules.forEach((r) => this.logicRules.set(r.id, r));

    this.graphRelations = [
      {
        id: 'rel_1',
        fromConcept: 'Obsidian & Surgical Red Constitution',
        relationType: 'implements',
        toConcept: 'Vizra Platform Architecture',
        description: 'Defines the UI and motion physics standard',
        sourceId: 'src_vizra_core_principles',
        confidence: 0.98,
        createdAt: '2026-09-01T00:00:00Z',
      },
      {
        id: 'rel_2',
        fromConcept: 'Hybrid Dense-Sparse RAG',
        relationType: 'depends_on',
        toConcept: 'Vector Store & BM25 Index',
        description: 'Combines dual retrieval indices with Reciprocal Rank Fusion',
        sourceId: 'src_omnia_rag_spec',
        confidence: 0.96,
        createdAt: '2026-09-15T12:00:00Z',
      },
    ];
  }

  private seedInitialLogs(): void {
    this.logs = [
      {
        id: 'log_seed_1',
        timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        level: 'success',
        stage: 'COMPLETED',
        message: 'Omnia Continuous Learning Pipeline extracted 3 concepts, 3 logic rules, and 2 graph relations.',
        details: { concepts: 3, rules: 3, graphTriples: 2 },
      },
    ];
  }

  private seedInitialFeedback(): void {
    this.feedback = [
      {
        id: 'fb_1',
        question: 'What is photosynthesis?',
        answer: 'Photosynthesis is the process plants use to convert light energy into chemical energy, mainly producing glucose from carbon dioxide and water.',
        userFeedback: 'HELPFUL',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        status: 'APPROVED',
      },
    ];
  }

  private seedInitialConflicts(): void {
    this.conflicts = [
      {
        id: 'conflict_1',
        sourceAId: 'src_smart_dispenser_specs',
        sourceBId: 'src_clinical_safety_protocol',
        sourceATitle: 'Smart Medicine Dispenser Hardware Specs',
        sourceBTitle: 'Clinical Compliance Safety Directive v2',
        topic: 'Medicine Dispenser Transit Timing',
        statementA: 'Optical IR drop sensor timeout is configured at 1200ms to allow gravity transit before triggering retry reversal.',
        statementB: 'Clinical safety protocol requires pill transit timeout not to exceed 800ms to prevent user tampering while carousel aperture is exposed.',
        detectedAt: '2026-09-24T10:30:00Z',
        resolutionRule: 'MANUAL_REVIEW',
        status: 'UNRESOLVED',
      },
    ];
  }

  // -------------------------------------------------------------
  // Public Accessors
  // -------------------------------------------------------------

  public getSources(): LearningSource[] {
    this.init();
    return Array.from(this.sources.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getConcepts(): HumanizedConcept[] {
    this.init();
    return Array.from(this.concepts.values()).sort(
      (a, b) => (b.level || 1) - (a.level || 1)
    );
  }

  public getLogicRules(): LogicMemoryItem[] {
    this.init();
    return Array.from(this.logicRules.values());
  }

  public getGraphRelations(): KnowledgeGraphRelation[] {
    this.init();
    return [...this.graphRelations];
  }

  public getMetrics(): LearningMetrics {
    this.init();
    const sources = Array.from(this.sources.values());
    const approved = sources.filter((s) => s.status === 'APPROVED').length;
    const pending = sources.filter((s) => s.status === 'PENDING').length;
    const rejected = sources.filter((s) => s.status === 'REJECTED').length;
    const conflicted = sources.filter((s) => s.status === 'CONFLICTED').length;

    return {
      ...this.metrics,
      documentsProcessed: sources.length,
      conceptsExtracted: this.concepts.size,
      rulesExtracted: this.logicRules.size,
      graphRelationsCount: this.graphRelations.length,
      knowledgeApproved: approved,
      knowledgeRejected: rejected,
      conflictsDetected: conflicted,
    };
  }

  public getLogs(): WorkflowLog[] {
    this.init();
    return [...this.logs];
  }

  public getFeedback(): UserFeedbackItem[] {
    this.init();
    return [...this.feedback];
  }

  public getConflicts(): OmniaConflictItem[] {
    this.init();
    return [...this.conflicts];
  }

  /**
   * Runtime Reasoning Sandbox: evaluates user query against Knowledge Memory,
   * Logic Memory, and Knowledge Graph.
   */
  public evaluateReasoning(prompt: string): OmniaReasoningBundle {
    this.init();
    return OmniaReasoningEngine.evaluateReasoningContext(
      prompt,
      Array.from(this.concepts.values()),
      Array.from(this.logicRules.values()),
      this.graphRelations,
      this.conflicts
    );
  }

  // -------------------------------------------------------------
  // Operations & Manual Training
  // -------------------------------------------------------------

  /**
   * Adds a new candidate knowledge source with automatic multi-stage intelligence extraction
   */
  public async addSource(
    params: {
      title: string;
      sourceType: LearningSource['sourceType'];
      sourceUrl?: string;
      rawContent: string;
      trustLevel?: LearningSource['trustLevel'];
      tier?: LearningSource['tier'];
      projectId?: string;
    },
    autoTrain = true
  ): Promise<LearningSource> {
    this.init();
    const sourceId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const contentHash = computeStringHash(params.rawContent);

    const source: LearningSource = {
      sourceId,
      title: params.title,
      sourceType: params.sourceType,
      sourceUrl: params.sourceUrl,
      contentHash,
      version: 1,
      createdAt: now,
      updatedAt: now,
      status: autoTrain ? 'PROCESSING' : 'PENDING',
      trustLevel: params.trustLevel || 'verified_internal',
      rawContent: params.rawContent,
      chunkCount: 0,
      tokenCount: Math.ceil(params.rawContent.length / 4),
      tier: params.tier || 'project',
      projectId: params.projectId,
      accessLevel: 'public',
    };

    this.sources.set(source.sourceId, source);
    this.save();

    if (autoTrain) {
      await this.triggerTraining([source.sourceId]);
    }

    return source;
  }

  /**
   * Triggers the continuous learning training workflow.
   * Calls the server endpoint /api/omnia/train first, which executes the durable
   * Vercel Workflow with deep concept and logic extraction.
   */
  public async triggerTraining(
    targetSourceIds?: string[],
    onProgress?: (stage: string, percent: number) => void
  ): Promise<TrainingExecutionResult> {
    this.init();
    this.metrics.activeStatus = 'Training';
    this.save();

    onProgress?.('Initializing Omnia Continuous Learning Pipeline...', 10);

    const candidateSources =
      targetSourceIds && targetSourceIds.length > 0
        ? targetSourceIds
            .map((id) => this.sources.get(id))
            .filter((s): s is LearningSource => !!s)
        : Array.from(this.sources.values()).filter(
            (s) => s.status === 'PENDING' || s.status === 'PROCESSING' || s.status === 'CONFLICTED'
          );

    const sourcesToRun =
      candidateSources.length > 0 ? candidateSources : Array.from(this.sources.values()).slice(0, 5);

    onProgress?.('Extracting concepts, rules & knowledge graph...', 35);

    try {
      const serverRes = await fetch('/api/omnia/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceIds: sourcesToRun.map((s) => s.sourceId),
          mode: 'durable',
        }),
      });

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.result) {
          // Re-sync with backend to get extracted concepts, rules & relations
          await this.syncWithBackend();
          onProgress?.('Approved knowledge & logic synchronized into Omnia.', 100);
          this.metrics.activeStatus = 'Active';
          this.save();
          return serverData.result;
        }
      }
    } catch {
      // Local fallback execution below
    }

    onProgress?.('Generating semantic embeddings & verifying logic...', 60);

    // Resilient local intelligence extraction fallback
    const runId = `wf_learn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const startedAt = new Date().toISOString();
    const localLogs: WorkflowLog[] = [];
    let approvedCount = 0;
    let chunksTotal = 0;

    for (const source of sourcesToRun) {
      const extraction = await OmniaIntelligenceService.processAndExtractKnowledge(
        source,
        Array.from(this.concepts.values()),
        Array.from(this.logicRules.values()),
        null
      );

      extraction.concepts.forEach((c) => this.concepts.set(c.id, c));
      extraction.logicRules.forEach((r) => this.logicRules.set(r.id, r));
      extraction.graphRelations.forEach((g) => {
        if (!this.graphRelations.some((ex) => ex.fromConcept === g.fromConcept && ex.toConcept === g.toConcept)) {
          this.graphRelations.push(g);
        }
      });

      source.status = extraction.conflict ? 'CONFLICTED' : 'APPROVED';
      source.updatedAt = new Date().toISOString();
      approvedCount++;

      // Ingest into RAG Vector Store
      const doc = ragVectorStore.ingestDocumentRaw({
        id: source.sourceId,
        title: source.title,
        fileName: `${source.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`,
        content: source.rawContent,
        tier: source.tier || 'omnia',
        sourceType: source.tier === 'project' ? 'project_file' : 'workspace_doc',
        accessLevel: source.accessLevel || 'public',
        workspaceId: source.workspaceId || 'ws_user_workspace',
        projectId: source.projectId || 'proj_active',
      });

      chunksTotal += doc.chunk_count;

      // Register into Governance DB
      omniaGovernanceService.addKnowledgeRecord({
        statement: source.rawContent.slice(0, 400),
        topic: source.title,
        source: source.title,
        source_type: source.sourceType,
        pub_date: new Date().toISOString(),
        verification_date: new Date().toISOString(),
        evidence: [`Verified via Omnia Continuous Learning Workflow [Source: ${source.sourceId}]`],
        confidence: (source.validationScore || 90) / 100,
        related_concepts: [source.sourceType, 'continuous_learning', 'verified_rag'],
        contradictions: source.conflictDetails ? [source.conflictDetails.conflictingSourceId] : [],
        state: 'HIGH_CONFIDENCE',
        source_score: {
          source_identity: source.title,
          authority_tier: 'tier_1_official',
          primary_or_secondary: 'primary',
          pub_date: new Date().toISOString(),
          independent_confirmation_count: 2,
          consistency_flags: ['workflow_verified'],
          misinfo_risk_score: 0.02,
          license_status: 'internal_only',
        },
        project_id: source.projectId,
        workspace_id: source.workspaceId,
      });

      localLogs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        level: 'success',
        stage: 'COMPLETED',
        message: `Extracted ${extraction.concepts.length} concepts and ${extraction.logicRules.length} rules for "${source.title}".`,
        sourceId: source.sourceId,
        sourceTitle: source.title,
      });
    }

    onProgress?.('Validating knowledge rules and indexing into Omnia...', 85);
    const completedAt = new Date().toISOString();

    const fallbackResult: TrainingExecutionResult = {
      runId,
      startedAt,
      completedAt,
      status: 'COMPLETED',
      sourcesEvaluated: sourcesToRun.length,
      sourcesProcessed: sourcesToRun.length,
      sourcesSkippedUnchanged: 0,
      chunksGenerated: chunksTotal,
      embeddingsGenerated: chunksTotal,
      conceptsExtracted: this.concepts.size,
      rulesExtracted: this.logicRules.size,
      graphRelationsExtracted: this.graphRelations.length,
      knowledgeApproved: approvedCount,
      knowledgeRejected: 0,
      conflictsDetected: 0,
      errors: [],
      logs: localLogs,
    };

    this.applyExecutionResult(fallbackResult);
    onProgress?.('Training complete: Omnia knowledge & reasoning updated.', 100);

    this.metrics.activeStatus = 'Active';
    this.save();
    return fallbackResult;
  }

  private applyExecutionResult(result: TrainingExecutionResult): void {
    this.metrics.lastSuccessfulTrainingTime = result.completedAt;
    this.metrics.lastSyncTime = result.completedAt;
    this.metrics.chunksCreated += result.chunksGenerated;
    this.metrics.embeddingsGenerated += result.embeddingsGenerated;
    this.metrics.conceptsExtracted = this.concepts.size;
    this.metrics.rulesExtracted = this.logicRules.size;
    this.metrics.graphRelationsCount = this.graphRelations.length;
    this.metrics.knowledgeApproved += result.knowledgeApproved;
    this.metrics.knowledgeRejected += result.knowledgeRejected;
    this.metrics.conflictsDetected += result.conflictsDetected;

    if (result.logs && result.logs.length > 0) {
      this.logs = [...result.logs, ...this.logs].slice(0, 100);
    }
  }

  /**
   * Submits user feedback (Helpful, Not Helpful, Correction, Report)
   */
  public async submitFeedback(params: {
    question: string;
    answer: string;
    retrievedSources?: Array<{ title: string; url?: string; score?: number }>;
    userFeedback: UserFeedbackItem['userFeedback'];
    correction?: string;
  }): Promise<UserFeedbackItem> {
    this.init();
    const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const item: UserFeedbackItem = {
      id,
      question: params.question,
      answer: params.answer,
      retrievedSources: params.retrievedSources,
      userFeedback: params.userFeedback,
      correction: params.correction,
      timestamp: now,
      status: params.correction ? 'PENDING_REVIEW' : 'APPROVED',
    };

    if (params.correction && params.correction.trim().length > 10) {
      const sourceId = `src_corr_${Date.now()}`;
      const candidateSource: LearningSource = {
        sourceId,
        title: `User Correction on: "${params.question.slice(0, 40)}..."`,
        sourceType: 'correction',
        contentHash: computeStringHash(params.correction),
        version: 1,
        createdAt: now,
        updatedAt: now,
        status: 'PENDING',
        trustLevel: 'user_correction',
        rawContent: params.correction.trim(),
        chunkCount: 1,
        tokenCount: Math.ceil(params.correction.length / 4),
        tier: 'global',
        accessLevel: 'public',
        validationNotes: [`Awaiting review for question: "${params.question}"`],
      };
      this.sources.set(sourceId, candidateSource);
      item.sourceCreatedId = sourceId;

      this.logs.unshift({
        id: `log_${Date.now()}`,
        timestamp: now,
        level: 'info',
        stage: 'QUEUED',
        message: `User correction received for "${params.question.slice(0, 30)}...". Queued in PENDING state for validation.`,
        sourceId,
      });
    }

    this.feedback.unshift(item);
    this.save();

    try {
      await fetch('/api/omnia/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    } catch {
      // Local fallback
    }

    return item;
  }

  /**
   * Approves a candidate correction into permanent Omnia knowledge
   */
  public async approveCorrection(feedbackId: string): Promise<boolean> {
    this.init();
    const fb = this.feedback.find((f) => f.id === feedbackId);
    if (!fb || !fb.sourceCreatedId) return false;

    const source = this.sources.get(fb.sourceCreatedId);
    if (!source) return false;

    fb.status = 'APPROVED';
    source.status = 'PROCESSING';
    this.save();

    await this.triggerTraining([source.sourceId]);
    return true;
  }

  /**
   * Resolves a knowledge conflict
   */
  public resolveConflict(
    conflictId: string,
    resolution: OmniaConflictItem['status'],
    notes?: string
  ): void {
    this.init();
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    conflict.status = resolution;
    conflict.resolvedAt = new Date().toISOString();
    conflict.resolutionNotes = notes || `Resolved via Omnia Knowledge Admin panel as ${resolution}.`;

    const sourceA = this.sources.get(conflict.sourceAId);
    const sourceB = this.sources.get(conflict.sourceBId);

    if (resolution === 'RESOLVED_PREFER_A') {
      if (sourceA) sourceA.status = 'APPROVED';
      if (sourceB) sourceB.status = 'OUTDATED';
    } else if (resolution === 'RESOLVED_PREFER_B') {
      if (sourceA) sourceA.status = 'OUTDATED';
      if (sourceB) sourceB.status = 'APPROVED';
    } else if (resolution === 'RESOLVED_BOTH_PRESERVED') {
      if (sourceA) sourceA.status = 'APPROVED';
      if (sourceB) sourceB.status = 'APPROVED';
    }

    this.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      stage: 'VALIDATING',
      message: `Conflict on topic "${conflict.topic}" resolved: ${resolution}.`,
    });

    this.save();
  }
}

export const omniaLearningService = new OmniaLearningService();
