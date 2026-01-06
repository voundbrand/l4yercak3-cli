/**
 * Next.js Project Detector
 * Detects Next.js projects and their configuration
 */

const fs = require('fs');
const path = require('path');
const BaseDetector = require('./base-detector');

class NextJsDetector extends BaseDetector {
  get name() {
    return 'nextjs';
  }

  get priority() {
    return 100; // High priority - very specific framework
  }

  /**
   * Detect if current directory is a Next.js project
   */
  detect(projectPath = process.cwd()) {
    const results = {
      isNextJs: false,
      version: null,
      routerType: null, // 'app' or 'pages'
      hasTypeScript: false,
      config: null,
    };

    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return results;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check if Next.js is installed
      if (dependencies.next) {
        results.isNextJs = true;
        results.version = dependencies.next;
      }

      // Check for TypeScript
      if (dependencies.typescript || fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
        results.hasTypeScript = true;
      }

      // Detect router type (App Router vs Pages Router)
      const appDir = path.join(projectPath, 'app');
      const pagesDir = path.join(projectPath, 'pages');
      const srcAppDir = path.join(projectPath, 'src', 'app');
      const srcPagesDir = path.join(projectPath, 'src', 'pages');

      if (fs.existsSync(appDir) || fs.existsSync(srcAppDir)) {
        results.routerType = 'app';
      } else if (fs.existsSync(pagesDir) || fs.existsSync(srcPagesDir)) {
        results.routerType = 'pages';
      }

      // Read Next.js config if exists
      const configFiles = [
        'next.config.js',
        'next.config.mjs',
        'next.config.ts',
        'next.config.cjs',
      ];

      for (const configFile of configFiles) {
        const configPath = path.join(projectPath, configFile);
        if (fs.existsSync(configPath)) {
          try {
            // For .js/.mjs/.cjs files, we'd need to require them
            // For now, just note that config exists
            results.config = configFile;
            break;
          } catch (error) {
            // Config file exists but couldn't be read
          }
        }
      }
    } catch (error) {
      // Error reading package.json
    }

    // Return in BaseDetector format
    if (!results.isNextJs) {
      return {
        detected: false,
        confidence: 0,
        metadata: {},
      };
    }

    return {
      detected: true,
      confidence: 0.95, // High confidence for Next.js detection
      metadata: {
        version: results.version,
        routerType: results.routerType,
        hasTypeScript: results.hasTypeScript,
        config: results.config,
      },
    };
  }

  /**
   * Get supported features for Next.js
   */
  getSupportedFeatures() {
    return {
      oauth: true,      // Full NextAuth.js support
      stripe: true,     // Full Stripe support
      crm: true,        // Full CRM support
      projects: true,   // Full Projects support
      invoices: true,    // Full Invoices support
    };
  }

  /**
   * Get available generators for Next.js
   */
  getAvailableGenerators() {
    return [
      'api-client',
      'env',
      'nextauth',      // Next.js-specific
      'oauth-guide',
    ];
  }
}

module.exports = new NextJsDetector();
