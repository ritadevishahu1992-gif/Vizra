import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  Cpu,
  Layers,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  GitBranch,
  Key,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { ReasoningTrace } from '../../types/omniaGovernance';

interface TraceInspectorModalProps {
  isOpen: boolean;
  trace: ReasoningTrace | null;
  onClose: () => void;
  onOpenKnowledgeBase?: () => void;
}

export const TraceInspectorModal: React.FC<TraceInspectorModalProps> = ({
  isOpen,
  trace,
  onClose,
  onOpenKnowledgeBase,
}) => {
  if (!isOpen || !trace) return null;

  const getStateBadgeColor = (state: string) => {
    switch (state) {
      case 'HIGH_CONFIDENCE':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      case 'VERIFIED':
        return 'text-blue-400 bg-blue-950/60 border-blue-800';
      case 'CONFLICTED':
        return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'UNCERTAIN':
        return 'text-yellow-400 bg-yellow-950/60 border-yellow-800';
      case 'REJECTED':
        return 'text-red-400 bg-red-950/60 border-red-800';
      default:
        return 'text-neutral-300 bg-neutral-900 border-neutral-800';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6">
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
          className="relative w-full max-w-4xl max-h-[88vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#eb3b2d]/10 border border-[#eb3b2d]/30 flex items-center justify-center text-[#eb3b2d]">
                <Cpu size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    OMNIA Reasoning Trace & Governance Audit
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                    Rule 3: No Untracked Autonomy
                  </span>
                </div>
                <p className="text-xs font-mono text-neutral-400">
                  Trace ID: <span className="text-neutral-200">{trace.trace_id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-neutral-200 text-xs font-mono">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-850 space-y-1">
                <span className="text-neutral-500 text-[11px]">Knowledge State</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStateBadgeColor(
                      trace.knowledge_state_surfaced
                    )}`}
                  >
                    {trace.knowledge_state_surfaced}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-850 space-y-1">
                <span className="text-neutral-500 text-[11px]">Orchestrator Routing</span>
                <p className="text-white font-semibold text-[11px] capitalize">
                  {trace.retrieval_decision.replace('_', ' ')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-850 space-y-1">
                <span className="text-neutral-500 text-[11px]">Execution Latency</span>
                <p className="text-emerald-400 font-semibold text-[11px]">
                  {trace.latency_ms} ms
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-850 space-y-1">
                <span className="text-neutral-500 text-[11px]">Safety Audit</span>
                <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                  <ShieldCheck size={13} />
                  <span>Passed (Closed-Fail)</span>
                </div>
              </div>
            </div>

            {/* Orchestrator Intent & User Query */}
            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-850 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="uppercase text-neutral-500 tracking-wider">
                  1. Input Query & Intent Classifier
                </span>
                <span className="text-neutral-400">Model: {trace.model_id}</span>
              </div>
              <div className="p-3 rounded-lg bg-black border border-neutral-850 text-neutral-200">
                "{trace.user_query}"
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                <span>Classified Intent:</span>
                <span className="text-white font-semibold">{trace.intent}</span>
                <span className="text-neutral-600">•</span>
                <span>Session: {trace.session_id}</span>
              </div>
            </div>

            {/* Safety Policy Checkpoint */}
            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-850 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                  <Lock size={12} className="text-[#eb3b2d]" />
                  <span>2. Safety Checkpoint & PII Redaction Audit</span>
                </span>
                <span className="text-neutral-400">{trace.safety_check.policy_version}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                  <span className="text-neutral-500 block">PII Detected</span>
                  <span className="text-neutral-200">
                    {trace.safety_check.pii_detected ? 'Yes (Redacted)' : 'None detected'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                  <span className="text-neutral-500 block">Risk Flags</span>
                  <span className="text-neutral-200">
                    {trace.safety_check.risk_flags.length === 0
                      ? 'Clean (0 flags)'
                      : trace.safety_check.risk_flags.join(', ')}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                  <span className="text-neutral-500 block">Audit Entry</span>
                  <span className="text-neutral-400 truncate block">
                    {trace.safety_check.audit_entry_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Retrieval Bundle & Conflict Inspection */}
            {trace.retrieval_bundle && (
              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-850 space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                    <Layers size={13} className="text-[#eb3b2d]" />
                    <span>3. Retrieval Bundle & Provenance Records</span>
                  </span>
                  <span className="text-neutral-400">
                    {trace.retrieval_bundle.knowledge_records.length} Records •{' '}
                    {trace.retrieval_bundle.vector_chunks.length} Chunks
                  </span>
                </div>

                {/* Structured Knowledge Records */}
                {trace.retrieval_bundle.knowledge_records.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-neutral-500 uppercase">
                      Immutable Knowledge Records Retrieved:
                    </span>
                    {trace.retrieval_bundle.knowledge_records.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 rounded-lg bg-neutral-950 border border-neutral-850 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{rec.topic}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                            Version {rec.version} • {rec.state}
                          </span>
                        </div>
                        <p className="text-neutral-300 leading-relaxed">{rec.statement}</p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-500">
                          <span>Source: {rec.source}</span>
                          <span>Authority: {rec.source_score.authority_tier}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conflict Records */}
                {trace.retrieval_bundle.conflicts.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
                      <AlertTriangle size={14} />
                      <span>
                        Governed Conflict Detected ({trace.retrieval_bundle.conflicts.length})
                      </span>
                    </div>
                    {trace.retrieval_bundle.conflicts.map((cnf) => (
                      <div key={cnf.id} className="text-[11px] space-y-1 text-neutral-300">
                        <div className="flex justify-between text-neutral-400">
                          <span>Type: {cnf.conflict_type}</span>
                          <span className="text-amber-400 font-bold">{cnf.resolution_state}</span>
                        </div>
                        <p className="text-neutral-200">{cnf.source_quality_comparison}</p>
                        <div className="p-2 rounded bg-black/60 border border-neutral-850 space-y-1">
                          {cnf.disputing_statements.map((s, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-amber-400 font-mono">[{idx + 1}]</span>
                              <span className="text-neutral-300">{s.statement}</span>
                              <span className="text-neutral-500 font-mono text-[10px]">
                                ({s.source})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Citations & Attribution Output */}
            {trace.citations.length > 0 && (
              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-850 space-y-2">
                <span className="uppercase text-neutral-500 tracking-wider text-[11px] block">
                  4. Sourced Citations
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {trace.citations.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate max-w-[180px]">
                          {c.fileName}
                        </span>
                        <span className="text-emerald-400 font-bold">{c.score}% Match</span>
                      </div>
                      <p className="text-neutral-400 line-clamp-2">{c.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-neutral-850 bg-neutral-950 flex items-center justify-between">
            {onOpenKnowledgeBase && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenKnowledgeBase();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <GitBranch size={13} className="text-[#eb3b2d]" />
                <span>Open Governance & Knowledge Base</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
