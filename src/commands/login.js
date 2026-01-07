/**
 * Login Command
 * Handles CLI authentication via browser OAuth flow
 */

const { default: open } = require('open');
const configManager = require('../config/config-manager');
const backendClient = require('../api/backend-client');
const chalk = require('chalk');
const inquirer = require('inquirer');
const projectDetector = require('../detectors');
const { showLogo } = require('../logo');

/**
 * Generate retro Windows 95 style HTML page
 */
function generateRetroPage({ title, icon, heading, headingColor, message, submessage }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; background: #008080; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div style="background: #c0c0c0; border: 2px outset #dfdfdf; width: 400px; box-shadow: 2px 2px 0 #000;">
    <div style="background: linear-gradient(90deg, #000080, #1084d0); padding: 4px 8px; display: flex; justify-content: space-between; align-items: center;">
      <span style="color: white; font-size: 12px; font-family: system-ui;">${icon} ${title}</span>
      <span style="color: white;">×</span>
    </div>
    <div style="padding: 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">${icon}</div>
      <h1 style="font-family: 'Press Start 2P', monospace; font-size: 14px; color: ${headingColor}; margin-bottom: 16px;">${heading}</h1>
      <p style="font-family: system-ui; color: #000; font-size: 14px;">${message}</p>
      <p style="font-family: system-ui; color: #666; font-size: 12px; margin-top: 16px;">${submessage}</p>
    </div>
  </div>
</body>
</html>`;
}

// CLI callback port - different from Next.js dev server (3000)
const CLI_CALLBACK_PORT = 3333;

/**
 * Start local server to receive OAuth callback
 * @param {string} expectedState - The state token to verify against
 */
function startCallbackServer(expectedState) {
  return new Promise((resolve, reject) => {
    const http = require('http');

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${CLI_CALLBACK_PORT}`);

      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token');
        const returnedState = url.searchParams.get('state');

        // Verify state to prevent CSRF attacks
        if (returnedState !== expectedState) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(generateRetroPage({
            title: 'CLI Login Error',
            icon: '⚠️',
            heading: 'Security Error',
            headingColor: '#c00000',
            message: 'State mismatch - possible CSRF attack.',
            submessage: 'Close this window and run <code style="background: #fff; padding: 2px 6px; border: 1px inset #999;">l4yercak3 login</code> again.',
          }));

          server.close();
          reject(new Error('State mismatch - security validation failed'));
          return;
        }

        if (token) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(generateRetroPage({
            title: 'CLI Login',
            icon: '🍰',
            heading: 'Success!',
            headingColor: '#008000',
            message: 'You are now logged in.',
            submessage: 'You can close this window and return to your terminal.',
          }));

          server.close();
          resolve(token);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(generateRetroPage({
            title: 'CLI Login Error',
            icon: '⚠️',
            heading: 'Login Failed',
            headingColor: '#c00000',
            message: 'No token received. Please try again.',
            submessage: 'Close this window and run <code style="background: #fff; padding: 2px 6px; border: 1px inset #999;">l4yercak3 login</code> again.',
          }));

          server.close();
          reject(new Error('No token received'));
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    // Handle server errors (e.g., port already in use)
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${CLI_CALLBACK_PORT} is already in use. Please close any other l4yercak3 processes and try again.`));
      } else {
        reject(err);
      }
    });

    server.listen(CLI_CALLBACK_PORT, 'localhost', () => {
      console.log(chalk.gray('  Waiting for authentication...'));
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Login timeout - please try again'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Login command handler
 */
async function handleLogin() {
  try {
    // Check if already logged in (local check)
    if (configManager.isLoggedIn()) {
      const session = configManager.getSession();

      // Show logo
      console.log('');
      showLogo(false);

      // Validate session with backend to ensure it's actually valid
      console.log(chalk.gray('  Validating session with backend...'));
      const validationResult = await backendClient.validateSession();

      if (validationResult) {
        console.log(chalk.green('  ✅ You are already logged in'));
        if (session.email) {
          console.log(chalk.gray(`  Email: ${session.email}`));
        }
        console.log(chalk.gray(`  Session expires: ${new Date(session.expiresAt).toLocaleString()}\n`));

        // Still offer the setup wizard
        await promptSetupWizard();
        return;
      } else {
        // Session is invalid on backend - revoke it and proceed to login
        console.log(chalk.yellow('  ⚠️  Your session has expired or is invalid'));
        console.log(chalk.gray('  Revoking old session and starting fresh login...\n'));

        // Try to revoke the old session on backend (cleanup)
        await backendClient.revokeSession();
        configManager.clearSession();
      }
    }

    console.log(chalk.cyan('  🔐 Opening browser for authentication...\n'));

    // Generate state for CSRF protection
    const state = backendClient.generateState();

    // Start callback server with expected state
    const callbackPromise = startCallbackServer(state);

    // Open browser with state parameter
    const loginUrl = backendClient.getLoginUrl(state);
    console.log(chalk.gray(`  Login URL: ${loginUrl}\n`));

    await open(loginUrl);

    // Wait for callback
    const token = await callbackPromise;

    // Validate token and get user info
    console.log(chalk.gray('  Validating session...'));
    
    // Save session
    // Note: In real implementation, backend would return full session data
    const session = {
      token,
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      // Backend should return: userId, email, etc.
    };

    configManager.saveSession(session);

    // Validate session with backend
    // Add delay to allow Convex to propagate the session (debugging timing issues)
    if (process.env.L4YERCAK3_DEBUG) {
      console.log('[DEBUG] Waiting 2s for session propagation...');
    }
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const userInfo = await backendClient.validateSession();
      if (userInfo) {
        configManager.saveSession({
          ...session,
          userId: userInfo.userId,
          email: userInfo.email,
        });
      }
    } catch (error) {
      console.log(chalk.yellow(`  ⚠️  Warning: Could not validate session: ${error.message}`));
      console.log(chalk.gray('  Session saved, but validation failed. You may need to log in again.'));
    }

    // Show logo after successful login
    console.log('');
    showLogo(false);

    console.log(chalk.green('  ✅ Successfully logged in!\n'));

    const finalSession = configManager.getSession();
    if (finalSession && finalSession.email) {
      console.log(chalk.gray(`  Logged in as: ${finalSession.email}`));
    }

    // Post-login: Prompt to run setup wizard
    await promptSetupWizard();

  } catch (error) {
    console.error(chalk.red(`\n  ❌ Login failed: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Prompt user to run the setup wizard after login
 */
