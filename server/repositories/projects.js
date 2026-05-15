import { desc, eq, sql } from 'drizzle-orm';
import { orm } from '../db.js';
import { projects, projectStashItems, stashItems } from '../schema.js';
import { emptyToUndefined } from './utils.js';

export function listProjects() {
  const projectRows = orm
    .select()
    .from(projects)
    .orderBy(desc(sql`rowid`))
    .all();

  const linkedStashItems = orm
    .select()
    .from(projectStashItems)
    .orderBy(sql`rowid`)
    .all();

  const stashItemIdsByProjectId = new Map();
  const stashUsagesByProjectId = new Map();

  for (const row of linkedStashItems) {
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

  return projectRows.map((project) => ({
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
  orm.transaction((tx) => {
    const existingProject = replace
      ? tx
          .select({
            id: projects.id,
            status: projects.status,
            stashUsageAppliedAt: projects.stashUsageAppliedAt,
          })
          .from(projects)
          .where(eq(projects.id, project.id))
          .get()
      : null;

    if (replace) {
      tx.delete(projects).where(eq(projects.id, project.id)).run();
    }

    const shouldApplyStashUsage =
      project.status === 'completed' && !existingProject?.stashUsageAppliedAt;

    const stashUsageAppliedAt = shouldApplyStashUsage
      ? new Date().toISOString()
      : (existingProject?.stashUsageAppliedAt ?? null);

    tx.insert(projects)
      .values(toProjectRow(project, stashUsageAppliedAt))
      .run();

    for (const usage of project.stashUsages) {
      tx.insert(projectStashItems).values(toProjectStashRow(project, usage)).run();
    }

    if (shouldApplyStashUsage) {
      applyProjectStashUsage(tx, project.stashUsages);
    }
  });
}

export function deleteProject(id) {
  orm.delete(projects).where(eq(projects.id, id)).run();
}

function toProjectRow(project, stashUsageAppliedAt) {
  return {
    id: project.id,
    name: project.name,
    patternId: project.patternId ?? null,
    startDate: project.startDate ?? null,
    endDate: project.endDate ?? null,
    status: project.status,
    notes: project.notes ?? null,
    completedInstructionSteps: JSON.stringify(project.completedInstructionSteps),
    stashUsageAppliedAt,
  };
}

function toProjectStashRow(project, usage) {
  return {
    projectId: project.id,
    stashItemId: usage.stashItemId,
    quantityUsed: usage.quantityUsed ?? null,
  };
}

function applyProjectStashUsage(tx, stashUsages) {
  for (const usage of stashUsages) {
    if (
      typeof usage.quantityUsed !== 'number' ||
      Number.isNaN(usage.quantityUsed) ||
      usage.quantityUsed <= 0
    ) {
      continue;
    }

    const stashItem = tx
      .select({ category: stashItems.category })
      .from(stashItems)
      .where(eq(stashItems.id, usage.stashItemId))
      .get();

    if (!stashItem || !isConsumableCategory(stashItem.category)) {
      continue;
    }

    tx.update(stashItems)
      .set({
        quantity: sql`MAX(${stashItems.quantity} - ${usage.quantityUsed}, 0)`,
      })
      .where(eq(stashItems.id, usage.stashItemId))
      .run();
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
