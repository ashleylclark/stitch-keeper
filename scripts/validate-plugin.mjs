import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = resolve(root, 'plugins/stitch-keeper');
const manifestPath = resolve(pluginRoot, '.codex-plugin/plugin.json');
const mcpPath = resolve(pluginRoot, '.mcp.json');
const skillPath = resolve(
  pluginRoot,
  'skills/stitch-keeper-workflows/SKILL.md',
);

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const mcp = JSON.parse(await readFile(mcpPath, 'utf8'));
const skill = await readFile(skillPath, 'utf8');

const errors = [];

if (manifest.name !== 'stitch-keeper') errors.push('unexpected plugin name');
const app = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
if (manifest.version.split('+')[0] !== app.version) {
  errors.push('plugin version must match the application version');
}
if (manifest.mcpServers !== './.mcp.json') errors.push('missing MCP manifest');
if (manifest.skills !== './skills/') errors.push('missing skills directory');

const server = mcp.mcpServers?.['stitch-keeper'];
if (server?.type !== 'streamable-http') errors.push('unexpected MCP transport');
if (server?.bearer_token_env_var !== 'STITCH_KEEPER_API_TOKEN') {
  errors.push('MCP bearer token must come from STITCH_KEEPER_API_TOKEN');
}
try {
  const endpoint = new URL(server?.url);
  if (
    !['http:', 'https:'].includes(endpoint.protocol) ||
    endpoint.pathname !== '/mcp'
  ) {
    errors.push('MCP URL must use HTTP(S) and end at /mcp');
  }
} catch {
  errors.push('MCP URL is invalid');
}

if (!skill.startsWith('---\nname: stitch-keeper-workflows\n')) {
  errors.push('skill frontmatter is missing or invalid');
}
if (skill.includes('[TODO:'))
  errors.push('skill contains an unfinished placeholder');

if (errors.length > 0) {
  console.error(`Plugin validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log('Stitch Keeper plugin validation passed.');
