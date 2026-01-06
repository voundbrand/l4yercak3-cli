/**
 * Status Command
 * Shows authentication status and user info
 */

const configManager = require('../config/config-manager');
const backendClient = require('../api/backend-client');
const chalk = require('chalk');

async function handleStatus() {
  const isLoggedIn = configManager.isLoggedIn();
  const session = configManager.getSession();

  console.log(chalk.bold('  Authentication Status\n'));

  if (!isLoggedIn) {
    console.log(chalk.red('  ❌ Not logged in'));
    console.log(chalk.gray('\n  Run "l4yercak3 login" to authenticate\n'));
    return;
  }

  console.log(chalk.green('  ✅ Logged in\n'));

  if (session) {
    if (session.email) {
      console.log(chalk.gray(`  Email: ${session.email}`));
    }
    if (session.expiresAt) {
      const expiresDate = new Date(session.expiresAt);
      const now = Date.now();
      const daysLeft = Math.floor((session.expiresAt - now) / (24 * 60 * 60 * 1000));
      
      if (daysLeft > 0) {
        console.log(chalk.gray(`  Session expires: ${expiresDate.toLocaleString()} (${daysLeft} days)`));
      } else {
        console.log(chalk.yellow(`  ⚠️  Session expired: ${expiresDate.toLocaleString()}`));
      }
    }
  }

  // Try to validate session with backend
  try {
    const userInfo = await backendClient.validateSession();
    if (userInfo) {
      console.log(chalk.gray(`\n  Backend URL: ${configManager.getBackendUrl()}`));
      if (userInfo.organizations && userInfo.organizations.length > 0) {
        console.log(chalk.gray(`  Organizations: ${userInfo.organizations.length}`));
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`\n  ⚠️  Could not validate session: ${error.message}`));
  }

  console.log('');
}

module.exports = {
  command: 'status',
  description: 'Show authentication status',
  handler: handleStatus,
};

