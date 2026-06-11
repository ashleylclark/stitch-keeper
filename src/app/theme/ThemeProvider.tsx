import { useEffect, useMemo, type PropsWithChildren } from 'react';
import {
  ThemeContext,
  type ThemeContextValue,
} from './theme-context';
import type { Theme } from '../../types/models';

export function ThemeProvider({
  children,
  theme,
  onThemeChange,
}: PropsWithChildren<{
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}>) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: onThemeChange,
    }),
    [theme, onThemeChange],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
