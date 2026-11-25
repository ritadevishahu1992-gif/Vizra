import React, { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
  Check,
  ArrowUpRight,
  X,
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

const MOBILE_MODEL_OPTIONS: Array<{ id: OmniaModel; name: string; tag: string }> = [
  { id: 'omnia-1.0', name: 'Omnia 1.0', tag: 'Flagship' },
  { id: 'omnia-creative', name: 'Omnia Creative', tag: 'Generative' },
  { id: 'omnia-fast', name: 'Omnia Fast', tag: 'Low Latency' },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileTriggerRef.current &&
        !mobileTriggerRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const activeModelMeta =
    MOBILE_MODEL_OPTIONS.find((m) => m.id === currentModel) || MOBILE_MODEL_OPTIONS[0];

  const hasStudioTools = Boolean(
    onOpenCreateHub ||
      onOpenScienceHub ||
      onOpenKnowledgeBase ||
      onOpenMusicStudio ||
      onOpenLiveVoice ||
      onOpenEngageAdmin
  );

  const runMobileAction = (fn?: () => void) => {
    setMobileMenuOpen(false);
    fn?.();
  };

  return (
    <header
      className={`h-15 border-b backdrop-blur-md px-3 md:px-5 flex items-center justify-between gap-2 md:gap-3 z-30 shrink-0 select-none transition-colors w-full max-w-full ${
        isTemporaryChat
          ? 'border-[#DC143C]/40 bg-[#14090C]/95'
          : 'border-[#23232A] bg-[#0A0A0C]/90'
      }`}
    >
      {/* ===================================================================== */}
      {/* MOBILE HEADER (< 768px): Spacious, overflow-free, comfortable targets */}
      {/* ===================================================================== */}
      <div className="flex md:hidden items-center justify-between gap-2 w-full min-w-0">
        {/* Mobile Left: Sidebar Toggle + Clean Brand & Active Model/Temp Context */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-10 h-10 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/45 flex items-center justify-center text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C]"
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
            className="flex items-center gap-2 group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#DC143C] rounded-lg py-0.5 min-w-0"
            aria-label="Back to Vizra Home"
          >
            <VizraLogo size={22} className="shrink-0" />
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-display text-[15px] font-semibold tracking-tight text-white group-hover:opacity-90 transition-opacity truncate">
                Vizra
              </span>
              <span className="text-[10px] font-medium tracking-tight truncate flex items-center gap-1 text-zinc-400">
                {isTemporaryChat ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DC143C] shrink-0" />
                    <span className="text-rose-300 truncate">
                      Temp{temporaryRemainingLabel ? ` · ${temporaryRemainingLabel}` : ''}
                    </span>
                  </>
                ) : (
                  <span className="truncate">{activeModelMeta.name}</span>
                )}
              </span>
            </div>
          </Link>
        </div>

        {/* Mobile Right: Essential Actions (New Chat, Controls Menu, Account) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onNewChat}
            className="w-10 h-10 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/50 flex items-center justify-center text-zinc-100 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C]"
            aria-label="Start new chat"
            title="New Chat"
          >
            <Plus size={18} className="text-[#DC143C]" />
          </button>

          <div className="relative">
            <button
              ref={mobileTriggerRef}
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`relative w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C] ${
                mobileMenuOpen
                  ? 'bg-[#1B1B21] border-[#DC143C]/60 text-white'
                  : 'bg-[#141418] hover:bg-[#1B1B21] border-[#23232A] text-zinc-200 hover:text-white'
              }`}
              aria-haspopup="menu"
              aria-expanded={mobileMenuOpen}
              aria-label="Open workspace menu and controls"
              title="Workspace Controls"
            >
              {mobileMenuOpen ? <X size={17} /> : <MoreVertical size={17} />}
              {isTemporaryChat && !mobileMenuOpen && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC143C] ring-2 ring-[#141418]"
                  aria-hidden="true"
                />
              )}
            </button>

            {mobileMenuOpen && (
              <div
                ref={mobileMenuRef}
                role="menu"
                aria-label="Omnia workspace controls"
                className="fixed right-3 top-[64px] w-[min(19.5rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl bg-[#111114] border border-[#23232A] shadow-2xl p-3 z-50 text-white space-y-3"
              >
                {/* Section 1: Model Switcher */}
                <div className="space-y-1">
                  <div className="px-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Active Model
                  </div>
                  <div className="space-y-1">
                    {MOBILE_MODEL_OPTIONS.map((option) => {
                      const isActive = option.id === currentModel;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={isActive}
                          onClick={() => {
                            onSelectModel(option.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer touch-manipulation ${
                            isActive
                              ? 'bg-[#DC143C]/15 border border-[#DC143C]/40 text-white'
                              : 'bg-transparent hover:bg-white/[0.05] border border-transparent text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">{option.name}</span>
                            <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                              {option.tag}
                            </span>
                          </div>
                          {isActive && <Check size={14} className="text-[#DC143C] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Plans & Credits */}
                <div className="pt-2.5 border-t border-white/[0.07] space-y-2">
                  <Link
                    to="/pricing"
                    role="menuitem"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full h-10 px-3 rounded-xl bg-[#141418] hover:bg-[#DC143C]/15 border border-[#23232A] hover:border-[#DC143C]/50 flex items-center justify-between text-xs font-medium text-zinc-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#DC143C]" />
                      <span className="font-display font-semibold">Plans & Upgrade</span>
                    </span>
                    <ArrowUpRight size={14} className="text-zinc-400" />
                  </Link>
                  <CreditUsageIndicator variant="sidebar" />
                </div>

                {/* Section 3: Chat Controls & Preferences */}
                <div className="pt-2.5 border-t border-white/[0.07] space-y-1">
                  <div className="px-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Controls
                  </div>

                  {onToggleTemporaryChat && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => runMobileAction(onToggleTemporaryChat)}
                      className={`w-full h-10 px-2.5 rounded-xl flex items-center justify-between text-xs font-medium transition-colors cursor-pointer touch-manipulation ${
                        isTemporaryChat
                          ? 'bg-[#DC143C] text-white'
                          : 'hover:bg-white/[0.05] text-zinc-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <EyeOff size={14} className={isTemporaryChat ? 'text-white' : 'text-[#DC143C]'} />
                        <span>{isTemporaryChat ? 'Exit Temporary Chat' : 'Temporary Chat'}</span>
                      </span>
                      {isTemporaryChat && temporaryRemainingLabel && (
                        <span className="text-[10px] font-mono tabular-nums opacity-90">
                          {temporaryRemainingLabel}
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenCommandPalette && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => runMobileAction(onOpenCommandPalette)}
                      className="w-full h-10 px-2.5 rounded-xl hover:bg-white/[0.05] flex items-center justify-between text-xs font-medium text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                    >
                      <span className="flex items-center gap-2">
                        <Search size={14} className="text-zinc-400" />
                        <span>Command Palette</span>
                      </span>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-[#0A0A0C] border border-[#23232A] rounded">
                        {modKey}K
                      </kbd>
                    </button>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runMobileAction(onOpenSettings)}
                    className="w-full h-10 px-2.5 rounded-xl hover:bg-white/[0.05] flex items-center gap-2 text-xs font-medium text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                  >
                    <Settings size={14} className="text-zinc-400" />
                    <span>Preferences & Memory</span>
                  </button>

                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-xs text-zinc-300">Appearance</span>
                    <LiquidGlassToggle size="sm" />
                  </div>
                </div>

                {/* Section 4: Studio Tools */}
                {hasStudioTools && (
                  <div className="pt-2.5 border-t border-white/[0.07] space-y-1.5">
                    <div className="px-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Studio Tools
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {onOpenCreateHub && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => runMobileAction(onOpenCreateHub)}
                          className="h-9 px-2.5 rounded-xl bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] flex items-center gap-1.5 text-xs font-medium text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                        >
                          <Sparkles size={13} className="text-[#DC143C] shrink-0" />
                          <span className="truncate">Create Hub</span>
                        </button>
                      )}
                      {onOpenScienceHub && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => runMobileAction(onOpenScienceHub)}
                          className="h-9 px-2.5 rounded-xl bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] flex items-center gap-1.5 text-xs font-medium text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                        >
                          <Atom size={13} className="text-[#DC143C] shrink-0" />
                          <span className="truncate">Science</span>
                        </button>
                      )}
                      {onOpenKnowledgeBase && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => runMobileAction(onOpenKnowledgeBase)}
                          className="h-9 px-2.5 rounded-xl bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] flex items-center gap-1.5 text-xs font-medium text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                        >
                          <Database size={13} className="text-[#DC143C] shrink-0" />
                          <span className="truncate">Knowledge</span>
                        </button>
                      )}
                      {onOpenMusicStudio && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => runMobileAction(onOpenMusicStudio)}
                          className="h-9 px-2.5 rounded-xl bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] flex items-center gap-1.5 text-xs font-medium text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                        >
                          <Music size={13} className="text-[#DC143C] shrink-0" />
                          <span className="truncate">Music</span>
                        </button>
                      )}
                      {onOpenLiveVoice && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => runMobileAction(onOpenLiveVoice)}
                          className="h-9 px-2.5 rounded-xl bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] flex items-center gap-1.5 text-xs font-medium text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                        >
                          <Radio size={13} className="text-[#DC143C] shrink-0" />
                          <span className="truncate">Voice</span>
                        </button>
                      )}
                      {onOpenEngageAdmin && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => runMobileAction(onOpenEngageAdmin)}
                          className="h-9 px-2.5 rounded-xl bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] flex items-center gap-1.5 text-xs font-medium text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                        >
                          <BarChart3 size={13} className="text-[#DC143C] shrink-0" />
                          <span className="truncate">Engage</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <UserMenu />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TABLET & DESKTOP HEADER (>= 768px): Preserved 100% unchanged          */}
      {/* ===================================================================== */}
      <div className="hidden md:flex items-center justify-between gap-3 w-full min-w-0">
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

          <div className="h-4 w-px bg-[#23232A] shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
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
        <div className="flex items-center gap-2 shrink-0">
          <div>
            <CreditUsageIndicator variant="header" />
          </div>

          {/* Model Selector on Medium Screens */}
          <div className="block xl:hidden">
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
                className="flex w-9 h-9 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
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
                className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#141418] hover:bg-[#1B1B21] border border-[#23232A] hover:border-[#DC143C]/40 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
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
                className="flex w-9 h-9 rounded-full text-zinc-400 hover:text-white hover:bg-[#1B1B21] items-center justify-center transition-colors cursor-pointer"
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

          <LiquidGlassToggle size="sm" className="inline-flex" />

          <div className="ml-0.5">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};


