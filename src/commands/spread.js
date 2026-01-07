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

      if (existingKeys && existingKeys.canCreateMore === false) {
        // At API key limit - inform user and exit (only if explicitly false, not undefined)
        console.log(chalk.yellow(`  ⚠️  You've reached your API key limit (${existingKeys.keys?.length || 0} key(s))`));
        if (existingKeys.limitDescription) {
          console.log(chalk.gray(`     ${existingKeys.limitDescription}`));
        }
        console.log(chalk.cyan('\n  To continue, either:'));
        console.log(chalk.gray('     • Delete an existing key at https://app.l4yercak3.com?openWindow=integrations&panel=api-keys'));
        console.log(chalk.gray('     • Upgrade your plan at https://app.l4yercak3.com?openWindow=store\n'));
        process.exit(0);
      } else if (existingKeys && existingKeys.keys && existingKeys.keys.length > 0) {
        // Has existing keys - offer to reuse or generate new
        const activeKeys = existingKeys.keys.filter(k => k.status === 'active');

        if (activeKeys.length > 0) {
          console.log(chalk.gray(`  Found ${activeKeys.length} active API key(s)\n`));

          const keyChoices = activeKeys.map(key => ({
            name: `${key.name} (${key.keyPreview})`,
            value: key.id,
          }));
          keyChoices.push({ name: '➕ Generate a new API key', value: '__generate__' });

          const { keyChoice } = await inquirer.prompt([
            {
              type: 'list',
              name: 'keyChoice',
              message: 'Which API key would you like to use?',
              choices: keyChoices,
            },
          ]);

          if (keyChoice === '__generate__') {
            apiKey = await generateNewApiKey(organizationId);
          } else {
            // User selected existing key - we only have the preview, not the full key
            // They need to use the key they have stored or get it from dashboard
            const selectedKey = activeKeys.find(k => k.id === keyChoice);
            console.log(chalk.yellow(`\n  ⚠️  For security, we can't retrieve the full API key.`));
            console.log(chalk.gray(`  You selected: ${selectedKey.name} (${selectedKey.keyPreview})`));
            console.log(chalk.gray(`  If you have this key stored, enter it below.`));
            console.log(chalk.gray(`  Otherwise, generate a new key or find it at:`));
            console.log(chalk.gray(`  https://app.l4yercak3.com?openWindow=integrations&panel=api-keys\n`));

            const { existingKey } = await inquirer.prompt([
              {
                type: 'input',
                name: 'existingKey',
                message: 'Enter your API key (or press Enter to generate new):',
              },
            ]);

            if (existingKey.trim()) {
              apiKey = existingKey.trim();
              console.log(chalk.green(`  ✅ Using existing API key\n`));
            } else {
              apiKey = await generateNewApiKey(organizationId);
            }
          }
        } else {
          // Only revoked keys exist - generate new
          apiKey = await generateNewApiKey(organizationId);
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
        console.log(chalk.cyan('\n  To continue, either:'));
        console.log(chalk.gray('     • Delete an existing key at https://app.l4yercak3.com?openWindow=integrations&panel=api-keys'));
        console.log(chalk.gray('     • Upgrade your plan at https://app.l4yercak3.com?openWindow=store\n'));
        process.exit(0);
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

    // Step 6: Backend URL (fixed to Convex HTTP endpoint)
    const backendUrl = 'https://agreeable-lion-828.convex.site';

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
        // Build source object, only including routerType if it has a value
        const sourceData = {
          type: 'cli',
          projectPathHash,
          cliVersion: pkg.version,
          framework: detection.framework.type || 'unknown',
          frameworkVersion: detection.framework.metadata?.version,
          hasTypeScript: detection.framework.metadata?.hasTypeScript || false,
        };

        // Only add routerType if it exists (Next.js has 'app'/'pages', Expo has 'expo-router'/'react-navigation')
        if (detection.framework.metadata?.routerType) {
          sourceData.routerType = detection.framework.metadata.routerType;
        }

        const registrationData = {
          organizationId,
          name: detection.github.repo || organizationName || 'My Application',
          description: `Connected via CLI from ${detection.framework.type || 'unknown'} project`,
          source: sourceData,
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
      console.log(chalk.gray('     Your files were generated successfully.'));
      console.log(chalk.gray('     Backend registration will be available in a future update.\n'));
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

    // Show appropriate completion message based on registration status
    if (applicationId) {
      console.log(chalk.cyan('\n  🎉 Setup complete!\n'));
    } else {
      console.log(chalk.cyan('\n  🎉 Local setup complete!\n'));
      console.log(chalk.yellow('  ⚠️  Note: Backend registration pending - your app works locally but'));
      console.log(chalk.yellow('     won\'t appear in the L4YERCAK3 dashboard until endpoints are available.\n'));
    }

    if (features.includes('oauth')) {
      console.log(chalk.yellow('  📋 Next steps:\n'));
      console.log(chalk.gray('     1. Follow the OAuth setup guide (OAUTH_SETUP_GUIDE.md)'));
      console.log(chalk.gray('     2. Add OAuth credentials to .env.local'));

      // Framework-specific OAuth instructions
      const frameworkType = detection.framework.type;
      if (frameworkType === 'expo' || frameworkType === 'react-native') {
        console.log(chalk.gray('     3. Install expo-auth-session: npx expo install expo-auth-session expo-crypto'));
        console.log(chalk.gray('     4. Configure app.json with your OAuth scheme'));
      } else {
        console.log(chalk.gray('     3. Install NextAuth.js: npm install next-auth'));
        if (oauthProviders.includes('microsoft')) {
          console.log(chalk.gray('     4. Install Azure AD provider: npm install next-auth/providers/azure-ad'));
        }
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

