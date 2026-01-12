/**
 * Project Detectors
 * Main entry point for all project detection
 * 
 * This module orchestrates both framework detection (Next.js, React, etc.)
 * and project metadata detection (GitHub, API clients, etc.)
 */

const registry = require('./registry');
const githubDetector = require('./github-detector');
const apiClientDetector = require('./api-client-detector');
const oauthDetector = require('./oauth-detector');
const databaseDetector = require('./database-detector');

class ProjectDetector {
  /**
   * Run all detectors and return combined results
   * 
   * @param {string} projectPath - Path to project directory
   * @returns {object} Combined detection results
   */
  detect(projectPath = process.cwd()) {
    // Detect framework/project type
    const frameworkDetection = registry.detectProjectType(projectPath);
    
    // Detect project metadata (framework-agnostic)
    const githubInfo = githubDetector.detect(projectPath);
    const apiClientInfo = apiClientDetector.detect(projectPath);
    const oauthInfo = oauthDetector.detect(projectPath);
    const databaseInfo = databaseDetector.detect(projectPath);

    // Get detector instance if we have a match
    const detector = frameworkDetection.detected
      ? registry.getDetector(frameworkDetection.detected)
      : null;

    return {
      // Framework detection
      framework: {
        type: frameworkDetection.detected,
        confidence: frameworkDetection.confidence,
        metadata: frameworkDetection.metadata,
        supportedFeatures: detector?.getSupportedFeatures() || {},
        availableGenerators: detector?.getAvailableGenerators() || [],
      },

      // Project metadata (framework-agnostic)
      github: githubInfo,
      apiClient: apiClientInfo,
      oauth: oauthInfo,
      database: databaseInfo,

      // Raw detection results (for debugging)
      _raw: {
        frameworkResults: frameworkDetection.allResults,
      },

      // Project path
      projectPath,
    };
  }

  /**
   * Detect database configuration in a project
   *
   * @param {string} projectPath - Path to project directory
   * @returns {object} Database detection results
   */
  detectDatabase(projectPath = process.cwd()) {
    return databaseDetector.detect(projectPath);
  }

  /**
   * Get detector for a specific project type
   * 
   * @param {string} type - Project type name (e.g., 'nextjs')
   * @returns {object|null} Detector instance or null
   */
  getDetector(type) {
    return registry.getDetector(type);
  }

  /**
   * Get all available project types
   * 
   * @returns {array} Array of detector names
   */
  getAvailableTypes() {
    return registry.getAllDetectors().map(d => d.name);
  }
}

module.exports = new ProjectDetector();
