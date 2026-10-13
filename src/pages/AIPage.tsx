import React, { useState, useRef, useEffect } from 'react';
import { AIHeader } from '../components/ai/AIHeader';
import { AISidebar } from '../components/ai/AISidebar';
import { EmptyState } from '../components/ai/EmptyState';
import { ChatMessage } from '../components/ai/ChatMessage';
import { PromptComposer } from '../components/ai/PromptComposer';
import { SettingsModal } from '../components/ai/SettingsModal';
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
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { CitationItem } from '../types/rag';
import { FolderGit2, X, ExternalLink } from 'lucide-react';
import { sendMessage } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import {
  getUserProjectsFromFirestore,
  saveUserProjectToFirestore,
  saveChatMessageToFirestore,
} from '../services/firestoreService';
import {
  getAllProjects,
  saveProject,
  createProjectFromPrompt,
  deleteProject,
} from '../services/projectService';
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
} from '../types/ai';

const initialConversations: Conversation[] = [
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
        isDemo: true,
        mode: 'quick',
        canCreateProject: false,
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Photosynthesis Overview',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    group: 'today',
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
        isDemo: true,
        mode: 'quick',
        canCreateProject: false,
      },
    ],
  },
];

export const AIPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv-1');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [currentModel, setCurrentModel] = useState<OmniaModel>('omnia-1.0');
  const [currentMode, setCurrentMode] = useState<AIMode>('quick');
  const [isSidebarOpenDesktop, setIsSidebarOpenDesktop] = useState(true);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [initialComposerPrompt, setInitialComposerPrompt] = useState<string | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
      // Clean chat reset
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        group: 'today',
      };
      setConversations((prev) => [newConv, ...prev]);
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

  // Check for initial prompt passed via explore/homepage
  useEffect(() => {
    const savedPrompt = sessionStorage.getItem('vizra_initial_prompt');
    if (savedPrompt) {
      sessionStorage.removeItem('vizra_initial_prompt');
      setInitialComposerPrompt(savedPrompt);
    }
  }, []);

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
  const messages = activeConversation ? activeConversation.messages : [];
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!activeProjectId) {
      scrollToBottom();
    }
  }, [messages, isStreaming, activeProjectId]);

  const handleNewChat = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
    setActiveProjectId(null);
    setActiveConversationId(null);
  };

  const handleSelectConversation = (id: string) => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
    setActiveProjectId(null);
    setActiveConversationId(id);
  };

  const handleSelectProject = (id: string) => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
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

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (!text.trim() && attachments.length === 0) return;

    let targetConvId = activeConversationId;
    let currentMessages: Message[] = [];

    // If starting a fresh chat, create a new conversation
    if (!targetConvId) {
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
      currentMessages = activeConversation ? [...activeConversation.messages] : [];
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

    // Update conversation with user message and streaming placeholder
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === targetConvId) {
          return {
            ...conv,
            updatedAt: Date.now(),
            messages: [...conv.messages, userMessage, assistantMessage],
          };
        }
        return conv;
      })
    );

    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await sendMessage({
        prompt: text,
        conversationHistory: currentMessages,
        attachments,
        model: currentModel,
        mode: currentMode,
        activeProject,
        signal: abortController.signal,
        onChunk: (chunkText) => {
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === targetConvId) {
                return {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? { ...m, content: chunkText, status: 'streaming' }
                      : m
                  ),
                };
              }
              return conv;
            })
          );
        },
      });

      // Mark streaming completed with enriched metadata (thoughtProcess, sources, suggestions, canCreateProject)
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === targetConvId) {
            return {
              ...conv,
              messages: conv.messages.map((m) =>
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
                      canCreateProject: result.canCreateProject,
                      projectDraft: result.projectDraft,
                      actionTrigger: result.actionTrigger,
                      actionPayload: result.actionPayload,
                      grounding: result.grounding,
                      citations: result.citations,
                      reasoning_trace_id: result.reasoning_trace_id,
                      knowledge_state: result.knowledge_state,
                      conflicts: result.conflicts,
                    }
                  : m
              ),
            };
          }
          return conv;
        })
      );

      // If user is authenticated, persist conversation messages to Firestore
      if (user?.uid) {
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

      // Handle immediate workflow execution triggered by user intent
      if (result.actionTrigger === 'create_project' && result.projectDraft) {
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
      if (err.name !== 'AbortError') {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === targetConvId) {
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? {
                        ...m,
                        content: 'An error occurred during inference. Please retry.',
                        status: 'error',
                      }
                    : m
                ),
              };
            }
            return conv;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
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
    handleSendMessage(newText);
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
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCreateHub={() => setIsCreateHubOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenMusicStudio={() => setIsMusicStudioOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenScienceHub={() => setIsScienceHubOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
      />

      {/* Main Workspace: Left Sidebar + Workspace / Chat Column */}
      <div className="flex-1 flex h-[calc(100vh-5.5rem)] overflow-hidden">
        {/* Left Sidebar */}
        <AISidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onArchiveConversation={handleArchiveConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          isOpenDesktop={isSidebarOpenDesktop}
          onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onNewProject={() => handleCreateProject()}
        />

        {/* Center Workspace Column */}
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
            {/* Active Project Context Banner if project is loaded in background */}
            {activeProject && (
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
              {messages.length === 0 ? (
                <EmptyState
                  onSelectPrompt={handleSelectEmptyPrompt}
                  activeMode={currentMode}
                  onSelectMode={setCurrentMode}
                />
              ) : (
                <div className="w-full max-w-3xl mx-auto py-4 space-y-4">
                  {messages.map((msg, index) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      onRegenerate={
                        index === messages.length - 1 && msg.role === 'assistant'
                          ? handleRegenerateLast
                          : undefined
                      }
                      onSelectSuggestion={handleSelectSuggestion}
                      onCreateProject={handleCreateProject}
                      onEditUserMessage={handleEditUserMessage}
                      onOpenCitation={(cit) => {
                        setActiveCitation(cit);
                        setIsCitationDrawerOpen(true);
                      }}
                    />
                  ))}
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
                onRequestConnectIntegration={(item) => setConnectingIntegration(item)}
                onOpenMusicStudio={() => setIsMusicStudioOpen(true)}
                onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
              />
            </div>
          </div>
        )}
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
    </div>
  );
};
