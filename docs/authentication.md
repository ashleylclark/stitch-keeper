# Authentication

[Back to the README](../README.md)

Stitch Keeper supports local email/password accounts and optional OpenID
Connect (OIDC) sign-in. Browser requests use signed login cookies; external
integrations use read-only API tokens.

## Users and households

The app uses households as shared workspaces:

- A **user** is a person who can sign in.
- A **household** is a shared workspace for stash and patterns.
- Household members can share the same stash and pattern library when they
  belong to the same household.
- Projects are personal to the signed-in user and belong to a household so
  they can reference household patterns and consume household stash.
- User settings, such as theme mode and accent color, are saved per user.
  Household settings, such as stash categories, are shared with household
  members.

Household roles control who can change shared data:

| Role     | Permissions                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `owner`  | Manage household settings, manage stash categories, add/edit/delete stash, add/edit/delete patterns, and manage their own projects.                                 |
| `member` | Add/edit stash, add/edit patterns, and manage their own projects. Members cannot delete shared stash or patterns, archive categories, or manage household settings. |
| `viewer` | Read stash, categories, patterns, and their own projects. Viewers cannot create, edit, or delete app data.                                                          |

Unknown role values are treated as `viewer`. Household invitations and
member-management screens are not available yet. New accounts get their own
household unless membership is added directly in the database.

For a single-user installation, the household is your workspace. Multiple
members of the same household share stash and patterns, while each member
has their own projects.

## Test household roles

Manual role QA can be done by editing `household_members.role` directly in the
SQLite database while invite and member-management screens are future work:

```sql
SELECT household_id, user_id, role FROM household_members;

UPDATE household_members
SET role = 'member'
WHERE household_id = 'household-local-default'
  AND user_id = 'user-local-default';
```

Valid roles are `owner`, `member`, and `viewer`; invalid values are normalized
to `viewer` during migration and rejected by the database after migration. Use
the role matrix above to confirm the visible controls change, and make direct
write API requests to confirm forbidden actions return `403`.

## Account setup and sessions

- `SESSION_SECRET` is required and must be a long, random value.
- `APP_BASE_URL` controls callback URLs and secure-cookie behavior; it defaults
  to `http://localhost:3001` when omitted, or uses the configured `PORT`.
- The first local account can be created from the login screen.
- The first local or OIDC account claims the default local user and household,
  so existing seeded or migrated data remains visible after account setup.
- After the first local account exists, new local registrations are disabled
  unless `ALLOW_SIGNUPS=true`.
- Signed `HttpOnly` session cookies store only `userId`, `activeHouseholdId`, and
  expiration metadata.
- All API routes except `/api/health` and `/api/auth/config` require an
  authenticated browser session or API token.

## API tokens

Personal API tokens are available under **Settings → API Tokens** for
read-only integrations such as Stitch Keeper MCP.

- Tokens are scoped to the household active when they are created.
- The plaintext token is displayed once; only its SHA-256 hash is stored.
- API tokens may use `GET` and `HEAD` API routes. Write requests return `403`.
- Current household membership and role are checked on every request.
- Revocation takes effect immediately.
- Token-management endpoints require a browser session, so an API token cannot
  create or revoke other tokens.

Clients authenticate with:

```text
Authorization: Bearer sk_your-token
```

For public deployments, run the app behind HTTPS and use a strong
`SESSION_SECRET`. HTTPS makes session cookies `Secure` when `APP_BASE_URL` uses
an `https://` URL.

## Optional OIDC sign-in

OIDC sign-in is enabled only when all three values are provided:

```sh
export OIDC_ISSUER_URL=https://your-provider.example
export OIDC_CLIENT_ID=your-client-id
export OIDC_CLIENT_SECRET=your-client-secret
```

Register these redirect URIs with the OIDC provider:

- Local dev: `http://localhost:5173/auth/oidc/callback`
- Docker Compose default: `http://localhost:8080/auth/oidc/callback`

If any OIDC value is set without the others, the server fails startup so a
partial provider configuration is not silently ignored.

## Authentik OIDC example

To use [authentik](https://docs.goauthentik.io/add-secure-apps/providers/oauth2)
as the optional OIDC provider:

1. In the authentik Admin interface, go to **Applications > Applications** and
   create a new OAuth2/OIDC application/provider pair.
2. Use a recognizable application name such as `Stitch Keeper` and a slug such
   as `stitch-keeper`.
3. Configure the provider for the Authorization Code flow.
4. Add the redirect URI for the Stitch Keeper instance:
   - Local dev: `http://localhost:5173/auth/oidc/callback`
   - Docker Compose default: `http://localhost:8080/auth/oidc/callback`
   - Production: `https://stitch-keeper.example.com/auth/oidc/callback`
5. Include the `openid`, `email`, and `profile` scopes.
6. Copy the provider's client ID and client secret into Stitch Keeper's
   environment.

For an authentik application slug of `stitch-keeper`, the issuer URL is usually:

```sh
OIDC_ISSUER_URL=https://auth.example.com/application/o/stitch-keeper/
```

The matching OpenID Configuration URL should be reachable at:

```text
https://auth.example.com/application/o/stitch-keeper/.well-known/openid-configuration
```

Example local environment:

```sh
export APP_BASE_URL=http://localhost:5173
export SESSION_SECRET='replace-with-a-long-random-value'
export OIDC_ISSUER_URL=https://auth.example.com/application/o/stitch-keeper/
export OIDC_CLIENT_ID=your-authentik-client-id
export OIDC_CLIENT_SECRET=your-authentik-client-secret
```

After restart, `GET /api/auth/config` should report `"oidcEnabled":true`, and
unauthenticated users should be redirected to the OIDC provider automatically.

## Test authentication

- First account can register from a fresh database.
- Later signup is disabled unless `ALLOW_SIGNUPS=true`.
- Login succeeds with the registered email and password.
- Login fails with a bad password.
- `GET /api/stash` returns `401` without a session.
- A valid API token can read `/api/stash`; an invalid or revoked token returns
  `401`.
- API-token write requests return `403`.
- Existing default data appears under the first registered account.
- Later accounts do not see the first account's personal projects.

To connect Codex or another MCP client, see the [MCP setup guide](mcp.md).
