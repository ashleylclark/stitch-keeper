import { useEffect, useMemo, type PropsWithChildren } from 'react';
import {
  ThemeContext,
  type ThemeContextValue,
} from './theme-context';
import type { ColorTheme, Theme } from '../../types/models';

export function ThemeProvider({
  children,
  theme,
  colorTheme,
  onThemeChange,
  onColorThemeChange,
}: PropsWithChildren<{
  theme: Theme;
  colorTheme: ColorTheme;
  onThemeChange: (theme: Theme) => void;
  onColorThemeChange: (colorTheme: ColorTheme) => void;
}>) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-green', colorTheme === 'green');
    root.classList.toggle('theme-rose', colorTheme === 'rose');
  }, [colorTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colorTheme,
      setTheme: onThemeChange,
      setColorTheme: onColorThemeChange,
    }),
    [theme, colorTheme, onThemeChange, onColorThemeChange],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
