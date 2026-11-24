import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  FileText,
  File,
  Sparkles,
  ChevronRight,
  HardDrive,
  FileSpreadsheet,
  Github,
  Figma,
  Palette,
  Youtube,
  X,
  FileCheck,
  Music,
  Atom,
  Database,
  Globe,
  Puzzle,
} from 'lucide-react';
import { Attachment, Integration } from '../../types/ai';
import { FileUpload } from '../ui/FileUpload';

interface IntegrationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAttachment: (attachment: Attachment) => void;
  onSelectCreativeMode: (modeTitle: string) => void;
  onCreateImage?: (prompt: string, aspectRatio?: '16:9' | '1:1' | '9:16') => void;
  onOpenCreationTools?: () => void;
  onRequestConnectIntegration?: (integration: Integration) => void;
  onOpenMusicStudio?: () => void;
  onOpenScienceHub?: () => void;
  onOpenKnowledgeBase?: () => void;
}

const IMAGE_PROMPT_SUGGESTIONS: Array<{
  label: string;
  prompt: string;
  aspectRatio: '16:9' | '1:1' | '9:16';
}> = [
  {
    label: 'Obsidian Architectural Prism',
    prompt:
      'Minimalist obsidian architectural monolith with surgical crimson caustic light refraction, dark studio lighting, 8k editorial render',
    aspectRatio: '16:9',
  },
  {
    label: 'Kinetic Typography Poster',
    prompt:
      'Swiss modernist geometric poster composition on matte charcoal void with razor-sharp red accents and radial grid lines',
    aspectRatio: '1:1',
  },
  {
    label: 'Sci-Fi Product Concept',
    prompt:
      'Industrial design render of a brushed anodized titanium audio controller with subtle ruby LED halo on dark slate desk',
    aspectRatio: '16:9',
  },
];

