import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  MessageSquare,
  Edit2,
  Archive,
  Trash2,
  X,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Keyboard,
  LayoutDashboard,
} from 'lucide-react';
import { Conversation, Project } from '../../types/ai';
import { VizraLogo } from '../VizraLogo';
import { modKey } from '../../hooks/useKeyboardShortcuts';
import { CreditUsageIndicator } from '../ui/CreditUsageIndicator';

interface AISidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onArchiveConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isOpenDesktop?: boolean;
  onOpenShortcutsHelp?: () => void;
  projects?: Project[];
  activeProjectId?: string | null;
  onSelectProject?: (id: string) => void;
  onNewProject?: () => void;
}

export const AISidebar: React.FC<AISidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onArchiveConversation,
  onDeleteConversation,
  isOpenMobile,
  onCloseMobile,
  isOpenDesktop = true,
  onOpenShortcutsHelp,
  projects = [],
  activeProjectId,
  onSelectProject,
  onNewProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groups: { key: 'today' | 'yesterday' | 'previous7Days'; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'previous7Days', label: 'Previous 7 days' },
  ];

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const content = (
    <div className="w-[270px] h-full bg-[#0a0a0a] border-r border-neutral-900 flex flex-col justify-between select-none shrink-0 z-40">
      {/* Top Area: New Chat & Search */}
      <div className="p-3 space-y-3 shrink-0">
        {/* Mobile close button */}
        <div className="flex items-center justify-between md:hidden pb-1 border-b border-neutral-900">
          <span className="text-xs font-semibold text-neutral-400">Workspace</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-neutral-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary New Chat Button */}
        <button
          onClick={() => {
            onNewChat();
            if (isOpenMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer group"
        >
          <Plus size={16} className="text-black group-hover:scale-110 transition-transform" />
          <span>New chat</span>
        </button>

        {/* Search Field */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats & projects"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 focus:border-neutral-700 focus:outline-none text-xs text-white placeholder-neutral-500 transition-colors font-sans"
          />
        </div>
      </div>

      {/* Main List Body: Projects & Chat History */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2 text-xs">
        {/* Section 1: Interactive Projects */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            <button
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="flex items-center gap-1.5 hover:text-neutral-300 transition-colors cursor-pointer"
            >
              {isProjectsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <span>Projects ({projects.length})</span>
            </button>
            {onNewProject && (
              <button
                onClick={onNewProject}
                className="hover:text-white transition-colors cursor-pointer p-0.5"
                title="Create a new creative project"
              >
                <Plus size={12} />
              </button>
            )}
          </div>

          {isProjectsOpen && (
            <div className="space-y-0.5 pl-1">
              {projects.map((proj) => {
                const isProjectActive = activeProjectId === proj.id;
                const completedCount = proj.stages.filter((s) => s.status === 'completed').length;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      if (onSelectProject) onSelectProject(proj.id);
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isProjectActive
                        ? 'bg-neutral-900 text-white font-medium border border-neutral-700'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <Layers
                        size={13}
                        className={`shrink-0 ${isProjectActive ? 'text-[#eb3b2d]' : 'text-neutral-500'}`}
                      />
                      <span className="truncate text-xs">{proj.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                      {completedCount}/10
                    </span>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="px-3 py-1.5 text-neutral-500 text-[11px]">
                  No projects yet. Ask Omnia to turn ideas into a project.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-neutral-900 mx-2" />

        {/* Section 2: Conversations Grouped by Time */}
        {groups.map((group) => {
          const groupConversations = filtered.filter((c) => c.group === group.key);
          if (groupConversations.length === 0) return null;

          return (
            <div key={group.key} className="space-y-0.5">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                {group.label}
              </div>

              {groupConversations.map((conv) => {
                const isActive = conv.id === activeId && !activeProjectId;
                const isMenuOpen = menuOpenId === conv.id;
                const isEditing = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    className="relative group rounded-lg transition-colors"
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveRename(conv.id);
                        }}
                        className="p-1.5"
                      >
                        <input
                          autoFocus
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveRename(conv.id)}
                          className="w-full px-2 py-1 rounded bg-neutral-900 border border-[#eb3b2d] text-xs text-white focus:outline-none"
                        />
                      </form>
                    ) : (
                      <div
                        onClick={() => {
                          onSelectConversation(conv.id);
                          if (isOpenMobile) onCloseMobile();
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-neutral-900 text-white font-medium'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <MessageSquare
                            size={14}
                            className={`shrink-0 ${isActive ? 'text-[#eb3b2d]' : 'text-neutral-500'}`}
                          />
                          <span className="truncate">{conv.title}</span>
                        </div>

                        {/* Options button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(isMenuOpen ? null : conv.id);
                          }}
                          className={`p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-opacity ${
                            isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          aria-label="Conversation options"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    )}

                    {/* Options Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-2 top-full mt-1 w-36 rounded-lg bg-neutral-950 border border-neutral-800 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-75"
                      >
                        <button
                          onClick={() => handleStartRename(conv)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-neutral-900 text-left text-[11px] text-neutral-300 hover:text-white transition-colors"
                        >
                          <Edit2 size={12} />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={() => {
                            onArchiveConversation(conv.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-neutral-900 text-left text-[11px] text-neutral-300 hover:text-white transition-colors"
                        >
                          <Archive size={12} />
                          <span>Archive</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmId(conv.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-950/40 text-left text-[11px] text-[#eb3b2d] transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-neutral-500 text-xs">
            No conversations found
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="p-3 bg-neutral-950 border-t border-neutral-900 text-xs shrink-0">
          <p className="text-neutral-300 font-medium mb-1">Delete conversation?</p>
          <p className="text-[11px] text-neutral-500 mb-2">This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onDeleteConversation(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              className="flex-1 py-1 rounded bg-[#eb3b2d] text-white font-medium text-[11px] hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bottom of Sidebar */}
      <div className="p-3 border-t border-neutral-900 bg-black/40 shrink-0 space-y-2.5">
        <CreditUsageIndicator variant="sidebar" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VizraLogo size={18} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">Vizra</span>
                <span className="text-[10px] text-neutral-500 font-mono">Omnia 1.0</span>
              </div>
              <span className="text-[10px] text-neutral-500 block">Multimodal Creative OS</span>
            </div>
          </div>
        </div>

        <Link
          to="/workspace"
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-900/50 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition-colors"
          title="Open Workspace & Developer Console"
        >
          <div className="flex items-center gap-1.5">
            <LayoutDashboard size={12} className="text-[#eb3b2d]" />
            <span>Workspace Console</span>
          </div>
          <span className="text-[9px] font-mono text-neutral-500">Dashboard →</span>
        </Link>

        {onOpenShortcutsHelp && (
          <button
            onClick={onOpenShortcutsHelp}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-900/50 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-800 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title={`Keyboard Shortcuts (${modKey}/)`}
          >
            <div className="flex items-center gap-1.5">
              <Keyboard size={12} className="text-neutral-400" />
              <span>Shortcuts</span>
            </div>
            <kbd className="px-1 py-0.2 text-[9px] font-mono bg-neutral-950 border border-neutral-800 rounded text-neutral-400">
              {modKey}/
            </kbd>
          </button>
        )}
      </div>
    </div>
  );

  const collapsedRail = (
    <div className="w-[60px] h-full bg-[#0a0a0a] border-r border-neutral-900 flex flex-col items-center justify-between py-3 select-none shrink-0 z-40">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onNewChat}
          className="w-9 h-9 rounded-xl bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
          title="New chat"
          aria-label="New chat"
        >
          <Plus size={16} />
        </button>

        {onNewProject && (
          <button
            type="button"
            onClick={onNewProject}
            className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="New 10-Stage Project"
            aria-label="New 10-Stage Project"
          >
            <Layers size={15} className="text-[#eb3b2d]" />
          </button>
        )}

        <Link
          to="/workspace"
          className="w-9 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
          title="Workspace & Developer Console"
          aria-label="Workspace & Developer Console"
        >
          <LayoutDashboard size={15} />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <CreditUsageIndicator variant="rail" />
        {onOpenShortcutsHelp && (
          <button
            type="button"
            onClick={onOpenShortcutsHelp}
            className="w-9 h-9 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={`Keyboard Shortcuts (${modKey}/)`}
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard size={14} />
          </button>
        )}
        <VizraLogo size={18} />
      </div>
    </div>
  );

  return (
    <>
      {isOpenDesktop ? (
        <div className="hidden md:block h-full shrink-0 animate-in fade-in duration-150">
          {content}
        </div>
      ) : (
        <div className="hidden md:block h-full shrink-0 animate-in fade-in duration-150">
          {collapsedRail}
        </div>
      )}

      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200 h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
