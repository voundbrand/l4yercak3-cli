/**
 * MCP Setup Command
 *
 * Configures MCP clients to use the L4YERCAK3 MCP server.
 * Supports Claude Code CLI, Claude Desktop, and other MCP-compatible clients.
 *
 * @module commands/mcp-setup
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const configManager = require('../config/config-manager');
const backendClient = require('../api/backend-client');

/**
 * Check if Claude CLI is installed
 */
function isClaudeInstalled() {
  try {
    execSync('claude --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if MCP server is already configured in Claude
 */
function isMcpConfigured() {
  try {
    const result = execSync('claude mcp list', {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return result.includes('l4yercak3');
  } catch {
    return false;
  }
}

/**
 * Configure Claude MCP with l4yercak3 server
 */
async function configureMcp(scope = 'user') {
  const scopeFlag = scope === 'project' ? '--scope project' : '';
  const command = `claude mcp add l4yercak3 ${scopeFlag} -- npx @l4yercak3/cli mcp-server`.trim();

  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to configure MCP: ${error.message}`));
    return false;
  }
}

/**
 * Remove existing MCP configuration from Claude Code
 */
function removeMcpConfig() {
  try {
    execSync('claude mcp remove l4yercak3', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Claude Desktop config path based on platform
 */
function getClaudeDesktopConfigPath() {
  const platform = os.platform();
  const home = os.homedir();

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || home, 'Claude', 'claude_desktop_config.json');
  } else {
    // Linux
    return path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }
}

/**
 * Get the full path to npx executable
 * Claude Desktop needs absolute paths since it doesn't inherit shell PATH
 */
function getNpxPath() {
  try {
    const npxPath = execSync('which npx', { stdio: 'pipe', encoding: 'utf8' }).trim();
    return npxPath || 'npx';
  } catch {
    // Fallback to common locations
    const commonPaths = [
      '/usr/local/bin/npx',
      '/opt/homebrew/bin/npx',
      '/usr/bin/npx',
      path.join(os.homedir(), '.nvm/versions/node', 'current', 'bin', 'npx'),
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return 'npx'; // Last resort fallback
  }
}

/**
 * Get the full path to l4yercak3 CLI if globally installed
 * Returns null if not found
 */
function getL4yercak3Path() {
  try {
    const cliPath = execSync('which l4yercak3', { stdio: 'pipe', encoding: 'utf8' }).trim();
    return cliPath || null;
  } catch {
    return null;
  }
}

/**
 * Get the best command configuration for Claude Desktop
 * Prefers globally installed l4yercak3 over npx for reliability
 */
function getClaudeDesktopCommand() {
  const l4yercak3Path = getL4yercak3Path();

  if (l4yercak3Path) {
    // Use globally installed CLI directly (more reliable)
    return {
      command: l4yercak3Path,
      args: ['mcp-server'],
      description: `${l4yercak3Path} mcp-server`
    };
  }

  // Fall back to npx
  const npxPath = getNpxPath();
  return {
    command: npxPath,
    args: ['@l4yercak3/cli', 'mcp-server'],
    description: `${npxPath} @l4yercak3/cli mcp-server`
  };
}

/**
 * Check if Claude Desktop config exists
 */
function hasClaudeDesktopConfig() {
  return fs.existsSync(getClaudeDesktopConfigPath());
}

/**
 * Configure Claude Desktop with l4yercak3 MCP server
 */
function configureClaudeDesktop() {
  const configPath = getClaudeDesktopConfigPath();
  let config = { mcpServers: {} };

  // Read existing config if it exists
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(content);
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
    } catch {
      // If parsing fails, start fresh but preserve the file structure
      config = { mcpServers: {} };
    }
  } else {
    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  // Add l4yercak3 server with full path
  // Claude Desktop doesn't inherit shell PATH, so we need absolute paths
  const cmdConfig = getClaudeDesktopCommand();

  config.mcpServers.l4yercak3 = {
    command: cmdConfig.command,
    args: cmdConfig.args
  };

  // Write config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  return { configPath, commandDescription: cmdConfig.description };
}

/**
 * Remove l4yercak3 from Claude Desktop config
 */
function removeClaudeDesktopConfig() {
  const configPath = getClaudeDesktopConfigPath();

  if (!fs.existsSync(configPath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);

    if (config.mcpServers && config.mcpServers.l4yercak3) {
      delete config.mcpServers.l4yercak3;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Check if l4yercak3 is configured in Claude Desktop
 */
function isClaudeDesktopConfigured() {
  const configPath = getClaudeDesktopConfigPath();

  if (!fs.existsSync(configPath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);
    return config.mcpServers && config.mcpServers.l4yercak3;
  } catch {
    return false;
  }
}

module.exports = {
  command: 'mcp-setup',
  description: 'Configure MCP clients to use the L4YERCAK3 server',
  handler: async () => {
    console.log('');
    console.log(chalk.bold.hex('#9F7AEA')('🔧 L4YERCAK3 MCP Setup\n'));

    // Check if logged in
    const session = configManager.getSession();
    if (!session || !session.token) {
      console.log(chalk.yellow('⚠️  Not logged in to L4YERCAK3'));
      console.log(chalk.gray('   Run `l4yercak3 login` first to authenticate.\n'));
      console.log(chalk.gray('   The MCP server needs your session to access L4YERCAK3 features.'));
      process.exit(1);
    }

    // Validate session and get user info
    let userEmail = session.email;
    if (!userEmail) {
      try {
        const userInfo = await backendClient.validateSession();
        if (userInfo && userInfo.email) {
          userEmail = userInfo.email;
          // Update stored session with email for future use
          configManager.saveSession({ ...session, email: userEmail, userId: userInfo.userId });
        }
      } catch {
        // Validation failed, continue without email display
      }
    }

    console.log(chalk.green('✓ Logged in') + (userEmail ? chalk.gray(` as ${userEmail}`) : ''));
    console.log('');

    // Detect available clients
    const hasClaudeCli = isClaudeInstalled();

    // Build client choices
    const clientChoices = [];

    if (hasClaudeCli) {
      const configured = isMcpConfigured();
      clientChoices.push({
        name: `Claude Code (CLI)${configured ? chalk.gray(' - already configured') : ''}`,
        value: 'claude-code',
        configured
      });
    }

    clientChoices.push({
      name: `Claude Desktop${isClaudeDesktopConfigured() ? chalk.gray(' - already configured') : ''}`,
      value: 'claude-desktop',
      configured: isClaudeDesktopConfigured()
    });

    clientChoices.push({
      name: 'VS Code (with Continue/Cline)',
      value: 'vscode'
    });

    clientChoices.push({
      name: 'Cursor',
      value: 'cursor'
    });

    clientChoices.push({
      name: 'Windsurf',
      value: 'windsurf'
    });

    clientChoices.push({
      name: 'Zed',
      value: 'zed'
    });

    clientChoices.push({
      name: 'Other MCP client (show manual instructions)',
      value: 'other'
    });

    // Ask which client to configure
    const { client } = await inquirer.prompt([
      {
        type: 'list',
        name: 'client',
        message: 'Which MCP client would you like to configure?',
        choices: clientChoices,
      },
    ]);

    console.log('');

    if (client === 'claude-code') {
      await setupClaudeCode();
    } else if (client === 'claude-desktop') {
      await setupClaudeDesktop();
    } else if (client === 'vscode') {
      showVSCodeInstructions();
    } else if (client === 'cursor') {
      showCursorInstructions();
    } else if (client === 'windsurf') {
      showWindsurfInstructions();
    } else if (client === 'zed') {
      showZedInstructions();
    } else {
      showOtherClientInstructions();
    }
  },
};

/**
 * Setup Claude Code CLI
 */
async function setupClaudeCode() {
  const alreadyConfigured = isMcpConfigured();

  if (alreadyConfigured) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'L4YERCAK3 is already configured. What would you like to do?',
        choices: [
          { name: 'Keep existing configuration', value: 'keep' },
          { name: 'Reconfigure (remove and re-add)', value: 'reconfigure' },
          { name: 'Remove configuration', value: 'remove' },
        ],
      },
    ]);

    if (action === 'keep') {
      console.log(chalk.gray('\nKeeping existing configuration.'));
      showUsageInstructions('Claude Code');
      return;
    }

    if (action === 'remove') {
      removeMcpConfig();
      console.log(chalk.green('\n✓ L4YERCAK3 MCP server removed from Claude Code'));
      return;
    }

    removeMcpConfig();
    console.log(chalk.gray('Removed existing configuration...'));
  }

  // Ask for scope
  const { scope } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: 'Where should the MCP server be configured?',
      choices: [
        { name: 'User (global) - Available in all projects', value: 'user' },
        { name: 'Project - Only for current directory', value: 'project' },
      ],
      default: 'user',
    },
  ]);

  console.log('');
  console.log(chalk.gray('Configuring Claude Code...'));

  const success = await configureMcp(scope);

  if (success) {
    console.log('');
    console.log(chalk.green.bold('✓ L4YERCAK3 MCP server configured for Claude Code!\n'));
    showUsageInstructions('Claude Code');
  } else {
    console.log('');
    console.log(chalk.red('Failed to configure MCP server.'));
    console.log(chalk.gray('\nYou can try manual configuration:'));
    console.log(chalk.cyan('  claude mcp add l4yercak3 -- npx @l4yercak3/cli mcp-server'));
  }
}

/**
 * Setup Claude Desktop
 */
async function setupClaudeDesktop() {
  const alreadyConfigured = isClaudeDesktopConfigured();

  if (alreadyConfigured) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'L4YERCAK3 is already configured. What would you like to do?',
        choices: [
          { name: 'Keep existing configuration', value: 'keep' },
          { name: 'Reconfigure', value: 'reconfigure' },
          { name: 'Remove configuration', value: 'remove' },
        ],
      },
    ]);

    if (action === 'keep') {
      console.log(chalk.gray('\nKeeping existing configuration.'));
      showUsageInstructions('Claude Desktop');
      return;
    }

    if (action === 'remove') {
      removeClaudeDesktopConfig();
      console.log(chalk.green('\n✓ L4YERCAK3 MCP server removed from Claude Desktop'));
      console.log(chalk.gray('  Restart Claude Desktop for changes to take effect.'));
      return;
    }
  }

  console.log(chalk.gray('Configuring Claude Desktop...'));

  try {
    const { configPath, commandDescription } = configureClaudeDesktop();
    console.log('');
    console.log(chalk.green.bold('✓ L4YERCAK3 MCP server configured for Claude Desktop!\n'));
    console.log(chalk.gray(`  Config:  ${configPath}`));
    console.log(chalk.gray(`  Command: ${commandDescription}`));
    console.log(chalk.yellow('\n  ⚠️  Restart Claude Desktop for changes to take effect.'));
    console.log(chalk.gray('  (Using absolute path since Claude Desktop doesn\'t inherit your shell PATH)\n'));
    showUsageInstructions('Claude Desktop');
  } catch (error) {
    console.log('');
    console.log(chalk.red(`Failed to configure Claude Desktop: ${error.message}`));
    showClaudeDesktopManualInstructions();
  }
}

/**
 * Show manual instructions for Claude Desktop
 */
function showClaudeDesktopManualInstructions() {
  const configPath = getClaudeDesktopConfigPath();
  const cmdConfig = getClaudeDesktopCommand();

  console.log(chalk.gray('\nManual configuration:'));
  console.log(chalk.gray(`  Edit: ${configPath}`));
  console.log('');
  console.log(chalk.white('  Add to mcpServers (use absolute paths):'));
  console.log(chalk.cyan('  {'));
  console.log(chalk.cyan('    "mcpServers": {'));
  console.log(chalk.cyan('      "l4yercak3": {'));
  console.log(chalk.cyan(`        "command": "${cmdConfig.command}",`));
  console.log(chalk.cyan(`        "args": ${JSON.stringify(cmdConfig.args)}`));
  console.log(chalk.cyan('      }'));
  console.log(chalk.cyan('    }'));
  console.log(chalk.cyan('  }'));
  console.log('');
  console.log(chalk.gray('  Note: Claude Desktop doesn\'t inherit your shell PATH.'));
  console.log(chalk.gray(`  Find paths with: ${chalk.cyan('which l4yercak3')} or ${chalk.cyan('which npx')}`));
  console.log('');
}

/**
 * Show VS Code setup instructions (Continue, Cline, etc.)
 */
function showVSCodeInstructions() {
  console.log(chalk.bold('🔧 VS Code MCP Setup\n'));

  console.log(chalk.white('  VS Code supports MCP through extensions like Continue or Cline.\n'));

  console.log(chalk.bold('  Option 1: Continue Extension'));
  console.log(chalk.gray('  1. Install "Continue" extension from VS Code marketplace'));
  console.log(chalk.gray('  2. Open Continue settings (gear icon in Continue panel)'));
  console.log(chalk.gray('  3. Add to your config.json:\n'));

  const cmdConfig = getClaudeDesktopCommand();
  console.log(chalk.cyan('     "experimental": {'));
  console.log(chalk.cyan('       "modelContextProtocolServers": ['));
  console.log(chalk.cyan('         {'));
  console.log(chalk.cyan('           "name": "l4yercak3",'));
  console.log(chalk.cyan(`           "command": "${cmdConfig.command}",`));
  console.log(chalk.cyan(`           "args": ${JSON.stringify(cmdConfig.args)}`));
  console.log(chalk.cyan('         }'));
  console.log(chalk.cyan('       ]'));
  console.log(chalk.cyan('     }'));
  console.log('');

  console.log(chalk.bold('  Option 2: Cline Extension'));
  console.log(chalk.gray('  1. Install "Cline" extension from VS Code marketplace'));
  console.log(chalk.gray('  2. Open Cline settings panel'));
  console.log(chalk.gray('  3. Navigate to MCP Servers section'));
  console.log(chalk.gray('  4. Add server with command:'));
  console.log(chalk.cyan(`     ${cmdConfig.description}`));
  console.log('');

  console.log(chalk.gray('  Note: Use absolute paths for reliability.'));
  console.log(chalk.gray(`  Your l4yercak3 path: ${cmdConfig.command}`));
  console.log('');
}

/**
 * Show Cursor setup instructions
 */
function showCursorInstructions() {
  console.log(chalk.bold('🔧 Cursor MCP Setup\n'));

  console.log(chalk.white('  Cursor supports MCP servers through its settings.\n'));

  const cmdConfig = getClaudeDesktopCommand();
  const configPath = os.platform() === 'darwin'
    ? '~/.cursor/mcp.json'
    : os.platform() === 'win32'
      ? '%APPDATA%\\Cursor\\mcp.json'
      : '~/.config/cursor/mcp.json';

  console.log(chalk.gray(`  1. Create or edit: ${configPath}`));
  console.log(chalk.gray('  2. Add the following configuration:\n'));

  console.log(chalk.cyan('  {'));
  console.log(chalk.cyan('    "mcpServers": {'));
  console.log(chalk.cyan('      "l4yercak3": {'));
  console.log(chalk.cyan(`        "command": "${cmdConfig.command}",`));
  console.log(chalk.cyan(`        "args": ${JSON.stringify(cmdConfig.args)}`));
  console.log(chalk.cyan('      }'));
  console.log(chalk.cyan('    }'));
  console.log(chalk.cyan('  }'));
  console.log('');

  console.log(chalk.gray('  3. Restart Cursor for changes to take effect'));
  console.log('');

  console.log(chalk.yellow('  Note: Cursor\'s MCP support may vary by version.'));
  console.log(chalk.gray('  Check Cursor documentation for the latest setup process.'));
  console.log('');
}

/**
 * Show Windsurf setup instructions
 */
function showWindsurfInstructions() {
  console.log(chalk.bold('🔧 Windsurf (Codeium) MCP Setup\n'));

  console.log(chalk.white('  Windsurf supports MCP through Cascade.\n'));

  const cmdConfig = getClaudeDesktopCommand();
  const configPath = os.platform() === 'darwin'
    ? '~/.codeium/windsurf/mcp_config.json'
    : os.platform() === 'win32'
      ? '%APPDATA%\\Codeium\\windsurf\\mcp_config.json'
      : '~/.config/codeium/windsurf/mcp_config.json';

  console.log(chalk.gray(`  1. Create or edit: ${configPath}`));
  console.log(chalk.gray('  2. Add the following configuration:\n'));

  console.log(chalk.cyan('  {'));
  console.log(chalk.cyan('    "mcpServers": {'));
  console.log(chalk.cyan('      "l4yercak3": {'));
  console.log(chalk.cyan(`        "command": "${cmdConfig.command}",`));
  console.log(chalk.cyan(`        "args": ${JSON.stringify(cmdConfig.args)}`));
  console.log(chalk.cyan('      }'));
  console.log(chalk.cyan('    }'));
  console.log(chalk.cyan('  }'));
  console.log('');

  console.log(chalk.gray('  3. Restart Windsurf for changes to take effect'));
  console.log('');

  console.log(chalk.gray('  Once configured, you can use L4YERCAK3 tools through Cascade.'));
  console.log('');
}

/**
 * Show Zed setup instructions
 */
function showZedInstructions() {
  console.log(chalk.bold('🔧 Zed MCP Setup\n'));

  console.log(chalk.white('  Zed supports MCP servers through its settings.\n'));

  const cmdConfig = getClaudeDesktopCommand();
  const configPath = os.platform() === 'darwin'
    ? '~/.config/zed/settings.json'
    : '~/.config/zed/settings.json';

  console.log(chalk.gray(`  1. Open Zed settings: ${configPath}`));
  console.log(chalk.gray('  2. Add or update the context_servers section:\n'));

  console.log(chalk.cyan('  {'));
  console.log(chalk.cyan('    "context_servers": {'));
  console.log(chalk.cyan('      "l4yercak3": {'));
  console.log(chalk.cyan(`        "command": {`));
  console.log(chalk.cyan(`          "path": "${cmdConfig.command}",`));
  console.log(chalk.cyan(`          "args": ${JSON.stringify(cmdConfig.args)}`));
  console.log(chalk.cyan('        }'));
  console.log(chalk.cyan('      }'));
  console.log(chalk.cyan('    }'));
  console.log(chalk.cyan('  }'));
  console.log('');

  console.log(chalk.gray('  3. Restart Zed or reload the configuration'));
  console.log('');

  console.log(chalk.gray('  See https://zed.dev/docs/context-servers for more details.'));
  console.log('');
}

/**
 * Show instructions for other MCP clients
 */
function showOtherClientInstructions() {
  console.log(chalk.bold('🔌 Manual MCP Configuration\n'));

  console.log(chalk.white('  Server command:'));
  console.log(chalk.cyan('    npx @l4yercak3/cli mcp-server\n'));

  console.log(chalk.white('  Transport: ') + chalk.cyan('stdio\n'));

  console.log(chalk.white('  Compatible clients include:'));
  console.log(chalk.gray('    • Cursor'));
  console.log(chalk.gray('    • Cody (Sourcegraph)'));
  console.log(chalk.gray('    • Continue'));
  console.log(chalk.gray('    • Zed'));
  console.log(chalk.gray('    • Any MCP-compatible AI assistant'));
  console.log('');

  console.log(chalk.white('  JSON configuration format:'));
  console.log(chalk.cyan('  {'));
  console.log(chalk.cyan('    "command": "npx",'));
  console.log(chalk.cyan('    "args": ["@l4yercak3/cli", "mcp-server"],'));
  console.log(chalk.cyan('    "transport": "stdio"'));
  console.log(chalk.cyan('  }'));
  console.log('');

  console.log(chalk.gray('  Refer to your client\'s documentation for where to add this config.\n'));
}

/**
 * Show usage instructions after setup
 */
function showUsageInstructions(clientName = 'your AI assistant') {
  console.log(chalk.bold('📖 How to use:\n'));

  console.log(chalk.white(`  In ${clientName}, you can now:`));
  console.log(chalk.gray('  • Ask Claude to list your L4YERCAK3 contacts, projects, or invoices'));
  console.log(chalk.gray('  • Create or update CRM records through natural language'));
  console.log(chalk.gray('  • Get project integration help with context from your L4YERCAK3 data'));
  console.log('');

  console.log(chalk.white('  Example prompts:'));
  console.log(chalk.cyan('  "Show me my recent contacts in L4YERCAK3"'));
  console.log(chalk.cyan('  "Create a new project called Website Redesign"'));
  console.log(chalk.cyan('  "What invoices are pending?"'));
  console.log('');

  console.log(chalk.gray('  The MCP server runs automatically when needed.'));
  console.log(chalk.gray('  Your session stays active until you run `l4yercak3 logout`.\n'));
}
