import React, { useState, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Volume2,
  Table,
  File as FileIcon,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Attachment } from '../../types/ai';

export interface UploadedFileRecord {
  id: string;
  file: File;
  name: string;
  sizeLabel: string;
  mimeType: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  attachment?: Attachment;
}

export interface FileUploadProps {
  onAttachmentReady?: (attachment: Attachment) => void;
  onRemoveAttachment?: (id: string) => void;
  maxSizeMB?: number;
  accept?: string;
  multiple?: boolean;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

/**
 * 08 · Drag-and-Drop File Upload
 * Adapted from 21st.dev `file-upload` pattern with animated grid backdrop,
 * drag-over state, MIME/size validation, progress tracking, retry, and remove actions.
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  onAttachmentReady,
  onRemoveAttachment,
  maxSizeMB = 10,
  accept = 'image/*,video/*,audio/*,.pdf,.csv,.tsv,.txt,.md,.json,.ts,.tsx,.js,.py',
  multiple = true,
  compact = false,
  title = 'Upload Creative Assets & Documents',
  subtitle = 'Drag & drop images, PDFs, CSV datasets, audio, or code files here, or click to browse',
}) => {
  const [records, setRecords] = useState<UploadedFileRecord[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const detectAttachmentType = (file: File): Attachment['type'] => {
    const nameLower = file.name.toLowerCase();
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (nameLower.endsWith('.csv') || nameLower.endsWith('.tsv') || file.type.includes('csv')) {
      return 'csv';
    }
    if (file.type.includes('pdf') || nameLower.endsWith('.pdf')) return 'pdf';
    return 'document';
  };

  const processSingleFile = (file: File, existingId?: string) => {
    const recordId =
      existingId || `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const maxBytes = maxSizeMB * 1024 * 1024;
    const lowerName = file.name.toLowerCase().trim();
    const dotIdx = lowerName.lastIndexOf('.');
    const ext = dotIdx !== -1 ? lowerName.slice(dotIdx) : '';
    const blockedExtensions = new Set([
      '.svg',
      '.svgz',
      '.html',
      '.htm',
      '.xhtml',
      '.exe',
      '.dll',
      '.bat',
      '.cmd',
      '.sh',
      '.ps1',
      '.php',
      '.jsp',
      '.msi',
      '.jar',
    ]);
    const blockedMimes = new Set([
      'image/svg+xml',
      'text/html',
      'application/xhtml+xml',
      'application/x-msdownload',
      'application/x-sh',
    ]);

    if (
      blockedExtensions.has(ext) ||
      blockedMimes.has((file.type || '').toLowerCase()) ||
      file.name.includes('..') ||
      file.name.includes('/') ||
      file.name.includes('\\')
    ) {
      const blockedRecord: UploadedFileRecord = {
        id: recordId,
        file,
        name: file.name,
        sizeLabel: formatSize(file.size),
        mimeType: file.type || 'application/octet-stream',
        progress: 0,
        status: 'error',
        errorMessage: `Restricted file type (${ext || file.type || 'executable/script'}). Active script & executable uploads are blocked.`,
      };
      setRecords((prev) =>
        existingId
          ? prev.map((r) => (r.id === existingId ? blockedRecord : r))
          : [blockedRecord, ...prev]
      );
      return;
    }

    if (file.size > maxBytes) {
      const failedRecord: UploadedFileRecord = {
        id: recordId,
        file,
        name: file.name,
        sizeLabel: formatSize(file.size),
        mimeType: file.type || 'application/octet-stream',
        progress: 0,
        status: 'error',
        errorMessage: `Exceeds ${maxSizeMB}MB studio limit (${formatSize(file.size)})`,
      };
      setRecords((prev) =>
        existingId
          ? prev.map((r) => (r.id === existingId ? failedRecord : r))
          : [failedRecord, ...prev]
      );
      return;
    }

    const initialRecord: UploadedFileRecord = {
      id: recordId,
      file,
      name: file.name,
      sizeLabel: formatSize(file.size),
      mimeType: file.type || 'application/octet-stream',
      progress: 18,
      status: 'uploading',
    };

    setRecords((prev) =>
      existingId
        ? prev.map((r) => (r.id === existingId ? initialRecord : r))
        : [initialRecord, ...prev]
    );

    const attachmentType = detectAttachmentType(file);
    const reader = new FileReader();

    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const pct = Math.min(95, Math.round((ev.loaded / ev.total) * 100));
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, progress: pct } : r))
        );
      }
    };

    reader.onerror = () => {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? {
                ...r,
                status: 'error',
                progress: 0,
                errorMessage: 'Failed to read file stream. Click retry.',
              }
            : r
        )
      );
    };

    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : undefined;
      const isDataUrl = attachmentType === 'image' || attachmentType === 'pdf';

      const attachment: Attachment = {
        id: recordId,
        name: file.name,
        type: attachmentType,
        size: formatSize(file.size),
        previewUrl: isDataUrl ? resultStr : undefined,
        content: !isDataUrl ? resultStr : undefined,
      };

      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? {
                ...r,
                progress: 100,
                status: 'completed',
                attachment,
              }
            : r
        )
      );

      onAttachmentReady?.(attachment);
    };

    if (attachmentType === 'image' || attachmentType === 'pdf') {
      reader.readAsDataURL(file);
    } else if (attachmentType === 'csv' || attachmentType === 'document') {
      reader.readAsText(file);
    } else {
      // Binary audio/video metadata ingestion
      window.setTimeout(() => {
        const attachment: Attachment = {
          id: recordId,
          name: file.name,
          type: attachmentType,
          size: formatSize(file.size),
        };
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? { ...r, progress: 100, status: 'completed', attachment }
              : r
          )
        );
        onAttachmentReady?.(attachment);
      }, 280);
    }
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    const targetFiles = multiple ? filesArray : [filesArray[0]];
    targetFiles.forEach((f) => processSingleFile(f));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    onRemoveAttachment?.(id);
  };

  const getIconForType = (type?: Attachment['type']) => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'video':
        return Video;
      case 'audio':
        return Volume2;
      case 'csv':
        return Table;
      case 'pdf':
      case 'document':
        return FileText;
      default:
        return FileIcon;
    }
  };

  return (
    <div className="w-full space-y-3 select-none">
      {/* Dropzone Container */}
      <div
        role="button"
        tabIndex={0}
        aria-label={title}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={handleDrop}
        className={`relative group rounded-2xl border border-dashed transition-all duration-200 overflow-hidden cursor-pointer ${
          isDragActive
            ? 'border-[#DC2626] bg-[#DC2626]/[0.06]'
            : 'border-white/[0.14] hover:border-white/[0.28] bg-[#111111]'
        } ${compact ? 'p-4' : 'p-6 md:p-8'}`}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="sr-only"
        />

        {/* Subtle Architectural Grid Pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]"
        >
          <div className="grid grid-cols-12 gap-px bg-white/[0.04] h-full w-full">
            {Array.from({ length: 24 }).map((_, idx) => (
              <div
                key={idx}
                className={`h-8 ${
                  idx % 2 === 0 ? 'bg-[#090909]' : 'bg-[#111111]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Foreground Dropzone Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={isDragActive ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border mb-3 transition-colors ${
              isDragActive
                ? 'bg-[#DC2626] text-white border-[#DC2626]'
                : 'bg-[#171717] text-neutral-300 border-white/[0.1] group-hover:border-[#DC2626]/50 group-hover:text-white'
            }`}
          >
            <Upload size={18} />
          </motion.div>

          <p className="text-xs md:text-sm font-semibold text-white tracking-tight">
            {isDragActive ? 'Release to ingest files into VIZRA' : title}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1 max-w-md leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono text-neutral-500">
            <span className="px-2 py-0.5 rounded bg-[#090909] border border-white/[0.06]">
              PNG · JPG · WEBP
            </span>
            <span className="px-2 py-0.5 rounded bg-[#090909] border border-white/[0.06]">
              PDF · TXT · MD
            </span>
            <span className="px-2 py-0.5 rounded bg-[#090909] border border-white/[0.06]">
              CSV · JSON · CODE
            </span>
            <span className="px-2 py-0.5 rounded bg-[#090909] border border-[#DC2626]/30 text-[#EB3B2D]">
              Max {maxSizeMB}MB
            </span>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {records.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {records.map((rec) => {
              const Icon = getIconForType(rec.attachment?.type);
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-[#111111] border border-white/[0.08] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {rec.attachment?.type === 'image' && rec.attachment.previewUrl ? (
                      <img
                        src={rec.attachment.previewUrl}
                        alt={rec.name}
                        className="w-9 h-9 rounded-lg object-cover border border-white/[0.1] shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#171717] border border-white/[0.08] flex items-center justify-center text-[#EB3B2D] shrink-0">
                        <Icon size={16} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white truncate">
                          {rec.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                          {rec.sizeLabel}
                        </span>
                      </div>

                      {rec.status === 'uploading' && (
                        <div className="mt-1.5 w-full h-1 rounded-full bg-neutral-900 overflow-hidden">
                          <div
                            className="h-full bg-[#DC2626] transition-all duration-200"
                            style={{ width: `${rec.progress}%` }}
                          />
                        </div>
                      )}

                      {rec.status === 'completed' && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-emerald-400">
                          <CheckCircle2 size={11} />
                          <span>Ready in Workspace</span>
                        </div>
                      )}

                      {rec.status === 'error' && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-[#EB3B2D]">
                          <AlertCircle size={11} />
                          <span>{rec.errorMessage || 'Upload failed'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Retry / Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    {rec.status === 'error' && (
                      <button
                        type="button"
                        onClick={() => processSingleFile(rec.file, rec.id)}
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="Retry upload"
                        aria-label={`Retry uploading ${rec.name}`}
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(rec.id)}
                      className="p-1.5 rounded-lg hover:bg-red-950/40 text-neutral-500 hover:text-[#EB3B2D] transition-colors cursor-pointer"
                      title="Remove file"
                      aria-label={`Remove ${rec.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
