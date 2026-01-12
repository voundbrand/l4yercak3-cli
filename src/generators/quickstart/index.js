/**
 * Quick Start Generator
 * Orchestrates full-stack generation for the Quick Start path
 */

const databaseGenerator = require('./database');
const hooksGenerator = require('./hooks');
const componentGenerator = require('./components');
const mobileComponentGenerator = require('./components-mobile');
const pageGenerator = require('./pages');
const screensGenerator = require('./screens');
const apiOnlyGenerator = require('../api-only');
const envGenerator = require('../env-generator');
const nextauthGenerator = require('../nextauth-generator');
const expoAuthGenerator = require('../expo-auth-generator');
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

      // Screens (Expo only)
      screens: null,

      // Common files
      envFile: null,
      nextauth: null,
      expoAuth: null,
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

    // 4. Generate React components (mobile or web)
    if (options.features && options.features.length > 0) {
      if (isMobile) {
        results.components = await mobileComponentGenerator.generate(options);
      } else {
        results.components = await componentGenerator.generate(options);
      }
    }

    // 5. Generate pages (Next.js) or screens (Expo)
    if (options.features && options.features.length > 0) {
      if (isNextJs) {
        results.pages = await pageGenerator.generate(options);
      } else if (isMobile) {
        results.screens = await screensGenerator.generate(options);
      }
    }

    // 6. Generate environment file
    results.envFile = envGenerator.generate(this.enhanceEnvOptions(options));

    // 7. Generate auth config if OAuth is enabled
    if (options.features && options.features.includes('oauth') && options.oauthProviders) {
      if (isNextJs) {
        // NextAuth.js for Next.js
        results.nextauth = await nextauthGenerator.generate(options);
      } else if (isMobile) {
        // expo-auth-session for Expo/React Native
        results.expoAuth = await expoAuthGenerator.generate(options);
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

    const isMobile = this.isMobileFramework(options.frameworkType);
    // Use EXPO_PUBLIC_ for Expo, NEXT_PUBLIC_ for Next.js
    const publicPrefix = isMobile ? 'EXPO_PUBLIC_' : 'NEXT_PUBLIC_';

    if (options.selectedDatabase === 'convex') {
      enhanced.additionalEnvVars.push(
        { key: 'CONVEX_DEPLOYMENT', value: '', comment: 'Convex deployment URL (from npx convex dev)' },
        { key: `${publicPrefix}CONVEX_URL`, value: '', comment: 'Convex public URL' }
      );
    } else if (options.selectedDatabase === 'supabase') {
      enhanced.additionalEnvVars.push(
        { key: `${publicPrefix}SUPABASE_URL`, value: '', comment: 'Supabase project URL' },
        { key: `${publicPrefix}SUPABASE_ANON_KEY`, value: '', comment: 'Supabase anonymous key' },
        { key: 'SUPABASE_SERVICE_ROLE_KEY', value: '', comment: 'Supabase service role key (server only)' }
      );
    }

    if (options.features && options.features.includes('checkout')) {
      enhanced.additionalEnvVars.push(
        { key: 'STRIPE_SECRET_KEY', value: '', comment: 'Stripe secret key' },
        { key: 'STRIPE_WEBHOOK_SECRET', value: '', comment: 'Stripe webhook signing secret' },
        { key: `${publicPrefix}STRIPE_PUBLISHABLE_KEY`, value: '', comment: 'Stripe publishable key' }
      );
    }

    // Pass mobile flag to env generator
    enhanced.isMobile = isMobile;

    return enhanced;
  }
}

module.exports = new QuickStartGenerator();
