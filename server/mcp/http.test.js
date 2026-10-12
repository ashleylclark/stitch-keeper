import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { request as httpRequest, createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import { mountMcp, readMcpConfig } from './http.js';

const directory = mkdtempSync(path.join(tmpdir(), 'stitch-mcp-test-'));
process.env.SQLITE_PATH = path.join(directory, 'test.db');
const { initializeDatabase, sqlite } = await import('../db.js');
const { createLocalUser } = await import('../repositories/users.js');
const { createApiToken, revokeApiToken, findSessionUserForApiToken } =
  await import('../repositories/api-tokens.js');
const { saveStashItem } = await import('../repositories/stash.js');
const { saveProject } = await import('../repositories/projects.js');
const { savePattern } = await import('../repositories/patterns.js');
const { createMcpData } = await import('./data.js');
initializeDatabase();
// Remove starter data from the isolated fixture, before the first user claims it.
sqlite.exec(
  'DELETE FROM projects; DELETE FROM patterns; DELETE FROM stash_items;',
);

function household(name) {
  const user = createLocalUser({
    email: `${name}@example.test`,
    displayName: name,
    passwordHash: 'test-only',
  });
  const owner = { userId: user.userId, householdId: user.activeHouseholdId };
  saveStashItem(owner, {
    id: `yarn-${name}`,
    name: `${name} Cotton`,
    category: 'yarn',
    quantity: 2,
  });
  saveStashItem(owner, {
    id: `hook-${name}`,
    name: `${name} Hook`,
    category: 'hook',
    quantity: 1,
  });
  saveProject(owner, {
    id: `project-${name}`,
    name: `${name} Project`,
    status: 'planned',
    stashUsages: [],
    completedInstructionSteps: [],
  });
  savePattern(owner, {
    id: `pattern-${name}`,
    name: `${name} Hat`,
    instructions: '',
    instructionSections: [],
    requirements: [],
  });
  return { owner, ...createApiToken(owner, 'MCP test') };
}

async function serve(t, enabled = true) {
  const app = express();
  app.use(express.json());
  mountMcp(app, {
    config: { enabled, allowedHosts: ['127.0.0.1'] },
    resolveToken: findSessionUserForApiToken,
    createData: createMcpData,
    version: '0.8.0',
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}/mcp`;
}
async function rpc(url, token, method, params = {}, extraHeaders = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const text = await response.text();
  const data =
    text.startsWith('event:') || text.startsWith('data:')
      ? text
          .split('\n')
          .find((line) => line.startsWith('data:'))
          ?.slice(5)
          .trim()
      : text;
  return { status: response.status, body: data ? JSON.parse(data) : null };
}
function rows(result) {
  return JSON.parse(result.body.result.content[0].text);
}

test('MCP defaults off and rejects invalid configuration', () => {
  assert.equal(readMcpConfig({}).enabled, false);
  assert.throws(() => readMcpConfig({ MCP_ENABLED: 'yes' }));
  assert.throws(() =>
    readMcpConfig({ MCP_ENABLED: 'true', MCP_HTTP_ALLOWED_HOSTS: ',' }),
  );
});
test('disabled endpoint returns 404', async (t) => {
  const url = await serve(t, false);
  assert.equal((await rpc(url, null, 'tools/list')).status, 404);
  assert.equal((await fetch(url)).status, 404);
});
test('requires API tokens and rejects untrusted hosts and origins', async (t) => {
  const url = await serve(t);
  assert.equal(
    (
      await rpc(
        url,
        null,
        'tools/list',
        {},
        { Cookie: 'stitch_keeper_session=anything' },
      )
    ).status,
    401,
  );
  assert.equal((await rpc(url, 'sk_invalid', 'tools/list')).status, 401);
  const rejectedHost = await new Promise((resolve, reject) => {
    const request = httpRequest(
      url,
      { headers: { Host: 'evil.example' } },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response.statusCode));
      },
    );
    request.on('error', reject);
    request.end();
  });
  assert.equal(rejectedHost, 403);
  assert.equal(
    (await fetch(url, { headers: { Origin: 'https://evil.example' } })).status,
    403,
  );
});
test('tools preserve token household, user scope, search, and revocation', async (t) => {
  const url = await serve(t);
  const alice = household('alice');
  const bob = household('bob');
  const tools = await rpc(url, alice.token, 'tools/list');
  assert.equal(tools.status, 200);
  assert.deepEqual(tools.body.result.tools.map((tool) => tool.name).sort(), [
    'list-projects',
    'list-yarn',
    'search-patterns',
    'search-yarn',
  ]);
  for (const tool of tools.body.result.tools)
    assert.equal(tool.annotations.readOnlyHint, true);
  const results = await Promise.all(
    [alice, bob].map(async (user) =>
      rows(
        await rpc(url, user.token, 'tools/call', {
          name: 'list-yarn',
          arguments: {},
        }),
      ),
    ),
  );
  assert.deepEqual(
    results.map((items) => items.map((item) => item.id)),
    [['yarn-alice'], ['yarn-bob']],
  );
  const bobUser = findSessionUserForApiToken(bob.token);
  const otherOwner = {
    userId: bobUser.user.id,
    householdId: alice.owner.householdId,
  };
  saveProject(otherOwner, {
    id: 'other-user-project',
    name: 'Private project',
    status: 'planned',
    stashUsages: [],
    completedInstructionSteps: [],
  });
  assert.deepEqual(
    rows(
      await rpc(url, alice.token, 'tools/call', {
        name: 'list-projects',
        arguments: {},
      }),
    ).map((item) => item.id),
    ['project-alice'],
  );
  assert.equal(
    rows(
      await rpc(url, alice.token, 'tools/call', {
        name: 'search-yarn',
        arguments: { query: 'COTTON' },
      }),
    ).length,
    1,
  );
  assert.equal(
    rows(
      await rpc(url, alice.token, 'tools/call', {
        name: 'search-patterns',
        arguments: { query: 'hat' },
      }),
    )[0].id,
    'pattern-alice',
  );
  assert.equal(
    rows(
      await rpc(url, alice.token, 'tools/call', {
        name: 'search-yarn',
        arguments: { query: 'bob' },
      }),
    ).length,
    0,
  );
  const invalid = await rpc(url, alice.token, 'tools/call', {
    name: 'search-yarn',
    arguments: { query: ' ' },
  });
  assert.ok(invalid.body.error || invalid.body.result?.isError);
  revokeApiToken(alice.owner, alice.apiToken.id);
  assert.equal((await rpc(url, alice.token, 'tools/list')).status, 401);
  assert.equal((await rpc(url, bob.token, 'tools/list')).status, 200);
  sqlite
    .prepare('DELETE FROM household_members WHERE user_id = ?')
    .run(bob.owner.userId);
  assert.equal((await rpc(url, bob.token, 'tools/list')).status, 401);
});
test('main app serves MCP alongside the API without granting token write access', async (t) => {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(process.execPath, ['server/index.js'], {
    env: {
      ...process.env,
      PORT: String(port),
      SQLITE_PATH: path.join(directory, 'app.db'),
      SESSION_SECRET: 'integration-test-secret',
      APP_BASE_URL: `http://127.0.0.1:${port}`,
      MCP_ENABLED: 'true',
      MCP_HTTP_ALLOWED_HOSTS: '127.0.0.1',
      OIDC_ISSUER_URL: '',
      OIDC_CLIENT_ID: '',
      OIDC_CLIENT_SECRET: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  });
  await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(
      () => reject(new Error('App startup timed out')),
      10000,
    );
    child.stdout.on('data', (chunk) => {
      output += chunk;
      if (output.includes('server listening')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`App exited: ${code}`));
    });
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
  const base = `http://127.0.0.1:${port}`;
  const registration = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'app@example.test',
      displayName: 'App user',
      password: 'test-password-12345',
    }),
  });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get('set-cookie').split(';')[0];
  const tokenResponse = await fetch(`${base}/api/me/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name: 'MCP' }),
  });
  assert.equal(tokenResponse.status, 201);
  const { token } = await tokenResponse.json();
  assert.equal(
    (
      await fetch(`${base}/api/stash`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(`${base}/api/stash`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      })
    ).status,
    403,
  );
  const initialized = await rpc(`${base}/mcp`, token, 'initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'integration-test', version: '1.0.0' },
  });
  assert.equal(initialized.status, 200);
  assert.equal(initialized.body.result.serverInfo.name, 'stitch-keeper');
  assert.equal(
    (await rpc(`${base}/mcp`, token, 'tools/list')).body.result.tools.length,
    4,
  );
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
});
test.after(() => {
  sqlite.close();
  rmSync(directory, { recursive: true, force: true });
});
