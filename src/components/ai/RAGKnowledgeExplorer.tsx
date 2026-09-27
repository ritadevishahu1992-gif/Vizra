import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Database,
  UploadCloud,
  Search,
  Cpu,
  Layers,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  ShieldCheck,
  Tag,
  Hash,
  Clock,
  ArrowRight,
  Code,
  Check,
  GitBranch,
  AlertTriangle,
  History,
  UserCheck,
  CheckSquare,
  Lock,
} from 'lucide-react';
import {
  RAGDocument,
  RAGChunk,
  RetrievalResult,
  KnowledgeTier,
  RAGSystemStats,
} from '../../types/rag';
import {
  KnowledgeRecord,
  ConflictRecord,
  ApprovalDecision,
  EvalReport,
} from '../../types/omniaGovernance';
import { ragVectorStore } from '../../services/ragVectorStore';
import { omniaGovernanceService } from '../../services/omniaGovernanceService';
import { CHUNK_CONFIG } from '../../services/ragIngestionService';

interface RAGKnowledgeExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId?: string | null;
}

type TabType =
  | 'corpus'
  | 'ingest'
  | 'versioned_db'
  | 'conflicts'
  | 'approvals'
  | 'sandbox'
  | 'architecture';

export const RAGKnowledgeExplorer: React.FC<RAGKnowledgeExplorerProps> = ({
  isOpen,
  onClose,
  activeProjectId,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('corpus');
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selectedTier, setSelectedTier] = useState<KnowledgeTier | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [stats, setStats] = useState<RAGSystemStats | null>(null);

  // Governance states
  const [knowledgeRecords, setKnowledgeRecords] = useState<KnowledgeRecord[]>([]);
  const [conflictRecords, setConflictRecords] = useState<ConflictRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalDecision[]>([]);
  const [evalReports, setEvalReports] = useState<EvalReport[]>([]);

  // Record editing with optimistic locking
  const [editingRecord, setEditingRecord] = useState<KnowledgeRecord | null>(null);
  const [editStatement, setEditStatement] = useState('');
  const [editRationale, setEditRationale] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Approval review state
  const [reviewingItem, setReviewingItem] = useState<ApprovalDecision | null>(null);
  const [reviewRationale, setReviewRationale] = useState('');

  // Chunk inspection modal
  const [inspectingDoc, setInspectingDoc] = useState<RAGDocument | null>(null);
  const [inspectingChunks, setInspectingChunks] = useState<RAGChunk[]>([]);

  // Ingestion form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTier, setUploadTier] = useState<KnowledgeTier>('project');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Sandbox state
  const [sandboxQuery, setSandboxQuery] = useState('How does the smart medicine dispenser jam detection work?');
  const [sandboxAlpha, setSandboxAlpha] = useState(0.6);
  const [sandboxMinScore, setSandboxMinScore] = useState(0.2);
  const [sandboxResults, setSandboxResults] = useState<RetrievalResult[]>([]);
  const [sandboxLatency, setSandboxLatency] = useState<number | null>(null);
  const [isSearchingSandbox, setIsSearchingSandbox] = useState(false);

  // Reload documents and stats on open
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    const docs = ragVectorStore.getDocuments();
    setDocuments(docs);
    setStats(ragVectorStore.getStats());
    setKnowledgeRecords(omniaGovernanceService.getKnowledgeRecords());
    setConflictRecords(omniaGovernanceService.getConflictRecords());
    setApprovals(omniaGovernanceService.getApprovals());
    setEvalReports(omniaGovernanceService.getEvalReports());
  };

  const handleStartEditRecord = (rec: KnowledgeRecord) => {
    setEditingRecord(rec);
    setEditStatement(rec.statement);
    setEditRationale('');
    setEditError(null);
    setEditSuccess(false);
  };

  const handleSaveEditRecord = () => {
    if (!editingRecord) return;
    if (!editStatement.trim()) {
      setEditError('Statement cannot be empty.');
      return;
    }
    if (!editRationale.trim()) {
      setEditError('Governance mandate: A rationale is required for updating knowledge records.');
      return;
    }

    const res = omniaGovernanceService.updateKnowledgeRecord(editingRecord.id, {
      statement: editStatement.trim(),
      updated_by: 'lead_system_engineer',
      rationale: editRationale.trim(),
      expected_version: editingRecord.version,
    });

    if (!res.success) {
      setEditError(res.error || 'Failed to update record.');
    } else {
      setEditSuccess(true);
      loadData();
      setTimeout(() => {
        setEditingRecord(null);
        setEditSuccess(false);
      }, 1200);
    }
  };

  const handleReviewApprovalAction = (decision: 'approved' | 'rejected' | 'escalated') => {
    if (!reviewingItem) return;
    omniaGovernanceService.reviewApproval(
      reviewingItem.id,
      decision,
      reviewRationale || `Reviewed and ${decision} by Lead Auditor.`,
      'lead_system_auditor_01'
    );
    loadData();
    setReviewingItem(null);
    setReviewRationale('');
  };

  const handleInspectDoc = (doc: RAGDocument) => {
    setInspectingDoc(doc);
    const chunks = ragVectorStore.getDocumentChunks(doc.id);
    setInspectingChunks(chunks);
  };

  const handleDeleteDoc = (docId: string) => {
    if (confirm('Delete this document and purge all associated vector embeddings?')) {
      ragVectorStore.deleteDocument(docId);
      loadData();
      if (inspectingDoc?.id === docId) {
        setInspectingDoc(null);
      }
    }
  };

  const handleReindexDoc = async (docId: string) => {
    await ragVectorStore.reindexDocument(docId);
    loadData();
  };

  const handleResetCorpus = () => {
    if (confirm('Reset knowledge base to default seeded specification documents?')) {
      ragVectorStore.resetToDefault();
      loadData();
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadContent(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteIngestion = async () => {
    if (!uploadContent || !uploadFileName) {
      setUploadError('Please select a file or paste document content.');
      return;
    }

    setUploadError(null);
    setUploadSuccess(false);

    try {
      await ragVectorStore.ingestFile(
        {
          name: uploadFileName,
          size: uploadContent.length,
          content: uploadContent,
        },
        {
          title: uploadTitle.trim() || uploadFileName,
          tier: uploadTier,
          projectId: activeProjectId || 'proj_active',
        },
        (stage, pct) => {
          setUploadStage(stage);
          setUploadPercent(pct);
        }
      );

      setUploadSuccess(true);
      loadData();
      setTimeout(() => {
        setUploadTitle('');
        setUploadFileName('');
        setUploadContent('');
        setUploadStage('');
        setUploadPercent(0);
        setUploadSuccess(false);
        setActiveTab('corpus');
      }, 1500);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to ingest document');
      setUploadPercent(0);
    }
  };

  const handleRunSandboxQuery = async () => {
    if (!sandboxQuery.trim()) return;
    setIsSearchingSandbox(true);
    const start = performance.now();

    try {
      const results = await ragVectorStore.query(sandboxQuery, {
        alpha: sandboxAlpha,
        minScore: sandboxMinScore,
        topK: 5,
        projectId: activeProjectId || undefined,
      });
      const duration = Math.round(performance.now() - start);
      setSandboxResults(results);
      setSandboxLatency(duration);
    } finally {
      setIsSearchingSandbox(false);
    }
  };

  // Pre-seed sample files
  const handleLoadSample = (type: 'medicine' | 'omnia' | 'engines' | 'blackhole') => {
    if (type === 'medicine') {
      setUploadFileName('iot_smart_pill_dispenser_v2.md');
      setUploadTitle('IoT Smart Pill Dispenser Architecture v2');
      setUploadTier('project');
      setUploadContent(`# IoT Smart Pill Dispenser Architecture v2
Project: Medical Robotics & Adherence

## Section 1: Actuation & Pod Verification
The 28-slot cylindrical carousel is indexed by a 42BYGH401 NEMA 17 stepper motor driven by an A4988 driver module at 1/16th microstepping.
- Feedback Mechanism: A reflective phototransistor sensor array monitors carousel tooth alignment.
- Descent Confirmation: Dual opposed infrared emitter-detectors register the falling medication pod before closing the collection gate.

## Section 2: Connectivity & Security
- Cloud Communication: Encrypted WebSockets over TLS with mutual certificate authentication.
- Offline Fallback: Embedded EEPROM caches up to 60 days of adherence timestamps and dosage alarm schedules.`);
    } else if (type === 'omnia') {
      setUploadFileName('omnia_intent_engine_v1.md');
      setUploadTitle('Omnia 1.0 Intent Classification Pipeline');
      setUploadTier('omnia');
      setUploadContent(`# Omnia 1.0 Intent Classification Pipeline
Lead AI Systems Architecture

## Section 1: Intent Evaluation Hierarchy
Incoming user prompts are processed through a strict hierarchical decision tree:
1. QUESTION -> Direct factual answer without extraneous conversational padding.
2. CONVERSATION -> Natural, warm engagement in the user's primary language.
3. RESEARCH -> Multi-source fact verification with academic and domain citations.
4. CREATE -> Launch creation flow across the 8 Creative Hub disciplines.
5. PROJECT -> Enter active project context memory and workflow stages.

Never default to project mode for exploratory or conversational inquiries.`);
    } else if (type === 'engines') {
      setUploadFileName('creative_engines_overview.md');
      setUploadTitle('Vizra Creative Studio Tools');
      setUploadTier('vizra');
      setUploadContent(`# Vizra Creative Studio Tools
Platform Engine Guide

## Section 1: Motion & 60fps Kinetic Guidelines
Vizra UI interactions use custom Bezier cubic easing curves:
- Fast In, Smooth Decel: cubic-bezier(0.16, 1, 0.3, 1)
- Color Discipline: Pure obsidian black background with surgical 4% Vizra Red emphasis.
- Zero AI Slop: No blue gradients, no rounded pills, strictly sharp editorial hierarchy.`);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (selectedTier !== 'all' && doc.tier !== selectedTier) return false;
    if (
      searchFilter &&
      !doc.title.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !doc.file_name.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="relative w-full max-w-5xl h-[88vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#eb3b2d]/10 border border-[#eb3b2d]/30 flex items-center justify-center text-[#eb3b2d]">
                <Database size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    OMNIA 1.0 RAG Knowledge Base
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                    Spec v1.0
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Externalized Document Corpus, Semantic Hierarchy Chunking & Hybrid Vector Store
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
                aria-label="Close Knowledge Base Explorer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 border-b border-neutral-850 flex items-center gap-1 bg-neutral-950/60 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('corpus')}
              className={`px-3.5 py-3 text-xs font-semibold tracking-tight border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'corpus'
                  ? 'border-[#eb3b2d] text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileText size={14} />
              <span>Document Corpus ({documents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ingest')}
              className={`px-3.5 py-3 text-xs font-semibold tracking-tight border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'ingest'
                  ? 'border-[#eb3b2d] text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <UploadCloud size={14} />
              <span>Ingestion Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('versioned_db')}
              className={`px-3.5 py-3 text-xs font-semibold tracking-tight border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'versioned_db'
                  ? 'border-[#eb3b2d] text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <GitBranch size={14} />
              <span>Versioned DB ({knowledgeRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('conflicts')}
              className={`px-3.5 py-3 text-xs font-semibold tracking-tight border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'conflicts'
                  ? 'border-[#eb3b2d] text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <AlertTriangle size={14} className={conflictRecords.length > 0 ? 'text-amber-400' : ''} />
              <span>Conflict Engine ({conflictRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3.5 py-3 text-xs font-semibold tracking-tight border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'approvals'
                  ? 'border-[#eb3b2d] text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <CheckSquare size={14} />
              <span>Approval Gate ({approvals.filter((a) => a.decision === 'pending').length} Pending)</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3.5 py-3 text-xs font-semibold tracking-tight border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'sandbox'
                  ? 'border-[#eb3b2d] text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Search size={14} />
              <span>Retrieval Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3.5 py-3 text-xs font-semibold tracking-tight border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'architecture'
                  ? 'border-[#eb3b2d] text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Cpu size={14} />
              <span>Architecture & Evaluation</span>
            </button>
          </div>

          {/* Main Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* TAB 1: DOCUMENT CORPUS */}
            {activeTab === 'corpus' && (
              <div className="space-y-4">
                {/* Search & Tier Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                    />
                    <input
                      type="text"
                      placeholder="Filter indexed documents..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#eb3b2d]"
                    />
                  </div>

                  {/* Tier Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    {(['all', 'project', 'omnia', 'vizra', 'global'] as const).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setSelectedTier(tier)}
                        className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition-colors cursor-pointer ${
                          selectedTier === tier
                            ? 'bg-neutral-800 text-white border-neutral-700'
                            : 'bg-neutral-900/40 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        {tier === 'all' ? 'All Tiers' : tier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document List Cards */}
                {filteredDocs.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-neutral-800 rounded-2xl p-6">
                    <Database size={28} className="mx-auto text-neutral-600 mb-2" />
                    <h3 className="text-sm font-semibold text-neutral-300">No documents found</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      No documents match your query or tier filter. Ingest new documents or reset to default seeds.
                    </p>
                    <button
                      onClick={handleResetCorpus}
                      className="mt-4 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white cursor-pointer"
                    >
                      Reset Default Seeds
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/80 hover:border-neutral-700 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-neutral-850 flex items-center justify-center text-neutral-300 shrink-0">
                              <FileText size={16} className="text-[#eb3b2d]" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-xs text-white truncate">
                                {doc.title}
                              </h4>
                              <p className="text-[11px] font-mono text-neutral-500 truncate">
                                {doc.file_name}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize shrink-0 ${
                              doc.tier === 'project'
                                ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                                : doc.tier === 'omnia'
                                ? 'bg-purple-950/40 text-purple-400 border-purple-800/40'
                                : doc.tier === 'vizra'
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                                : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                            }`}
                          >
                            {doc.tier}
                          </span>
                        </div>

                        {/* Metrics Bar */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-850/60">
                          <div className="flex items-center gap-3">
                            <span>{doc.chunk_count} Chunks</span>
                            <span>~{doc.token_count} Tokens</span>
                            <span className="uppercase text-neutral-500">{doc.access_level}</span>
                          </div>

                          <span className="text-[10px] text-neutral-500">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-1 gap-2">
                          <button
                            type="button"
                            onClick={() => handleInspectDoc(doc)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            View Chunks ({doc.chunk_count})
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReindexDoc(doc.id)}
                              title="Re-index document"
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                            >
                              <RefreshCw size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id)}
                              title="Purge document"
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: INGESTION ENGINE */}
            {activeTab === 'ingest' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Document Ingestion Pipeline
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Upload TXT, Markdown, PDF, DOCX, CSV, or JSON. Documents are parsed, split by semantic headings (512 tokens), and embedded into the vector index.
                  </p>
                </div>

                {/* Quick Sample Injections */}
                <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    Quick Sample Blueprints
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadSample('medicine')}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition-colors cursor-pointer"
                    >
                      💊 Smart Pill Dispenser Architecture
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('omnia')}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition-colors cursor-pointer"
                    >
                      ⚡ Omnia 1.0 Intent Engine
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('engines')}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition-colors cursor-pointer"
                    >
                      🎨 Creative Engine Matrix Guide
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 mb-1">
                        Document Title
                      </label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g. Flight System Telemetry Specs"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#eb3b2d]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-400 mb-1">
                        Target Knowledge Tier
                      </label>
                      <select
                        value={uploadTier}
                        onChange={(e) => setUploadTier(e.target.value as KnowledgeTier)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#eb3b2d]"
                      >
                        <option value="project">Project Knowledge (Current User)</option>
                        <option value="workspace">Workspace Knowledge (Team Shared)</option>
                        <option value="omnia">Omnia Knowledge (Architecture)</option>
                        <option value="vizra">Vizra Knowledge (Platform Docs)</option>
                        <option value="global">Global Knowledge (Policies)</option>
                      </select>
                    </div>
                  </div>

                  {/* File dropzone / selector */}
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 mb-1">
                      Source File (TXT, MD, PDF, DOCX, CSV, JSON)
                    </label>
                    <div className="p-4 border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-xl text-center space-y-2 cursor-pointer bg-neutral-950">
                      <input
                        type="file"
                        onChange={handleFileUploadChange}
                        accept=".txt,.md,.markdown,.pdf,.docx,.csv,.json"
                        className="hidden"
                        id="rag-file-input"
                      />
                      <label
                        htmlFor="rag-file-input"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <UploadCloud size={24} className="text-[#eb3b2d] mb-1" />
                        <span className="text-xs font-medium text-white">
                          {uploadFileName ? uploadFileName : 'Choose file or drag & drop here'}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          Max 25MB • Formats: TXT, MD, PDF, DOCX, CSV, JSON
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Document Text Area Preview */}
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 mb-1">
                      Raw Content Payload
                    </label>
                    <textarea
                      rows={6}
                      value={uploadContent}
                      onChange={(e) => setUploadContent(e.target.value)}
                      placeholder="Or directly paste raw Markdown, JSON, CSV, or text content here..."
                      className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#eb3b2d] resize-none"
                    />
                  </div>

                  {/* Ingestion Progress Bar */}
                  {uploadStage && (
                    <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-300 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#eb3b2d] animate-pulse" />
                          {uploadStage}
                        </span>
                        <span className="text-neutral-400">{uploadPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#eb3b2d] transition-all duration-300"
                          style={{ width: `${uploadPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Feedback alerts */}
                  {uploadError && (
                    <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200 flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Document successfully processed, chunked, and stored in vector index!</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleExecuteIngestion}
                    disabled={!uploadContent || uploadPercent > 0}
                    className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Sparkles size={14} className="text-[#eb3b2d]" />
                    <span>Run Ingestion Pipeline</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: VECTOR RETRIEVAL SANDBOX */}
            {activeTab === 'sandbox' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Vector Retrieval Sandbox & Hybrid Search Tester
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Test queries against the OMNIA RAG index in real time. Inspect Dense Cosine scores, BM25 sparse keyword matches, and combined hybrid rank fusion.
                  </p>
                </div>

                {/* Query Input Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      value={sandboxQuery}
                      onChange={(e) => setSandboxQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRunSandboxQuery()}
                      placeholder="Type a test query (e.g. 'How does pill drop sensor verify transit?')"
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#eb3b2d]"
                    />
                  </div>
                  <button
                    onClick={handleRunSandboxQuery}
                    disabled={isSearchingSandbox}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#eb3b2d] hover:bg-[#eb3b2d]/90 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <Search size={14} />
                    <span>{isSearchingSandbox ? 'Retrieving…' : 'Test Retrieval'}</span>
                  </button>
                </div>

                {/* Parameter Sliders */}
                <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Hybrid Alpha (Dense vs Sparse)</span>
                      <span className="text-white">{(sandboxAlpha * 100).toFixed(0)}% Dense</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sandboxAlpha}
                      onChange={(e) => setSandboxAlpha(parseFloat(e.target.value))}
                      className="w-full accent-[#eb3b2d]"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
                      <span>0.0 (Pure BM25)</span>
                      <span>0.6 (Default)</span>
                      <span>1.0 (Pure Vector)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Minimum Score Cutoff</span>
                      <span className="text-white">{(sandboxMinScore * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={sandboxMinScore}
                      onChange={(e) => setSandboxMinScore(parseFloat(e.target.value))}
                      className="w-full accent-[#eb3b2d]"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
                      <span>0.1 (Broad)</span>
                      <span>0.25 (Balanced)</span>
                      <span>0.8 (Strict)</span>
                    </div>
                  </div>
                </div>

                {/* Results View */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>
                      Retrieved Results ({sandboxResults.length} Chunks Matched)
                    </span>
                    {sandboxLatency !== null && (
                      <span className="text-neutral-400">
                        Execution Latency:{' '}
                        <strong className="text-emerald-400">{sandboxLatency}ms</strong>
                      </span>
                    )}
                  </div>

                  {sandboxResults.length === 0 ? (
                    <div className="p-8 border border-neutral-800 rounded-xl text-center text-xs text-neutral-500">
                      Click "Test Retrieval" above to evaluate matching chunks and hybrid scoring.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sandboxResults.map((res) => (
                        <div
                          key={res.chunk.id}
                          className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-mono font-bold flex items-center justify-center text-[#eb3b2d]">
                                #{res.rank}
                              </span>
                              <span className="text-xs font-semibold text-white">
                                {res.chunk.metadata.file_name}
                              </span>
                              <span className="text-neutral-500 text-xs">/</span>
                              <span className="text-xs text-neutral-300 font-mono">
                                {res.chunk.metadata.section}
                              </span>
                            </div>

                            {/* Score Badges */}
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                                Dense: {(res.denseScore * 100).toFixed(0)}%
                              </span>
                              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                                BM25: {(res.sparseScore * 100).toFixed(0)}%
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-semibold">
                                Hybrid: {(res.hybridScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Chunk Text Excerpt */}
                          <div className="p-3 rounded-lg bg-black/60 border border-neutral-850 text-xs font-mono text-neutral-200 leading-relaxed whitespace-pre-wrap">
                            {res.chunk.text}
                          </div>

                          {/* Matched Keywords */}
                          {res.matchedTerms.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                              <span className="text-neutral-500">Lexical Terms Matched:</span>
                              <div className="flex flex-wrap gap-1">
                                {res.matchedTerms.map((t) => (
                                  <span
                                    key={t}
                                    className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 text-[10px]"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ARCHITECTURE & HEALTH */}
            {activeTab === 'architecture' && stats && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    OMNIA 1.0 RAG System Architecture & Health
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Underlying vector store diagnostics, semantic chunking boundaries, and tenant isolation policies.
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500">Total Documents</span>
                    <p className="text-xl font-bold text-white">{stats.totalDocuments}</p>
                    <span className="text-[10px] text-neutral-500">Across all tiers</span>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500">Indexed Chunks</span>
                    <p className="text-xl font-bold text-[#eb3b2d]">{stats.totalChunks}</p>
                    <span className="text-[10px] text-neutral-500">512-token chunks</span>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500">Corpus Tokens</span>
                    <p className="text-xl font-bold text-emerald-400">~{stats.totalTokens}</p>
                    <span className="text-[10px] text-neutral-500">Estimated volume</span>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500">Vector Dimension</span>
                    <p className="text-xl font-bold text-purple-400">{stats.vectorDimension}d</p>
                    <span className="text-[10px] text-neutral-500">L2 Normalized</span>
                  </div>
                </div>

                {/* Configuration Specs */}
                <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                    Pipeline Configuration Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-850">
                      <span className="text-neutral-500 block mb-0.5">Semantic Chunk Engine</span>
                      <p className="text-neutral-200">
                        Target: {CHUNK_CONFIG.CHUNK_SIZE_TOKENS} tokens | Overlap: {CHUNK_CONFIG.OVERLAP_TOKENS} tokens
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Boundaries: Headings (#, ##, ###), Code blocks (```), Paragraphs
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-850">
                      <span className="text-neutral-500 block mb-0.5">Embedding Model</span>
                      <p className="text-neutral-200">gemini-embedding-2-preview</p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Fallback: 384d Local Semantic Vectorizer with unit cosine projection
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-850">
                      <span className="text-neutral-500 block mb-0.5">Hybrid Ranking Formula</span>
                      <p className="text-neutral-200">Score = 0.6 × Dense + 0.4 × BM25 Sparse</p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Reciprocal rank fusion with 2048-token context packing
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-850">
                      <span className="text-neutral-500 block mb-0.5">Duplicate Avoidance</span>
                      <p className="text-neutral-200">SHA-256 / Content Hash Matching</p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Duplicate chunks skipped during ingestion to eliminate vector bloat
                      </p>
                    </div>
                  </div>
                </div>

                {/* Knowledge Hierarchy Visualizer */}
                <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                    Knowledge Hierarchy & Access Tiers
                  </h4>
                  <div className="p-4 rounded-lg bg-black border border-neutral-850 text-xs font-mono text-neutral-300 space-y-1.5">
                    <p className="text-white font-bold">Knowledge Base Root</p>
                    <p className="pl-4 text-emerald-400">├── Global Knowledge (System identity, core policies) [Public Read]</p>
                    <p className="pl-4 text-emerald-400">├── Vizra Knowledge (Platform docs, features, SDKs) [Public Read]</p>
                    <p className="pl-4 text-purple-400">├── OMNIA Knowledge (Architecture, workflows, prompts) [System Read-Only]</p>
                    <p className="pl-4 text-neutral-400">└── Tenant Isolation Tier</p>
                    <p className="pl-8 text-neutral-300">├── Workspace Knowledge (Shared team files) [Workspace Required]</p>
                    <p className="pl-8 text-amber-400">└── Project Knowledge (Isolated user project files) [Owner Only]</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-neutral-500">
                    Need to restore factory default blueprints?
                  </span>
                  <button
                    onClick={handleResetCorpus}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Reset & Re-seed Knowledge Base
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* SUB-MODAL: CHUNK INSPECTION */}
        {inspectingDoc && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl max-h-[80vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#eb3b2d]" />
                  <span className="font-bold text-xs text-white">
                    Chunks for: {inspectingDoc.file_name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    {inspectingChunks.length} Chunks
                  </span>
                </div>
                <button
                  onClick={() => setInspectingDoc(null)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {inspectingChunks.map((chunk, idx) => (
                  <div
                    key={chunk.id}
                    className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <div className="flex items-center gap-2">
                        <span className="text-[#eb3b2d] font-bold">#{idx + 1}</span>
                        <span className="text-white font-medium">{chunk.metadata.section}</span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-500">
                        <span>{chunk.metadata.token_count} Tokens</span>
                        <span className="truncate max-w-[120px]">{chunk.metadata.content_hash}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-850 font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed">
                      {chunk.text}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
