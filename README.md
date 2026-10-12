# Stitch Keeper

Stitch Keeper is a personal crochet and knitting tracker for managing stash items, patterns, and projects in one place.

It is designed for fiber artists and households who want to answer questions like:

- What yarn, hooks, eyes, and notions do I already have?
- Which patterns can I start right now with my current stash?
- Which projects are active, paused, or finished?
- How much of my stash was actually used when a project was completed?

See the [screenshot gallery](docs/screenshots.md).

## What It Does

### Stash

- Track yarn, hooks, needles, safety eyes, stuffing, and other supplies
- Store details like brand, color, yarn weight, size, material, unit, and notes
- Mark stash status such as `in-stock`, `low-stock`, `out-of-stock`, or `not-replacing`

### Patterns

- Save pattern details including source, source URL, image URLs, category, difficulty, notes, and instructions
- Add optional external image URLs or private uploaded images for the finished object, the pattern chart, and individual instruction steps
- Add requirement lists for each pattern
- Match requirements against the stash to show whether a pattern is:
  - `ready-to-start`
  - `review-supplies`
  - `need-supplies`

### Projects

- Create projects from patterns or as standalone work
- Link stash items to a project
- Keep projects personal to the signed-in household member
- Add an optional finished project photo without using a public image host
- Track project status: `planned`, `in-progress`, `need-supplies`, `paused`, `completed`
- Record stash usage quantities for consumable items
- Automatically subtract usage from linked consumable household stash items the first time a project is marked `completed`

### Dashboard

- View a compact home page with:
  - active project counts
  - ready-to-start pattern counts
  - recently added patterns
  - finished project totals

## Get started

Stitch Keeper is self-hosted. You can run it with Docker Compose, deploy the
Helm chart, or run it locally for development.

### Docker Compose

With Docker and Docker Compose installed, run these commands from the
repository root:

```sh
export SESSION_SECRET="$(openssl rand -hex 32)"
docker compose up --build
```

Open `http://localhost:8080` and register your first account. There is no
default password. If this installation already has accounts, use your
existing login. Keep a stable session secret for a persistent deployment.

See [deployment and storage](docs/deployment.md) for Docker, Helm, and backups.

### Local development

With Node.js 22.x and npm 10+, run from the repository root:

```sh
npm install
export APP_BASE_URL=http://localhost:5173
export SESSION_SECRET="$(openssl rand -hex 32)"
npm run dev
```

Open `http://localhost:5173`. The API runs on port `3001`.
See the [development guide](docs/development.md) for testing and release steps.

## Accounts and households

Local email/password login is available by default, with optional OIDC sign-in.
Stash and patterns belong to a household; projects are personal to each user.
The first account claims the sample collection. Household invitations and
member-management screens are future work.

See [authentication](docs/authentication.md) for account setup, household
roles, API tokens, and OIDC configuration.

## Built-in MCP (optional)

Connect Codex or another MCP client to read your yarn, projects, and patterns.
MCP is disabled by default and runs on the app's existing port when enabled
with `MCP_ENABLED=true`. Clients authenticate with a read-only API token from
**Settings → API Tokens**.

The [MCP setup guide](docs/mcp.md) covers enabling the endpoint, installing the
included Codex plugin, supplying a token, and verifying the connection.

## Documentation

- [Screenshot gallery](docs/screenshots.md)
- [Deployment and storage](docs/deployment.md)
- [Authentication and households](docs/authentication.md)
- [MCP and Codex setup](docs/mcp.md)
- [Development, testing, and releases](docs/development.md)
- [Helm chart reference](chart/README.md)

## Stack

React 19, TypeScript, Vite, Tailwind CSS, Express, and SQLite via `better-sqlite3`.
