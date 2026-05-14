CREATE TABLE stash_items (
  id TEXT PRIMARY KEY,
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
  notes TEXT
);

CREATE TABLE patterns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  added_at TEXT,
  is_planned INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  source_url TEXT,
  category TEXT,
  difficulty TEXT,
  notes TEXT,
  instructions TEXT NOT NULL,
  instruction_sections TEXT
);

CREATE TABLE pattern_requirements (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  weight TEXT,
  quantity_needed INTEGER,
  unit TEXT,
  size TEXT,
  notes TEXT,
  FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE CASCADE
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pattern_id TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  completed_instruction_steps TEXT NOT NULL DEFAULT '[]',
  stash_usage_applied_at TEXT
);

CREATE TABLE project_stash_items (
  project_id TEXT NOT NULL,
  stash_item_id TEXT NOT NULL,
  quantity_used INTEGER,
  PRIMARY KEY (project_id, stash_item_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (stash_item_id) REFERENCES stash_items(id) ON DELETE CASCADE
);
