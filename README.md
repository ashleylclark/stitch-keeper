# Stitch Keeper

Stitch Keeper is a personal crochet and knitting tracker for managing stash items, patterns, and projects in one place.

It is designed for a single user who wants to answer questions like:

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

- Save pattern details including source, source URL, category, difficulty, notes, and instructions
- Add requirement lists for each pattern
- Match requirements against the stash to show whether a pattern is:
  - `ready-to-start`
  - `review-supplies`
  - `need-supplies`

### Projects

- Create projects from patterns or as standalone work
- Link stash items to a project
- Track project status: `planned`, `in-progress`, `need-supplies`, `paused`, `completed`
- Record stash usage quantities for consumable items
- Automatically decrement linked consumable stash quantities the first time a project is marked `completed`

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

Local URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

Useful scripts:

```bash
npm run build
npm run lint
npm run typecheck
npm run format
npm run format:check
```

## Releases

Releases are cut intentionally with `release-it`, not from every push to `main`.

Before releasing, export a GitHub token with permission to create releases:

```bash
export GITHUB_TOKEN=your_github_token
```

Then run one of:

```bash
npm run release
npm run release:patch
npm run release:minor
npm run release:major
npm run release:dry-run
```

A release will:

- run the existing lint and build checks
- bump `package.json`
- update `chart/Chart.yaml` version and `appVersion`
- create and push a `vX.Y.Z` git tag
- create a GitHub Release

The image publish workflow listens for pushed `v*` tags and publishes:

- `ghcr.io/ashleylclark/stitch-keeper:vX.Y.Z`
- `ghcr.io/ashleylclark/stitch-keeper:latest`
- a commit `sha` tag

## Persistence

- SQLite database path: `data/stitch-keeper.db`
- API entrypoint: `server/index.js`
- Database schema and seed data are created automatically on first startup

## Docker

Run the app with Docker Compose:

```bash
docker compose up --build
```

App URL:

- `http://localhost:8080`

Useful Docker commands:

```bash
docker compose logs -f
docker compose down
docker compose down -v
```

Notes:

- The container stores SQLite data in a named Docker volume mounted at `/app/data`
- `docker compose down -v` removes that volume and resets the app data

## API Overview

The Express server exposes simple JSON CRUD routes:

- `GET|POST|PUT|DELETE /api/stash`
- `GET|POST|PUT|DELETE /api/patterns`
- `GET|POST|PUT|DELETE /api/projects`
- `GET /api/health`

In production-style Docker runs, the same server also serves the built frontend from `dist/`.

## Project Structure

High-level layout:

```text
src/         React frontend
server/      Express API and SQLite setup
data/        Local SQLite database file
dist/        Built frontend output
```

Frontend areas are organized around stash, patterns, projects, and app shell/state concerns.
