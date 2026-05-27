import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppDataContext, type AppDataContextValue } from '../state/app-data';
import type {
  AuthSettings,
  AuthSession,
  LoginCredentials,
  Pattern,
  Project,
  RegistrationCredentials,
  StashItem,
} from '../../types/models';
import { buildPatternMatchSummaries } from '../../pages/patterns/lib/patternMatching';
import {
  fetchAuthSettings,
  fetchCurrentSession,
  login as loginWithServer,
  logout as logoutFromServer,
  register as registerWithServer,
} from '../auth/api';
import {
  createStashItem,
  fetchStashItems,
  removeStashItem,
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

export function AppDataProvider({ children }: PropsWithChildren) {
  const [stashItems, setStashItems] = useState<StashItem[]>([]);
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

      const [nextStashItems, nextPatterns, nextProjects] = await Promise.all([
        fetchStashItems(),
        fetchPatterns(),
        fetchProjects(),
      ]);

      setStashItems(nextStashItems);
      setPatterns(nextPatterns);
      setProjects(nextProjects);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message.includes('401')) {
        setSession(null);
        setAuthStatus('unauthenticated');
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
    setStashItems([]);
    setPatterns([]);
    setProjects([]);
  }, []);

  const patternMatchSummaries = useMemo(
    () => buildPatternMatchSummaries(patterns, stashItems),
    [patterns, stashItems],
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
      isLoading,
      error,
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
      stashItems,
      patterns,
      projects,
      patternMatchSummaries,
      patternMatchById,
      logout,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}
