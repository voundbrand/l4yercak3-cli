/**
 * Login Command
 * Handles CLI authentication via browser OAuth flow
 */

const { default: open } = require('open');
const configManager = require('../config/config-manager');
const backendClient = require('../api/backend-client');
const chalk = require('chalk');

/**
 * Start local server to receive OAuth callback
 */
function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const http = require('http');
    
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:3001');
      
      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token');
        
        if (token) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>CLI Login Success</title></head>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1 style="color: #9F7AEA;">✅ Successfully logged in!</h1>
                <p>You can close this window and return to your terminal.</p>
              </body>
            </html>
          `);
          
          server.close();
          resolve(token);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>CLI Login Error</title></head>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1 style="color: #EF4444;">❌ Login failed</h1>
                <p>No token received. Please try again.</p>
              </body>
            </html>
          `);
          
          server.close();
          reject(new Error('No token received'));
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(3001, 'localhost', () => {
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
    // Check if already logged in
    if (configManager.isLoggedIn()) {
      const session = configManager.getSession();
      console.log(chalk.yellow('  ⚠️  You are already logged in'));
      console.log(chalk.gray(`  Email: ${session.email}`));
      console.log(chalk.gray(`  Session expires: ${new Date(session.expiresAt).toLocaleString()}`));
      console.log(chalk.gray('\n  Run "l4yercak3 logout" to log out first\n'));
      return;
    }

    console.log(chalk.cyan('  🔐 Opening browser for authentication...\n'));

    // Start callback server
    const callbackPromise = startCallbackServer();

    // Open browser
    const loginUrl = backendClient.getLoginUrl();
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

    console.log(chalk.green('\n  ✅ Successfully logged in!\n'));
    
    const finalSession = configManager.getSession();
    if (finalSession && finalSession.email) {
      console.log(chalk.gray(`  Logged in as: ${finalSession.email}`));
    }

  } catch (error) {
    console.error(chalk.red(`\n  ❌ Login failed: ${error.message}\n`));
    process.exit(1);
  }
}

module.exports = {
  command: 'login',
  description: 'Authenticate with L4YERCAK3 platform',
  handler: handleLogin,
};

