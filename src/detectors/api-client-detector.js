/**
 * API Client Pattern Detector
 * Detects existing API client implementations
 */

const fs = require('fs');
const path = require('path');

class ApiClientDetector {
  /**
   * Detect existing API client patterns
   */
  detect(projectPath = process.cwd()) {
    const results = {
      hasApiClient: false,
      clientPath: null,
      clientType: null, // 'fetch', 'axios', 'custom'
      hasEnvFile: false,
      envFilePath: null,
    };

    // Common API client locations
    const clientPaths = [
      'lib/api-client.ts',
      'lib/api-client.js',
      'lib/api.ts',
      'lib/api.js',
      'src/lib/api-client.ts',
      'src/lib/api-client.js',
      'src/lib/api.ts',
      'src/lib/api.js',
      'utils/api-client.ts',
      'utils/api-client.js',
      'utils/api.ts',
      'utils/api.js',
      'src/utils/api-client.ts',
      'src/utils/api-client.js',
    ];

    // Check for existing API client
    for (const clientPath of clientPaths) {
      const fullPath = path.join(projectPath, clientPath);
      if (fs.existsSync(fullPath)) {
        results.hasApiClient = true;
        results.clientPath = clientPath;
        
        // Try to detect client type
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('axios')) {
            results.clientType = 'axios';
          } else if (content.includes('fetch')) {
            results.clientType = 'fetch';
          } else {
            results.clientType = 'custom';
          }
        } catch (error) {
          results.clientType = 'unknown';
        }
        break;
      }
    }

    // Check for environment files
    const envFiles = [
      '.env.local',
      '.env',
      '.env.development',
      '.env.production',
    ];

    for (const envFile of envFiles) {
      const fullPath = path.join(projectPath, envFile);
      if (fs.existsSync(fullPath)) {
        results.hasEnvFile = true;
        results.envFilePath = envFile;
        break;
      }
    }

    return results;
  }
}

module.exports = new ApiClientDetector();
