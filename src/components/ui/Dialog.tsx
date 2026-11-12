import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, AlertTriangle, Sparkles, Share2, Download } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  badge?: string;
  preventBackdropClose?: boolean;
}

const MAX_WIDTH_CLASSES: Record<NonNullable<DialogProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

/**
 * 10 · Accessible Dialog / Modal
 * Adapted from 21st.dev `dialog` pattern with focus trapping, Escape key handling,
 * scroll locking, ARIA labels, and VIZRA obsidian-crimson styling.
 */
export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  badge,
  preventBackdropClose = false,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const container = dialogRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        container.focus();
      }
    }, 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 overflow-y-auto select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => {
              if (!preventBackdropClose) onClose();
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Surface */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vizra-dialog-title"
            aria-describedby={description ? 'vizra-dialog-desc' : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 w-full ${MAX_WIDTH_CLASSES[maxWidth]} rounded-2xl bg-[#111111] border border-white/[0.08] shadow-2xl text-white overflow-hidden focus:outline-none`}
          >
            {/* Subtle top highlight */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/[0.06]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2
                    id="vizra-dialog-title"
                    className="text-base font-semibold tracking-tight text-white"
                  >
                    {title}
                  </h2>
                  {badge && (
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-[#DC2626]/15 text-[#EB3B2D] border border-[#DC2626]/30">
                      {badge}
                    </span>
                  )}
                </div>
                {description && (
                  <p id="vizra-dialog-desc" className="text-xs text-neutral-400 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            {children && (
              <div className="px-6 py-5 text-xs text-neutral-300 max-h-[70vh] overflow-y-auto">
                {children}
              </div>
            )}

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 bg-[#090909]/80 border-t border-white/[0.06] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'export' | 'share';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const Icon =
    variant === 'danger'
      ? AlertTriangle
      : variant === 'export'
      ? Download
      : variant === 'share'
      ? Share2
      : Sparkles;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              variant === 'danger'
                ? 'bg-[#DC2626] hover:bg-red-700 text-white'
                : 'bg-white hover:bg-neutral-200 text-black'
            }`}
          >
            <Icon size={13} />
            <span>{isLoading ? 'Processing…' : confirmLabel}</span>
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#090909] border border-white/[0.06]">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            variant === 'danger'
              ? 'bg-[#DC2626]/15 text-[#EB3B2D]'
              : 'bg-white/[0.06] text-white'
          }`}
        >
          <Icon size={16} />
        </div>
        <div className="text-[11px] text-neutral-400 leading-relaxed">
          {variant === 'danger'
            ? 'This operation permanently modifies your workspace inventory and cannot be reversed.'
            : 'Your workspace settings and synchronization state will be updated immediately.'}
        </div>
      </div>
    </Dialog>
  );
};
