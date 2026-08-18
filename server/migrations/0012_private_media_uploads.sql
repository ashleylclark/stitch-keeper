CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE projects ADD COLUMN finished_image_url TEXT;
