type ItemCategory = string;
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

type StashCategory = {
  id: ItemCategory;
  nameSingular: string;
  namePlural: string;
  defaultUnit?: string;
  showWeight: boolean;
  showBrand: boolean;
  showColor: boolean;
  showSize: boolean;
  showMaterial: boolean;
  showUnit: boolean;
  showNotes: boolean;
  isConsumable: boolean;
  isBuiltin: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
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

type PatternInstructionStep = {
  id: string;
  text: string;
  imageUrl?: string;
};

type PatternInstructionSection = {
  id: string;
  title: string;
  notes?: string;
  steps: PatternInstructionStep[];
};

type Pattern = {
  id: string;
  name: string;
  addedAt?: string;
  isPlanned?: boolean;
  source?: string;
  sourceUrl?: string;
  coverImageUrl?: string;
  patternChartUrl?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  requirements: PatternRequirement[];
  notes?: string;
  instructions: string;
  instructionSections: PatternInstructionSection[];
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
  completedInstructionSteps: string[];
  status: ProjectStatus;
  notes?: string;
};

type ProjectStashUsage = {
  stashItemId: string;
  quantityUsed?: number;
};

type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  theme: Theme;
};

type Household = {
  id: string;
  name: string;
  role: string;
};

type AuthSession = {
  user: AuthUser;
  households: Household[];
  activeHousehold: Household;
};

type AuthSettings = {
  oidcEnabled: boolean;
  registrationEnabled: boolean;
};

type Theme = 'light' | 'dark';

type LoginCredentials = {
  email: string;
  password: string;
};

type RegistrationCredentials = LoginCredentials & {
  displayName: string;
};

export type {
  AuthSettings,
  AuthSession,
  AuthUser,
  Household,
  ItemCategory,
  MatchStatus,
  Pattern,
  PatternInstructionSection,
  PatternInstructionStep,
  PatternMatchStatus,
  PatternMatchSummary,
  PatternRequirement,
  Project,
  ProjectStashUsage,
  ProjectStatus,
  LoginCredentials,
  RequirementMatch,
  RegistrationCredentials,
  StashCategory,
  StashItem,
  StashStatus,
  Theme,
  YarnWeight,
};
