import { createContext, useContext } from 'react'
import type { Pattern, PatternMatchSummary, Project, StashItem } from '../types/models'

export type AppDataContextValue = {
  stashItems: StashItem[]
  addStashItem: (item: StashItem) => void
  patterns: Pattern[]
  addPattern: (pattern: Pattern) => void
  projects: Project[]
  addProject: (project: Project) => void
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
