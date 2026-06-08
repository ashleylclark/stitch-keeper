import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const identities = sqliteTable(
  'identities',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerSubject: text('provider_subject').notNull(),
    email: text('email'),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('identities_provider_subject_unique').on(
      table.provider,
      table.providerSubject,
    ),
  ],
);

export const localCredentials = sqliteTable('local_credentials', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const households = sqliteTable('households', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const householdMembers = sqliteTable(
  'household_members',
  {
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.householdId, table.userId] })],
);

export const stashItems = sqliteTable('stash_items', {
  id: text('id').primaryKey(),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  status: text('status'),
  material: text('material'),
  weight: text('weight'),
  brand: text('brand'),
  color: text('color'),
  quantity: integer('quantity').notNull(),
  unit: text('unit'),
  size: text('size'),
  notes: text('notes'),
});

export const patterns = sqliteTable('patterns', {
  id: text('id').primaryKey(),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  addedAt: text('added_at'),
  isPlanned: integer('is_planned').notNull().default(0),
  source: text('source'),
  sourceUrl: text('source_url'),
  coverImageUrl: text('cover_image_url'),
  illustrationImageUrl: text('illustration_image_url'),
  category: text('category'),
  difficulty: text('difficulty'),
  notes: text('notes'),
  instructions: text('instructions').notNull(),
  instructionSections: text('instruction_sections'),
});

export const patternRequirements = sqliteTable('pattern_requirements', {
  id: text('id').primaryKey(),
  patternId: text('pattern_id')
    .notNull()
    .references(() => patterns.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  name: text('name').notNull(),
  weight: text('weight'),
  quantityNeeded: integer('quantity_needed'),
  unit: text('unit'),
  size: text('size'),
  notes: text('notes'),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  patternId: text('pattern_id'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').notNull(),
  notes: text('notes'),
  completedInstructionSteps: text('completed_instruction_steps')
    .notNull()
    .default('[]'),
  stashUsageAppliedAt: text('stash_usage_applied_at'),
});

export const projectStashItems = sqliteTable(
  'project_stash_items',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    stashItemId: text('stash_item_id')
      .notNull()
      .references(() => stashItems.id, { onDelete: 'cascade' }),
    quantityUsed: integer('quantity_used'),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.stashItemId] })],
);

export const schemaMigrations = sqliteTable('schema_migrations', {
  version: text('version').primaryKey(),
  name: text('name').notNull(),
  appliedAt: text('applied_at').notNull(),
});
