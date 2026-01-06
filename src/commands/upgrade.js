/**
 * Upgrade Command
 * Opens the upgrade page in the browser for plan upgrades
 */

const configManager = require('../config/config-manager');
const chalk = require('chalk');
const { default: open } = require('open');

/**
 * Upgrade command handler
 */
async function handleUpgrade() {
  // Check if logged in
  if (!configManager.isLoggedIn()) {
    console.log(chalk.yellow('  ⚠️  You must be logged in first'));
    console.log(chalk.gray('\n  Run "l4yercak3 login" to authenticate\n'));
    process.exit(1);
  }

  const session = configManager.getSession();
  const backendUrl = configManager.getBackendUrl();

  console.log(chalk.cyan('  🚀 Opening upgrade page...\n'));

  // Build upgrade URL with CLI token for seamless authentication
  const upgradeUrl = `${backendUrl}/upgrade?token=${encodeURIComponent(session.token)}&reason=cli_upgrade`;

  console.log(chalk.gray(`  URL: ${upgradeUrl}\n`));

  try {
    await open(upgradeUrl);
    console.log(chalk.green('  ✅ Upgrade page opened in your browser\n'));
    console.log(chalk.gray('  Select a plan to unlock more features:'));
    console.log(chalk.gray('  • More API keys'));
    console.log(chalk.gray('  • Priority support'));
    console.log(chalk.gray('  • Advanced features\n'));
  } catch (error) {
    console.log(chalk.yellow('  ⚠️  Could not open browser automatically'));
    console.log(chalk.gray(`\n  Please visit: ${upgradeUrl}\n`));
  }
}

module.exports = {
  command: 'upgrade',
  description: 'Upgrade your L4YERCAK3 plan',
  handler: handleUpgrade,
};
