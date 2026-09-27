import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Shield,
  Zap,
  Sparkles,
  BrainCircuit,
  Globe,
  Trash2,
  Plus,
  Check,
  Download,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { VizraLogo } from '../VizraLogo';
import { AIMode, PersonalMemoryItem, Integration } from '../../types/ai';
import {
  getPersonalMemories,
  addPersonalMemory,
  deletePersonalMemory,
  clearAllPersonalMemories,
  isMemoryEnabled,
  setMemoryEnabled,
} from '../../services/memoryService';
import {
  getIntegrations,
  updateIntegrationStatus,
} from '../../services/integrationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'memory' | 'integrations' | 'privacy'>('general');
  const [language, setLanguage] = useState<'auto' | 'en' | 'hi' | 'hinglish'>('auto');
  const [themeMode, setThemeMode] = useState<'pure_black' | 'charcoal'>('pure_black');
  const [defaultMode, setDefaultMode] = useState<AIMode>('quick');
  const [responseStyle, setResponseStyle] = useState<'concise' | 'detailed' | 'kinetic'>('kinetic');

  // Memory Tab State
  const [memories, setMemories] = useState<PersonalMemoryItem[]>([]);
  const [memoryActive, setMemoryActive] = useState(true);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<PersonalMemoryItem['category']>('style');

  // Integrations Tab State
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [copiedExport, setCopiedExport] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMemories(getPersonalMemories());
      setMemoryActive(isMemoryEnabled());
      setIntegrations(getIntegrations());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMemoryActive = () => {
    const next = !memoryActive;
    setMemoryActive(next);
    setMemoryEnabled(next);
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    const created = addPersonalMemory(newMemoryCategory, newMemoryText.trim());
    setMemories([created, ...memories]);
    setNewMemoryText('');
  };

  const handleDeleteMemory = (id: string) => {
    deletePersonalMemory(id);
    setMemories(memories.filter((m) => m.id !== id));
  };

  const handleClearAllMemories = () => {
    clearAllPersonalMemories();
    setMemories([]);
  };

  const handleDisconnect = (id: string) => {
    const updated = updateIntegrationStatus(id, 'connect');
    setIntegrations(updated);
  };

  const handleExportData = () => {
    const payload = {
      exportDate: new Date().toISOString(),
      platform: 'Vizra Omnia 1.0',
      memories: getPersonalMemories(),
      integrations: getIntegrations(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vizra_omnia_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <VizraLogo size={20} />
            <div>
              <h3 className="font-semibold text-base tracking-tight">Workspace Preferences</h3>
              <p className="text-[11px] text-neutral-500 font-mono">Omnia 1.0 Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 pt-3 pb-3 border-b border-neutral-900 shrink-0 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'general' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'ai' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            AI & Modes
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'memory' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Personal Memory</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'integrations' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'privacy' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Data & Privacy
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
          {/* TAB 1: General */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1.5">Language Understanding</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'auto', label: 'Auto-detect (Native)' },
                    { id: 'en', label: 'English' },
                    { id: 'hinglish', label: 'Hinglish (Hindi + English)' },
                    { id: 'hi', label: 'हिन्दी (Hindi)' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id as any)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                        language === l.id
                          ? 'bg-neutral-900 border-[#eb3b2d] text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-xs">{l.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1.5">Surface Aesthetic</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setThemeMode('pure_black')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      themeMode === 'pure_black'
                        ? 'bg-neutral-900 border-[#eb3b2d] text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div className="font-semibold text-xs">Pure Obsidian (0% L)</div>
                    <div className="text-[10px] text-neutral-500">True OLED black depth</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode('charcoal')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      themeMode === 'charcoal'
                        ? 'bg-neutral-900 border-[#eb3b2d] text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div className="font-semibold text-xs">Matte Charcoal</div>
                    <div className="text-[10px] text-neutral-500">Subtle studio elevation</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI & Modes */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1.5">Default Mode on Start</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['quick', 'think', 'research', 'create', 'code', 'analyze'] as AIMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDefaultMode(m)}
                      className={`p-2.5 rounded-xl border text-left capitalize cursor-pointer transition-colors ${
                        defaultMode === m
                          ? 'bg-neutral-900 border-[#eb3b2d] text-white font-semibold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1.5">Response Cadence</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'concise', label: 'Concise' },
                    { id: 'kinetic', label: 'Kinetic / Balanced' },
                    { id: 'detailed', label: 'Comprehensive' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setResponseStyle(s.id as any)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                        responseStyle === s.id
                          ? 'bg-neutral-900 border-[#eb3b2d] text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1 text-xs">
                <div className="font-semibold text-neutral-200">Omnia 1.0 Intelligence Foundation</div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Engineered specifically for creative direction, 60fps kinetic motion physics, and multimodal workflow generation.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Personal Memory */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <div>
                  <div className="font-semibold text-neutral-200">Personal Memory</div>
                  <div className="text-[11px] text-neutral-400">
                    Retain your preferred style, language, and project habits.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMemoryActive}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    memoryActive ? 'bg-[#eb3b2d]' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      memoryActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {memoryActive && (
                <>
                  {/* Add memory item */}
                  <form onSubmit={handleAddMemory} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMemoryText}
                        onChange={(e) => setNewMemoryText(e.target.value)}
                        placeholder="Add a new memory (e.g. Always write code with TypeScript types)..."
                        className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#eb3b2d]"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </form>

                  {/* Memory List */}
                  <div className="space-y-2">
                    {memories.map((mem) => (
                      <div
                        key={mem.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300"
                      >
                        <div className="flex items-center gap-2 pr-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] shrink-0" />
                          <span>{mem.content}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteMemory(mem.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete memory"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    {memories.length === 0 && (
                      <div className="text-center py-4 text-neutral-500 text-xs">
                        No saved memories yet.
                      </div>
                    )}
                  </div>

                  {memories.length > 0 && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleClearAllMemories}
                        className="text-[11px] text-neutral-500 hover:text-[#eb3b2d] transition-colors cursor-pointer"
                      >
                        Clear all memories
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 4: Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-3">
              <p className="text-[11px] text-neutral-400">
                Connected services and permission scopes authorized for your workspace.
              </p>
              <div className="space-y-2">
                {integrations.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-neutral-200">{item.name}</div>
                      <div className="text-[10px] text-neutral-500">{item.description}</div>
                    </div>

                    <div>
                      {item.status === 'connected' ? (
                        <button
                          onClick={() => handleDisconnect(item.id)}
                          className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-[#eb3b2d] transition-colors cursor-pointer text-[11px]"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-850 text-neutral-500">
                          {item.status === 'coming_soon' ? 'Coming Soon' : 'Not Connected'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Data & Privacy */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-neutral-200 font-semibold">
                  <Shield size={14} className="text-[#eb3b2d]" />
                  <span>Omnia Zero-Retention Policy</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Your creative prompts, attachments, and project outlines are processed in real-time. Vizra does not sell your creative assets or train public foundational models on private workspaces.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800">
                <div>
                  <div className="font-semibold text-neutral-300">Export All Data</div>
                  <div className="text-[11px] text-neutral-500">Download conversations and memories in JSON.</div>
                </div>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs transition-colors cursor-pointer"
                >
                  <Download size={13} className="text-[#eb3b2d]" />
                  <span>{copiedExport ? 'Exported!' : 'Export JSON'}</span>
                </button>
              </div>

              {onClearHistory && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-950/20 border border-red-900/30">
                  <div>
                    <div className="font-semibold text-[#eb3b2d]">Clear Conversation History</div>
                    <div className="text-[11px] text-neutral-400">Permanently delete all active chat sessions.</div>
                  </div>
                  <button
                    onClick={onClearHistory}
                    className="px-3 py-1.5 rounded-lg bg-[#eb3b2d] text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    Delete All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2 pt-3 border-t border-neutral-900 flex justify-between items-center shrink-0 text-[11px] text-neutral-500 font-mono">
          <span>Omnia 1.0 Runtime</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
