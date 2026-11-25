import React from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useCopyToClipboard } from '../../utils/clipboard';

interface MarkdownRendererProps {
  content: string;
}

interface BlockItem {
  type: 'code' | 'table' | 'header' | 'blockquote' | 'list' | 'paragraph';
  content: string;
  language?: string;
  level?: number;
  items?: Array<{ text: string; indent: number; isOrdered: boolean; orderNumber?: string }>;
  tableData?: { headers: string[]; rows: string[][] };
}

/**
 * Robust, production-grade Markdown Renderer for OMNIA 1.0
 * Handles:
 * - Completed and streaming/unclosed code blocks
 * - Markdown tables (| col | col |)
 * - Ordered and unordered nested lists
 * - Safe hyperlinks with XSS protection
 * - Headers, blockquotes, inline formatting (bold, italic, code)
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-3 text-neutral-200 text-sm md:text-base leading-relaxed break-words">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <CodeBlock key={idx} code={block.content} language={block.language} />;
        }

        if (block.type === 'table' && block.tableData) {
          return <TableBlock key={idx} tableData={block.tableData} />;
        }

        if (block.type === 'header') {
          const Tag = (
            block.level === 1 ? 'h1' :
            block.level === 2 ? 'h2' :
            block.level === 3 ? 'h3' : 'h4'
          ) as keyof React.JSX.IntrinsicElements;

          const headerClass =
            block.level === 1 ? 'text-2xl font-bold text-white tracking-tight mt-6 mb-3' :
            block.level === 2 ? 'text-xl font-semibold text-white tracking-tight mt-5 mb-2' :
            block.level === 3 ? 'text-lg font-semibold text-white tracking-tight mt-4 mb-2' :
            'text-sm font-semibold text-neutral-300 uppercase tracking-wider mt-3 mb-1 font-mono';

          return (
            <Tag key={idx} className={headerClass}>
              {renderInline(block.content)}
            </Tag>
          );
        }

        if (block.type === 'blockquote') {
          return <BlockquoteBlock key={idx} content={block.content} />;
        }

        if (block.type === 'list' && block.items) {
          return (
            <ul key={idx} className="space-y-1.5 my-2 list-none pl-1">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className={`flex items-start gap-2.5 ${item.indent > 0 ? 'ml-5' : ''}`}
                >
                  {item.isOrdered ? (
                    <span className="font-mono text-xs font-semibold text-[#eb3b2d] shrink-0 mt-0.5 min-w-[1.2rem]">
                      {item.orderNumber}.
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] mt-2 shrink-0" />
                  )}
                  <span className="text-neutral-300 flex-1 leading-relaxed">
                    {renderInline(item.text)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // Paragraph
        return (
          <p key={idx} className="my-1.5 text-neutral-300 leading-relaxed">
            {block.content.split('\n').map((line, lIdx, arr) => (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

function parseBlocks(rawText: string): BlockItem[] {
  const blocks: BlockItem[] = [];

  // Extract code blocks (including unclosed code blocks during streaming)
  const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)(?:```|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = rawText.slice(lastIndex, match.index);
      blocks.push(...parseTextBlocks(textChunk));
    }

    const lang = match[1] || '';
    const code = match[2] || '';
    blocks.push({
      type: 'code',
      content: code.trim(),
      language: lang,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length) {
    const remainingText = rawText.slice(lastIndex);
    blocks.push(...parseTextBlocks(remainingText));
  }

  return blocks;
}

function parseTextBlocks(text: string): BlockItem[] {
  const items: BlockItem[] = [];
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // 1. Table detection (header + separator + data rows)
    const lines = trimmed.split('\n');
    if (lines.length >= 2 && lines[0].includes('|') && /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(lines[1])) {
      const tableData = parseTableData(lines);
      if (tableData) {
        items.push({
          type: 'table',
          content: trimmed,
          tableData,
        });
        continue;
      }
    }

    // 2. Headers
    if (/^#{1,4}\s+/.test(trimmed)) {
      const headerMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (headerMatch) {
        items.push({
          type: 'header',
          level: headerMatch[1].length,
          content: headerMatch[2],
        });
        continue;
      }
    }

    // 3. Blockquotes
    if (trimmed.startsWith('>')) {
      const bqText = lines.map((l) => l.replace(/^>\s?/, '')).join('\n');
      items.push({
        type: 'blockquote',
        content: bqText,
      });
      continue;
    }

    // 4. Mixed lines containing lists or pure lists
    const isList = lines.some((l) => /^\s*([-*]|\d+\.)\s+/.test(l));
    if (isList) {
      let currentNonList: string[] = [];
      let currentList: Array<{ text: string; indent: number; isOrdered: boolean; orderNumber?: string }> = [];

      for (const line of lines) {
        const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (listMatch) {
          if (currentNonList.length > 0) {
            items.push({
              type: 'paragraph',
              content: currentNonList.join('\n'),
            });
            currentNonList = [];
          }
          const indentSpaces = listMatch[1].length;
          const marker = listMatch[2];
          const isOrdered = /^\d+\./.test(marker);
          const orderNum = isOrdered ? marker.replace('.', '') : undefined;
          currentList.push({
            indent: indentSpaces >= 2 ? 1 : 0,
            isOrdered,
            orderNumber: orderNum,
            text: listMatch[3],
          });
        } else {
          if (currentList.length > 0) {
            items.push({
              type: 'list',
              content: '',
              items: currentList,
            });
            currentList = [];
          }
          currentNonList.push(line);
        }
      }

      if (currentList.length > 0) {
        items.push({
          type: 'list',
          content: '',
          items: currentList,
        });
      }
      if (currentNonList.length > 0) {
        items.push({
          type: 'paragraph',
          content: currentNonList.join('\n'),
        });
      }
      continue;
    }

    // 5. Standard paragraph
    items.push({
      type: 'paragraph',
      content: trimmed,
    });
  }

  return items;
}

function parseTableData(lines: string[]): { headers: string[]; rows: string[][] } | null {
  try {
    const parseRow = (line: string) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
      if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
      return trimmed.split('|').map((c) => c.trim());
    };

    const headers = parseRow(lines[0]);
    const rows: string[][] = [];

    for (let i = 2; i < lines.length; i++) {
      if (!lines[i].trim() || !lines[i].includes('|')) continue;
      rows.push(parseRow(lines[i]));
    }

    return { headers, rows };
  } catch {
    return null;
  }
}

/**
 * Safely parses inline markdown:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Inline code: `code`
 * - Safe hyperlinks: [text](url) with javascript: filtering
 */
