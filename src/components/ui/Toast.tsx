import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Bell,
  Trash2,
  CheckCheck,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  timestamp: number;
  read?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  toasts: ToastItem[];
  history: ToastItem[];
  unreadCount: number;
  toast: (options: {
    title: string;
    description?: string;
    type?: ToastType;
    durationMs?: number;
    actionLabel?: string;
    onAction?: () => void;
  }) => string;
  dismissToast: (id: string) => void;
  markAllRead: () => void;
  clearHistory: () => void;
}

const HISTORY_STORAGE_KEY = 'vizra_notification_center_v1';

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  history: [],
  unreadCount: 0,
  toast: () => '',
  dismissToast: () => {},
  markAllRead: () => {},
  clearHistory: () => {},
});

/**
 * 11 · Toast Notifications & Persistent Notification Center
 * Adapted from 21st.dev `sonner` pattern. Pairs transient bottom-right toasts
 * with a persistent Notification Center so critical failures and exports are never lost.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [history, setHistory] = useState<ToastItem[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.slice(0, 30);
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(
          history.slice(0, 30).map(({ onAction, ...serializable }) => serializable)
        )
      );
    } catch {
      // Ignore storage error
    }
  }, [history]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      type = 'info',
      durationMs = 4200,
      actionLabel,
      onAction,
    }: {
      title: string;
      description?: string;
      type?: ToastType;
      durationMs?: number;
      actionLabel?: string;
      onAction?: () => void;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newItem: ToastItem = {
        id,
        title,
        description,
        type,
        timestamp: Date.now(),
        read: false,
        actionLabel,
        onAction,
      };

      setToasts((prev) => [newItem, ...prev].slice(0, 4));
      setHistory((prev) => [newItem, ...prev].slice(0, 30));

      if (durationMs > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }

      return id;
    },
    [dismissToast]
  );

  const markAllRead = useCallback(() => {
    setHistory((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const unreadCount = history.filter((h) => !h.read).length;

  return (
    <ToastContext.Provider
      value={{
        toasts,
        history,
        unreadCount,
        toast,
        dismissToast,
        markAllRead,
        clearHistory,
      }}
    >
      {children}

      {/* Floating Toast Viewport (Bottom Right) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[95] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0 select-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => {
            const Icon =
              item.type === 'success'
                ? CheckCircle2
                : item.type === 'error'
                ? AlertCircle
                : item.type === 'warning'
                ? AlertTriangle
                : Info;

            const iconColor =
              item.type === 'success'
                ? 'text-emerald-400'
                : item.type === 'error'
                ? 'text-[#EB3B2D]'
                : item.type === 'warning'
                ? 'text-amber-400'
                : 'text-neutral-300';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-[#111111]/95 backdrop-blur-md border border-white/[0.1] shadow-2xl text-white"
              >
                <Icon size={16} className={`${iconColor} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white leading-snug">
                    {item.title}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed break-words">
                      {item.description}
                    </p>
                  )}
                  {item.actionLabel && item.onAction && (
                    <button
                      type="button"
                      onClick={() => {
                        item.onAction?.();
                        dismissToast(item.id);
                      }}
                      className="mt-2 px-2.5 py-1 rounded-lg bg-white text-black font-semibold text-[11px] hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(item.id)}
                  className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

/**
 * Persistent Notification Center Trigger & Popover
 */
export const NotificationCenterTrigger: React.FC = () => {
  const { history, unreadCount, markAllRead, clearHistory } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen && unreadCount > 0) {
            markAllRead();
          }
        }}
        className={`relative h-9 w-9 inline-flex items-center justify-center rounded-lg border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] ${
          isOpen
            ? 'bg-white/[0.08] border-white/[0.14] text-white'
            : 'bg-transparent hover:bg-white/[0.06] border-transparent hover:border-white/[0.08] text-neutral-400 hover:text-white'
        }`}
        aria-label="Open Notification Center"
        aria-expanded={isOpen}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#DC2626] text-[9px] font-mono font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#111114] border border-white/[0.1] shadow-2xl z-50 overflow-hidden select-none"
            >
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                    {history.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {history.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="Mark all as read"
                      >
                        <CheckCheck size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={clearHistory}
                        className="p-1 rounded text-neutral-400 hover:text-[#EB3B2D] transition-colors cursor-pointer"
                        title="Clear notification history"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.05]">
                {history.length === 0 ? (
                  <div className="py-8 px-4 text-center text-xs text-neutral-500">
                    No workspace notifications yet. Project saves, exports, and system alerts appear here.
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 hover:bg-white/[0.02] transition-colors text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
