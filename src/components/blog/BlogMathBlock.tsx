import React from 'react';
import { renderLatexToHtml } from '../../lib/katex';

interface BlogMathBlockProps {
  latex: string;
  caption?: string;
}

export const BlogMathBlock: React.FC<BlogMathBlockProps> = ({
  latex,
  caption,
}) => {
  const html = React.useMemo(
    () =>
      renderLatexToHtml(latex, {
        displayMode: true,
        throwOnError: false,
        trust: false,
      }),
    [latex]
  );

  return (
    <figure className="my-7">
      <div
        className="w-full overflow-x-auto rounded-xl bg-neutral-100/90 dark:bg-[#101010] border border-neutral-200 dark:border-white/[0.08] px-4 py-4 sm:px-6 sm:py-5 text-neutral-900 dark:text-neutral-100"
        aria-label={caption || 'Mathematical formula'}
      >
        <div
          className="min-w-min text-center [&_.katex-display]:!m-0 [&_.katex-display]:!p-0 [&_.katex-display]:!border-0 [&_.katex-display]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {caption && (
        <figcaption className="mt-2.5 text-xs font-mono text-neutral-500 dark:text-neutral-400 tracking-wide">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
