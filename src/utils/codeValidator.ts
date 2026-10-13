/**
 * Static Code Verification & Sanity Checking Utility
 * Inspects generated code snippets for common syntax mistakes, unclosed brackets/tags,
 * and syntax errors to verify code quality.
 */

export interface CodeValidationReport {
  isValid: boolean;
  language: string;
  issues: string[];
  snippet: string;
}

export function validateCodeSnippet(code: string, languageHint?: string): CodeValidationReport {
  const issues: string[] = [];
  const trimmed = code.trim();

  // Detect language if not provided
  let lang = languageHint?.toLowerCase() || '';
  if (!lang) {
    if (trimmed.includes('def ') || trimmed.includes('import ') && trimmed.includes(':')) lang = 'python';
    else if (trimmed.includes('interface ') || trimmed.includes(': string') || trimmed.includes('const ') || trimmed.includes('function ')) lang = 'typescript';
    else if (trimmed.startsWith('{') && trimmed.endsWith('}')) lang = 'json';
    else if (/SELECT\s+.*\s+FROM/i.test(trimmed)) lang = 'sql';
    else lang = 'general';
  }

  // 1. Bracket Matching Check
  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  let inString: string | null = null;
  let isEscaped = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      continue;
    }

    // Ignore single line comments
    if (ch === '/' && trimmed[i + 1] === '/') {
      const nextNewline = trimmed.indexOf('\n', i);
      i = nextNewline === -1 ? trimmed.length : nextNewline;
      continue;
    }
    if (ch === '#' && lang === 'python') {
      const nextNewline = trimmed.indexOf('\n', i);
      i = nextNewline === -1 ? trimmed.length : nextNewline;
      continue;
    }

    if (ch === '(' || ch === '{' || ch === '[') {
      stack.push(ch);
    } else if (ch === ')' || ch === '}' || ch === ']') {
      const last = stack.pop();
      if (last !== pairs[ch]) {
        issues.push(`Mismatched bracket: found '${ch}' without corresponding '${pairs[ch]}'`);
        break;
      }
    }
  }

  if (stack.length > 0) {
    issues.push(`Unclosed bracket(s): ${stack.join(', ')}`);
  }

  // 2. JSON Validation Check
  if (lang === 'json') {
    try {
      JSON.parse(trimmed);
    } catch (e: any) {
      issues.push(`Invalid JSON syntax: ${e.message}`);
    }
  }

  // 3. Python specific checks
  if (lang === 'python') {
    const lines = trimmed.split('\n');
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (
        (line.startsWith('def ') ||
          line.startsWith('class ') ||
          line.startsWith('if ') ||
          line.startsWith('elif ') ||
          line.startsWith('else') ||
          line.startsWith('for ') ||
          line.startsWith('while ') ||
          line.startsWith('try') ||
          line.startsWith('except')) &&
        !line.endsWith(':') &&
        !line.includes('#')
      ) {
        issues.push(`Line ${idx + 1}: Missing colon ':' at end of statement '${line}'`);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    language: lang,
    issues,
    snippet: trimmed,
  };
}
