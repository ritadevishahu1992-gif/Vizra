import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LearningSource,
  LearningMetrics,
  WorkflowLog,
  UserFeedbackItem,
  OmniaConflictItem,
  TrainingExecutionResult,
} from '../types/omniaLearning';
import { computeStringHash } from '../utils/hashUtils';
import { runOmniaLearningWorkflow } from '../../workflows/omnia-learning';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'omnia_learning_store.json');

interface StoredData {
  sources: LearningSource[];
  metrics: LearningMetrics;
  logs: WorkflowLog[];
  feedback: UserFeedbackItem[];
  conflicts: OmniaConflictItem[];
}

// In-Memory store
let sourcesMap = new Map<string, LearningSource>();
let logsList: WorkflowLog[] = [];
let feedbackList: UserFeedbackItem[] = [];
let conflictsList: OmniaConflictItem[] = [];
let metricsData: LearningMetrics = {
  documentsProcessed: 4,
  chunksCreated: 24,
  embeddingsGenerated: 24,
  knowledgeApproved: 4,
  knowledgeRejected: 1,
  conflictsDetected: 1,
  lastSuccessfulTrainingTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  lastSyncTime: new Date().toISOString(),
  activeStatus: 'Active',
  failedJobs: 0,
};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Read-only filesystem fallback
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
      return;
    }
  } catch (e) {
    console.warn('Could not read persistent learning store, using defaults', e);
  }
  seedInitialData();
}

