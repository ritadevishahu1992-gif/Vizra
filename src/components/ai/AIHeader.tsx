import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Plus, Settings, User, Sparkles, Database } from 'lucide-react';
import { VizraLogo } from '../VizraLogo';
import { ModelSelector } from './ModelSelector';
import { CapabilitiesMenu } from './CapabilitiesMenu';
import { OmniaModel } from '../../types/ai';
import { UserMenu } from '../auth/UserMenu';

interface AIHeaderProps {
  currentModel: OmniaModel;
  onSelectModel: (model: OmniaModel) => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenCreateHub?: () => void;
  onOpenKnowledgeBase?: () => void;
}

export const AIHeader: React.FC<AIHeaderProps> = ({
  currentModel,
  onSelectModel,
  onNewChat,
  onToggleSidebar,
  onOpenSettings,
  onOpenCreateHub,
  onOpenKnowledgeBase,
}) => {
  return (
    <header className="h-14 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left: Hamburger (mobile), Vizra Logo back to '/' + Omnia 1.0 + Online Indicator */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-1 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
          aria-label="Toggle Conversation Sidebar"
        >
          <Menu size={18} />
        </button>

        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#eb3b2d] rounded py-1"
          title="Back to Vizra Home"
        >
          <VizraLogo size={22} />
          <span className="text-base font-bold tracking-tight text-white group-hover:opacity-90 transition-opacity">
            Vizra
          </span>
        </Link>

        <div className="h-4 w-px bg-neutral-800" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-300 tracking-tight">
            Omnia 1.0
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Center: Model Selector & Capabilities */}
      <div className="hidden sm:flex items-center gap-3">
        <ModelSelector currentModel={currentModel} onSelectModel={onSelectModel} />
        <CapabilitiesMenu />

        {onOpenCreateHub && (
          <button
            onClick={onOpenCreateHub}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer"
            title="Open Create Hub (8 disciplines)"
          >
            <Sparkles size={13} className="text-[#eb3b2d]" />
            <span>Create Hub</span>
          </button>
        )}

        {onOpenKnowledgeBase && (
          <button
            onClick={onOpenKnowledgeBase}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer"
            title="Open OMNIA 1.0 RAG Knowledge Base"
          >
            <Database size={13} className="text-[#eb3b2d]" />
            <span>Knowledge Base</span>
          </button>
        )}
      </div>

      {/* Right: Actions (New Chat, Settings, Profile) */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-white transition-colors cursor-pointer"
          title="Start new conversation"
          aria-label="New Chat"
        >
          <Plus size={14} className="text-[#eb3b2d]" />
          <span className="hidden md:inline">New Chat</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>

        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
