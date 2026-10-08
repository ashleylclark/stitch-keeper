import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , rawUrl, ...flags] = process.argv;

if (!rawUrl) {
  console.error(
    'Usage: npm run plugin:configure -- <mcp-url> [--allow-insecure-http]',
  );
  process.exit(1);
}

let endpoint;
try {
  endpoint = new URL(rawUrl);
} catch {
  console.error('The MCP URL is invalid.');
  process.exit(1);
}

const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(
  endpoint.hostname,
);
const allowInsecure = flags.includes('--allow-insecure-http');

if (
  endpoint.protocol !== 'https:' &&
  !(endpoint.protocol === 'http:' && loopback)
) {
  if (!(endpoint.protocol === 'http:' && allowInsecure)) {
    console.error(
      'Non-local endpoints must use HTTPS. Pass --allow-insecure-http only for a trusted private network.',
    );
    process.exit(1);
  }
}
if (
  endpoint.pathname !== '/mcp' ||
  endpoint.search ||
  endpoint.hash ||
  endpoint.username ||
  endpoint.password
) {
  console.error(
    'The MCP URL must end with /mcp and cannot contain credentials, a query, or a fragment.',
  );
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mcpPath = resolve(root, 'plugins/stitch-keeper/.mcp.json');
const manifestPath = resolve(
  root,
  'plugins/stitch-keeper/.codex-plugin/plugin.json',
);
const mcp = JSON.parse(await readFile(mcpPath, 'utf8'));
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

mcp.mcpServers['stitch-keeper'].url = endpoint.toString();
const baseVersion = manifest.version.split('+')[0];
const timestamp = new Date()
  .toISOString()
  .replace(/[-:TZ.]/g, '')
  .slice(0, 14);
manifest.version = `${baseVersion}+codex.local-${timestamp}`;

await writeFile(mcpPath, `${JSON.stringify(mcp, null, 2)}\n`);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Configured Stitch Keeper MCP endpoint: ${endpoint}`);
console.log(`Updated plugin cachebuster: ${manifest.version}`);
console.log(
  'Reinstall with: codex plugin add stitch-keeper@stitch-keeper-local',
);
