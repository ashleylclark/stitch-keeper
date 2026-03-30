import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import {
  getCurrentUser,
  handleAuthCallback,
  logout,
  requireAuthenticatedUser,
  sessionMiddleware,
  startLogin,
} from './auth.js';
import { db, initializeDatabase } from './db.js';

initializeDatabase();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(serverDir, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const hasBuiltFrontend = fs.existsSync(indexHtmlPath);

app.use(cors());
app.use(express.json());
app.use(sessionMiddleware());

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/auth/login', (request, response, next) => {
  void startLogin(request, response).catch(next);
});

app.get('/api/auth/callback', (request, response, next) => {
  void handleAuthCallback(request, response).catch(next);
});

app.get('/api/auth/me', getCurrentUser);

app.get('/api/auth/logout', (request, response, next) => {
  void logout(request, response).catch(next);
});

app.use('/api', (request, response, next) => {
  if (request.path === '/health' || request.path.startsWith('/auth/')) {
    next();
    return;
  }

  requireAuthenticatedUser(request, response, next);
});

app.get('/api/stash', (request, response) => {
  response.json(listStashItems(request.currentUser.id));
});

app.post('/api/stash', (request, response) => {
  const item = normalizeStashItem(request.body);
  saveStashItem(item, request.currentUser.id);
  response.status(201).json(item);
});

app.put('/api/stash/:id', (request, response) => {
  const item = normalizeStashItem({ ...request.body, id: request.params.id });
  saveStashItem(item, request.currentUser.id, true);
  response.json(item);
});

app.delete('/api/stash/:id', (request, response) => {
  db.prepare('DELETE FROM stash_items WHERE id = ? AND user_id = ?').run(
    request.params.id,
    request.currentUser.id,
  );
  response.status(204).end();
});

app.get('/api/patterns', (request, response) => {
  response.json(listPatterns(request.currentUser.id));
});

app.post('/api/patterns', (request, response) => {
  const pattern = normalizePattern(request.body);
  savePattern(pattern, request.currentUser.id);
  response.status(201).json(pattern);
});

app.put('/api/patterns/:id', (request, response) => {
  const pattern = normalizePattern({ ...request.body, id: request.params.id });
  savePattern(pattern, request.currentUser.id, true);
  response.json(pattern);
});

app.delete('/api/patterns/:id', (request, response) => {
  db.prepare('DELETE FROM patterns WHERE id = ? AND user_id = ?').run(
    request.params.id,
    request.currentUser.id,
  );
  response.status(204).end();
});

app.get('/api/projects', (request, response) => {
  response.json(listProjects(request.currentUser.id));
});

app.post('/api/projects', (request, response) => {
  const project = normalizeProject(request.body);
  saveProject(project, request.currentUser.id);
  response.status(201).json(project);
});

app.put('/api/projects/:id', (request, response) => {
  const project = normalizeProject({ ...request.body, id: request.params.id });
  saveProject(project, request.currentUser.id, true);
  response.json(project);
});

app.delete('/api/projects/:id', (request, response) => {
  db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(
    request.params.id,
    request.currentUser.id,
  );
  response.status(204).end();
});

if (hasBuiltFrontend) {
  app.use(express.static(distDir));

  app.get(/^\/(?!api\/).*/, (_request, response) => {
    response.sendFile(indexHtmlPath);
  });
}

app.listen(port, () => {
  console.log(`Stash Keeper server listening on http://localhost:${port}`);
});

app.use((error, _request, response) => {
  const message =
    error instanceof Error ? error.message : 'Unexpected server error.';

  response.status(500).send(message);
});

function listStashItems(userId) {
  return db
    .prepare(
      `
    SELECT id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
    FROM stash_items
    WHERE user_id = ?
    ORDER BY rowid DESC
  `,
    )
    .all(userId);
}

