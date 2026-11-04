import React, { useState, useRef, useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface TooltipProps {
  /** Clear, concise beginner-friendly description of the tool's functionality */
  text: string;
  /** Optional short title/heading for the tool */
  label?: string;
  /** Optional keyboard shortcut badge (e.g., "⌘K") */
  shortcut?: string;
  /** Placement relative to the trigger element */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Horizontal alignment when position is top or bottom */
  align?: 'center' | 'start' | 'end';
  /** Hover delay in milliseconds before showing tooltip */
  delayMs?: number;
  /** Wrapped trigger element */
  children: React.ReactNode;
  /** Optional wrapper class name */
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  label,
  shortcut,
  position = 'bottom',
  align = 'center',
  delayMs = 140,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<number | null>(null);
  const tooltipId = useId();

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleShow = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const handleHide = () => {
    clearTimer();
    setIsVisible(false);
  };

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'top-full mt-2';
    }
  };

  // Alignment classes for top/bottom placements
  const getAlignClasses = () => {
    if (position === 'left' || position === 'right') return '';
    switch (align) {
      case 'start':
        return 'left-0';
      case 'end':
        return 'right-0';
      case 'center':
      default:
        return 'left-1/2 -translate-x-1/2';
    }
  };

  // Directional motion offset based on placement
  const getInitialOffset = () => {
    switch (position) {
      case 'top':
        return { opacity: 0, scale: 0.95, y: 4 };
      case 'left':
        return { opacity: 0, scale: 0.95, x: 4 };
      case 'right':
        return { opacity: 0, scale: 0.95, x: -4 };
      case 'bottom':
      default:
        return { opacity: 0, scale: 0.95, y: -4 };
    }
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}

      <AnimatePresence>
        {isVisible && text && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={getInitialOffset()}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={getInitialOffset()}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-none absolute z-50 w-max max-w-[230px] sm:max-w-[260px] rounded-xl bg-[#111111]/95 backdrop-blur-md border border-neutral-800 px-3 py-2 shadow-2xl ${getPositionClasses()} ${getAlignClasses()}`}
          >
            {(label || shortcut) && (
              <div className="flex items-center justify-between gap-2 mb-1">
                {label && (
                  <span className="text-[11px] font-semibold text-white tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] shrink-0" />
                    {label}
                  </span>
                )}
                {shortcut && (
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-950 border border-neutral-800 rounded">
                    {shortcut}
                  </kbd>
                )}
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-neutral-300 font-normal whitespace-normal text-left">
              {text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

