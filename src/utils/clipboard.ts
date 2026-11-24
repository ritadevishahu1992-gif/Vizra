import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../components/ui/Toast';

/**
 * Cross-browser clipboard copy utility.
 * Uses the modern Async Clipboard API when available in a secure context,
 * with a reliable offscreen textarea + execCommand('copy') fallback for
 * embedded iframes or restricted browser permissions.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy textarea fallback (common in sandboxed iframes)
    }
  }

  if (typeof document === 'undefined') return false;

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const previousRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const succeeded = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (previousRange && selection) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }

    return Boolean(succeeded);
  } catch {
    return false;
  }
}

export interface UseCopyToClipboardOptions {
  resetDelayMs?: number;
  defaultLabel?: string;
}

/**
 * React hook for copying AI-generated output blocks to the clipboard
 * with synchronized icon confirmation and visual toast feedback.
 */
export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}) {
  const { resetDelayMs = 2000, defaultLabel = 'Content copied to clipboard.' } = options;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string, customDescription?: string): Promise<boolean> => {
      const ok = await copyTextToClipboard(text);
      if (ok) {
        setCopied(true);
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          setCopied(false);
          timerRef.current = null;
        }, resetDelayMs);

        toast({
          title: 'Copied to clipboard',
          description: customDescription || defaultLabel,
          type: 'success',
          durationMs: 2600,
        });
      } else {
        toast({
          title: 'Unable to copy automatically',
          description: 'Clipboard access was blocked by your browser. Please select and copy manually.',
          type: 'error',
          durationMs: 3600,
        });
      }
      return ok;
    },
    [defaultLabel, resetDelayMs, toast]
  );

  return { copied, copy };
}
