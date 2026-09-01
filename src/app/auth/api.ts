import { fetchJson } from '../../shared/api/fetchJson';
import type {
  ApiToken,
  AuthSession,
  AuthSettings,
  AuthUser,
  CreatedApiToken,
  LoginCredentials,
  RegistrationCredentials,
  UserSettings,
} from '../../types/models';

export function fetchApiTokens() {
  return fetchJson<ApiToken[]>('/api/me/tokens');
}

export function createApiToken(name: string) {
  return fetchJson<CreatedApiToken>('/api/me/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export function revokeApiToken(id: string) {
  return fetchJson<void>(`/api/me/tokens/${id}`, { method: 'DELETE' }, true);
}

export function fetchAuthSettings() {
  return fetchJson<AuthSettings>('/api/auth/config');
}

export function fetchCurrentSession() {
  return fetchJson<AuthSession>('/api/me');
}

export function saveUserSettings(settings: UserSettings) {
  return fetchJson<AuthUser>('/api/me/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}

export function login(credentials: LoginCredentials) {
  return fetchJson<void>(
    '/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    },
    true,
  );
}

export function register(credentials: RegistrationCredentials) {
  return fetchJson<void>(
    '/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    },
    true,
  );
}

export function logout() {
  return fetchJson<void>('/auth/logout', { method: 'POST' }, true);
}
