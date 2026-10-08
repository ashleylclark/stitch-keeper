# Connect Stitch Keeper to an MCP client

Stitch Keeper's optional MCP endpoint lets a client such as Codex read your
collection. It provides four tools: `list-yarn`, `search-yarn`, `list-projects`,
and `search-patterns`. These tools cannot change collection data.

## 1. Enable MCP in Stitch Keeper

MCP is disabled by default. Enable it with `MCP_ENABLED=true` in your existing
Stitch Keeper server configuration. It uses the app's existing port.

For local development, from the repository root:

```sh
export SESSION_SECRET="$(openssl rand -hex 32)"
export MCP_ENABLED=true
npm run start:server
```

If you already have a `SESSION_SECRET`, keep using it. The generated value
above is for local testing; changing it invalidates existing login cookies.
For a deployed instance, keep a stable secret in your deployment configuration.

In another terminal, start the browser UI:

```sh
npm run dev:client
```

Open the URL Vite prints. Register an account if this is a fresh database,
or log in with an existing account. There is no built-in default password.

The local MCP endpoint is `http://127.0.0.1:3001/mcp`. For Docker or Helm,
see [Built-in MCP in the README](../README.md#built-in-mcp-optional).

## 2. Create an API token

In Stitch Keeper, open **Settings → API Tokens**, create a token, and copy it
when shown. It starts with `sk_`; it cannot be displayed again afterward.

The browser UI authenticates using your login cookie. External clients use
this API token instead. The token is scoped to the household active when it
was created, and project access remains scoped to its user. Revoking it or
removing the user's household membership prevents further MCP access.

## 3. Install the Codex plugin

The plugin is included in this repository under `plugins/stitch-keeper`.
You need the Codex CLI available in your terminal (`codex --help`).

From the repository root, register the included local marketplace and install:

```sh
codex plugin marketplace add .
codex plugin add stitch-keeper@stitch-keeper-local
```

The marketplace points at the plugin in this checkout; keep the checkout
available. The default connection is `http://127.0.0.1:3001/mcp`. The installed
plugin is a cached copy, so reinstall after changing its configuration.

If you already installed Stitch Keeper from another marketplace, disable that
older installation to avoid having two copies enabled.

## 4. Give Codex the token

The plugin reads its token from `STITCH_KEEPER_API_TOKEN`. Keep the token out
of tracked files and chat messages.

### macOS desktop app

In a Mac terminal running zsh, enter:

```zsh
read -rs 'stitch_token?Paste your Stitch Keeper API token: '
echo
launchctl setenv STITCH_KEEPER_API_TOKEN "$stitch_token"
unset stitch_token
```

Paste the token at the prompt and press Enter. Input stays hidden, and the
token is not entered as part of a command saved in shell history.

Fully quit and reopen the desktop app so its new process can inherit the
variable. Start a new Codex chat. Leave the Stitch Keeper server running.
This environment setup is temporary; repeat it after logout or restart.
Exporting a variable in a terminal alone does not update an already-running
desktop app. If the app still reports a missing token, use the CLI steps below
to verify the connection from a process with the variable explicitly set.

To remove the desktop environment setting later:

```sh
launchctl unsetenv STITCH_KEEPER_API_TOKEN
```

### Codex CLI

In zsh, enter the token without displaying it, then launch Codex from the
same terminal:

```zsh
read -rs 'STITCH_KEEPER_API_TOKEN?Paste your Stitch Keeper API token: '
echo
export STITCH_KEEPER_API_TOKEN
codex
```

The variable is available to Codex launched from that shell. On other shells
or operating systems, set the same environment variable using their supported
method before launching Codex.

## 5. Verify the connection

In a new Codex chat, ask: **“Use Stitch Keeper to list my yarn.”** Compare
results with the collection shown in the UI. Then try searching for a known
yarn or pattern and listing your projects.

To verify revocation, revoke your test token in the UI and repeat a request.
It should fail authentication. Create a new token if you want to keep using
MCP afterward.

## Connect to a hosted instance

Enable MCP in the deployed app and set `MCP_HTTP_ALLOWED_HOSTS` to the
client-facing hostname, without a scheme or port. Your reverse proxy must
forward `/mcp`, including POST requests and Authorization headers.

From this checkout, configure and reinstall the plugin:

```sh
npm run plugin:configure -- https://stitch.example.internal/mcp
npm run plugin:validate
codex plugin add stitch-keeper@stitch-keeper-local
```

Replace the example URL with your own. The helper updates the plugin version
with a local cache suffix so the new connection settings are picked up.
Restart the desktop app and start a new chat after reinstalling.

Use HTTPS outside a trusted machine or private network. Localhost HTTP is
accepted; configuring HTTP on another host requires `--allow-insecure-http`.
Plain HTTP does not encrypt bearer tokens. Create the API token in the
instance you are connecting to; a token from a local test database will not
authenticate to a different deployed database.

## Troubleshooting

- **Missing `SESSION_SECRET`:** set it in the environment that starts the server.
- **404 from `/mcp`:** confirm `MCP_ENABLED=true` on the server you reached.
- **401 / invalid token:** confirm the client has a current token from that instance.
- **403 / host or origin rejected:** add the client-facing hostname to
  `MCP_HTTP_ALLOWED_HOSTS`.
- **Plugin still uses an old URL:** rerun the configuration helper, reinstall,
  and start a new chat.
- **Connection refused:** confirm the server is running and the plugin points
  at the correct host and port. `127.0.0.1` means the machine running Codex.
