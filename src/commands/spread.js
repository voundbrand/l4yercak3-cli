/**
 * Spread Command
 * Main command for setting up boilerplate integration
 */

const configManager = require('../config/config-manager');
const backendClient = require('../api/backend-client');
const projectDetector = require('../detectors');
const fileGenerator = require('../generators');
const { generateProjectPathHash } = require('../utils/file-utils');
const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const pkg = require('../../package.json');

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

/**
 * Helper function to generate a new API key
 */
async function generateNewApiKey(organizationId) {
  console.log(chalk.gray('  Generating API key...'));
  const apiKeyResponse = await backendClient.generateApiKey(
    organizationId,
    'CLI Generated Key',
    ['*']
  );
  // Handle different response formats
  const apiKey = apiKeyResponse.key || apiKeyResponse.apiKey || apiKeyResponse.data?.key || apiKeyResponse.data?.apiKey;

  if (!apiKey) {
    throw new Error('API key not found in response. Please check backend API endpoint.');
  }

  console.log(chalk.green(`  ✅ API key generated\n`));
  return apiKey;
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

    // Step 3: API Key Setup
    console.log(chalk.cyan('  🔑 API Key Setup\n'));
    let apiKey;

    try {
      // First, check if organization already has API keys
      console.log(chalk.gray('  Checking existing API keys...'));
      let existingKeys = null;

      try {
        existingKeys = await backendClient.listApiKeys(organizationId);
      } catch (listError) {
        // If listing fails, continue to try generating
        console.log(chalk.gray('  Could not check existing keys, attempting to generate...'));
      }

      if (existingKeys && existingKeys.keys && existingKeys.keys.length > 0) {
        // Organization has existing keys
        console.log(chalk.yellow(`  ⚠️  Found ${existingKeys.keys.length} existing API key(s)`));

        if (existingKeys.limitDescription) {
          console.log(chalk.gray(`     Limit: ${existingKeys.limitDescription}`));
        }

        // Show existing keys (masked)
        existingKeys.keys.forEach((key, i) => {
          const maskedKey = key.key ? `${key.key.substring(0, 10)}...` : key.name || `Key ${i + 1}`;
          console.log(chalk.gray(`     • ${key.name || 'Unnamed'}: ${maskedKey}`));
        });
        console.log('');

        if (!existingKeys.canCreateMore) {
          // At limit - offer to use existing key
          const { useExisting } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'useExisting',
              message: 'You\'ve reached your API key limit. Use an existing key from your .env.local file?',
              default: true,
            },
          ]);

          if (useExisting) {
            const { manualKey } = await inquirer.prompt([
              {
                type: 'input',
                name: 'manualKey',
                message: 'Enter your existing API key:',
                validate: (input) => input.trim().length > 0 || 'API key is required',
              },
            ]);
            apiKey = manualKey.trim();
            console.log(chalk.green(`  ✅ Using provided API key\n`));
          } else {
            console.log(chalk.yellow('\n  ⚠️  To generate more API keys, upgrade your plan at https://app.l4yercak3.com/settings/billing\n'));
            process.exit(0);
          }
        } else {
          // Can create more - ask what to do
          const { keyAction } = await inquirer.prompt([
            {
              type: 'list',
              name: 'keyAction',
              message: 'What would you like to do?',
              choices: [
                { name: 'Generate a new API key', value: 'generate' },
                { name: 'Enter an existing API key', value: 'existing' },
              ],
            },
          ]);

          if (keyAction === 'existing') {
            const { manualKey } = await inquirer.prompt([
              {
                type: 'input',
                name: 'manualKey',
                message: 'Enter your existing API key:',
                validate: (input) => input.trim().length > 0 || 'API key is required',
              },
            ]);
            apiKey = manualKey.trim();
            console.log(chalk.green(`  ✅ Using provided API key\n`));
          } else {
            // Generate new key
            apiKey = await generateNewApiKey(organizationId);
          }
        }
      } else {
        // No existing keys - generate one
        apiKey = await generateNewApiKey(organizationId);
      }
    } catch (error) {
      // Handle specific error codes
      if (error.code === 'API_KEY_LIMIT_REACHED') {
        console.log(chalk.yellow(`\n  ⚠️  ${error.message}`));
        if (error.suggestion) {
          console.log(chalk.gray(`  ${error.suggestion}`));
        }

        // Show upgrade option if available
        if (error.upgradeUrl) {
          console.log(chalk.cyan(`\n  🚀 Upgrade your plan to get more API keys:`));
          console.log(chalk.gray(`     ${error.upgradeUrl}\n`));

          const { action } = await inquirer.prompt([
            {
              type: 'list',
              name: 'action',
              message: 'What would you like to do?',
              choices: [
                { name: 'Open upgrade page in browser', value: 'upgrade' },
                { name: 'Enter an existing API key', value: 'existing' },
                { name: 'Exit', value: 'exit' },
              ],
            },
          ]);

          if (action === 'upgrade') {
            const { default: open } = require('open');
            console.log(chalk.gray('  Opening browser...'));
            await open(error.upgradeUrl);
            console.log(chalk.gray('\n  After upgrading, run "l4yercak3 spread" again.\n'));
            process.exit(0);
          } else if (action === 'existing') {
            const { manualKey } = await inquirer.prompt([
              {
                type: 'input',
                name: 'manualKey',
                message: 'Enter your existing API key:',
                validate: (input) => input.trim().length > 0 || 'API key is required',
              },
            ]);
            apiKey = manualKey.trim();
            console.log(chalk.green(`  ✅ Using provided API key\n`));
          } else {
            process.exit(0);
          }
        } else {
          // No upgrade URL - fallback to manual entry
          console.log(chalk.gray('\n  You can enter an existing API key or upgrade your plan.\n'));

          const { manualKey } = await inquirer.prompt([
            {
              type: 'input',
              name: 'manualKey',
              message: 'Enter your existing API key (or press Enter to exit):',
            },
          ]);

          if (manualKey.trim()) {
            apiKey = manualKey.trim();
            console.log(chalk.green(`  ✅ Using provided API key\n`));
          } else {
            process.exit(0);
          }
        }
      } else if (error.code === 'SESSION_EXPIRED') {
        console.log(chalk.red(`\n  ❌ Session expired. Please run "l4yercak3 login" again.\n`));
        process.exit(1);
      } else if (error.code === 'NOT_AUTHORIZED') {
        console.log(chalk.red(`\n  ❌ You don't have permission to manage API keys for this organization.\n`));
        process.exit(1);
      } else {
        console.error(chalk.red(`  ❌ Error setting up API key: ${error.message}\n`));
        process.exit(1);
      }
    }

    // Step 4: Feature selection
    console.log(chalk.cyan('  ⚙️  Feature Selection\n'));
    const { features } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to enable:',
        choices: [
          { name: 'CRM (contacts, organizations)', value: 'crm', checked: true },
          { name: 'Events (event management, registrations)', value: 'events', checked: false },
          { name: 'Products (product catalog)', value: 'products', checked: false },
          { name: 'Checkout (payment processing)', value: 'checkout', checked: false },
          { name: 'Tickets (ticket generation)', value: 'tickets', checked: false },
          { name: 'Invoicing (invoice creation)', value: 'invoicing', checked: false },
          { name: 'Forms (dynamic forms)', value: 'forms', checked: false },
          { name: 'Projects (project management)', value: 'projects', checked: false },
          { name: 'OAuth Authentication', value: 'oauth', checked: false },
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
    let productionDomain = null;
    if (features.includes('oauth')) {
      console.log(chalk.gray('\n  ℹ️  The following settings are written to .env.local for local development.'));
      console.log(chalk.gray('     For production, set NEXTAUTH_URL in your hosting platform (e.g., Vercel).\n'));

      const { configureNow } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'configureNow',
          message: 'Configure production domain now? (You can skip and do this later)',
          default: true,
        },
      ]);

      if (configureNow) {
        const { domain } = await inquirer.prompt([
          {
            type: 'input',
            name: 'domain',
            message: 'Production domain (for OAuth redirect URIs):',
            default: detection.github.repo ? `${detection.github.repo}.vercel.app` : 'your-domain.com',
          },
        ]);
        productionDomain = domain;
      } else {
        console.log(chalk.gray('  Skipping production domain configuration.'));
        console.log(chalk.gray('  Set NEXTAUTH_URL in your hosting platform when deploying.\n'));
      }
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

    // Step 9: Register application with backend
    console.log(chalk.cyan('\n  🔗 Registering with L4YERCAK3...\n'));

    const projectPathHash = generateProjectPathHash(detection.projectPath);
    let applicationId = null;
    let isUpdate = false;

    try {
      // Check if application already exists for this project
      const existingApp = await backendClient.checkExistingApplication(organizationId, projectPathHash);

      if (existingApp.found && existingApp.application) {
        // Application already registered
        console.log(chalk.yellow(`  ⚠️  This project is already registered as "${existingApp.application.name}"`));

        const { updateAction } = await inquirer.prompt([
          {
            type: 'list',
            name: 'updateAction',
            message: 'What would you like to do?',
            choices: [
              { name: 'Update existing registration', value: 'update' },
              { name: 'Skip registration (keep existing)', value: 'skip' },
            ],
          },
        ]);

        if (updateAction === 'update') {
          // Update existing application
          const updateData = {
            connection: {
              features,
              hasFrontendDatabase: !!detection.framework.metadata?.hasPrisma,
              frontendDatabaseType: detection.framework.metadata?.hasPrisma ? 'prisma' : undefined,
            },
            deployment: {
              productionUrl: productionDomain ? `https://${productionDomain}` : undefined,
              githubRepo: detection.github.isGitHub ? `${detection.github.owner}/${detection.github.repo}` : undefined,
            },
          };

          await backendClient.updateApplication(existingApp.application.id, updateData);
          applicationId = existingApp.application.id;
          isUpdate = true;
          console.log(chalk.green(`  ✅ Application registration updated\n`));
        } else {
          applicationId = existingApp.application.id;
          console.log(chalk.gray(`  Skipped registration update\n`));
        }
      } else {
        // Register new application
        const registrationData = {
          organizationId,
          name: detection.github.repo || organizationName || 'My Application',
          description: `Connected via CLI from ${detection.framework.type || 'unknown'} project`,
          source: {
            type: 'cli',
            projectPathHash,
            cliVersion: pkg.version,
            framework: detection.framework.type || 'unknown',
            frameworkVersion: detection.framework.metadata?.version,
            hasTypeScript: detection.framework.metadata?.hasTypeScript || false,
            routerType: detection.framework.metadata?.routerType,
          },
          connection: {
            features,
            hasFrontendDatabase: !!detection.framework.metadata?.hasPrisma,
            frontendDatabaseType: detection.framework.metadata?.hasPrisma ? 'prisma' : undefined,
          },
          deployment: {
            productionUrl: productionDomain ? `https://${productionDomain}` : undefined,
            githubRepo: detection.github.isGitHub ? `${detection.github.owner}/${detection.github.repo}` : undefined,
            githubBranch: detection.github.branch || 'main',
          },
        };

        const registrationResult = await backendClient.registerApplication(registrationData);
        applicationId = registrationResult.applicationId;
        console.log(chalk.green(`  ✅ Application registered with L4YERCAK3\n`));

        // If backend returned a new API key, use it
        if (registrationResult.apiKey && registrationResult.apiKey.key) {
          console.log(chalk.gray(`     API key generated: ${registrationResult.apiKey.prefix}`));
        }
      }
    } catch (regError) {
      // Registration failed but files were generated - warn but don't fail
      console.log(chalk.yellow(`  ⚠️  Could not register with backend: ${regError.message}`));
      console.log(chalk.gray('     Your files were generated. Registration can be retried later.\n'));
    }

    // Save project configuration
    const projectConfig = {
      organizationId,
      organizationName,
      applicationId,
      projectPathHash,
      apiKey: `${apiKey.substring(0, 10)}...`, // Store partial key for reference only
      backendUrl,
      features,
      oauthProviders,
      productionDomain,
      frameworkType: detection.framework.type,
      createdAt: Date.now(),
      updatedAt: isUpdate ? Date.now() : undefined,
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

