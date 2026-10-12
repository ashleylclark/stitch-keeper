# Deployment and storage

[Back to the README](../README.md)

## Docker Compose

Run these commands from the repository root. Configure the session secret
before starting the app:

```sh
export SESSION_SECRET="$(openssl rand -hex 32)"
docker compose up --build
```

Keep a stable secret for a persistent deployment. Generating a different one
invalidates existing login cookies.

Open `http://localhost:8080`. Register the first account from the login screen,
or use your existing login if the database already contains accounts.

For Docker Compose, set `SESSION_SECRET` in your shell or a local `.env` file.
Set `APP_BASE_URL=http://localhost:8080` or rely on the Compose default. OIDC is
optional; see [authentication](authentication.md) for provider setup.

View logs or stop the app while keeping its data:

```sh
docker compose logs -f
docker compose down
```

The container stores SQLite and uploads in a named Docker volume mounted at
`/data`. To reset the app completely, `docker compose down -v` removes that
volume, including the collection, accounts, and uploaded images.

## Helm chart

The Helm chart lives in `chart/`. See the generated
[chart reference](../chart/README.md) for installation and configuration.

Useful chart commands:

```sh
npm run chart:lint
npm run chart:docs
```

## Persistence and backups

- Default local SQLite database path: `data/stitch-keeper.db`
- Default local uploaded images path: `data/uploads`
- Database schema and seed data are created automatically on first startup

For Docker Compose and Helm deployments, uploaded images live in the same
persistent `/data` volume as SQLite by default. Backups should include both the
database file and the `uploads/` directory.

## Optional MCP

See the [MCP setup guide](mcp.md) for client connections. MCP runs on the app's
existing port and is disabled by default.
