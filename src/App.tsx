import { useCallback, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppDataProvider } from './app/providers/AppDataProvider';
import { ThemeProvider } from './app/theme/ThemeProvider';
import { router } from './app/router';
import type { Theme } from './types/models';

function App() {
  const [fallbackTheme, setFallbackTheme] = useState<Theme>(() =>
    getSystemTheme(),
  );

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
      {({ session, updateUserTheme }) => (
        <ThemeProvider
          theme={session?.user.theme ?? fallbackTheme}
          onThemeChange={(theme) => {
            if (session) {
              void updateUserTheme(theme);
            } else {
              handleFallbackThemeChange(theme);
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
