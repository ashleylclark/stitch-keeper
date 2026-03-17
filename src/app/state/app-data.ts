import { createContext, useContext } from 'react'
import type { Pattern, PatternMatchSummary, Project, StashItem } from '../../types/models'

export type AppDataContextValue = {
  isLoading: boolean
  error: string | null
  stashItems: StashItem[]
  addStashItem: (item: StashItem) => Promise<void>
  updateStashItem: (item: StashItem) => Promise<void>
  deleteStashItem: (itemId: string) => Promise<void>
  patterns: Pattern[]
  addPattern: (pattern: Pattern) => Promise<void>
  updatePattern: (pattern: Pattern) => Promise<void>
  deletePattern: (patternId: string) => Promise<void>
  projects: Project[]
  addProject: (project: Project) => Promise<void>
  updateProject: (project: Project) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  patternMatchSummaries: PatternMatchSummary[]
  patternMatchById: Map<string, PatternMatchSummary>
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)

export function useAppData() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider')
  }

  return context
}