async function promptSetupWizard() {
  console.log('');

  // Detect if we're in a project directory
  const detection = projectDetector.detect();
  const isInProject = detection.framework.type !== null;

  if (isInProject) {
    const frameworkName = detection.framework.type === 'nextjs' ? 'Next.js' : detection.framework.type;
    console.log(chalk.cyan(`  🔍 Detected ${frameworkName} project in current directory\n`));

    // Check if project is already configured
    const existingConfig = configManager.getProjectConfig(detection.projectPath);
    if (existingConfig) {
      console.log(chalk.yellow('  ⚠️  This project is already configured with L4YERCAK3'));
      console.log(chalk.gray(`     Organization: ${existingConfig.organizationName || 'Unknown'}`));
      console.log(chalk.gray(`     Features: ${existingConfig.features?.join(', ') || 'None'}\n`));

      const { reconfigure } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'reconfigure',
          message: 'Would you like to reconfigure this project?',
          default: false,
        },
      ]);

      if (!reconfigure) {
        console.log(chalk.gray('\n  Run "l4yercak3 spread" anytime to reconfigure.\n'));
        return;
      }
    } else {
      const { runWizard } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'runWizard',
          message: 'Would you like to set up L4YERCAK3 integration for this project now?',
          default: true,
        },
      ]);

      if (!runWizard) {
        console.log(chalk.gray('\n  Run "l4yercak3 spread" anytime to set up your project.\n'));
        return;
      }
    }

    // Run the setup wizard
    console.log('');
    const { handler: spreadHandler } = require('./spread');
    await spreadHandler();

  } else {
    // Not in a project directory
    console.log(chalk.cyan('  📋 What\'s Next?\n'));
    console.log(chalk.gray('  To integrate L4YERCAK3 with your Next.js project:'));
    console.log(chalk.gray('  1. Navigate to your project directory'));
    console.log(chalk.gray('  2. Run: l4yercak3 spread\n'));
    console.log(chalk.gray('  This will set up:'));
    console.log(chalk.gray('  • API client for backend communication'));
    console.log(chalk.gray('  • Environment variables'));
    console.log(chalk.gray('  • OAuth authentication (optional)'));
    console.log(chalk.gray('  • CRM, Projects, and Invoices integration\n'));
  }
}

module.exports = {
  command: 'login',
  description: 'Authenticate with L4YERCAK3 platform',
  handler: handleLogin,
};

