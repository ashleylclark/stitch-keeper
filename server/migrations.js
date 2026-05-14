import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationTableName = 'schema_migrations';
const appTableNames = [
  'stash_items',
  'patterns',
  'pattern_requirements',
  'projects',
  'project_stash_items',
];

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'migrations',
);

export function runMigrations(db) {
  const migrationFiles = readMigrationFiles();

  if (migrationFiles.length === 0) {
    throw new Error('No database migrations found');
  }

  const hasMigrationTable = tableExists(db, migrationTableName);
  const existingAppTables = appTableNames.filter((tableName) =>
    tableExists(db, tableName),
  );

  if (!hasMigrationTable && existingAppTables.length > 0) {
    adoptLegacyDatabase(db, existingAppTables, migrationFiles);
  }

  createMigrationTable(db);

  const appliedVersions = new Set(
    db
      .prepare(`SELECT version FROM ${migrationTableName}`)
      .all()
      .map((migration) => migration.version),
  );

  for (const migration of migrationFiles) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    db.transaction(() => {
      db.exec(migration.sql);
      recordMigration(db, migration);
    })();
  }
}

function readMigrationFiles() {
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((fileName) => /^\d+_.+\.sql$/.test(fileName))
    .sort()
    .map((fileName) => {
      const [version] = fileName.split('_');
      return {
        version,
        name: fileName,
        sql: fs.readFileSync(path.join(migrationsDir, fileName), 'utf8'),
      };
    });

  const seenVersions = new Set();

  for (const migration of migrations) {
    if (seenVersions.has(migration.version)) {
      throw new Error(`Duplicate database migration version ${migration.version}`);
    }

    seenVersions.add(migration.version);
  }

  return migrations;
}

function adoptLegacyDatabase(db, existingAppTables, migrationFiles) {
  const missingTables = appTableNames.filter(
    (tableName) => !existingAppTables.includes(tableName),
  );

  if (missingTables.length > 0) {
    throw new Error(
      `Cannot adopt legacy database with missing app tables: ${missingTables.join(
        ', ',
      )}`,
    );
  }

  const initialMigration = migrationFiles[0];

  if (!initialMigration) {
    throw new Error('Cannot adopt legacy database without an initial migration');
  }

  db.transaction(() => {
    createMigrationTable(db);
    ensureColumn(db, 'projects', 'stash_usage_applied_at', 'TEXT');
    ensureColumn(
      db,
      'projects',
      'completed_instruction_steps',
      "TEXT NOT NULL DEFAULT '[]'",
    );
    ensureColumn(db, 'patterns', 'instruction_sections', 'TEXT');
    ensureColumn(db, 'project_stash_items', 'quantity_used', 'INTEGER');
    recordMigration(db, initialMigration);
  })();
}

function createMigrationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${migrationTableName} (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

function recordMigration(db, migration) {
  db.prepare(
    `
    INSERT INTO ${migrationTableName} (version, name, applied_at)
    VALUES (@version, @name, @appliedAt)
  `,
  ).run({
    version: migration.version,
    name: migration.name,
    appliedAt: new Date().toISOString(),
  });
}

function tableExists(db, tableName) {
  const row = db
    .prepare(
      `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
    `,
    )
    .get(tableName);

  return Boolean(row);
}

function ensureColumn(db, tableName, columnName, columnDefinition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
    );
  }
}
