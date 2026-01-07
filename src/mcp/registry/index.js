/**
 * MCP Tool Registry
 *
 * Central registry for all MCP tools organized by domain.
 * Handles tool discovery, filtering by auth context, and execution.
 *
 * @module mcp/registry
 */

const { requireAuth, hasPermission } = require('../auth');

// Import tool domains
const coreDomain = require('./domains/core');
const crmDomain = require('./domains/crm');
const eventsDomain = require('./domains/events');
const formsDomain = require('./domains/forms');
const codegenDomain = require('./domains/codegen');
const applicationsDomain = require('./domains/applications');

/**
 * @typedef {Object} ToolDefinition
 * @property {string} name - Tool name (e.g., 'l4yercak3_get_capabilities')
 * @property {string} description - Human-readable description
 * @property {Object} inputSchema - JSON Schema for tool parameters
 * @property {Function} handler - Async function(params, authContext) => result
 * @property {boolean} requiresAuth - Whether auth is required
 * @property {string[]} [requiredPermissions] - Permissions needed to use this tool
 */

/**
 * @typedef {Object} ToolDomain
 * @property {string} name - Domain name (e.g., 'crm')
 * @property {string} description - Domain description
 * @property {ToolDefinition[]} tools - Tools in this domain
 */

/**
 * All registered tool domains
 * @type {ToolDomain[]}
 */
const toolDomains = [
  coreDomain,
  applicationsDomain,
  crmDomain,
  eventsDomain,
  formsDomain,
  codegenDomain,
];

/**
 * Get all available tools for the current auth context
 *
 * @param {Object|null} authContext - Current auth context
 * @returns {ToolDefinition[]} Available tools
 */
function getAvailableTools(authContext) {
  const tools = [];

  for (const domain of toolDomains) {
    for (const tool of domain.tools) {
      // Include if no auth required
      if (!tool.requiresAuth) {
        tools.push(tool);
        continue;
      }

      // Skip if auth required but not authenticated
      if (!authContext) {
        continue;
      }

      // Check required permissions
      if (tool.requiredPermissions && tool.requiredPermissions.length > 0) {
        const hasAllPermissions = tool.requiredPermissions.every(perm =>
          hasPermission(authContext, perm)
        );
        if (!hasAllPermissions) {
          continue;
        }
      }

      tools.push(tool);
    }
  }

  return tools;
}

/**
 * Find a tool by name
 *
 * @param {string} name - Tool name
 * @returns {ToolDefinition|null}
 */
function findTool(name) {
  for (const domain of toolDomains) {
    const tool = domain.tools.find(t => t.name === name);
    if (tool) {
      return tool;
    }
  }
  return null;
}

/**
 * Execute a tool
 *
 * @param {string} name - Tool name
 * @param {Object} params - Tool parameters
 * @param {Object|null} authContext - Current auth context
 * @returns {Promise<any>} Tool result
 */
async function executeTool(name, params, authContext) {
  const tool = findTool(name);

  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  // Check auth requirements
  if (tool.requiresAuth) {
    requireAuth(authContext);

    // Check permissions
    if (tool.requiredPermissions && tool.requiredPermissions.length > 0) {
      for (const perm of tool.requiredPermissions) {
        if (!hasPermission(authContext, perm)) {
          throw new Error(
            `Permission denied: ${perm} required for tool ${name}`
          );
        }
      }
    }
  }

  // Execute the tool
  try {
    return await tool.handler(params, authContext);
  } catch (error) {
    // Re-throw with context
    const enhancedError = new Error(`Tool ${name} failed: ${error.message}`);
    enhancedError.toolName = name;
    enhancedError.originalError = error;
    throw enhancedError;
  }
}

/**
 * Get all domains (for documentation/discovery)
 *
 * @returns {ToolDomain[]}
 */
function getDomains() {
  return toolDomains;
}

module.exports = {
  getAvailableTools,
  findTool,
  executeTool,
  getDomains,
};
