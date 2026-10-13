import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard, Command, Sparkles } from 'lucide-react';
import { SHORTCUT_REGISTRY, modKey } from '../../hooks/useKeyboardShortcuts';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCommandPalette: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  onOpenCommandPalette,
}) => {
  if (!isOpen) return null;

  const categories = ['Navigation', 'Modes', 'Creation', 'Chat'] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-[#0c0c0c] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#eb3b2d]/10 border border-[#eb3b2d]/30 flex items-center justify-center text-[#eb3b2d]">
                <Keyboard size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Keyboard Shortcuts Manager</h2>
                <p className="text-xs text-neutral-400">
                  Global hotkeys to streamline navigation across the AI Creative Studio
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-850 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {categories.map((category) => {
              const items = SHORTCUT_REGISTRY.filter((s) => s.category === category);
              if (items.length === 0) return null;

              return (
                <div key={category} className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {items.map((shortcut) => (
                      <div
                        key={shortcut.id}
                        className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">
                            {shortcut.name}
                          </p>
                          {shortcut.description && (
                            <p className="text-[11px] text-neutral-400 truncate">
                              {shortcut.description}
                            </p>
                          )}
                        </div>
                        <kbd className="px-2 py-1 text-xs font-mono font-medium text-neutral-200 bg-neutral-950 border border-neutral-700 rounded-md shadow-sm shrink-0">
                          {shortcut.display}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with Command Palette shortcut prompt */}
          <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#eb3b2d]" />
              <span>
                Tip: Press <kbd className="px-1.5 py-0.5 font-mono text-[11px] bg-neutral-900 border border-neutral-800 rounded text-white">{modKey}+K</kbd> anytime to open the full Command Palette.
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenCommandPalette();
              }}
              className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-white font-medium transition-colors cursor-pointer"
            >
              Open Command Palette
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