function listPatterns(userId) {
  const patterns = db
    .prepare(
      `
    SELECT
      id,
      name,
      added_at AS addedAt,
      is_planned AS isPlanned,
      source,
      source_url AS sourceUrl,
      category,
      difficulty,
      notes,
      instructions
    FROM patterns
    WHERE user_id = ?
    ORDER BY COALESCE(added_at, '') DESC, rowid DESC
  `,
    )
    .all(userId);

  const requirements = db
    .prepare(
      `
    SELECT
      id,
      pattern_id AS patternId,
      category,
      name,
      weight,
      quantity_needed AS quantityNeeded,
      unit,
      size,
      notes
    FROM pattern_requirements
    WHERE pattern_id IN (SELECT id FROM patterns WHERE user_id = ?)
    ORDER BY rowid ASC
  `,
    )
    .all(userId);

  const requirementsByPatternId = new Map();

  for (const requirement of requirements) {
    const current = requirementsByPatternId.get(requirement.patternId) ?? [];
    current.push({
      id: requirement.id,
      category: requirement.category,
      name: requirement.name,
      weight: requirement.weight ?? undefined,
      quantityNeeded: requirement.quantityNeeded ?? undefined,
      unit: requirement.unit ?? undefined,
      size: requirement.size ?? undefined,
      notes: requirement.notes ?? undefined,
    });
    requirementsByPatternId.set(requirement.patternId, current);
  }

  return patterns.map((pattern) => ({
    ...pattern,
    isPlanned: Boolean(pattern.isPlanned),
    requirements: requirementsByPatternId.get(pattern.id) ?? [],
  }));
}

function listProjects(userId) {
  const projects = db
    .prepare(
      `
    SELECT
      id,
      name,
      pattern_id AS patternId,
      start_date AS startDate,
      end_date AS endDate,
      status,
      notes,
      stash_usage_applied_at AS stashUsageAppliedAt
    FROM projects
    WHERE user_id = ?
    ORDER BY rowid DESC
  `,
    )
    .all(userId);

  const projectStashItems = db
    .prepare(
      `
    SELECT project_id AS projectId, stash_item_id AS stashItemId, quantity_used AS quantityUsed
    FROM project_stash_items
    WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)
    ORDER BY rowid ASC
  `,
    )
    .all(userId);

  const stashItemIdsByProjectId = new Map();
  const stashUsagesByProjectId = new Map();

  for (const row of projectStashItems) {
    const current = stashItemIdsByProjectId.get(row.projectId) ?? [];
    current.push(row.stashItemId);
    stashItemIdsByProjectId.set(row.projectId, current);

    const usageCurrent = stashUsagesByProjectId.get(row.projectId) ?? [];
    usageCurrent.push({
      stashItemId: row.stashItemId,
      quantityUsed: row.quantityUsed ?? undefined,
    });
    stashUsagesByProjectId.set(row.projectId, usageCurrent);
  }

  return projects.map((project) => ({
    ...project,
    patternId: project.patternId ?? undefined,
    startDate: project.startDate ?? undefined,
    endDate: project.endDate ?? undefined,
    notes: project.notes ?? undefined,
    stashItemIds: stashItemIdsByProjectId.get(project.id) ?? [],
    stashUsages: stashUsagesByProjectId.get(project.id) ?? [],
    stashUsageAppliedAt: project.stashUsageAppliedAt ?? undefined,
  }));
}

function normalizeStashItem(input) {
  return {
    id: String(input.id ?? `stash-${randomUUID()}`),
    name: String(input.name ?? '').trim(),
    category: String(input.category),
    status: emptyToUndefined(input.status),
    material: emptyToUndefined(input.material),
    weight: emptyToUndefined(input.weight),
    brand: emptyToUndefined(input.brand),
    color: emptyToUndefined(input.color),
    quantity: Number(input.quantity ?? 0),
    unit: emptyToUndefined(input.unit),
    size: emptyToUndefined(input.size),
    notes: emptyToUndefined(input.notes),
  };
}

