import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { searchYarn, searchPatterns } from './search.js';

export function createStitchKeeperServer(data, version) {
  const server = new McpServer({ name: 'stitch-keeper', version });
  const tools = [
    [
      'list-yarn',
      'List yarn currently stored in Stitch Keeper.',
      z.object({}),
      () => data.listYarn(),
    ],
    [
      'search-yarn',
      'Search yarn by name, brand, color, material, or weight.',
      z.object({ query: z.string().trim().min(1) }),
      ({ query }) => searchYarn(data.listYarn(), query),
    ],
    [
      'list-projects',
      'List projects stored in Stitch Keeper.',
      z.object({}),
      () => data.listProjects(),
    ],
    [
      'search-patterns',
      'Search patterns by name, category, difficulty, source, or notes.',
      z.object({ query: z.string().trim().min(1) }),
      ({ query }) => searchPatterns(data.listPatterns(), query),
    ],
  ];
  for (const [name, description, inputSchema, action] of tools) {
    server.registerTool(
      name,
      {
        description,
        inputSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      async (args) => {
        try {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(await action(args), null, 2),
              },
            ],
          };
        } catch (error) {
          console.error('Stitch Keeper MCP tool failed', error);
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: 'Stitch Keeper could not complete the request. Check the server logs for details.',
              },
            ],
          };
        }
      },
    );
  }
  return server;
}
