/**
 * Expo/React Native Project Detector
 * Detects Expo and React Native projects and their configuration
 */

const fs = require('fs');
const path = require('path');
const BaseDetector = require('./base-detector');

class ExpoDetector extends BaseDetector {
  get name() {
    return 'expo';
  }

  get priority() {
    return 95; // High priority - specific framework
  }

  /**
   * Detect if current directory is an Expo or React Native project
   */
  detect(projectPath = process.cwd()) {
    const results = {
      isExpo: false,
      isReactNative: false,
      expoVersion: null,
      reactNativeVersion: null,
      hasTypeScript: false,
      routerType: null, // 'expo-router' or 'react-navigation' or null
      sdkVersion: null,
      config: null,
    };

    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        detected: false,
        confidence: 0,
        metadata: {},
      };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for Expo
      if (dependencies.expo) {
        results.isExpo = true;
        results.expoVersion = dependencies.expo;
      }

      // Check for React Native (with or without Expo)
      if (dependencies['react-native']) {
        results.isReactNative = true;
        results.reactNativeVersion = dependencies['react-native'];
      }

      // If neither, not a React Native project
      if (!results.isExpo && !results.isReactNative) {
        return {
          detected: false,
          confidence: 0,
          metadata: {},
        };
      }

      // Check for TypeScript
      if (dependencies.typescript || fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
        results.hasTypeScript = true;
      }

      // Detect router type
      if (dependencies['expo-router']) {
        results.routerType = 'expo-router';
      } else if (dependencies['@react-navigation/native']) {
        results.routerType = 'react-navigation';
      }

      // Check for app.json or app.config.js (Expo config)
      const appJsonPath = path.join(projectPath, 'app.json');
      const appConfigJsPath = path.join(projectPath, 'app.config.js');
      const appConfigTsPath = path.join(projectPath, 'app.config.ts');

      if (fs.existsSync(appJsonPath)) {
        try {
          const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
          results.config = 'app.json';
          if (appJson.expo?.sdkVersion) {
            results.sdkVersion = appJson.expo.sdkVersion;
          }
        } catch (error) {
          // Could not parse app.json
        }
      } else if (fs.existsSync(appConfigJsPath)) {
        results.config = 'app.config.js';
      } else if (fs.existsSync(appConfigTsPath)) {
        results.config = 'app.config.ts';
      }

      // Determine confidence based on what we found
      let confidence = 0.7; // Base confidence for React Native
      if (results.isExpo) {
        confidence = 0.9; // Higher for Expo
        if (results.config) {
          confidence = 0.95; // Even higher with config file
        }
      }

      return {
        detected: true,
        confidence,
        metadata: {
          isExpo: results.isExpo,
          expoVersion: results.expoVersion,
          reactNativeVersion: results.reactNativeVersion,
          hasTypeScript: results.hasTypeScript,
          routerType: results.routerType,
          sdkVersion: results.sdkVersion,
          config: results.config,
        },
      };
    } catch (error) {
      // Error reading package.json
      return {
        detected: false,
        confidence: 0,
        metadata: {},
      };
    }
  }

  /**
   * Get supported features for Expo/React Native
   */
  getSupportedFeatures() {
    return {
      oauth: true,      // OAuth via expo-auth-session or similar
      stripe: true,     // Stripe via @stripe/stripe-react-native
      crm: true,        // CRM API access
      projects: true,   // Projects API access
      invoices: true,   // Invoices API access
    };
  }

  /**
   * Get available generators for Expo/React Native
   */
  getAvailableGenerators() {
    return [
      'api-client',    // TypeScript API client
      'env',           // Environment variables
      'oauth-guide',   // OAuth setup guide for mobile
      // Future: 'expo-auth', 'stripe-mobile'
    ];
  }
}

module.exports = new ExpoDetector();
