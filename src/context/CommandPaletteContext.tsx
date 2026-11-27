import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

export interface CommandPaletteContextValue {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => setIsOpen(false), []);
  const togglePalette = useCallback(() => setIsOpen((prev) => !prev), []);

  // Close palette whenever route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  // Global Cmd+K / Ctrl+K shortcut (defers Cmd+K on /ai to Omnia's workspace palette,
  // while supporting Cmd+Shift+P / Ctrl+Shift+P everywhere including /ai)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.shiftKey && key === 'p') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (mod && !e.shiftKey && !e.altKey && key === 'k') {
        // On /ai, AIPage's dedicated CommandPaletteModal handles Cmd+K
        if (location.pathname === '/ai') return;
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname]);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({
      isOpen,
      openPalette,
      closePalette,
      togglePalette,
    }),
    [isOpen, openPalette, closePalette, togglePalette]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
};

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    return {
      isOpen: false,
      openPalette: () => {},
      closePalette: () => {},
      togglePalette: () => {},
    };
  }
  return ctx;
}
