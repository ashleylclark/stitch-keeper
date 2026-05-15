import { desc, eq, sql } from 'drizzle-orm';
import { orm } from '../db.js';
import { stashItems } from '../schema.js';

export function listStashItems() {
  return orm.select().from(stashItems).orderBy(desc(sql`rowid`)).all();
}

export function saveStashItem(item, replace = false) {
  const values = toStashRow(item);
  const insert = orm.insert(stashItems).values(values);

  if (replace) {
    insert
      .onConflictDoUpdate({
        target: stashItems.id,
        set: values,
      })
      .run();
    return;
  }

  insert.run();
}

export function deleteStashItem(id) {
  orm.delete(stashItems).where(eq(stashItems.id, id)).run();
}

function toStashRow(item) {
  return {
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
  };
}
