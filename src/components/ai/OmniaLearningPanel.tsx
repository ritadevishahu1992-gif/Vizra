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
} from 'lucide-react';
import {
  LearningSource,
  LearningMetrics,
  WorkflowLog,
  UserFeedbackItem,
  OmniaConflictItem,
} from '../../types/omniaLearning';
import { omniaLearningService } from '../../services/omniaLearningService';

export const OmniaLearningPanel: React.FC = () => {
  const [sources, setSources] = useState<LearningSource[]>([]);
  const [metrics, setMetrics] = useState<LearningMetrics>(omniaLearningService.getMetrics());
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [feedback, setFeedback] = useState<UserFeedbackItem[]>([]);
  const [conflicts, setConflicts] = useState<OmniaConflictItem[]>([]);

  // Filter & sub-views
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [viewingSource, setViewingSource] = useState<LearningSource | null>(null);

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
  const [trainingSuccess, setTrainingSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    refreshData();
    const unsubscribe = omniaLearningService.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  const refreshData = () => {
    setSources(omniaLearningService.getSources());
    setMetrics(omniaLearningService.getMetrics());
    setLogs(omniaLearningService.getLogs());
    setFeedback(omniaLearningService.getFeedback());
    setConflicts(omniaLearningService.getConflicts());
  };

  const handleManualTrain = async () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingSuccess(null);
    setTrainingStage('Training started');
    setTrainingPercent(10);

    const stages = [
      { text: 'Training started', pct: 15 },
      { text: 'Processing', pct: 35 },
      { text: 'Embedding', pct: 60 },
      { text: 'Validating', pct: 80 },
      { text: 'Updating Omnia', pct: 92 },
      { text: 'Completed', pct: 100 },
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < stages.length - 1) {
        currentIdx++;
        setTrainingStage(stages[currentIdx].text);
        setTrainingPercent(stages[currentIdx].pct);
      }
    }, 600);

    try {
      await omniaLearningService.triggerTraining(undefined, (stage, pct) => {
        setTrainingStage(stage);
        setTrainingPercent(pct);
      });
      clearInterval(interval);
      setTrainingStage('Completed');
      setTrainingPercent(100);
      setTrainingSuccess(true);
      refreshData();
    } catch {
      clearInterval(interval);
      setTrainingStage('Failed');
      setTrainingSuccess(false);
    } finally {
      setTimeout(() => {
        setIsTraining(false);
      }, 2500);
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
              24/7 Background System
            </span>
            <span className="text-neutral-600">•</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Status: {metrics.activeStatus}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Omnia Continuous Learning System</span>
            <span className="text-xs font-normal text-neutral-400 font-mono">
              (Vercel Workflows SDK)
            </span>
          </h3>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Continuously ingests approved documentation, user corrections, and external knowledge.
            Durable workflows chunk, validate, embed, and synchronize knowledge directly into Omnia&apos;s RAG index.
          </p>
        </div>

        {/* Action Button: Train Omnia */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 z-10 w-full md:w-auto shrink-0">
          <button
            onClick={() => setIsAddingSource(!isAddingSource)}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white border border-neutral-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} className="text-[#eb3b2d]" />
            <span>Add Source</span>
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

        {/* Subtle background glow */}
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
          <div className="grid grid-cols-6 text-[10px] font-mono text-neutral-400 pt-1 text-center">
            <span className={trainingPercent >= 15 ? 'text-white font-semibold' : ''}>Started</span>
            <span className={trainingPercent >= 35 ? 'text-white font-semibold' : ''}>Processing</span>
            <span className={trainingPercent >= 60 ? 'text-white font-semibold' : ''}>Embedding</span>
            <span className={trainingPercent >= 80 ? 'text-white font-semibold' : ''}>Validating</span>
            <span className={trainingPercent >= 92 ? 'text-white font-semibold' : ''}>Updating</span>
            <span className={trainingPercent >= 100 ? 'text-emerald-400 font-bold' : ''}>Complete</span>
          </div>
        </motion.div>
      )}

      {/* SYSTEM METRICS GRID (Requirement 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-400">Documents</div>
          <div className="text-xl font-bold text-white mt-1">{metrics.documentsProcessed}</div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Total ingested</div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-400">Knowledge Items</div>
          <div className="text-xl font-bold text-white mt-1">{metrics.chunksCreated}</div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Chunks & vectors</div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-emerald-400">Approved</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{metrics.knowledgeApproved}</div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Active in RAG</div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-amber-400">Pending Review</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {sources.filter((s) => s.status === 'PENDING').length}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Awaiting validation</div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-red-400">Conflicts</div>
          <div className="text-xl font-bold text-red-400 mt-1">{metrics.conflictsDetected}</div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Preserved records</div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-400">Failed Jobs</div>
          <div className="text-xl font-bold text-white mt-1">{metrics.failedJobs}</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">0 Fatal</div>
        </div>
      </div>

      {/* Sync Timestamps (Requirement 11) */}
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
          Vercel Cron: <span className="text-[#eb3b2d]">0 */6 * * *</span> (Synchronized 24/7)
        </div>
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
              <span>Ingest New Knowledge Source (Automatic Training)</span>
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
                  placeholder="e.g. Apollo Guidance Computer Memory Specs"
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

            {newType === 'url' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-[#eb3b2d]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Content Payload
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter markdown, structured facts, or documentation text..."
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
                <span>Automatically trigger durable learning workflow on save (no manual step)</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#eb3b2d] hover:bg-[#eb3b2d]/90 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send size={12} />
                <span>Submit & Ingest</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* RECENT LEARNING ACTIVITY (Requirement 11) */}
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
              {logs.slice(0, 7).map((log) => (
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

      {/* KNOWLEDGE SOURCES TABLE & STATUS FILTERS */}
      <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#eb3b2d]" />
            <h4 className="text-sm font-bold text-white tracking-tight">
              Knowledge Sources ({filteredSources.length})
            </h4>
          </div>

          {/* Filter Pills */}
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
                      {source.sourceUrl && (
                        <>
                          <span>•</span>
                          <a
                            href={source.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#eb3b2d] hover:underline flex items-center gap-0.5"
                          >
                            <span>Link</span>
                            <ExternalLink size={9} />
                          </a>
                        </>
                      )}
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
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        source.trustLevel === 'verified_internal'
                          ? 'bg-purple-950/60 border-purple-800 text-purple-300'
                          : source.trustLevel === 'official_doc'
                          ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                          : source.trustLevel === 'user_correction'
                          ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                      }`}
                    >
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
                          : source.status === 'REJECTED'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}
                    >
                      {source.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingSource(source)}
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="View Full Content & Provenance"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFLICT ENGINE GATE & USER CORRECTIONS */}
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

        {/* User Corrections & Feedback Pipeline */}
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

            <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs font-mono space-y-1 text-neutral-300">
              <div>Content Hash: {viewingSource.contentHash}</div>
              <div>Validation Score: {viewingSource.validationScore || 90}%</div>
              {viewingSource.validationNotes && (
                <div className="text-neutral-400">
                  Notes: {viewingSource.validationNotes.join('; ')}
                </div>
              )}
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
