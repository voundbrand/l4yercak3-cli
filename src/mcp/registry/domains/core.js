/**
 * Core Domain Tools
 *
 * Discovery, authentication, and organization management tools.
 * These are the foundational tools that help Claude Code understand
 * what L4YERCAK3 can do and get the user set up.
 *
 * @module mcp/registry/domains/core
 */

const backendClient = require('../../../api/backend-client');
const configManager = require('../../../config/config-manager');

/**
 * Core domain definition
 */
module.exports = {
  name: 'core',
  description: 'Discovery, authentication, and organization management',
  tools: [
    // ========================================
    // Discovery Tools (No Auth Required)
    // ========================================
    {
      name: 'l4yercak3_get_capabilities',
      description: `Get a list of all L4YERCAK3 capabilities and features.
Use this first to understand what L4YERCAK3 can do and help the user choose features to integrate.

Returns capabilities organized by category:
- CRM: Contact management, organizations, pipelines
- Invoicing: Invoice creation, payment tracking
- Events: Event management, ticketing, attendees
- Forms: Form builder, registration forms
- Checkout: Payment processing, Stripe integration
- Workflows: Automation and triggers`,
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['all', 'crm', 'invoicing', 'events', 'forms', 'checkout', 'workflows'],
            description: 'Filter capabilities by category (default: all)',
          },
        },
      },
      requiresAuth: false,
      handler: async (params) => {
        const allCapabilities = [
          {
            name: 'CRM',
            category: 'crm',
            description: 'Customer Relationship Management - contacts, organizations, pipelines',
            features: [
              'contacts - Store and manage customer contacts',
              'organizations - Track companies and organizations',
              'pipelines - Sales pipelines with stages',
              'notes - Activity notes and interactions',
              'activities - Call, email, meeting tracking',
            ],
            tools: [
              'l4yercak3_crm_list_contacts',
              'l4yercak3_crm_create_contact',
              'l4yercak3_crm_get_contact',
              'l4yercak3_crm_update_contact',
              'l4yercak3_crm_list_organizations',
              'l4yercak3_crm_create_organization',
            ],
          },
          {
            name: 'Events',
            category: 'events',
            description: 'Event management with tickets and attendees',
            features: [
              'events - Create and manage events (conferences, workshops, meetups)',
              'tickets - Ticket products with pricing',
              'attendees - Track event registrations',
              'sponsors - Link organizations as event sponsors',
              'agenda - Event schedules and sessions',
            ],
            tools: [
              'l4yercak3_events_list',
              'l4yercak3_events_create',
              'l4yercak3_events_get',
              'l4yercak3_events_update',
              'l4yercak3_events_get_attendees',
            ],
          },
          {
            name: 'Forms',
            category: 'forms',
            description: 'Form builder for registration and data collection',
            features: [
              'forms - Create custom forms (registration, surveys, applications)',
              'fields - Text, email, select, checkbox, file upload fields',
              'responses - Collect and manage form submissions',
              'conditional - Conditional field logic',
              'analytics - Submission tracking and completion rates',
            ],
            tools: [
              'l4yercak3_forms_list',
              'l4yercak3_forms_create',
              'l4yercak3_forms_get',
              'l4yercak3_forms_get_responses',
            ],
          },
          {
            name: 'Invoicing',
            category: 'invoicing',
            description: 'Invoice generation and payment tracking',
            features: [
              'invoices - Create and send invoices',
              'line_items - Multiple items per invoice',
              'payments - Track payment status',
              'pdf - Generate PDF invoices',
              'email - Send invoices via email',
            ],
            tools: ['Coming soon - use l4yercak3_get_capabilities to check for updates'],
          },
          {
            name: 'Checkout',
            category: 'checkout',
            description: 'Payment processing with Stripe integration',
            features: [
              'checkout_sessions - Create payment checkout flows',
              'products - Define purchasable products',
              'stripe - Stripe payment integration',
              'webhooks - Payment event webhooks',
            ],
            tools: ['Coming soon - use l4yercak3_get_capabilities to check for updates'],
          },
          {
            name: 'Workflows',
            category: 'workflows',
            description: 'Automation and business process triggers',
            features: [
              'triggers - Event-based automation triggers',
              'actions - Send emails, create records, webhooks',
              'conditions - Conditional workflow logic',
            ],
            tools: ['Coming soon - use l4yercak3_get_capabilities to check for updates'],
          },
        ];

        // Filter by category if specified
        const category = params.category || 'all';
        const capabilities =
          category === 'all'
            ? allCapabilities
            : allCapabilities.filter(c => c.category === category);

        return {
          capabilities,
          documentation: 'https://docs.l4yercak3.com',
          support: 'support@l4yercak3.com',
        };
      },
    },

    {
      name: 'l4yercak3_check_auth_status',
      description: `Check if the user is authenticated with L4YERCAK3.
Use this to determine if the user needs to login before using other tools.

If not authenticated, suggest running "l4yercak3 login" in the terminal.`,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      requiresAuth: false,
      handler: async (params, authContext) => {
        if (!authContext) {
          return {
            authenticated: false,
            message: 'Not authenticated with L4YERCAK3.',
            action: 'Run "l4yercak3 login" in the terminal to authenticate.',
          };
        }

        return {
          authenticated: true,
          userId: authContext.userId,
          email: authContext.email,
          organizationId: authContext.organizationId,
          organizationName: authContext.organizationName,
        };
      },
    },

    {
      name: 'l4yercak3_get_login_instructions',
      description: `Get instructions for how to authenticate with L4YERCAK3.
Use this when the user needs to login but hasn't yet.`,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      requiresAuth: false,
      handler: async () => {
        return {
          instructions: [
            '1. Open a terminal in this project directory',
            '2. Run: l4yercak3 login',
            '3. This will open a browser window for authentication',
            '4. After logging in, you can use L4YERCAK3 tools',
          ],
          alternativeInstructions: [
            'If you don\'t have the CLI installed:',
            '1. Run: npm install -g @l4yercak3/cli',
            '2. Then run: l4yercak3 login',
          ],
          documentation: 'https://docs.l4yercak3.com/cli/authentication',
        };
      },
    },

    // ========================================
    // Organization Tools (Auth Required)
    // ========================================
    {
      name: 'l4yercak3_list_organizations',
      description: `List all organizations the authenticated user has access to.
Use this to help users choose which organization to work with.`,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        const response = await backendClient.getOrganizations();

        return {
          organizations: response.organizations || [],
          currentOrganizationId: authContext.organizationId,
          currentOrganizationName: authContext.organizationName,
        };
      },
    },

    {
      name: 'l4yercak3_switch_organization',
      description: `Switch the current organization context.
Use this when the user wants to work with a different organization.`,
      inputSchema: {
        type: 'object',
        properties: {
          organizationId: {
            type: 'string',
            description: 'The organization ID to switch to',
          },
        },
        required: ['organizationId'],
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        // Get current session
        const session = configManager.getSession();
        if (!session) {
          throw new Error('No active session');
        }

        // Verify user has access to target org
        const response = await backendClient.getOrganizations();
        const targetOrg = (response.organizations || []).find(
          org => org.id === params.organizationId
        );

        if (!targetOrg) {
          throw new Error(
            `Organization ${params.organizationId} not found or you don't have access`
          );
        }

        // Update session with new organization
        configManager.saveSession({
          ...session,
          organizationId: targetOrg.id,
          organizationName: targetOrg.name,
        });

        return {
          success: true,
          organizationId: targetOrg.id,
          organizationName: targetOrg.name,
          message: `Switched to organization: ${targetOrg.name}`,
        };
      },
    },

    {
      name: 'l4yercak3_create_organization',
      description: `Create a new organization.
Use this when the user wants to set up a new organization for their project.`,
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the new organization',
          },
        },
        required: ['name'],
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        const response = await backendClient.createOrganization(params.name);

        // Optionally switch to new org
        const session = configManager.getSession();
        if (session) {
          configManager.saveSession({
            ...session,
            organizationId: response.id,
            organizationName: response.name,
          });
        }

        return {
          success: true,
          organizationId: response.id,
          organizationName: response.name,
          message: `Created and switched to organization: ${response.name}`,
        };
      },
    },
  ],
};
