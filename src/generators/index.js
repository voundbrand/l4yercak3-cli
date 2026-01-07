/**
 * File Generators
 * Main entry point for all file generation
 *
 * Supports multiple frameworks:
 * - nextjs: Next.js (App Router and Pages Router)
 * - expo: Expo/React Native
 */

const apiClientGenerator = require('./api-client-generator');
const envGenerator = require('./env-generator');
const nextauthGenerator = require('./nextauth-generator');
const oauthGuideGenerator = require('./oauth-guide-generator');
const gitignoreGenerator = require('./gitignore-generator');

class FileGenerator {
  /**
   * Check if framework is a mobile platform
   */
  isMobileFramework(frameworkType) {
    return ['expo', 'react-native'].includes(frameworkType);
  }

  /**
   * Check if framework is Next.js
   */
  isNextJs(frameworkType) {
    return frameworkType === 'nextjs';
  }

  /**
   * Generate all files based on configuration
   */
  async generate(options) {
    const results = {
      apiClient: null,
      envFile: null,
      nextauth: null,
      oauthGuide: null,
      gitignore: null,
    };

    const frameworkType = options.frameworkType || 'unknown';
    const isMobile = this.isMobileFramework(frameworkType);
    const isNextJs = this.isNextJs(frameworkType);

    // Generate API client (async - checks for file overwrites)
    if (options.features && options.features.length > 0) {
      results.apiClient = await apiClientGenerator.generate(options);
    }

    // Generate environment file
    results.envFile = envGenerator.generate(options);

    // Generate NextAuth.js config if OAuth is enabled (Next.js only)
    if (options.features && options.features.includes('oauth') && options.oauthProviders) {
      if (isNextJs) {
        results.nextauth = await nextauthGenerator.generate(options);
      }
      // For mobile, OAuth is handled differently (expo-auth-session, etc.)
    }

    // Generate OAuth guide if OAuth is enabled
    if (options.features && options.features.includes('oauth') && options.oauthProviders) {
      // Pass framework info so guide can be customized
      results.oauthGuide = oauthGuideGenerator.generate({
        ...options,
        isMobile,
        isNextJs,
      });
    }

    // Update .gitignore
    results.gitignore = gitignoreGenerator.generate(options);

    return results;
  }
}

module.exports = new FileGenerator();
