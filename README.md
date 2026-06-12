# Stitch Keeper

Stitch Keeper is a personal crochet and knitting tracker for managing stash items, patterns, and projects in one place.

It is designed for fiber artists and households who want to answer questions like:

- What yarn, hooks, eyes, and notions do I already have?
- Which patterns can I start right now with my current stash?
- Which projects are active, paused, or finished?
- How much of my stash was actually used when a project was completed?

## What It Does

### Stash

- Track yarn, hooks, needles, safety eyes, stuffing, and other supplies
- Store details like brand, color, yarn weight, size, material, unit, and notes
- Mark stash status such as `in-stock`, `low-stock`, `out-of-stock`, or `not-replacing`

### Patterns

- Save pattern details including source, source URL, image URLs, category, difficulty, notes, and instructions
- Add optional image URLs for the finished object, the pattern chart, and individual instruction steps
- Add requirement lists for each pattern
- Match requirements against the stash to show whether a pattern is:
  - `ready-to-start`
  - `review-supplies`
  - `need-supplies`

### Projects

- Create projects from patterns or as standalone work
- Link stash items to a project
- Keep projects personal to the signed-in household member
- Track project status: `planned`, `in-progress`, `need-supplies`, `paused`, `completed`
- Record stash usage quantities for consumable items
- Automatically decrement linked consumable household stash quantities the first time a project is marked `completed`

### Dashboard

- View a compact home page with:
  - active project counts
  - ready-to-start pattern counts
  - recently added patterns
  - finished project totals

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Express
- SQLite via `better-sqlite3`

## Requirements

- Node.js 22.x recommended
- npm 10+
- Docker Engine / Docker Desktop with Docker Compose support for containerized runs
- A modern browser for the frontend UI

## Local Development

Install dependencies and start both the frontend and API:

```bash
npm install
npm run dev
```

The API requires a session secret before it will start:

```bash
export APP_BASE_URL=http://localhost:5173
export SESSION_SECRET='replace-with-a-long-random-value'
```