function persistStore() {
  try {
    ensureDataDir();
    const data: StoredData = {
      sources: Array.from(sourcesMap.values()),
      metrics: metricsData,
      logs: logsList.slice(0, 100),
      feedback: feedbackList,
      conflicts: conflictsList,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // Non-fatal if filesystem is ephemeral or read-only
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
- Omnia AI: Native multimodal reasoning engine grounded in verified RAG and continuous learning.
- Tenant Boundaries: Isolation between global, workspace, and isolated project tiers.`,
      chunkCount: 3,
      tokenCount: 160,
      tier: 'vizra',
      accessLevel: 'public',
      validationScore: 98,
      validationNotes: ['Verified internal Vizra platform constitution'],
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
      conflictDetails: {
        conflictingSourceId: 'src_clinical_safety_protocol',
        conflictingTopic: 'Medicine Dispenser Transit Timing',
        reason: 'Hardware spec requests 1200ms transit window; Clinical protocol specifies 800ms tamper limit.',
        detectedAt: '2026-09-24T10:30:00Z',
      },
    },
    {
      sourceId: 'src_user_correction_curiosity_launch',
      title: 'User Correction: Curiosity Mars Rover Landing Date',
      sourceType: 'correction',
      contentHash: computeStringHash('Curiosity rover touched down in Gale Crater on August 6, 2012 UTC'),
      version: 1,
      createdAt: '2026-09-25T14:20:00Z',
      updatedAt: '2026-09-25T14:20:00Z',
      status: 'APPROVED',
      trustLevel: 'user_correction',
      rawContent: `The Curiosity rover touched down in Gale Crater on Mars on August 6, 2012 UTC (August 5, 2012 PDT). NASA telemetry confirms 05:17 UTC touchdown point.`,
      chunkCount: 1,
      tokenCount: 45,
      tier: 'global',
      accessLevel: 'public',
      validationScore: 92,
      validationNotes: ['Verified against NASA official mission telemetry archives.'],
    },
  ];

  seedSources.forEach((s) => sourcesMap.set(s.sourceId, s));

  logsList = [
    {
      id: 'log_srv_1',
      timestamp: new Date().toISOString(),
      level: 'success',
      stage: 'COMPLETED',
      message: 'Omnia Continuous Learning system initialized with 4 verified sources.',
    },
  ];

  feedbackList = [
    {
      id: 'fb_init_1',
      question: 'What is photosynthesis?',
      answer: 'Photosynthesis is the process plants use to convert light energy into chemical energy.',
      userFeedback: 'HELPFUL',
      timestamp: new Date().toISOString(),
      status: 'APPROVED',
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
    },
  ];

  persistStore();
}

/**
 * Returns approved knowledge text relevant to a user question for grounding
 */
export function getApprovedKnowledgeContext(query: string): string {
  loadStoredData();
  const lowerQuery = query.toLowerCase();
  const approvedSources = Array.from(sourcesMap.values()).filter(
    (s) => s.status === 'APPROVED' && s.rawContent
  );

  const matched: string[] = [];
  for (const s of approvedSources) {
    const titleMatch = s.title.toLowerCase().split(/\s+/).some((w) => w.length > 3 && lowerQuery.includes(w));
    const contentMatch = s.rawContent.toLowerCase().split(/\n+/).some((line) => {
      const words = line.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      return words.filter((w) => lowerQuery.includes(w)).length >= 2;
    });

    if (titleMatch || contentMatch) {
      matched.push(`[Approved Source: ${s.title} (v${s.version}, Trust: ${s.trustLevel})]\n${s.rawContent.slice(0, 500)}`);
    }
  }

  return matched.slice(0, 3).join('\n\n');
}

/**
 * Mounts all Omnia Continuous Learning API Routes onto Express
 */
export function setupOmniaLearningRoutes(app: express.Application) {
  loadStoredData();

  // 1. OMNIA LEARNING STATUS & METRICS
  app.get('/api/omnia/status', (_req, res) => {
    loadStoredData();
    const sources = Array.from(sourcesMap.values());
    const approved = sources.filter((s) => s.status === 'APPROVED').length;
    const pending = sources.filter((s) => s.status === 'PENDING').length;
    const rejected = sources.filter((s) => s.status === 'REJECTED').length;
    const conflicted = sources.filter((s) => s.status === 'CONFLICTED').length;

    metricsData = {
      ...metricsData,
      documentsProcessed: sources.length,
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
      pendingCount: pending,
      conflictsCount: conflicted,
    });
  });

  // 2. TRIGGER TRAINING (MANUAL / PROGRAMMATIC)
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
        // Run on all sources to verify freshness
        candidateSources = Array.from(sourcesMap.values()).slice(0, 10);
      }

      const activeKnowledgeSnapshot = Array.from(sourcesMap.values())
        .filter((s) => s.status === 'APPROVED')
        .map((s) => ({
          id: s.sourceId,
          topic: s.title,
          statement: s.rawContent,
          source: s.title,
          version: s.version,
          trustLevel: s.trustLevel,
        }));

      // Execute Vercel Workflow
      const executionResult: TrainingExecutionResult = await runOmniaLearningWorkflow(
        candidateSources,
        {
          existingSources: Array.from(sourcesMap.values()),
          activeKnowledge: activeKnowledgeSnapshot,
          onLog: (log) => {
            logsList.unshift(log);
          },
          persistFunction: async ({ source }) => {
            sourcesMap.set(source.sourceId, source);
          },
        }
      );

      // Update metrics
      metricsData.activeStatus = 'Active';
      metricsData.lastSuccessfulTrainingTime = executionResult.completedAt;
      metricsData.lastSyncTime = executionResult.completedAt;
      metricsData.chunksCreated += executionResult.chunksGenerated;
      metricsData.embeddingsGenerated += executionResult.embeddingsGenerated;
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
      console.error('Omnia Training workflow failed:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Workflow execution error',
      });
    }
  });

  // 3. GET KNOWLEDGE SOURCES
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

  // 4. ADD NEW KNOWLEDGE SOURCE (AUTOMATIC TRAINING)
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

      // Idempotency check: does this hash already exist in an approved source?
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
          onLog: (l) => logsList.unshift(l),
          persistFunction: async ({ source }) => {
            sourcesMap.set(source.sourceId, source);
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

  // 5. GET KNOWLEDGE SOURCE BY ID
  app.get('/api/omnia/knowledge/:id', (req, res) => {
    loadStoredData();
    const source = sourcesMap.get(req.params.id);
    if (!source) {
      res.status(404).json({ error: 'Knowledge source not found' });
      return;
    }
    res.json({ source });
  });

  // 6. UPDATE KNOWLEDGE SOURCE STATUS
  app.patch('/api/omnia/knowledge/:id', (req, res) => {
    loadStoredData();
    const source = sourcesMap.get(req.params.id);
    if (!source) {
      res.status(404).json({ error: 'Knowledge source not found' });
      return;
    }

    const { status, trustLevel, validationNotes } = req.body;
    if (status) source.status = status;
    if (trustLevel) source.trustLevel = trustLevel;
    if (validationNotes) source.validationNotes = validationNotes;
    source.updatedAt = new Date().toISOString();

    sourcesMap.set(source.sourceId, source);
    persistStore();

    res.json({ success: true, source });
  });

  // 7. USER FEEDBACK PIPELINE
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

    // If user provided a correction, create a PENDING learning candidate
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
        message: `User correction queued for review: "${question.slice(0, 30)}..."`,
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

  // 8. 24/7 SCHEDULED SYNCHRONIZATION (VERCEL CRON)
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
      message: 'Scheduled Omnia Synchronization Cron triggered.',
    });

    try {
      // Find any pending or unverified sources
      const pendingSources = Array.from(sourcesMap.values()).filter(
        (s) => s.status === 'PENDING' || s.status === 'PROCESSING'
      );

      let workflowResult: TrainingExecutionResult | null = null;
      if (pendingSources.length > 0) {
        workflowResult = await runOmniaLearningWorkflow(pendingSources, {
          existingSources: Array.from(sourcesMap.values()),
          onLog: (l) => logsList.unshift(l),
          persistFunction: async ({ source }) => {
            sourcesMap.set(source.sourceId, source);
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
