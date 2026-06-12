import { createContext, useContext } from 'react';
import type {
  AuthSettings,
  AuthSession,
  LoginCredentials,
  Pattern,
  PatternMatchSummary,
  Project,
  RegistrationCredentials,
  StashCategory,
  StashItem,
  UserSettings,
} from '../../types/models';
import type { StashCategoryInput } from '../../pages/stash/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AppPermissions = {
  canManageHousehold: boolean;
  canManageStashCategories: boolean;
  canCreateStash: boolean;
  canEditStash: boolean;
  canDeleteStash: boolean;
  canCreatePatterns: boolean;
  canEditPatterns: boolean;
  canDeletePatterns: boolean;
  canManageOwnProjects: boolean;
};

export type AppDataContextValue = {
  authStatus: AuthStatus;
  authSettings: AuthSettings;
  session: AuthSession | null;
  permissions: AppPermissions;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegistrationCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUserSettings: (settings: UserSettings) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  stashCategories: StashCategory[];
  addStashCategory: (category: StashCategoryInput) => Promise<StashCategory>;
  updateStashCategory: (
    categoryId: string,
    category: StashCategoryInput,
  ) => Promise<StashCategory>;
  archiveStashCategory: (categoryId: string) => Promise<StashCategory>;
  stashItems: StashItem[];
  addStashItem: (item: StashItem) => Promise<void>;
  updateStashItem: (item: StashItem) => Promise<void>;
  deleteStashItem: (itemId: string) => Promise<void>;
  patterns: Pattern[];
  addPattern: (pattern: Pattern) => Promise<void>;
  updatePattern: (pattern: Pattern) => Promise<void>;
  deletePattern: (patternId: string) => Promise<void>;
  projects: Project[];
  addProject: (project: Project) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  patternMatchSummaries: PatternMatchSummary[];
  patternMatchById: Map<string, PatternMatchSummary>;
};

export const AppDataContext = createContext<AppDataContextValue | null>(null);

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }

  return context;
}
