import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  UploadCloud,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Hash,
  ExternalLink,
  Plus,
  Send,
  Sparkles,
  GitBranch,
  Eye,
  Check,
  X,
  MessageSquare,
  BookOpen,
  Code2,
  Share2,
  Workflow,
  HelpCircle,
  Play,
  Terminal,
} from 'lucide-react';
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
} from '../../types/omniaLearning';
import { omniaLearningService } from '../../services/omniaLearningService';

type LearningSubTab = 'overview' | 'concepts' | 'logic' | 'graph' | 'sandbox' | 'conflicts';

export const OmniaLearningPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<LearningSubTab>('overview');
  const [sources, setSources] = useState<LearningSource[]>([]);
  const [concepts, setConcepts] = useState<HumanizedConcept[]>([]);
  const [logicRules, setLogicRules] = useState<LogicMemoryItem[]>([]);
  const [graphRelations, setGraphRelations] = useState<KnowledgeGraphRelation[]>([]);
  const [metrics, setMetrics] = useState<LearningMetrics>(omniaLearningService.getMetrics());
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [feedback, setFeedback] = useState<UserFeedbackItem[]>([]);
  const [conflicts, setConflicts] = useState<OmniaConflictItem[]>([]);

  // Filter & sub-views
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [conceptLevelFilter, setConceptLevelFilter] = useState<number | 'all'>('all');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [viewingSource, setViewingSource] = useState<LearningSource | null>(null);
  const [viewingConcept, setViewingConcept] = useState<HumanizedConcept | null>(null);

  // New source form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<LearningSource['sourceType']>('document');
  const [newTrust, setNewTrust] = useState<LearningSource['trustLevel']>('verified_internal');
  const [newContent, setNewContent] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [autoTrainOnAdd, setAutoTrainOnAdd] = useState(true);

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStage, setTrainingStage] = useState<string>('');
  const [trainingPercent, setTrainingPercent] = useState<number>(0);

  // Reasoning Sandbox state
  const [sandboxPrompt, setSandboxPrompt] = useState(
    'What happens if the optical sensor in the medicine dispenser does not detect a pill drop?'
  );
  const [reasoningResult, setReasoningResult] = useState<OmniaReasoningBundle | null>(null);
  const [isEvaluatingReasoning, setIsEvaluatingReasoning] = useState(false);

  useEffect(() => {
    refreshData();
    const unsubscribe = omniaLearningService.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  const refreshData = () => {
    setSources(omniaLearningService.getSources());
    setConcepts(omniaLearningService.getConcepts());
    setLogicRules(omniaLearningService.getLogicRules());
    setGraphRelations(omniaLearningService.getGraphRelations());
    setMetrics(omniaLearningService.getMetrics());
    setLogs(omniaLearningService.getLogs());
    setFeedback(omniaLearningService.getFeedback());
    setConflicts(omniaLearningService.getConflicts());
  };

  const handleManualTrain = async () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingStage('Training started');
    setTrainingPercent(15);

    const stages = [
      { text: 'Training started', pct: 15 },
      { text: 'Understanding & Normalizing', pct: 30 },
      { text: 'Extracting Concepts & Logic', pct: 55 },
      { text: 'Generating Embeddings', pct: 75 },
      { text: 'Validating Rules & Memory', pct: 90 },
      { text: 'Completed', pct: 100 },
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < stages.length - 1) {
        currentIdx++;
        setTrainingStage(stages[currentIdx].text);
        setTrainingPercent(stages[currentIdx].pct);
      }
    }, 500);

    try {
      await omniaLearningService.triggerTraining(undefined, (stage, pct) => {
        setTrainingStage(stage);
        setTrainingPercent(pct);
      });
      clearInterval(interval);
      setTrainingStage('Completed');
      setTrainingPercent(100);
      refreshData();
    } catch {
      clearInterval(interval);
      setTrainingStage('Failed');
    } finally {
      setTimeout(() => {
        setIsTraining(false);
      }, 2000);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    await omniaLearningService.addSource(
      {
        title: newTitle.trim(),
        sourceType: newType,
        sourceUrl: newUrl.trim() || undefined,
        rawContent: newContent.trim(),
        trustLevel: newTrust,
      },
      autoTrainOnAdd
    );

    setNewTitle('');
    setNewContent('');
    setNewUrl('');
    setIsAddingSource(false);
    refreshData();
  };

  const handleRunReasoningSandbox = async () => {
    if (!sandboxPrompt.trim()) return;
    setIsEvaluatingReasoning(true);

    try {
      const res = await fetch('/api/omnia/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sandboxPrompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setReasoningResult(data.bundle);
      } else {
        const localBundle = omniaLearningService.evaluateReasoning(sandboxPrompt);
        setReasoningResult(localBundle);
      }
    } catch {
      const localBundle = omniaLearningService.evaluateReasoning(sandboxPrompt);
      setReasoningResult(localBundle);
    } finally {
      setIsEvaluatingReasoning(false);
    }
  };

  const handleApproveCorrection = async (fbId: string) => {
    await omniaLearningService.approveCorrection(fbId);
    refreshData();
  };

  const handleResolveConflict = (conflictId: string, rule: OmniaConflictItem['status']) => {
    omniaLearningService.resolveConflict(conflictId, rule);
    refreshData();
  };

  const filteredSources = sources.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  const filteredConcepts = concepts.filter((c) => {
    if (conceptLevelFilter === 'all') return true;
    return c.level === conceptLevelFilter;
  });

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      {/* Top Banner & Manual Train Trigger */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#eb3b2d] font-bold">
              Autonomous Intelligence Layer
            </span>
            <span className="text-neutral-600">•</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Status: {metrics.activeStatus}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Omnia Continuous Learning & Reasoning Engine</span>
          </h3>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Multi-stage pipeline extracting humanized concepts, IF/THEN rules, procedures, and knowledge graphs from verified sources. Grounded reasoning applies active logic to every conversation.
          </p>
        </div>

        {/* Action Button: Train Omnia */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 z-10 w-full md:w-auto shrink-0">
          <button
            onClick={() => setIsAddingSource(!isAddingSource)}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white border border-neutral-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} className="text-[#eb3b2d]" />
            <span>Add Knowledge</span>
          </button>

          <button
            onClick={handleManualTrain}
            disabled={isTraining}
            className="px-4 py-2 rounded-xl bg-[#eb3b2d] hover:bg-[#eb3b2d]/90 disabled:opacity-75 text-xs font-semibold text-white shadow-lg shadow-[#eb3b2d]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={isTraining ? 'animate-spin' : ''} />
            <span>{isTraining ? trainingStage : 'Train Omnia'}</span>
          </button>
        </div>

        {/* Background glow */}
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-[#eb3b2d]/10 to-transparent pointer-events-none" />
      </div>

      {/* Live Training Progress Indicator */}
      {isTraining && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-neutral-900 border border-[#eb3b2d]/40 space-y-2.5"
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-[#eb3b2d] animate-ping" />
              <span className="font-semibold">Vercel Workflow Execution: {trainingStage}</span>
            </div>
            <span className="text-[#eb3b2d] font-bold">{trainingPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#eb3b2d] to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${trainingPercent}%` }}
              transition={{ ease: 'easeInOut', duration: 0.3 }}
            />
          </div>
          <div className="grid grid-cols-5 text-[10px] font-mono text-neutral-400 pt-1 text-center">
            <span className={trainingPercent >= 15 ? 'text-white font-semibold' : ''}>Ingest</span>
            <span className={trainingPercent >= 30 ? 'text-white font-semibold' : ''}>Understand</span>
            <span className={trainingPercent >= 55 ? 'text-white font-semibold' : ''}>Extract Logic</span>
            <span className={trainingPercent >= 75 ? 'text-white font-semibold' : ''}>Embed & Index</span>
            <span className={trainingPercent >= 100 ? 'text-emerald-400 font-bold' : ''}>Complete</span>
          </div>
        </motion.div>
      )}

      {/* SYSTEM METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[10px] font-mono text-neutral-400">Documents</div>
          <div className="text-lg font-bold text-white mt-0.5">{metrics.documentsProcessed}</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[10px] font-mono text-neutral-400">Knowledge Chunks</div>
          <div className="text-lg font-bold text-white mt-0.5">{metrics.chunksCreated}</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[10px] font-mono text-cyan-400">Concepts</div>
          <div className="text-lg font-bold text-cyan-400 mt-0.5">{concepts.length}</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[10px] font-mono text-purple-400">Logic Rules</div>
          <div className="text-lg font-bold text-purple-400 mt-0.5">{logicRules.length}</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[10px] font-mono text-amber-400">Graph Triples</div>
          <div className="text-lg font-bold text-amber-400 mt-0.5">{graphRelations.length}</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[10px] font-mono text-emerald-400">Approved</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">{metrics.knowledgeApproved}</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[10px] font-mono text-red-400">Conflicts</div>
          <div className="text-lg font-bold text-red-400 mt-0.5">{metrics.conflictsDetected}</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[10px] font-mono text-neutral-400">Failed Jobs</div>
          <div className="text-lg font-bold text-white mt-0.5">{metrics.failedJobs}</div>
        </div>
      </div>

      {/* Sync Timestamps */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-neutral-500" />
          <span>Last Sync: <strong className="text-neutral-200">{formatDate(metrics.lastSyncTime)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>Last Successful Training: <strong className="text-neutral-200">{formatDate(metrics.lastSuccessfulTrainingTime)}</strong></span>
        </div>
        <div className="text-[11px] text-neutral-500">
          Vercel Cron: <span className="text-[#eb3b2d]">0 */6 * * *</span> (24/7 Automated Sync)
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1 border-b border-neutral-800 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setSubTab('overview')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            subTab === 'overview'
              ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Layers size={13} />
          <span>Sources & Activity ({sources.length})</span>
        </button>

        <button
          onClick={() => setSubTab('concepts')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            subTab === 'concepts'
              ? 'bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-800'
              : 'text-neutral-400 hover:text-cyan-300'
          }`}
        >
          <BookOpen size={13} />
          <span>Knowledge Memory ({concepts.length})</span>
        </button>

        <button
          onClick={() => setSubTab('logic')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            subTab === 'logic'
              ? 'bg-purple-950/60 text-purple-300 font-bold border border-purple-800'
              : 'text-neutral-400 hover:text-purple-300'
          }`}
        >
          <Code2 size={13} />
          <span>Logic Memory ({logicRules.length} Rules)</span>
        </button>

        <button
          onClick={() => setSubTab('graph')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            subTab === 'graph'
              ? 'bg-amber-950/60 text-amber-300 font-bold border border-amber-800'
              : 'text-neutral-400 hover:text-amber-300'
          }`}
        >
          <Share2 size={13} />
          <span>Knowledge Graph ({graphRelations.length})</span>
        </button>

        <button
          onClick={() => setSubTab('sandbox')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            subTab === 'sandbox'
              ? 'bg-[#eb3b2d]/20 text-white font-bold border border-[#eb3b2d]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Terminal size={13} className="text-[#eb3b2d]" />
          <span>Reasoning Sandbox</span>
        </button>

        <button
          onClick={() => setSubTab('conflicts')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            subTab === 'conflicts'
              ? 'bg-red-950/60 text-red-300 font-bold border border-red-800'
              : 'text-neutral-400 hover:text-red-300'
          }`}
        >
          <AlertTriangle size={13} className={conflicts.length > 0 ? 'text-amber-400' : ''} />
          <span>Conflicts & Feedback ({conflicts.length})</span>
        </button>
      </div>

      {/* Add New Knowledge Source Modal/Form */}
      {isAddingSource && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <UploadCloud size={16} className="text-[#eb3b2d]" />
              <span>Ingest New Knowledge (Automatic Concept & Logic Extraction)</span>
            </div>
            <button
              onClick={() => setIsAddingSource(false)}
              className="text-neutral-500 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateSource} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Optical IR Break Beam Specifications"
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-[#eb3b2d]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Source Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-[#eb3b2d]"
                >
                  <option value="document">Uploaded Document</option>
                  <option value="url">Approved URL</option>
                  <option value="documentation">Documentation</option>
                  <option value="internal">Internal Vizra Knowledge</option>
                  <option value="manual">Manually Entered</option>
                  <option value="correction">Approved Correction</option>
                  <option value="dataset">Structured Dataset</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Trust Level
                </label>
                <select
                  value={newTrust}
                  onChange={(e) => setNewTrust(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-[#eb3b2d]"
                >
                  <option value="verified_internal">Verified Internal (98%)</option>
                  <option value="official_doc">Official Documentation (95%)</option>
                  <option value="trusted_partner">Trusted Partner (88%)</option>
                  <option value="user_correction">User Correction (75%)</option>
                  <option value="unverified_web">Unverified Web (65%)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Content Payload (Rules, procedures, facts, or specifications)
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter markdown, specifications, IF/THEN rules, or procedures..."
                rows={5}
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-[#eb3b2d] font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoTrainOnAdd}
                  onChange={(e) => setAutoTrainOnAdd(e.target.checked)}
                  className="rounded border-neutral-800 text-[#eb3b2d] focus:ring-[#eb3b2d]"
                />
                <span>Automatically trigger intelligence extraction & reasoning indexing</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#eb3b2d] hover:bg-[#eb3b2d]/90 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send size={12} />
                <span>Submit & Extract</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* TAB 1: OVERVIEW & SOURCES */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* RECENT LEARNING ACTIVITY */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-[#eb3b2d]" />
                <h4 className="text-sm font-bold text-white tracking-tight">Recent Learning Activity</h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {logs.length} workflow events logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                    <th className="py-2 px-3 font-semibold">[Source]</th>
                    <th className="py-2 px-3 font-semibold">[Action / Stage]</th>
                    <th className="py-2 px-3 font-semibold">[Status]</th>
                    <th className="py-2 px-3 font-semibold text-right">[Time]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {logs.slice(0, 6).map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-neutral-200">
                        {log.sourceTitle || 'Continuous Learning Orchestrator'}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400">
                        <span className="text-[#eb3b2d] font-semibold">{log.stage}</span>: {log.message}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            log.level === 'success'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : log.level === 'warn'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : log.level === 'error'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-500">
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* KNOWLEDGE SOURCES TABLE */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#eb3b2d]" />
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Knowledge Sources ({filteredSources.length})
                </h4>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
                {['all', 'APPROVED', 'PENDING', 'CONFLICTED', 'OUTDATED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#eb3b2d]/20 border-[#eb3b2d] text-white font-semibold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] font-mono">
                    <th className="py-2.5 px-3">Title & Origin</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Version & Hash</th>
                    <th className="py-2.5 px-3">Trust Level</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {filteredSources.map((source) => (
                    <tr key={source.sourceId} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{source.title}</div>
                        <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{source.chunkCount} Chunks</span>
                          <span>•</span>
                          <span>{source.tokenCount} Tokens</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                          {source.sourceType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-neutral-300 font-semibold">v{source.version}</div>
                        <div className="text-[10px] text-neutral-500">{source.contentHash.slice(0, 10)}...</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-neutral-900 text-neutral-300 border-neutral-800">
                          {source.trustLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            source.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : source.status === 'CONFLICTED'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}
                        >
                          {source.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setViewingSource(source)}
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                          title="View Full Content"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE MEMORY (HUMANIZED CONCEPTS) */}
      {subTab === 'concepts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white">Humanized Knowledge Memory</h4>
              <p className="text-xs text-neutral-400">
                Concepts broken down from Basic (Level 1) to Expert (Level 6) with both intuitive and technical explanations.
              </p>
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-neutral-500 mr-1">Level:</span>
              {['all', 1, 2, 3, 4, 5, 6].map((lvl) => (
                <button
                  key={String(lvl)}
                  onClick={() => setConceptLevelFilter(lvl as any)}
                  className={`px-2.5 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    conceptLevelFilter === lvl
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800 font-bold'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {lvl === 'all' ? 'All' : `L${lvl}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConcepts.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[10px] font-bold">
                      Level {c.level}
                    </span>
                    <span className="font-bold text-white text-sm">{c.concept}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">{c.topic}</span>
                </div>

                {/* Simple Humanized Explanation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                    Intuitive Explanation:
                  </span>
                  <p className="text-neutral-300 leading-relaxed bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-850">
                    {c.simpleExplanation}
                  </p>
                </div>

                {/* Technical Explanation */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">
                    Technical Definition:
                  </span>
                  <p className="text-neutral-400 leading-relaxed font-mono text-[11px] bg-neutral-950/50 p-2.5 rounded-xl border border-neutral-850">
                    {c.technicalExplanation}
                  </p>
                </div>

                {/* Practical Meaning & When To Use */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-neutral-950/40 border border-neutral-850">
                    <span className="text-emerald-400 font-semibold font-mono block text-[10px]">When to Use:</span>
                    <ul className="list-disc list-inside text-neutral-400 mt-1 space-y-0.5">
                      {(c.whenToUse || []).slice(0, 2).map((u, i) => (
                        <li key={i} className="truncate">{u}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2 rounded-xl bg-neutral-950/40 border border-neutral-850">
                    <span className="text-red-400 font-semibold font-mono block text-[10px]">Common Pitfalls:</span>
                    <ul className="list-disc list-inside text-neutral-400 mt-1 space-y-0.5">
                      {(c.commonMistakes || []).slice(0, 2).map((m, i) => (
                        <li key={i} className="truncate">{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LOGIC & RULES MEMORY */}
      {subTab === 'logic' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Logic & Operational Rules Memory</h4>
            <p className="text-xs text-neutral-400">
              Active reusable logic (IF/THEN, Constraints, Procedures, Decision Trees) applied by Omnia to solve user problems.
            </p>
          </div>

          <div className="space-y-3">
            {logicRules.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold text-[10px]">
                      {r.logicType}
                    </span>
                    <span className="font-bold text-white text-sm">{r.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">{r.topic}</span>
                </div>

                {/* Condition / Trigger */}
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-1">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>CONDITION / TRIGGER:</span>
                  </div>
                  <p className="text-neutral-300 pl-3">{r.condition}</p>
                </div>

                {/* Action / Inference */}
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>ACTION / INFERENCE:</span>
                  </div>
                  <p className="text-neutral-300 pl-3">{r.action}</p>
                </div>

                {r.exception && (
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-300 text-[11px]">
                    <strong>EXCEPTION:</strong> {r.exception}
                  </div>
                )}

                {r.steps && r.steps.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-1">
                    <span className="text-neutral-400 text-[10px] font-bold">PROCEDURE STEPS:</span>
                    <div className="space-y-1 pl-2">
                      {r.steps.map((s) => (
                        <div key={s.step} className="text-[11px] text-neutral-300 flex items-start gap-2">
                          <span className="text-purple-400 font-bold">{s.step}.</span>
                          <span><strong>{s.title}:</strong> {s.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: KNOWLEDGE GRAPH */}
      {subTab === 'graph' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Knowledge Graph Relations</h4>
            <p className="text-xs text-neutral-400">
              Verified conceptual dependencies, causal connections, and structural triples traversed during reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {graphRelations.map((rel) => (
              <div
                key={rel.id}
                className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-400 font-bold uppercase">
                    {rel.relationType}
                  </span>
                  <span>Trust: {Math.round(rel.confidence * 100)}%</span>
                </div>

                <div className="space-y-1 py-1">
                  <div className="font-bold text-white truncate">{rel.fromConcept}</div>
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                    <ArrowRight size={12} className="text-[#eb3b2d]" />
                    <span className="text-amber-300 font-semibold">{rel.relationType}</span>
                  </div>
                  <div className="font-bold text-neutral-200 truncate">{rel.toConcept}</div>
                </div>

                {rel.description && (
                  <p className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-850">
                    {rel.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REASONING SANDBOX */}
      {subTab === 'sandbox' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Omnia Reasoning Engine Sandbox</h4>
            <p className="text-xs text-neutral-400">
              Test how Omnia understands intent, retrieves Knowledge & Logic Memory, traverses the Knowledge Graph, and applies stored rules to user inquiries.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={sandboxPrompt}
                onChange={(e) => setSandboxPrompt(e.target.value)}
                placeholder="Enter an engineering question or scenario..."
                className="flex-1 px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-[#eb3b2d] font-mono"
              />
              <button
                onClick={handleRunReasoningSandbox}
                disabled={isEvaluatingReasoning}
                className="px-4 py-2 rounded-xl bg-[#eb3b2d] hover:bg-[#eb3b2d]/90 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Play size={13} />
                <span>{isEvaluatingReasoning ? 'Evaluating...' : 'Evaluate Reasoning'}</span>
              </button>
            </div>

            {reasoningResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4 pt-3 border-t border-neutral-800"
              >
                {/* Intent & Domain */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850">
                    <span className="text-neutral-500 text-[10px] uppercase block">Identified Intent:</span>
                    <span className="font-bold text-cyan-300">{reasoningResult.queryIntent}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850">
                    <span className="text-neutral-500 text-[10px] uppercase block">Domain:</span>
                    <span className="font-bold text-white">{reasoningResult.domain}</span>
                  </div>
                </div>

                {/* Active Rules Applied */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <Code2 size={14} />
                    <span>Logic Rules Matched ({reasoningResult.matchedRules.length}):</span>
                  </div>
                  {reasoningResult.matchedRules.length === 0 ? (
                    <p className="text-neutral-500 text-[11px]">No specific rule constraint triggered.</p>
                  ) : (
                    reasoningResult.matchedRules.map((r) => (
                      <div key={r.id} className="p-2 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300">
                        <strong>[{r.name}]</strong> {r.condition} &rarr; {r.action}
                      </div>
                    ))
                  )}
                </div>

                {/* Concepts Matched */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <BookOpen size={14} />
                    <span>Knowledge Concepts Matched ({reasoningResult.matchedConcepts.length}):</span>
                  </div>
                  {reasoningResult.matchedConcepts.map((c) => (
                    <div key={c.id} className="p-2 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300">
                      <strong>{c.concept} (Level {c.level}):</strong> {c.simpleExplanation}
                    </div>
                  ))}
                </div>

                {/* Structured Context Injected into Omnia */}
                <div className="space-y-1 text-xs font-mono">
                  <span className="text-neutral-400 text-[11px] font-bold">
                    Assembled Structured Prompt Context for Gemini:
                  </span>
                  <pre className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-[10px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {reasoningResult.contextString || 'Standard reasoning prompt.'}
                  </pre>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: CONFLICTS & USER FEEDBACK */}
      {subTab === 'conflicts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Conflicts */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Knowledge Conflict Gate ({conflicts.length})
                </h4>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">Zero Silent Overwrite</span>
            </div>

            <div className="space-y-3">
              {conflicts.map((conf) => (
                <div
                  key={conf.id}
                  className="p-3.5 rounded-xl bg-neutral-950 border border-amber-900/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300 font-mono">{conf.topic}</span>
                    <span className="text-[10px] font-mono text-neutral-500">{conf.status}</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800 text-neutral-300">
                      <span className="text-neutral-500">[Source A: {conf.sourceATitle}]</span>
                      <p className="mt-0.5">{conf.statementA}</p>
                    </div>
                    <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800 text-neutral-300">
                      <span className="text-neutral-500">[Source B: {conf.sourceBTitle}]</span>
                      <p className="mt-0.5">{conf.statementB}</p>
                    </div>
                  </div>

                  {conf.status === 'UNRESOLVED' && (
                    <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                      <button
                        onClick={() => handleResolveConflict(conf.id, 'RESOLVED_PREFER_B')}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                      >
                        Prefer Newer (B)
                      </button>
                      <button
                        onClick={() => handleResolveConflict(conf.id, 'RESOLVED_PREFER_A')}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                      >
                        Prefer Official (A)
                      </button>
                      <button
                        onClick={() => handleResolveConflict(conf.id, 'RESOLVED_BOTH_PRESERVED')}
                        className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-pointer"
                      >
                        Keep Both
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User Feedback Pipeline */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-[#eb3b2d]" />
                <h4 className="text-sm font-bold text-white tracking-tight">
                  User Feedback Pipeline ({feedback.length})
                </h4>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">Review Gate</span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto">
              {feedback.map((fb) => (
                <div
                  key={fb.id}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200 truncate max-w-[200px]">
                      Q: {fb.question}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        fb.userFeedback === 'HELPFUL'
                          ? 'text-emerald-400 bg-emerald-950'
                          : fb.userFeedback === 'CORRECTION'
                          ? 'text-amber-400 bg-amber-950'
                          : 'text-red-400 bg-red-950'
                      }`}
                    >
                      {fb.userFeedback}
                    </span>
                  </div>
                  {fb.correction && (
                    <p className="text-[11px] text-amber-200/90 pl-2 border-l border-amber-600/40">
                      &quot;{fb.correction}&quot;
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-500">
                    <span>{formatDate(fb.timestamp)}</span>
                    {fb.status === 'PENDING_REVIEW' && (
                      <button
                        onClick={() => handleApproveCorrection(fb.id)}
                        className="px-2 py-0.5 rounded bg-[#eb3b2d] hover:bg-[#eb3b2d]/90 text-white font-bold cursor-pointer"
                      >
                        Approve into Knowledge
                      </button>
                    )}
                    {fb.status === 'APPROVED' && (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <Check size={10} />
                        <span>Approved</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inspect Source Modal */}
      {viewingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{viewingSource.title}</h3>
                <p className="text-xs text-neutral-400 font-mono">
                  ID: {viewingSource.sourceId} • v{viewingSource.version} • {viewingSource.trustLevel}
                </p>
              </div>
              <button
                onClick={() => setViewingSource(null)}
                className="text-neutral-500 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-400 font-semibold">Cleaned Content:</span>
              <pre className="p-3 rounded-xl bg-neutral-900 text-xs font-mono text-neutral-200 whitespace-pre-wrap max-h-72 overflow-y-auto border border-neutral-800">
                {viewingSource.rawContent}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingSource(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
