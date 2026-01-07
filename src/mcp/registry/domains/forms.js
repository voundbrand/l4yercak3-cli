/**
 * Forms Domain Tools
 *
 * Form builder tools for creating forms, managing fields,
 * and retrieving form responses.
 *
 * @module mcp/registry/domains/forms
 */

const backendClient = require('../../../api/backend-client');

/**
 * Forms domain definition
 */
module.exports = {
  name: 'forms',
  description: 'Form builder - registration forms, surveys, applications',
  tools: [
    // ========================================
    // Form CRUD Tools
    // ========================================
    {
      name: 'l4yercak3_forms_list',
      description: `List all forms for the organization.
Returns forms with their type, status, and submission counts.`,
      inputSchema: {
        type: 'object',
        properties: {
          subtype: {
            type: 'string',
            enum: ['registration', 'survey', 'application'],
            description: 'Filter by form type',
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'archived'],
            description: 'Filter by form status',
          },
          eventId: {
            type: 'string',
            description: 'Filter forms linked to a specific event',
          },
        },
      },
      requiresAuth: true,
      requiredPermissions: ['view_forms'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        queryParams.set('organizationId', authContext.organizationId);
        if (params.subtype) queryParams.set('subtype', params.subtype);
        if (params.status) queryParams.set('status', params.status);
        if (params.eventId) queryParams.set('eventId', params.eventId);

        const response = await backendClient.request(
          'GET',
          `/api/v1/forms?${queryParams.toString()}`
        );

        return {
          forms: (response.forms || []).map(form => ({
            id: form._id,
            name: form.name,
            description: form.description,
            subtype: form.subtype,
            status: form.status,
            eventId: form.customProperties?.eventId,
            fieldCount: form.customProperties?.formSchema?.fields?.length || 0,
            submissionCount: form.customProperties?.stats?.submissions || 0,
            publicUrl: form.customProperties?.publicUrl,
            createdAt: form.createdAt,
          })),
          total: response.total || (response.forms || []).length,
        };
      },
    },

    {
      name: 'l4yercak3_forms_create',
      description: `Create a new form.
Forms can be registration forms, surveys, or applications.
Start with basic info, then add fields.`,
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Form name',
          },
          description: {
            type: 'string',
            description: 'Form description',
          },
          subtype: {
            type: 'string',
            enum: ['registration', 'survey', 'application'],
            description: 'Form type (default: registration)',
          },
          eventId: {
            type: 'string',
            description: 'Link form to an event (optional)',
          },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique field ID (auto-generated if not provided)',
                },
                type: {
                  type: 'string',
                  enum: [
                    'text',
                    'textarea',
                    'email',
                    'phone',
                    'number',
                    'date',
                    'time',
                    'datetime',
                    'select',
                    'radio',
                    'checkbox',
                    'multi_select',
                    'file',
                    'rating',
                    'section_header',
                  ],
                  description: 'Field type',
                },
                label: {
                  type: 'string',
                  description: 'Field label',
                },
                placeholder: {
                  type: 'string',
                  description: 'Placeholder text',
                },
                required: {
                  type: 'boolean',
                  description: 'Is field required?',
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      value: { type: 'string' },
                      label: { type: 'string' },
                    },
                  },
                  description: 'Options for select/radio/checkbox fields',
                },
                validation: {
                  type: 'object',
                  properties: {
                    min: { type: 'number' },
                    max: { type: 'number' },
                    pattern: { type: 'string' },
                    message: { type: 'string' },
                  },
                  description: 'Validation rules',
                },
              },
              required: ['type', 'label'],
            },
            description: 'Form fields',
          },
          settings: {
            type: 'object',
            properties: {
              allowMultipleSubmissions: {
                type: 'boolean',
                description: 'Allow same person to submit multiple times',
              },
              showProgressBar: {
                type: 'boolean',
                description: 'Show progress bar for multi-step forms',
              },
              submitButtonText: {
                type: 'string',
                description: 'Custom submit button text',
              },
              successMessage: {
                type: 'string',
                description: 'Message shown after submission',
              },
              redirectUrl: {
                type: 'string',
                description: 'URL to redirect to after submission',
              },
            },
            description: 'Form settings',
          },
        },
        required: ['name'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_forms'],
      handler: async (params, authContext) => {
        // Build form schema
        const formSchema = {
          version: '1.0',
          fields: (params.fields || []).map((field, index) => ({
            id: field.id || `field_${index + 1}`,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required || false,
            options: field.options,
            validation: field.validation,
            order: index,
          })),
          settings: {
            allowMultipleSubmissions: params.settings?.allowMultipleSubmissions || false,
            showProgressBar: params.settings?.showProgressBar || true,
            submitButtonText: params.settings?.submitButtonText || 'Submit',
            successMessage: params.settings?.successMessage || 'Thank you for your submission!',
            redirectUrl: params.settings?.redirectUrl || null,
            displayMode: 'all',
          },
          sections: [],
        };

        const response = await backendClient.request('POST', '/api/v1/forms', {
          organizationId: authContext.organizationId,
          name: params.name,
          description: params.description,
          subtype: params.subtype || 'registration',
          eventId: params.eventId,
          formSchema,
        });

        return {
          success: true,
          formId: response.formId || response.id,
          status: 'draft',
          message: `Created form: ${params.name}`,
          nextSteps: [
            'Add more fields with l4yercak3_forms_add_field if needed',
            'Publish the form with l4yercak3_forms_publish',
          ],
        };
      },
    },

    {
      name: 'l4yercak3_forms_get',
      description: `Get detailed information about a form including all fields.`,
      inputSchema: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The form ID',
          },
        },
        required: ['formId'],
      },
      requiresAuth: true,
      requiredPermissions: ['view_forms'],
      handler: async (params, authContext) => {
        const response = await backendClient.request('GET', `/api/v1/forms/${params.formId}`);

        const form = response.form || response;
        const schema = form.customProperties?.formSchema || {};

        return {
          id: form._id,
          name: form.name,
          description: form.description,
          subtype: form.subtype,
          status: form.status,
          eventId: form.customProperties?.eventId,
          publicUrl: form.customProperties?.publicUrl,
          fields: schema.fields || [],
          settings: schema.settings || {},
          stats: form.customProperties?.stats || {
            views: 0,
            submissions: 0,
            completionRate: 0,
          },
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        };
      },
    },

    {
      name: 'l4yercak3_forms_update',
      description: `Update form name, description, or settings.
To update fields, use l4yercak3_forms_add_field or l4yercak3_forms_update_fields.`,
      inputSchema: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The form ID to update',
          },
          name: { type: 'string', description: 'New form name' },
          description: { type: 'string', description: 'New description' },
          subtype: {
            type: 'string',
            enum: ['registration', 'survey', 'application'],
          },
          settings: {
            type: 'object',
            description: 'Form settings to update',
          },
        },
        required: ['formId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_forms'],
      handler: async (params, authContext) => {
        const { formId, ...updates } = params;

        await backendClient.request('PATCH', `/api/v1/forms/${formId}`, updates);

        return {
          success: true,
          formId,
          message: 'Form updated successfully',
        };
      },
    },

    {
      name: 'l4yercak3_forms_add_field',
      description: `Add a new field to a form.`,
      inputSchema: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The form ID',
          },
          field: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'text',
                  'textarea',
                  'email',
                  'phone',
                  'number',
                  'date',
                  'time',
                  'datetime',
                  'select',
                  'radio',
                  'checkbox',
                  'multi_select',
                  'file',
                  'rating',
                  'section_header',
                ],
                description: 'Field type',
              },
              label: {
                type: 'string',
                description: 'Field label',
              },
              placeholder: {
                type: 'string',
                description: 'Placeholder text',
              },
              required: {
                type: 'boolean',
                description: 'Is field required?',
              },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                    label: { type: 'string' },
                  },
                },
                description: 'Options for select/radio/checkbox fields',
              },
            },
            required: ['type', 'label'],
            description: 'Field to add',
          },
          insertAfter: {
            type: 'string',
            description: 'Field ID to insert after (optional, adds to end if not specified)',
          },
        },
        required: ['formId', 'field'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_forms'],
      handler: async (params, authContext) => {
        // Get current form to add field
        const formResponse = await backendClient.request('GET', `/api/v1/forms/${params.formId}`);
        const form = formResponse.form || formResponse;
        const schema = form.customProperties?.formSchema || { fields: [] };

        // Generate field ID
        const newField = {
          id: `field_${Date.now()}`,
          ...params.field,
          order: schema.fields.length,
        };

        // Add field
        schema.fields.push(newField);

        // Update form
        await backendClient.request('PATCH', `/api/v1/forms/${params.formId}`, {
          formSchema: schema,
        });

        return {
          success: true,
          fieldId: newField.id,
          message: `Added field: ${params.field.label}`,
        };
      },
    },

    {
      name: 'l4yercak3_forms_publish',
      description: `Publish a form to make it available for submissions.`,
      inputSchema: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The form ID to publish',
          },
        },
        required: ['formId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_forms'],
      handler: async (params, authContext) => {
        await backendClient.request('POST', `/api/v1/forms/${params.formId}/publish`);

        return {
          success: true,
          formId: params.formId,
          status: 'published',
          message: 'Form published successfully',
        };
      },
    },

    {
      name: 'l4yercak3_forms_unpublish',
      description: `Unpublish a form (change back to draft status).`,
      inputSchema: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The form ID to unpublish',
          },
        },
        required: ['formId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_forms'],
      handler: async (params, authContext) => {
        await backendClient.request('POST', `/api/v1/forms/${params.formId}/unpublish`);

        return {
          success: true,
          formId: params.formId,
          status: 'draft',
          message: 'Form unpublished',
        };
      },
    },

    {
      name: 'l4yercak3_forms_delete',
      description: `Delete a form permanently.`,
      inputSchema: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The form ID to delete',
          },
        },
        required: ['formId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_forms'],
      handler: async (params, authContext) => {
        await backendClient.request('DELETE', `/api/v1/forms/${params.formId}`);

        return {
          success: true,
          message: 'Form deleted successfully',
        };
      },
    },

    {
      name: 'l4yercak3_forms_duplicate',
      description: `Create a copy of an existing form.`,
      inputSchema: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The form ID to duplicate',
          },
        },
        required: ['formId'],
      },
      requiresAuth: true,
      requiredPermissions: ['manage_forms'],
      handler: async (params, authContext) => {
        const response = await backendClient.request(
          'POST',
          `/api/v1/forms/${params.formId}/duplicate`
        );

        return {
          success: true,
          newFormId: response.formId || response.id,
          message: 'Form duplicated successfully',
        };
      },
    },

    // ========================================
    // Form Response Tools
    // ========================================
    {
      name: 'l4yercak3_forms_get_responses',
      description: `Get all responses submitted to a form.`,
      inputSchema: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The form ID',
          },
          status: {
            type: 'string',
            enum: ['partial', 'complete', 'abandoned'],
            description: 'Filter by response status',
          },
          limit: {
            type: 'number',
            description: 'Max responses to return (default 50)',
          },
          offset: {
            type: 'number',
            description: 'Offset for pagination',
          },
        },
        required: ['formId'],
      },
      requiresAuth: true,
      requiredPermissions: ['view_forms'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.set('status', params.status);
        if (params.limit) queryParams.set('limit', Math.min(params.limit, 100));
        if (params.offset) queryParams.set('offset', params.offset);

        const response = await backendClient.request(
          'GET',
          `/api/v1/forms/${params.formId}/responses?${queryParams.toString()}`
        );

        return {
          responses: (response.responses || []).map(resp => ({
            id: resp._id,
            status: resp.status,
            submittedAt: resp.customProperties?.submittedAt,
            data: resp.customProperties?.responses || {},
            isPublicSubmission: resp.customProperties?.isPublicSubmission || false,
          })),
          total: response.total || (response.responses || []).length,
        };
      },
    },

    {
      name: 'l4yercak3_forms_get_response',
      description: `Get a single form response with full details.`,
      inputSchema: {
        type: 'object',
        properties: {
          responseId: {
            type: 'string',
            description: 'The response ID',
          },
        },
        required: ['responseId'],
      },
      requiresAuth: true,
      requiredPermissions: ['view_forms'],
      handler: async (params, authContext) => {
        const response = await backendClient.request(
          'GET',
          `/api/v1/forms/responses/${params.responseId}`
        );

        const resp = response.response || response;

        return {
          id: resp._id,
          formId: resp.customProperties?.formId,
          status: resp.status,
          submittedAt: resp.customProperties?.submittedAt,
          data: resp.customProperties?.responses || {},
          metadata: {
            userAgent: resp.customProperties?.userAgent,
            ipAddress: resp.customProperties?.ipAddress,
            isPublicSubmission: resp.customProperties?.isPublicSubmission,
          },
          createdAt: resp.createdAt,
        };
      },
    },

    {
      name: 'l4yercak3_forms_export_responses',
      description: `Export form responses as CSV or JSON.`,
      inputSchema: {
        type: 'object',
        properties: {
          formId: {
            type: 'string',
            description: 'The form ID',
          },
          format: {
            type: 'string',
            enum: ['json', 'csv'],
            description: 'Export format (default: json)',
          },
        },
        required: ['formId'],
      },
      requiresAuth: true,
      requiredPermissions: ['view_forms'],
      handler: async (params, authContext) => {
        const format = params.format || 'json';

        const response = await backendClient.request(
          'GET',
          `/api/v1/forms/${params.formId}/responses?limit=1000`
        );

        const responses = (response.responses || []).map(resp => ({
          id: resp._id,
          submittedAt: resp.customProperties?.submittedAt,
          ...resp.customProperties?.responses,
        }));

        if (format === 'csv') {
          // Generate CSV
          if (responses.length === 0) {
            return { csv: 'No responses to export', rowCount: 0 };
          }

          const headers = Object.keys(responses[0]);
          const rows = [
            headers.join(','),
            ...responses.map(r =>
              headers.map(h => {
                const val = r[h];
                if (val === null || val === undefined) return '';
                if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
                return String(val);
              }).join(',')
            ),
          ];

          return {
            csv: rows.join('\n'),
            rowCount: responses.length,
          };
        }

        return {
          responses,
          rowCount: responses.length,
        };
      },
    },
  ],
};