function normalizePattern(input) {
  return {
    id: String(input.id ?? `pattern-${randomUUID()}`),
    name: String(input.name ?? '').trim(),
    addedAt:
      emptyToUndefined(input.addedAt) ?? new Date().toISOString().slice(0, 10),
    isPlanned: Boolean(input.isPlanned),
    source: emptyToUndefined(input.source),
    sourceUrl: emptyToUndefined(input.sourceUrl),
    category: emptyToUndefined(input.category),
    difficulty: emptyToUndefined(input.difficulty),
    notes: emptyToUndefined(input.notes),
    instructions: String(input.instructions ?? ''),
    requirements: Array.isArray(input.requirements)
      ? input.requirements.map((requirement) => ({
          id: String(requirement.id ?? `requirement-${randomUUID()}`),
          category: String(requirement.category),
          name: String(requirement.name ?? '').trim(),
          weight: emptyToUndefined(requirement.weight),
          quantityNeeded:
            requirement.quantityNeeded === undefined ||
            requirement.quantityNeeded === null ||
            requirement.quantityNeeded === ''
              ? undefined
              : Number(requirement.quantityNeeded),
          unit: emptyToUndefined(requirement.unit),
          size: emptyToUndefined(requirement.size),
          notes: emptyToUndefined(requirement.notes),
        }))
      : [],
  };
}

function normalizeProject(input) {
  const normalizedStashUsages = Array.isArray(input.stashUsages)
    ? input.stashUsages
        .map((usage) => ({
          stashItemId: String(usage.stashItemId),
          quantityUsed:
            usage.quantityUsed === undefined ||
            usage.quantityUsed === null ||
            usage.quantityUsed === ''
              ? undefined
              : Number(usage.quantityUsed),
        }))
        .filter((usage) => usage.stashItemId)
    : Array.isArray(input.stashItemIds)
      ? input.stashItemIds.map((stashItemId) => ({
          stashItemId: String(stashItemId),
          quantityUsed: undefined,
        }))
      : [];

  return {
    id: String(input.id ?? `project-${randomUUID()}`),
    name: String(input.name ?? '').trim(),
    patternId: emptyToUndefined(input.patternId),
    startDate: emptyToUndefined(input.startDate),
    endDate: emptyToUndefined(input.endDate),
    status: String(input.status),
    notes: emptyToUndefined(input.notes),
    stashItemIds: normalizedStashUsages.map((usage) => usage.stashItemId),
    stashUsages: normalizedStashUsages,
  };
}

function saveStashItem(item, userId, replace = false) {
  const sql = replace
    ? `
        INSERT OR REPLACE INTO stash_items (
          id, user_id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
        ) VALUES (
          @id, @userId, @name, @category, @status, @material, @weight, @brand, @color, @quantity, @unit, @size, @notes
        )
      `
    : `
        INSERT INTO stash_items (
          id, user_id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
        ) VALUES (
          @id, @userId, @name, @category, @status, @material, @weight, @brand, @color, @quantity, @unit, @size, @notes
        )
      `;

  db.prepare(sql).run({ ...item, userId });
}

function savePattern(pattern, userId, replace = false) {
  db.transaction(() => {
    if (replace) {
      db.prepare('DELETE FROM patterns WHERE id = ? AND user_id = ?').run(
        pattern.id,
        userId,
      );
    }

    db.prepare(
      `
      INSERT INTO patterns (
        id, user_id, name, added_at, is_planned, source, source_url, category, difficulty, notes, instructions
      ) VALUES (
        @id, @userId, @name, @addedAt, @isPlanned, @source, @sourceUrl, @category, @difficulty, @notes, @instructions
      )
    `,
    ).run({
      ...pattern,
      userId,
      isPlanned: pattern.isPlanned ? 1 : 0,
    });

    const insertRequirement = db.prepare(`
      INSERT INTO pattern_requirements (
        id, pattern_id, category, name, weight, quantity_needed, unit, size, notes
      ) VALUES (
        @id, @patternId, @category, @name, @weight, @quantityNeeded, @unit, @size, @notes
      )
    `);

    for (const requirement of pattern.requirements) {
      insertRequirement.run({ ...requirement, patternId: pattern.id });
    }
  })();
}

