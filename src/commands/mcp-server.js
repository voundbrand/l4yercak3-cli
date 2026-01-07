/**
 * MCP Server Command
 *
 * Starts the L4YERCAK3 MCP server for Claude Code integration.
 * The server exposes L4YERCAK3 capabilities as MCP tools.
 *
 * Usage:
 *   l4yercak3 mcp-server
 *
 * To add to Claude Code:
 *   claude mcp add l4yercak3 -- npx l4yercak3 mcp-server
 *
 * @module commands/mcp-server
 */

const { startServer } = require('../mcp/server');

module.exports = {
  command: 'mcp-server',
  description: 'Start the MCP server for Claude Code integration',
  handler: async () => {
    // Note: All output goes to stderr because stdout is used for MCP protocol
    // console.error is used intentionally here

    try {
      await startServer();
    } catch (error) {
      console.error(`[L4YERCAK3 MCP] Failed to start server: ${error.message}`);
      process.exit(1);
    }
  },
};
