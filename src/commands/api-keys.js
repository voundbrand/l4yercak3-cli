/**
 * API Keys Command
 * List and manage API keys for organizations
 */

const configManager = require('../config/config-manager');
const backendClient = require('../api/backend-client');
const inquirer = require('inquirer');
const chalk = require('chalk');

/**
 * API Keys list command handler
 */
async function handleApiKeysList() {
  // Check if logged in
  if (!configManager.isLoggedIn()) {
    console.log(chalk.yellow('  ⚠️  You must be logged in first'));
    console.log(chalk.gray('\n  Run "l4yercak3 login" to authenticate\n'));
    process.exit(1);
  }

  console.log(chalk.cyan('  🔑 API Keys\n'));

  try {
    // Get organizations
    const orgsResponse = await backendClient.getOrganizations();
    const organizations = Array.isArray(orgsResponse)
      ? orgsResponse
      : orgsResponse.organizations || orgsResponse.data || [];

    if (organizations.length === 0) {
      console.log(chalk.yellow('  ⚠️  No organizations found'));
      console.log(chalk.gray('\n  Run "l4yercak3 spread" to create an organization\n'));
      return;
    }

    // Select organization if multiple
    let organizationId;
    let organizationName;

    if (organizations.length === 1) {
      organizationId = organizations[0].id;
      organizationName = organizations[0].name;
    } else {
      const { orgChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'orgChoice',
          message: 'Select organization:',
          choices: organizations.map(org => ({
            name: `${org.name} (${org.id})`,
            value: org.id,
          })),
        },
      ]);
      organizationId = orgChoice;
      organizationName = organizations.find(org => org.id === orgChoice)?.name;
    }

    console.log(chalk.gray(`  Organization: ${organizationName}\n`));

    // List API keys
    const keysResponse = await backendClient.listApiKeys(organizationId);
    const keys = keysResponse.keys || [];

    if (keys.length === 0) {
      console.log(chalk.yellow('  No API keys found for this organization'));
      console.log(chalk.gray('\n  Run "l4yercak3 spread" to generate an API key\n'));
      return;
    }

    // Display keys
    console.log(chalk.green(`  Found ${keys.length} API key(s):\n`));

    keys.forEach((key, i) => {
      const maskedKey = key.key ? `${key.key.substring(0, 15)}...` : '[hidden]';
      const name = key.name || `Key ${i + 1}`;
      const created = key.createdAt ? new Date(key.createdAt).toLocaleDateString() : 'Unknown';

      console.log(chalk.white(`  ${i + 1}. ${name}`));
      console.log(chalk.gray(`     Key: ${maskedKey}`));
      console.log(chalk.gray(`     Created: ${created}`));
      if (key.scopes) {
        console.log(chalk.gray(`     Scopes: ${key.scopes.join(', ')}`));
      }
      console.log('');
    });

    // Show limit info
    if (keysResponse.limitDescription) {
      console.log(chalk.gray(`  Limit: ${keysResponse.limitDescription}`));
    }
    if (keysResponse.canCreateMore !== undefined) {
      if (keysResponse.canCreateMore) {
        console.log(chalk.green(`  ✅ You can create more API keys`));
      } else {
        console.log(chalk.yellow(`  ⚠️  You've reached your API key limit`));
        console.log(chalk.gray('     Upgrade at: https://app.l4yercak3.com/settings/billing'));
      }
    }
    console.log('');

  } catch (error) {
    if (error.code === 'SESSION_EXPIRED') {
      console.log(chalk.red(`\n  ❌ Session expired. Please run "l4yercak3 login" again.\n`));
    } else if (error.code === 'NOT_AUTHORIZED') {
      console.log(chalk.red(`\n  ❌ You don't have permission to view API keys for this organization.\n`));
    } else {
      console.error(chalk.red(`  ❌ Error listing API keys: ${error.message}\n`));
    }
    process.exit(1);
  }
}

module.exports = {
  command: 'api-keys',
  description: 'List API keys for your organizations',
  handler: handleApiKeysList,
};
