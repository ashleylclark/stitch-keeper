import { and, desc, eq, sql } from 'drizzle-orm';
import { orm } from '../db.js';
import { stashItems } from '../schema.js';

export function listStashItems(ownerContext) {
  return orm
    .select()
    .from(stashItems)
    .where(eq(stashItems.householdId, ownerContext.householdId))
    .orderBy(desc(sql`rowid`))
    .all()
    .map(toStashItem);
}

export function saveStashItem(ownerContext, item, replace = false) {
  const values = toStashRow(ownerContext, item);

  if (replace) {
    const result = orm
      .update(stashItems)
      .set(values)
      .where(
        and(
          eq(stashItems.id, item.id),
          eq(stashItems.householdId, ownerContext.householdId),
        ),
      )
      .run();

    if (result.changes === 0) {
      orm.insert(stashItems).values(values).run();
    }

    return;
  }

  orm.insert(stashItems).values(values).run();
}

export function deleteStashItem(ownerContext, id) {
  orm
    .delete(stashItems)
    .where(
      and(
        eq(stashItems.id, id),
        eq(stashItems.householdId, ownerContext.householdId),
      ),
    )
    .run();
}

function toStashRow(ownerContext, item) {
  return {
    id: item.id,
    householdId: ownerContext.householdId,
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
  };
}

function toStashItem(row) {
  const item = { ...row };
  delete item.householdId;
  return item;
}
