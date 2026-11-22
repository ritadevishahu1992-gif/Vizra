import katex, { type KatexOptions } from 'katex';

export interface RenderLatexOptions {
  /** Render in display (block) mode rather than inline mode. Default: false */
  displayMode?: boolean;
  /** Throw on invalid LaTeX instead of rendering an inline error fallback. Default: false */
  throwOnError?: boolean;
  /** Color used for syntax errors when throwOnError is false. Default: '#eb3b2d' */
  errorColor?: string;
  /** Custom KaTeX macro definitions. */
  macros?: Record<string, string>;
  /** Output format ('html', 'mathml', or 'htmlAndMathml'). Default: 'htmlAndMathml' */
  output?: KatexOptions['output'];
  /** Strictness mode for KaTeX warnings/errors. Default: false */
  strict?: KatexOptions['strict'];
  /** Whether to trust potentially unsafe LaTeX commands. Default: false */
  trust?: boolean;
  /** Optional CSS class names applied to a wrapper element when provided. */
  className?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unwrapMathDelimiters(
  input: string,
  explicitDisplayMode?: boolean,
): { expression: string; displayMode: boolean } {
  const trimmed = input.trim();

  if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
    const inner = trimmed.slice(2, -2);
    if (!/(?<!\\)\$\$/.test(inner)) {
      return {
        expression: inner.trim(),
        displayMode: explicitDisplayMode ?? true,
      };
    }
  }

  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length > 4) {
    const inner = trimmed.slice(2, -2);
    return {
      expression: inner.trim(),
      displayMode: explicitDisplayMode ?? true,
    };
  }

  if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)') && trimmed.length > 4) {
    const inner = trimmed.slice(2, -2);
    return {
      expression: inner.trim(),
      displayMode: explicitDisplayMode ?? false,
    };
  }

  if (
    trimmed.startsWith('$') &&
    trimmed.endsWith('$') &&
    trimmed.length > 2 &&
    !trimmed.startsWith('$$')
  ) {
    const inner = trimmed.slice(1, -1);
    if (!/(?<!\\)\$/.test(inner)) {
      return {
        expression: inner.trim(),
        displayMode: explicitDisplayMode ?? false,
      };
    }
  }

  return {
    expression: trimmed,
    displayMode: explicitDisplayMode ?? false,
  };
}

/**
 * Renders a LaTeX math expression into an HTML string using KaTeX,
 * configured with safe defaults and VIZRA theme-compatible styling.
 */
export function renderLatexToHtml(
  expression: string,
  options: RenderLatexOptions = {},
): string {
  if (!expression || !expression.trim()) {
    return '';
  }

  const {
    displayMode,
    throwOnError = false,
    errorColor = '#eb3b2d',
    macros,
    output = 'htmlAndMathml',
    strict = false,
    trust = false,
    className,
  } = options;

  const unwrapped = unwrapMathDelimiters(expression, displayMode);
  if (!unwrapped.expression) {
    return '';
  }

  try {
    const html = katex.renderToString(unwrapped.expression, {
      displayMode: unwrapped.displayMode,
      throwOnError,
      errorColor,
      macros,
      output,
      strict,
      trust,
    });

    if (className) {
      const tag = unwrapped.displayMode ? 'div' : 'span';
      return `<${tag} class="${escapeHtml(className)}">${html}</${tag}>`;
    }

    return html;
  } catch (error) {
    if (throwOnError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : 'Invalid LaTeX expression';
    return `<span class="katex-error" title="${escapeHtml(message)}">${escapeHtml(
      unwrapped.expression,
    )}</span>`;
  }
}
