import React, { useState, useRef, useEffect } from 'react';
import { AIHeader } from '../components/ai/AIHeader';
import { AISidebar } from '../components/ai/AISidebar';
import { EmptyState } from '../components/ai/EmptyState';
import { ChatMessage } from '../components/ai/ChatMessage';
import { MessageListSkeleton } from '../components/ai/MessageListSkeleton';
import { PromptComposer } from '../components/ai/PromptComposer';
import { SettingsModal, SettingsModalTab } from '../components/ai/SettingsModal';
import { DemoBanner } from '../components/ai/DemoBanner';
import { ProjectWorkspace } from '../components/ai/ProjectWorkspace';
import { CreationToolsModal } from '../components/ai/CreationToolsModal';
import { IntegrationPermissionModal } from '../components/ai/IntegrationPermissionModal';
import { CreateHubModal, CreateHubCategory } from '../components/ai/CreateHubModal';
import { RAGKnowledgeExplorer } from '../components/ai/RAGKnowledgeExplorer';
import { CitationDrawer } from '../components/ai/CitationDrawer';
import { MusicStudioModal } from '../components/ai/MusicStudioModal';
import { VoiceLiveModal } from '../components/ai/VoiceLiveModal';
import { ScienceHubModal } from '../components/ai/ScienceHubModal';
import { CommandPaletteModal } from '../components/ai/CommandPaletteModal';
import { ShortcutsModal } from '../components/ai/ShortcutsModal';
import { EngageAdminModal } from '../components/ai/engage/EngageAdminModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { CitationItem } from '../types/rag';
import { ExternalLink, EyeOff, Trash2 } from 'lucide-react';
import {
  resolveRouteSeoPayload,
  applySeoToDocument,
} from '../seo/routeMetadata';
import { sendMessage } from '../services/aiService';
import { logSafeInteractionEvent } from '../services/engageEventLogger';
import { recordAICreditUsage } from '../components/ui/CreditUsageIndicator';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { classifyApiError } from '../utils/apiErrorHandler';
import {
  getUserProjectsFromFirestore,
  saveUserProjectToFirestore,
  saveChatMessageToFirestore,
} from '../services/firestoreService';
import {
  getAllProjects,
  createProjectFromPrompt,
} from '../services/projectService';
import { createInitialConversations } from '../services/conversationSeeds';
import { updateIntegrationStatus } from '../services/integrationService';
import {
  Message,
  Conversation,
  OmniaModel,
  Attachment,
  AIMode,
  Project,
  Integration,
  SmartSuggestion,
  ProjectWorkflowStage,
  TemporaryChatSession,
} from '../types/ai';

