/**
 * Base Detector Class
 * 
 * All project type detectors should extend this class or implement its interface.
 * This provides a consistent API for detection across all project types.
 */

class BaseDetector {
  /**
   * Unique identifier for this project type
   * @returns {string} Detector name (e.g., 'nextjs', 'react', 'vue')
   */
  get name() {
    throw new Error('Detector must implement name getter');
  }

  /**
   * Detection priority (higher = checked first)
   * Range: 0-100
   * 
   * Priority guidelines:
   * - 100: Very specific frameworks (Next.js, Nuxt, SvelteKit)
   * - 75: Framework with build tool (Vite + React, Webpack + Vue)
   * - 50: Pure frameworks (React, Vue, Svelte)
   * - 25: Generic JavaScript/TypeScript projects
   * 
   * @returns {number} Priority value
   */
  get priority() {
    return 50; // Default priority
  }

  /**
   * Detect if project matches this type
   * 
   * @param {string} projectPath - Path to project directory (defaults to process.cwd())
   * @returns {object} Detection result with:
   *   - detected: {boolean} Is this the project type?
   *   - confidence: {number} 0-1, how sure are we?
   *   - metadata: {object} Type-specific information
   */
  detect(_projectPath = process.cwd()) {
    throw new Error('Detector must implement detect() method');
  }

  /**
   * Get supported features for this project type
   * 
   * @returns {object} Feature support matrix:
   *   - oauth: {boolean|'manual'} true = full support, 'manual' = guide only, false = not supported
   *   - stripe: {boolean} Stripe integration support
   *   - crm: {boolean} CRM features support
   *   - projects: {boolean} Projects feature support
   *   - invoices: {boolean} Invoices feature support
   */
  getSupportedFeatures() {
    return {
      oauth: false,
      stripe: false,
      crm: false,
      projects: false,
      invoices: false,
    };
  }

  /**
   * Get available generators for this project type
   * 
   * @returns {string[]} List of generator names that work with this project type
   */
  getAvailableGenerators() {
    return ['api-client', 'env']; // Default: shared generators only
  }
}

module.exports = BaseDetector;

