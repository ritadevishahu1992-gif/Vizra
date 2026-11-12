import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Plus, Settings, User, Sparkles, Database, Music, Radio, Atom, Search, Keyboard, BarChart3 } from 'lucide-react';
import { VizraLogo } from '../VizraLogo';
import { ModelSelector } from './ModelSelector';
import { CapabilitiesMenu } from './CapabilitiesMenu';
import { OmniaModel } from '../../types/ai';
import { UserMenu } from '../auth/UserMenu';
import { modKey } from '../../hooks/useKeyboardShortcuts';
import { Tooltip } from '../ui/Tooltip';
import { CreditUsageIndicator } from '../ui/CreditUsageIndicator';
import { LiquidGlassToggle } from '../ui/LiquidGlassToggle';

interface AIHeaderProps {
  currentModel: OmniaModel;
  onSelectModel: (model: OmniaModel) => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenCreateHub?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenMusicStudio?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenScienceHub?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsHelp?: () => void;
  onOpenEngageAdmin?: () => void;
}

export const AIHeader: React.FC<AIHeaderProps> = ({
  currentModel,
  onSelectModel,
  onNewChat,
  onToggleSidebar,
  onOpenSettings,
  onOpenCreateHub,
  onOpenKnowledgeBase,
  onOpenMusicStudio,
  onOpenLiveVoice,
  onOpenScienceHub,
  onOpenCommandPalette,
  onOpenShortcutsHelp,
  onOpenEngageAdmin,
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
          aria-label="Back to Vizra Home"
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
          <Tooltip
            label="Create Hub"
            text="Launch guided creative workflows across 8 disciplines including video scripts, storyboards, and 10-stage projects."
            position="bottom"
          >
            <button
              onClick={onOpenCreateHub}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Open Create Hub"
            >
              <Sparkles size={13} className="text-[#eb3b2d]" />
              <span>Create Hub</span>
            </button>
          </Tooltip>
        )}

        {onOpenScienceHub && (
          <Tooltip
            label="Omnia Science Suite"
            text="Explore 3D protein structures (AlphaFold), chemical molecules (PubChem), and peer-reviewed PubMed research."
            position="bottom"
          >
            <button
              onClick={onOpenScienceHub}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Open Omnia Science Suite"
            >
              <Atom size={13} className="text-[#eb3b2d]" />
              <span>Science</span>
            </button>
          </Tooltip>
        )}

        {onOpenKnowledgeBase && (
          <Tooltip
            label="Knowledge Base"
            text="Browse and manage verified documents, project specs, and citations used to ground Omnia's answers."
            position="bottom"
          >
            <button
              onClick={onOpenKnowledgeBase}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Open Knowledge Base"
            >
              <Database size={13} className="text-[#eb3b2d]" />
              <span>Knowledge Base</span>
            </button>
          </Tooltip>
        )}

        {onOpenMusicStudio && (
          <Tooltip
            label="AI Music Studio"
            text="Compose custom instrumental soundtracks, ambient loops, and audio cues from text prompts using Lyria 3."
            position="bottom"
          >
            <button
              onClick={onOpenMusicStudio}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Open AI Music Studio"
            >
              <Music size={13} className="text-[#eb3b2d]" />
              <span>AI Music</span>
            </button>
          </Tooltip>
        )}

        {onOpenLiveVoice && (
          <Tooltip
            label="Live Voice Studio"
            text="Start a real-time, hands-free voice conversation with Omnia for live brainstorming and creative direction."
            position="bottom"
          >
            <button
              onClick={onOpenLiveVoice}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Start Live Voice Conversation"
            >
              <Radio size={13} className="text-[#eb3b2d] animate-pulse" />
              <span>Live Voice</span>
            </button>
          </Tooltip>
        )}

        {onOpenEngageAdmin && (
          <Tooltip
            label="Vizra Engage Studio"
            text="Manage interactive learning cards, creative tips, and visual experiences displayed while responses generate."
            position="bottom"
          >
            <button
              onClick={onOpenEngageAdmin}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Open Vizra Engage Studio"
            >
              <BarChart3 size={13} className="text-[#eb3b2d]" />
              <span>Engage</span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Right: Actions (Credits, Command Palette, New Chat, Settings, Profile) */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <CreditUsageIndicator variant="header" />

        {onOpenCommandPalette && (
          <Tooltip
            label="Command Palette"
            shortcut={`${modKey}K`}
            text="Quickly search and launch any creative tool, mode, or workspace command from one place."
            position="bottom"
            align="end"
          >
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Command Palette"
            >
              <Search size={13} className="text-neutral-400" />
              <span className="hidden md:inline">Commands</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono text-neutral-400 bg-neutral-950 border border-neutral-800 rounded">
                {modKey}K
              </kbd>
            </button>
          </Tooltip>
        )}

        <Tooltip
          label="New Conversation"
          shortcut={`${modKey}N`}
          text="Start a fresh chat session while keeping your previous conversations saved in the sidebar."
          position="bottom"
          align="end"
        >
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-white transition-colors cursor-pointer"
            aria-label="New Chat"
          >
            <Plus size={14} className="text-[#eb3b2d]" />
            <span className="hidden md:inline">New Chat</span>
          </button>
        </Tooltip>

        {onOpenShortcutsHelp && (
          <Tooltip
            label="Keyboard Shortcuts"
            shortcut={`${modKey}/`}
            text="View all keyboard shortcuts to navigate tools and switch modes faster."
            position="bottom"
            align="end"
          >
            <button
              onClick={onOpenShortcutsHelp}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard size={16} />
            </button>
          </Tooltip>
        )}

        <Tooltip
          label="Preferences & Memory"
          shortcut={`${modKey},`}
          text="Customize Omnia's language, response style, personal memory, and display settings."
          position="bottom"
          align="end"
        >
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </Tooltip>

        <LiquidGlassToggle size="sm" className="hidden lg:inline-flex" />

        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
