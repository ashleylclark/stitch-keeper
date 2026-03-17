import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { patterns, projects, stashItems } from './seed-data.js'

const sqlitePath = process.env.SQLITE_PATH ?? path.join(process.cwd(), 'data', 'stash-keeper.db')

fs.mkdirSync(path.dirname(sqlitePath), { recursive: true })

export const db = new Database(sqlitePath)

db.pragma('foreign_keys = ON')

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stash_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT,
      material TEXT,
      weight TEXT,
      brand TEXT,
      color TEXT,
      quantity INTEGER NOT NULL,
      unit TEXT,
      size TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      added_at TEXT,
      is_planned INTEGER NOT NULL DEFAULT 0,
      source TEXT,
      source_url TEXT,
      category TEXT,
      difficulty TEXT,
      notes TEXT,
      instructions TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pattern_requirements (
      id TEXT PRIMARY KEY,
      pattern_id TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      weight TEXT,
      quantity_needed INTEGER,
      unit TEXT,
      size TEXT,
      notes TEXT,
      FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pattern_id TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS project_stash_items (
      project_id TEXT NOT NULL,
      stash_item_id TEXT NOT NULL,
      PRIMARY KEY (project_id, stash_item_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (stash_item_id) REFERENCES stash_items(id) ON DELETE CASCADE
    );
  `)

  seedDatabaseIfEmpty()
}

function seedDatabaseIfEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM stash_items').get()

  if (row.count > 0) {
    return
  }

  const insertStash = db.prepare(`
    INSERT INTO stash_items (
      id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
    ) VALUES (
      @id, @name, @category, @status, @material, @weight, @brand, @color, @quantity, @unit, @size, @notes
    )
  `)

  const insertPattern = db.prepare(`
    INSERT INTO patterns (
      id, name, added_at, is_planned, source, source_url, category, difficulty, notes, instructions
    ) VALUES (
      @id, @name, @addedAt, @isPlanned, @source, @sourceUrl, @category, @difficulty, @notes, @instructions
    )
  `)

  const insertRequirement = db.prepare(`
    INSERT INTO pattern_requirements (
      id, pattern_id, category, name, weight, quantity_needed, unit, size, notes
    ) VALUES (
      @id, @patternId, @category, @name, @weight, @quantityNeeded, @unit, @size, @notes
    )
  `)

  const insertProject = db.prepare(`
    INSERT INTO projects (
      id, name, pattern_id, start_date, end_date, status, notes
    ) VALUES (
      @id, @name, @patternId, @startDate, @endDate, @status, @notes
    )
  `)

  const insertProjectStashItem = db.prepare(`
    INSERT INTO project_stash_items (project_id, stash_item_id)
    VALUES (@projectId, @stashItemId)
  `)

  db.transaction(() => {
    for (const item of stashItems) {
      insertStash.run({
        id: item.id,
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
    }

    for (const pattern of patterns) {
      insertPattern.run({
        id: pattern.id,
        name: pattern.name,
        addedAt: pattern.addedAt ?? null,
        isPlanned: pattern.isPlanned ?? 0,
        source: pattern.source ?? null,
        sourceUrl: pattern.sourceUrl ?? null,
        category: pattern.category ?? null,
        difficulty: pattern.difficulty ?? null,
        notes: pattern.notes ?? null,
        instructions: pattern.instructions,
      })

      for (const requirement of pattern.requirements) {
        insertRequirement.run({
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
      }
    }

    for (const project of projects) {
      insertProject.run({
        id: project.id,
        name: project.name,
        patternId: project.patternId ?? null,
        startDate: project.startDate ?? null,
        endDate: project.endDate ?? null,
        status: project.status,
        notes: project.notes ?? null,
      })

      for (const stashItemId of project.stashItemIds) {
        insertProjectStashItem.run({ projectId: project.id, stashItemId })
      }
    }
  })()
}
