import { createContext, useContext } from 'react';
import type { CurrentUser } from '../../types/models';

export type AuthContextValue = {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
