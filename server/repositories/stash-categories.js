import { randomUUID } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { orm } from '../db.js';
import { stashCategories } from '../schema.js';

export const builtInStashCategories = [
  {
    id: 'yarn',
    nameSingular: 'Yarn',
    namePlural: 'Yarn',
    defaultUnit: 'yrds',
    showWeight: true,
    showBrand: true,
    showColor: true,
    showSize: false,
    showMaterial: true,
    showUnit: true,
    showNotes: true,
    isConsumable: true,
  },
  {
    id: 'hook',
    nameSingular: 'Hook',
    namePlural: 'Hooks',
    defaultUnit: 'hook',
    showWeight: false,
    showBrand: true,
    showColor: false,
    showSize: true,
    showMaterial: true,
    showUnit: false,
    showNotes: false,
    isConsumable: false,
  },
  {
    id: 'needle',
    nameSingular: 'Needle',
    namePlural: 'Needles',
    defaultUnit: 'needles',
    showWeight: false,
    showBrand: true,
    showColor: false,
    showSize: true,
    showMaterial: true,
    showUnit: false,
    showNotes: false,
    isConsumable: false,
  },
  {
    id: 'eyes',
    nameSingular: 'Safety Eye',
    namePlural: 'Safety Eyes',
    defaultUnit: 'pairs',
    showWeight: false,
    showBrand: true,
    showColor: false,
    showSize: true,
    showMaterial: true,
    showUnit: true,
    showNotes: false,
    isConsumable: true,
  },
  {
    id: 'stuffing',
    nameSingular: 'Stuffing',
    namePlural: 'Stuffing',
    defaultUnit: 'bags',
    showWeight: false,
    showBrand: false,
    showColor: false,
    showSize: false,
    showMaterial: true,
    showUnit: true,
    showNotes: true,
    isConsumable: true,
  },
  {
    id: 'other',
    nameSingular: 'Other',
    namePlural: 'Other',
    defaultUnit: 'items',
    showWeight: true,
    showBrand: true,
    showColor: true,
    showSize: true,
    showMaterial: true,
    showUnit: true,
    showNotes: true,
    isConsumable: true,
  },
];

export function listStashCategories(ownerContext) {
  ensureBuiltInStashCategories(ownerContext);

  return orm
    .select()
    .from(stashCategories)
    .where(eq(stashCategories.householdId, ownerContext.householdId))
    .orderBy(
      stashCategories.isBuiltin,
      sql`lower(${stashCategories.namePlural})`,
    )
    .all()
    .map(toStashCategory);
}

export function listActiveStashCategories(ownerContext) {
  ensureBuiltInStashCategories(ownerContext);

  return orm
    .select()
    .from(stashCategories)
    .where(
      and(
        eq(stashCategories.householdId, ownerContext.householdId),
        isNull(stashCategories.archivedAt),
      ),
    )
    .all()
    .map(toStashCategory);
}

export function findStashCategory(ownerContext, id) {
  ensureBuiltInStashCategories(ownerContext);

  const category = orm
    .select()
    .from(stashCategories)
    .where(
      and(
        eq(stashCategories.householdId, ownerContext.householdId),
        eq(stashCategories.id, id),
      ),
    )
    .get();

  return category ? toStashCategory(category) : null;
}

