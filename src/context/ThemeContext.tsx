import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'dark' | 'light';
export type ThemePreference = 'dark' | 'light' | 'system';

interface ThemeContextType {
  /** Resolved active theme ('dark' | 'light') */
  theme: Theme;
  /** User preference ('dark' | 'light' | 'system') */
  themePreference: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  themePreference: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = 'vizra_theme_mode_v1';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === 'system') return getSystemTheme();
  return preference;
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // ignore storage access errors
  }
  return 'dark'; // Preserve Dark Mode as default
}

function applyThemeToDocument(resolved: Theme, preference: ThemePreference) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(resolved);
  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolved;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() =>
    readStoredPreference()
  );
  const [theme, setResolvedTheme] = useState<Theme>(() => resolveTheme(readStoredPreference()));

  const syncTheme = useCallback((preference: ThemePreference, persist = true) => {
    const resolved = resolveTheme(preference);
    setThemePreferenceState(preference);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved, preference);

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  // Keep DOM synchronized on mount and preference changes
  useEffect(() => {
    const resolved = resolveTheme(themePreference);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved, themePreference);
  }, [themePreference]);

  // Listen to OS color scheme changes ONLY when user explicitly selected 'system' mode
  useEffect(() => {
    if (themePreference !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const resolved = mediaQuery.matches ? 'light' : 'dark';
      setResolvedTheme(resolved);
      applyThemeToDocument(resolved, 'system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  // Sync theme across browser tabs if changed in another tab
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next = event.newValue;
      if (next === 'dark' || next === 'light' || next === 'system') {
        syncTheme(next, false);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncTheme]);

  const setTheme = useCallback(
    (nextPreference: ThemePreference) => {
      syncTheme(nextPreference, true);
    },
    [syncTheme]
  );

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    syncTheme(next, true);
  }, [theme, syncTheme]);

  return (
    <ThemeContext.Provider value={{ theme, themePreference, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
