import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppDataContext, type AppDataContextValue } from '../state/app-data';
import type {
  AuthSettings,
  AuthSession,
  LoginCredentials,
  Pattern,
  Project,
  RegistrationCredentials,
  StashCategory,
  StashItem,
  Theme,
} from '../../types/models';
import { buildPatternMatchSummaries } from '../../pages/patterns/lib/patternMatching';
import {
  fetchAuthSettings,
  fetchCurrentSession,
  login as loginWithServer,
  logout as logoutFromServer,
  register as registerWithServer,
  saveUserSettings,
} from '../auth/api';
import {
  archiveStashCategory as archiveStashCategoryWithServer,
  createStashCategory as createStashCategoryWithServer,
  createStashItem,
  fetchStashCategories,
  fetchStashItems,
  removeStashItem,
  saveStashCategory as saveStashCategoryWithServer,
  saveStashItem,
} from '../../pages/stash/api';
import {
  createPattern,
  fetchPatterns,
  removePattern,
  savePattern,
} from '../../pages/patterns/api';
import {
  createProject,
  fetchProjects,
  removeProject,
  saveProject,
} from '../../pages/projects/api';

type AppDataProviderProps = {
  children:
    | ReactNode
    | ((value: AppDataContextValue) => ReactNode);
};

export function AppDataProvider({ children }: AppDataProviderProps) {
  const [stashItems, setStashItems] = useState<StashItem[]>([]);
  const [stashCategories, setStashCategories] = useState<StashCategory[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authSettings, setAuthSettings] = useState<AuthSettings>({
    oidcEnabled: false,
    registrationEnabled: false,
  });
  const [authStatus, setAuthStatus] =
    useState<AppDataContextValue['authStatus']>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const nextAuthSettings = await fetchAuthSettings();
      setAuthSettings(nextAuthSettings);

      const nextSession = await fetchCurrentSession();
      setSession(nextSession);
      setAuthStatus('authenticated');

      const [
        nextStashCategories,
        nextStashItems,
        nextPatterns,
        nextProjects,
      ] = await Promise.all([
        fetchStashCategories(),
        fetchStashItems(),
        fetchPatterns(),
        fetchProjects(),
      ]);

      setStashCategories(nextStashCategories);
      setStashItems(nextStashItems);
      setPatterns(nextPatterns);
      setProjects(nextProjects);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message.includes('401')) {
        setSession(null);
        setAuthStatus('unauthenticated');
        setStashCategories([]);
        setStashItems([]);
        setPatterns([]);
        setProjects([]);
        return;
      }

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load app data.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await loginWithServer(credentials);
      await loadInitialData();
    },
    [loadInitialData],
  );

  const register = useCallback(
    async (credentials: RegistrationCredentials) => {
      await registerWithServer(credentials);
      await loadInitialData();
    },
    [loadInitialData],
  );

  const logout = useCallback(async () => {
    await logoutFromServer();
    const nextAuthSettings = await fetchAuthSettings();
    setAuthSettings(nextAuthSettings);
    setSession(null);
    setAuthStatus('unauthenticated');
    setStashCategories([]);
    setStashItems([]);
    setPatterns([]);
    setProjects([]);
  }, []);

  const updateUserTheme = useCallback(async (theme: Theme) => {
    let previousTheme: Theme | undefined;

    setSession((current) => {
      if (!current) {
        return current;
      }

      previousTheme = current.user.theme;
      return {
        ...current,
        user: {
          ...current.user,
          theme,
        },
      };
    });

    try {
      const updatedUser = await saveUserSettings({ theme });

      setSession((current) =>
        current
          ? {
              ...current,
              user: updatedUser,
            }
          : current,
      );
    } catch (error) {
      if (previousTheme) {
        const themeToRestore = previousTheme;

        setSession((current) =>
          current
            ? {
                ...current,
                user: {
                  ...current.user,
                  theme: themeToRestore,
                },
              }
            : current,
        );
      }

      throw error;
    }
  }, []);

  const patternMatchSummaries = useMemo(
    () => buildPatternMatchSummaries(patterns, stashItems, stashCategories),
    [patterns, stashItems, stashCategories],
  );

  const patternMatchById = useMemo(
    () =>
      new Map(
        patternMatchSummaries.map((summary) => [summary.patternId, summary]),
      ),
    [patternMatchSummaries],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      authStatus,
      authSettings,
      session,
      login,
      register,
      logout,
      updateUserTheme,
      isLoading,
      error,
      stashCategories,
      addStashCategory: async (category) => {
        const createdCategory = await createStashCategoryWithServer(category);
        setStashCategories((current) => [...current, createdCategory]);
        return createdCategory;
      },
      updateStashCategory: async (categoryId, category) => {
        const updatedCategory = await saveStashCategoryWithServer(
          categoryId,
          category,
        );
        setStashCategories((current) =>
          current.map((existingCategory) =>
            existingCategory.id === updatedCategory.id
              ? updatedCategory
              : existingCategory,
          ),
        );
        return updatedCategory;
      },
      archiveStashCategory: async (categoryId) => {
        const archivedCategory =
          await archiveStashCategoryWithServer(categoryId);
        setStashCategories((current) =>
          current.map((existingCategory) =>
            existingCategory.id === archivedCategory.id
              ? archivedCategory
              : existingCategory,
          ),
        );
        return archivedCategory;
      },
      stashItems,
      addStashItem: async (item) => {
        const createdItem = await createStashItem(item);
        setStashItems((current) => [createdItem, ...current]);
      },
      updateStashItem: async (item) => {
        const updatedItem = await saveStashItem(item);
        setStashItems((current) =>
          current.map((existingItem) =>
            existingItem.id === updatedItem.id ? updatedItem : existingItem,
          ),
        );
      },
      deleteStashItem: async (itemId) => {
        await removeStashItem(itemId);
        setStashItems((current) =>
          current.filter((item) => item.id !== itemId),
        );
      },
      patterns,
      addPattern: async (pattern) => {
        const createdPattern = await createPattern(pattern);
        setPatterns((current) => [createdPattern, ...current]);
      },
      updatePattern: async (pattern) => {
        const updatedPattern = await savePattern(pattern);
        setPatterns((current) =>
          current.map((existingPattern) =>
            existingPattern.id === updatedPattern.id
              ? updatedPattern
              : existingPattern,
          ),
        );
      },
      deletePattern: async (patternId) => {
        await removePattern(patternId);
        setPatterns((current) =>
          current.filter((pattern) => pattern.id !== patternId),
        );
      },
      projects,
      addProject: async (project) => {
        const createdProject = await createProject(project);
        setProjects((current) => [createdProject, ...current]);
      },
      updateProject: async (project) => {
        const updatedProject = await saveProject(project);
        setProjects((current) =>
          current.map((existingProject) =>
            existingProject.id === updatedProject.id
              ? updatedProject
              : existingProject,
          ),
        );
      },
      deleteProject: async (projectId) => {
        await removeProject(projectId);
        setProjects((current) =>
          current.filter((project) => project.id !== projectId),
        );
      },
      patternMatchSummaries,
      patternMatchById,
    }),
    [
      authStatus,
      authSettings,
      session,
      login,
      register,
      isLoading,
      error,
      stashCategories,
      stashItems,
      patterns,
      projects,
      patternMatchSummaries,
      patternMatchById,
      logout,
      updateUserTheme,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </AppDataContext.Provider>
  );
}
