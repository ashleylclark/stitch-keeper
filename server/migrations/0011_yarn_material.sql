UPDATE stash_categories
SET
  show_material = 1,
  updated_at = datetime('now')
WHERE id = 'yarn'
  AND is_builtin = 1;
