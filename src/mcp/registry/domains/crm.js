/**
 * CRM Domain Tools
 *
 * Customer Relationship Management tools for contacts, organizations,
 * pipelines, notes, and activities.
 *
 * @module mcp/registry/domains/crm
 */

const backendClient = require('../../../api/backend-client');

/**
 * CRM domain definition
 */
module.exports = {
  name: 'crm',
  description: 'Customer Relationship Management - contacts, organizations, pipelines',
  tools: [
    // ========================================
    // Contact Tools
    // ========================================
    {
      name: 'l4yercak3_crm_list_contacts',
      description: `List contacts from the CRM with optional filtering.
Use this to retrieve contacts for the user's organization.

Returns contacts with their details including name, email, phone, and custom fields.`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Max contacts to return (default 50, max 100)',
          },
          subtype: {
            type: 'string',
            enum: ['customer', 'lead', 'prospect', 'partner'],
            description: 'Filter by contact type',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'unsubscribed', 'archived'],
            description: 'Filter by status',
          },
          search: {
            type: 'string',
            description: 'Search by name or email',
          },
        },
      },
      requiresAuth: true,
      requiredPermissions: ['view_crm'],
      handler: async (params, authContext) => {
        // Build query params
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.set('limit', Math.min(params.limit, 100));
        if (params.subtype) queryParams.set('subtype', params.subtype);
        if (params.status) queryParams.set('status', params.status);
        if (params.search) queryParams.set('search', params.search);

        const response = await backendClient.request(
          'GET',
          `/api/v1/crm/contacts?organizationId=${authContext.organizationId}&${queryParams.toString()}`
        );

        return {
          contacts: (response.contacts || []).map(contact => ({
            id: contact._id,
            name: contact.name,
            email: contact.customProperties?.email,
            phone: contact.customProperties?.phone,
            company: contact.customProperties?.company,
            jobTitle: contact.customProperties?.jobTitle,
            subtype: contact.subtype,
            status: contact.status,
            tags: contact.customProperties?.tags || [],
            createdAt: contact.createdAt,
          })),
          total: response.total || (response.contacts || []).length,
        };
      },
    },

    {
      name: 'l4yercak3_crm_create_contact',
      description: `Create a new contact in the CRM.
Use this to add a customer, lead, or prospect to the user's CRM.`,
      inputSchema: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
            description: 'Contact first name',
          },
          lastName: {
            type: 'string',
            description: 'Contact last name',
          },
          email: {
            type: 'string',
            description: 'Email address',
          },
          phone: {
            type: 'string',
            description: 'Phone number',
          },
          company: {
            type: 'string',
            description: 'Company name',
          },
          jobTitle: {
            type: 'string',
            description: 'Job title',
          },
          subtype: {
            type: 'string',
            enum: ['customer', 'lead', 'prospect', 'partner'],
            description: 'Contact type (default: lead)',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags to apply to the contact',
          },
          notes: {
            type: 'string',
            description: 'Initial notes about the contact',
          },
        },
        required: ['firstName', 'lastName', 'email'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_crm'],
      handler: async (params, authContext) => {
        const response = await backendClient.request('POST', '/api/v1/crm/contacts', {
          organizationId: authContext.organizationId,
          firstName: params.firstName,
          lastName: params.lastName,
          email: params.email,
          phone: params.phone,
          company: params.company,
          jobTitle: params.jobTitle,
          subtype: params.subtype || 'lead',
          tags: params.tags || [],
          notes: params.notes,
          source: 'mcp', // Track that this came from MCP
        });

        return {
          success: true,
          contactId: response.contactId || response.id,
          message: `Created contact: ${params.firstName} ${params.lastName}`,
        };
      },
    },

    {
      name: 'l4yercak3_crm_get_contact',
      description: `Get detailed information about a specific contact.
Use this to retrieve full details including activities and notes.`,
      inputSchema: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'The contact ID to retrieve',
          },
          includeActivities: {
            type: 'boolean',
            description: 'Include recent activities (default: false)',
          },
          includeNotes: {
            type: 'boolean',
            description: 'Include notes (default: false)',
          },
        },
        required: ['contactId'],
      },
      requiresAuth: true,
      requiredPermissions: ['view_crm'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        if (params.includeActivities) queryParams.set('includeActivities', 'true');
        if (params.includeNotes) queryParams.set('includeNotes', 'true');

        const response = await backendClient.request(
          'GET',
          `/api/v1/crm/contacts/${params.contactId}?${queryParams.toString()}`
        );

        const contact = response.contact || response;

        return {
          id: contact._id,
          name: contact.name,
          firstName: contact.customProperties?.firstName,
          lastName: contact.customProperties?.lastName,
          email: contact.customProperties?.email,
          phone: contact.customProperties?.phone,
          company: contact.customProperties?.company,
          jobTitle: contact.customProperties?.jobTitle,
          subtype: contact.subtype,
          status: contact.status,
          address: contact.customProperties?.address,
          tags: contact.customProperties?.tags || [],
          notes: contact.customProperties?.notes,
          source: contact.customProperties?.source,
          activities: response.activities || [],
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        };
      },
    },

    {
      name: 'l4yercak3_crm_update_contact',
      description: `Update an existing contact.
Use this to modify contact information.`,
      inputSchema: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'The contact ID to update',
          },
          firstName: { type: 'string', description: 'New first name' },
          lastName: { type: 'string', description: 'New last name' },
          email: { type: 'string', description: 'New email' },
          phone: { type: 'string', description: 'New phone' },
          company: { type: 'string', description: 'New company' },
          jobTitle: { type: 'string', description: 'New job title' },
          subtype: {
            type: 'string',
            enum: ['customer', 'lead', 'prospect', 'partner'],
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'unsubscribed'],
          },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['contactId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_crm'],
      handler: async (params, authContext) => {
        const { contactId, ...updates } = params;

        await backendClient.request('PATCH', `/api/v1/crm/contacts/${contactId}`, {
          updates,
        });

        return {
          success: true,
          contactId,
          message: 'Contact updated successfully',
        };
      },
    },

    {
      name: 'l4yercak3_crm_delete_contact',
      description: `Delete a contact from the CRM.
This performs a soft delete - the contact can be restored.`,
      inputSchema: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'The contact ID to delete',
          },
        },
        required: ['contactId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_crm'],
      handler: async (params, authContext) => {
        await backendClient.request('DELETE', `/api/v1/crm/contacts/${params.contactId}`);

        return {
          success: true,
          message: 'Contact deleted successfully',
        };
      },
    },

    // ========================================
    // Organization Tools (CRM Organizations, not platform orgs)
    // ========================================
    {
      name: 'l4yercak3_crm_list_organizations',
      description: `List CRM organizations (companies/businesses tracked in CRM).
These are customer companies, not L4YERCAK3 platform organizations.`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Max organizations to return (default 50)',
          },
          subtype: {
            type: 'string',
            enum: ['customer', 'prospect', 'partner', 'sponsor'],
            description: 'Filter by organization type',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'archived'],
            description: 'Filter by status',
          },
        },
      },
      requiresAuth: true,
      requiredPermissions: ['view_crm'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        queryParams.set('organizationId', authContext.organizationId);
        if (params.limit) queryParams.set('limit', Math.min(params.limit, 100));
        if (params.subtype) queryParams.set('subtype', params.subtype);
        if (params.status) queryParams.set('status', params.status);

        const response = await backendClient.request(
          'GET',
          `/api/v1/crm/organizations?${queryParams.toString()}`
        );

        return {
          organizations: (response.organizations || []).map(org => ({
            id: org._id,
            name: org.name,
            website: org.customProperties?.website,
            industry: org.customProperties?.industry,
            size: org.customProperties?.size,
            subtype: org.subtype,
            status: org.status,
            contactCount: org.contactCount || 0,
          })),
          total: response.total || (response.organizations || []).length,
        };
      },
    },

    {
      name: 'l4yercak3_crm_create_organization',
      description: `Create a new CRM organization (company/business).
Use this to track a customer company in the CRM.`,
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Organization name',
          },
          website: {
            type: 'string',
            description: 'Website URL',
          },
          industry: {
            type: 'string',
            description: 'Industry (e.g., Technology, Healthcare)',
          },
          size: {
            type: 'string',
            enum: ['1-10', '11-50', '51-200', '201-500', '501+'],
            description: 'Company size',
          },
          subtype: {
            type: 'string',
            enum: ['customer', 'prospect', 'partner', 'sponsor'],
            description: 'Organization type (default: prospect)',
          },
          phone: { type: 'string', description: 'Main phone number' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string' },
            },
            description: 'Address',
          },
          taxId: { type: 'string', description: 'Tax ID / VAT number' },
        },
        required: ['name'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_crm'],
      handler: async (params, authContext) => {
        const response = await backendClient.request('POST', '/api/v1/crm/organizations', {
          organizationId: authContext.organizationId,
          name: params.name,
          website: params.website,
          industry: params.industry,
          size: params.size,
          subtype: params.subtype || 'prospect',
          phone: params.phone,
          address: params.address,
          taxId: params.taxId,
        });

        return {
          success: true,
          crmOrganizationId: response.crmOrganizationId || response.id,
          message: `Created CRM organization: ${params.name}`,
        };
      },
    },

    {
      name: 'l4yercak3_crm_get_organization',
      description: `Get detailed information about a CRM organization.`,
      inputSchema: {
        type: 'object',
        properties: {
          crmOrganizationId: {
            type: 'string',
            description: 'The CRM organization ID',
          },
          includeContacts: {
            type: 'boolean',
            description: 'Include linked contacts (default: false)',
          },
        },
        required: ['crmOrganizationId'],
      },
      requiresAuth: true,
      requiredPermissions: ['view_crm'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        if (params.includeContacts) queryParams.set('includeContacts', 'true');

        const response = await backendClient.request(
          'GET',
          `/api/v1/crm/organizations/${params.crmOrganizationId}?${queryParams.toString()}`
        );

        const org = response.organization || response;

        return {
          id: org._id,
          name: org.name,
          website: org.customProperties?.website,
          industry: org.customProperties?.industry,
          size: org.customProperties?.size,
          subtype: org.subtype,
          status: org.status,
          phone: org.customProperties?.phone,
          address: org.customProperties?.address,
          taxId: org.customProperties?.taxId,
          billingEmail: org.customProperties?.billingEmail,
          contacts: response.contacts || [],
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        };
      },
    },

    {
      name: 'l4yercak3_crm_link_contact_to_organization',
      description: `Link a contact to a CRM organization.
Use this to associate a contact with a company they work for.`,
      inputSchema: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'The contact ID',
          },
          crmOrganizationId: {
            type: 'string',
            description: 'The CRM organization ID',
          },
          jobTitle: {
            type: 'string',
            description: 'Job title at this organization',
          },
          isPrimaryContact: {
            type: 'boolean',
            description: 'Whether this is the primary contact for the org',
          },
          department: {
            type: 'string',
            description: 'Department within the organization',
          },
        },
        required: ['contactId', 'crmOrganizationId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_crm'],
      handler: async (params, authContext) => {
        await backendClient.request('POST', '/api/v1/crm/contact-organization-links', {
          contactId: params.contactId,
          crmOrganizationId: params.crmOrganizationId,
          jobTitle: params.jobTitle,
          isPrimaryContact: params.isPrimaryContact || false,
          department: params.department,
        });

        return {
          success: true,
          message: 'Contact linked to organization successfully',
        };
      },
    },

    // ========================================
    // Activity Tools
    // ========================================
    {
      name: 'l4yercak3_crm_add_note',
      description: `Add a note to a contact.
Use this to record information or interactions with a contact.`,
      inputSchema: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'The contact ID',
          },
          content: {
            type: 'string',
            description: 'Note content (supports markdown)',
          },
        },
        required: ['contactId', 'content'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_crm'],
      handler: async (params, authContext) => {
        await backendClient.request('POST', `/api/v1/crm/contacts/${params.contactId}/notes`, {
          content: params.content,
        });

        return {
          success: true,
          message: 'Note added to contact',
        };
      },
    },

    {
      name: 'l4yercak3_crm_log_activity',
      description: `Log an activity for a contact (call, email, meeting, etc.).
Use this to track interactions with contacts.`,
      inputSchema: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'The contact ID',
          },
          type: {
            type: 'string',
            enum: ['call', 'email', 'meeting', 'note', 'task', 'other'],
            description: 'Activity type',
          },
          summary: {
            type: 'string',
            description: 'Brief summary of the activity',
          },
          details: {
            type: 'string',
            description: 'Detailed description',
          },
          scheduledAt: {
            type: 'string',
            description: 'ISO datetime for scheduled activities',
          },
        },
        required: ['contactId', 'type', 'summary'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_crm'],
      handler: async (params, authContext) => {
        await backendClient.request('POST', `/api/v1/crm/contacts/${params.contactId}/activities`, {
          type: params.type,
          summary: params.summary,
          details: params.details,
          scheduledAt: params.scheduledAt,
        });

        return {
          success: true,
          message: `${params.type} activity logged for contact`,
        };
      },
    },
  ],
};
