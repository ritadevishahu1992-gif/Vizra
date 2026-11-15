import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Atom, Search, ExternalLink, Dna, Database, BookOpen, Layers, Check, Loader2 } from 'lucide-react';
import { fetchAlphaFoldStructure, fetchPubChemCompound, searchPubMedLiterature, ProteinStructureData, CompoundData, PubMedArticle } from '../../services/scienceService';

interface ScienceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const ScienceHubModal: React.FC<ScienceHubModalProps> = ({ isOpen, onClose, onSelectPrompt }) => {
  const [activeTab, setActiveTab] = useState<'proteins' | 'chemistry' | 'literature'>('proteins');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proteinResult, setProteinResult] = useState<ProteinStructureData | null>(null);
  const [compoundResult, setCompoundResult] = useState<CompoundData | null>(null);
  const [literatureResults, setLiteratureResults] = useState<PubMedArticle[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'proteins') {
        const res = await fetchAlphaFoldStructure(searchQuery);
        if (res) {
          setProteinResult(res);
        } else {
          setErrorMsg(`No AlphaFold structure prediction found for "${searchQuery}". Try a UniProt ID like P04637 (TP53) or P00520 (ABL1).`);
        }
      } else if (activeTab === 'chemistry') {
        const res = await fetchPubChemCompound(searchQuery);
        if (res) {
          setCompoundResult(res);
        } else {
          setErrorMsg(`Compound "${searchQuery}" not found in PubChem. Try "aspirin", "imatinib", or "caffeine".`);
        }
      } else {
        const res = await searchPubMedLiterature(searchQuery, 6);
        setLiteratureResults(res);
        if (res.length === 0) {
          setErrorMsg(`No PubMed articles matched query "${searchQuery}".`);
        }
      }
    } catch {
      setErrorMsg('Network error while querying scientific database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPreset = (query: string, tab: 'proteins' | 'chemistry' | 'literature') => {
    setActiveTab(tab);
    setSearchQuery(query);
    setErrorMsg(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-3xl rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-850 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#eb3b2d]/10 text-[#eb3b2d]">
                <Atom size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Omnia Science & Research Suite</h2>
                <p className="text-xs text-neutral-400">DeepMind Science Skills • AlphaFold DB, PubChem & PubMed</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-850 px-6 bg-neutral-950/40">
            {[
              { id: 'proteins', label: 'Proteins & Structures', icon: Dna, desc: 'AlphaFold DB & PDB' },
              { id: 'chemistry', label: 'Chemistry & Compounds', icon: Database, desc: 'PubChem PUG REST' },
              { id: 'literature', label: 'Biomedical Literature', icon: BookOpen, desc: 'NCBI PubMed' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setErrorMsg(null);
                  }}
                  className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#eb3b2d] text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-[#eb3b2d]' : ''} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Non-Medical / Non-Clinical Research Disclaimer Banner */}
          <div className="px-6 py-2 bg-amber-950/30 border-b border-amber-800/30 text-[11px] text-amber-200/90 font-mono flex items-center justify-between gap-2">
            <span>
              Educational &amp; Scientific Research Reference Only — Not Medical, Diagnostic, or Clinical Treatment Advice.
            </span>
            <span className="uppercase text-[10px] text-amber-400 shrink-0">Non-Clinical</span>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Search Input Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'proteins'
                      ? 'UniProt ID or Gene (e.g. P04637, TP53, ABL1, EGFR)'
                      : activeTab === 'chemistry'
                      ? 'Compound Name or CID (e.g. aspirin, imatinib, caffeine)'
                      : 'PubMed biomedical research topic or author (e.g. CRISPR Cas9 gene therapy)'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#eb3b2d] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#eb3b2d] hover:bg-[#d63427] text-white text-xs font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Lookup</span>
              </button>
            </form>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-mono text-neutral-500">Presets:</span>
              {activeTab === 'proteins' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('P04637', 'proteins')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    TP53 (Tumor Suppressor)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('P00520', 'proteins')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    ABL1 (Kinase Target)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('P00533', 'proteins')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    EGFR (Growth Factor Receptor)
                  </button>
                </>
              )}
              {activeTab === 'chemistry' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('aspirin', 'chemistry')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    Aspirin (CID 2244)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('imatinib', 'chemistry')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    Imatinib (Gleevec)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('paclitaxel', 'chemistry')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    Paclitaxel (Taxol)
                  </button>
                </>
              )}
              {activeTab === 'literature' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('CRISPR Cas9 Sickle Cell Disease', 'literature')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    CRISPR Sickle Cell
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('AlphaFold protein structure prediction', 'literature')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    AlphaFold Methods
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('mRNA vaccine lipid nanoparticles', 'literature')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    mRNA Nanoparticles
                  </button>
                </>
              )}
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Protein Result Display */}
            {activeTab === 'proteins' && proteinResult && (
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{proteinResult.gene}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 font-mono text-neutral-300">
                        {proteinResult.uniprotAccession}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{proteinResult.uniprotDescription}</p>
                    <p className="text-[11px] text-neutral-500 italic mt-0.5">{proteinResult.organismScientificName}</p>
                  </div>
                  <a
                    href={`https://alphafold.ebi.ac.uk/entry/${proteinResult.uniprotAccession}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-[#eb3b2d] hover:underline"
                  >
                    <span>AlphaFold DB</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                {/* Metric highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800">
                  <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] uppercase font-mono text-neutral-500 block">Residues</span>
                    <span className="text-sm font-bold text-white">{proteinResult.sequenceLength}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] uppercase font-mono text-neutral-500 block">Prediction ID</span>
                    <span className="text-xs font-mono text-neutral-300 truncate block">{proteinResult.entryId}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] uppercase font-mono text-neutral-500 block">Coordinate PDB</span>
                    <a href={proteinResult.pdbUrl} target="_blank" rel="noreferrer" className="text-xs text-[#eb3b2d] hover:underline truncate block">
                      Download .pdb
                    </a>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] uppercase font-mono text-neutral-500 block">mmCIF Model</span>
                    <a href={proteinResult.cifUrl} target="_blank" rel="noreferrer" className="text-xs text-[#eb3b2d] hover:underline truncate block">
                      Download .cif
                    </a>
                  </div>
                </div>

                {/* Prompt insertion CTA */}
                {onSelectPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPrompt(
                        `Explain the 3D molecular structure of ${proteinResult.gene} (${proteinResult.uniprotAccession}) from AlphaFold DB, including key functional domains and pLDDT confidence regions.`
                      );
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-xs text-white font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Atom size={13} className="text-[#eb3b2d]" />
                    <span>Ask Omnia to explain this structure in chat</span>
                  </button>
                )}
              </div>
            )}

            {/* Chemistry Result Display */}
            {activeTab === 'chemistry' && compoundResult && (
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize text-white">{compoundResult.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 font-mono text-neutral-300">
                        CID {compoundResult.cid}
                      </span>
                    </div>
                    {compoundResult.iupacName && (
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{compoundResult.iupacName}</p>
                    )}
                  </div>
                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compoundResult.cid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-[#eb3b2d] hover:underline shrink-0 ml-2"
                  >
                    <span>PubChem</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="p-3 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={compoundResult.structureImageUrl}
                      alt={compoundResult.name}
                      className="max-h-36 object-contain"
                    />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 block">Formula</span>
                      <span className="font-mono text-white">{compoundResult.molecularFormula}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 block">Mol Weight</span>
                      <span className="font-mono text-white">{compoundResult.molecularWeight} g/mol</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 block">XLogP</span>
                      <span className="font-mono text-white">{compoundResult.xLogP ?? 'N/A'}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 block">TPSA</span>
                      <span className="font-mono text-white">{compoundResult.tpsa ?? 'N/A'} Å²</span>
                    </div>
                    <div className="col-span-2 p-2 rounded bg-neutral-950/60 border border-neutral-850">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 block">Canonical SMILES</span>
                      <span className="font-mono text-[11px] text-neutral-300 break-all">{compoundResult.smiles}</span>
                    </div>
                  </div>
                </div>

                {onSelectPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPrompt(
                        `Break down the pharmacological mechanism, drug targets, and chemical properties of ${compoundResult.name} (CID ${compoundResult.cid}, formula: ${compoundResult.molecularFormula}).`
                      );
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-xs text-white font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Atom size={13} className="text-[#eb3b2d]" />
                    <span>Analyze drug properties in Omnia chat</span>
                  </button>
                )}
              </div>
            )}

            {/* Literature Results Display */}
            {activeTab === 'literature' && literatureResults.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-neutral-400 block">
                  Found {literatureResults.length} PubMed Articles:
                </span>
                {literatureResults.map((art) => (
                  <div key={art.pmid} className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white leading-snug">{art.title}</h4>
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#eb3b2d] hover:underline shrink-0 flex items-center gap-1"
                      >
                        <span>PMID {art.pmid}</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      {art.authors.join(', ')} • <span className="italic">{art.journal}</span> ({art.pubDate})
                    </p>
                    {onSelectPrompt && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPrompt(
                            `Synthesize the findings and clinical implications from PubMed study PMID:${art.pmid} ("${art.title}").`
                          );
                          onClose();
                        }}
                        className="text-[11px] text-neutral-300 hover:text-white hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <span>Synthesize in Omnia chat →</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 border-t border-neutral-850 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Integrated with AlphaFold DB, PubChem PUG REST & PubMed E-utilities.</span>
            <span className="text-[#eb3b2d] font-mono">DeepMind Science Skills</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
