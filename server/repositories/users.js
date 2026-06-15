import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { orm } from '../db.js';
import {
  householdMembers,
  households,
  identities,
  localCredentials,
  users,
} from '../schema.js';

const defaultUserId = 'user-local-default';

export function findSessionUser(session) {
  const user = orm
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      theme: users.theme,
      colorTheme: users.colorTheme,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  if (!user) {
    return null;
  }

  const userHouseholds = listHouseholdsForUser(session.userId);
  const activeHousehold = userHouseholds.find(
    (household) => household.id === session.activeHouseholdId,
  );

  if (!activeHousehold) {
    return null;
  }

  return {
    user: toUser(user),
    households: userHouseholds,
    activeHousehold,
  };
}

export function findOrCreateUserFromIdentity(identityInput) {
  return orm.transaction((tx) => {
    const now = new Date().toISOString();
    const existingIdentity = tx
      .select({
        userId: identities.userId,
      })
      .from(identities)
      .where(
        and(
          eq(identities.provider, identityInput.provider),
          eq(identities.providerSubject, identityInput.providerSubject),
        ),
      )
      .get();

    if (existingIdentity) {
      updateExistingIdentity(tx, identityInput, now);
      updateExistingUser(tx, existingIdentity.userId, identityInput, now);

      const userHouseholds = listHouseholdsForUser(existingIdentity.userId, tx);
      return {
        userId: existingIdentity.userId,
        activeHouseholdId: userHouseholds[0]?.id ?? null,
      };
    }

    const existingUser = tx
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, identityInput.email))
      .get();
    const shouldClaimDefaultUser =
      !existingUser && canClaimDefaultUserForFirstAuth(tx);
    const userId =
      existingUser?.id ??
      (shouldClaimDefaultUser ? defaultUserId : `user-${randomUUID()}`);

    if (existingUser) {
      updateExistingUser(tx, userId, identityInput, now);
    } else if (shouldClaimDefaultUser) {
      updateExistingUser(tx, userId, identityInput, now);
    } else {
      tx.insert(users)
        .values({
          id: userId,
          email: identityInput.email,
          displayName: identityInput.displayName,
          avatarUrl: identityInput.avatarUrl ?? null,
          theme: 'dark',
          colorTheme: 'rose',
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    tx.insert(identities)
      .values({
        id: `identity-${randomUUID()}`,
        userId,
        provider: identityInput.provider,
        providerSubject: identityInput.providerSubject,
        email: identityInput.email,
        displayName: identityInput.displayName,
        avatarUrl: identityInput.avatarUrl ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const userHouseholds = listHouseholdsForUser(userId, tx);

    if (userHouseholds.length > 0) {
      return {
        userId,
        activeHouseholdId: userHouseholds[0].id,
      };
    }

    const householdId = `household-${randomUUID()}`;

    tx.insert(households)
      .values({
        id: householdId,
        name: `${identityInput.displayName}'s Household`,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    tx.insert(householdMembers)
      .values({
        householdId,
        userId,
        role: 'owner',
        createdAt: now,
      })
      .run();

    return {
      userId,
      activeHouseholdId: householdId,
    };
  });
}

export function isLocalRegistrationEnabled(authConfig) {
  return authConfig.allowSignups || countLocalCredentials() === 0;
}

export function findLocalLoginByEmail(email) {
  const row = orm
    .select({
      userId: users.id,
      passwordHash: localCredentials.passwordHash,
    })
    .from(localCredentials)
    .innerJoin(users, eq(localCredentials.userId, users.id))
    .where(eq(users.email, email))
    .get();

  if (!row) {
    return null;
  }

  const userHouseholds = listHouseholdsForUser(row.userId);

  return {
    userId: row.userId,
    passwordHash: row.passwordHash,
    activeHouseholdId: userHouseholds[0]?.id ?? null,
  };
}

export function createLocalUser({ email, displayName, passwordHash }) {
  return orm.transaction((tx) => {
    const now = new Date().toISOString();
    const existingUser = tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      const existingCredential = tx
        .select({ userId: localCredentials.userId })
        .from(localCredentials)
        .where(eq(localCredentials.userId, existingUser.id))
        .get();

      if (existingCredential) {
        throw new Error('An account already exists for this email.');
      }

      updateExistingUser(
        tx,
        existingUser.id,
        {
          email,
          displayName,
          avatarUrl: null,
        },
        now,
      );
      createLocalCredential(tx, existingUser.id, passwordHash, now);

      const userHouseholds = ensureUserHasHousehold(
        tx,
        existingUser.id,
        displayName,
        now,
      );
      return {
        userId: existingUser.id,
        activeHouseholdId: userHouseholds[0].id,
      };
    }

    const shouldClaimDefaultUser =
      countLocalCredentials(tx) === 0 && userExists(tx, defaultUserId);
    const userId = shouldClaimDefaultUser
      ? defaultUserId
      : `user-${randomUUID()}`;

    if (shouldClaimDefaultUser) {
      updateExistingUser(
        tx,
        userId,
        {
          email,
          displayName,
          avatarUrl: null,
        },
        now,
      );
    } else {
      tx.insert(users)
        .values({
          id: userId,
          email,
          displayName,
          avatarUrl: null,
          theme: 'dark',
          colorTheme: 'rose',
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    createLocalCredential(tx, userId, passwordHash, now);

    const userHouseholds = ensureUserHasHousehold(tx, userId, displayName, now);
    return {
      userId,
      activeHouseholdId: userHouseholds[0].id,
    };
  });
}

export function listHouseholdsForUser(userId, tx = orm) {
  return tx
    .select({
      id: households.id,
      name: households.name,
      role: householdMembers.role,
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(eq(householdMembers.userId, userId))
    .all();
}

export function updateUserSettings(userId, settings) {
  const updates = normalizeUserSettings(settings);
  const now = new Date().toISOString();

  orm
    .update(users)
    .set({
      ...updates,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .run();

  const user = orm
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      theme: users.theme,
      colorTheme: users.colorTheme,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  return toUser(user);
}

function countLocalCredentials(tx = orm) {
  const row = tx
    .select({ count: sql`COUNT(*)` })
    .from(localCredentials)
    .get();

  return Number(row?.count ?? 0);
}

function userExists(tx, userId) {
  return Boolean(
    tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).get(),
  );
}

function canClaimDefaultUserForFirstAuth(tx) {
  return (
    countLocalCredentials(tx) === 0 &&
    userExists(tx, defaultUserId) &&
    !tx
      .select({ id: identities.id })
      .from(identities)
      .where(eq(identities.userId, defaultUserId))
      .get()
  );
}

function createLocalCredential(tx, userId, passwordHash, now) {
  tx.insert(localCredentials)
    .values({
      userId,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    .run();
}

function ensureUserHasHousehold(tx, userId, displayName, now) {
  const userHouseholds = listHouseholdsForUser(userId, tx);

  if (userHouseholds.length > 0) {
    return userHouseholds;
  }

  const householdId = `household-${randomUUID()}`;

  tx.insert(households)
    .values({
      id: householdId,
      name: `${displayName}'s Household`,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  tx.insert(householdMembers)
    .values({
      householdId,
      userId,
      role: 'owner',
      createdAt: now,
    })
    .run();

  return [
    {
      id: householdId,
      name: `${displayName}'s Household`,
      role: 'owner',
    },
  ];
}

function updateExistingIdentity(tx, identityInput, now) {
  tx.update(identities)
    .set({
      email: identityInput.email,
      displayName: identityInput.displayName,
      avatarUrl: identityInput.avatarUrl ?? null,
      updatedAt: now,
    })
    .where(
      and(
        eq(identities.provider, identityInput.provider),
        eq(identities.providerSubject, identityInput.providerSubject),
      ),
    )
    .run();
}

function updateExistingUser(tx, userId, identityInput, now) {
  tx.update(users)
    .set({
      email: identityInput.email,
      displayName: identityInput.displayName,
      avatarUrl: identityInput.avatarUrl ?? null,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .run();
}

function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

function normalizeColorTheme(value) {
  return value === 'green' ? 'green' : 'rose';
}

function normalizeUserSettings(settings) {
  const updates = {};

  if (settings.theme !== undefined) {
    updates.theme = normalizeTheme(settings.theme);
  }

  if (settings.colorTheme !== undefined) {
    updates.colorTheme = normalizeColorTheme(settings.colorTheme);
  }

  return updates;
}

function toUser(user) {
  return {
    ...user,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}
