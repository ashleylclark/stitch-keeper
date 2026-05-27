import { createAppSession, createSessionCookie } from './session.js';
import { hashPassword, verifyPassword } from './passwords.js';
import {
  createLocalUser,
  findLocalLoginByEmail,
  isLocalRegistrationEnabled,
} from '../repositories/users.js';

const minimumPasswordLength = 12;

export async function handleLocalLogin(request, response, authConfig) {
  const credentials = normalizeCredentials(request.body);
  const login = credentials.email
    ? findLocalLoginByEmail(credentials.email)
    : null;
  const isValidPassword =
    login && (await verifyPassword(credentials.password, login.passwordHash));

  if (!login || !isValidPassword || !login.activeHouseholdId) {
    response.status(401).send('Invalid email or password.');
    return;
  }

  createSessionCookie(
    response,
    authConfig,
    createAppSession({
      userId: login.userId,
      activeHouseholdId: login.activeHouseholdId,
    }),
  );
  response.status(204).end();
}

export async function handleLocalRegistration(request, response, authConfig) {
  if (!isLocalRegistrationEnabled(authConfig)) {
    response.status(403).send('Registration is disabled.');
    return;
  }

  const credentials = normalizeCredentials(request.body);
  const displayName = String(request.body?.displayName ?? '').trim();

  if (!credentials.email || !displayName) {
    response.status(400).send('Email and display name are required.');
    return;
  }

  if (credentials.password.length < minimumPasswordLength) {
    response
      .status(400)
      .send(`Password must be at least ${minimumPasswordLength} characters.`);
    return;
  }

  const passwordHash = await hashPassword(credentials.password);
  let user;

  try {
    user = createLocalUser({
      email: credentials.email,
      displayName,
      passwordHash,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      response.status(409).send(error.message);
      return;
    }

    throw error;
  }

  createSessionCookie(
    response,
    authConfig,
    createAppSession({
      userId: user.userId,
      activeHouseholdId: user.activeHouseholdId,
    }),
  );
  response.status(201).end();
}

function normalizeCredentials(input) {
  return {
    email: String(input?.email ?? '')
      .trim()
      .toLowerCase(),
    password: String(input?.password ?? ''),
  };
}
