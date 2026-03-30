import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AuthContext, type AuthContextValue } from '../state/auth';
import type { CurrentUser } from '../../types/models';

async function fetchCurrentUser() {
  const response = await fetch('/api/auth/me', {
    credentials: 'same-origin',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Unable to load current user.');
  }

  return (await response.json()) as CurrentUser;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await fetchCurrentUser();
      setCurrentUser(user);
    } catch (loadError) {
      setCurrentUser(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load authentication state.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isLoading,
      error,
      login: () => {
        window.location.assign('/api/auth/login');
      },
      logout: () => {
        window.location.assign('/api/auth/logout');
      },
      refreshCurrentUser,
    }),
    [currentUser, error, isLoading, refreshCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
