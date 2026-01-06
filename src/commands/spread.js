/**
 * Spread Command
 * Main command for setting up boilerplate integration
 */

const configManager = require('../config/config-manager');
const backendClient = require('../api/backend-client');
const projectDetector = require('../detectors');
const fileGenerator = require('../generators');
const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');

/**
 * Helper function to create an organization
 */
async function createOrganization(orgName) {
  console.log(chalk.gray(`  Creating organization "${orgName}"...`));
  const newOrg = await backendClient.createOrganization(orgName);
  // Handle different response formats
  const organizationId = newOrg.organizationId || newOrg.id || newOrg.data?.organizationId || newOrg.data?.id;
  const organizationName = newOrg.name || orgName;
  
  if (!organizationId) {
    throw new Error('Organization ID not found in response. Please check backend API endpoint.');
  }
  
  console.log(chalk.green(`  ✅ Organization created: ${organizationName}\n`));
  return { organizationId, organizationName };
}

async function handleSpread() {
  // Check if logged in
  if (!configManager.isLoggedIn()) {
    console.log(chalk.yellow('  ⚠️  You must be logged in first'));
    console.log(chalk.gray('\n  Run "l4yercak3 login" to authenticate\n'));
    process.exit(1);
  }

  console.log(chalk.cyan('  🍰 Setting up your Layer Cake integration...\n'));

  try {
    // Step 1: Detect project
    console.log(chalk.gray('  🔍 Detecting project...\n'));
    const detection = projectDetector.detect();
    
    // Display framework detection results
    if (detection.framework.type) {
      const frameworkName = detection.framework.type === 'nextjs' ? 'Next.js' : detection.framework.type;
      console.log(chalk.green(`  ✅ Detected ${frameworkName} project`));
      
      if (detection.framework.type === 'nextjs') {
        const meta = detection.framework.metadata;
        if (meta.version) {
          console.log(chalk.gray(`     Version: ${meta.version}`));
        }
        if (meta.routerType) {
          console.log(chalk.gray(`     Router: ${meta.routerType === 'app' ? 'App Router' : 'Pages Router'}`));
        }
        if (meta.hasTypeScript) {
          console.log(chalk.gray('     TypeScript: Yes'));
        }
      }
      
      // Show supported features
      const features = detection.framework.supportedFeatures;
      const supportedFeatures = Object.entries(features)
        .filter(([_, supported]) => supported === true || supported === 'manual')
        .map(([name]) => name);
      
      if (supportedFeatures.length > 0) {
        console.log(chalk.gray(`     Supported features: ${supportedFeatures.join(', ')}`));
      }
    } else {
      console.log(chalk.yellow('  ⚠️  Could not detect project type'));
      const { continueAnyway } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueAnyway',
          message: 'Continue with basic setup anyway?',
          default: false,
        },
      ]);
      
      if (!continueAnyway) {
        console.log(chalk.gray('\n  Setup cancelled.\n'));
        process.exit(0);
      }
    }

    // Display GitHub detection
    if (detection.github.isGitHub) {
      console.log(chalk.green(`  ✅ Detected GitHub repository: ${detection.github.owner}/${detection.github.repo}`));
    }

    // Display API client detection
    if (detection.apiClient.hasApiClient) {
      console.log(chalk.yellow(`  ⚠️  Existing API client found: ${detection.apiClient.clientPath}`));
    }

    // Display OAuth detection
    if (detection.oauth.hasOAuth) {
      console.log(chalk.yellow(`  ⚠️  Existing OAuth setup detected: ${detection.oauth.oauthType}`));
      if (detection.oauth.providers.length > 0) {
        console.log(chalk.gray(`     Providers: ${detection.oauth.providers.join(', ')}`));
      }
      if (detection.oauth.configPath) {
        console.log(chalk.gray(`     Config: ${detection.oauth.configPath}`));
      }
    }

    console.log('');

    // Step 2: Organization selection
    console.log(chalk.cyan('  📦 Organization Setup\n'));
    let organizationId;
    let organizationName;

    try {
      const orgsResponse = await backendClient.getOrganizations();
      // Handle different response formats
      const organizations = Array.isArray(orgsResponse)
        ? orgsResponse
        : orgsResponse.organizations || orgsResponse.data || [];

      if (organizations.length === 0) {
        // No organizations, create one
        const { orgName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'orgName',
            message: 'Organization name:',
            default: detection.github.repo || 'My Organization',
            validate: (input) => input.trim().length > 0 || 'Organization name is required',
          },
        ]);

        const result = await createOrganization(orgName);
        organizationId = result.organizationId;
        organizationName = result.organizationName;
      } else {
        // Select or create organization
        const { orgChoice } = await inquirer.prompt([
          {
            type: 'list',
            name: 'orgChoice',
            message: 'Select organization:',
            choices: [
              ...organizations.map(org => ({
                name: `${org.name} (${org.id})`,
                value: org.id,
              })),
              { name: '➕ Create new organization', value: '__create__' },
            ],
          },
        ]);

        if (orgChoice === '__create__') {
          const { orgName } = await inquirer.prompt([
            {
              type: 'input',
              name: 'orgName',
              message: 'Organization name:',
              default: detection.github.repo || 'My Organization',
              validate: (input) => input.trim().length > 0 || 'Organization name is required',
            },
          ]);

          const result = await createOrganization(orgName);
          organizationId = result.organizationId;
          organizationName = result.organizationName;
        } else {
          const selectedOrg = organizations.find(org => org.id === orgChoice);
          organizationId = orgChoice;
          organizationName = selectedOrg.name;
          console.log(chalk.green(`  ✅ Selected organization: ${organizationName}\n`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`  ❌ Error managing organizations: ${error.message}\n`));
      process.exit(1);
    }

    // Step 3: Generate API key
    console.log(chalk.cyan('  🔑 API Key Setup\n'));
    let apiKey;

    try {
      console.log(chalk.gray('  Generating API key...'));
      const apiKeyResponse = await backendClient.generateApiKey(
        organizationId,
        'CLI Generated Key',
        ['*']
      );
      // Handle different response formats
      apiKey = apiKeyResponse.key || apiKeyResponse.apiKey || apiKeyResponse.data?.key || apiKeyResponse.data?.apiKey;
      
      if (!apiKey) {
        throw new Error('API key not found in response. Please check backend API endpoint.');
      }
      
      console.log(chalk.green(`  ✅ API key generated\n`));
    } catch (error) {
      console.error(chalk.red(`  ❌ Error generating API key: ${error.message}\n`));
      process.exit(1);
    }

    // Step 4: Feature selection
    console.log(chalk.cyan('  ⚙️  Feature Selection\n'));
    const { features } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to enable:',
        choices: [
          { name: 'CRM (Contacts)', value: 'crm', checked: true },
          { name: 'Projects', value: 'projects', checked: true },
          { name: 'Invoices', value: 'invoices', checked: true },
          { name: 'OAuth Authentication', value: 'oauth', checked: false },
          { name: 'Stripe Integration', value: 'stripe', checked: false },
        ],
      },
    ]);

    // Step 5: OAuth provider selection (if OAuth enabled)
    let oauthProviders = [];
    if (features.includes('oauth')) {
      const { providers } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'providers',
          message: 'Select OAuth providers:',
          choices: [
            { name: 'Google', value: 'google', checked: true },
            { name: 'Microsoft', value: 'microsoft', checked: true },
            { name: 'GitHub', value: 'github', checked: false },
          ],
        },
      ]);
      oauthProviders = providers;
    }

    // Step 6: Backend URL
    const defaultBackendUrl = configManager.getBackendUrl();
    const { backendUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'backendUrl',
        message: 'Backend API URL:',
        default: defaultBackendUrl,
        validate: (input) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      },
    ]);

    // Step 7: Production domain (for OAuth redirect URIs)
    let productionDomain = 'your-domain.com';
    if (features.includes('oauth')) {
      const { domain } = await inquirer.prompt([
        {
          type: 'input',
          name: 'domain',
          message: 'Production domain (for OAuth redirect URIs):',
          default: detection.github.repo ? `${detection.github.repo}.vercel.app` : 'your-domain.com',
        },
      ]);
      productionDomain = domain;
    }

    // Step 8: Generate files
    console.log(chalk.cyan('\n  📝 Generating files...\n'));

    // Extract framework metadata for generation
    const frameworkMeta = detection.framework.metadata || {};
    const isTypeScript = frameworkMeta.hasTypeScript || false;
    const routerType = frameworkMeta.routerType || 'pages';

    const generationOptions = {
      projectPath: detection.projectPath,
      apiKey,
      backendUrl,
      organizationId,
      organizationName,
      features,
      oauthProviders,
      productionDomain,
      appName: detection.github.repo || organizationName,
      isTypeScript,
      routerType,
      frameworkType: detection.framework.type || 'unknown',
    };

    const generatedFiles = await fileGenerator.generate(generationOptions);

    // Display results
    console.log(chalk.green('  ✅ Files generated:\n'));
    if (generatedFiles.apiClient) {
      console.log(chalk.gray(`     • ${path.relative(process.cwd(), generatedFiles.apiClient)}`));
    }
    if (generatedFiles.envFile) {
      console.log(chalk.gray(`     • ${path.relative(process.cwd(), generatedFiles.envFile)}`));
    }
    if (generatedFiles.nextauth) {
      console.log(chalk.gray(`     • ${path.relative(process.cwd(), generatedFiles.nextauth)}`));
    }
    if (generatedFiles.oauthGuide) {
      console.log(chalk.gray(`     • ${path.relative(process.cwd(), generatedFiles.oauthGuide)}`));
    }
    if (generatedFiles.gitignore) {
      console.log(chalk.gray(`     • ${path.relative(process.cwd(), generatedFiles.gitignore)} (updated)`));
    }

    // Save project configuration
    const projectConfig = {
      organizationId,
      organizationName,
      apiKey: `${apiKey.substring(0, 10)}...`, // Store partial key for reference only
      backendUrl,
      features,
      oauthProviders,
      productionDomain,
      frameworkType: detection.framework.type,
      createdAt: Date.now(),
    };

    configManager.saveProjectConfig(detection.projectPath, projectConfig);
    console.log(chalk.gray(`  📝 Configuration saved to ~/.l4yercak3/config.json\n`));

    console.log(chalk.cyan('\n  🎉 Setup complete!\n'));

    if (features.includes('oauth')) {
      console.log(chalk.yellow('  📋 Next steps:\n'));
      console.log(chalk.gray('     1. Follow the OAuth setup guide (OAUTH_SETUP_GUIDE.md)'));
      console.log(chalk.gray('     2. Add OAuth credentials to .env.local'));
      console.log(chalk.gray('     3. Install NextAuth.js: npm install next-auth'));
      if (oauthProviders.includes('microsoft')) {
        console.log(chalk.gray('     4. Install Azure AD provider: npm install next-auth/providers/azure-ad'));
      }
      console.log('');
    }

    console.log(chalk.gray('  Your project is now connected to L4YERCAK3! 🍰\n'));

  } catch (error) {
    console.error(chalk.red(`\n  ❌ Error: ${error.message}\n`));
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

module.exports = {
  command: 'spread',
  description: 'Initialize a new project integration',
  handler: handleSpread,
};

