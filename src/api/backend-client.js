/**
 * Backend API Client
 * Handles communication with L4YERCAK3 backend API
 */

const fetch = require('node-fetch');
const configManager = require('../config/config-manager');

class BackendClient {
  constructor() {
    this.baseUrl = configManager.getBackendUrl();
  }

  /**
   * Get headers for API requests
   */
  getHeaders() {
    const session = configManager.getSession();
    const headers = {
      'Content-Type': 'application/json',
    };

    if (session && session.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }

    return headers;
  }

  /**
   * Make API request
   */
  async request(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders(),
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `API request failed: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error(`Network error: Could not connect to backend at ${this.baseUrl}`);
      }
      throw error;
    }
  }

  /**
   * Validate CLI session
   */
  async validateSession() {
    try {
      return await this.request('GET', '/api/v1/auth/cli/validate');
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh CLI session
   */
  async refreshSession() {
    try {
      const session = configManager.getSession();
      if (!session || !session.token) {
        throw new Error('No session to refresh');
      }

      const response = await this.request('POST', '/api/v1/auth/cli/refresh', {
        token: session.token,
      });

      // Update session
      configManager.saveSession({
        ...session,
        token: response.token,
        expiresAt: response.expiresAt,
      });

      return response;
    } catch (error) {
      configManager.clearSession();
      throw error;
    }
  }

  /**
   * Get CLI login URL (uses unified OAuth signup endpoint)
   */
  getLoginUrl(provider = null) {
    const backendUrl = configManager.getBackendUrl();
    const callbackUrl = 'http://localhost:3001/callback';
    
    if (provider) {
      // Direct OAuth provider URL
      return `${backendUrl}/api/auth/oauth-signup?provider=${provider}&sessionType=cli&callback=${encodeURIComponent(callbackUrl)}`;
    } else {
      // Provider selection page (still uses old endpoint for now, but could be updated)
      return `${backendUrl}/auth/cli-login?callback=${encodeURIComponent(callbackUrl)}`;
    }
  }

  /**
   * Generate API key for organization
   * Note: This calls Convex action directly, requires session
   */
  async generateApiKey(organizationId, name, scopes = ['*']) {
    // This will need to call Convex action via backend API wrapper
    // For now, placeholder
    return await this.request('POST', `/api/v1/api-keys/generate`, {
      organizationId,
      name,
      scopes,
    });
  }

  /**
   * Get organizations for current user
   */
  async getOrganizations() {
    return await this.request('GET', '/api/v1/organizations');
  }

  /**
   * Create organization
   */
  async createOrganization(name) {
    return await this.request('POST', '/api/v1/organizations', {
      name,
    });
  }
}

module.exports = new BackendClient();

