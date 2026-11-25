import React from 'react';
import { X, Image as ImageIcon, Video, FileText, Volume2, Table } from 'lucide-react';
import { Attachment } from '../../types/ai';

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  onRemove,
}) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pt-3 pb-2 border-b border-[#23232A]">
      {attachments.map((file) => (
        <div
          key={file.id}
          className="inline-flex items-center gap-2.5 pl-2.5 pr-1.5 py-1.5 rounded-2xl bg-[#1B1B21] border border-[#27272F] text-xs text-zinc-200 group transition-colors hover:border-[#DC143C]/40"
        >
          {file.type === 'image' ? (
            file.previewUrl ? (
              <img
                src={file.previewUrl}
                alt={file.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-lg object-cover border border-[#27272F] shrink-0"
              />
            ) : (
              <ImageIcon size={14} className="text-[#DC143C] shrink-0" />
            )
          ) : file.type === 'video' ? (
            <Video size={14} className="text-[#DC143C] shrink-0" />
          ) : file.type === 'audio' ? (
            <Volume2 size={14} className="text-[#DC143C] shrink-0" />
          ) : file.type === 'csv' ? (
            <Table size={14} className="text-[#DC143C] shrink-0" />
          ) : (
            <FileText size={14} className="text-[#DC143C] shrink-0" />
          )}

          <div className="flex flex-col min-w-0">
            <span className="font-medium text-[11px] text-zinc-100 truncate max-w-[150px]">
              {file.name}
            </span>
            {file.size && (
              <span className="text-[10px] text-zinc-500 font-mono tabular-nums">
                {file.size}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="w-6 h-6 rounded-full hover:bg-[#23232A] text-zinc-400 hover:text-white flex items-center justify-center transition-colors ml-0.5 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#DC143C]"
            aria-label={`Remove ${file.name}`}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
};

