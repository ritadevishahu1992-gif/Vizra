import { useEffect } from 'react';

export interface ShortcutItem {
  id: string;
  name: string;
  description?: string;
  category: 'Navigation' | 'Modes' | 'Creation' | 'Chat';
  keys: string[]; // e.g. ['⌘', 'K'] or ['Ctrl', 'K']
  displayKeys: string; // e.g. '⌘K' or 'Ctrl+K'
  action: () => void;
  preventInInput?: boolean;
}

export const isMac =
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export const modKey = isMac ? '⌘' : 'Ctrl';

export const SHORTCUT_REGISTRY = [
  {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Search actions, modes, tools, and navigate the studio',
    category: 'Navigation' as const,
    display: `${modKey}+K`,
  },
  {
    id: 'shortcuts-help',
    name: 'Keyboard Shortcuts Help',
    description: 'View all keyboard shortcuts and navigation commands',
    category: 'Navigation' as const,
    display: `${modKey}+/ or ?`,
  },
  {
    id: 'new-chat',
    name: 'New Conversation',
    description: 'Start a fresh conversation thread with Omnia',
    category: 'Chat' as const,
    display: `${modKey}+N or ${modKey}+Shift+O`,
  },
  {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    description: 'Expand or collapse the conversation sidebar',
    category: 'Navigation' as const,
    display: `${modKey}+B`,
  },
  {
    id: 'focus-composer',
    name: 'Focus Message Composer',
    description: 'Immediately jump focus to the message textarea',
    category: 'Chat' as const,
    display: '/',
  },
  {
    id: 'close-modal',
    name: 'Close Active Overlay / Modal',
    description: 'Dismiss current dialog, drawer, or open tool',
    category: 'Navigation' as const,
    display: 'Esc',
  },
  {
    id: 'open-settings',
    name: 'Settings & Preferences',
    description: 'Open personal memory, model, and studio settings',
    category: 'Navigation' as const,
    display: `${modKey}+,`,
  },
  {
    id: 'open-science',
    name: 'Omnia Science Suite',
    description: 'Query AlphaFold 3D structures, PubChem, and PubMed',
    category: 'Creation' as const,
    display: `${modKey}+Shift+S`,
  },
  {
    id: 'open-music',
    name: 'AI Music & Audio Studio',
    description: 'Generate soundtracks, ambient audio, and jingles',
    category: 'Creation' as const,
    display: `${modKey}+Shift+M`,
  },
  {
    id: 'open-live-voice',
    name: 'Live Voice Conversation',
    description: 'Start low-latency audio dialogue with Omnia',
    category: 'Creation' as const,
    display: `${modKey}+Shift+L`,
  },
  {
    id: 'open-rag',
    name: 'RAG Knowledge Base',
    description: 'Inspect verified project sources and documents',
    category: 'Navigation' as const,
    display: `${modKey}+Shift+K`,
  },
  {
    id: 'open-create-hub',
    name: 'Omnia Create Hub',
    description: 'Explore 8 multimodal creative disciplines',
    category: 'Creation' as const,
    display: `${modKey}+Shift+C`,
  },
  {
    id: 'mode-quick',
    name: 'Switch to Quick Mode',
    description: 'Ultra-fast direct conversational responses',
    category: 'Modes' as const,
    display: `${modKey}+1`,
  },
  {
    id: 'mode-think',
    name: 'Switch to Think Mode',
    description: 'Deep chain-of-thought analysis & reasoning',
    category: 'Modes' as const,
    display: `${modKey}+2`,
  },
  {
    id: 'mode-research',
    name: 'Switch to Research Mode',
    description: 'Live web grounding with verified citations',
    category: 'Modes' as const,
    display: `${modKey}+3`,
  },
  {
    id: 'mode-science',
    name: 'Switch to Science Mode',
    description: 'Biomedical, structural, and scientific intelligence',
    category: 'Modes' as const,
    display: `${modKey}+4`,
  },
  {
    id: 'mode-create',
    name: 'Switch to Create Mode',
    description: 'Multimodal content generation & storytelling',
    category: 'Modes' as const,
    display: `${modKey}+5`,
  },
  {
    id: 'mode-code',
    name: 'Switch to Code Mode',
    description: 'Software architecture, refactoring & scripts',
    category: 'Modes' as const,
    display: `${modKey}+6`,
  },
  {
    id: 'mode-analyze',
    name: 'Switch to Analyze Mode',
    description: 'Data evaluation, comparisons & structured metrics',
    category: 'Modes' as const,
    display: `${modKey}+7`,
  },
];

