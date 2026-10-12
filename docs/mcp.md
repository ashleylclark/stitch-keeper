# Connect Stitch Keeper to an MCP client

[Back to the README](../README.md)

Stitch Keeper's optional MCP endpoint lets a client such as Codex read your
collection. It provides four tools: `list-yarn`, `search-yarn`, `list-projects`,
and `search-patterns`. These tools cannot change collection data.

## 1. Enable MCP in Stitch Keeper

MCP is disabled by default. Enable it with `MCP_ENABLED=true` in your existing
Stitch Keeper server configuration. It uses the app's existing port.

For local development, run from the repository root. These examples use a
POSIX shell on macOS or Linux:

```sh
npm install
export APP_BASE_URL=http://localhost:5173
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
or log in with an existing account.

The local MCP endpoint is `http://127.0.0.1:3001/mcp`. For Docker or Helm,
see [deployment and storage](deployment.md).

`MCP_HTTP_ALLOWED_HOSTS` accepts comma-separated client-facing hostnames
without schemes or ports. It defaults to `localhost,127.0.0.1,[::1]`.
When starting a Docker container, add `-e MCP_ENABLED=true` and, if needed,
`-e MCP_HTTP_ALLOWED_HOSTS=stitch.example.internal`. For Docker Compose, add
these variables to the app service's `environment` mapping; the supplied
Compose file does not forward them automatically.

For Helm, use the chart's existing `env` values:

```yaml
env:
  - name: MCP_ENABLED
    value: 'true'
  - name: MCP_HTTP_ALLOWED_HOSTS
    value: 'stitch.example.internal'
```

No extra service, port, MCP API key, or Kubernetes token Secret is needed.

## 2. Create an API token

In Stitch Keeper, open **Settings → API Tokens**, create a token, and copy it
when shown. It starts with `sk_`; it cannot be displayed again afterward.

The browser UI authenticates using your login cookie. External clients use
this API token instead. The token is scoped to the household active when it
was created, and project access remains scoped to its user. Revoking it or
removing the user's household membership prevents further MCP access.

## Connection details for other clients

For an MCP client that supports Streamable HTTP and custom bearer tokens:

- **Transport:** Streamable HTTP
- **URL:** `http://127.0.0.1:3001/mcp` for a local instance
- **Authorization header:** `Authorization: Bearer <your sk_ token>`

Use your deployed instance's HTTPS `/mcp` URL for a remote connection. Client
configuration varies; the steps below cover the included Codex plugin.

## 3. Install the Codex plugin

Codex is the tested client example below. The server uses Streamable HTTP
with bearer-token authentication; another client must support both to use
this setup. The included plugin packages the connection and collection skills
for Codex.

### Desktop app (no Codex CLI required)

The plugin and its local marketplace are included in this checkout:

- Plugin: `plugins/stitch-keeper`
- Marketplace: `.agents/plugins/marketplace.json`

1. Open this repository as a project in the desktop app's Codex mode.
2. Fully quit and reopen the desktop app so it discovers the local marketplace.
3. Open the **Plugins Directory** and select **Stitch Keeper (local)** as the
   marketplace source.
4. Find **Stitch Keeper**, install it, and make sure it is enabled.
5. Continue with the token setup below, then start a new Codex chat.

These steps use the repository's marketplace; you do not need to create a
personal marketplace or install the Codex CLI. If the local source does not
appear, confirm that the open project is this checkout and that
`.agents/plugins/marketplace.json` is present. See OpenAI's
[local plugin installation guide](https://developers.openai.com/plugins/build/plugins)
for the desktop marketplace workflow.

Keep the checkout available. The default connection is
`http://127.0.0.1:3001/mcp`. The installed plugin is a cached copy; after
changing its configuration, restart the app and refresh or reinstall it from
the same marketplace before starting a new chat.

If you already installed Stitch Keeper from another marketplace, disable that
older installation to avoid having two copies enabled.

### Optional: install with the Codex CLI

Only use these commands if the Codex CLI is already available in your terminal
(`codex --help`). From the repository root:

```sh
codex plugin marketplace add .
codex plugin add stitch-keeper@stitch-keeper-local
```

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
desktop app. If the app still reports a missing token, confirm the command
ran successfully and fully quit the app before reopening it. The optional
CLI method below is another way to test if you have the CLI installed.

To remove the desktop environment setting later:

```sh
launchctl unsetenv STITCH_KEEPER_API_TOKEN
```

### Optional: Codex CLI

If you have the Codex CLI installed, enter the token without displaying it
in zsh, then launch Codex from the same terminal:

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

From this checkout, configure the plugin using npm (these commands do not
require the Codex CLI):

```sh
npm run plugin:configure -- https://stitch.example.internal/mcp
npm run plugin:validate
```

Replace the example URL with your own. The helper updates the plugin version
with a local cache suffix so the new connection settings are picked up.
Restart the desktop app and refresh or reinstall **Stitch Keeper** from the
**Stitch Keeper (local)** source in the Plugins Directory, then start a new
chat. If you use the optional CLI workflow instead, reinstall with
`codex plugin add stitch-keeper@stitch-keeper-local`.

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
