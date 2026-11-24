import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send, Square, Mic, MicOff, Sparkles, Layers, Music, Radio } from 'lucide-react';
import { Attachment, AIMode, Integration } from '../../types/ai';
import { AttachmentPreview } from './AttachmentPreview';
import { IntegrationMenu } from './IntegrationMenu';
import { ModeSelector } from './ModeSelector';
import { Tooltip } from '../ui/Tooltip';

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
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setText(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
      textareaRef.current?.focus();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    if (!text.trim() && attachments.length === 0) return;

    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddAttachment = (att: Attachment) => {
    setAttachments((prev) => [...prev, att]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSelectCreativeMode = (modeTitle: string) => {
    if (modeTitle.includes('Project')) {
      onSelectMode('create');
      setText('Create a 30-second cinematic video project about black holes with 60fps kinetic motion.');
    } else {
      setText((prev) => (prev ? `${prev} [${modeTitle}]` : `[${modeTitle}]: `));
    }
    textareaRef.current?.focus();
  };

  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setSpeechNotice(null);

    // Use Web Speech API if supported in browser
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

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
          setSpeechNotice('Microphone permission denied or speech recognition unavailable in this browser.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch {
        // Fall through to honest unavailable notice
      }
    }

    setSpeechNotice(
      'Browser SpeechRecognition API is not supported in this browser environment. Please type your prompt or use Live Voice Mode.'
    );
    setTimeout(() => setSpeechNotice(null), 5000);
  };

  const canSend = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 md:pb-6 relative select-none">
      {/* Integration Menu Popup */}
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

      {/* Main Composer Box */}
      <div
        className={`relative rounded-2xl bg-[#0e0e0e] border transition-all duration-200 shadow-xl overflow-visible ${
          isTemporaryChat
            ? 'border-[#eb3b2d]/45 focus-within:border-[#eb3b2d]'
            : 'border-neutral-800 focus-within:border-neutral-700'
        }`}
      >
        {/* Active listening banner if mic active */}
        {isListening && (
          <div className="px-4 py-1.5 bg-[#eb3b2d]/10 border-b border-[#eb3b2d]/30 text-xs text-[#eb3b2d] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#eb3b2d] animate-ping" />
            <span>Listening to voice prompt in {currentMode.toUpperCase()} mode...</span>
          </div>
        )}
        {speechNotice && (
          <div className="px-4 py-1.5 bg-amber-950/50 border-b border-amber-800/40 text-xs text-amber-300 flex items-center justify-between gap-2">
            <span>{speechNotice}</span>
            <button
              type="button"
              onClick={() => setSpeechNotice(null)}
              className="text-amber-400 hover:text-white font-mono text-[10px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Attachment Previews */}
        <AttachmentPreview
          attachments={attachments}
          onRemove={handleRemoveAttachment}
        />

        {/* Main Textarea */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            id="omnia-prompt-textarea"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isTemporaryChat
                ? 'Message Temporary Chat… (not saved to history)'
                : 'Message Omnia… (Press / to focus, ⌘K for commands)'
            }
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm md:text-base focus:outline-none resize-none leading-relaxed max-h-[180px] overflow-y-auto font-sans"
          />
        </div>

        {/* Composer Controls Bottom Row */}
        <div className="px-3 pb-2.5 pt-1 flex items-center justify-between">
          {/* Left: Plus Integration Button & Mode Selector */}
          <div className="flex items-center gap-2">
            <Tooltip
              label="Attachments & Creative Inputs"
              text="Upload images, PDFs, or CSV spreadsheets, connect external workspaces, or insert creative project templates."
              position="top"
              align="start"
            >
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800/80 transition-colors cursor-pointer group"
                aria-label="Add files, tools or creative inputs"
              >
                <Plus
                  size={16}
                  className="group-hover:rotate-90 group-hover:text-[#eb3b2d] transition-all duration-200"
                />
              </button>
            </Tooltip>

            {/* In-Composer Mode Selector */}
            <ModeSelector currentMode={currentMode} onSelectMode={onSelectMode} compact />

            {/* Quick Creation Tools Shortcut */}
            {onOpenCreationTools && (
              <Tooltip
                label="Creation Tools"
                text="Open visual generators for logos, cinematic camera prompts, color palettes, and motion keyframes."
                position="top"
              >
                <button
                  type="button"
                  onClick={onOpenCreationTools}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Open Creation Tools"
                >
                  <Sparkles size={12} className="text-[#eb3b2d]" />
                  <span>Tools</span>
                </button>
              </Tooltip>
            )}

            {/* AI Music Studio Button */}
            {onOpenMusicStudio && (
              <Tooltip
                label="AI Music Generator"
                text="Create custom background music, ambient loops, and soundtracks from text descriptions."
                position="top"
              >
                <button
                  type="button"
                  onClick={onOpenMusicStudio}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Open AI Music Generator"
                >
                  <Music size={12} className="text-[#eb3b2d]" />
                  <span>Music</span>
                </button>
              </Tooltip>
            )}

            {/* Live Voice Conversation Button */}
            {onOpenLiveVoice && (
              <Tooltip
                label="Live Voice Mode"
                text="Speak naturally with Omnia in real time for hands-free brainstorming and instant voice responses."
                position="top"
              >
                <button
                  type="button"
                  onClick={onOpenLiveVoice}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Open Live Voice Mode"
                >
                  <Radio size={12} className="text-[#eb3b2d] animate-pulse" />
                  <span>Live</span>
                </button>
              </Tooltip>
            )}
          </div>

          {/* Right: Mic & Send Buttons */}
          <div className="flex items-center gap-2">
            {/* Microphone Button */}
            <Tooltip
              label={isListening ? 'Stop Dictation' : 'Voice Dictation'}
              text={
                isListening
                  ? 'Click to stop recording your spoken prompt.'
                  : 'Dictate your prompt using your microphone instead of typing.'
              }
              position="top"
              align="end"
            >
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-[#eb3b2d] text-white border-[#eb3b2d]'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-800/80'
                }`}
                aria-label="Microphone"
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            </Tooltip>

            {/* Send / Stop Button */}
            {isStreaming ? (
              <Tooltip
                label="Stop Generation"
                shortcut="Esc"
                text="Immediately cancel the active response stream."
                position="top"
                align="end"
              >
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="w-8 h-8 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  aria-label="Stop generation"
                >
                  <Square size={13} fill="currentColor" />
                </button>
              </Tooltip>
            ) : (
              <Tooltip
                label="Send Message"
                shortcut="Enter"
                text="Submit your prompt and attachments to Omnia (use Shift + Enter for a new line)."
                position="top"
                align="end"
              >
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                    canSend
                      ? 'bg-white text-black hover:bg-neutral-200 scale-100'
                      : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                >
                  <Send size={14} className={canSend ? 'text-black' : 'text-neutral-600'} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Discreet Legal & Context Line */}
      <div className="text-center mt-2 text-[11px] text-neutral-500 font-mono">
        {isTemporaryChat
          ? 'Temporary Chat is not saved to your history. AI can make mistakes—verify important info.'
          : 'AI can make mistakes. Check important info.'}
      </div>
    </div>
  );
};
