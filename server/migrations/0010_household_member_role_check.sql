CREATE TABLE household_members_next (
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (household_id, user_id),
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO household_members_next (
  household_id,
  user_id,
  role,
  created_at
)
SELECT
  household_id,
  user_id,
  CASE
    WHEN role IN ('owner', 'member', 'viewer') THEN role
    ELSE 'viewer'
  END,
  created_at
FROM household_members;

DROP TABLE household_members;

ALTER TABLE household_members_next RENAME TO household_members;
