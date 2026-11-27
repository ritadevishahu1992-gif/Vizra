import React from 'react';
import { renderLatexToHtml } from '../../lib/katex';
import type { BlogSource } from '../../data/blog/types';

interface BlogRichTextProps {
  text: string;
  sources?: BlogSource[];
  className?: string;
}

type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'math'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'citation'; ids: number[] };

/**
 * Tokenizes editorial prose containing inline LaTeX ($...$), inline code (`...`),
 * bold (**...**), italic (*...*), and citation groups ([1], [1, 2], [4][5]).
 */
function tokenizeInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Order matters: math ($...$), inline code (`...`), bold (**...**), citations ([1] or [1, 2]), italic (*...*)
  const pattern =
    /(?<!\\)\$([^$\n]+?)(?<!\\)\$|`([^`\n]+?)`|\*\*([^*\n]+?)\*\*|\[(\d+(?:\s*,\s*\d+)*)\]|\*([^*\n]+?)\*/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: 'text', value: input.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      tokens.push({ kind: 'math', value: match[1] });
    } else if (match[2] !== undefined) {
      tokens.push({ kind: 'code', value: match[2] });
    } else if (match[3] !== undefined) {
      tokens.push({ kind: 'bold', value: match[3] });
    } else if (match[4] !== undefined) {
      const ids = match[4]
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      tokens.push({ kind: 'citation', ids });
    } else if (match[5] !== undefined) {
      tokens.push({ kind: 'italic', value: match[5] });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < input.length) {
    tokens.push({ kind: 'text', value: input.slice(lastIndex) });
  }

  return tokens;
}

export const BlogRichText: React.FC<BlogRichTextProps> = ({
  text,
  sources,
  className,
}) => {
  const sourceMap = React.useMemo(() => {
    const map = new Map<number, BlogSource>();
    if (sources) {
      for (const s of sources) {
        map.set(s.id, s);
      }
    }
    return map;
  }, [sources]);

  const tokens = React.useMemo(() => tokenizeInline(text), [text]);

  return (
    <span className={className}>
      {tokens.map((token, idx) => {
        if (token.kind === 'text') {
          return (
            <React.Fragment key={idx}>
              {token.value.replace(/\\\$/g, '$')}
            </React.Fragment>
          );
        }

        if (token.kind === 'math') {
          const html = renderLatexToHtml(token.value, {
            displayMode: false,
            throwOnError: false,
            trust: false,
          });
          return (
            <span
              key={idx}
              className="inline-block align-baseline mx-0.5 text-neutral-900 dark:text-neutral-100"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (token.kind === 'code') {
          return (
            <code
              key={idx}
              className="font-mono text-[0.86em] px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-white/[0.06] text-neutral-900 dark:text-neutral-200 border border-neutral-300/60 dark:border-white/[0.08]"
            >
              {token.value}
            </code>
          );
        }

        if (token.kind === 'bold') {
          return (
            <strong
              key={idx}
              className="font-semibold text-neutral-950 dark:text-white"
            >
              <BlogRichText text={token.value} sources={sources} />
            </strong>
          );
        }

        if (token.kind === 'italic') {
          return (
            <em key={idx} className="italic text-neutral-800 dark:text-neutral-200">
              {token.value}
            </em>
          );
        }

        // Citation group
        return (
          <sup key={idx} className="ml-0.5 font-mono text-[0.72em] leading-none">
            {token.ids.map((id, i) => {
              const source = sourceMap.get(id);
              const label = source ? `[${id}] ${source.title}` : `Source ${id}`;
              return (
                <React.Fragment key={id}>
                  {i > 0 && <span className="text-neutral-500">,</span>}
                  <a
                    href={`#source-${id}`}
                    title={label}
                    aria-label={`Jump to citation ${label}`}
                    className="text-[#EB3B2D] hover:text-neutral-950 dark:hover:text-white transition-colors px-[1px] underline-offset-2 hover:underline"
                  >
                    [{id}]
                  </a>
                </React.Fragment>
              );
            })}
          </sup>
        );
      })}
    </span>
  );
};
