import { randomUUID } from 'node:crypto';
import * as oidc from 'openid-client';
import session from 'express-session';
import { db } from './db.js';

const configCache = {
  configuration: null,
};

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getAppBaseUrl() {
  return process.env.APP_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
}

function getRedirectUri() {
  return process.env.AUTHENTIK_REDIRECT_URI ?? `${getAppBaseUrl()}/api/auth/callback`;
}

function getPostLogoutRedirectUri() {
  return (
    process.env.AUTHENTIK_POST_LOGOUT_REDIRECT_URI ?? `${getAppBaseUrl()}/`
  );
}

async function getOidcConfiguration() {
  if (configCache.configuration) {
    return configCache.configuration;
  }

  const issuer = new URL(getRequiredEnv('AUTHENTIK_ISSUER_URL'));
  const clientId = getRequiredEnv('AUTHENTIK_CLIENT_ID');
  const clientSecret = getRequiredEnv('AUTHENTIK_CLIENT_SECRET');

  configCache.configuration = await oidc.discovery(
    issuer,
    clientId,
    clientSecret,
  );

  return configCache.configuration;
}

export function sessionMiddleware() {
  const sessionSecret =
    process.env.AUTH_SESSION_SECRET ?? 'stitch-keeper-dev-session-secret';
  const isProduction = process.env.NODE_ENV === 'production';

  return session({
    name: 'stitch_keeper_session',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });
}

function getSessionData(request) {
  return request.session.auth ?? {};
}

function setSessionData(request, data) {
  request.session.auth = {
    ...getSessionData(request),
    ...data,
  };
}

export function getAuthenticatedUser(request) {
  return request.session.auth?.user ?? null;
}

function claimLegacyDataForUser(userId) {
  db.transaction(() => {
    const hasClaimedLegacyData =
      db.prepare(
        `
        SELECT
          EXISTS(SELECT 1 FROM stash_items WHERE user_id IS NOT NULL) AS hasOwnedStash,
          EXISTS(SELECT 1 FROM patterns WHERE user_id IS NOT NULL) AS hasOwnedPatterns,
          EXISTS(SELECT 1 FROM projects WHERE user_id IS NOT NULL) AS hasOwnedProjects
      `,
      ).get();

    if (
      hasClaimedLegacyData.hasOwnedStash ||
      hasClaimedLegacyData.hasOwnedPatterns ||
      hasClaimedLegacyData.hasOwnedProjects
    ) {
      return;
    }

    db.prepare('UPDATE stash_items SET user_id = ? WHERE user_id IS NULL').run(
      userId,
    );
    db.prepare('UPDATE patterns SET user_id = ? WHERE user_id IS NULL').run(
      userId,
    );
    db.prepare('UPDATE projects SET user_id = ? WHERE user_id IS NULL').run(
      userId,
    );
  })();
}

function upsertUser(profile) {
  const subject = String(profile.sub);
  const email = profile.email ? String(profile.email) : null;
  const name =
    profile.name ??
    profile.preferred_username ??
    profile.email ??
    profile.sub;

  const existingUser = db
    .prepare(
      'SELECT id, subject, email, name FROM users WHERE subject = ? LIMIT 1',
    )
    .get(subject);

  if (existingUser) {
    db.prepare('UPDATE users SET email = ?, name = ? WHERE id = ?').run(
      email,
      name,
      existingUser.id,
    );

    return {
      id: existingUser.id,
      email: email ?? undefined,
      name: name ?? undefined,
      subject,
    };
  }

  const id = `user-${randomUUID()}`;

  db.prepare(
    `
      INSERT INTO users (id, subject, email, name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(id, subject, email, name, new Date().toISOString());

  claimLegacyDataForUser(id);

  return {
    id,
    email: email ?? undefined,
    name: name ?? undefined,
    subject,
  };
}

export async function startLogin(request, response) {
  const configuration = await getOidcConfiguration();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const state = oidc.randomState();

  setSessionData(request, {
    codeVerifier,
    state,
  });

  const authorizationUrl = oidc.buildAuthorizationUrl(configuration, {
    redirect_uri: getRedirectUri(),
    scope: process.env.AUTHENTIK_SCOPES ?? 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  response.redirect(authorizationUrl.toString());
}

export async function handleAuthCallback(request, response) {
  const configuration = await getOidcConfiguration();
  const sessionData = getSessionData(request);

  if (!sessionData.codeVerifier || !sessionData.state) {
    response.status(400).send('Missing authentication session state.');
    return;
  }

  const currentUrl = new URL(request.originalUrl, getAppBaseUrl());
  const tokens = await oidc.authorizationCodeGrant(configuration, currentUrl, {
    pkceCodeVerifier: sessionData.codeVerifier,
    expectedState: sessionData.state,
  });

  const claims = tokens.claims();

  if (!claims?.sub) {
    response.status(400).send('Missing identity claims from Authentik.');
    return;
  }

  const profile = await oidc.fetchUserInfo(
    configuration,
    tokens.access_token,
    claims.sub,
  );

  const user = upsertUser({
    ...claims,
    ...profile,
  });

  request.session.auth = {
    user,
    idToken: tokens.id_token,
  };

  response.redirect(getAppBaseUrl());
}

export function getCurrentUser(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }

  response.json(user);
}

export async function logout(request, response) {
  const configuration = await getOidcConfiguration();
  const idTokenHint = request.session.auth?.idToken;
  const endSessionEndpoint =
    configuration.serverMetadata().end_session_endpoint;

  await new Promise((resolve, reject) => {
    request.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  if (endSessionEndpoint && idTokenHint) {
    const logoutUrl = new URL(endSessionEndpoint);
    logoutUrl.searchParams.set(
      'post_logout_redirect_uri',
      getPostLogoutRedirectUri(),
    );
    logoutUrl.searchParams.set('id_token_hint', idTokenHint);
    response.redirect(logoutUrl.toString());
    return;
  }

  response.redirect(getPostLogoutRedirectUri());
}

export function requireAuthenticatedUser(request, response, next) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    response.status(401).send('Authentication required.');
    return;
  }

  request.currentUser = user;
  next();
}
