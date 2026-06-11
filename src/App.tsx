import { useCallback, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppDataProvider } from './app/providers/AppDataProvider';
import { ThemeProvider } from './app/theme/ThemeProvider';
import { router } from './app/router';
import type { ColorTheme, Theme } from './types/models';

function App() {
  const [fallbackTheme, setFallbackTheme] = useState<Theme>(() =>
    getSystemTheme(),
  );
  const [fallbackColorTheme, setFallbackColorTheme] =
    useState<ColorTheme>('rose');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function handleChange() {
      setFallbackTheme(media.matches ? 'dark' : 'light');
    }

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const handleFallbackThemeChange = useCallback((theme: Theme) => {
    setFallbackTheme(theme);
  }, []);

  return (
    <AppDataProvider>
      {({ session, updateUserSettings }) => (
        <ThemeProvider
          theme={session?.user.theme ?? fallbackTheme}
          colorTheme={session?.user.colorTheme ?? fallbackColorTheme}
          onThemeChange={(theme) => {
            if (session) {
              void updateUserSettings({ theme });
            } else {
              handleFallbackThemeChange(theme);
            }
          }}
          onColorThemeChange={(colorTheme) => {
            if (session) {
              void updateUserSettings({ colorTheme });
            } else {
              setFallbackColorTheme(colorTheme);
            }
          }}
        >
          <RouterProvider router={router} />
        </ThemeProvider>
      )}
    </AppDataProvider>
  );
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export default App;
