import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Settings,
  Sparkles,
  Database,
  Music,
  Radio,
  Atom,
  Search,
  Keyboard,
  BarChart3,
  Clock,
  EyeOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';
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
  isTemporaryChat?: boolean;
  temporaryRemainingLabel?: string;
  onToggleTemporaryChat?: () => void;
  onOpenCreateHub?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenMusicStudio?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenScienceHub?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsHelp?: () => void;
  onOpenEngageAdmin?: () => void;
  isWideCanvas?: boolean;
  onToggleWideCanvas?: () => void;
  conversationTitle?: string;
}

export const AIHeader: React.FC<AIHeaderProps> = ({
  currentModel,
  onSelectModel,
  onNewChat,
  onToggleSidebar,
  onOpenSettings,
  isTemporaryChat = false,
  temporaryRemainingLabel,
  onToggleTemporaryChat,
  onOpenCreateHub,
  onOpenKnowledgeBase,
  onOpenMusicStudio,
  onOpenLiveVoice,
  onOpenScienceHub,
  onOpenCommandPalette,
  onOpenShortcutsHelp,
  onOpenEngageAdmin,
  isWideCanvas = false,
  onToggleWideCanvas,
  conversationTitle,
}) => {
  return (
    <header
      className={`h-15 border-b backdrop-blur-md px-3 sm:px-5 flex items-center justify-between gap-3 z-30 shrink-0 select-none transition-colors ${
        isTemporaryChat
          ? 'border-[#DC143C]/40 bg-[#14090C]/95'
          : 'border-[#23232A] bg-[#0A0A0C]/90'
      }`}
    >
      {/* Left: Circular Sidebar Toggle, Vizra Brand & Plans Link */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/45 flex items-center justify-center text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C]"
          aria-label="Toggle Conversation Sidebar"
          title="Toggle Sidebar"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="5" y1="9" x2="19" y2="9" />
            <line x1="5" y1="15" x2="15" y2="15" />
          </svg>
        </button>

        <Link
          to="/"
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#DC143C] rounded-lg py-1 shrink-0"
          aria-label="Back to Vizra Home"
        >
          <VizraLogo size={22} />
          <span className="font-display text-base font-semibold tracking-tight text-white group-hover:opacity-90 transition-opacity whitespace-nowrap">
            Vizra
          </span>
        </Link>

        <div className="hidden sm:block h-4 w-px bg-[#23232A] shrink-0" />

        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-zinc-300 tracking-tight truncate max-w-[160px] lg:max-w-[200px]">
            {isTemporaryChat
              ? 'Temporary Chat'
              : conversationTitle || 'Omnia 1.0'}
          </span>
          {isTemporaryChat && temporaryRemainingLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-rose-300 shrink-0">
              <Clock size={11} className="text-[#DC143C]" />
              <span>{temporaryRemainingLabel}</span>
            </span>
          )}
        </div>

        {/* Real VIZRA Plans / Upgrade Entry Point */}
        <Link
          to="/pricing"
          aria-label="View Vizra Plans"
          className="h-9 px-3 rounded-full bg-[#141418] hover:bg-[#DC143C]/14 border border-[#23232A] hover:border-[#DC143C]/50 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white transition-all active:scale-95 whitespace-nowrap shrink-0"
        >
          <Sparkles size={13} className="text-[#DC143C] shrink-0" />
          <span className="font-display font-semibold tracking-wide">Plans</span>
        </Link>
      </div>

      {/* Center: Model Selector & Studio Capabilities */}
      <div className="hidden xl:flex items-center gap-2">
        <ModelSelector currentModel={currentModel} onSelectModel={onSelectModel} />
        <CapabilitiesMenu />

        {onOpenCreateHub && (
          <Tooltip
            label="Create Hub"
            text="Launch guided creative workflows across 8 disciplines including video scripts, storyboards, and 10-stage projects."
            position="bottom"
          >
            <button
              type="button"
              onClick={onOpenCreateHub}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Open Create Hub"
            >
              <Sparkles size={13} className="text-[#DC143C]" />
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
              type="button"
              onClick={onOpenScienceHub}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Open Omnia Science Suite"
            >
              <Atom size={13} className="text-[#DC143C]" />
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
              type="button"
              onClick={onOpenKnowledgeBase}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Open Knowledge Base"
            >
              <Database size={13} className="text-[#DC143C]" />
              <span>Knowledge</span>
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
              type="button"
              onClick={onOpenMusicStudio}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Open AI Music Studio"
            >
              <Music size={13} className="text-[#DC143C]" />
              <span>Music</span>
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
              type="button"
              onClick={onOpenLiveVoice}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Start Live Voice Conversation"
            >
              <Radio size={13} className="text-[#DC143C]" />
              <span>Voice</span>
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
              type="button"
              onClick={onOpenEngageAdmin}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Open Vizra Engage Studio"
            >
              <BarChart3 size={13} className="text-[#DC143C]" />
              <span>Engage</span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Right: Actions (Credits, Width Toggle, Command Palette, New Chat, Temp Chat, Settings, Profile) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="hidden md:block">
          <CreditUsageIndicator variant="header" />
        </div>

        {/* Model Selector on Medium Screens */}
        <div className="hidden sm:block xl:hidden">
          <ModelSelector currentModel={currentModel} onSelectModel={onSelectModel} />
        </div>

        {onToggleWideCanvas && (
          <Tooltip
            label={isWideCanvas ? 'Standard Width' : 'Wide View'}
            text="Switch between focused reading width and expanded desktop canvas width."
            position="bottom"
            align="end"
          >
            <button
              type="button"
              onClick={onToggleWideCanvas}
              aria-label={isWideCanvas ? 'Switch to standard chat width' : 'Switch to wide chat view'}
              className="hidden md:flex w-9 h-9 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              {isWideCanvas ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </Tooltip>
        )}

        {onOpenCommandPalette && (
          <Tooltip
            label="Command Palette"
            shortcut={`${modKey}K`}
            text="Quickly search and launch any creative tool, mode, or workspace command from one place."
            position="bottom"
            align="end"
          >
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              aria-label="Command Palette"
            >
              <Search size={13} className="text-zinc-400" />
              <span className="hidden 2xl:inline">Commands</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-[#0A0A0C] border border-[#23232A] rounded">
                {modKey}K
              </kbd>
            </button>
          </Tooltip>
        )}

        {/* Temporary Chat Toggle */}
        {onToggleTemporaryChat && (
          <Tooltip
            label={isTemporaryChat ? 'Exit Temporary Chat' : 'Temporary Chat'}
            text={
              isTemporaryChat
                ? 'End and immediately wipe this ephemeral session from memory.'
                : 'Start an ephemeral chat not saved to your history or learning logs.'
            }
            position="bottom"
            align="end"
          >
            <button
              type="button"
              onClick={onToggleTemporaryChat}
              className={`h-9 px-2.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isTemporaryChat
                  ? 'bg-[#DC143C] text-white border-[#DC143C] hover:bg-[#B01030]'
                  : 'bg-[#141418] hover:bg-[#1B1B21] border-[#23232A] text-zinc-300 hover:text-white'
              }`}
              aria-label={isTemporaryChat ? 'Exit Temporary Chat' : 'Start Temporary Chat'}
              aria-pressed={isTemporaryChat}
            >
              <EyeOff size={13} className={isTemporaryChat ? 'text-white' : 'text-[#DC143C]'} />
              <span className="hidden lg:inline">
                {isTemporaryChat ? 'Exit Temp' : 'Temp'}
              </span>
            </button>
          </Tooltip>
        )}

        {/* Circular New Chat Action Button (Crimson Reference) */}
        <Tooltip
          label="New Chat"
          shortcut={`${modKey}N`}
          text="Start a fresh chat session while keeping previous conversations in your history."
          position="bottom"
          align="end"
        >
          <button
            type="button"
            onClick={onNewChat}
            className="w-10 h-10 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/50 flex items-center justify-center text-zinc-100 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C]"
            aria-label="Start new chat"
          >
            <Plus size={18} className="text-[#DC143C]" />
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
              type="button"
              onClick={onOpenShortcutsHelp}
              className="hidden md:flex w-9 h-9 rounded-full text-zinc-400 hover:text-white hover:bg-[#1B1B21] items-center justify-center transition-colors cursor-pointer"
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
            type="button"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full text-zinc-400 hover:text-white hover:bg-[#1B1B21] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </Tooltip>

        <LiquidGlassToggle size="sm" className="hidden sm:inline-flex" />

        <div className="ml-0.5">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

