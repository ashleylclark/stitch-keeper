import { db } from '../db.js';

export function listStashItems() {
  return db
    .prepare(
      `
    SELECT id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
    FROM stash_items
    ORDER BY rowid DESC
  `,
    )
    .all();
}

export function saveStashItem(item, replace = false) {
  const sql = replace
    ? `
        INSERT OR REPLACE INTO stash_items (
          id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
        ) VALUES (
          @id, @name, @category, @status, @material, @weight, @brand, @color, @quantity, @unit, @size, @notes
        )
      `
    : `
        INSERT INTO stash_items (
          id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
        ) VALUES (
          @id, @name, @category, @status, @material, @weight, @brand, @color, @quantity, @unit, @size, @notes
        )
      `;

  db.prepare(sql).run(item);
}

export function deleteStashItem(id) {
  db.prepare('DELETE FROM stash_items WHERE id = ?').run(id);
}
