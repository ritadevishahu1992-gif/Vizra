import React, { useState } from 'react';
import { Copy, Check, RotateCw, ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageActionsProps {
  content: string;
  onRegenerate: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1 mt-3 pt-2 text-neutral-500 text-xs select-none">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
        title="Copy response"
        aria-label="Copy response"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>

      {/* Regenerate button */}
      <button
        onClick={onRegenerate}
        className="p-1.5 rounded-md hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
        title="Regenerate response"
        aria-label="Regenerate response"
      >
        <RotateCw size={14} />
      </button>

      {/* Good response */}
      <button
        onClick={() => setFeedback(feedback === 'good' ? null : 'good')}
        className={`p-1.5 rounded-md hover:bg-neutral-900 transition-colors cursor-pointer ${
          feedback === 'good' ? 'text-emerald-400 bg-neutral-900' : 'hover:text-white'
        }`}
        title="Good response"
        aria-label="Good response"
      >
        <ThumbsUp size={14} />
      </button>

      {/* Bad response */}
      <button
        onClick={() => setFeedback(feedback === 'bad' ? null : 'bad')}
        className={`p-1.5 rounded-md hover:bg-neutral-900 transition-colors cursor-pointer ${
          feedback === 'bad' ? 'text-red-400 bg-neutral-900' : 'hover:text-white'
        }`}
        title="Bad response"
        aria-label="Bad response"
      >
        <ThumbsDown size={14} />
      </button>

      {feedback && (
        <span className="text-[10px] text-neutral-500 ml-1 font-mono">
          Feedback recorded
        </span>
      )}
    </div>
  );
};
