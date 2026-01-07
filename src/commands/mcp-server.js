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

/**
 * Check if running in interactive terminal (manual invocation)
 * vs being called by an MCP client (piped stdin/stdout)
 */
function isInteractiveTerminal() {
  return process.stdin.isTTY && process.stdout.isTTY;
}

/**
 * Show setup instructions when run manually
 */
function showManualInvocationHelp() {
  // Use stderr since stdout is reserved for MCP protocol
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║              L4YERCAK3 MCP Server - Setup Guide              ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  console.error('');
  console.error('This command starts the MCP server for AI assistant integration.');
  console.error('It\'s typically called by your MCP client, not run directly.');
  console.error('');
  console.error('📦 Claude Code (CLI):');
  console.error('   l4yercak3 mcp-setup');
  console.error('   # or manually:');
  console.error('   claude mcp add l4yercak3 -- npx @l4yercak3/cli mcp-server');
  console.error('');
  console.error('🖥️  Claude Desktop:');
  console.error('   Add to ~/Library/Application Support/Claude/claude_desktop_config.json:');
  console.error('   {');
  console.error('     "mcpServers": {');
  console.error('       "l4yercak3": {');
  console.error('         "command": "npx",');
  console.error('         "args": ["@l4yercak3/cli", "mcp-server"]');
  console.error('       }');
  console.error('     }');
  console.error('   }');
  console.error('');
  console.error('🔌 Other MCP Clients (Cursor, Cody, Continue, etc.):');
  console.error('   Command: npx @l4yercak3/cli mcp-server');
  console.error('   Transport: stdio');
  console.error('');
  console.error('💡 Requirements:');
  console.error('   • Logged in to L4YERCAK3 (l4yercak3 login)');
  console.error('');
}

module.exports = {
  command: 'mcp-server',
  description: 'Start the MCP server for AI assistant integration',
  handler: async () => {
    // Note: All output goes to stderr because stdout is used for MCP protocol
    // console.error is used intentionally here

    // If running in an interactive terminal (not piped), show help
    if (isInteractiveTerminal()) {
      showManualInvocationHelp();
      console.error('Starting server anyway (press Ctrl+C to exit)...');
      console.error('');
    }

    try {
      await startServer();
    } catch (error) {
      console.error(`[L4YERCAK3 MCP] Failed to start server: ${error.message}`);
      process.exit(1);
    }
  },
};
