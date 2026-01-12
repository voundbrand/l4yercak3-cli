/**
 * Database Generator Index
 * Routes to the appropriate database generator
 */

const convexGenerator = require('./convex');
const supabaseGenerator = require('./supabase');

class DatabaseGenerator {
  /**
   * Generate database files based on selected database type
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated file paths
   */
  async generate(options) {
    const { selectedDatabase } = options;

    switch (selectedDatabase) {
      case 'convex':
        return convexGenerator.generate(options);
      case 'supabase':
        return supabaseGenerator.generate(options);
      default:
        // No database selected, return empty results
        return {
          schema: null,
          client: null,
          types: null,
        };
    }
  }
}

module.exports = new DatabaseGenerator();
