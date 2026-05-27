CREATE TABLE projects_next (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pattern_id TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  completed_instruction_steps TEXT NOT NULL DEFAULT '[]',
  stash_usage_applied_at TEXT,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO projects_next (
  id,
  household_id,
  user_id,
  name,
  pattern_id,
  start_date,
  end_date,
  status,
  notes,
  completed_instruction_steps,
  stash_usage_applied_at
)
SELECT
  id,
  household_id,
  'user-local-default',
  name,
  pattern_id,
  start_date,
  end_date,
  status,
  notes,
  completed_instruction_steps,
  stash_usage_applied_at
FROM projects;

CREATE TABLE project_stash_items_next (
  project_id TEXT NOT NULL,
  stash_item_id TEXT NOT NULL,
  quantity_used INTEGER,
  PRIMARY KEY (project_id, stash_item_id),
  FOREIGN KEY (project_id) REFERENCES projects_next(id) ON DELETE CASCADE,
  FOREIGN KEY (stash_item_id) REFERENCES stash_items(id) ON DELETE CASCADE
);

INSERT INTO project_stash_items_next (
  project_id,
  stash_item_id,
  quantity_used
)
SELECT
  project_id,
  stash_item_id,
  quantity_used
FROM project_stash_items;

DROP TABLE project_stash_items;
DROP TABLE projects;

ALTER TABLE projects_next RENAME TO projects;
ALTER TABLE project_stash_items_next RENAME TO project_stash_items;
