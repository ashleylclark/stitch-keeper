import {
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { AppDataContext, type AppDataContextValue } from './app-data'
import { mockPatterns } from '../data/mock-patterns'
import { mockProjects } from '../data/mock-projects'
import { mockStash } from '../data/mock-stash'
import type { Pattern, Project, StashItem } from '../types/models'
import { buildPatternMatchSummaries } from '../utils/patternMatching'

export function AppDataProvider({ children }: PropsWithChildren) {
  const [stashItems, setStashItems] = useState<StashItem[]>(mockStash)
  const [patterns, setPatterns] = useState<Pattern[]>(mockPatterns)
  const [projects, setProjects] = useState<Project[]>(mockProjects)

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
      stashItems,
      addStashItem: (item) => setStashItems((current) => [item, ...current]),
      patterns,
      addPattern: (pattern) => setPatterns((current) => [pattern, ...current]),
      projects,
      addProject: (project) => setProjects((current) => [project, ...current]),
      patternMatchSummaries,
      patternMatchById,
    }),
    [stashItems, patterns, projects, patternMatchSummaries, patternMatchById],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
