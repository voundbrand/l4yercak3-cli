/**
 * MCP Server Authentication Layer
 *
 * Reads CLI session from ~/.l4yercak3/config.json and validates with backend.
 * Provides auth context for tool execution.
 *
 * @module mcp/auth
 */

const configManager = require('../config/config-manager');
const backendClient = require('../api/backend-client');

/**
 * @typedef {Object} AuthContext
 * @property {string} userId - The authenticated user's ID
 * @property {string} organizationId - Current organization ID
 * @property {string} organizationName - Current organization name
 * @property {string} sessionToken - The CLI session token
 * @property {string[]} permissions - User's permissions in the organization
 */

/**
 * Get authentication context from CLI session
 * Returns null if not authenticated or session expired
 *
 * @returns {Promise<AuthContext|null>}
 */
async function getAuthContext() {
  // Check if session exists locally
  if (!configManager.isLoggedIn()) {
    return null;
  }

  const session = configManager.getSession();
  if (!session || !session.token) {
    return null;
  }

  // Check if session is expired locally
  if (session.expiresAt && session.expiresAt < Date.now()) {
    return null;
  }

  try {
    // Validate session with backend
    const validation = await backendClient.validateSession();

    if (!validation || !validation.valid) {
      return null;
    }

    // Build auth context
    return {
      userId: validation.userId || session.userId,
      organizationId: validation.organizationId || session.organizationId,
      organizationName: validation.organizationName || session.organizationName || 'Unknown',
      sessionToken: session.token,
      email: validation.email || session.email,
      permissions: validation.permissions || [],
    };
  } catch (error) {
    // Log error to stderr (stdout is for MCP protocol)
    console.error('[L4YERCAK3 MCP] Auth validation error:', error.message);
    return null;
  }
}

/**
 * Require authentication for a tool
 * Throws if not authenticated
 *
 * @param {AuthContext|null} authContext
 * @returns {AuthContext}
 * @throws {Error} If not authenticated
 */
function requireAuth(authContext) {
  if (!authContext) {
    throw new Error(
      'Not authenticated with L4YERCAK3. Please run "l4yercak3 login" first.'
    );
  }
  return authContext;
}

/**
 * Check if user has a specific permission
 *
 * @param {AuthContext} authContext
 * @param {string} permission
 * @returns {boolean}
 */
function hasPermission(authContext, permission) {
  if (!authContext || !authContext.permissions) {
    return false;
  }

  // Check for wildcard permission
  if (authContext.permissions.includes('*')) {
    return true;
  }

  return authContext.permissions.includes(permission);
}

/**
 * Require a specific permission
 *
 * @param {AuthContext} authContext
 * @param {string} permission
 * @throws {Error} If permission not granted
 */
function requirePermission(authContext, permission) {
  requireAuth(authContext);

  if (!hasPermission(authContext, permission)) {
    throw new Error(
      `Permission denied: ${permission} required. Contact your organization admin.`
    );
  }
}

module.exports = {
  getAuthContext,
  requireAuth,
  hasPermission,
  requirePermission,
};
