import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { orm } from '../db.js';
import {
  projects,
  projectStashItems,
  stashCategories,
  stashItems,
} from '../schema.js';
import { emptyToUndefined } from './utils.js';

export function listProjects(ownerContext) {
  const projectRows = orm
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.householdId, ownerContext.householdId),
        eq(projects.userId, ownerContext.userId),
      ),
    )
    .orderBy(desc(sql`rowid`))
    .all();

  const projectIds = projectRows.map((project) => project.id);
  const linkedStashItems =
    projectIds.length === 0
      ? []
      : orm
          .select()
          .from(projectStashItems)
          .where(inArray(projectStashItems.projectId, projectIds))
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

  return projectRows.map((project) => {
    const projectFields = { ...project };
    delete projectFields.householdId;
    delete projectFields.userId;

    return {
      ...projectFields,
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
    };
  });
}

export function saveProject(ownerContext, project, replace = false) {
  orm.transaction((tx) => {
    const existingProject = replace
      ? tx
          .select({
            id: projects.id,
            status: projects.status,
            stashUsageAppliedAt: projects.stashUsageAppliedAt,
          })
          .from(projects)
          .where(
            and(
              eq(projects.id, project.id),
              eq(projects.householdId, ownerContext.householdId),
              eq(projects.userId, ownerContext.userId),
            ),
          )
          .get()
      : null;

    if (replace) {
      tx.delete(projects)
        .where(
          and(
            eq(projects.id, project.id),
            eq(projects.householdId, ownerContext.householdId),
            eq(projects.userId, ownerContext.userId),
          ),
        )
        .run();
    }

    const shouldApplyStashUsage =
      project.status === 'completed' && !existingProject?.stashUsageAppliedAt;

    const stashUsageAppliedAt = shouldApplyStashUsage
      ? new Date().toISOString()
      : (existingProject?.stashUsageAppliedAt ?? null);

    tx.insert(projects)
      .values(toProjectRow(ownerContext, project, stashUsageAppliedAt))
      .run();

    const ownedStashUsages = filterOwnedStashUsages(
      tx,
      ownerContext,
      project.stashUsages,
    );

    for (const usage of ownedStashUsages) {
      tx.insert(projectStashItems)
        .values(toProjectStashRow(project, usage))
        .run();
    }

    if (shouldApplyStashUsage) {
      applyProjectStashUsage(tx, ownerContext, ownedStashUsages);
    }
  });
}

export function deleteProject(ownerContext, id) {
  orm
    .delete(projects)
    .where(
      and(
        eq(projects.id, id),
        eq(projects.householdId, ownerContext.householdId),
        eq(projects.userId, ownerContext.userId),
      ),
    )
    .run();
}

function toProjectRow(ownerContext, project, stashUsageAppliedAt) {
  return {
    id: project.id,
    householdId: ownerContext.householdId,
    userId: ownerContext.userId,
    name: project.name,
    patternId: project.patternId ?? null,
    startDate: project.startDate ?? null,
    endDate: project.endDate ?? null,
    status: project.status,
    notes: project.notes ?? null,
    completedInstructionSteps: JSON.stringify(
      project.completedInstructionSteps,
    ),
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

function filterOwnedStashUsages(tx, ownerContext, stashUsages) {
  if (stashUsages.length === 0) {
    return [];
  }

  const stashItemIds = stashUsages.map((usage) => usage.stashItemId);
  const ownedStashItems = tx
    .select({ id: stashItems.id })
    .from(stashItems)
    .where(
      and(
        eq(stashItems.householdId, ownerContext.householdId),
        inArray(stashItems.id, stashItemIds),
      ),
    )
    .all();
  const ownedStashItemIds = new Set(ownedStashItems.map((item) => item.id));

  return stashUsages.filter((usage) =>
    ownedStashItemIds.has(usage.stashItemId),
  );
}

function applyProjectStashUsage(tx, ownerContext, stashUsages) {
  for (const usage of stashUsages) {
    if (
      typeof usage.quantityUsed !== 'number' ||
      Number.isNaN(usage.quantityUsed) ||
      usage.quantityUsed <= 0
    ) {
      continue;
    }

    const stashItem = tx
      .select({ isConsumable: stashCategories.isConsumable })
      .from(stashItems)
      .leftJoin(
        stashCategories,
        and(
          eq(stashCategories.id, stashItems.category),
          eq(stashCategories.householdId, ownerContext.householdId),
        ),
      )
      .where(
        and(
          eq(stashItems.id, usage.stashItemId),
          eq(stashItems.householdId, ownerContext.householdId),
        ),
      )
      .get();

    if (!stashItem?.isConsumable) {
      continue;
    }

    tx.update(stashItems)
      .set({
        quantity: sql`MAX(${stashItems.quantity} - ${usage.quantityUsed}, 0)`,
      })
      .where(
        and(
          eq(stashItems.id, usage.stashItemId),
          eq(stashItems.householdId, ownerContext.householdId),
        ),
      )
      .run();
  }
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
