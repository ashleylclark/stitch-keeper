import {
  createMcpHandler,
  hostHeaderValidationResponse,
  originValidationResponse,
} from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createStitchKeeperServer } from './server.js';

export function readMcpConfig(env = process.env) {
  const enabled = env.MCP_ENABLED ?? 'false';
  if (!['true', 'false'].includes(enabled))
    throw new Error('MCP_ENABLED must be true or false.');
  const allowedHosts = (
    env.MCP_HTTP_ALLOWED_HOSTS ?? 'localhost,127.0.0.1,[::1]'
  )
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  if (enabled === 'true' && !allowedHosts.length)
    throw new Error(
      'MCP_HTTP_ALLOWED_HOSTS must contain at least one hostname.',
    );
  return { enabled: enabled === 'true', allowedHosts };
}

export function mountMcp(app, { config, resolveToken, createData, version }) {
  app.all('/mcp', async (request, response, next) => {
    if (!config.enabled) {
      response.status(404).json({ error: 'MCP is disabled.' });
      return;
    }
    let handler;
    try {
      const headers = new Headers();
      for (const name of ['host', 'origin']) {
        if (request.headers[name]) headers.set(name, request.headers[name]);
      }
      const validationRequest = new Request('http://localhost/mcp', {
        headers,
      });
      const rejected =
        hostHeaderValidationResponse(validationRequest, config.allowedHosts) ??
        originValidationResponse(validationRequest, config.allowedHosts);
      if (rejected) {
        response.status(rejected.status).send(await rejected.text());
        return;
      }
      const token = String(request.headers.authorization ?? '').match(
        /^Bearer ([^\s]+)$/i,
      )?.[1];
      const user = token ? resolveToken(token) : null;
      if (!user) {
        response
          .set('WWW-Authenticate', 'Bearer realm="stitch-keeper"')
          .status(401)
          .json({ error: 'A valid Stitch Keeper API token is required.' });
        return;
      }
      // Capture only this request's token identity; never share household state.
      const data = createData(user);
      handler = createMcpHandler(
        () => createStitchKeeperServer(data, version),
        { legacy: 'stateless' },
      );
      await toNodeHandler(handler)(request, response, request.body);
    } catch (error) {
      next(error);
    } finally {
      if (handler) await handler.close();
    }
  });
  app.use('/mcp', (error, _request, response, _next) => {
    void _next;
    console.error('Stitch Keeper MCP request failed', error);
    if (!response.headersSent)
      response
        .status(500)
        .json({ error: 'Stitch Keeper could not complete the request.' });
  });
}
