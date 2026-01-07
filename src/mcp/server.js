/**
 * L4YERCAK3 MCP Server
 *
 * Exposes L4YERCAK3 backend capabilities to Claude Code via MCP protocol.
 * This allows Claude Code to discover and use L4YERCAK3 features to help
 * users integrate their projects.
 *
 * Usage:
 * - Users add via: claude mcp add l4yercak3 -- npx l4yercak3 mcp-server
 * - Reads auth from ~/.l4yercak3/config.json (created by l4yercak3 login)
 *
 * @module mcp/server
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const { getAuthContext } = require('./auth');
const { getAvailableTools, executeTool } = require('./registry');

/**
 * Create and configure the MCP server
 */
function createServer() {
  const server = new Server(
    {
      name: 'l4yercak3',
      version: require('../../package.json').version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle ListTools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const authContext = await getAuthContext();
    const tools = getAvailableTools(authContext);

    return {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Handle CallTool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const authContext = await getAuthContext();
      const result = await executeTool(name, args || {}, authContext);

      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start the MCP server
 */
async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log startup to stderr (stdout is used for MCP protocol)
  console.error('[L4YERCAK3 MCP] Server started');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('[L4YERCAK3 MCP] Shutting down...');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('[L4YERCAK3 MCP] Shutting down...');
    await server.close();
    process.exit(0);
  });
}

module.exports = {
  createServer,
  startServer,
};