export const AIPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>(() => createInitialConversations());
  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv-1');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Temporary Chat State Machine (memory-only; never written to localStorage or Firestore)
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [tempSession, setTempSession] = useState<TemporaryChatSession | null>(null);
  const [tempTtlMinutes, setTempTtlMinutes] = useState<number>(30);
  const [tempInstructions, setTempInstructions] = useState<string>('');
  const [tempRemainingLabel, setTempRemainingLabel] = useState<string>('');

  const [currentModel, setCurrentModel] = useState<OmniaModel>('omnia-1.0');
  const [currentMode, setCurrentMode] = useState<AIMode>('quick');
  const [isSidebarOpenDesktop, setIsSidebarOpenDesktop] = useState(true);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsModalTab>('general');
  const [isCreationToolsOpen, setIsCreationToolsOpen] = useState(false);
  const [isCreateHubOpen, setIsCreateHubOpen] = useState(false);
  const [connectingIntegration, setConnectingIntegration] = useState<Integration | null>(null);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isMusicStudioOpen, setIsMusicStudioOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isScienceHubOpen, setIsScienceHubOpen] = useState(false);
  const [isCitationDrawerOpen, setIsCitationDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isEngageAdminOpen, setIsEngageAdminOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitialMessagesLoading, setIsInitialMessagesLoading] = useState(true);
  const [initialComposerPrompt, setInitialComposerPrompt] = useState<string | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hydrationTimerRef = useRef<number | null>(null);

  const openSettingsTab = (tab: SettingsModalTab = 'general') => {
    setSettingsInitialTab(tab);
    setIsSettingsOpen(true);
  };

  // Temporary Chat Auto-Wipe Countdown Timer & Unmount Cleanup
  useEffect(() => {
    if (!isTemporaryChat || !tempSession) {
      setTempRemainingLabel('');
      return;
    }

    const updateTimer = () => {
      const remainingMs = tempSession.expiresAt - Date.now();
      if (remainingMs <= 0) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setTempSession(null);
        setIsTemporaryChat(false);
        setTempInstructions('');
        setTempRemainingLabel('');
        toast({
          title: 'Temporary Chat expired & wiped',
          description: 'All ephemeral messages were cleared from browser memory.',
          type: 'info',
        });
        return;
      }
      const totalSeconds = Math.ceil(remainingMs / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setTempRemainingLabel(`${mins}:${String(secs).padStart(2, '0')}`);
    };

    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(intervalId);
  }, [isTemporaryChat, tempSession, toast]);

  // Ensure ephemeral state is discarded on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleToggleTemporaryChat = () => {
    if (isStreaming || abortControllerRef.current) {
      cancelInFlightStreamingMessages();
    }
    if (isTemporaryChat) {
      setTempSession(null);
      setIsTemporaryChat(false);
      setTempInstructions('');
      setTempRemainingLabel('');
      toast({
        title: 'Exited Temporary Chat',
        description: 'Ephemeral session messages were cleared from memory.',
        type: 'info',
      });
    } else {
      const now = Date.now();
      const ttl = tempTtlMinutes || 30;
      setActiveProjectId(null);
      setTempSession({
        id: `temp-${now}`,
        createdAt: now,
        expiresAt: now + ttl * 60 * 1000,
        ttlMinutes: ttl,
        sessionInstructions: tempInstructions,
        messages: [],
      });
      setIsTemporaryChat(true);
      toast({
        title: 'Temporary Chat enabled',
        description: `Not saved to VIZRA history or memory. Auto-wipes in ${ttl} min.`,
        type: 'info',
      });
    }
  };

  const handleChangeTemporaryTtl = (minutes: number) => {
    setTempTtlMinutes(minutes);
    setTempSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ttlMinutes: minutes,
        expiresAt: Date.now() + minutes * 60 * 1000,
      };
    });
  };

  const handleChangeTemporaryInstructions = (value: string) => {
    setTempInstructions(value);
    setTempSession((prev) => (prev ? { ...prev, sessionInstructions: value } : prev));
  };

  // Global Keyboard Shortcuts Handlers
  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpenMobile((prev) => !prev);
    } else {
      setIsSidebarOpenDesktop((prev) => !prev);
    }
  };

  const handleFocusComposer = () => {
    const textarea = document.getElementById('omnia-prompt-textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
    }
  };

  const handleCloseTopOverlay = (): boolean => {
    if (isCommandPaletteOpen) {
      setIsCommandPaletteOpen(false);
      return true;
    }
    if (isShortcutsHelpOpen) {
      setIsShortcutsHelpOpen(false);
      return true;
    }
    if (isCitationDrawerOpen) {
      setIsCitationDrawerOpen(false);
      return true;
    }
    if (isScienceHubOpen) {
      setIsScienceHubOpen(false);
      return true;
    }
    if (isMusicStudioOpen) {
      setIsMusicStudioOpen(false);
      return true;
    }
    if (isLiveVoiceOpen) {
      setIsLiveVoiceOpen(false);
      return true;
    }
    if (isCreateHubOpen) {
      setIsCreateHubOpen(false);
      return true;
    }
    if (isCreationToolsOpen) {
      setIsCreationToolsOpen(false);
      return true;
    }
    if (isKnowledgeBaseOpen) {
      setIsKnowledgeBaseOpen(false);
      return true;
    }
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return true;
    }
    if (connectingIntegration) {
      setConnectingIntegration(null);
      return true;
    }
    if (isSidebarOpenMobile) {
      setIsSidebarOpenMobile(false);
      return true;
    }
    if (activeProjectId) {
      setActiveProjectId(null);
      return true;
    }
    return false;
  };

  const handleSelectModeByIndex = (index: number) => {
    const modes: AIMode[] = ['quick', 'think', 'research', 'science', 'create', 'code', 'analyze'];
    if (index >= 1 && index <= modes.length) {
      setCurrentMode(modes[index - 1]);
    }
  };

  useEffect(() => {
    applySeoToDocument(resolveRouteSeoPayload('/ai'));
  }, []);

  const handleExportConversation = () => {
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv || conv.messages.length === 0) return;

    const transcript = conv.messages
      .map((m) => `### ${m.role === 'user' ? 'User' : 'Omnia'} (${m.timestamp})\n\n${m.content}\n\n`)
      .join('---\n\n');

    const blob = new Blob([`# ${conv.title}\n\n${transcript}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'chat-transcript'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Register Global Keyboard Shortcuts Manager
  useKeyboardShortcuts({
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onOpenShortcutsHelp: () => setIsShortcutsHelpOpen(true),
    onNewChat: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
      // Clean chat reset and mark any in-flight message as cancelled
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        group: 'today',
      };
      setConversations((prev) => [
        newConv,
        ...prev.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.status === 'streaming'
              ? {
                  ...m,
                  status: 'cancelled' as const,
                  content: m.content || 'Synthesis cancelled by user.',
                }
              : m
          ),
        })),
      ]);
      setActiveConversationId(newConv.id);
      setActiveProjectId(null);
    },
    onToggleSidebar: handleToggleSidebar,
    onCloseTopOverlay: handleCloseTopOverlay,
    onOpenSettings: () => setIsSettingsOpen(true),
    onOpenScienceHub: () => setIsScienceHubOpen(true),
    onOpenMusicStudio: () => setIsMusicStudioOpen(true),
    onOpenLiveVoice: () => setIsLiveVoiceOpen(true),
    onOpenKnowledgeBase: () => setIsKnowledgeBaseOpen(true),
    onOpenCreateHub: () => setIsCreateHubOpen(true),
    onFocusComposer: handleFocusComposer,
    onSelectMode: handleSelectModeByIndex,
  });

  // Check for initial prompt passed via explore/homepage, open requested conversation from History page, and load stored conversations
  useEffect(() => {
    let availableConversations = createInitialConversations();
    try {
      const stored = localStorage.getItem('omnia_conversations_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          availableConversations = parsed;
          setConversations(parsed);
        }
      }
    } catch {
      // ignore
    }

    const requestedConvId = sessionStorage.getItem('omnia_open_conversation_id');
    if (requestedConvId) {
      sessionStorage.removeItem('omnia_open_conversation_id');
      if (availableConversations.some((c) => c.id === requestedConvId)) {
        setActiveConversationId(requestedConvId);
      } else {
        const defaultSeeds = createInitialConversations();
        const seedMatch = defaultSeeds.find((c) => c.id === requestedConvId);
        if (seedMatch) {
          setConversations((prev) => [seedMatch, ...prev]);
          setActiveConversationId(seedMatch.id);
        } else if (availableConversations.length > 0) {
          setActiveConversationId(availableConversations[0].id);
        }
      }
    }

    const savedPrompt = sessionStorage.getItem('vizra_initial_prompt');
    if (savedPrompt) {
      sessionStorage.removeItem('vizra_initial_prompt');
      setInitialComposerPrompt(savedPrompt);
    }

    hydrationTimerRef.current = window.setTimeout(() => {
      setIsInitialMessagesLoading(false);
      hydrationTimerRef.current = null;
    }, 280);

    return () => {
      if (hydrationTimerRef.current !== null) {
        window.clearTimeout(hydrationTimerRef.current);
        hydrationTimerRef.current = null;
      }
    };
  }, []);

  // Save conversations to localStorage whenever updated
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem('omnia_conversations_v1', JSON.stringify(conversations));
      } catch {
        // ignore
      }
    }
  }, [conversations]);

  // Load stored projects on mount and sync with Firestore if authenticated
  useEffect(() => {
    const loadedProjects = getAllProjects();
    setProjects(loadedProjects);

    if (user?.uid) {
      getUserProjectsFromFirestore(user.uid)
        .then((remoteProjects) => {
          if (remoteProjects && remoteProjects.length > 0) {
            setProjects((prev) => {
              const combined = [...remoteProjects];
              for (const local of prev) {
                if (!combined.some((p) => p.id === local.id)) {
                  combined.push(local);
                }
              }
              return combined;
            });
          }
        })
        .catch((err) => console.warn('Could not sync remote projects:', err));
    }
  }, [user?.uid]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = isTemporaryChat
    ? tempSession?.messages || []
    : activeConversation
    ? activeConversation.messages
    : [];
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!activeProjectId) {
      scrollToBottom();
    }
  }, [messages, isStreaming, activeProjectId]);

  const cancelInFlightStreamingMessages = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    if (isTemporaryChat) {
      setTempSession((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) =>
                m.status === 'streaming'
                  ? {
                      ...m,
                      status: 'cancelled',
                      content: m.content || 'Synthesis cancelled by user.',
                    }
                  : m
              ),
            }
          : prev
      );
      return;
    }
    setConversations((prev) =>
      prev.map((conv) => ({
        ...conv,
        messages: conv.messages.map((m) =>
          m.status === 'streaming'
            ? {
                ...m,
                status: 'cancelled',
                content: m.content || 'Synthesis cancelled by user.',
              }
            : m
        ),
      }))
    );
  };

  const handleNewChat = () => {
    if (isStreaming || abortControllerRef.current) {
      cancelInFlightStreamingMessages();
    }
    if (isTemporaryChat) {
      const now = Date.now();
      setTempSession({
        id: `temp-${now}`,
        createdAt: now,
        expiresAt: now + tempTtlMinutes * 60 * 1000,
        ttlMinutes: tempTtlMinutes,
        sessionInstructions: tempInstructions,
        messages: [],
      });
      return;
    }
    setActiveProjectId(null);
    setActiveConversationId(null);
  };

  const handleSelectConversation = (id: string) => {
    if ((isStreaming || abortControllerRef.current) && id !== activeConversationId) {
      cancelInFlightStreamingMessages();
    }
    if (isTemporaryChat) {
      setTempSession(null);
      setIsTemporaryChat(false);
      setTempInstructions('');
      setTempRemainingLabel('');
    }
    setActiveProjectId(null);
    setActiveConversationId(id);
  };

  const handleSelectProject = (id: string) => {
    if (isStreaming || abortControllerRef.current) {
      cancelInFlightStreamingMessages();
    }
    if (isTemporaryChat) {
      setTempSession(null);
      setIsTemporaryChat(false);
    }
    setActiveProjectId(id);
  };

  const handleCreateProject = (draft?: { title: string; category?: Project['category']; description: string }) => {
    const title = draft?.title || 'Singularity Production Brief';
    const desc = draft?.description || 'Multimodal creative project generated with Omnia 1.0.';
    const cat = draft?.category || 'video';

    const newProject = createProjectFromPrompt(title, desc, cat);
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);

    if (user?.uid) {
      saveUserProjectToFirestore(user.uid, newProject).catch((err) =>
        console.warn('Failed to save project to Firestore:', err)
      );
    }
  };

  const handleProjectUpdated = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (user?.uid) {
      saveUserProjectToFirestore(user.uid, updated).catch((err) =>
        console.warn('Failed to update project in Firestore:', err)
      );
    }
  };

  const handleRefineStageInChat = (stage: ProjectWorkflowStage) => {
    setActiveProjectId(null);
    setInitialComposerPrompt(`Refine and optimize Stage "${stage.title}" with deeper creative notes: ${stage.description}`);
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleArchiveConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  const handleClearAllHistory = () => {
    setConversations([]);
    setActiveConversationId(null);
  };

  const handleConfirmConnectIntegration = (integrationId: string) => {
    updateIntegrationStatus(integrationId, 'connected');
  };

  const handleCreateImage = (
    prompt: string,
    aspectRatio: '16:9' | '1:1' | '9:16' = '16:9'
  ) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const nowTs = Date.now();
    const formattedTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: Message = {
      id: `user-img-${nowTs}`,
      role: 'user',
      content: `Create Image (${aspectRatio}): ${trimmed}`,
      timestamp: formattedTime,
      status: 'done',
    };

    const assistantMsg: Message = {
      id: `asst-img-${nowTs + 1}`,
      role: 'assistant',
      content: `Generated procedural visual concept for **"${trimmed}"** (${aspectRatio}). Use the card controls below to download the PNG or copy the prompt.`,
      timestamp: formattedTime,
      status: 'done',
      mode: 'create',
      generatedImage: {
        prompt: trimmed,
        aspectRatio,
        modelName: 'Omnia Visual Studio · Procedural Render',
      },
    };

    if (isTemporaryChat) {
      setTempSession((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, userMsg, assistantMsg] }
          : prev
      );
      toast({
        title: 'Temporary image concept rendered',
        description: 'Stored in memory only until session wipe.',
        type: 'success',
      });
      return;
    }

    let targetId = activeConversationId;
    if (!targetId) {
      targetId = `conv-${nowTs}`;
      const newConv: Conversation = {
        id: targetId,
        title: trimmed.slice(0, 32),
        createdAt: nowTs,
        updatedAt: nowTs,
        group: 'today',
        messages: [userMsg, assistantMsg],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(targetId);
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? { ...c, updatedAt: nowTs, messages: [...c.messages, userMsg, assistantMsg] }
            : c
        )
      );
    }

    toast({
      title: 'Image concept rendered',
      description: 'You can download the PNG or copy the prompt directly from the card.',
      type: 'success',
    });
  };

  const handleSendMessage = async (
    text: string,
    attachments: Attachment[] = [],
    overrideBaseMessages?: Message[]
  ) => {
    if (!text.trim() && attachments.length === 0) return;

    const inTempMode = isTemporaryChat;
    let targetConvId = activeConversationId;
    let currentMessages: Message[] = [];

    if (inTempMode) {
      currentMessages =
        overrideBaseMessages !== undefined
          ? [...overrideBaseMessages]
          : tempSession
          ? [...tempSession.messages]
          : [];
    } else if (!targetConvId) {
      const newId = `conv-${Date.now()}`;
      const title = text.slice(0, 32).trim() || 'New Creation';
      const newConv: Conversation = {
        id: newId,
        title: title.charAt(0).toUpperCase() + title.slice(1),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        group: 'today',
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      targetConvId = newId;
      setActiveConversationId(newId);
    } else {
      currentMessages =
        overrideBaseMessages !== undefined
          ? [...overrideBaseMessages]
          : activeConversation
          ? [...activeConversation.messages]
          : [];
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments,
      status: 'done',
    };

    const assistantPlaceholderId = `asst-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'streaming',
      isDemo: true,
      mode: currentMode,
    };

    const updateTargetMessages = (updater: (msgs: Message[]) => Message[]) => {
      if (inTempMode) {
        setTempSession((prev) => (prev ? { ...prev, messages: updater(prev.messages) } : prev));
      } else {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === targetConvId
              ? { ...conv, updatedAt: Date.now(), messages: updater(conv.messages) }
              : conv
          )
        );
      }
    };

    // Append user message and streaming placeholder
    updateTargetMessages((prevMsgs) => {
      const prefixMessages = overrideBaseMessages !== undefined ? overrideBaseMessages : prevMsgs;
      return [...prefixMessages, userMessage, assistantMessage];
    });

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const turnStartedAt = Date.now();

    if (!inTempMode) {
      logSafeInteractionEvent('chat_initiated', {
        mode: currentMode,
        model: currentModel,
        hasAttachments: attachments.length > 0,
      });
    }
    recordAICreditUsage(1);

    try {
      const result = await sendMessage({
        prompt: text,
        conversationHistory: currentMessages,
        attachments,
        model: currentModel,
        mode: currentMode,
        activeProject: inTempMode ? null : activeProject,
        temporarySession: inTempMode,
        sessionInstructions: inTempMode ? tempInstructions : undefined,
        signal: abortController.signal,
        onChunk: (chunkText) => {
          updateTargetMessages((msgs) =>
            msgs.map((m) =>
              m.id === assistantPlaceholderId
                ? { ...m, content: chunkText, status: 'streaming' }
                : m
            )
          );
        },
      });

      // Mark streaming completed with enriched metadata
      updateTargetMessages((msgs) =>
        msgs.map((m) =>
          m.id === assistantPlaceholderId
            ? {
                ...m,
                status: 'done',
                content: m.content || result.fullText,
                thoughtProcess: result.thoughtProcess,
                sources: result.sources,
                webSearchQueries: result.webSearchQueries,
                sourceValidationGate: result.sourceValidationGate,
                suggestions: result.suggestions,
                canCreateProject: inTempMode ? false : result.canCreateProject,
                projectDraft: inTempMode ? undefined : result.projectDraft,
                actionTrigger: result.actionTrigger,
                actionPayload: result.actionPayload,
                grounding: result.grounding,
                citations: result.citations,
                reasoning_trace_id: inTempMode ? undefined : result.reasoning_trace_id,
                knowledge_state: result.knowledge_state,
                conflicts: result.conflicts,
                generatedImage: result.generatedImage,
              }
            : m
        )
      );

      if (!inTempMode) {
        logSafeInteractionEvent('chat_completed', {
          mode: currentMode,
          model: currentModel,
          durationMs: Date.now() - turnStartedAt,
        });

        // If user is authenticated, persist conversation messages to Firestore (NEVER in Temporary Chat)
        if (user?.uid && targetConvId) {
          saveChatMessageToFirestore(user.uid, targetConvId, {
            id: userMessage.id,
            role: 'user',
            content: userMessage.content,
          }).catch((err) => console.warn('Could not save user message to Firestore:', err));

          saveChatMessageToFirestore(user.uid, targetConvId, {
            id: assistantPlaceholderId,
            role: 'assistant',
            content: result.fullText,
          }).catch((err) => console.warn('Could not save assistant message to Firestore:', err));
        }
      }

      // Handle immediate workflow execution triggered by user intent
      if (!inTempMode && result.actionTrigger === 'create_project' && result.projectDraft) {
        setTimeout(() => {
          handleCreateProject(result.projectDraft);
        }, 500);
      } else if (result.actionTrigger === 'open_creation_tools') {
        setTimeout(() => {
          setIsCreationToolsOpen(true);
        }, 400);
      } else if (result.actionTrigger === 'connect_integration') {
        setTimeout(() => {
          setConnectingIntegration({
            id: result.actionPayload?.id || 'google_drive',
            name: result.actionPayload?.name || 'Google Drive',
            category: 'productivity',
            icon: 'FileText',
            description: 'Cloud document storage and project assets synchronization.',
            status: 'connect',
          });
        }, 400);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || abortController.signal.aborted) {
        updateTargetMessages((msgs) =>
          msgs.map((m) =>
            m.id === assistantPlaceholderId && m.status === 'streaming'
              ? {
                  ...m,
                  status: 'cancelled',
                  content: m.content || 'Synthesis cancelled by user.',
                }
              : m
          )
        );
      } else {
        const normalizedErr = classifyApiError(undefined, undefined, err?.message, err);
        if (!inTempMode) {
          logSafeInteractionEvent('chat_failed', {
            mode: currentMode,
            model: currentModel,
            durationMs: Date.now() - turnStartedAt,
            reason: normalizedErr.category,
          });
        }
        updateTargetMessages((msgs) =>
          msgs.map((m) =>
            m.id === assistantPlaceholderId
              ? {
                  ...m,
                  content: normalizedErr.userMessage,
                  status: 'error',
                  errorCategory: normalizedErr.category,
                }
              : m
          )
        );
        toast({
          title: 'Request interrupted',
          description: normalizedErr.userMessage,
          type: 'error',
        });
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleStopStreaming = () => {
    logSafeInteractionEvent('chat_cancelled', {
      mode: currentMode,
      model: currentModel,
    });
    cancelInFlightStreamingMessages();
  };

  const handleSelectSuggestion = (suggestion: SmartSuggestion) => {
    if (suggestion.promptValue) {
      setInitialComposerPrompt(suggestion.promptValue);
    }
  };

  const handleSelectEmptyPrompt = (promptText: string, mode?: AIMode) => {
    if (mode) {
      setCurrentMode(mode);
    }
    setInitialComposerPrompt(promptText);
  };

  const handleRegenerateLast = () => {
    if (messages.length < 2 || isStreaming) return;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content, lastUserMessage.attachments);
    }
  };

  const handleEditUserMessage = (messageId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed || isStreaming) return;
    const sourceMessages = isTemporaryChat
      ? tempSession?.messages || []
      : activeConversation?.messages || [];
    const targetIdx = sourceMessages.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) {
      handleSendMessage(trimmed);
      return;
    }
    const preservedPrefix = sourceMessages.slice(0, targetIdx);
    const originalAttachments = sourceMessages[targetIdx]?.attachments || [];
    handleSendMessage(trimmed, originalAttachments, preservedPrefix);
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden font-inter selection:bg-[#eb3b2d] selection:text-white">
      {/* Demo Transparent Notification Bar */}
      <DemoBanner onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Top Header */}
      <AIHeader
        currentModel={currentModel}
        onSelectModel={setCurrentModel}
        onNewChat={handleNewChat}
        onToggleSidebar={handleToggleSidebar}
        onOpenSettings={() => openSettingsTab('general')}
        isTemporaryChat={isTemporaryChat}
        temporaryRemainingLabel={tempRemainingLabel}
        onToggleTemporaryChat={handleToggleTemporaryChat}
        onOpenCreateHub={() => setIsCreateHubOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenMusicStudio={() => setIsMusicStudioOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenScienceHub={() => setIsScienceHubOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
        onOpenEngageAdmin={() => setIsEngageAdminOpen(true)}
      />

      {/* Main Workspace: Left Sidebar + Workspace / Chat Column */}
      <div className="flex-1 flex h-[calc(100vh-5.5rem)] overflow-hidden">
        {/* Left Sidebar */}
        <AISidebar
          conversations={conversations}
          activeId={isTemporaryChat ? null : activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onArchiveConversation={handleArchiveConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          isOpenDesktop={isSidebarOpenDesktop}
          onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
          onOpenPlugins={() => openSettingsTab('integrations')}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onNewProject={() => handleCreateProject()}
        />

        {/* Center Workspace Column */}
        <main className="flex-1 flex min-w-0 overflow-hidden">
          {activeProjectId && activeProject ? (
            /* Project Workspace View */
            <ProjectWorkspace
              project={activeProject}
              onBackToChat={() => setActiveProjectId(null)}
              onProjectUpdated={handleProjectUpdated}
              onRefineWithOmnia={handleRefineStageInChat}
            />
          ) : (
            /* Main Omnia Chat Thread */
            <div className="flex-1 flex flex-col justify-between bg-black relative overflow-hidden">
              {/* Temporary Chat Active Banner */}
              {isTemporaryChat && (
                <div className="px-4 py-2 bg-[#eb3b2d]/10 border-b border-[#eb3b2d]/30 text-xs flex items-center justify-between gap-3 z-10 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <EyeOff size={13} className="text-[#eb3b2d] shrink-0" />
                    <span className="font-semibold text-white shrink-0">Temporary Chat</span>
                    <span className="text-neutral-300 truncate hidden sm:inline">
                      Not saved to VIZRA history or personal memory · Auto-wipes in {tempRemainingLabel || `${tempTtlMinutes}m`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleTemporaryChat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-[11px] font-medium text-neutral-200 hover:text-white transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Wipe &amp; Exit</span>
                  </button>
                </div>
              )}

              {/* Active Project Context Banner if project is loaded in background */}
              {!isTemporaryChat && activeProject && (
                <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-800 text-xs flex items-center justify-between z-10 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
                    <span className="text-neutral-400">Project Context:</span>
                    <span className="font-semibold text-white">{activeProject.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {activeProject.stages.length} Stages
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveProjectId(activeProject.id)}
                    className="text-[11px] font-medium text-[#eb3b2d] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Open Workspace</span>
                    <ExternalLink size={11} />
                  </button>
                </div>
              )}

              {/* Scrollable Conversation Container */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col px-4 md:px-8 pt-4">
                {isInitialMessagesLoading ? (
                  <MessageListSkeleton turns={2} mode={currentMode} />
                ) : messages.length === 0 ? (
                <EmptyState
                  onSelectPrompt={handleSelectEmptyPrompt}
                  activeMode={currentMode}
                  onSelectMode={setCurrentMode}
                  isTemporaryChat={isTemporaryChat}
                  temporaryTtlMinutes={tempTtlMinutes}
                  onChangeTemporaryTtl={handleChangeTemporaryTtl}
                  temporaryInstructions={tempInstructions}
                  onChangeTemporaryInstructions={handleChangeTemporaryInstructions}
                />
              ) : (
                <div className="w-full max-w-3xl mx-auto py-4 space-y-4">
                  <h1 className="sr-only">
                    Omnia 1.0 AI Creative Workspace — {isTemporaryChat ? 'Temporary Chat' : activeConversation?.title || 'Active Session'}
                  </h1>
                  {messages.map((msg, index) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isTemporary={isTemporaryChat}
                      onRegenerate={
                        index === messages.length - 1 && msg.role === 'assistant'
                          ? handleRegenerateLast
                          : undefined
                      }
                      onSelectSuggestion={handleSelectSuggestion}
                      onCreateProject={isTemporaryChat ? undefined : handleCreateProject}
                      onEditUserMessage={handleEditUserMessage}
                      onOpenCitation={(cit) => {
                        setActiveCitation(cit);
                        setIsCitationDrawerOpen(true);
                      }}
                    />
                  ))}
                  {isStreaming &&
                    messages.length > 0 &&
                    messages[messages.length - 1].role === 'user' && (
                      <MessageListSkeleton
                        variant="awaiting-response"
                        mode={currentMode}
                      />
                    )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Sticky Bottom Prompt Composer */}
            <div className="shrink-0 pt-2 bg-gradient-to-t from-black via-black/95 to-transparent">
              <PromptComposer
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
                onStopStreaming={handleStopStreaming}
                currentMode={currentMode}
                onSelectMode={setCurrentMode}
                initialPrompt={initialComposerPrompt}
                onClearInitialPrompt={() => setInitialComposerPrompt(undefined)}
                onOpenCreationTools={() => setIsCreationToolsOpen(true)}
                onCreateImage={handleCreateImage}
                onRequestConnectIntegration={(item) => setConnectingIntegration(item)}
                onOpenMusicStudio={() => setIsMusicStudioOpen(true)}
                onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
                onOpenScienceHub={() => setIsScienceHubOpen(true)}
                onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
                isTemporaryChat={isTemporaryChat}
              />
            </div>
          </div>
        )}
        </main>
      </div>

      {/* AI Music Studio Modal (Lyria 3) */}
      <MusicStudioModal
        isOpen={isMusicStudioOpen}
        onClose={() => setIsMusicStudioOpen(false)}
        initialPrompt={initialComposerPrompt}
        onInsertToChat={(trackSummary) => {
          handleSendMessage(trackSummary);
        }}
      />

      {/* Real-time Voice Conversation Modal (gemini-3.8-live) */}
      <VoiceLiveModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      {/* Omnia Science & DeepMind Research Suite Modal */}
      <ScienceHubModal
        isOpen={isScienceHubOpen}
        onClose={() => setIsScienceHubOpen(false)}
        onSelectPrompt={(prompt) => {
          setCurrentMode('science');
          handleSendMessage(prompt);
        }}
      />

      {/* Create Hub Modal */}
      <CreateHubModal
        isOpen={isCreateHubOpen}
        onClose={() => setIsCreateHubOpen(false)}
        onSelectCategory={(cat: CreateHubCategory) => {
          setCurrentMode(cat.mode);
          setInitialComposerPrompt(cat.promptTemplate);
          setActiveProjectId(null);
        }}
      />

      {/* Creation Tools Modal */}
      <CreationToolsModal
        isOpen={isCreationToolsOpen}
        onClose={() => setIsCreationToolsOpen(false)}
        onUsePrompt={(prompt) => {
          setActiveProjectId(null);
          setInitialComposerPrompt(prompt);
        }}
      />

      {/* Integration Permission Modal */}
      <IntegrationPermissionModal
        integration={connectingIntegration}
        isOpen={!!connectingIntegration}
        onClose={() => setConnectingIntegration(null)}
        onConfirmConnect={handleConfirmConnectIntegration}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={handleClearAllHistory}
        initialTab={settingsInitialTab}
      />

      {/* RAG Knowledge Base Explorer */}
      <RAGKnowledgeExplorer
        isOpen={isKnowledgeBaseOpen}
        onClose={() => setIsKnowledgeBaseOpen(false)}
        activeProjectId={activeProjectId}
      />

      {/* Grounded Citation Inspector Drawer */}
      <CitationDrawer
        isOpen={isCitationDrawerOpen}
        citation={activeCitation}
        onClose={() => setIsCitationDrawerOpen(false)}
        onOpenKnowledgeExplorer={() => {
          setIsCitationDrawerOpen(false);
          setIsKnowledgeBaseOpen(true);
        }}
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewChat={handleNewChat}
        onToggleSidebar={handleToggleSidebar}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScienceHub={() => setIsScienceHubOpen(true)}
        onOpenMusicStudio={() => setIsMusicStudioOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenCreateHub={() => setIsCreateHubOpen(true)}
        onOpenCreationTools={() => setIsCreationToolsOpen(true)}
        onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
        onFocusComposer={handleFocusComposer}
        onClearHistory={handleClearAllHistory}
        onExportConversation={handleExportConversation}
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        currentModel={currentModel}
        onSelectModel={setCurrentModel}
      />

      {/* Global Keyboard Shortcuts Help Modal (⌘/ or ?) */}
      <ShortcutsModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* VIZRA Engage Administration & Monetization Studio Modal */}
      <EngageAdminModal
        isOpen={isEngageAdminOpen}
        onClose={() => setIsEngageAdminOpen(false)}
      />
    </div>
  );
};
