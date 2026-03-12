type ItemCategory = 'yarn' | 'hook' | 'needle' | 'eyes' | 'stuffing' | 'other'
type YarnWeight = 'lace' | 'fingering' | 'sport' | 'dk' | 'worsted' | 'bulky' | 'super-bulky'
type StashStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'not-replacing'

type StashItem = {
  id: string
  name: string
  category: ItemCategory
  status?: StashStatus
  material?: string
  weight?: YarnWeight
  brand?: string
  color?: string
  quantity: number
  unit?: string
  size?: string
  notes?: string
}

type PatternRequirement = {
  id: string
  category: ItemCategory
  name: string
  weight?: YarnWeight
  quantityNeeded?: number
  unit?: string
  size?: string
  notes?: string
}

type Pattern = {
  id: string
  name: string
  addedAt?: string
  source?: string
  sourceUrl?: string
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  requirements: PatternRequirement[]
  notes?: string
  instructions: string
}

type MatchStatus = 'owned' | 'missing' | 'partial'

type RequirementMatch = {
  requirementId: string
  stashItemId?: string
  status: MatchStatus
  quantityMatched?: number
}

type ProjectStatus = 'planned' | 'in-progress' | 'completed' | 'paused' | 'need-supplies'

type PatternStatus = 'ready-to-start' | 'planned' | 'review-supplies' | 'need-supplies'

type PatternDashboardMeta = {
  patternId: string
  status: PatternStatus
  detail: string
}

type Project = {
  id: string
  name: string
  patternId?: string
  startDate?: string
  endDate?: string
  stashItemIds: string[]
  status: ProjectStatus
  notes?: string
}

export type {
  ItemCategory,
  MatchStatus,
  Pattern,
  PatternDashboardMeta,
  PatternRequirement,
  PatternStatus,
  Project,
  ProjectStatus,
  RequirementMatch,
  StashItem,
  StashStatus,
  YarnWeight,
}
