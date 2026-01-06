/**
 * Logout Command
 * Clears CLI session
 */

const configManager = require('../config/config-manager');
const chalk = require('chalk');

async function handleLogout() {
  if (!configManager.isLoggedIn()) {
    console.log(chalk.yellow('  ⚠️  You are not logged in\n'));
    return;
  }

  configManager.clearSession();
  console.log(chalk.green('  ✅ Successfully logged out\n'));
}

module.exports = {
  command: 'logout',
  description: 'Log out from L4YERCAK3 platform',
  handler: handleLogout,
};

