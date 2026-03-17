type ItemCategory = 'yarn' | 'hook' | 'needle' | 'eyes' | 'stuffing' | 'other';
type YarnWeight =
  | 'lace'
  | 'super-fine'
  | 'fine'
  | 'light'
  | 'medium'
  | 'bulky'
  | 'super-bulky'
  | 'jumbo';
type StashStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'not-replacing';

type StashItem = {
  id: string;
  name: string;
  category: ItemCategory;
  status?: StashStatus;
  material?: string;
  weight?: YarnWeight;
  brand?: string;
  color?: string;
  quantity: number;
  unit?: string;
  size?: string;
  notes?: string;
};

type PatternRequirement = {
  id: string;
  category: ItemCategory;
  name: string;
  weight?: YarnWeight;
  quantityNeeded?: number;
  unit?: string;
  size?: string;
  notes?: string;
};

type Pattern = {
  id: string;
  name: string;
  addedAt?: string;
  isPlanned?: boolean;
  source?: string;
  sourceUrl?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  requirements: PatternRequirement[];
  notes?: string;
  instructions: string;
};

type MatchStatus = 'owned' | 'missing' | 'partial';

type RequirementMatch = {
  requirementId: string;
  matchedItemIds: string[];
  status: MatchStatus;
  quantityMatched?: number;
  reason?: string;
};

type ProjectStatus =
  | 'planned'
  | 'in-progress'
  | 'completed'
  | 'paused'
  | 'need-supplies';

type PatternMatchStatus =
  | 'ready-to-start'
  | 'review-supplies'
  | 'need-supplies';

type PatternMatchSummary = {
  patternId: string;
  status: PatternMatchStatus;
  detail: string;
  matchedCount: number;
  totalCount: number;
  requirementMatches: RequirementMatch[];
};

type Project = {
  id: string;
  name: string;
  patternId?: string;
  startDate?: string;
  endDate?: string;
  stashItemIds: string[];
  stashUsages: ProjectStashUsage[];
  status: ProjectStatus;
  notes?: string;
};

type ProjectStashUsage = {
  stashItemId: string;
  quantityUsed?: number;
};

export type {
  ItemCategory,
  MatchStatus,
  Pattern,
  PatternMatchStatus,
  PatternMatchSummary,
  PatternRequirement,
  Project,
  ProjectStashUsage,
  ProjectStatus,
  RequirementMatch,
  StashItem,
  StashStatus,
  YarnWeight,
};
