import React, { useState } from 'react';
import { motion } from 'motion/react';
import { VizraLogo } from '../VizraLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageActions } from './MessageActions';
import { Message, SmartSuggestion } from '../../types/ai';
import { CitationItem } from '../../types/rag';
import { SourcesBar } from './SourcesBar';
import {
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Brain,
  Globe,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Edit2,
  Check,
  X,
  Volume2,
  Table,
  ShieldCheck,
  Cpu,
  AlertTriangle,
} from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onSelectSuggestion?: (suggestion: SmartSuggestion) => void;
  onCreateProject?: (draft?: any) => void;
  onEditUserMessage?: (messageId: string, newText: string) => void;
  onOpenCitation?: (citation: CitationItem) => void;
  onOpenTrace?: (traceId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onSelectSuggestion,
  onCreateProject,
  onEditUserMessage,
  onOpenCitation,
  onOpenTrace,
}) => {
  const isUser = message.role === 'user';
  const [showThoughts, setShowThoughts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const handleSaveEdit = () => {
    if (editText.trim() && onEditUserMessage) {
      onEditUserMessage(message.id, editText.trim());
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`py-4 w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[92%] md:max-w-[85%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        {/* User Message Bubble */}
        {isUser ? (
          <div className="space-y-2 group">
            {/* Attachment preview if user uploaded files */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {message.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"
                  >
                    {att.type === 'image' ? (
                      <ImageIcon size={14} className="text-[#eb3b2d]" />
                    ) : att.type === 'video' ? (
                      <Video size={14} className="text-[#eb3b2d]" />
                    ) : att.type === 'audio' ? (
                      <Volume2 size={14} className="text-[#eb3b2d]" />
                    ) : att.type === 'csv' ? (
                      <Table size={14} className="text-[#eb3b2d]" />
                    ) : (
                      <FileText size={14} className="text-[#eb3b2d]" />
                    )}
                    <span className="font-mono text-[11px] truncate max-w-[140px]">
                      {att.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isEditing ? (
              <div className="p-3 bg-neutral-900 rounded-2xl border border-[#eb3b2d] space-y-2">
                <textarea
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-transparent text-white text-sm focus:outline-none resize-none"
                  rows={2}
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 rounded-lg text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200"
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="bg-neutral-900/90 text-neutral-100 px-4 py-3 rounded-2xl border border-neutral-800/80 text-sm md:text-base leading-relaxed break-words shadow-sm">
                  {message.content}
                </div>
                {onEditUserMessage && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -left-7 top-3 p-1 text-neutral-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Edit message"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Omnia Assistant Editorial Layout */
          <div className="space-y-3">
            {/* Model & Status Lockup */}
            <div className="flex items-center gap-2 mb-1">
              <VizraLogo size={18} />
              <span className="text-xs font-semibold text-white tracking-tight">
                Omnia 1.0
              </span>
              {message.mode && message.mode !== 'quick' && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase">
                  {message.mode}
                </span>
              )}
              {message.isDemo && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-500">
                  Interactive Demo
                </span>
              )}

              {/* Reasoning Trace ID Badge */}
              {message.reasoning_trace_id && (
                <button
                  type="button"
                  onClick={() => onOpenTrace && onOpenTrace(message.reasoning_trace_id!)}
                  className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Inspect OMNIA Reasoning Trace & Governance Log"
                >
                  <Cpu size={10} className="text-[#eb3b2d]" />
                  <span>Trace: {message.reasoning_trace_id.slice(0, 8)}…</span>
                </button>
              )}

              {/* Knowledge State Badge */}
              {message.knowledge_state && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                    message.knowledge_state === 'HIGH_CONFIDENCE'
                      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                      : message.knowledge_state === 'CONFLICTED'
                      ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                      : message.knowledge_state === 'UNCERTAIN'
                      ? 'text-yellow-400 bg-yellow-950/40 border-yellow-800/40'
                      : 'text-neutral-400 bg-neutral-900 border-neutral-800'
                  }`}
                >
                  {message.knowledge_state}
                </span>
              )}
            </div>

            {/* Governed Discrepancy / Conflict Notice */}
            {message.conflicts && message.conflicts.length > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    Disputed Knowledge Detected ({message.conflicts.length} Conflict)
                  </span>
                </div>
                {onOpenTrace && message.reasoning_trace_id && (
                  <button
                    onClick={() => onOpenTrace(message.reasoning_trace_id!)}
                    className="text-[10px] font-mono text-amber-400 hover:underline cursor-pointer"
                  >
                    View Discrepancy Breakdown →
                  </button>
                )}
              </div>
            )}

            {/* OMNIA RAG Grounding Banner */}
            {message.grounding && message.grounding.isGrounded && (
              <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/70 border border-neutral-800 text-[11px] font-mono text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-semibold">Grounded via OMNIA RAG</span>
                </div>
                <span className="text-neutral-600">•</span>
                <span className="text-neutral-400">{message.grounding.sourcesUsed} Sources</span>
                <span className="text-neutral-600">•</span>
                <span className="text-emerald-400 font-semibold">{message.grounding.groundingScore}% Confidence</span>
                {message.grounding.retrievalLatencyMs && (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span className="text-neutral-500">{message.grounding.retrievalLatencyMs}ms</span>
                  </>
                )}
              </div>
            )}

            {/* Collapsible Thought Steps (Think Mode) */}
            {message.thoughtProcess && message.thoughtProcess.length > 0 && (
              <div className="border border-neutral-800/80 rounded-xl bg-neutral-950/60 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setShowThoughts(!showThoughts)}
                  className="w-full px-3.5 py-2 flex items-center justify-between text-neutral-400 hover:text-white transition-colors cursor-pointer bg-neutral-900/30"
                >
                  <div className="flex items-center gap-2">
                    <Brain size={14} className="text-[#eb3b2d]" />
                    <span className="font-semibold text-neutral-300">
                      Reasoning Process ({message.thoughtProcess.length} steps evaluated)
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showThoughts ? 'rotate-180' : ''}`}
                  />
                </button>

                {showThoughts && (
                  <div className="p-3.5 space-y-2.5 border-t border-neutral-900 text-[11px] font-mono">
                    {message.thoughtProcess.map((step) => (
                      <div key={step.step} className="space-y-0.5">
                        <div className="text-neutral-300 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
                          <span>Step {step.step}: {step.title}</span>
                        </div>
                        <p className="text-neutral-500 pl-3 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assistant Body or Thinking Indicator */}
            {message.status === 'streaming' && !message.content ? (
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-pulse" />
                <span>Omnia is synthesizing…</span>
              </div>
            ) : (
              <div className="text-neutral-200">
                <MarkdownRenderer content={message.content} />

                {message.status === 'streaming' && (
                  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-[#eb3b2d] animate-pulse" />
                )}
              </div>
            )}

            {/* Unified OMNIA Sources Bar (Web + Documents) */}
            {((message.sources && message.sources.length > 0) || (message.citations && message.citations.length > 0)) && (
              <SourcesBar
                sources={message.sources}
                citations={message.citations}
                onOpenCitation={onOpenCitation}
              />
            )}

            {/* Create Project Callout Banner */}
            {message.canCreateProject && onCreateProject && (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-[#eb3b2d]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#eb3b2d]/10 border border-[#eb3b2d]/30 flex items-center justify-center text-[#eb3b2d] shrink-0">
                    <Layers size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">
                      Turn this into an interactive Project?
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Unlocks 10-stage production plan, project memory, tasks, and asset export.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateProject(message.projectDraft)}
                  className="px-3.5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles size={13} className="text-[#eb3b2d]" />
                  <span>Create Project</span>
                </button>
              </div>
            )}

            {/* Smart Suggestions Pills */}
            {message.status !== 'streaming' && message.suggestions && message.suggestions.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                {message.suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => {
                      if (sug.action === 'create_project' && onCreateProject) {
                        onCreateProject(message.projectDraft);
                      } else if (onSelectSuggestion) {
                        onSelectSuggestion(sug);
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 select-none"
                  >
                    {sug.action === 'create_project' && (
                      <Layers size={12} className="text-[#eb3b2d]" />
                    )}
                    {sug.action === 'research' && (
                      <Globe size={12} className="text-[#eb3b2d]" />
                    )}
                    {sug.action === 'prompt' && (
                      <Sparkles size={12} className="text-[#eb3b2d]" />
                    )}
                    <span>{sug.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Action Bar (Copy, Regenerate, Feedback) */}
            {message.status !== 'streaming' && onRegenerate && (
              <MessageActions
                content={message.content}
                retrievedSources={message.sources || (message.grounding?.citations as any)}
                onRegenerate={onRegenerate}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
