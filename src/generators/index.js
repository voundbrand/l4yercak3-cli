/**
 * File Generators
 * Main entry point for all file generation
 *
 * Supports multiple frameworks:
 * - nextjs: Next.js (App Router and Pages Router)
 * - expo: Expo/React Native
 *
 * Supports multiple integration paths:
 * - quickstart: Full-stack with UI components & database
 * - api-only: Just the typed API client
 * - mcp-assisted: AI-powered custom generation
 */

const apiClientGenerator = require('./api-client-generator');
const envGenerator = require('./env-generator');
const nextauthGenerator = require('./nextauth-generator');
const oauthGuideGenerator = require('./oauth-guide-generator');
const gitignoreGenerator = require('./gitignore-generator');
const apiOnlyGenerator = require('./api-only');
const mcpGuideGenerator = require('./mcp-guide-generator');
const quickstartGenerator = require('./quickstart');

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
    const integrationPath = options.integrationPath || 'api-only';

    // Route to the appropriate generator based on integration path
    switch (integrationPath) {
      case 'api-only':
        return this.generateApiOnly(options);
      case 'mcp-assisted':
        return this.generateMcpAssisted(options);
      case 'quickstart':
        return this.generateQuickStart(options);
      default:
        return this.generateLegacy(options);
    }
  }

  /**
   * API-Only path: Generate typed API client and types
   */
  async generateApiOnly(options) {
    const results = {
      apiClient: null,
      types: null,
      webhooks: null,
      index: null,
      envFile: null,
      gitignore: null,
    };

    // Generate the full typed API client package
    const apiOnlyResults = await apiOnlyGenerator.generate(options);
    results.apiClient = apiOnlyResults.client;
    results.types = apiOnlyResults.types;
    results.webhooks = apiOnlyResults.webhooks;
    results.index = apiOnlyResults.index;

    // Generate environment file
    results.envFile = envGenerator.generate(options);

    // Update .gitignore
    results.gitignore = gitignoreGenerator.generate(options);

    return results;
  }

  /**
   * MCP-Assisted path: Generate MCP config and guide
   */
  async generateMcpAssisted(options) {
    const results = {
      mcpConfig: null,
      mcpGuide: null,
      envFile: null,
      gitignore: null,
    };

    // Generate MCP configuration and guide
    const mcpResults = await mcpGuideGenerator.generate(options);
    results.mcpConfig = mcpResults.config;
    results.mcpGuide = mcpResults.guide;

    // Generate environment file
    results.envFile = envGenerator.generate(options);

    // Update .gitignore
    results.gitignore = gitignoreGenerator.generate(options);

    return results;
  }

  /**
   * Quick Start path: Full-stack generation with database, hooks, and components
   */
  async generateQuickStart(options) {
    return quickstartGenerator.generate(options);
  }

  /**
   * Legacy generation (backward compatibility)
   */
  async generateLegacy(options) {
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
    }

    // Generate OAuth guide if OAuth is enabled
    if (options.features && options.features.includes('oauth') && options.oauthProviders) {
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
