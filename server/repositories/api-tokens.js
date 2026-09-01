import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { orm } from '../db.js';
import { apiTokens } from '../schema.js';
import { findSessionUser } from './users.js';

const tokenPrefix = 'sk_';

export function createApiToken(ownerContext, name) {
  const token = `${tokenPrefix}${randomBytes(32).toString('base64url')}`;
  const now = new Date().toISOString();
  const row = {
    id: `token-${randomUUID()}`,
    userId: ownerContext.userId,
    householdId: ownerContext.householdId,
    name,
    tokenHash: hashToken(token),
    tokenPrefix: token.slice(0, 11),
    createdAt: now,
    lastUsedAt: null,
  };

  orm.insert(apiTokens).values(row).run();

  return { token, apiToken: toPublicToken(row) };
}

export function listApiTokens(ownerContext) {
  return orm
    .select()
    .from(apiTokens)
    .where(
      and(
        eq(apiTokens.userId, ownerContext.userId),
        eq(apiTokens.householdId, ownerContext.householdId),
      ),
    )
    .orderBy(desc(apiTokens.createdAt))
    .all()
    .map(toPublicToken);
}

export function revokeApiToken(ownerContext, id) {
  const result = orm
    .delete(apiTokens)
    .where(
      and(
        eq(apiTokens.id, id),
        eq(apiTokens.userId, ownerContext.userId),
        eq(apiTokens.householdId, ownerContext.householdId),
      ),
    )
    .run();

  return result.changes > 0;
}

export function findSessionUserForApiToken(token) {
  if (!token?.startsWith(tokenPrefix)) {
    return null;
  }

  const row = orm
    .select({
      id: apiTokens.id,
      userId: apiTokens.userId,
      householdId: apiTokens.householdId,
    })
    .from(apiTokens)
    .where(eq(apiTokens.tokenHash, hashToken(token)))
    .get();

  if (!row) {
    return null;
  }

  const sessionUser = findSessionUser({
    userId: row.userId,
    activeHouseholdId: row.householdId,
  });

  if (!sessionUser) {
    return null;
  }

  orm
    .update(apiTokens)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiTokens.id, row.id))
    .run();

  return sessionUser;
}

function hashToken(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function toPublicToken(token) {
  return {
    id: token.id,
    name: token.name,
    tokenPrefix: token.tokenPrefix,
    createdAt: token.createdAt,
    lastUsedAt: token.lastUsedAt ?? undefined,
  };
}
