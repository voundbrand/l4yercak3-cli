/**
 * Configuration Manager
 * Handles storing and retrieving CLI configuration and session data
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.l4yercak3');
    this.configFile = path.join(this.configDir, 'config.json');
  }

  /**
   * Ensure config directory exists
   */
  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Get full config object
   */
  getConfig() {
    this.ensureConfigDir();
    
    if (!fs.existsSync(this.configFile)) {
      return {
        session: null,
        organizations: [],
        settings: {
          backendUrl: process.env.L4YERCAK3_BACKEND_URL || 'https://backend.l4yercak3.com',
        },
      };
    }

    try {
      const data = fs.readFileSync(this.configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading config file:', error.message);
      return {
        session: null,
        organizations: [],
        settings: {},
      };
    }
  }

  /**
   * Save config object
   */
  saveConfig(config) {
    this.ensureConfigDir();
    
    try {
      fs.writeFileSync(
        this.configFile,
        JSON.stringify(config, null, 2),
        { mode: 0o600 } // Read/write for owner only
      );
      return true;
    } catch (error) {
      console.error('Error saving config file:', error.message);
      return false;
    }
  }

  /**
   * Get current session
   */
  getSession() {
    const config = this.getConfig();
    return config.session;
  }

  /**
   * Save session
   */
  saveSession(session) {
    const config = this.getConfig();
    config.session = session;
    return this.saveConfig(config);
  }

  /**
   * Clear session (logout)
   */
  clearSession() {
    const config = this.getConfig();
    config.session = null;
    return this.saveConfig(config);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    const session = this.getSession();
    if (!session || !session.token) {
      return false;
    }

    // Check expiration
    if (session.expiresAt && session.expiresAt < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Get backend URL from config or env
   */
  getBackendUrl() {
    const config = this.getConfig();
    return config.settings?.backendUrl || process.env.L4YERCAK3_BACKEND_URL || 'https://backend.l4yercak3.com';
  }

  /**
   * Set backend URL
   */
  setBackendUrl(url) {
    const config = this.getConfig();
    if (!config.settings) {
      config.settings = {};
    }
    config.settings.backendUrl = url;
    return this.saveConfig(config);
  }

  /**
   * Add organization to config
   */
  addOrganization(org) {
    const config = this.getConfig();
    if (!config.organizations) {
      config.organizations = [];
    }

    // Remove if exists
    config.organizations = config.organizations.filter(o => o.id !== org.id);
    
    // Add new
    config.organizations.push(org);
    
    return this.saveConfig(config);
  }

  /**
   * Get organizations
   */
  getOrganizations() {
    const config = this.getConfig();
    return config.organizations || [];
  }

  /**
   * Save project configuration
   * Stores configuration for a specific project (by project path)
   */
  saveProjectConfig(projectPath, projectConfig) {
    const config = this.getConfig();
    if (!config.projects) {
      config.projects = {};
    }
    
    // Normalize project path (use absolute path)
    const normalizedPath = path.resolve(projectPath);
    config.projects[normalizedPath] = {
      ...projectConfig,
      updatedAt: Date.now(),
    };
    
    return this.saveConfig(config);
  }

  /**
   * Get project configuration
   */
  getProjectConfig(projectPath) {
    const config = this.getConfig();
    if (!config.projects) {
      return null;
    }
    
    const normalizedPath = path.resolve(projectPath);
    return config.projects[normalizedPath] || null;
  }

  /**
   * Get all project configurations
   */
  getAllProjectConfigs() {
    const config = this.getConfig();
    return config.projects || {};
  }
}

module.exports = new ConfigManager();

