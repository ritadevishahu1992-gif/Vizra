import React from 'react';
import { X, Image as ImageIcon, Video, FileText, File } from 'lucide-react';
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
    <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 border-b border-neutral-800/60">
      {attachments.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 group"
        >
          {file.type === 'image' ? (
            file.previewUrl ? (
              <img
                src={file.previewUrl}
                alt={file.name}
                className="w-5 h-5 rounded object-cover"
              />
            ) : (
              <ImageIcon size={14} className="text-[#eb3b2d]" />
            )
          ) : file.type === 'video' ? (
            <Video size={14} className="text-[#eb3b2d]" />
          ) : (
            <FileText size={14} className="text-[#eb3b2d]" />
          )}

          <div className="flex flex-col">
            <span className="font-mono text-[11px] truncate max-w-[130px]">
              {file.name}
            </span>
            {file.size && (
              <span className="text-[9px] text-neutral-500 font-mono">
                {file.size}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors ml-1 cursor-pointer"
            aria-label={`Remove ${file.name}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};
