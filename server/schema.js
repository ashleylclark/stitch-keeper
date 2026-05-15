import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const stashItems = sqliteTable('stash_items', {
  id: text('id').primaryKey(),
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
  name: text('name').notNull(),
  addedAt: text('added_at'),
  isPlanned: integer('is_planned').notNull().default(0),
  source: text('source'),
  sourceUrl: text('source_url'),
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
  (table) => [
    primaryKey({ columns: [table.projectId, table.stashItemId] }),
  ],
);

export const schemaMigrations = sqliteTable('schema_migrations', {
  version: text('version').primaryKey(),
  name: text('name').notNull(),
  appliedAt: text('applied_at').notNull(),
});
