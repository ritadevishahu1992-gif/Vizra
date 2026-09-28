import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  LearningSource,
  LearningMetrics,
  WorkflowLog,
  UserFeedbackItem,
  OmniaConflictItem,
  HumanizedConcept,
  LogicMemoryItem,
  KnowledgeGraphRelation,
  TrainingExecutionResult,
} from '../types/omniaLearning';
import { computeStringHash } from '../utils/hashUtils';
import { runOmniaLearningWorkflow } from '../../workflows/omnia-learning';
import { OmniaReasoningEngine } from './omniaReasoningEngine';
import { OmniaIntelligenceService } from './omniaIntelligenceService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'omnia_learning_store.json');

interface StoredData {
  sources: LearningSource[];
  concepts: HumanizedConcept[];
  logicRules: LogicMemoryItem[];
  graphRelations: KnowledgeGraphRelation[];
  metrics: LearningMetrics;
  logs: WorkflowLog[];
  feedback: UserFeedbackItem[];
  conflicts: OmniaConflictItem[];
}

// In-Memory store
let sourcesMap = new Map<string, LearningSource>();
let conceptsMap = new Map<string, HumanizedConcept>();
let logicRulesMap = new Map<string, LogicMemoryItem>();
let graphRelationsList: KnowledgeGraphRelation[] = [];
let logsList: WorkflowLog[] = [];
let feedbackList: UserFeedbackItem[] = [];
let conflictsList: OmniaConflictItem[] = [];
let metricsData: LearningMetrics = {
  documentsProcessed: 4,
  chunksCreated: 24,
  embeddingsGenerated: 24,
  conceptsExtracted: 6,
  rulesExtracted: 8,
  graphRelationsCount: 6,
  knowledgeApproved: 4,
  knowledgeRejected: 1,
  conflictsDetected: 1,
  lastSuccessfulTrainingTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  lastSyncTime: new Date().toISOString(),
  activeStatus: 'Active',
  failedJobs: 0,
};

let serverAiInstance: GoogleGenAI | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only fallback
  }
}

function loadStoredData() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const data: StoredData = JSON.parse(content);
      if (Array.isArray(data.sources)) {
        sourcesMap.clear();
        data.sources.forEach((s) => sourcesMap.set(s.sourceId, s));
      }
      if (Array.isArray(data.concepts)) {
        conceptsMap.clear();
        data.concepts.forEach((c) => conceptsMap.set(c.id, c));
      }
      if (Array.isArray(data.logicRules)) {
        logicRulesMap.clear();
        data.logicRules.forEach((r) => logicRulesMap.set(r.id, r));
      }
      if (Array.isArray(data.graphRelations)) {
        graphRelationsList = data.graphRelations;
      }
      if (data.metrics) {
        metricsData = { ...metricsData, ...data.metrics };
      }
      if (Array.isArray(data.logs)) {
        logsList = data.logs;
      }
      if (Array.isArray(data.feedback)) {
        feedbackList = data.feedback;
      }
      if (Array.isArray(data.conflicts)) {
        conflictsList = data.conflicts;
      }
      if (conceptsMap.size === 0 || logicRulesMap.size === 0) {
        seedInitialData();
      }
      return;
    }
  } catch (e) {
    console.warn('Could not read persistent learning store, initializing defaults', e);
  }
  seedInitialData();
}

