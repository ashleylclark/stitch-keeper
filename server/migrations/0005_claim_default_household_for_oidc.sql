INSERT OR IGNORE INTO household_members (
  household_id,
  user_id,
  role,
  created_at
)
SELECT
  'household-local-default',
  identities.user_id,
  'owner',
  datetime('now')
FROM identities
WHERE identities.user_id <> 'user-local-default'
  AND (
    SELECT COUNT(DISTINCT user_id)
    FROM identities
    WHERE user_id <> 'user-local-default'
  ) = 1
  AND EXISTS (
    SELECT 1
    FROM households
    WHERE id = 'household-local-default'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM local_credentials
  )
  AND (
    EXISTS (
      SELECT 1
      FROM stash_items
      WHERE household_id = 'household-local-default'
    )
    OR EXISTS (
      SELECT 1
      FROM patterns
      WHERE household_id = 'household-local-default'
    )
    OR EXISTS (
      SELECT 1
      FROM projects
      WHERE household_id = 'household-local-default'
    )
  );

UPDATE projects
SET user_id = (
  SELECT identities.user_id
  FROM identities
  WHERE identities.user_id <> 'user-local-default'
  LIMIT 1
)
WHERE user_id = 'user-local-default'
  AND household_id = 'household-local-default'
  AND (
    SELECT COUNT(DISTINCT user_id)
    FROM identities
    WHERE user_id <> 'user-local-default'
  ) = 1
  AND NOT EXISTS (
    SELECT 1
    FROM local_credentials
  );

DELETE FROM households
WHERE id <> 'household-local-default'
  AND id IN (
    SELECT household_members.household_id
    FROM household_members
    INNER JOIN identities
      ON identities.user_id = household_members.user_id
    WHERE identities.user_id <> 'user-local-default'
      AND (
        SELECT COUNT(DISTINCT user_id)
        FROM identities
        WHERE user_id <> 'user-local-default'
      ) = 1
  )
  AND (
    SELECT COUNT(*)
    FROM household_members
    WHERE household_members.household_id = households.id
  ) = 1
  AND NOT EXISTS (
    SELECT 1
    FROM stash_items
    WHERE stash_items.household_id = households.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM patterns
    WHERE patterns.household_id = households.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.household_id = households.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM local_credentials
  );
