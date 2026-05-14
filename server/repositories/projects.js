import { db } from '../db.js';
import { emptyToUndefined } from './utils.js';

export function listProjects() {
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
      completed_instruction_steps AS completedInstructionSteps,
      stash_usage_applied_at AS stashUsageAppliedAt
    FROM projects
    ORDER BY rowid DESC
  `,
    )
    .all();

  const projectStashItems = db
    .prepare(
      `
    SELECT project_id AS projectId, stash_item_id AS stashItemId, quantity_used AS quantityUsed
    FROM project_stash_items
    ORDER BY rowid ASC
  `,
    )
    .all();

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
    completedInstructionSteps: parseCompletedInstructionSteps(
      project.completedInstructionSteps,
    ),
    stashItemIds: stashItemIdsByProjectId.get(project.id) ?? [],
    stashUsages: stashUsagesByProjectId.get(project.id) ?? [],
    stashUsageAppliedAt: project.stashUsageAppliedAt ?? undefined,
  }));
}

export function saveProject(project, replace = false) {
  db.transaction(() => {
    const existingProject = replace
      ? db
          .prepare(
            `
            SELECT id, status, stash_usage_applied_at AS stashUsageAppliedAt
            FROM projects
            WHERE id = ?
          `,
          )
          .get(project.id)
      : null;

    if (replace) {
      db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
    }

    const shouldApplyStashUsage =
      project.status === 'completed' && !existingProject?.stashUsageAppliedAt;

    const stashUsageAppliedAt = shouldApplyStashUsage
      ? new Date().toISOString()
      : (existingProject?.stashUsageAppliedAt ?? null);

    db.prepare(
      `
      INSERT INTO projects (
        id, name, pattern_id, start_date, end_date, status, notes, completed_instruction_steps, stash_usage_applied_at
      ) VALUES (
        @id, @name, @patternId, @startDate, @endDate, @status, @notes, @completedInstructionSteps, @stashUsageAppliedAt
      )
    `,
    ).run({
      ...project,
      completedInstructionSteps: JSON.stringify(
        project.completedInstructionSteps,
      ),
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
      applyProjectStashUsage(project.stashUsages);
    }
  })();
}

export function deleteProject(id) {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

function applyProjectStashUsage(stashUsages) {
  const updateStashQuantity = db.prepare(`
    UPDATE stash_items
    SET quantity = MAX(quantity - @quantityUsed, 0)
    WHERE id = @stashItemId
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
      .prepare('SELECT category FROM stash_items WHERE id = ?')
      .get(usage.stashItemId);

    if (!stashItem || !isConsumableCategory(stashItem.category)) {
      continue;
    }

    updateStashQuantity.run({
      stashItemId: usage.stashItemId,
      quantityUsed: usage.quantityUsed,
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

function parseCompletedInstructionSteps(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return normalizeCompletedInstructionSteps(parsed);
  } catch {
    return [];
  }
}

function normalizeCompletedInstructionSteps(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((stepId) => {
      if (Number.isInteger(stepId) && stepId >= 0) {
        return `legacy-step-${stepId}`;
      }

      return emptyToUndefined(stepId);
    })
    .filter(
      (stepId, index, current) =>
        typeof stepId === 'string' && current.indexOf(stepId) === index,
    )
    .sort();
}
