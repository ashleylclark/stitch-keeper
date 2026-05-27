import * as client from 'openid-client';
import {
  clearAuthCookie,
  createAppSession,
  createAuthCookie,
  createAuthRequestState,
  createSessionCookie,
  readAuthCookie,
} from './session.js';
import { findOrCreateUserFromIdentity } from '../repositories/users.js';

let oidcConfigPromise;

export async function handleLogin(request, response, authConfig) {
  if (!authConfig.oidc) {
    response.status(404).send('OIDC login is not configured.');
    return;
  }

  const oidcConfig = await getOidcConfig(authConfig);
  const authRequest = createAuthRequestState();
  const codeChallenge = await client.calculatePKCECodeChallenge(
    authRequest.codeVerifier,
  );
  const redirectUrl = client.buildAuthorizationUrl(oidcConfig, {
    redirect_uri: getCallbackUrl(authConfig).href,
    scope: authConfig.oidc.scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: authRequest.state,
  });

  createAuthCookie(response, authConfig, authRequest);
  response.redirect(redirectUrl.href);
}

export async function handleCallback(request, response, authConfig) {
  if (!authConfig.oidc) {
    response.status(404).send('OIDC login is not configured.');
    return;
  }

  const authRequest = readAuthCookie(request, authConfig);

  if (!authRequest) {
    response.status(400).send('Missing or expired auth request.');
    return;
  }

  const oidcConfig = await getOidcConfig(authConfig);
  const currentUrl = new URL(request.originalUrl, authConfig.appBaseUrl);
  const tokens = await client.authorizationCodeGrant(oidcConfig, currentUrl, {
    pkceCodeVerifier: authRequest.codeVerifier,
    expectedState: authRequest.state,
    idTokenExpected: true,
  });
  const claims = tokens.claims();
  const identity = createIdentityFromClaims(authConfig, claims);
  const appUser = findOrCreateUserFromIdentity(identity);

  if (!appUser.activeHouseholdId) {
    response.status(403).send('No household is available for this account.');
    return;
  }

  clearAuthCookie(response, authConfig);
  createSessionCookie(
    response,
    authConfig,
    createAppSession({
      userId: appUser.userId,
      activeHouseholdId: appUser.activeHouseholdId,
    }),
  );
  response.redirect('/');
}

function getOidcConfig(authConfig) {
  if (!oidcConfigPromise) {
    oidcConfigPromise = client.discovery(
      authConfig.oidc.issuerUrl,
      authConfig.oidc.clientId,
      authConfig.oidc.clientSecret,
    );
  }

  return oidcConfigPromise;
}

function getCallbackUrl(authConfig) {
  return new URL('/auth/oidc/callback', authConfig.appBaseUrl);
}

function createIdentityFromClaims(authConfig, claims) {
  if (!claims?.sub) {
    throw new Error('OIDC provider did not return a subject claim.');
  }

  const email = getClaimString(claims.email);
  const displayName =
    getClaimString(claims.name) ??
    getClaimString(claims.preferred_username) ??
    email ??
    'Stitch Keeper User';

  if (!email) {
    throw new Error('OIDC provider did not return an email claim.');
  }

  return {
    provider: authConfig.oidc.issuerUrl.href,
    providerSubject: String(claims.sub),
    email,
    displayName,
    avatarUrl: getClaimString(claims.picture),
  };
}

function getClaimString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
