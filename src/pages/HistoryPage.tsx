import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Download,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { Conversation } from '../types/ai';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem('omnia_conversations_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'conv-1',
        title: 'Welcome to Omnia',
        createdAt: Date.now() - 1000 * 60 * 60 * 2,
        updatedAt: Date.now() - 1000 * 60 * 60 * 2,
        group: 'today',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hi Omnia, what can you help me with?',
            timestamp: '10:14 AM',
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: `Hey! I can answer questions across science, history, coding, and general knowledge, explain complex concepts, write code, research topics, or help you build creative projects whenever you're ready. What are you working on today?`,
            timestamp: '10:14 AM',
            mode: 'quick',
          },
        ],
      },
      {
        id: 'conv-2',
        title: 'Photosynthesis Overview',
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24,
        group: 'yesterday',
        messages: [
          {
            id: 'msg-2-1',
            role: 'user',
            content: 'What is photosynthesis?',
            timestamp: '8:30 AM',
          },
          {
            id: 'msg-2-2',
            role: 'assistant',
            content: `Photosynthesis is the process plants use to convert light energy into chemical energy, mainly producing glucose from carbon dioxide and water.`,
            timestamp: '8:30 AM',
            mode: 'quick',
          },
        ],
      },
      {
        id: 'conv-3',
        title: 'Procedural GLSL Shader Concept',
        createdAt: Date.now() - 1000 * 60 * 60 * 72,
        updatedAt: Date.now() - 1000 * 60 * 60 * 72,
        group: 'previous7Days',
        messages: [
          {
            id: 'msg-3-1',
            role: 'user',
            content: 'Synthesize a WebGL raymarched fluid shader in GLSL',
            timestamp: '3:15 PM',
          },
        ],
      },
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const saveToStorage = (updated: Conversation[]) => {
    setConversations(updated);
    try {
      localStorage.setItem('omnia_conversations_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.messages?.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenConversation = (id: string) => {
    sessionStorage.setItem('omnia_open_conversation_id', id);
    navigate('/ai');
  };

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleConfirmRename = (id: string) => {
    if (!editTitle.trim()) return;
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, title: editTitle.trim(), updatedAt: Date.now() } : c
    );
    saveToStorage(updated);
    setEditingId(null);
  };

  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    saveToStorage(updated);
    setDeleteConfirmId(null);
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vizra_conversations_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <PageLayout
      title="Conversation History — Vizra AI Creative Studio"
      description="Review, search, export, and manage your saved Omnia 1.0 conversation threads and creative sessions."
      canonicalPath="/history"
      noindex={true}
    >
      <div className="pt-24 pb-28 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 dark:border-white/10 border-neutral-300">
          <div>
            <div className="typo-eyebrow flex items-center gap-2">
              <HistoryIcon size={14} />
              <span>Workspace Memory & Archives</span>
            </div>
            <h1 className="typo-section-title mt-1">Saved Conversations</h1>
            <p className="text-sm text-neutral-400 dark:text-neutral-400 text-neutral-600 mt-0.5">
              Access your previous reasoning sessions, prompt blueprints, and code generations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportAll}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-900 bg-white border border-white/10 dark:border-white/10 border-neutral-300 text-xs font-medium text-neutral-300 dark:text-neutral-300 text-neutral-700 hover:text-white dark:hover:text-white hover:border-[#eb3b2d] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Export All</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('omnia_open_conversation_id');
                navigate('/ai');
              }}
              className="px-4 py-2 rounded-xl bg-[#eb3b2d] hover:bg-[#dc2626] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Sparkles size={14} />
              <span>New Conversation</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="my-6 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations, questions, code, and keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/60 dark:bg-neutral-900/60 bg-white border border-white/10 dark:border-white/10 border-neutral-300 text-sm text-white dark:text-white text-neutral-900 placeholder-neutral-500 focus:outline-none focus:border-[#eb3b2d] transition-colors"
          />
        </div>

        {/* Conversation List */}
        {filteredConversations.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-neutral-900/40 dark:bg-neutral-900/40 bg-neutral-100 border border-white/5 dark:border-white/5 border-neutral-300 space-y-3">
            <MessageSquare size={32} className="mx-auto text-neutral-500" />
            <h3 className="text-base font-semibold text-white dark:text-white text-neutral-900">
              No conversations found
            </h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-400 text-neutral-600 max-w-sm mx-auto">
              {searchQuery
                ? `No sessions matched “${searchQuery}”. Try clearing your search term.`
                : 'You have not created any conversations yet. Start a new chat to begin exploring with Omnia.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-800 text-xs text-white font-medium hover:bg-neutral-700 cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => {
              const isEditing = editingId === conv.id;
              const isDeleting = deleteConfirmId === conv.id;
              const messageCount = conv.messages?.length || 0;
              const lastMessage = conv.messages?.[conv.messages.length - 1];

              return (
                <div
                  key={conv.id}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-neutral-900/60 dark:bg-neutral-900/60 bg-white border border-white/10 dark:border-white/10 border-neutral-200 hover:border-[#eb3b2d]/60 dark:hover:border-[#eb3b2d]/60 transition-all duration-200 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Title & Preview */}
                    <div className="flex-1 min-w-0 pr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2 max-w-md">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmRename(conv.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-950 dark:bg-neutral-950 bg-neutral-100 border border-[#eb3b2d] text-sm text-white dark:text-white text-neutral-900 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmRename(conv.id)}
                            className="p-2 rounded-lg bg-[#eb3b2d] text-white hover:bg-[#dc2626] cursor-pointer"
                            title="Save Title"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h2
                              onClick={() => handleOpenConversation(conv.id)}
                              className="text-base font-semibold text-white dark:text-white text-neutral-900 hover:text-[#eb3b2d] cursor-pointer transition-colors truncate"
                            >
                              {conv.title}
                            </h2>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 dark:bg-neutral-800 bg-neutral-200 text-neutral-400 dark:text-neutral-400 text-neutral-700 shrink-0">
                              {messageCount} msg{messageCount === 1 ? '' : 's'}
                            </span>
                          </div>

                          {lastMessage && (
                            <p className="text-xs text-neutral-400 dark:text-neutral-400 text-neutral-600 line-clamp-1 mt-1 font-mono">
                              {lastMessage.role === 'user' ? 'You: ' : 'Omnia: '}
                              {lastMessage.content}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(conv.updatedAt || conv.createdAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isDeleting ? (
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-red-950/40 border border-red-800/40">
                          <span className="text-[11px] font-mono text-red-300 px-2">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteConversation(conv.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartRename(conv)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            title="Rename Conversation"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(conv.id)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Conversation"
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenConversation(conv.id)}
                            className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ml-1"
                          >
                            <span>Open</span>
                            <ArrowRight size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