function renderInline(text: string): React.ReactNode {
  // Regex to match code, bold, links, italic (inner link groups are non-capturing so split() does not duplicate text)
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\[(?:[^\]]+)\]\((?:[^)]+)\)|\*[^*]+\*|_[^_]+_)/g;
  const parts = text.split(inlineRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Inline code
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-xs text-[#eb3b2d]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      if (part.length > 4) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
    }

    // Safe Markdown Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      let href = linkMatch[2].trim();

      // XSS Protection: Allow only https:, http:, mailto:, or safe internal relative paths (/...)
      const isInternalPath = href.startsWith('/') && !href.startsWith('//');
      const isSafeExternal = /^(https?:\/\/|mailto:)/i.test(href);
      if (!isInternalPath && !isSafeExternal) {
        href = '#';
      }

      if (isInternalPath) {
        return (
          <Link
            key={i}
            to={href}
            className="inline-flex items-center gap-1 text-[#eb3b2d] hover:text-[#ff5242] underline underline-offset-2 transition-colors font-medium"
          >
            <span>{label}</span>
          </Link>
        );
      }

      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#eb3b2d] hover:text-[#ff5242] underline underline-offset-2 transition-colors font-medium"
        >
          <span>{label}</span>
          <ExternalLink size={11} className="inline shrink-0" />
        </a>
      );
    }

    // Italic
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      if (part.length > 2) {
        return (
          <em key={i} className="italic text-neutral-200">
            {part.slice(1, -1)}
          </em>
        );
      }
    }

    return part;
  });
}

const BlockquoteBlock: React.FC<{ content: string }> = ({ content }) => {
  const { copied, copy } = useCopyToClipboard({
    defaultLabel: 'Quote block copied to clipboard.',
  });

  return (
    <div className="group relative my-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 px-4 py-3">
      <blockquote className="pr-14 text-neutral-300 italic leading-relaxed">
        {renderInline(content)}
      </blockquote>
      <button
        type="button"
        onClick={() => copy(content, 'Quoted insight copied to clipboard.')}
        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono text-neutral-400 hover:text-white opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer"
        title="Copy quote"
        aria-label="Copy quote to clipboard"
      >
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
};

const TableBlock: React.FC<{ tableData: { headers: string[]; rows: string[][] } }> = ({ tableData }) => {
  const { copied, copy } = useCopyToClipboard({
    defaultLabel: 'Table data copied to clipboard.',
  });

  const handleCopyTable = () => {
    const tsvLines = [
      tableData.headers.join('\t'),
      ...tableData.rows.map((row) => row.join('\t')),
    ];
    void copy(
      tsvLines.join('\n'),
      `Table (${tableData.rows.length} rows × ${tableData.headers.length} columns) copied to clipboard.`
    );
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-neutral-800 bg-[#0c0c0c]/80">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/70 border-b border-neutral-800/80 text-xs font-mono text-neutral-400">
        <span>
          Table · {tableData.rows.length} {tableData.rows.length === 1 ? 'row' : 'rows'}
        </span>
        <button
          type="button"
          onClick={handleCopyTable}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Copy table to clipboard"
          aria-label="Copy table to clipboard"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy Table'}</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm text-neutral-300">
          <thead className="bg-neutral-900/60 text-white font-semibold border-b border-neutral-800">
            <tr>
              {tableData.headers.map((h, idx) => (
                <th key={idx} className="px-4 py-2.5 font-mono text-xs uppercase tracking-wider">
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-sans">
            {tableData.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-neutral-900/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2 leading-relaxed">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const { copied, copy } = useCopyToClipboard({
    defaultLabel: `${language ? `${language.toUpperCase()} code` : 'Code block'} copied to clipboard.`,
  });

  const handleCopy = () => {
    void copy(
      code,
      `${language ? `${language.toUpperCase()} code block` : 'Code block'} copied to clipboard.`
    );
  };

  return (
    <div
      data-keep-dark="true"
      className="my-3 rounded-xl border border-neutral-800 bg-[#0c0c0c] overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/70 border-b border-neutral-800/80 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#eb3b2d]" />
          <span>{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Copy code to clipboard"
          aria-label="Copy code to clipboard"
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