export const IntegrationMenu: React.FC<IntegrationMenuProps> = ({
  isOpen,
  onClose,
  onAddAttachment,
  onSelectCreativeMode,
  onCreateImage,
  onRequestConnectIntegration,
  onOpenMusicStudio,
  onOpenScienceHub,
  onOpenKnowledgeBase,
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const [activeUploadAccept, setActiveUploadAccept] = useState<string>('*');
  const [showImageSuggestions, setShowImageSuggestions] = useState(false);
  const [showPluginsPanel, setShowPluginsPanel] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

    if (file.size > maxSizeBytes) {
      setNotice(`File "${file.name}" exceeds the 10MB upload limit.`);
      return;
    }

    const fileNameLower = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isPdf = file.type.includes('pdf') || fileNameLower.endsWith('.pdf');
    const isCsv =
      fileNameLower.endsWith('.csv') ||
      fileNameLower.endsWith('.tsv') ||
      file.type.includes('csv');
    const isText =
      file.type.startsWith('text/') ||
      fileNameLower.endsWith('.txt') ||
      fileNameLower.endsWith('.md') ||
      fileNameLower.endsWith('.json') ||
      fileNameLower.endsWith('.ts') ||
      fileNameLower.endsWith('.js') ||
      fileNameLower.endsWith('.py');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        onAddAttachment({
          id: Date.now().toString(),
          name: file.name,
          type: 'image',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          previewUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
      onClose();
      return;
    }

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        onAddAttachment({
          id: Date.now().toString(),
          name: file.name,
          type: 'pdf',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          previewUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
      onClose();
      return;
    }

    if (isCsv || isText || file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = () => {
        onAddAttachment({
          id: Date.now().toString(),
          name: file.name,
          type: isCsv ? 'csv' : 'document',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content: (reader.result as string) || '',
        });
      };
      reader.readAsText(file);
      onClose();
      return;
    }

    if (isAudio) {
      const reader = new FileReader();
      reader.onload = () => {
        onAddAttachment({
          id: Date.now().toString(),
          name: file.name,
          type: 'audio',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          previewUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
      onClose();
      return;
    }

    if (isVideo) {
      setNotice(
        `Video "${file.name}" cannot be analyzed in chat attachments yet. Upload frames (PNG/JPG), audio, or transcripts.`
      );
      return;
    }

    onAddAttachment({
      id: Date.now().toString(),
      name: file.name,
      type: 'document',
      size: `${(file.size / 1024).toFixed(1)} KB`,
    });
    onClose();
  };

  const triggerUpload = (acceptPattern: string = '*') => {
    setActiveUploadAccept(acceptPattern);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const launchImageGeneration = (
    prompt: string,
    aspectRatio: '16:9' | '1:1' | '9:16' = '16:9'
  ) => {
    const clean = prompt.trim();
    if (!clean) return;
    if (onCreateImage) {
      onCreateImage(clean, aspectRatio);
    } else {
      onSelectCreativeMode(`Create Image: ${clean}`);
    }
    setCustomImagePrompt('');
    setShowImageSuggestions(false);
    onClose();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={activeUploadAccept}
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Panel Container */}
      <div className="fixed md:absolute bottom-0 md:bottom-full md:mb-3 left-0 md:left-2 right-0 md:right-auto md:w-[420px] max-h-[85vh] md:max-h-[580px] bg-neutral-950 border border-neutral-800 rounded-t-2xl md:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-900 bg-neutral-900/40 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Composer Actions &amp; Plugins
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Attach files or photos (max 10MB), generate visuals, or launch plugins.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice */}
        {notice && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-neutral-900 border border-[#eb3b2d]/40 text-xs text-neutral-200 flex items-center justify-between gap-2">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-neutral-400 hover:text-white cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Primary 4-Action Menu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="space-y-1.5">
            {/* 1. Files (up to 10MB) */}
            <button
              type="button"
              onClick={() => triggerUpload('.pdf,.txt,.md,.csv,.tsv,.json,.ts,.js,.py,.doc,.docx,audio/*')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/70 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 group-hover:text-white">
                  <File size={15} className="text-[#eb3b2d]" />
                </div>
                <div>
                  <div className="font-medium text-white text-xs">Files</div>
                  <div className="text-[11px] text-neutral-400">
                    PDF, CSV, code, markdown &amp; audio (up to 10MB)
                  </div>
                </div>
              </div>
              <ChevronRight size={14} className="text-neutral-500 group-hover:text-white" />
            </button>

            {/* 2. Photos (up to 10MB) */}
            <button
              type="button"
              onClick={() => triggerUpload('image/*')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/70 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 group-hover:text-white">
                  <ImageIcon size={15} className="text-[#eb3b2d]" />
                </div>
                <div>
                  <div className="font-medium text-white text-xs">Photos</div>
                  <div className="text-[11px] text-neutral-400">
                    PNG, JPG, WebP, or screenshots for vision analysis (up to 10MB)
                  </div>
                </div>
              </div>
              <ChevronRight size={14} className="text-neutral-500 group-hover:text-white" />
            </button>

            {/* 3. Create Image (with prompt suggestions & inline generation) */}
            <div className="rounded-xl bg-neutral-900/50 border border-neutral-800/70 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setShowImageSuggestions((prev) => !prev);
                  setShowPluginsPanel(false);
                }}
                className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-900 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 group-hover:text-white">
                    <Sparkles size={15} className="text-[#eb3b2d]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">Create Image</div>
                    <div className="text-[11px] text-neutral-400">
                      Generate studio visual concepts with prompt suggestions
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className={`text-neutral-500 transition-transform ${
                    showImageSuggestions ? 'rotate-90 text-[#eb3b2d]' : 'group-hover:text-white'
                  }`}
                />
              </button>

              {showImageSuggestions && (
                <div className="px-3 pb-3 pt-2 border-t border-neutral-800/80 space-y-2.5 bg-neutral-950/60">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customImagePrompt}
                      onChange={(e) => setCustomImagePrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          launchImageGeneration(customImagePrompt);
                        }
                      }}
                      placeholder="Describe the visual to render..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 focus:border-[#eb3b2d] focus:outline-none text-xs text-white placeholder-neutral-500"
                    />
                    <button
                      type="button"
                      disabled={!customImagePrompt.trim()}
                      onClick={() => launchImageGeneration(customImagePrompt)}
                      className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                      Prompt Suggestions
                    </div>
                    {IMAGE_PROMPT_SUGGESTIONS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => launchImageGeneration(item.prompt, item.aspectRatio)}
                        className="w-full text-left p-2 rounded-lg bg-neutral-900/70 hover:bg-neutral-800 border border-neutral-800/80 transition-colors cursor-pointer"
                      >
                        <div className="font-medium text-neutral-200 text-[11px]">{item.label}</div>
                        <div className="text-[10px] text-neutral-500 line-clamp-1">{item.prompt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Plugins (Available Integrations Only Clearly Highlighted) */}
            <div className="rounded-xl bg-neutral-900/50 border border-neutral-800/70 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setShowPluginsPanel((prev) => !prev);
                  setShowImageSuggestions(false);
                }}
                className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-900 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 group-hover:text-white">
                    <Puzzle size={15} className="text-[#eb3b2d]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">Plugins</div>
                    <div className="text-[11px] text-neutral-400">
                      Available studio integrations &amp; connectors
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className={`text-neutral-500 transition-transform ${
                    showPluginsPanel ? 'rotate-90 text-[#eb3b2d]' : 'group-hover:text-white'
                  }`}
                />
              </button>

              {showPluginsPanel && (
                <div className="px-3 pb-3 pt-2 border-t border-neutral-800/80 space-y-3 bg-neutral-950/60">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                      Available Now
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenMusicStudio?.();
                          onClose();
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left cursor-pointer"
                      >
                        <Music size={13} className="text-[#eb3b2d] shrink-0" />
                        <span className="text-[11px] font-medium text-white truncate">AI Music (Lyria)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenScienceHub?.();
                          onClose();
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left cursor-pointer"
                      >
                        <Atom size={13} className="text-[#eb3b2d] shrink-0" />
                        <span className="text-[11px] font-medium text-white truncate">Science Hub</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenKnowledgeBase?.();
                          onClose();
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left cursor-pointer"
                      >
                        <Database size={13} className="text-[#eb3b2d] shrink-0" />
                        <span className="text-[11px] font-medium text-white truncate">Knowledge RAG</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCreativeMode('Research live web sources for');
                          onClose();
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left cursor-pointer"
                      >
                        <Globe size={13} className="text-[#eb3b2d] shrink-0" />
                        <span className="text-[11px] font-medium text-white truncate">Web Search</span>
                      </button>
                    </div>
                  </div>

                  {/* External OAuth Connectors — transparently labeled */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                      External OAuth Connectors (Requires OAuth Config)
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'google_drive', name: 'Drive', icon: HardDrive, scope: 'https://www.googleapis.com/auth/drive.readonly', category: 'productivity' as const },
                        { id: 'google_docs', name: 'Docs', icon: FileText, scope: 'https://www.googleapis.com/auth/documents.readonly', category: 'productivity' as const },
                        { id: 'google_sheets', name: 'Sheets', icon: FileSpreadsheet, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly', category: 'productivity' as const },
                        { id: 'github', name: 'GitHub', icon: Github, scope: 'read:user public_repo', category: 'development' as const },
                        { id: 'figma', name: 'Figma', icon: Figma, scope: 'file_read', category: 'development' as const },
                        { id: 'notion', name: 'Notion', icon: FileCheck, scope: 'read_content', category: 'productivity' as const },
                        { id: 'canva', name: 'Canva', icon: Palette, scope: 'design:meta:read', category: 'creator' as const },
                        { id: 'youtube', name: 'YouTube', icon: Youtube, scope: 'https://www.googleapis.com/auth/youtube.readonly', category: 'creator' as const },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onRequestConnectIntegration?.({
                                id: item.id,
                                name: item.name,
                                category: item.category,
                                icon: item.id,
                                description: `External OAuth 2.0 connector for ${item.name}`,
                                status: 'coming_soon',
                                scopeRequired: item.scope,
                                configured: false,
                              });
                              onClose();
                            }}
                            className="p-2 rounded-lg bg-neutral-900/50 border border-neutral-800/70 hover:border-neutral-700 text-center cursor-pointer"
                          >
                            <Icon size={14} className="text-neutral-400 mx-auto mb-1" />
                            <div className="text-[10px] text-neutral-300 truncate">{item.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <FileUpload
            compact
            title="Drop files or photos directly here"
            subtitle="Images, PDFs, CSVs, code & audio (max 10MB)"
            onAttachmentReady={(att) => {
              onAddAttachment(att);
              onClose();
            }}
          />
        </div>
      </div>
    </>
  );
};
