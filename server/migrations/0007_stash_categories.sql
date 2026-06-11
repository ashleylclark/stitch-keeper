CREATE TABLE stash_categories (
  id TEXT NOT NULL,
  household_id TEXT NOT NULL,
  name_singular TEXT NOT NULL,
  name_plural TEXT NOT NULL,
  default_unit TEXT,
  show_weight INTEGER NOT NULL DEFAULT 0,
  show_brand INTEGER NOT NULL DEFAULT 0,
  show_color INTEGER NOT NULL DEFAULT 0,
  show_size INTEGER NOT NULL DEFAULT 0,
  show_material INTEGER NOT NULL DEFAULT 0,
  show_unit INTEGER NOT NULL DEFAULT 0,
  show_notes INTEGER NOT NULL DEFAULT 0,
  is_consumable INTEGER NOT NULL DEFAULT 0,
  is_builtin INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (household_id, id),
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);

INSERT INTO stash_categories (
  id,
  household_id,
  name_singular,
  name_plural,
  default_unit,
  show_weight,
  show_brand,
  show_color,
  show_size,
  show_material,
  show_unit,
  show_notes,
  is_consumable,
  is_builtin,
  archived_at,
  created_at,
  updated_at
)
SELECT
  builtin.id,
  households.id,
  builtin.name_singular,
  builtin.name_plural,
  builtin.default_unit,
  builtin.show_weight,
  builtin.show_brand,
  builtin.show_color,
  builtin.show_size,
  builtin.show_material,
  builtin.show_unit,
  builtin.show_notes,
  builtin.is_consumable,
  1,
  NULL,
  datetime('now'),
  datetime('now')
FROM households
CROSS JOIN (
  SELECT 'yarn' AS id, 'Yarn' AS name_singular, 'Yarn' AS name_plural, 'yrds' AS default_unit, 1 AS show_weight, 1 AS show_brand, 1 AS show_color, 0 AS show_size, 0 AS show_material, 1 AS show_unit, 1 AS show_notes, 1 AS is_consumable
  UNION ALL SELECT 'hook', 'Hook', 'Hooks', 'hook', 0, 1, 0, 1, 1, 0, 0, 0
  UNION ALL SELECT 'needle', 'Needle', 'Needles', 'needles', 0, 1, 0, 1, 1, 0, 0, 0
  UNION ALL SELECT 'eyes', 'Safety Eye', 'Safety Eyes', 'pairs', 0, 1, 0, 1, 1, 1, 0, 1
  UNION ALL SELECT 'stuffing', 'Stuffing', 'Stuffing', 'bags', 0, 0, 0, 0, 1, 1, 1, 1
  UNION ALL SELECT 'other', 'Other', 'Other', 'items', 1, 1, 1, 1, 1, 1, 1, 1
) AS builtin;
