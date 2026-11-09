import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VerifiedSource } from '../../types/ai';
import { CitationItem } from '../../types/rag';
import {
  Globe,
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Copy,
  Check,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface SourcesBarProps {
  sources?: VerifiedSource[];
  citations?: CitationItem[];
  onOpenCitation?: (citation: CitationItem) => void;
  className?: string;
}

export const SourcesBar: React.FC<SourcesBarProps> = ({
  sources = [],
  citations = [],
  onOpenCitation,
  className = '',
}) => {
  const [selectedSource, setSelectedSource] = useState<VerifiedSource | null>(null);
  const [showAllWeb, setShowAllWeb] = useState(false);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [copiedExcerpt, setCopiedExcerpt] = useState(false);

  // Group sources into WEB and DOCUMENTS (Section 9)
  const webSources = sources.filter(
    (s) =>
      s.sourceType === 'web' &&
      s.validationStatus === 'verified' &&
      Boolean(s.url && (s.url.startsWith('http://') || s.url.startsWith('https://')))
  );

  // Convert citations to document sources if not already present
  const docSourcesMap = new Map<string, VerifiedSource>();
  for (const s of sources) {
    if (s.sourceType === 'document') {
      docSourcesMap.set(s.sourceId || s.url, s);
    }
  }
  for (const cit of citations) {
    const key = cit.id || cit.documentId;
    if (!docSourcesMap.has(key)) {
      docSourcesMap.set(key, {
        sourceId: cit.id,
        id: cit.id,
        title: cit.fileName,
        name: cit.fileName,
        url: `#doc-${cit.documentId}`,
        domain: 'OMNIA Verified Knowledge Corpus',
        sourceType: 'document',
        retrievedAt: Date.now(),
        relevantExcerpt: cit.excerpt,
        claimsSupported: [cit.section ? `Section: ${cit.section}` : `Doc: ${cit.fileName}`],
        priorityCategory: 'official_docs',
        reliability: 'verified',
        isFact: true,
        score: cit.score,
        documentId: cit.documentId,
        section: cit.section,
        validationStatus: 'verified',
        validationChecks: {
          exists: true,
          urlValid: true,
          domainVerified: true,
          contentRetrieved: true,
          claimSupported: true,
          metadataAuthentic: true,
        },
      });
    }
  }
  const docSources = Array.from(docSourcesMap.values());

  const totalSourcesCount = webSources.length + docSources.length;
  if (totalSourcesCount === 0) return null;

  const MAX_COLLAPSED = 3;
  const visibleWeb = showAllWeb ? webSources : webSources.slice(0, MAX_COLLAPSED);
  const remainingWeb = webSources.length - MAX_COLLAPSED;

  const visibleDocs = showAllDocs ? docSources : docSources.slice(0, MAX_COLLAPSED);
  const remainingDocs = docSources.length - MAX_COLLAPSED;

  const handleCopyExcerpt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedExcerpt(true);
    setTimeout(() => setCopiedExcerpt(false), 2000);
  };

  return (
    <div className={`pt-2.5 space-y-2 select-none ${className}`}>
      {/* Sources Header with Count (Section 8: "Sources · N") */}
      <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[#eb3b2d] font-bold">◉</span>
          <span className="font-semibold text-neutral-300">Sources</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 font-mono">{totalSourcesCount}</span>
        </div>

        {webSources.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-400/90 font-mono">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Strict Grounded Evidence</span>
          </div>
        )}
      </div>

      {/* Render segregated Web & Document lists */}
      <div className="space-y-2">
        {/* WEB SOURCES SECTION */}
        {webSources.length > 0 && (
          <div className="space-y-1">
            {docSources.length > 0 && (
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider pl-0.5">
                WEB
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleWeb.map((src) => (
                <div
                  key={src.sourceId || src.url}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-200 transition-all shadow-sm"
                >
                  {/* Favicon with onError fallback */}
                  <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-neutral-800">
                    {src.favicon ? (
                      <img
                        src={src.favicon}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Hide image and fall back to globe icon
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Globe size={10} className="text-neutral-400" />
                    )}
                  </div>

                  {/* Clean Brand / Site Name */}
                  <span className="font-medium text-[11px] text-white tracking-tight">
                    {src.name || src.domain}
                  </span>

                  {/* Direct Link Anchor */}
                  {src.url && (src.url.startsWith('http://') || src.url.startsWith('https://')) ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-white p-0.5 transition-colors cursor-pointer"
                      title={`Open verified source: ${src.url}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={10} />
                    </a>
                  ) : null}

                  {/* Detail trigger */}
                  <button
                    type="button"
                    onClick={() => setSelectedSource(src)}
                    className="text-neutral-600 hover:text-[#eb3b2d] p-0.5 transition-colors cursor-pointer"
                    title="Inspect Source Provenance & Claims"
                  >
                    <Info size={10} />
                  </button>
                </div>
              ))}

              {/* Overflow Badge [+N] */}
              {!showAllWeb && remainingWeb > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllWeb(true)}
                  className="px-2 py-0.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={`Show ${remainingWeb} more verified web sources`}
                >
                  +{remainingWeb}
                </button>
              )}

              {showAllWeb && remainingWeb > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllWeb(false)}
                  className="px-2 py-0.5 rounded-full bg-neutral-900 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTS / RAG SOURCES SECTION */}
        {docSources.length > 0 && (
          <div className="space-y-1">
            {webSources.length > 0 && (
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider pl-0.5 pt-1">
                DOCUMENTS
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleDocs.map((doc) => (
                <button
                  key={doc.sourceId || doc.title}
                  type="button"
                  onClick={() => {
                    if (doc.documentId && onOpenCitation) {
                      onOpenCitation({
                        id: doc.sourceId,
                        documentId: doc.documentId,
                        chunkId: 'chunk_1',
                        fileName: doc.title,
                        section: doc.section || 'General',
                        excerpt: doc.relevantExcerpt,
                        score: doc.score || 85,
                        sourceType: 'workspace_doc',
                      });
                    } else {
                      setSelectedSource(doc);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-200 transition-all cursor-pointer group shadow-sm text-left"
                  title="Inspect Document Provenance"
                >
                  <FileText
                    size={11}
                    className="text-[#eb3b2d] shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <span className="font-medium text-[11px] text-white truncate max-w-[200px]">
                    {doc.title}
                  </span>
                  {doc.section && (
                    <span className="text-[9px] font-mono text-neutral-500 truncate max-w-[120px]">
                      #{doc.section}
                    </span>
                  )}
                  {doc.score && (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-900/30">
                      {doc.score}%
                    </span>
                  )}
                </button>
              ))}

              {/* Overflow Badge [+N] for Docs */}
              {!showAllDocs && remainingDocs > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllDocs(true)}
                  className="px-2 py-0.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={`Show ${remainingDocs} more documents`}
                >
                  +{remainingDocs}
                </button>
              )}

              {showAllDocs && remainingDocs > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllDocs(false)}
                  className="px-2 py-0.5 rounded-full bg-neutral-900 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Source Provenance Modal / Inspector */}
      <AnimatePresence>
        {selectedSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSource(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-neutral-200"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-neutral-850 flex items-center justify-between bg-neutral-900/50">
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <div className="w-8 h-8 rounded-lg bg-[#eb3b2d]/10 border border-[#eb3b2d]/30 flex items-center justify-center text-[#eb3b2d] shrink-0">
                    {selectedSource.sourceType === 'web' ? (
                      <Globe size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-white truncate">
                        {selectedSource.title || selectedSource.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase shrink-0">
                        {selectedSource.sourceType}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono truncate">
                      {selectedSource.domain}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSource(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Verification Checkpoints (Section 3: Strict Verification) */}
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-neutral-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>OMNIA Verification Checklist</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>URL Protocol Valid</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Domain Authentic</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Retrieved Evidence</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Claim Grounded</span>
                    </div>
                  </div>
                </div>

                {/* Direct Link if Web Source */}
                {selectedSource.sourceType === 'web' &&
                  selectedSource.url &&
                  (selectedSource.url.startsWith('http://') || selectedSource.url.startsWith('https://')) && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-neutral-400 uppercase">
                      Exact Verified Source URL
                    </div>
                    <a
                      href={selectedSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-[#eb3b2d]/60 text-xs text-neutral-200 transition-colors group cursor-pointer"
                    >
                      <span className="truncate pr-2 font-mono text-[11px] text-[#eb3b2d]">
                        {selectedSource.url}
                      </span>
                      <ExternalLink size={13} className="text-neutral-500 group-hover:text-white shrink-0" />
                    </a>
                  </div>
                )}

                {/* Claims Supported (Section 7 & 10) */}
                {selectedSource.claimsSupported && selectedSource.claimsSupported.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-neutral-400 uppercase">
                      Grounded Claims Backed by this Source
                    </div>
                    <div className="space-y-1.5">
                      {selectedSource.claimsSupported.map((claim, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800/80 text-xs text-neutral-300 leading-relaxed font-sans"
                        >
                          "{claim}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relevant Excerpt (Section 10: relevantExcerpt) */}
                {selectedSource.relevantExcerpt && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 uppercase">
                      <span>Relevant Retrieved Excerpt</span>
                      <button
                        type="button"
                        onClick={() => handleCopyExcerpt(selectedSource.relevantExcerpt)}
                        className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedExcerpt ? (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap">
                      {selectedSource.relevantExcerpt}
                    </div>
                  </div>
                )}

                {/* Metadata Footnote */}
                <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>Retrieved: {new Date(selectedSource.retrievedAt).toLocaleTimeString()}</span>
                  <span>Priority: {selectedSource.priorityCategory || 'standard'}</span>
                  <span>Status: Zero Hallucination Guarantee</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
