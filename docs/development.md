# Development

[Back to the README](../README.md)

## Run locally

Requirements: Node.js 22.x recommended, npm 10+, and a modern browser.
From the repository root:

```sh
npm install
export APP_BASE_URL=http://localhost:5173
export SESSION_SECRET="$(openssl rand -hex 32)"
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at
`http://localhost:3001`. Register the first account from the login screen;
there is no built-in default password. A previously used database keeps its
existing accounts and collection. Changing `SESSION_SECRET` requires logging
in again.

SQLite and sample data are created automatically on first startup. To test
with a separate database while preserving your existing collection:

```sh
SQLITE_PATH=data/local-test.db npm run dev
```

This path is reused on later starts; it is fresh only if the file does not
already exist. Local data files are ignored by Git.

## Checks and scripts

```sh
npm test
npm run build
npm run lint
npm run typecheck
npm run plugin:validate
npm run chart:lint
npm run chart:docs
npm run format:check
```

`npm test` covers the built-in MCP endpoint and its access controls.
`npm run format` formats files in place. Chart checks require Helm, and chart
documentation generation requires helm-docs.

For manual login and household-role checks, see the
[authentication guide](authentication.md). For a real client connection,
follow the [MCP setup guide](mcp.md).

## API overview

The Express server exposes JSON routes for creating, reading, updating, and
deleting collection records:

- `GET|POST|PUT|DELETE /api/stash`
- `GET|POST|PUT|DELETE /api/patterns`
- `GET|POST|PUT|DELETE /api/projects`
- `GET /api/me`
- `GET /api/auth/config`
- `GET /api/health`

All API routes except `/api/health` and `/api/auth/config` require an
authenticated browser session or read-only API token. API tokens can read
collection data with `GET` and `HEAD`; they cannot write or access the
session-only token-management endpoints. See [API tokens](authentication.md#api-tokens).

In Docker deployments, the same server also serves the built frontend from
`dist/`.

## Project structure

High-level layout:

```text
src/         React frontend
server/      Express API and SQLite setup
data/        Local SQLite database and uploaded images
plugins/     Codex plugin and collection skills
docs/        Setup and reference guides
dist/        Built frontend output
```

Frontend code is organized around stash, patterns, projects, and shared
application state.

## Releases

Releases are cut intentionally with `release-it`, not from every push to `main`.

Before releasing, export a GitHub token with permission to create releases:

```sh
export GITHUB_TOKEN=your_github_token
```

Then run:

```sh
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

The Codex plugin version must also match `package.json`. Update
`plugins/stitch-keeper/.codex-plugin/plugin.json` for the release and run
`npm run plugin:validate`; the release tooling does not update it automatically.
