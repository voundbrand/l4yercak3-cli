/**
 * Quick Start Generator
 * Orchestrates full-stack generation for the Quick Start path
 */

const databaseGenerator = require('./database');
const hooksGenerator = require('./hooks');
const componentGenerator = require('./components');
const pageGenerator = require('./pages');
const apiOnlyGenerator = require('../api-only');
const envGenerator = require('../env-generator');
const nextauthGenerator = require('../nextauth-generator');
const oauthGuideGenerator = require('../oauth-guide-generator');
const gitignoreGenerator = require('../gitignore-generator');

class QuickStartGenerator {
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
   * Generate all Quick Start files
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated file paths
   */
  async generate(options) {
    const results = {
      // API Client (from api-only generator)
      apiClient: null,
      types: null,
      webhooks: null,
      index: null,

      // Database
      database: null,

      // Hooks
      hooks: null,

      // Components
      components: null,

      // Pages (Next.js only)
      pages: null,

      // Common files
      envFile: null,
      nextauth: null,
      oauthGuide: null,
      gitignore: null,
    };

    const frameworkType = options.frameworkType || 'unknown';
    const isMobile = this.isMobileFramework(frameworkType);
    const isNextJs = this.isNextJs(frameworkType);

    // 1. Generate the typed API client package
    const apiOnlyResults = await apiOnlyGenerator.generate(options);
    results.apiClient = apiOnlyResults.client;
    results.types = apiOnlyResults.types;
    results.webhooks = apiOnlyResults.webhooks;
    results.index = apiOnlyResults.index;

    // 2. Generate database files if database selected
    if (options.selectedDatabase && options.selectedDatabase !== 'none' && options.selectedDatabase !== 'existing') {
      results.database = await databaseGenerator.generate(options);
    }

    // 3. Generate React hooks for data fetching
    if (options.features && options.features.length > 0) {
      results.hooks = await hooksGenerator.generate(options);
    }

    // 4. Generate React components
    if (options.features && options.features.length > 0) {
      results.components = await componentGenerator.generate(options);
    }

    // 5. Generate pages (Next.js only)
    if (isNextJs && options.features && options.features.length > 0) {
      results.pages = await pageGenerator.generate(options);
    }

    // 6. Generate environment file
    results.envFile = envGenerator.generate(this.enhanceEnvOptions(options));

    // 7. Generate NextAuth.js config if OAuth is enabled (Next.js only)
    if (options.features && options.features.includes('oauth') && options.oauthProviders) {
      if (isNextJs) {
        results.nextauth = await nextauthGenerator.generate(options);
      }
    }

    // 8. Generate OAuth guide if OAuth is enabled
    if (options.features && options.features.includes('oauth') && options.oauthProviders) {
      results.oauthGuide = oauthGuideGenerator.generate({
        ...options,
        isMobile,
        isNextJs,
      });
    }

    // 9. Update .gitignore
    results.gitignore = gitignoreGenerator.generate(options);

    return results;
  }

  /**
   * Add database-specific env vars to options
   */
  enhanceEnvOptions(options) {
    const enhanced = { ...options };
    enhanced.additionalEnvVars = enhanced.additionalEnvVars || [];

    if (options.selectedDatabase === 'convex') {
      enhanced.additionalEnvVars.push(
        { key: 'CONVEX_DEPLOYMENT', value: '', comment: 'Convex deployment URL (from npx convex dev)' },
        { key: 'NEXT_PUBLIC_CONVEX_URL', value: '', comment: 'Convex public URL' }
      );
    } else if (options.selectedDatabase === 'supabase') {
      enhanced.additionalEnvVars.push(
        { key: 'NEXT_PUBLIC_SUPABASE_URL', value: '', comment: 'Supabase project URL' },
        { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: '', comment: 'Supabase anonymous key' },
        { key: 'SUPABASE_SERVICE_ROLE_KEY', value: '', comment: 'Supabase service role key (server only)' }
      );
    }

    if (options.features && options.features.includes('checkout')) {
      enhanced.additionalEnvVars.push(
        { key: 'STRIPE_SECRET_KEY', value: '', comment: 'Stripe secret key' },
        { key: 'STRIPE_WEBHOOK_SECRET', value: '', comment: 'Stripe webhook signing secret' },
        { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', value: '', comment: 'Stripe publishable key' }
      );
    }

    return enhanced;
  }
}

module.exports = new QuickStartGenerator();
