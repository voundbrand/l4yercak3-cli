/**
 * Logout Command
 * Clears CLI session both locally and on the backend
 */

const configManager = require('../config/config-manager');
const backendClient = require('../api/backend-client');
const chalk = require('chalk');

async function handleLogout() {
  if (!configManager.isLoggedIn()) {
    console.log(chalk.yellow('  ⚠️  You are not logged in\n'));
    return;
  }

  // Revoke session on backend first (cleans up database)
  console.log(chalk.gray('  Revoking session...'));
  await backendClient.revokeSession();

  // Clear local session
  configManager.clearSession();
  console.log(chalk.green('  ✅ Successfully logged out\n'));
}

module.exports = {
  command: 'logout',
  description: 'Log out from L4YERCAK3 platform',
  handler: handleLogout,
};

