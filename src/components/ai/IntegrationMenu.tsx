import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  File,
  Sparkles,
  Film,
  Layers,
  Search,
  ChevronRight,
  HardDrive,
  FileSpreadsheet,
  Github,
  Figma,
  Palette,
  Youtube,
  Presentation,
  Table,
  X,
  FileCheck,
  CheckCircle,
  Lock,
  Music,
} from 'lucide-react';
import { Attachment, Integration } from '../../types/ai';
import { FileUpload } from '../ui/FileUpload';

interface IntegrationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAttachment: (attachment: Attachment) => void;
  onSelectCreativeMode: (modeTitle: string) => void;
  onOpenCreationTools?: () => void;
  onRequestConnectIntegration?: (integration: Integration) => void;
  onOpenMusicStudio?: () => void;
}

export const IntegrationMenu: React.FC<IntegrationMenuProps> = ({
  isOpen,
  onClose,
  onAddAttachment,
  onSelectCreativeMode,
  onOpenCreationTools,
  onRequestConnectIntegration,
  onOpenMusicStudio,
}) => {
  const [comingSoonNotice, setComingSoonNotice] = useState<string | null>(null);
  const [activeUploadAccept, setActiveUploadAccept] = useState<string>('*');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

    if (file.size > maxSizeBytes) {
      setComingSoonNotice(`File "${file.name}" exceeds the 10MB limit.`);
      return;
    }

    const fileNameLower = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isPdf = file.type.includes('pdf') || fileNameLower.endsWith('.pdf');
    const isCsv = fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.tsv') || file.type.includes('csv');
    const isText =
      file.type.startsWith('text/') ||
      fileNameLower.endsWith('.txt') ||
      fileNameLower.endsWith('.md') ||
      fileNameLower.endsWith('.json') ||
      fileNameLower.endsWith('.ts') ||
      fileNameLower.endsWith('.js') ||
      fileNameLower.endsWith('.py');

    const attachmentType: Attachment['type'] = isImage
      ? 'image'
      : isVideo
      ? 'video'
      : isAudio
      ? 'audio'
      : isCsv
      ? 'csv'
      : isPdf
      ? 'pdf'
      : 'document';

    // 1. Image handling: Create Data URL for preview and inline multimodal processing
    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onAddAttachment({
          id: Date.now().toString(),
          name: file.name,
          type: 'image',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          previewUrl: dataUrl,
        });
      };
      reader.onerror = () => {
        console.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
      onClose();
      return;
    }

    // 2. PDF handling: Read as Data URL (Base64) for native document comprehension
    if (isPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onAddAttachment({
          id: Date.now().toString(),
          name: file.name,
          type: 'pdf',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          previewUrl: dataUrl,
        });
      };
      reader.onerror = () => {
        console.error('Failed to read PDF file');
      };
      reader.readAsDataURL(file);
      onClose();
      return;
    }

    // 3. Text, CSV, Markdown, Code handling: Extract real text content directly
    if (isCsv || isText || file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = () => {
        const textContent = (reader.result as string) || '';
        onAddAttachment({
          id: Date.now().toString(),
          name: file.name,
          type: isCsv ? 'csv' : 'document',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content: textContent,
        });
      };
      reader.onerror = () => {
        console.error('Failed to read text/document file');
      };
      reader.readAsText(file);
      onClose();
      return;
    }

    // Default fallback for other file formats
    const attachment: Attachment = {
      id: Date.now().toString(),
      name: file.name,
      type: attachmentType,
      size: `${(file.size / 1024).toFixed(1)} KB`,
    };

    onAddAttachment(attachment);
    onClose();
  };

  const triggerUpload = (acceptPattern: string = '*') => {
    setActiveUploadAccept(acceptPattern);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const showComingSoon = (name: string) => {
    setComingSoonNotice(`${name} integration is in development and coming soon.`);
    setTimeout(() => setComingSoonNotice(null), 3000);
  };

  return (
    <>
      {/* Hidden Native File Input */}
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
              Add to Omnia Workspace
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Attach files, connect platforms, or launch creation tools.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Temporary Notice */}
        {comingSoonNotice && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>{comingSoonNotice}</span>
            </div>
            <span className="text-[10px] font-mono text-[#eb3b2d] uppercase">Coming Soon</span>
          </div>
        )}

        {/* Scrollable Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* SECTION 1: ATTACH */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2 px-1 flex items-center justify-between">
              <span>ATTACH & DRAG-AND-DROP</span>
              <span className="text-emerald-500 text-[9px]">READY</span>
            </div>
            <div className="mb-2.5">
              <FileUpload
                compact
                title="Drop files directly into Omnia"
                subtitle="Or click to browse images, PDFs, CSVs, and code (max 10MB)"
                onAttachmentReady={(att) => {
                  onAddAttachment(att);
                  onClose();
                }}
              />
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => triggerUpload('*')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/80 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-white">
                    <File size={14} className="text-[#eb3b2d]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">File</div>
                    <div className="text-[11px] text-neutral-500">Any code, zip, audio or generic document</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-600 group-hover:text-neutral-400" />
              </button>

              <button
                type="button"
                onClick={() => triggerUpload('image/*')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/80 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-white">
                    <ImageIcon size={14} className="text-[#eb3b2d]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">Image</div>
                    <div className="text-[11px] text-neutral-500">PNG, JPG, WebP, SVG compositions</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-600 group-hover:text-neutral-400" />
              </button>

              <button
                type="button"
                onClick={() => triggerUpload('.pdf,.doc,.docx,.txt,.csv,.xlsx')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/80 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-white">
                    <FileText size={14} className="text-[#eb3b2d]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">Document</div>
                    <div className="text-[11px] text-neutral-500">PDF, TXT, CSV, Sheets & Word specs</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-600 group-hover:text-neutral-400" />
              </button>
            </div>
          </div>

          {/* SECTION 2: CONNECT */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2 px-1 flex items-center justify-between">
              <span>CONNECT</span>
              <span className="text-neutral-500 text-[9px]">COMING SOON</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Google Drive', icon: HardDrive },
                { name: 'Google Docs', icon: FileText },
                { name: 'Google Sheets', icon: FileSpreadsheet },
                { name: 'GitHub', icon: Github },
                { name: 'Figma', icon: Figma },
                { name: 'Canva', icon: Palette },
                { name: 'Notion', icon: FileCheck },
                { name: 'Dropbox', icon: HardDrive },
                { name: 'YouTube', icon: Youtube },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => showComingSoon(item.name)}
                    className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-all text-center group cursor-pointer"
                  >
                    <Icon size={16} className="text-neutral-400 group-hover:text-white mx-auto mb-1" />
                    <div className="text-[11px] font-medium text-neutral-300 truncate">{item.name}</div>
                    <span className="text-[9px] font-mono text-[#eb3b2d] block mt-0.5">Coming Soon</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: CREATE */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2 px-1 flex items-center justify-between">
              <span>CREATE</span>
              <span className="text-white text-[9px]">WORKFLOWS</span>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onSelectCreativeMode('Generate an obsidian aesthetic image concept');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/80 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-white">
                    <Sparkles size={14} className="text-[#eb3b2d]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">Image</div>
                    <div className="text-[11px] text-neutral-500">Visual prompt synthesizer & diffusion aesthetics</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">Launch</span>
              </button>

              <button
                type="button"
                onClick={() => showComingSoon('Video Generation')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/80 transition-colors group cursor-pointer text-left opacity-75"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                    <Video size={14} className="text-neutral-500" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">Video</div>
                    <div className="text-[11px] text-neutral-500">Kinetic temporal rendering & scene synthesis</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#eb3b2d]">Coming Soon</span>
              </button>

              {/* AI Music Studio Generator (Lyria 3) */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenMusicStudio) {
                    onOpenMusicStudio();
                  } else {
                    onSelectCreativeMode('Generate custom music soundtrack with Lyria');
                  }
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/80 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-white">
                    <Music size={14} className="text-[#eb3b2d]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">AI Music Studio</div>
                    <div className="text-[11px] text-neutral-500">Custom soundtracks, jingles & background audio (Lyria 3)</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#eb3b2d]">Launch</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCreativeMode('Create a structured project specification document');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/80 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-white">
                    <FileText size={14} className="text-[#eb3b2d]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">Document</div>
                    <div className="text-[11px] text-neutral-500">Product requirements, briefs & technical specs</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">Launch</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCreativeMode('Create a multi-slide presentation outline');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/80 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-white">
                    <Presentation size={14} className="text-[#eb3b2d]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">Presentation</div>
                    <div className="text-[11px] text-neutral-500">Slide decks, pitch narratives & talking points</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">Launch</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
