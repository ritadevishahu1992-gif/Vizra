import {
  KnowledgeRecord,
  KnowledgeState,
  SourceScore,
  ConflictRecord,
  ApprovalDecision,
  RetrievalBundle,
  ReasoningTrace,
  SafetyCheckpointResult,
  EvalReport,
} from '../types/omniaGovernance';
import { RAGChunk, CitationItem } from '../types/rag';

const KNOWLEDGE_RECORDS_KEY = 'vizra_omnia_knowledge_records_v1';
const CONFLICT_RECORDS_KEY = 'vizra_omnia_conflict_records_v1';
const APPROVALS_KEY = 'vizra_omnia_approvals_v1';
const TRACES_KEY = 'vizra_omnia_reasoning_traces_v1';

class OmniaGovernanceService {
  private records: Map<string, KnowledgeRecord> = new Map();
  private conflicts: Map<string, ConflictRecord> = new Map();
  private approvals: Map<string, ApprovalDecision> = new Map();
  private traces: Map<string, ReasoningTrace> = new Map();
  private evalReports: EvalReport[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.isInitialized) return;

    try {
      const storedRecs = localStorage.getItem(KNOWLEDGE_RECORDS_KEY);
      const storedConflicts = localStorage.getItem(CONFLICT_RECORDS_KEY);
      const storedApprovals = localStorage.getItem(APPROVALS_KEY);
      const storedTraces = localStorage.getItem(TRACES_KEY);

      if (storedRecs && storedConflicts && storedApprovals) {
        const pRecs: KnowledgeRecord[] = JSON.parse(storedRecs);
        const pConf: ConflictRecord[] = JSON.parse(storedConflicts);
        const pAppr: ApprovalDecision[] = JSON.parse(storedApprovals);

        pRecs.forEach((r) => this.records.set(r.id, r));
        pConf.forEach((c) => this.conflicts.set(c.id, c));
        pAppr.forEach((a) => this.approvals.set(a.id, a));

        if (storedTraces) {
          const pTraces: ReasoningTrace[] = JSON.parse(storedTraces);
          pTraces.forEach((t) => this.traces.set(t.trace_id, t));
        }
      } else {
        this.seedDefaultGovernanceData();
      }
    } catch {
      this.seedDefaultGovernanceData();
    }

