import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const sessionCookieName = 'stitch_keeper_session';
const authCookieName = 'stitch_keeper_auth';
const sessionTtlSeconds = 60 * 60 * 24 * 7;
const authTtlSeconds = 60 * 10;

const oidcEnvVars = ['OIDC_ISSUER_URL', 'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET'];

export function readAuthConfig() {
  if (!process.env.SESSION_SECRET?.trim()) {
    throw new Error(
      'Missing required auth environment variable: SESSION_SECRET',
    );
  }

  const configuredOidcEnvVars = oidcEnvVars.filter((name) =>
    process.env[name]?.trim(),
  );
  const missingOidcEnvVars = oidcEnvVars.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (configuredOidcEnvVars.length > 0 && missingOidcEnvVars.length > 0) {
    throw new Error(
      `OIDC is partially configured. Missing environment variables: ${missingOidcEnvVars.join(
        ', ',
      )}`,
    );
  }

  const appBaseUrl = new URL(
    process.env.APP_BASE_URL?.trim() ||
      `http://localhost:${process.env.PORT ?? 3001}`,
  );
  const isOidcEnabled = configuredOidcEnvVars.length === oidcEnvVars.length;

  return {
    appBaseUrl,
    sessionSecret: process.env.SESSION_SECRET,
    allowSignups: process.env.ALLOW_SIGNUPS === 'true',
    oidc: isOidcEnabled
      ? {
          issuerUrl: new URL(process.env.OIDC_ISSUER_URL),
          clientId: process.env.OIDC_CLIENT_ID,
          clientSecret: process.env.OIDC_CLIENT_SECRET,
          scope: process.env.OIDC_SCOPE?.trim() || 'openid email profile',
        }
      : null,
  };
}

export function createSessionCookie(response, authConfig, session) {
  setSignedCookie(response, authConfig, sessionCookieName, session, {
    maxAgeSeconds: sessionTtlSeconds,
  });
}

export function clearSessionCookie(response, authConfig) {
  clearCookie(response, authConfig, sessionCookieName);
}

export function readSessionCookie(request, authConfig) {
  return readSignedCookie(request, authConfig, sessionCookieName);
}

export function createAuthCookie(response, authConfig, authRequest) {
  setSignedCookie(response, authConfig, authCookieName, authRequest, {
    maxAgeSeconds: authTtlSeconds,
  });
}

export function clearAuthCookie(response, authConfig) {
  clearCookie(response, authConfig, authCookieName);
}

export function readAuthCookie(request, authConfig) {
  return readSignedCookie(request, authConfig, authCookieName);
}

export function createAuthRequestState() {
  return {
    state: randomToken(),
    codeVerifier: randomToken(),
    expiresAt: Date.now() + authTtlSeconds * 1000,
  };
}

export function createAppSession({ userId, activeHouseholdId }) {
  return {
    userId,
    activeHouseholdId,
    expiresAt: Date.now() + sessionTtlSeconds * 1000,
  };
}

function setSignedCookie(response, authConfig, name, value, options) {
  response.cookie(name, signValue(authConfig, value), {
    httpOnly: true,
    secure: authConfig.appBaseUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: options.maxAgeSeconds * 1000,
    path: '/',
  });
}

function clearCookie(response, authConfig, name) {
  response.clearCookie(name, {
    httpOnly: true,
    secure: authConfig.appBaseUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
  });
}

function readSignedCookie(request, authConfig, name) {
  const cookieValue = parseCookies(request.headers.cookie ?? '')[name];

  if (!cookieValue) {
    return null;
  }

  const unsignedValue = unsignValue(authConfig, cookieValue);

  if (!unsignedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(unsignedValue, 'base64url').toString('utf8'),
    );

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function signValue(authConfig, value) {
  const encodedValue = Buffer.from(JSON.stringify(value), 'utf8').toString(
    'base64url',
  );
  const signature = createSignature(authConfig, encodedValue);

  return `${encodedValue}.${signature}`;
}

function unsignValue(authConfig, value) {
  const [encodedValue, signature] = value.split('.');

  if (!encodedValue || !signature) {
    return null;
  }

  const expectedSignature = createSignature(authConfig, encodedValue);
  const signatureBuffer = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  return encodedValue;
}

function createSignature(authConfig, value) {
  return createHmac('sha256', authConfig.sessionSecret)
    .update(value)
    .digest('base64url');
}

function parseCookies(cookieHeader) {
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');

    if (!name || valueParts.length === 0) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(valueParts.join('='));
    return cookies;
  }, {});
}

function randomToken() {
  return randomBytes(32).toString('base64url');
}
