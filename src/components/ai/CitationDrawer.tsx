import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CitationItem } from '../../types/rag';
import {
  X,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Hash,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CitationDrawerProps {
  isOpen: boolean;
  citation: CitationItem | null;
  onClose: () => void;
  onOpenKnowledgeExplorer?: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  isOpen,
  citation,
  onClose,
  onOpenKnowledgeExplorer,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!isOpen || !citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.excerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTierColor = (sourceType: string) => {
    switch (sourceType) {
      case 'project_file':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'omnia_arch':
        return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
      case 'vizra_docs':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      default:
        return 'text-neutral-300 bg-neutral-900 border-neutral-800';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Slide-over panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-lg h-full bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-850 flex items-center justify-between bg-neutral-950/90 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#eb3b2d]/10 border border-[#eb3b2d]/30 flex items-center justify-center text-[#eb3b2d]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white tracking-tight">
                    Grounded Source Citation
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getTierColor(
                      citation.sourceType
                    )}`}
                  >
                    {citation.sourceType.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-mono">
                  OMNIA 1.0 Verified Retrieval Corpus
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              aria-label="Close citation details"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-neutral-200 text-sm">
            {/* Document Details Card */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={16} className="text-[#eb3b2d] shrink-0" />
                  <span className="font-semibold text-white truncate text-sm">
                    {citation.fileName}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400">
                  <Sparkles size={11} className="text-[#eb3b2d]" />
                  <span>{citation.score}% Match</span>
                </div>
              </div>

              {citation.section && (
                <div className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                  <span className="text-neutral-500">Section:</span>
                  <span className="text-neutral-300 font-medium">{citation.section}</span>
                </div>
              )}
            </div>

            {/* Extracted Excerpt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 uppercase tracking-wider">
                <span>Retrieved Context Excerpt</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-200 font-mono leading-relaxed whitespace-pre-wrap selection:bg-[#eb3b2d]/30">
                {citation.excerpt}
              </div>
            </div>

            {/* Metadata Inspector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  Chunk Metadata
                </span>
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-[11px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showRawJson ? 'Standard View' : 'Raw JSON Schema'}
                </button>
              </div>

              {showRawJson ? (
                <pre className="p-3 rounded-xl bg-black border border-neutral-850 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                  {JSON.stringify(
                    {
                      document_id: citation.documentId,
                      chunk_id: citation.chunkId,
                      file_name: citation.fileName,
                      section: citation.section,
                      source_type: citation.sourceType,
                      access_level: citation.accessLevel || 'private',
                      hybrid_score: `${citation.score}%`,
                    },
                    null,
                    2
                  )}
                </pre>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-850 space-y-0.5">
                    <span className="text-neutral-500">Document ID</span>
                    <p className="text-neutral-300 truncate">{citation.documentId}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-850 space-y-0.5">
                    <span className="text-neutral-500">Chunk ID</span>
                    <p className="text-neutral-300 truncate">{citation.chunkId}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-850 space-y-0.5">
                    <span className="text-neutral-500">Access Level</span>
                    <p className="text-neutral-300 uppercase">{citation.accessLevel || 'Private'}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-850 space-y-0.5">
                    <span className="text-neutral-500">Source Type</span>
                    <p className="text-neutral-300 capitalize">{citation.sourceType.replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-neutral-850 bg-neutral-950 flex items-center justify-between gap-3">
            {onOpenKnowledgeExplorer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenKnowledgeExplorer();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <Layers size={13} className="text-[#eb3b2d]" />
                <span>Open Knowledge Explorer</span>
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