interface UseKeyboardShortcutsOptions {
  onOpenCommandPalette: () => void;
  onOpenShortcutsHelp: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onCloseTopOverlay: () => boolean; // returns true if an overlay was closed
  onOpenSettings: () => void;
  onOpenScienceHub: () => void;
  onOpenMusicStudio: () => void;
  onOpenLiveVoice: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenCreateHub: () => void;
  onFocusComposer: () => void;
  onSelectMode?: (modeIndex: number) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onOpenCommandPalette,
  onOpenShortcutsHelp,
  onNewChat,
  onToggleSidebar,
  onCloseTopOverlay,
  onOpenSettings,
  onOpenScienceHub,
  onOpenMusicStudio,
  onOpenLiveVoice,
  onOpenKnowledgeBase,
  onOpenCreateHub,
  onFocusComposer,
  onSelectMode,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifier = isMac ? event.metaKey : event.ctrlKey;
      const target = event.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const key = event.key.toLowerCase();

      // 1. ESCAPE: Always handled, regardless of input focus (closes modals or blurs)
      if (event.key === 'Escape') {
        const closed = onCloseTopOverlay();
        if (!closed && isInput && target) {
          target.blur();
        }
        return;
      }

      // 2. CMD+K / Ctrl+K: Command Palette
      if (isModifier && key === 'k' && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        onOpenCommandPalette();
        return;
      }

      // 3. CMD+/ or Ctrl+/: Shortcuts help
      if (isModifier && (event.key === '/' || event.key === '?')) {
        event.preventDefault();
        event.stopPropagation();
        onOpenShortcutsHelp();
        return;
      }

      // 4. CMD+B / Ctrl+B: Toggle Sidebar
      if (isModifier && key === 'b') {
        event.preventDefault();
        event.stopPropagation();
        onToggleSidebar();
        return;
      }

      // 5. CMD+N / Ctrl+N or CMD+Shift+O: New Chat
      if ((isModifier && key === 'n') || (isModifier && event.shiftKey && key === 'o')) {
        event.preventDefault();
        event.stopPropagation();
        onNewChat();
        return;
      }

      // 6. CMD+, / Ctrl+,: Open Settings
      if (isModifier && (key === ',' || event.key === '<')) {
        event.preventDefault();
        event.stopPropagation();
        onOpenSettings();
        return;
      }

      // 7. Mod+Shift combinations for Studio Hubs
      if (isModifier && event.shiftKey) {
        if (key === 's') {
          event.preventDefault();
          onOpenScienceHub();
          return;
        }
        if (key === 'm') {
          event.preventDefault();
          onOpenMusicStudio();
          return;
        }
        if (key === 'l') {
          event.preventDefault();
          onOpenLiveVoice();
          return;
        }
        if (key === 'k') {
          event.preventDefault();
          onOpenKnowledgeBase();
          return;
        }
        if (key === 'c') {
          event.preventDefault();
          onOpenCreateHub();
          return;
        }
      }

      // 8. Prevent browser default Save dialog if CMD+S is pressed without Shift, redirect to Science Suite or do nothing
      if (isModifier && key === 's' && !event.shiftKey) {
        event.preventDefault();
        onOpenScienceHub();
        return;
      }

      // 9. Mod + 1..7 for Mode switching
      if (isModifier && !event.shiftKey && onSelectMode) {
        const num = parseInt(event.key, 10);
        if (!isNaN(num) && num >= 1 && num <= 7) {
          event.preventDefault();
          onSelectMode(num);
          return;
        }
      }

      // 10. Single key triggers (ONLY when NOT typing in an input/textarea)
      if (!isInput && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (event.key === '/') {
          event.preventDefault();
          onFocusComposer();
          return;
        }
        if (event.key === '?') {
          event.preventDefault();
          onOpenShortcutsHelp();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    enabled,
    onOpenCommandPalette,
    onOpenShortcutsHelp,
    onNewChat,
    onToggleSidebar,
    onCloseTopOverlay,
    onOpenSettings,
    onOpenScienceHub,
    onOpenMusicStudio,
    onOpenLiveVoice,
    onOpenKnowledgeBase,
    onOpenCreateHub,
    onFocusComposer,
    onSelectMode,
  ]);
}