export function createStashCategory(ownerContext, input) {
  ensureBuiltInStashCategories(ownerContext);

  const now = new Date().toISOString();
  const category = normalizeCategoryInput(input, {
    id: `category-${randomUUID()}`,
    isBuiltin: false,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  orm
    .insert(stashCategories)
    .values(toStashCategoryRow(ownerContext, category))
    .run();

  return category;
}

export function updateStashCategory(ownerContext, id, input) {
  ensureBuiltInStashCategories(ownerContext);

  const existing = findStashCategory(ownerContext, id);

  if (!existing) {
    return null;
  }

  const category = normalizeCategoryInput(
    {
      ...existing,
      ...input,
      id: existing.id,
      isBuiltin: existing.isBuiltin,
      archivedAt: input.archivedAt ?? existing.archivedAt,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    },
    existing,
  );

  orm
    .update(stashCategories)
    .set(toStashCategoryRow(ownerContext, category))
    .where(
      and(
        eq(stashCategories.householdId, ownerContext.householdId),
        eq(stashCategories.id, id),
      ),
    )
    .run();

  return category;
}

export function archiveStashCategory(ownerContext, id) {
  ensureBuiltInStashCategories(ownerContext);

  const existing = findStashCategory(ownerContext, id);

  if (!existing) {
    return null;
  }

  if (existing.isBuiltin) {
    return existing;
  }

  const archivedAt = existing.archivedAt ?? new Date().toISOString();
  return updateStashCategory(ownerContext, id, { archivedAt });
}

export function ensureBuiltInStashCategories(ownerContext, tx = orm) {
  const now = new Date().toISOString();

  for (const category of builtInStashCategories) {
    tx.insert(stashCategories)
      .values(
        toStashCategoryRow(ownerContext, {
          ...category,
          isBuiltin: true,
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      )
      .onConflictDoNothing()
      .run();
  }
}

function normalizeCategoryInput(input, fallback) {
  return {
    id: String(input.id ?? fallback.id),
    nameSingular: String(input.nameSingular ?? fallback.nameSingular).trim(),
    namePlural: String(input.namePlural ?? fallback.namePlural).trim(),
    defaultUnit: emptyToNull(input.defaultUnit ?? fallback.defaultUnit),
    showWeight: Boolean(input.showWeight ?? fallback.showWeight),
    showBrand: Boolean(input.showBrand ?? fallback.showBrand),
    showColor: Boolean(input.showColor ?? fallback.showColor),
    showSize: Boolean(input.showSize ?? fallback.showSize),
    showMaterial: Boolean(input.showMaterial ?? fallback.showMaterial),
    showUnit: Boolean(input.showUnit ?? fallback.showUnit),
    showNotes: Boolean(input.showNotes ?? fallback.showNotes),
    isConsumable: Boolean(input.isConsumable ?? fallback.isConsumable),
    isBuiltin: Boolean(input.isBuiltin ?? fallback.isBuiltin),
    archivedAt: input.archivedAt ?? fallback.archivedAt ?? null,
    createdAt: input.createdAt ?? fallback.createdAt,
    updatedAt: input.updatedAt ?? fallback.updatedAt,
  };
}

function toStashCategoryRow(ownerContext, category) {
  return {
    id: category.id,
    householdId: ownerContext.householdId,
    nameSingular: category.nameSingular,
    namePlural: category.namePlural,
    defaultUnit: category.defaultUnit ?? null,
    showWeight: category.showWeight ? 1 : 0,
    showBrand: category.showBrand ? 1 : 0,
    showColor: category.showColor ? 1 : 0,
    showSize: category.showSize ? 1 : 0,
    showMaterial: category.showMaterial ? 1 : 0,
    showUnit: category.showUnit ? 1 : 0,
    showNotes: category.showNotes ? 1 : 0,
    isConsumable: category.isConsumable ? 1 : 0,
    isBuiltin: category.isBuiltin ? 1 : 0,
    archivedAt: category.archivedAt ?? null,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function toStashCategory(row) {
  return {
    id: row.id,
    nameSingular: row.nameSingular,
    namePlural: row.namePlural,
    defaultUnit: row.defaultUnit ?? undefined,
    showWeight: Boolean(row.showWeight),
    showBrand: Boolean(row.showBrand),
    showColor: Boolean(row.showColor),
    showSize: Boolean(row.showSize),
    showMaterial: Boolean(row.showMaterial),
    showUnit: Boolean(row.showUnit),
    showNotes: Boolean(row.showNotes),
    isConsumable: Boolean(row.isConsumable),
    isBuiltin: Boolean(row.isBuiltin),
    archivedAt: row.archivedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function emptyToNull(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}
