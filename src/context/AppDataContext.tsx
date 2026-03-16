import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { AppDataContext, type AppDataContextValue } from './app-data'
import type { Pattern, Project, StashItem } from '../types/models'
import { buildPatternMatchSummaries } from '../utils/patternMatching'

export function AppDataProvider({ children }: PropsWithChildren) {
  const [stashItems, setStashItems] = useState<StashItem[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadInitialData()
  }, [])

  async function loadInitialData() {
    try {
      setIsLoading(true)
      setError(null)

      const [nextStashItems, nextPatterns, nextProjects] = await Promise.all([
        fetchJson<StashItem[]>('/api/stash'),
        fetchJson<Pattern[]>('/api/patterns'),
        fetchJson<Project[]>('/api/projects'),
      ])

      setStashItems(nextStashItems)
      setPatterns(nextPatterns)
      setProjects(nextProjects)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load app data.')
    } finally {
      setIsLoading(false)
    }
  }

  const patternMatchSummaries = useMemo(
    () => buildPatternMatchSummaries(patterns, stashItems),
    [patterns, stashItems],
  )

  const patternMatchById = useMemo(
    () => new Map(patternMatchSummaries.map((summary) => [summary.patternId, summary])),
    [patternMatchSummaries],
  )

  const value = useMemo<AppDataContextValue>(
    () => ({
      isLoading,
      error,
      stashItems,
      addStashItem: async (item) => {
        const createdItem = await fetchJson<StashItem>('/api/stash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })

        setStashItems((current) => [createdItem, ...current])
      },
      updateStashItem: async (item) => {
        const updatedItem = await fetchJson<StashItem>(`/api/stash/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })

        setStashItems((current) =>
          current.map((existingItem) => (existingItem.id === updatedItem.id ? updatedItem : existingItem)),
        )
      },
      deleteStashItem: async (itemId) => {
        await fetchJson<void>(`/api/stash/${itemId}`, { method: 'DELETE' }, true)
        setStashItems((current) => current.filter((item) => item.id !== itemId))
      },
      patterns,
      addPattern: async (pattern) => {
        const createdPattern = await fetchJson<Pattern>('/api/patterns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pattern),
        })

        setPatterns((current) => [createdPattern, ...current])
      },
      updatePattern: async (pattern) => {
        const updatedPattern = await fetchJson<Pattern>(`/api/patterns/${pattern.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pattern),
        })

        setPatterns((current) =>
          current.map((existingPattern) => (existingPattern.id === updatedPattern.id ? updatedPattern : existingPattern)),
        )
      },
      deletePattern: async (patternId) => {
        await fetchJson<void>(`/api/patterns/${patternId}`, { method: 'DELETE' }, true)
        setPatterns((current) => current.filter((pattern) => pattern.id !== patternId))
      },
      projects,
      addProject: async (project) => {
        const createdProject = await fetchJson<Project>('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project),
        })

        setProjects((current) => [createdProject, ...current])
      },
      updateProject: async (project) => {
        const updatedProject = await fetchJson<Project>(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project),
        })

        setProjects((current) =>
          current.map((existingProject) => (existingProject.id === updatedProject.id ? updatedProject : existingProject)),
        )
      },
      deleteProject: async (projectId) => {
        await fetchJson<void>(`/api/projects/${projectId}`, { method: 'DELETE' }, true)
        setProjects((current) => current.filter((project) => project.id !== projectId))
      },
      patternMatchSummaries,
      patternMatchById,
    }),
    [isLoading, error, stashItems, patterns, projects, patternMatchSummaries, patternMatchById],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit, allowEmpty = false) {
  const response = await fetch(input, init)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (allowEmpty || response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
