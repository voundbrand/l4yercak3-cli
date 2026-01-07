/**
 * Applications Domain Tools
 *
 * Tools for registering and managing connected applications.
 * These represent projects that integrate with L4YERCAK3.
 *
 * @module mcp/registry/domains/applications
 */

const crypto = require('crypto');
const backendClient = require('../../../api/backend-client');
const configManager = require('../../../config/config-manager');

/**
 * Applications domain definition
 */
module.exports = {
  name: 'applications',
  description: 'Connected application registration and management',
  tools: [
    // ========================================
    // Application Registration
    // ========================================
    {
      name: 'l4yercak3_register_application',
      description: `Register the current project as a connected application with L4YERCAK3.
This creates a connection between the user's project and their L4YERCAK3 organization.

Use this after the user has decided to integrate their project with L4YERCAK3.
Returns an API key for the application to use.`,
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Application name (defaults to project name)',
          },
          description: {
            type: 'string',
            description: 'Application description',
          },
          projectPath: {
            type: 'string',
            description: 'Project directory path (for tracking)',
          },
          framework: {
            type: 'string',
            enum: ['nextjs', 'remix', 'astro', 'nuxt', 'sveltekit', 'other'],
            description: 'Framework being used',
          },
          frameworkVersion: {
            type: 'string',
            description: 'Framework version (e.g., "14.0.0")',
          },
          features: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['crm', 'events', 'forms', 'invoicing', 'checkout'],
            },
            description: 'Features to enable for this application',
          },
          hasTypeScript: {
            type: 'boolean',
            description: 'Whether the project uses TypeScript',
          },
          routerType: {
            type: 'string',
            enum: ['app', 'pages'],
            description: 'Next.js router type (if applicable)',
          },
        },
        required: ['name', 'features'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_applications'],
      handler: async (params, authContext) => {
        // Generate project path hash for tracking
        const projectPathHash = params.projectPath
          ? crypto.createHash('sha256').update(params.projectPath).digest('hex')
          : null;

        // Check if application already exists
        if (projectPathHash) {
          const existing = await backendClient.checkExistingApplication(
            authContext.organizationId,
            projectPathHash
          );

          if (existing.found) {
            return {
              success: true,
              applicationId: existing.application._id,
              existingApplication: true,
              message: 'Application already registered for this project',
              application: {
                id: existing.application._id,
                name: existing.application.name,
                features: existing.application.customProperties?.connection?.features || [],
              },
            };
          }
        }

        // Register new application
        const response = await backendClient.registerApplication({
          organizationId: authContext.organizationId,
          name: params.name,
          description: params.description,
          source: {
            type: 'cli',
            projectPathHash,
            cliVersion: require('../../../../package.json').version,
            framework: params.framework,
            frameworkVersion: params.frameworkVersion,
            hasTypeScript: params.hasTypeScript,
            routerType: params.routerType,
          },
          connection: {
            features: params.features || [],
            hasFrontendDatabase: false,
          },
        });

        // Save to local config
        if (params.projectPath) {
          configManager.saveProjectConfig(params.projectPath, {
            applicationId: response.applicationId,
            apiKeyId: response.apiKey?.id,
            features: params.features,
          });
        }

        return {
          success: true,
          applicationId: response.applicationId,
          existingApplication: false,
          apiKey: response.apiKey
            ? {
                id: response.apiKey.id,
                key: response.apiKey.key,
                prefix: response.apiKey.prefix,
              }
            : null,
          backendUrl: response.backendUrl,
          message: `Registered application: ${params.name}`,
          nextSteps: [
            response.apiKey
              ? `Add L4YERCAK3_API_KEY=${response.apiKey.key} to your .env.local`
              : 'Generate an API key with l4yercak3 api-keys generate',
            'Generate API client with l4yercak3_generate_api_client',
          ],
        };
      },
    },

    {
      name: 'l4yercak3_get_application',
      description: `Get details about a registered application.`,
      inputSchema: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'Application ID (optional if projectPath provided)',
          },
          projectPath: {
            type: 'string',
            description: 'Project path to look up by',
          },
        },
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        let applicationId = params.applicationId;

        // If projectPath provided, look up by path
        if (!applicationId && params.projectPath) {
          const projectPathHash = crypto
            .createHash('sha256')
            .update(params.projectPath)
            .digest('hex');

          const existing = await backendClient.checkExistingApplication(
            authContext.organizationId,
            projectPathHash
          );

          if (existing.found) {
            applicationId = existing.application._id;
          } else {
            return {
              found: false,
              message: 'No application registered for this project path',
            };
          }
        }

        if (!applicationId) {
          throw new Error('Either applicationId or projectPath is required');
        }

        const response = await backendClient.getApplication(applicationId);
        const app = response.application || response;

        return {
          found: true,
          application: {
            id: app.id,
            name: app.name,
            description: app.description,
            status: app.status,
            framework: app.source?.framework,
            features: app.connection?.features || [],
            modelMappings: app.modelMappings || [],
            sync: app.sync || { lastSyncAt: null },
            registeredAt: app.cli?.registeredAt,
            lastActivityAt: app.cli?.lastActivityAt,
          },
        };
      },
    },

    {
      name: 'l4yercak3_list_applications',
      description: `List all applications registered with the organization.`,
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'paused'],
            description: 'Filter by status',
          },
          limit: {
            type: 'number',
            description: 'Max applications to return',
          },
        },
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        const response = await backendClient.listApplications(authContext.organizationId);

        return {
          applications: (response.applications || []).map(app => ({
            id: app.id,
            name: app.name,
            status: app.status,
            framework: app.framework,
            features: app.features || [],
            registeredAt: app.registeredAt,
            lastActivityAt: app.lastActivityAt,
          })),
          total: response.total || (response.applications || []).length,
        };
      },
    },

    {
      name: 'l4yercak3_update_application',
      description: `Update an application's configuration.`,
      inputSchema: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'Application ID to update',
          },
          name: { type: 'string', description: 'New name' },
          description: { type: 'string', description: 'New description' },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'New features list',
          },
          modelMappings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                localModel: { type: 'string' },
                layerCakeType: { type: 'string' },
                syncDirection: {
                  type: 'string',
                  enum: ['push', 'pull', 'bidirectional', 'none'],
                },
              },
            },
            description: 'Model mappings for sync',
          },
        },
        required: ['applicationId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_applications'],
      handler: async (params, authContext) => {
        const { applicationId, ...updates } = params;

        await backendClient.updateApplication(applicationId, updates);

        return {
          success: true,
          applicationId,
          message: 'Application updated successfully',
        };
      },
    },

    // ========================================
    // Application Sync
    // ========================================
    {
      name: 'l4yercak3_sync_application',
      description: `Sync application data with L4YERCAK3.
Triggers a sync based on configured model mappings.`,
      inputSchema: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'Application ID',
          },
          direction: {
            type: 'string',
            enum: ['push', 'pull', 'bidirectional'],
            description: 'Sync direction (default: bidirectional)',
          },
          models: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific models to sync (optional, syncs all if not specified)',
          },
          dryRun: {
            type: 'boolean',
            description: 'Preview sync without making changes',
          },
        },
        required: ['applicationId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_applications'],
      handler: async (params, authContext) => {
        const response = await backendClient.syncApplication(params.applicationId, {
          direction: params.direction || 'bidirectional',
          models: params.models,
          dryRun: params.dryRun || false,
        });

        return {
          syncId: response.syncId,
          dryRun: params.dryRun || false,
          direction: params.direction || 'bidirectional',
          modelMappings: response.modelMappings || [],
          instructions: response.instructions,
          message: params.dryRun
            ? 'Dry run completed - no changes made'
            : 'Sync configuration returned - execute sync in your application',
        };
      },
    },

    // ========================================
    // Model Mapping Management
    // ========================================
    {
      name: 'l4yercak3_add_model_mapping',
      description: `Add a model mapping to an application.
Model mappings define how local models sync with L4YERCAK3 types.`,
      inputSchema: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'Application ID',
          },
          localModel: {
            type: 'string',
            description: 'Local model name (e.g., "User", "Customer")',
          },
          layerCakeType: {
            type: 'string',
            enum: ['crm_contact', 'crm_organization', 'event', 'form', 'product'],
            description: 'L4YERCAK3 type to map to',
          },
          syncDirection: {
            type: 'string',
            enum: ['push', 'pull', 'bidirectional', 'none'],
            description: 'Sync direction for this mapping',
          },
          fieldMappings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                local: { type: 'string' },
                layerCake: { type: 'string' },
              },
            },
            description: 'Field-level mappings',
          },
        },
        required: ['applicationId', 'localModel', 'layerCakeType'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_applications'],
      handler: async (params, authContext) => {
        // Get current application
        const appResponse = await backendClient.getApplication(params.applicationId);
        const app = appResponse.application || appResponse;
        const currentMappings = app.modelMappings || [];

        // Check if mapping already exists
        const existingIndex = currentMappings.findIndex(
          m => m.localModel === params.localModel
        );

        const newMapping = {
          localModel: params.localModel,
          layerCakeType: params.layerCakeType,
          syncDirection: params.syncDirection || 'bidirectional',
          fieldMappings: params.fieldMappings || [],
          isAutoDetected: false,
        };

        if (existingIndex >= 0) {
          currentMappings[existingIndex] = newMapping;
        } else {
          currentMappings.push(newMapping);
        }

        // Update application
        await backendClient.updateApplication(params.applicationId, {
          modelMappings: currentMappings,
        });

        return {
          success: true,
          mappingAdded: existingIndex < 0,
          mappingUpdated: existingIndex >= 0,
          mapping: newMapping,
          message: existingIndex >= 0
            ? `Updated mapping: ${params.localModel} -> ${params.layerCakeType}`
            : `Added mapping: ${params.localModel} -> ${params.layerCakeType}`,
        };
      },
    },

    {
      name: 'l4yercak3_suggest_model_mappings',
      description: `Analyze project structure and suggest model mappings.
Looks at database schemas, types, and common patterns.`,
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Project directory to analyze',
          },
          schemaPath: {
            type: 'string',
            description: 'Path to schema file (e.g., prisma/schema.prisma)',
          },
        },
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        // This tool provides suggestions based on common patterns
        // In a real implementation, it would analyze actual project files

        return {
          suggestions: [
            {
              localModel: 'User',
              layerCakeType: 'crm_contact',
              confidence: 0.9,
              reason: 'User models typically map to CRM contacts',
              suggestedFieldMappings: [
                { local: 'email', layerCake: 'email' },
                { local: 'firstName', layerCake: 'firstName' },
                { local: 'lastName', layerCake: 'lastName' },
                { local: 'phone', layerCake: 'phone' },
              ],
            },
            {
              localModel: 'Customer',
              layerCakeType: 'crm_contact',
              confidence: 0.95,
              reason: 'Customer models map directly to CRM contacts',
              suggestedFieldMappings: [
                { local: 'email', layerCake: 'email' },
                { local: 'name', layerCake: 'name' },
              ],
            },
            {
              localModel: 'Company',
              layerCakeType: 'crm_organization',
              confidence: 0.9,
              reason: 'Company models map to CRM organizations',
              suggestedFieldMappings: [
                { local: 'name', layerCake: 'name' },
                { local: 'website', layerCake: 'website' },
                { local: 'industry', layerCake: 'industry' },
              ],
            },
          ],
          instructions: [
            'Review each suggestion and its confidence level',
            'Use l4yercak3_add_model_mapping to add mappings you want',
            'Customize field mappings as needed for your schema',
          ],
        };
      },
    },
  ],
};