See [Authentication](#authentication) for account setup and optional OIDC
configuration.

Local URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

Useful scripts:

```bash
npm run build
npm run lint
npm run typecheck
npm run chart:lint
npm run chart:docs
npm run format
npm run format:check
```

## Persistence

- SQLite database path: `data/stitch-keeper.db`
- API entrypoint: `server/index.js`
- Database schema and seed data are created automatically on first startup

## Authentication

Stitch Keeper includes self-hosted auth v1. Local email/password accounts are
enabled by default, and OIDC can be added as an optional sign-in method.

### Users And Households

The app uses households as shared workspaces:

- A **user** is a person who can sign in.
- A **household** is a shared workspace for stash and patterns.
- Household members can share the same stash and pattern library when they
  belong to the same household.
- Projects are personal to the signed-in user, but live inside a household so
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

Unknown role values are treated as `viewer` for safety. Future household flows
will let owners invite and remove members, members leave households, users
delete their own accounts with warnings, and app admins manage all users if an
app-admin role is added later.

For a single-user install, the first account owns one household and the model
mostly feels like a named workspace. For multi-person use, members can share
stash and patterns without mixing up each person's active projects. Household
invite and member-management flows are future work; for now, new accounts get
their own household unless membership is added directly in the database.

Server auth behavior:

- `SESSION_SECRET` is required and must be a long, random value.
- `APP_BASE_URL` controls callback URLs and secure-cookie behavior; it defaults
  to `http://localhost:$PORT` when omitted.
- The first local account can be created from the login screen.
- The first local or OIDC account claims the default local user and household,
  so existing seeded or migrated data remains visible after account setup.
- After the first local account exists, new local registrations are disabled
  unless `ALLOW_SIGNUPS=true`.
- Signed HTTP-only session cookies store only `userId`, `activeHouseholdId`, and
  expiration metadata.
- All API routes except `/api/health` and `/api/auth/config` require an
  authenticated session.

For public deployments, run the app behind HTTPS and use a strong
`SESSION_SECRET`. HTTPS makes session cookies `Secure` when `APP_BASE_URL` uses
an `https://` URL.

Optional OIDC sign-in is enabled only when all three values are provided:

```bash
export OIDC_ISSUER_URL=https://your-provider.example
export OIDC_CLIENT_ID=your-client-id
export OIDC_CLIENT_SECRET=your-client-secret
```

Register these redirect URIs with the OIDC provider:

- Local dev: `http://localhost:5173/auth/oidc/callback`
- Docker Compose default: `http://localhost:8080/auth/oidc/callback`

If any OIDC value is set without the others, the server fails startup so a
partial provider configuration is not silently ignored.

### Authentik OIDC Example

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

```bash
OIDC_ISSUER_URL=https://auth.example.com/application/o/stitch-keeper/
```

The matching OpenID Configuration URL should be reachable at:

```text
https://auth.example.com/application/o/stitch-keeper/.well-known/openid-configuration
```

Example local environment:

```bash
export APP_BASE_URL=http://localhost:5173
export SESSION_SECRET='replace-with-a-long-random-value'
export OIDC_ISSUER_URL=https://auth.example.com/application/o/stitch-keeper/
export OIDC_CLIENT_ID=your-authentik-client-id
export OIDC_CLIENT_SECRET=your-authentik-client-secret
```

After restart, `GET /api/auth/config` should report `"oidcEnabled":true`, and
unauthenticated users should be redirected to the OIDC provider automatically.

Manual auth QA checklist:

- First account can register from a fresh database.
- Later signup is disabled unless `ALLOW_SIGNUPS=true`.
- Login succeeds with the registered email and password.
- Login fails with a bad password.
- `GET /api/stash` returns `401` without a session.
- Existing default data appears under the first registered account.
- Later accounts do not see the first account's personal projects.

## Releases

Releases are cut intentionally with `release-it`, not from every push to `main`.

Before releasing, export a GitHub token with permission to create releases:

```bash
export GITHUB_TOKEN=your_github_token
```

Then run:

```bash
npm run release
```

A release will:

- run the existing lint and build checks
- bump `package.json`
- create and push a `vX.Y.Z` git tag
- create a GitHub Release

Pushing a release tag also starts the GitHub Actions workflows that publish the
container image and Helm chart to GHCR. `release-it` does not currently update
the chart metadata, so update `chart/Chart.yaml` separately when the chart
version or default app image tag should change.

## Helm Chart

The Helm chart lives in `chart/` and has its own generated README:
[`chart/README.md`](chart/README.md).

Useful chart commands:

```bash
npm run chart:lint
npm run chart:docs
```

## Docker

Run the app with Docker Compose:

```bash
docker compose up --build
```

App URL:

- `http://localhost:8080`

For Docker Compose, set `SESSION_SECRET` in your shell or a local `.env` file.
Set `APP_BASE_URL=http://localhost:8080` or rely on the Compose default. OIDC is
optional; see [Authentication](#authentication) for provider setup.

Useful Docker commands:

```bash
docker compose logs -f
docker compose down
docker compose down -v
```

Notes:

- The container stores SQLite data in a named Docker volume mounted at `/data`
- `docker compose down -v` removes that volume and resets the app data

## API Overview

The Express server exposes simple JSON CRUD routes:

- `GET|POST|PUT|DELETE /api/stash`
- `GET|POST|PUT|DELETE /api/patterns`
- `GET|POST|PUT|DELETE /api/projects`
- `GET /api/me`
- `GET /api/auth/config`
- `GET /api/health`

All API routes except `/api/health` and `/api/auth/config` require an
authenticated session. In production-style Docker runs, the same server also
serves the built frontend from `dist/`.

## Project Structure

High-level layout:

```text
src/         React frontend
server/      Express API and SQLite setup
data/        Local SQLite database file
dist/        Built frontend output
```

Frontend areas are organized around stash, patterns, projects, and app shell/state concerns.
