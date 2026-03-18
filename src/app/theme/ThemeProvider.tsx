import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  ThemeContext,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeContextValue,
} from './theme-context';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () =>
        setThemeState((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
