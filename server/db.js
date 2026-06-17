import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { runMigrations } from './migrations.js';
import * as schema from './schema.js';
import {
  patterns as patternSeeds,
  projects as projectSeeds,
  stashItems as stashItemSeeds,
} from './seed-data.js';

const sqlitePath =
  process.env.SQLITE_PATH ??
  path.join(process.cwd(), 'data', 'stitch-keeper.db');
const defaultHouseholdId = 'household-local-default';
const defaultUserId = 'user-local-default';

fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

export const sqlite = new Database(sqlitePath);
export const orm = drizzle(sqlite, { schema });

sqlite.pragma('foreign_keys = ON');

export function initializeDatabase() {
  runMigrations(sqlite);
  seedDatabaseIfEmpty();
}

function seedDatabaseIfEmpty() {
  const row = sqlite.prepare('SELECT COUNT(*) AS count FROM stash_items').get();

  if (row.count > 0) {
    return;
  }

  orm.transaction((tx) => {
    for (const item of stashItemSeeds) {
      tx.insert(schema.stashItems)
        .values({
          id: item.id,
          householdId: defaultHouseholdId,
          name: item.name,
          category: item.category,
          status: item.status ?? null,
          material: item.material ?? null,
          weight: item.weight ?? null,
          brand: item.brand ?? null,
          color: item.color ?? null,
          quantity: item.quantity,
          unit: item.unit ?? null,
          size: item.size ?? null,
          notes: item.notes ?? null,
        })
        .run();
    }

    for (const pattern of patternSeeds) {
      tx.insert(schema.patterns)
        .values({
          id: pattern.id,
          householdId: defaultHouseholdId,
          name: pattern.name,
          addedAt: pattern.addedAt ?? null,
          isPlanned: pattern.isPlanned ? 1 : 0,
          source: pattern.source ?? null,
          sourceUrl: pattern.sourceUrl ?? null,
          coverImageUrl: pattern.coverImageUrl ?? null,
          patternChartUrl: pattern.patternChartUrl ?? null,
          category: pattern.category ?? null,
          difficulty: pattern.difficulty ?? null,
          notes: pattern.notes ?? null,
          instructions: pattern.instructions,
          instructionSections: pattern.instructionSections
            ? JSON.stringify(pattern.instructionSections)
            : null,
        })
        .run();

      for (const requirement of pattern.requirements ?? []) {
        tx.insert(schema.patternRequirements)
          .values({
            id: requirement.id,
            patternId: pattern.id,
            category: requirement.category,
            name: requirement.name,
            weight: requirement.weight ?? null,
            quantityNeeded: requirement.quantityNeeded ?? null,
            unit: requirement.unit ?? null,
            size: requirement.size ?? null,
            notes: requirement.notes ?? null,
          })
          .run();
      }
    }

    for (const project of projectSeeds) {
      tx.insert(schema.projects)
        .values({
          id: project.id,
          householdId: defaultHouseholdId,
          userId: defaultUserId,
          name: project.name,
          patternId: project.patternId ?? null,
          startDate: project.startDate ?? null,
          endDate: project.endDate ?? null,
          status: project.status,
          notes: project.notes ?? null,
          completedInstructionSteps: JSON.stringify(
            project.completedInstructionSteps ?? [],
          ),
        })
        .run();

      const stashUsages = Array.isArray(project.stashUsages)
        ? project.stashUsages
        : (project.stashItemIds ?? []).map((stashItemId) => ({
            stashItemId,
            quantityUsed: null,
          }));

      for (const usage of stashUsages) {
        tx.insert(schema.projectStashItems)
          .values({
            projectId: project.id,
            stashItemId: usage.stashItemId,
            quantityUsed: usage.quantityUsed ?? null,
          })
          .run();
      }
    }
  });
}
