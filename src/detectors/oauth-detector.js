/**
 * OAuth Setup Detector
 * Detects existing OAuth/NextAuth.js configuration
 */

const fs = require('fs');
const path = require('path');

class OAuthDetector {
  /**
   * Detect existing OAuth setup
   */
  detect(projectPath = process.cwd()) {
    const results = {
      hasOAuth: false,
      oauthType: null, // 'nextauth', 'custom', 'unknown'
      configPath: null,
      providers: [], // ['google', 'microsoft', 'github']
      hasEnvVars: false,
    };

    // Check for NextAuth.js configuration
    const nextAuthPaths = [
      // App Router
      'app/api/auth/[...nextauth]/route.ts',
      'app/api/auth/[...nextauth]/route.js',
      'src/app/api/auth/[...nextauth]/route.ts',
      'src/app/api/auth/[...nextauth]/route.js',
      // Pages Router
      'pages/api/auth/[...nextauth].ts',
      'pages/api/auth/[...nextauth].js',
      'src/pages/api/auth/[...nextauth].ts',
      'src/pages/api/auth/[...nextauth].js',
    ];

    for (const configPath of nextAuthPaths) {
      const fullPath = path.join(projectPath, configPath);
      if (fs.existsSync(fullPath)) {
        results.hasOAuth = true;
        results.oauthType = 'nextauth';
        results.configPath = configPath;

        // Try to detect providers from config file
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const detectedProviders = [];

          if (content.includes('GoogleProvider') || content.includes('google')) {
            detectedProviders.push('google');
          }
          if (content.includes('AzureADProvider') || content.includes('microsoft') || content.includes('azure')) {
            detectedProviders.push('microsoft');
          }
          if (content.includes('GitHubProvider') || content.includes('github')) {
            detectedProviders.push('github');
          }

          results.providers = detectedProviders;
        } catch (error) {
          // Couldn't read config file
        }
        break;
      }
    }

    // Check for OAuth-related environment variables
    const envFiles = ['.env.local', '.env', '.env.development'];
    for (const envFile of envFiles) {
      const envPath = path.join(projectPath, envFile);
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf8');
          const oauthVars = [
            'NEXTAUTH_URL',
            'NEXTAUTH_SECRET',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'MICROSOFT_CLIENT_ID',
            'MICROSOFT_CLIENT_SECRET',
            'GITHUB_CLIENT_ID',
            'GITHUB_CLIENT_SECRET',
            'GOOGLE_OAUTH_CLIENT_ID',
            'GOOGLE_OAUTH_CLIENT_SECRET',
          ];

          const hasOAuthVars = oauthVars.some(varName => content.includes(varName));
          if (hasOAuthVars) {
            results.hasEnvVars = true;
          }
        } catch (error) {
          // Couldn't read env file
        }
      }
    }

    // Check package.json for NextAuth.js dependency
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps['next-auth'] || deps.nextauth) {
          results.hasOAuth = true;
          if (!results.oauthType) {
            results.oauthType = 'nextauth';
          }
        }
      } catch (error) {
        // Couldn't read package.json
      }
    }

    return results;
  }
}

module.exports = new OAuthDetector();




