import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parse code blocks vs standard text
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-neutral-200 text-sm md:text-base leading-relaxed break-words">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Code block
          const match = part.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)```$/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);

          return <CodeBlock key={index} code={code.trim()} language={lang} />;
        }

        // Render regular markdown text paragraphs and lists
        const paragraphs = part.split(/\n\n+/);
        return (
          <React.Fragment key={index}>
            {paragraphs.map((para, pIdx) => {
              const trimmed = para.trim();
              if (!trimmed) return null;

              // Headers
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={pIdx} className="text-lg font-semibold text-white tracking-tight mt-4 mb-2">
                    {renderInline(trimmed.replace(/^###\s+/, ''))}
                  </h3>
                );
              }
              if (trimmed.startsWith('#### ')) {
                return (
                  <h4 key={pIdx} className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mt-3 mb-1 font-mono">
                    {renderInline(trimmed.replace(/^####\s+/, ''))}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={pIdx} className="text-xl font-semibold text-white tracking-tight mt-5 mb-2">
                    {renderInline(trimmed.replace(/^##\s+/, ''))}
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={pIdx} className="text-2xl font-bold text-white tracking-tight mt-6 mb-3">
                    {renderInline(trimmed.replace(/^#\s+/, ''))}
                  </h1>
                );
              }

              // Blockquotes
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote
                    key={pIdx}
                    className="border-l-2 border-[#eb3b2d] pl-4 my-2 text-neutral-300 italic bg-neutral-900/30 py-1.5 rounded-r-md"
                  >
                    {renderInline(trimmed.replace(/^>\s*/, ''))}
                  </blockquote>
                );
              }

              // List items
              if (trimmed.split('\n').every(line => /^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line) || line.trim() === '')) {
                const lines = trimmed.split('\n');
                return (
                  <ul key={pIdx} className="space-y-1.5 pl-4 my-2 list-none">
                    {lines.map((line, lIdx) => {
                      const listText = line.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, '');
                      return (
                        <li key={lIdx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] mt-2 shrink-0" />
                          <span>{renderInline(listText)}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              // Normal paragraph with linebreaks
              return (
                <p key={pIdx} className="my-1.5 text-neutral-300">
                  {trimmed.split('\n').map((line, lIdx, arr) => (
                    <React.Fragment key={lIdx}>
                      {renderInline(line)}
                      {lIdx < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

function renderInline(text: string): React.ReactNode {
  // Process bold: **text**
  // Process inline code: `code`
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-xs text-[#eb3b2d]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-neutral-800 bg-[#0c0c0c] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/70 border-b border-neutral-800/80 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#eb3b2d]" />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          title="Copy to clipboard"
          aria-label="Copy code"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-neutral-200 leading-6 selection:bg-neutral-800">
        <code>{code}</code>
      </pre>
    </div>
  );
};