function saveProject(project, userId, replace = false) {
  db.transaction(() => {
    assertProjectReferencesOwnedData(project, userId);

    const existingProject = replace
      ? db
          .prepare(
            `
            SELECT id, status, stash_usage_applied_at AS stashUsageAppliedAt
            FROM projects
            WHERE id = ? AND user_id = ?
          `,
          )
          .get(project.id, userId)
      : null;

    if (replace) {
      db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(
        project.id,
        userId,
      );
    }

    const shouldApplyStashUsage =
      project.status === 'completed' && !existingProject?.stashUsageAppliedAt;

    const stashUsageAppliedAt = shouldApplyStashUsage
      ? new Date().toISOString()
      : (existingProject?.stashUsageAppliedAt ?? null);

    db.prepare(
      `
      INSERT INTO projects (
        id, user_id, name, pattern_id, start_date, end_date, status, notes, stash_usage_applied_at
      ) VALUES (
        @id, @userId, @name, @patternId, @startDate, @endDate, @status, @notes, @stashUsageAppliedAt
      )
    `,
    ).run({
      ...project,
      userId,
      stashUsageAppliedAt,
    });

    const insertLinkedItem = db.prepare(`
      INSERT INTO project_stash_items (project_id, stash_item_id, quantity_used)
      VALUES (@projectId, @stashItemId, @quantityUsed)
    `);

    for (const usage of project.stashUsages) {
      insertLinkedItem.run({
        projectId: project.id,
        stashItemId: usage.stashItemId,
        quantityUsed: usage.quantityUsed ?? null,
      });
    }

    if (shouldApplyStashUsage) {
      applyProjectStashUsage(project.stashUsages, userId);
    }
  })();
}

function assertProjectReferencesOwnedData(project, userId) {
  if (project.patternId) {
    const ownsPattern = db
      .prepare('SELECT 1 FROM patterns WHERE id = ? AND user_id = ? LIMIT 1')
      .get(project.patternId, userId);

    if (!ownsPattern) {
      throw new Error(
        'Projects can only reference patterns owned by the current user.',
      );
    }
  }

  for (const usage of project.stashUsages) {
    const ownsStashItem = db
      .prepare('SELECT 1 FROM stash_items WHERE id = ? AND user_id = ? LIMIT 1')
      .get(usage.stashItemId, userId);

    if (!ownsStashItem) {
      throw new Error(
        'Projects can only reference stash items owned by the current user.',
      );
    }
  }
}

function applyProjectStashUsage(stashUsages, userId) {
  const updateStashQuantity = db.prepare(`
    UPDATE stash_items
    SET quantity = MAX(quantity - @quantityUsed, 0)
    WHERE id = @stashItemId AND user_id = @userId
  `);

  for (const usage of stashUsages) {
    if (
      typeof usage.quantityUsed !== 'number' ||
      Number.isNaN(usage.quantityUsed) ||
      usage.quantityUsed <= 0
    ) {
      continue;
    }

    const stashItem = db
      .prepare('SELECT category FROM stash_items WHERE id = ? AND user_id = ?')
      .get(usage.stashItemId, userId);

    if (!stashItem || !isConsumableCategory(stashItem.category)) {
      continue;
    }

    updateStashQuantity.run({
      stashItemId: usage.stashItemId,
      quantityUsed: usage.quantityUsed,
      userId,
    });
  }
}

function isConsumableCategory(category) {
  return (
    category === 'yarn' ||
    category === 'eyes' ||
    category === 'stuffing' ||
    category === 'other'
  );
}

function emptyToUndefined(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
}