    this.initEvalReports();
    this.isInitialized = true;
  }

  private save(): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      localStorage.setItem(
        KNOWLEDGE_RECORDS_KEY,
        JSON.stringify(Array.from(this.records.values()))
      );
      localStorage.setItem(
        CONFLICT_RECORDS_KEY,
        JSON.stringify(Array.from(this.conflicts.values()))
      );
      localStorage.setItem(
        APPROVALS_KEY,
        JSON.stringify(Array.from(this.approvals.values()))
      );
      localStorage.setItem(
        TRACES_KEY,
        JSON.stringify(Array.from(this.traces.values()).slice(-50))
      );
    } catch (e) {
      console.warn('Could not persist governance records', e);
    }
  }

  private seedDefaultGovernanceData(): void {
    this.records.clear();
    this.conflicts.clear();
    this.approvals.clear();

    // 1. Vizra Aesthetic Constitution (Version 2 with Version 1 in immutable history)
    const rec1: KnowledgeRecord = {
      id: 'rec_vizra_constitution',
      statement:
        'Vizra enforces strict dark obsidian aesthetics (#000000), 4% surgical red emphasis (#eb3b2d), zero generic pills, and 60fps kinetic motion trajectories.',
      topic: 'Vizra Platform Aesthetics',
      source: 'vizra_principles.md',
      source_type: 'platform_constitution',
      pub_date: '2026-09-01T00:00:00Z',
      verification_date: '2026-09-24T12:00:00Z',
      evidence: [
        'Design Constitution Section 2: Zero-Pill & Color Discipline',
        'Frontend Design Skill: obsidian contrast with single-accent hierarchy',
      ],
      confidence: 0.99,
      related_concepts: ['obsidian_palette', 'kinetic_motion', 'zero_slop'],
      contradictions: [],
      version: 2,
      state: 'HIGH_CONFIDENCE',
      source_score: {
        source_identity: 'Vizra Core Governance Committee',
        authority_tier: 'tier_1_official',
        primary_or_secondary: 'primary',
        pub_date: '2026-09-01T00:00:00Z',
        independent_confirmation_count: 5,
        consistency_flags: ['verified_governance_consensus'],
        misinfo_risk_score: 0.0,
        license_status: 'internal_only',
      },
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-24T12:00:00Z',
      history: [
        {
          version: 1,
          statement:
            'Vizra uses dark theme and red accents for user interfaces.',
          verification_date: '2026-09-01T00:00:00Z',
          confidence: 0.9,
          updated_by: 'system_initializer',
          rationale: 'Initial broad draft specification.',
        },
      ],
    };

    // 2. OMNIA Three Non-Negotiable Rules
    const rec2: KnowledgeRecord = {
      id: 'rec_omnia_governance_rules',
      statement:
        'OMNIA 1.0 operates under three non-negotiable rules: no silent trust (every statement must have provenance), no silent overwrite (immutable versioned knowledge), and no untracked autonomy (auditable trace IDs for all critical answers).',
      topic: 'OMNIA AI Governance Architecture',
      source: 'OMNIA_1.0_Architecture.md',
      source_type: 'architecture_specification',
      pub_date: '2026-09-20T00:00:00Z',
      verification_date: '2026-09-24T14:30:00Z',
      evidence: [
        'AI Studio Implementation Brief Page 2: Non-negotiable architectural rules',
        'Architecture v0.1 Section 1: Governed Intelligence Principles',
      ],
      confidence: 1.0,
      related_concepts: ['provenance', 'versioning', 'auditability', 'trace_id'],
      contradictions: [],
      version: 1,
      state: 'HIGH_CONFIDENCE',
      source_score: {
        source_identity: 'Lead AI Infrastructure Engineer Specification',
        authority_tier: 'tier_1_official',
        primary_or_secondary: 'primary',
        pub_date: '2026-09-20T00:00:00Z',
        independent_confirmation_count: 4,
        consistency_flags: ['lead_architecture_mandate'],
        misinfo_risk_score: 0.0,
        license_status: 'internal_only',
      },
      created_at: '2026-09-20T00:00:00Z',
      updated_at: '2026-09-24T14:30:00Z',
      history: [],
    };

    // 3. Cinema Camera Motion Control Rig Optical Transit (Conflict Case)
    const rec3: KnowledgeRecord = {
      id: 'rec_camera_rig_transit_engineering',
      statement:
        'The Cinema Camera Motion Control Rig optical IR carriage sensor timeout is configured at 1200ms to allow high-inertia dolly deceleration before triggering a stepper motor retry reversal.',
      topic: 'Motion Control Hardware Timing',
      source: 'camera_motion_rig_specs.md',
      source_type: 'engineering_specification',
      pub_date: '2026-09-21T00:00:00Z',
      verification_date: '2026-09-24T10:00:00Z',
      evidence: ['Section 2: Firmware & Dolly Logic — 1200ms optical deceleration window'],
      confidence: 0.88,
      related_concepts: ['ir_break_beam', 'stall_detection', 'nema17_reverse'],
      contradictions: ['rec_camera_rig_transit_safety'],
      version: 1,
      state: 'CONFLICTED',
      source_score: {
        source_identity: 'Hardware Engineering Team',
        authority_tier: 'tier_2_peer_reviewed',
        primary_or_secondary: 'primary',
        pub_date: '2026-09-21T00:00:00Z',
        independent_confirmation_count: 2,
        consistency_flags: ['hardware_lab_benchmark'],
        misinfo_risk_score: 0.05,
        license_status: 'internal_only',
      },
      created_at: '2026-09-21T00:00:00Z',
      updated_at: '2026-09-24T10:00:00Z',
      history: [],
      project_id: 'proj_camera_rig',
    };

    const rec4: KnowledgeRecord = {
      id: 'rec_camera_rig_transit_safety',
      statement:
        'The Studio Stage Rigging Protocol requires the optical carriage transit timeout not to exceed 800ms to prevent lens housing collision while the high-speed track interlock remains open.',
      topic: 'Motion Control Stage Safety Protocol',
      source: 'studio_rigging_protocol_v2.md',
      source_type: 'engineering_specification',
      pub_date: '2026-09-22T00:00:00Z',
      verification_date: '2026-09-24T11:00:00Z',
      evidence: ['Stage Safety Directive 4.1: Track interlock shutter latency'],
      confidence: 0.92,
      related_concepts: ['stage_safety', 'track_interlock'],
      contradictions: ['rec_camera_rig_transit_engineering'],
      version: 1,
      state: 'CONFLICTED',
      source_score: {
        source_identity: 'Studio Safety Engineering Committee',
        authority_tier: 'tier_1_official',
        primary_or_secondary: 'primary',
        pub_date: '2026-09-22T00:00:00Z',
        independent_confirmation_count: 3,
        consistency_flags: ['stage_safety_audit_approved'],
        misinfo_risk_score: 0.02,
        license_status: 'internal_only',
      },
      created_at: '2026-09-22T00:00:00Z',
      updated_at: '2026-09-24T11:00:00Z',
      history: [],
      project_id: 'proj_camera_rig',
    };

    // 4. Kerr Metric Singularity Physics
    const rec5: KnowledgeRecord = {
      id: 'rec_black_hole_kerr',
      statement:
        'In rotating Kerr black holes, the photon sphere sits at 1.5x the Schwarzschild radius, and asymmetric Doppler relativistic beaming brightens the approaching limb of the accretion disk.',
      topic: 'Relativistic Astrophysics',
      source: 'singularity_film_brief.md',
      source_type: 'scientific_reference',
      pub_date: '2026-09-18T00:00:00Z',
      verification_date: '2026-09-24T15:00:00Z',
      evidence: [
        'Kerr Metric Frame-Dragging Solutions',
        'Astrophysical Journal: Relativistic Accretion Modeling',
      ],
      confidence: 0.97,
      related_concepts: ['kerr_metric', 'photon_sphere', 'relativistic_beaming'],
      contradictions: [],
      version: 1,
      state: 'VERIFIED',
      source_score: {
        source_identity: 'Astrophysical Journal / Cambridge Relativity Group',
        authority_tier: 'tier_2_peer_reviewed',
        primary_or_secondary: 'primary',
        pub_date: '2026-09-18T00:00:00Z',
        independent_confirmation_count: 6,
        consistency_flags: ['peer_reviewed', 'mathematically_verified'],
        misinfo_risk_score: 0.01,
        license_status: 'approved_open',
      },
      created_at: '2026-09-18T00:00:00Z',
      updated_at: '2026-09-24T15:00:00Z',
      history: [],
      project_id: 'proj_singularity',
    };

    this.records.set(rec1.id, rec1);
    this.records.set(rec2.id, rec2);
    this.records.set(rec3.id, rec3);
    this.records.set(rec4.id, rec4);
    this.records.set(rec5.id, rec5);

    // Conflict Record: Explicit representation of disagreement
    const cnf1: ConflictRecord = {
      id: 'cnf_camera_rig_transit_window',
      record_ids: ['rec_camera_rig_transit_engineering', 'rec_camera_rig_transit_safety'],
      conflict_type: 'numerical_discrepancy',
      dates: ['2026-09-21', '2026-09-22'],
      source_quality_comparison:
        'Hardware Lab benchmark (1200ms dolly deceleration time) vs Stage Rigging Directive (800ms track interlock limit). Both sources are verified engineering authorities.',
      resolution_state: 'RESOLVED_BOTH_STORED',
      disputing_statements: [
        {
          record_id: 'rec_camera_rig_transit_engineering',
          statement: 'Optical carriage sensor transit timeout is 1200ms for smooth dolly deceleration.',
          source: 'camera_motion_rig_specs.md',
          confidence: 0.88,
        },
        {
          record_id: 'rec_camera_rig_transit_safety',
          statement: 'Studio Stage Rigging Protocol mandates max 800ms track exposure window.',
          source: 'studio_rigging_protocol_v2.md',
          confidence: 0.92,
        },
      ],
      notes:
        'Engineering team recommends multi-stage compromise: 900ms deceleration ramp with active optoelectronic track interlock. Both perspectives are explicitly preserved.',
      detected_at: '2026-09-23T08:15:00Z',
      resolved_at: '2026-09-24T09:30:00Z',
    };

    this.conflicts.set(cnf1.id, cnf1);

    // Human Approval Gate records
    const appr1: ApprovalDecision = {
      id: 'appr_kerr_audio',
      candidate_id: 'rec_black_hole_kerr',
      candidate_statement:
        'Kerr Metric relativistic beaming specifications approved for video production engine.',
      candidate_topic: 'Relativistic Astrophysics',
      reviewer_id: 'lead_system_auditor_01',
      decision: 'approved',
      risk_level: 'low',
      rationale:
        'Mathematical precision verified against peer-reviewed astrophysics papers.',
      timestamp: '2026-09-24T15:10:00Z',
    };

    const appr2: ApprovalDecision = {
      id: 'appr_esp32_firmware',
      candidate_id: 'rec_camera_rig_firmware_v2',
      candidate_statement:
        'ESP32 OTA firmware upgrade candidate with synchronized DMX lighting & motion keyframe triggers.',
      candidate_topic: 'Cinema Robotics Firmware',
      reviewer_id: 'governance_gatekeeper',
      decision: 'pending',
      risk_level: 'medium',
      rationale:
        'High-speed studio motion hardware telemetry. Awaiting independent stage rigging review.',
      timestamp: '2026-09-24T16:00:00Z',
    };

    this.approvals.set(appr1.id, appr1);
    this.approvals.set(appr2.id, appr2);

    this.save();
  }

  private initEvalReports(): void {
    const recordsList = Array.from(this.records.values());
    const verifiedCount = recordsList.filter(
      (r) => r.state === 'HIGH_CONFIDENCE' || r.state === 'VERIFIED'
    ).length;
    const avgConfidence =
      recordsList.length > 0
        ? Math.round(
            (recordsList.reduce((acc, r) => acc + r.confidence, 0) / recordsList.length) * 1000
          ) / 10
        : 0;

    // Dynamically calculate source attribution coverage from stored evidence & source_score
    const attributedCount = recordsList.filter(
      (r) => Boolean(r.source_score?.source_identity) && Array.isArray(r.evidence) && r.evidence.length > 0
    ).length;
    const computedAttributionRecall =
      recordsList.length > 0
        ? Math.round((attributedCount / recordsList.length) * 1000) / 10
        : 0;

    const tracesList = Array.from(this.traces.values());
    const safeTraces = tracesList.filter((t) => t.safety_check?.allowed !== false).length;
    const computedSafetyRate =
      tracesList.length > 0
        ? Math.round((safeTraces / tracesList.length) * 1000) / 10
        : recordsList.length > 0
        ? Math.round(
            (recordsList.filter((r) => (r.source_score?.misinfo_risk_score ?? 0) < 0.2).length /
              recordsList.length) *
              1000
          ) / 10
        : 0;

    // Compute distinct observed trace intents / coverage (0 when no traces recorded)
    const distinctObservedIntents = new Set(tracesList.map((t) => t.intent).filter(Boolean)).size;
    const computedMultilingualOrIntentCoverage =
      tracesList.length > 0
        ? Math.min(100, Math.round((distinctObservedIntents / Math.max(1, tracesList.length)) * 1000) / 10)
        : 0;

    const blockedTraces = tracesList.length - safeTraces;
    const observedIssueRate =
      recordsList.length > 0
        ? Math.round(
            ((recordsList.filter((r) => r.contradictions && r.contradictions.length > 0).length + blockedTraces) /
              Math.max(1, recordsList.length + tracesList.length)) *
              1000
          ) / 10
        : 0;

    this.evalReports = [
      {
        id: 'eval_live_runtime_v1',
        evaluation_date: new Date().toISOString(),
        version: `OMNIA 1.0 Live Telemetry (${recordsList.length} Records, ${verifiedCount} Verified, ${tracesList.length} Traces)`,
        factual_accuracy_score: avgConfidence,
        hallucination_rate: observedIssueRate,
        attribution_recall: computedAttributionRecall,
        multilingual_coverage_score: computedMultilingualOrIntentCoverage,
        safety_pass_rate: computedSafetyRate,
        status: avgConfidence >= 80 ? 'passed' : 'warning',
        benchmark_name:
          tracesList.length > 0
            ? 'Live Corpus & Runtime Trace Telemetry'
            : 'Live Corpus Metrics Only (0 Runtime Traces Recorded Yet)',
      },
    ];
  }

  // -------------------------------------------------------------
  // Versioned Knowledge DB Operations
  // -------------------------------------------------------------

  public getKnowledgeRecords(): KnowledgeRecord[] {
    this.init();
    return Array.from(this.records.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  public getKnowledgeRecord(id: string): KnowledgeRecord | undefined {
    this.init();
    return this.records.get(id);
  }

  /**
   * Updates a knowledge record using optimistic locking (no silent overwrite!)
   */
  public updateKnowledgeRecord(
    id: string,
    updates: {
      statement: string;
      confidence?: number;
      updated_by: string;
      rationale: string;
      expected_version: number;
    }
  ): { success: boolean; error?: string; record?: KnowledgeRecord } {
    this.init();
    const existing = this.records.get(id);
    if (!existing) {
      return { success: false, error: `Record ${id} not found.` };
    }

    if (existing.version !== updates.expected_version) {
      return {
        success: false,
        error: `Optimistic lock violation: Record ${id} is at version ${existing.version}, expected ${updates.expected_version}. Reload to resolve.`,
      };
    }

    const previousHistory = existing.history || [];
    const archivedVersion = {
      version: existing.version,
      statement: existing.statement,
      verification_date: existing.verification_date,
      confidence: existing.confidence,
      updated_by: updates.updated_by,
      rationale: updates.rationale,
    };

    const newVersion = existing.version + 1;
    const now = new Date().toISOString();

    const updatedRecord: KnowledgeRecord = {
      ...existing,
      statement: updates.statement,
      confidence: updates.confidence !== undefined ? updates.confidence : existing.confidence,
      version: newVersion,
      verification_date: now,
      updated_at: now,
      history: [archivedVersion, ...previousHistory],
    };

    this.records.set(id, updatedRecord);
    this.save();
    return { success: true, record: updatedRecord };
  }

  /**
   * Adds a new knowledge record through the governed path
   */
  public addKnowledgeRecord(
    params: Omit<KnowledgeRecord, 'id' | 'version' | 'history' | 'created_at' | 'updated_at'>
  ): KnowledgeRecord {
    this.init();
    const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const record: KnowledgeRecord = {
      ...params,
      id,
      version: 1,
      created_at: now,
      updated_at: now,
      history: [],
    };

    this.records.set(id, record);
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // Conflict Engine Operations
  // -------------------------------------------------------------

  public getConflictRecords(): ConflictRecord[] {
    this.init();
    return Array.from(this.conflicts.values());
  }

  public getConflictsForRecords(recordIds: string[]): ConflictRecord[] {
    this.init();
    return Array.from(this.conflicts.values()).filter((c) =>
      c.record_ids.some((rId) => recordIds.includes(rId))
    );
  }

  public resolveConflict(
    conflictId: string,
    resolution: ConflictRecord['resolution_state'],
    notes: string
  ): boolean {
    this.init();
    const c = this.conflicts.get(conflictId);
    if (!c) return false;

    c.resolution_state = resolution;
    c.notes = notes;
    c.resolved_at = new Date().toISOString();
    this.conflicts.set(conflictId, c);
    this.save();
    return true;
  }

  // -------------------------------------------------------------
  // Human Approval Gate Operations
  // -------------------------------------------------------------

  public getApprovals(): ApprovalDecision[] {
    this.init();
    return Array.from(this.approvals.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public reviewApproval(
    id: string,
    decision: 'approved' | 'rejected' | 'escalated',
    rationale: string,
    reviewerId: string = 'human_reviewer'
  ): boolean {
    this.init();
    const item = this.approvals.get(id);
    if (!item) return false;

    item.decision = decision;
    item.rationale = rationale;
    item.reviewer_id = reviewerId;
    item.timestamp = new Date().toISOString();
    this.approvals.set(id, item);
    this.save();
    return true;
  }

  // -------------------------------------------------------------
  // Safety Checkpoint & Audit
  // -------------------------------------------------------------

  public evaluateSafety(query: string, content: string): SafetyCheckpointResult {
    const piiRegex = /\b\d{3}-\d{2}-\d{4}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
    const hasPii = piiRegex.test(query) || piiRegex.test(content);

    const bannedPatterns = [/drop\s+database/i, /delete\s+all\s+users/i, /rm\s+-rf\s+\//i];
    const riskFlags: string[] = [];

    for (const p of bannedPatterns) {
      if (p.test(query) || p.test(content)) {
        riskFlags.push('destructive_command_violation');
      }
    }

    const allowed = riskFlags.length === 0;

    return {
      allowed,
      risk_flags: riskFlags,
      pii_detected: hasPii,
      redactions_applied: hasPii ? 1 : 0,
      policy_version: 'omnia_safety_v1.4',
      checked_at: new Date().toISOString(),
      audit_entry_id: `safe_audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
  }

  // -------------------------------------------------------------
  // Retrieval Bundle & Traceability
  // -------------------------------------------------------------

  /**
   * Retrieves verified structured knowledge records, vector chunks, and explicit conflict context
   */
  public buildRetrievalBundle(
    query: string,
    vectorChunks: RAGChunk[],
    projectId?: string
  ): RetrievalBundle {
    this.init();
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter((w) => w.length > 2);

    // Search structured Knowledge DB
    const matchedRecords: KnowledgeRecord[] = [];

    for (const rec of this.records.values()) {
      if (projectId && rec.project_id && rec.project_id !== projectId) {
        continue;
      }

      // Platform Constitution Isolation Rule: Internal platform documents must ONLY match if the query is explicitly about Vizra/Omnia
      const isInternalPlatformQuery =
        /(vizra|omnia|platform\s*architecture|creative\s*engine|design\s*constitution|rag\s*specification)/i.test(queryLower);

      if (!rec.project_id && !isInternalPlatformQuery) {
        continue;
      }

      // Project Isolation Rule: PROJECT DATA IS NOT GLOBAL KNOWLEDGE.
      // If a record belongs to a project, ONLY include it if the project is active or explicitly referenced.
      if (rec.project_id) {
        const matchesQueryProject =
          (rec.project_id === 'proj_camera_rig' && /(camera\s*rig|motion\s*control|dolly|esp32|nema|carriage)/i.test(queryLower)) ||
          (rec.project_id === 'proj_singularity' && /(singularity|kerr|film|cinematic|black hole film)/i.test(queryLower));

        if (projectId) {
          if (rec.project_id !== projectId) continue;
        } else if (!matchesQueryProject) {
          continue;
        }
      }

      const recText = `${rec.statement} ${rec.topic} ${rec.related_concepts.join(' ')}`.toLowerCase();
      let matchCount = 0;
      for (const w of words) {
        if (recText.includes(w)) matchCount++;
      }

      // Require at least 2 substantive word matches to avoid accidental single-word triggers
      if (matchCount >= 2 || (projectId && rec.project_id === projectId)) {
        matchedRecords.push(rec);
      }
    }

    // Detect if any matched records have active conflicts
    const recordIds = matchedRecords.map((r) => r.id);
    const conflicts = this.getConflictsForRecords(recordIds);

    // Calculate knowledge state
    let overallConfidence = 0.95;
    let knowledgeState: KnowledgeState = 'HIGH_CONFIDENCE';

    if (conflicts.length > 0) {
      knowledgeState = 'CONFLICTED';
      overallConfidence = 0.82;
    } else if (matchedRecords.some((r) => r.state === 'UNCERTAIN')) {
      knowledgeState = 'UNCERTAIN';
      overallConfidence = 0.75;
    } else if (matchedRecords.length === 0 && vectorChunks.length === 0) {
      knowledgeState = 'UNPROCESSED';
      overallConfidence = 0.7;
    }

    return {
      knowledge_records: matchedRecords.slice(0, 3),
      vector_chunks: vectorChunks,
      conflicts,
      confidence_summary: {
        overall_confidence: overallConfidence,
        knowledge_state: knowledgeState,
        verified_records_count: matchedRecords.filter((r) => r.state === 'HIGH_CONFIDENCE' || r.state === 'VERIFIED').length,
        has_unresolved_conflicts: conflicts.some((c) => c.resolution_state === 'UNRESOLVED'),
      },
    };
  }

  /**
   * Creates an immutable Reasoning Trace for the answer
   */
  public logReasoningTrace(trace: ReasoningTrace): void {
    this.init();
    this.traces.set(trace.trace_id, trace);
    this.save();
  }

  public getTrace(traceId: string): ReasoningTrace | undefined {
    this.init();
    return this.traces.get(traceId);
  }

  public getEvalReports(): EvalReport[] {
    this.init();
    return this.evalReports;
  }
}

export const omniaGovernanceService = new OmniaGovernanceService();
