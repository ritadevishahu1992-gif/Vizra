import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  ArrowUp,
  Square,
  Mic,
  MicOff,
  Sparkles,
  Music,
  Radio,
  Paperclip,
  Globe,
  FilePenLine,
  X,
} from 'lucide-react';
import { Attachment, AIMode, Integration } from '../../types/ai';
import { AttachmentPreview } from './AttachmentPreview';
import { IntegrationMenu } from './IntegrationMenu';
import { ModeSelector } from './ModeSelector';
import { Tooltip } from '../ui/Tooltip';

const ACTIVE_MODE_LABELS: Partial<Record<AIMode, string>> = {
  research: 'Web Search Grounding',
  create: 'Structured Drafting Mode',
  think: 'Deep Reasoning Mode',
  code: 'Code Engineering Mode',
  science: 'Omnia Science Mode',
  analyze: 'File & Data Analysis',
};

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB matching backend & IntegrationMenu
const QUICK_UPLOAD_ACCEPT =
  '.pdf,.txt,.md,.csv,.tsv,.json,.ts,.tsx,.js,.jsx,.py,.html,.css,image/png,image/jpeg,image/webp,audio/*';

interface PromptComposerProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onOpenCreationTools?: () => void;
  onCreateImage?: (prompt: string, aspectRatio?: '16:9' | '1:1' | '9:16') => void;
  onRequestConnectIntegration?: (integration: Integration) => void;
  onOpenMusicStudio?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenScienceHub?: () => void;
  onOpenKnowledgeBase?: () => void;
  isTemporaryChat?: boolean;
  maxWidthClass?: string;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  currentMode,
  onSelectMode,
  initialPrompt,
  onClearInitialPrompt,
  onOpenCreationTools,
  onCreateImage,
  onRequestConnectIntegration,
  onOpenMusicStudio,
  onOpenLiveVoice,
  onOpenScienceHub,
  onOpenKnowledgeBase,
  isTemporaryChat = false,
  maxWidthClass = 'max-w-3xl',
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);
  const sendLockRef = useRef<boolean>(false);

  // Release duplicate-send lock whenever streaming settles
  useEffect(() => {
    if (!isStreaming) {
      sendLockRef.current = false;
    }
  }, [isStreaming]);

  useEffect(() => {
    if (initialPrompt) {
      setText(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
      textareaRef.current?.focus();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Smooth auto-resizing multi-line textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text]);

  const handleSend = useCallback(() => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    if (sendLockRef.current) return;

    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    sendLockRef.current = true;
    const outboundPrompt =
      trimmed ||
      `Analyze attached ${attachments.length === 1 ? `file: ${attachments[0].name}` : `${attachments.length} files`}`;

    onSendMessage(outboundPrompt, attachments);
    setText('');
    setAttachments([]);
    setComposerNotice(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    window.setTimeout(() => {
      sendLockRef.current = false;
    }, 350);
  }, [attachments, isStreaming, onSendMessage, onStopStreaming, text]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddAttachment = useCallback((att: Attachment) => {
    setAttachments((prev) => [...prev, att]);
    setComposerNotice(null);
  }, []);

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Direct quick file attachment using VIZRA's validated multimodal format
  const handleQuickFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setComposerNotice(`"${file.name}" exceeds the 10 MB attachment limit.`);
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isPdf = file.type.includes('pdf') || lowerName.endsWith('.pdf');
    const isCsv =
      lowerName.endsWith('.csv') || lowerName.endsWith('.tsv') || file.type.includes('csv');
    const isText =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      /\.(txt|md|json|ts|tsx|js|jsx|py|html|css)$/i.test(lowerName);

    if (isVideo) {
      setComposerNotice(
        `Video files cannot be attached directly yet. Upload image frames (PNG/JPG), audio, or transcripts.`
      );
      return;
    }

    const sizeLabel = `${(file.size / 1024).toFixed(1)} KB`;
    const attId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (isImage || isPdf || isAudio) {
      const reader = new FileReader();
      reader.onload = () => {
        handleAddAttachment({
          id: attId,
          name: file.name,
          type: isImage ? 'image' : isPdf ? 'pdf' : 'audio',
          size: sizeLabel,
          previewUrl: typeof reader.result === 'string' ? reader.result : undefined,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    if (isCsv || isText) {
      const reader = new FileReader();
      reader.onload = () => {
        handleAddAttachment({
          id: attId,
          name: file.name,
          type: isCsv ? 'csv' : 'document',
          size: sizeLabel,
          content: typeof reader.result === 'string' ? reader.result.slice(0, 60000) : '',
        });
      };
      reader.readAsText(file);
      return;
    }

    setComposerNotice(
      `Unsupported file format for "${file.name}". Supported: images, PDF, CSV, markdown, code, text, and audio.`
    );
  };

  const handleSelectCreativeMode = (modeTitle: string) => {
    if (modeTitle.includes('Project')) {
      onSelectMode('create');
      setText(
        'Create a 30-second cinematic video project about black holes with 60fps kinetic motion.'
      );
    } else {
      setText((prev) => (prev ? `${prev} [${modeTitle}]` : `[${modeTitle}]: `));
    }
    textareaRef.current?.focus();
  };

  const toggleSearchMode = () => {
    onSelectMode(currentMode === 'research' ? 'quick' : 'research');
    textareaRef.current?.focus();
  };

  const toggleDraftingMode = () => {
    onSelectMode(currentMode === 'create' ? 'quick' : 'create');
    textareaRef.current?.focus();
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setComposerNotice(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((res: any) => res[0].transcript)
            .join('');
          if (transcript) {
            setText(transcript);
          }
        };
        recognition.onerror = () => {
          setIsListening(false);
          setComposerNotice(
            'Microphone permission denied or speech recognition unavailable in this browser.'
          );
        };
        recognition.onend = () => setIsListening(false);

        recognition.start();
        return;
      } catch {
        // Fall through to browser notice
      }
    }

    setComposerNotice(
      'Browser voice dictation is unavailable here. Type your prompt or open Live Voice Mode.'
    );
    window.setTimeout(() => setComposerNotice(null), 5000);
  };

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !isStreaming;
  const activeModeLabel = ACTIVE_MODE_LABELS[currentMode];

  return (
    <div
      className={`w-full ${maxWidthClass} mx-auto px-3 sm:px-4 pb-3 sm:pb-5 relative select-none transition-all duration-200`}
    >
      {/* Hidden Direct File Input */}
      <input
        ref={quickFileInputRef}
        type="file"
        accept={QUICK_UPLOAD_ACCEPT}
        className="hidden"
        onChange={handleQuickFileChange}
        aria-label="Attach file"
      />

      {/* Full Tools & Integrations Popover Menu */}
      <IntegrationMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onAddAttachment={handleAddAttachment}
        onSelectCreativeMode={handleSelectCreativeMode}
        onCreateImage={onCreateImage}
        onOpenCreationTools={onOpenCreationTools}
        onRequestConnectIntegration={onRequestConnectIntegration}
        onOpenMusicStudio={onOpenMusicStudio}
        onOpenScienceHub={onOpenScienceHub}
        onOpenKnowledgeBase={onOpenKnowledgeBase}
      />

      {/* Active Tool / Drafting Mode Indicator Bar */}
      {activeModeLabel && (
        <div className="mb-2 pl-1 flex items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DC143C]/14 border border-[#DC143C]/35 text-xs font-medium text-rose-100">
            <span className="text-[#DC143C] font-display font-semibold">Active</span>
            <span aria-hidden="true" className="text-rose-300/60">·</span>
            <span>{activeModeLabel}</span>
            <button
              type="button"
              onClick={() => onSelectMode('quick')}
              aria-label={`Disable ${activeModeLabel}`}
              className="ml-0.5 p-0.5 rounded-full text-rose-200/80 hover:text-white hover:bg-[#DC143C]/25 transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Composer Row: Standalone Circular '+' Trigger + Rounded Multiline Composer */}
      <form onSubmit={handleFormSubmit} className="flex items-end gap-2.5">
        {/* Left: Standalone Circular '+' Tools Button (Crimson Reference) */}
        <Tooltip
          label="Tools & Attachments"
          text="Upload files or images (up to 10 MB), generate visuals, or connect workspace plugins."
          position="top"
          align="start"
        >
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Open tools and attachments menu"
            aria-expanded={isMenuOpen}
            className={`w-11 h-11 shrink-0 rounded-full border flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C] ${
              isMenuOpen
                ? 'bg-[#DC143C]/14 border-[#DC143C]/60 text-[#DC143C] shadow-[0_0_12px_rgba(220,20,60,0.2)]'
                : 'bg-[#141418] hover:bg-[#1B1B21] border-[#23232A] hover:border-[#DC143C]/50 text-zinc-200 hover:text-white'
            }`}
          >
            <Plus
              size={20}
              className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`}
            />
          </button>
        </Tooltip>

        {/* Main Rounded Multiline Composer Container */}
        <div
          className={`flex-1 min-w-0 rounded-[26px] bg-[#141418] border transition-all duration-200 shadow-2xl overflow-visible ${
            isTemporaryChat
              ? 'border-[#DC143C]/55 focus-within:border-[#DC143C] focus-within:shadow-[0_0_16px_rgba(220,20,60,0.22)]'
              : 'border-[#27272F] focus-within:border-[#DC143C] focus-within:shadow-[0_0_16px_rgba(220,20,60,0.2)]'
          }`}
        >
          {/* Voice Listening Status Strip */}
          {isListening && (
            <div className="px-4 py-1.5 rounded-t-[25px] bg-[#DC143C]/14 border-b border-[#DC143C]/30 text-xs text-rose-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-pulse motion-reduce:animate-none" />
                <span>Listening for voice prompt ({currentMode} mode)…</span>
              </div>
              <button
                type="button"
                onClick={toggleMic}
                className="text-[11px] font-medium text-rose-200 hover:text-white cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          {/* Inline Validation / Speech Notice */}
          {composerNotice && (
            <div
              role="status"
              className="px-4 py-1.5 rounded-t-[25px] bg-[#1B1B21] border-b border-[#DC143C]/35 text-xs text-rose-200 flex items-center justify-between gap-2"
            >
              <span className="truncate">{composerNotice}</span>
              <button
                type="button"
                onClick={() => setComposerNotice(null)}
                aria-label="Dismiss notice"
                className="text-zinc-400 hover:text-white shrink-0 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Attachment Previews */}
          <AttachmentPreview attachments={attachments} onRemove={handleRemoveAttachment} />

          {/* Multi-Line Auto-Resizing Textarea */}
          <div className="px-4 pt-3 pb-1.5">
            <textarea
              ref={textareaRef}
              id="omnia-prompt-textarea"
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Message Omnia"
              placeholder={
                isTemporaryChat
                  ? 'Ask in Temporary Chat… (not saved to history)'
                  : currentMode === 'research'
                  ? 'Ask with live web search grounding…'
                  : currentMode === 'create'
                  ? 'Describe the structured document, script, or project to draft…'
                  : 'Ask Omnia anything…'
              }
              className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm sm:text-[15px] focus:outline-none resize-none leading-relaxed max-h-[168px] overflow-y-auto font-sans"
            />
          </div>

          {/* Bottom Controls Row: Attachments, Search, Drafting Mode, Mode Picker, Voice, Prominent Send */}
          <div className="px-2.5 sm:px-3 pb-2 pt-1 flex items-center justify-between gap-2">
            {/* Left Action Buttons */}
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              {/* Quick File Attachment Button */}
              <Tooltip
                label="Attach File"
                text="Upload images, PDFs, CSV spreadsheets, code, or audio (max 10 MB)."
                position="top"
                align="start"
              >
                <button
                  type="button"
                  onClick={() => quickFileInputRef.current?.click()}
                  aria-label="Attach file"
                  className="h-8 px-2.5 rounded-full bg-[#1B1B21] hover:bg-[#23232A] border border-[#27272F] hover:border-[#DC143C]/45 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#DC143C]"
                >
                  <Paperclip size={13} className="text-[#DC143C]" />
                  <span className="hidden sm:inline">Attach</span>
                </button>
              </Tooltip>

              {/* Web Search Mode Toggle */}
              <Tooltip
                label="Web Search"
                text="Toggle live Google Search grounding with verified source citations."
                position="top"
              >
                <button
                  type="button"
                  onClick={toggleSearchMode}
                  aria-pressed={currentMode === 'research'}
                  aria-label="Toggle Web Search mode"
                  className={`h-8 px-2.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#DC143C] ${
                    currentMode === 'research'
                      ? 'bg-[#DC143C]/16 border-[#DC143C]/55 text-rose-100 shadow-[0_0_10px_rgba(220,20,60,0.18)]'
                      : 'bg-[#1B1B21] hover:bg-[#23232A] border-[#27272F] hover:border-[#DC143C]/40 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Globe size={13} className="text-[#DC143C]" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </Tooltip>

              {/* Structured Drafting / Canvas Mode Toggle */}
              <Tooltip
                label="Structured Drafting"
                text="Toggle long-form structured drafting, scripts, and 10-stage creative project mode."
                position="top"
              >
                <button
                  type="button"
                  onClick={toggleDraftingMode}
                  aria-pressed={currentMode === 'create'}
                  aria-label="Toggle Structured Drafting mode"
                  className={`h-8 px-2.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#DC143C] ${
                    currentMode === 'create'
                      ? 'bg-[#DC143C]/16 border-[#DC143C]/55 text-rose-100 shadow-[0_0_10px_rgba(220,20,60,0.18)]'
                      : 'bg-[#1B1B21] hover:bg-[#23232A] border-[#27272F] hover:border-[#DC143C]/40 text-zinc-300 hover:text-white'
                  }`}
                >
                  <FilePenLine size={13} className="text-[#DC143C]" />
                  <span className="hidden sm:inline">Draft</span>
                </button>
              </Tooltip>

              {/* Full Omnia Mode Switcher (opens upward cleanly) */}
              <ModeSelector
                currentMode={currentMode}
                onSelectMode={onSelectMode}
                compact
                direction="up"
              />

              {/* Desktop Studio Shortcuts (preserved from VIZRA) */}
              {onOpenCreationTools && (
                <Tooltip
                  label="Creation Tools"
                  text="Open visual generators for logos, camera prompts, color palettes, and keyframes."
                  position="top"
                >
                  <button
                    type="button"
                    onClick={onOpenCreationTools}
                    className="hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#1B1B21] hover:bg-[#23232A] border border-[#27272F] text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    aria-label="Open Creation Tools"
                  >
                    <Sparkles size={12} className="text-[#DC143C]" />
                    <span>Tools</span>
                  </button>
                </Tooltip>
              )}

              {onOpenMusicStudio && (
                <Tooltip
                  label="AI Music Studio"
                  text="Compose custom background music and soundtracks from text descriptions."
                  position="top"
                >
                  <button
                    type="button"
                    onClick={onOpenMusicStudio}
                    className="hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#1B1B21] hover:bg-[#23232A] border border-[#27272F] text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    aria-label="Open AI Music Studio"
                  >
                    <Music size={12} className="text-[#DC143C]" />
                    <span>Music</span>
                  </button>
                </Tooltip>
              )}

              {onOpenLiveVoice && (
                <Tooltip
                  label="Live Voice Mode"
                  text="Speak naturally with Omnia in real time."
                  position="top"
                >
                  <button
                    type="button"
                    onClick={onOpenLiveVoice}
                    className="hidden xl:flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#1B1B21] hover:bg-[#23232A] border border-[#27272F] text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    aria-label="Open Live Voice Mode"
                  >
                    <Radio size={12} className="text-[#DC143C]" />
                    <span>Live</span>
                  </button>
                </Tooltip>
              )}
            </div>

            {/* Right: Voice Dictation & Prominent Crimson Send / Stop Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Tooltip
                label={isListening ? 'Stop Dictation' : 'Voice Dictation'}
                text={
                  isListening
                    ? 'Stop recording your spoken prompt.'
                    : 'Dictate your prompt using your microphone.'
                }
                position="top"
                align="end"
              >
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-label={isListening ? 'Stop dictation' : 'Start voice dictation'}
                  aria-pressed={isListening}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#DC143C] ${
                    isListening
                      ? 'bg-[#DC143C] text-white border-[#DC143C] shadow-[0_0_12px_rgba(220,20,60,0.35)]'
                      : 'bg-[#1B1B21] hover:bg-[#23232A] text-zinc-400 hover:text-white border-[#27272F]'
                  }`}
                >
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              </Tooltip>

              {isStreaming ? (
                <Tooltip
                  label="Stop Generation"
                  shortcut="Esc"
                  text="Cancel the active streaming response."
                  position="top"
                  align="end"
                >
                  <button
                    type="button"
                    onClick={onStopStreaming}
                    aria-label="Stop generation"
                    className="w-9 h-9 rounded-full bg-[#DC143C]/18 hover:bg-[#DC143C]/28 border border-[#DC143C]/60 text-[#DC143C] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-[0_0_14px_rgba(220,20,60,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C]"
                  >
                    <Square size={13} fill="currentColor" />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip
                  label="Send Message"
                  shortcut="Enter"
                  text="Send your message (Shift + Enter for a new line)."
                  position="top"
                  align="end"
                >
                  <button
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send message"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C] ${
                      canSend
                        ? 'bg-[#DC143C] hover:bg-[#B01030] text-white shadow-[0_0_16px_rgba(220,20,60,0.35)] active:scale-95 cursor-pointer'
                        : 'bg-[#1B1B21] text-zinc-500 border border-[#27272F] opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp size={17} strokeWidth={2.4} />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Quiet Context Disclaimer */}
      <div className="text-center mt-2 text-[11px] text-zinc-500">
        {isTemporaryChat
          ? 'Temporary Chat is not saved to your VIZRA history. Verify important info.'
          : 'Omnia can make mistakes. Verify important information.'}
      </div>
    </div>
  );
};

