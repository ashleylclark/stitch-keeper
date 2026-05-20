CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (provider, provider_subject),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE household_members (
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (household_id, user_id),
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (
  id,
  email,
  display_name,
  avatar_url,
  created_at,
  updated_at
)
VALUES (
  'user-local-default',
  'local@example.invalid',
  'Local User',
  NULL,
  datetime('now'),
  datetime('now')
);

INSERT INTO households (
  id,
  name,
  created_at,
  updated_at
)
VALUES (
  'household-local-default',
  'My Household',
  datetime('now'),
  datetime('now')
);

INSERT INTO household_members (
  household_id,
  user_id,
  role,
  created_at
)
VALUES (
  'household-local-default',
  'user-local-default',
  'owner',
  datetime('now')
);

CREATE TABLE stash_items_next (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT,
  material TEXT,
  weight TEXT,
  brand TEXT,
  color TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT,
  size TEXT,
  notes TEXT,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);

INSERT INTO stash_items_next (
  id,
  household_id,
  name,
  category,
  status,
  material,
  weight,
  brand,
  color,
  quantity,
  unit,
  size,
  notes
)
SELECT
  id,
  'household-local-default',
  name,
  category,
  status,
  material,
  weight,
  brand,
  color,
  quantity,
  unit,
  size,
  notes
FROM stash_items;

CREATE TABLE patterns_next (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  name TEXT NOT NULL,
  added_at TEXT,
  is_planned INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  source_url TEXT,
  category TEXT,
  difficulty TEXT,
  notes TEXT,
  instructions TEXT NOT NULL,
  instruction_sections TEXT,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);

INSERT INTO patterns_next (
  id,
  household_id,
  name,
  added_at,
  is_planned,
  source,
  source_url,
  category,
  difficulty,
  notes,
  instructions,
  instruction_sections
)
SELECT
  id,
  'household-local-default',
  name,
  added_at,
  is_planned,
  source,
  source_url,
  category,
  difficulty,
  notes,
  instructions,
  instruction_sections
FROM patterns;

CREATE TABLE projects_next (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pattern_id TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  completed_instruction_steps TEXT NOT NULL DEFAULT '[]',
  stash_usage_applied_at TEXT,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);

INSERT INTO projects_next (
  id,
  household_id,
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
  'household-local-default',
  name,
  pattern_id,
  start_date,
  end_date,
  status,
  notes,
  completed_instruction_steps,
  stash_usage_applied_at
FROM projects;

CREATE TABLE pattern_requirements_next (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  weight TEXT,
  quantity_needed INTEGER,
  unit TEXT,
  size TEXT,
  notes TEXT,
  FOREIGN KEY (pattern_id) REFERENCES patterns_next(id) ON DELETE CASCADE
);

INSERT INTO pattern_requirements_next (
  id,
  pattern_id,
  category,
  name,
  weight,
  quantity_needed,
  unit,
  size,
  notes
)
SELECT
  id,
  pattern_id,
  category,
  name,
  weight,
  quantity_needed,
  unit,
  size,
  notes
FROM pattern_requirements;

CREATE TABLE project_stash_items_next (
  project_id TEXT NOT NULL,
  stash_item_id TEXT NOT NULL,
  quantity_used INTEGER,
  PRIMARY KEY (project_id, stash_item_id),
  FOREIGN KEY (project_id) REFERENCES projects_next(id) ON DELETE CASCADE,
  FOREIGN KEY (stash_item_id) REFERENCES stash_items_next(id) ON DELETE CASCADE
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
DROP TABLE pattern_requirements;
DROP TABLE projects;
DROP TABLE patterns;
DROP TABLE stash_items;

ALTER TABLE stash_items_next RENAME TO stash_items;
ALTER TABLE patterns_next RENAME TO patterns;
ALTER TABLE projects_next RENAME TO projects;
ALTER TABLE pattern_requirements_next RENAME TO pattern_requirements;
ALTER TABLE project_stash_items_next RENAME TO project_stash_items;