function persistStore() {
  try {
    ensureDataDir();
    const data: StoredData = {
      sources: Array.from(sourcesMap.values()),
      concepts: Array.from(conceptsMap.values()),
      logicRules: Array.from(logicRulesMap.values()),
      graphRelations: graphRelationsList,
      metrics: metricsData,
      logs: logsList.slice(0, 100),
      feedback: feedbackList,
      conflicts: conflictsList,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Ephemeral environment fallback
  }
}

function seedInitialData() {
  const seedSources: LearningSource[] = [
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
- Zero AI Slop: No generic blue pills, fluid kinetic transitions at 60fps.
- Omnia AI: Native multimodal reasoning engine grounded in verified RAG and continuous learning.
- Knowledge Isolation: Strict tenant boundaries between global, workspace, and isolated project tiers.`,
      chunkCount: 3,
      tokenCount: 160,
      tier: 'vizra',
      accessLevel: 'public',
      validationScore: 98,
      validationNotes: ['Verified internal Vizra platform constitution'],
      extractedConceptsCount: 2,
      extractedRulesCount: 2,
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
      extractedConceptsCount: 2,
      extractedRulesCount: 3,
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
      extractedRulesCount: 2,
      conflictDetails: {
        conflictingSourceId: 'src_clinical_safety_protocol',
        conflictingTopic: 'Medicine Dispenser Transit Timing',
        reason: 'Hardware spec requests 1200ms transit window; Clinical protocol specifies 800ms tamper limit.',
        detectedAt: '2026-09-24T10:30:00Z',
      },
    },
  ];

  seedSources.forEach((s) => sourcesMap.set(s.sourceId, s));

  // Seed Humanized Knowledge Memory
  const seedConcepts: HumanizedConcept[] = [
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

  seedConcepts.forEach((c) => conceptsMap.set(c.id, c));

  // Seed Logic Memory (Rules, Constraints, Procedures)
  const seedRules: LogicMemoryItem[] = [
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

  seedRules.forEach((r) => logicRulesMap.set(r.id, r));

  // Seed Knowledge Graph
  graphRelationsList = [
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
    {
      id: 'rel_3',
      fromConcept: 'Optical IR Drop Window',
      relationType: 'conflicts_with',
      toConcept: 'Clinical Compliance Safety Directive',
      description: '1200ms hardware transit window clashes with 800ms tamper limit',
      sourceId: 'src_smart_dispenser_specs',
      confidence: 0.9,
      createdAt: '2026-09-20T10:00:00Z',
    },
  ];

  conflictsList = [
    {
      id: 'conflict_srv_1',
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
      resolutionNotes: 'Hardware bench specifies 1200ms; Clinical directive limits to 800ms.',
    },
  ];

  logsList = [
    {
      id: 'log_srv_1',
      timestamp: new Date().toISOString(),
      level: 'success',
      stage: 'COMPLETED',
      message: 'Omnia Intelligence and Reasoning Layer initialized with 3 verified concepts, 3 logic rules, and 3 graph relations.',
    },
  ];

  persistStore();
}

/**
 * Returns structured Omnia reasoning context for grounding conversational prompts
 */
export function getApprovedKnowledgeContext(query: string, ai?: GoogleGenAI | null): string {
  loadStoredData();
  const concepts = Array.from(conceptsMap.values());
  const rules = Array.from(logicRulesMap.values());
  const bundle = OmniaReasoningEngine.evaluateReasoningContext(
    query,
    concepts,
    rules,
    graphRelationsList,
    conflictsList
  );

  return bundle.contextString;
}

/**
 * Mounts all Omnia Continuous Learning & Reasoning API Routes onto Express
 */
export function setupOmniaLearningRoutes(app: express.Application, ai?: GoogleGenAI | null) {
  serverAiInstance = ai || null;
  loadStoredData();

  // 1. OMNIA LEARNING STATUS & METRICS
  app.get('/api/omnia/status', (_req, res) => {
    loadStoredData();
    const sources = Array.from(sourcesMap.values());
    const concepts = Array.from(conceptsMap.values());
    const rules = Array.from(logicRulesMap.values());

    const approved = sources.filter((s) => s.status === 'APPROVED').length;
    const pending = sources.filter((s) => s.status === 'PENDING').length;
    const rejected = sources.filter((s) => s.status === 'REJECTED').length;
    const conflicted = sources.filter((s) => s.status === 'CONFLICTED').length;

    metricsData = {
      ...metricsData,
      documentsProcessed: sources.length,
      conceptsExtracted: concepts.length,
      rulesExtracted: rules.length,
      graphRelationsCount: graphRelationsList.length,
      knowledgeApproved: approved,
      knowledgeRejected: rejected,
      conflictsDetected: conflicted,
      lastSyncTime: new Date().toISOString(),
    };

    res.json({
      status: 'ok',
      activeStatus: metricsData.activeStatus,
      metrics: metricsData,
      recentLogs: logsList.slice(0, 20),
      totalSources: sources.length,
      totalConcepts: concepts.length,
      totalRules: rules.length,
      totalGraphRelations: graphRelationsList.length,
      pendingCount: pending,
      conflictsCount: conflicted,
    });
  });

  // 2. GET CONCEPTS (HUMANIZED KNOWLEDGE MEMORY)
  app.get('/api/omnia/concepts', (req, res) => {
    loadStoredData();
    const { level, status } = req.query;
    let list = Array.from(conceptsMap.values());

    if (level) {
      list = list.filter((c) => c.level === parseInt(String(level), 10));
    }
    if (status) {
      list = list.filter((c) => c.status === String(status));
    }

    res.json({ concepts: list, total: list.length });
  });

  // 3. GET LOGIC & RULES MEMORY
  app.get('/api/omnia/logic', (req, res) => {
    loadStoredData();
    const { type, status } = req.query;
    let list = Array.from(logicRulesMap.values());

    if (type) {
      list = list.filter((r) => r.logicType === String(type));
    }
    if (status) {
      list = list.filter((r) => r.status === String(status));
    }

    res.json({ rules: list, total: list.length });
  });

  // 4. GET KNOWLEDGE GRAPH
  app.get('/api/omnia/graph', (_req, res) => {
    loadStoredData();
    res.json({
      relations: graphRelationsList,
      total: graphRelationsList.length,
      concepts: Array.from(conceptsMap.values()).map((c) => ({
        id: c.id,
        concept: c.concept,
        topic: c.topic,
        level: c.level,
      })),
    });
  });

  // 5. REASONING EVALUATION SANDBOX
  app.post('/api/omnia/reason', (req, res) => {
    loadStoredData();
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt string is required' });
      return;
    }

    const concepts = Array.from(conceptsMap.values());
    const rules = Array.from(logicRulesMap.values());
    const bundle = OmniaReasoningEngine.evaluateReasoningContext(
      prompt,
      concepts,
      rules,
      graphRelationsList,
      conflictsList
    );

    res.json({ success: true, bundle });
  });

  // 6. TRIGGER TRAINING WORKFLOW (MANUAL / PROGRAMMATIC)
  app.post('/api/omnia/train', async (req, res) => {
    loadStoredData();
    metricsData.activeStatus = 'Training';

    try {
      const { sourceIds } = req.body || {};
      let candidateSources: LearningSource[] = [];

      if (Array.isArray(sourceIds) && sourceIds.length > 0) {
        candidateSources = sourceIds
          .map((id: string) => sourcesMap.get(id))
          .filter((s): s is LearningSource => !!s);
      } else {
        candidateSources = Array.from(sourcesMap.values()).filter(
          (s) => s.status === 'PENDING' || s.status === 'PROCESSING' || s.status === 'CONFLICTED'
        );
      }

      if (candidateSources.length === 0) {
        candidateSources = Array.from(sourcesMap.values()).slice(0, 10);
      }

      // Execute Vercel Workflow with Deep Intelligence Extraction
      const executionResult: TrainingExecutionResult = await runOmniaLearningWorkflow(
        candidateSources,
        {
          existingSources: Array.from(sourcesMap.values()),
          existingConcepts: Array.from(conceptsMap.values()),
          existingRules: Array.from(logicRulesMap.values()),
          existingGraph: graphRelationsList,
          aiInstance: serverAiInstance,
          onLog: (log) => {
            logsList.unshift(log);
          },
          persistFunction: async ({ source, concepts, rules, graphRelations }) => {
            sourcesMap.set(source.sourceId, source);
            concepts.forEach((c) => conceptsMap.set(c.id, c));
            rules.forEach((r) => logicRulesMap.set(r.id, r));
            graphRelations.forEach((g) => {
              if (!graphRelationsList.some((ex) => ex.fromConcept === g.fromConcept && ex.toConcept === g.toConcept && ex.relationType === g.relationType)) {
                graphRelationsList.push(g);
              }
            });
          },
        }
      );

      // Update metrics
      metricsData.activeStatus = 'Active';
      metricsData.lastSuccessfulTrainingTime = executionResult.completedAt;
      metricsData.lastSyncTime = executionResult.completedAt;
      metricsData.chunksCreated += executionResult.chunksGenerated;
      metricsData.embeddingsGenerated += executionResult.embeddingsGenerated;
      metricsData.conceptsExtracted = conceptsMap.size;
      metricsData.rulesExtracted = logicRulesMap.size;
      metricsData.graphRelationsCount = graphRelationsList.length;
      metricsData.knowledgeApproved += executionResult.knowledgeApproved;
      metricsData.knowledgeRejected += executionResult.knowledgeRejected;
      metricsData.conflictsDetected += executionResult.conflictsDetected;

      persistStore();

      res.json({
        success: true,
        result: executionResult,
        metrics: metricsData,
      });
    } catch (err: any) {
      metricsData.activeStatus = 'Error';
      metricsData.failedJobs += 1;
      persistStore();
      console.error('Omnia Training pipeline failed:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Workflow execution error',
      });
    }
  });

  // 7. GET KNOWLEDGE SOURCES
  app.get('/api/omnia/knowledge', (req, res) => {
    loadStoredData();
    const { status, type } = req.query;

    let sources = Array.from(sourcesMap.values());
    if (typeof status === 'string') {
      sources = sources.filter((s) => s.status === status);
    }
    if (typeof type === 'string') {
      sources = sources.filter((s) => s.sourceType === type);
    }

    res.json({
      sources: sources.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
      total: sources.length,
    });
  });

  // 8. ADD NEW KNOWLEDGE SOURCE (AUTOMATIC EXTRACTION & TRAINING)
  app.post('/api/omnia/knowledge', async (req, res) => {
    loadStoredData();
    try {
      const {
        title,
        sourceType = 'document',
        sourceUrl,
        rawContent,
        trustLevel = 'verified_internal',
        tier = 'project',
        projectId,
        autoTrain = true,
      } = req.body;

      if (!title || !rawContent) {
        res.status(400).json({ error: 'Title and rawContent are required' });
        return;
      }

      const sourceId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const contentHash = computeStringHash(rawContent);

      const existing = Array.from(sourcesMap.values()).find(
        (s) => s.contentHash === contentHash && s.status === 'APPROVED'
      );

      if (existing) {
        res.json({
          message: 'Source already approved and unchanged (idempotent)',
          source: existing,
          skipped: true,
        });
        return;
      }

      const newSource: LearningSource = {
        sourceId,
        title,
        sourceType,
        sourceUrl,
        contentHash,
        version: 1,
        createdAt: now,
        updatedAt: now,
        status: autoTrain ? 'PROCESSING' : 'PENDING',
        trustLevel,
        rawContent,
        chunkCount: 0,
        tokenCount: Math.ceil(rawContent.length / 4),
        tier,
        projectId,
        accessLevel: 'public',
      };

      sourcesMap.set(sourceId, newSource);
      persistStore();

      let workflowResult: TrainingExecutionResult | null = null;
      if (autoTrain) {
        workflowResult = await runOmniaLearningWorkflow([newSource], {
          existingSources: Array.from(sourcesMap.values()),
          existingConcepts: Array.from(conceptsMap.values()),
          existingRules: Array.from(logicRulesMap.values()),
          existingGraph: graphRelationsList,
          aiInstance: serverAiInstance,
          onLog: (l) => logsList.unshift(l),
          persistFunction: async ({ source, concepts, rules, graphRelations }) => {
            sourcesMap.set(source.sourceId, source);
            concepts.forEach((c) => conceptsMap.set(c.id, c));
            rules.forEach((r) => logicRulesMap.set(r.id, r));
            graphRelations.forEach((g) => {
              if (!graphRelationsList.some((ex) => ex.fromConcept === g.fromConcept && ex.toConcept === g.toConcept && ex.relationType === g.relationType)) {
                graphRelationsList.push(g);
              }
            });
          },
        });
        persistStore();
      }

      res.status(201).json({
        success: true,
        source: sourcesMap.get(sourceId),
        workflowResult,
      });
    } catch (err: any) {
      console.error('Error adding knowledge source:', err);
      res.status(500).json({ error: err.message || 'Error creating source' });
    }
  });

  // 9. USER FEEDBACK PIPELINE
  app.post('/api/omnia/feedback', (req, res) => {
    loadStoredData();
    const { question, answer, retrievedSources, userFeedback, correction } = req.body;

    if (!question || !userFeedback) {
      res.status(400).json({ error: 'question and userFeedback are required' });
      return;
    }

    const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const item: UserFeedbackItem = {
      id,
      question,
      answer: answer || '',
      retrievedSources,
      userFeedback,
      correction,
      timestamp: now,
      status: correction ? 'PENDING_REVIEW' : 'APPROVED',
    };

    if (correction && correction.trim().length > 10) {
      const sourceId = `src_corr_${Date.now()}`;
      const candidate: LearningSource = {
        sourceId,
        title: `Correction on: "${question.slice(0, 36)}..."`,
        sourceType: 'correction',
        contentHash: computeStringHash(correction),
        version: 1,
        createdAt: now,
        updatedAt: now,
        status: 'PENDING',
        trustLevel: 'user_correction',
        rawContent: correction.trim(),
        chunkCount: 1,
        tokenCount: Math.ceil(correction.length / 4),
        tier: 'global',
        accessLevel: 'public',
        validationNotes: [`Awaiting review for prompt: "${question}"`],
      };

      sourcesMap.set(sourceId, candidate);
      item.sourceCreatedId = sourceId;

      logsList.unshift({
        id: `log_${Date.now()}`,
        timestamp: now,
        level: 'info',
        stage: 'QUEUED',
        message: `User correction queued for validation: "${question.slice(0, 30)}..."`,
        sourceId,
      });
    }

    feedbackList.unshift(item);
    persistStore();

    res.json({ success: true, item });
  });

  app.get('/api/omnia/feedback', (_req, res) => {
    loadStoredData();
    res.json({ feedback: feedbackList.slice(0, 50) });
  });

  // 10. 24/7 SCHEDULED SYNCHRONIZATION (VERCEL CRON)
  const handleCronSync = async (req: express.Request, res: express.Response) => {
    loadStoredData();
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: 'Unauthorized: Invalid cron secret' });
      return;
    }

    const startedAt = new Date().toISOString();
    logsList.unshift({
      id: `log_cron_${Date.now()}`,
      timestamp: startedAt,
      level: 'info',
      stage: 'RUNNING',
      message: 'Scheduled Omnia Continuous Learning Synchronization Cron triggered.',
    });

    try {
      const pendingSources = Array.from(sourcesMap.values()).filter(
        (s) => s.status === 'PENDING' || s.status === 'PROCESSING'
      );

      let workflowResult: TrainingExecutionResult | null = null;
      if (pendingSources.length > 0) {
        workflowResult = await runOmniaLearningWorkflow(pendingSources, {
          existingSources: Array.from(sourcesMap.values()),
          existingConcepts: Array.from(conceptsMap.values()),
          existingRules: Array.from(logicRulesMap.values()),
          existingGraph: graphRelationsList,
          aiInstance: serverAiInstance,
          onLog: (l) => logsList.unshift(l),
          persistFunction: async ({ source, concepts, rules, graphRelations }) => {
            sourcesMap.set(source.sourceId, source);
            concepts.forEach((c) => conceptsMap.set(c.id, c));
            rules.forEach((r) => logicRulesMap.set(r.id, r));
            graphRelations.forEach((g) => {
              if (!graphRelationsList.some((ex) => ex.fromConcept === g.fromConcept && ex.toConcept === g.toConcept && ex.relationType === g.relationType)) {
                graphRelationsList.push(g);
              }
            });
          },
        });
      }

      metricsData.lastSyncTime = new Date().toISOString();
      persistStore();

      res.json({
        success: true,
        timestamp: startedAt,
        pendingProcessed: pendingSources.length,
        workflowResult,
        status: metricsData.activeStatus,
      });
    } catch (err: any) {
      console.error('Omnia cron sync error:', err);
      res.status(500).json({ error: err.message || 'Cron execution failed' });
    }
  };

  app.get('/api/cron/omnia-sync', handleCronSync);
  app.post('/api/cron/omnia-sync', handleCronSync);
}
