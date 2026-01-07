/**
 * Code Generation Domain Tools
 *
 * Tools for generating API clients, sync adapters, and other
 * integration code for Next.js projects.
 *
 * @module mcp/registry/domains/codegen
 */

// Note: backendClient not currently used but reserved for future API-based code generation
// const backendClient = require('../../../api/backend-client');

/**
 * CodeGen domain definition
 */
module.exports = {
  name: 'codegen',
  description: 'Code generation - API clients, sync adapters, webhooks',
  tools: [
    // ========================================
    // Schema Analysis Tools
    // ========================================
    {
      name: 'l4yercak3_analyze_schema',
      description: `Analyze a database schema and suggest mappings to L4YERCAK3 types.
Supports Prisma schema, SQL, Convex schema, and JSON model definitions.

Use this to help users understand how their existing models map to L4YERCAK3's
contact, event, form, and transaction types.`,
      inputSchema: {
        type: 'object',
        properties: {
          schema: {
            type: 'string',
            description: 'The database schema content (Prisma, SQL, Convex, or JSON)',
          },
          schemaType: {
            type: 'string',
            enum: ['prisma', 'sql', 'convex', 'json'],
            description: 'Schema format (auto-detected if not specified)',
          },
        },
        required: ['schema'],
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        // Parse schema and extract models
        const models = parseSchema(params.schema, params.schemaType);

        // Suggest mappings
        const mappings = models.map(model => ({
          localModel: model.name,
          fields: model.fields,
          suggestedMappings: suggestMappings(model),
        }));

        return {
          models: models.length,
          mappings,
          layerCakeTypes: [
            {
              type: 'crm_contact',
              description: 'Customer/lead/prospect contacts',
              fields: ['email', 'firstName', 'lastName', 'phone', 'company', 'jobTitle', 'tags'],
            },
            {
              type: 'crm_organization',
              description: 'Companies/businesses',
              fields: ['name', 'website', 'industry', 'size', 'phone', 'address'],
            },
            {
              type: 'event',
              description: 'Events (conferences, workshops, meetups)',
              fields: ['name', 'description', 'startDate', 'endDate', 'location'],
            },
            {
              type: 'form',
              description: 'Forms (registration, surveys)',
              fields: ['name', 'fields', 'status'],
            },
            {
              type: 'product',
              description: 'Products/tickets for sale',
              fields: ['name', 'description', 'priceInCents', 'currency'],
            },
            {
              type: 'transaction',
              description: 'Financial transactions',
              fields: ['amount', 'currency', 'status', 'contactId'],
            },
          ],
        };
      },
    },

    // ========================================
    // API Client Generation
    // ========================================
    {
      name: 'l4yercak3_generate_api_client',
      description: `Generate a TypeScript API client for L4YERCAK3.
Creates a type-safe client with methods for the selected features.

Returns the code to write to your project.`,
      inputSchema: {
        type: 'object',
        properties: {
          features: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['crm', 'events', 'forms', 'invoicing', 'checkout'],
            },
            description: 'Features to include in the client',
          },
          outputPath: {
            type: 'string',
            description: 'Suggested output path (default: src/lib/l4yercak3/client.ts)',
          },
          includeTypes: {
            type: 'boolean',
            description: 'Include TypeScript type definitions (default: true)',
          },
        },
        required: ['features'],
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        const features = params.features || ['crm'];
        const outputPath = params.outputPath || 'src/lib/l4yercak3/client.ts';
        const includeTypes = params.includeTypes !== false;

        // Generate client code
        const code = generateApiClient(features, includeTypes);

        return {
          outputPath,
          code,
          features,
          instructions: [
            `1. Create the file: ${outputPath}`,
            '2. Add L4YERCAK3_API_KEY to your .env.local',
            '3. Import and use: import { l4yercak3 } from "@/lib/l4yercak3/client"',
          ],
          envVariables: [
            { name: 'L4YERCAK3_API_KEY', description: 'Your L4YERCAK3 API key' },
            { name: 'L4YERCAK3_BACKEND_URL', description: 'Backend URL (optional, defaults to production)' },
          ],
        };
      },
    },

    // ========================================
    // Sync Adapter Generation
    // ========================================
    {
      name: 'l4yercak3_generate_sync_adapter',
      description: `Generate a sync adapter to keep local models in sync with L4YERCAK3.
Creates code for bidirectional or one-way syncing.`,
      inputSchema: {
        type: 'object',
        properties: {
          localModel: {
            type: 'string',
            description: 'Name of the local model (e.g., "User", "Customer")',
          },
          layerCakeType: {
            type: 'string',
            enum: ['crm_contact', 'crm_organization', 'event', 'form', 'product'],
            description: 'L4YERCAK3 type to sync with',
          },
          fieldMappings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                local: {
                  type: 'string',
                  description: 'Local field name',
                },
                layerCake: {
                  type: 'string',
                  description: 'L4YERCAK3 field name',
                },
                transform: {
                  type: 'string',
                  description: 'Optional transformation (e.g., "uppercase", "lowercase")',
                },
              },
              required: ['local', 'layerCake'],
            },
            description: 'Field mappings between local and L4YERCAK3',
          },
          syncDirection: {
            type: 'string',
            enum: ['push', 'pull', 'bidirectional'],
            description: 'Sync direction (default: bidirectional)',
          },
          outputPath: {
            type: 'string',
            description: 'Output path for the adapter',
          },
        },
        required: ['localModel', 'layerCakeType', 'fieldMappings'],
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        const {
          localModel,
          layerCakeType,
          fieldMappings,
          syncDirection = 'bidirectional',
          outputPath = `src/lib/l4yercak3/sync/${localModel.toLowerCase()}-adapter.ts`,
        } = params;

        const code = generateSyncAdapter(
          localModel,
          layerCakeType,
          fieldMappings,
          syncDirection
        );

        return {
          outputPath,
          code,
          localModel,
          layerCakeType,
          syncDirection,
          instructions: [
            `1. Create the file: ${outputPath}`,
            `2. Import the adapter in your ${localModel} service`,
            '3. Call sync methods when creating/updating/deleting local records',
            '4. Set up a webhook endpoint to receive updates from L4YERCAK3',
          ],
        };
      },
    },

    // ========================================
    // Webhook Handler Generation
    // ========================================
    {
      name: 'l4yercak3_generate_webhook_handler',
      description: `Generate a webhook handler for receiving L4YERCAK3 events.
Creates a Next.js API route that handles L4YERCAK3 webhooks.`,
      inputSchema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'contact.created',
                'contact.updated',
                'contact.deleted',
                'event.created',
                'event.updated',
                'event.published',
                'form.submitted',
                'ticket.purchased',
                'payment.completed',
              ],
            },
            description: 'Events to handle',
          },
          routerType: {
            type: 'string',
            enum: ['app', 'pages'],
            description: 'Next.js router type (default: app)',
          },
          outputPath: {
            type: 'string',
            description: 'Output path for the webhook handler',
          },
        },
        required: ['events'],
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        const events = params.events || [];
        const routerType = params.routerType || 'app';
        const outputPath =
          params.outputPath ||
          (routerType === 'app'
            ? 'app/api/webhooks/l4yercak3/route.ts'
            : 'pages/api/webhooks/l4yercak3.ts');

        const code = generateWebhookHandler(events, routerType);

        return {
          outputPath,
          code,
          events,
          routerType,
          instructions: [
            `1. Create the file: ${outputPath}`,
            '2. Add L4YERCAK3_WEBHOOK_SECRET to your .env.local',
            '3. Register the webhook URL in your L4YERCAK3 dashboard',
            '4. Implement the event handlers for your specific use case',
          ],
          webhookUrl: 'https://your-domain.com/api/webhooks/l4yercak3',
        };
      },
    },

    // ========================================
    // Environment File Generation
    // ========================================
    {
      name: 'l4yercak3_generate_env_template',
      description: `Generate environment variable template for L4YERCAK3 integration.`,
      inputSchema: {
        type: 'object',
        properties: {
          features: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['crm', 'events', 'forms', 'invoicing', 'checkout', 'webhooks'],
            },
            description: 'Features to include env vars for',
          },
        },
        required: ['features'],
      },
      requiresAuth: true,
      handler: async (params, authContext) => {
        const features = params.features || [];

        let template = `# L4YERCAK3 Integration
# Add these to your .env.local file

# Core (Required)
L4YERCAK3_API_KEY=your-api-key-here
L4YERCAK3_BACKEND_URL=https://agreeable-lion-828.convex.site
`;

        if (features.includes('webhooks')) {
          template += `
# Webhooks
L4YERCAK3_WEBHOOK_SECRET=your-webhook-secret
`;
        }

        if (features.includes('checkout')) {
          template += `
# Checkout / Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
`;
        }

        template += `
# Organization ID (auto-set by CLI)
L4YERCAK3_ORGANIZATION_ID=${authContext.organizationId}
`;

        return {
          template,
          outputPath: '.env.local.example',
          instructions: [
            '1. Copy this to .env.local.example',
            '2. Copy .env.local.example to .env.local',
            '3. Fill in your actual values',
            '4. Never commit .env.local to git',
          ],
        };
      },
    },
  ],
};

// ============================================
// Helper Functions
// ============================================

/**
 * Parse schema and extract models
 */
function parseSchema(schema, schemaType) {
  // Auto-detect schema type if not specified
  if (!schemaType) {
    if (schema.includes('model ') && schema.includes('@')) {
      schemaType = 'prisma';
    } else if (schema.includes('CREATE TABLE') || schema.includes('create table')) {
      schemaType = 'sql';
    } else if (schema.includes('defineTable')) {
      schemaType = 'convex';
    } else {
      schemaType = 'json';
    }
  }

  const models = [];

  if (schemaType === 'prisma') {
    // Parse Prisma schema
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = modelRegex.exec(schema)) !== null) {
      const name = match[1];
      const body = match[2];
      const fields = [];

      const fieldRegex = /(\w+)\s+(\w+)(\[\])?\s*(@.*)?/g;
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(body)) !== null) {
        fields.push({
          name: fieldMatch[1],
          type: fieldMatch[2] + (fieldMatch[3] || ''),
        });
      }

      models.push({ name, fields });
    }
  } else if (schemaType === 'json') {
    // Parse JSON model definition
    try {
      const parsed = JSON.parse(schema);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.models) {
        return parsed.models;
      }
    } catch {
      // Not valid JSON, return empty
    }
  }

  return models;
}

/**
 * Suggest L4YERCAK3 type mappings based on model fields
 */
function suggestMappings(model) {
  const mappings = [];
  const fieldNames = model.fields.map(f => f.name.toLowerCase());

  // Check for contact-like model
  if (
    fieldNames.includes('email') ||
    fieldNames.includes('firstname') ||
    fieldNames.includes('first_name') ||
    fieldNames.includes('phone')
  ) {
    mappings.push({
      type: 'crm_contact',
      confidence: 0.8,
      reason: 'Contains contact fields (email, name, phone)',
    });
  }

  // Check for company-like model
  if (
    fieldNames.includes('company') ||
    fieldNames.includes('website') ||
    fieldNames.includes('industry')
  ) {
    mappings.push({
      type: 'crm_organization',
      confidence: 0.7,
      reason: 'Contains organization fields (company, website)',
    });
  }

  // Check for event-like model
  if (
    (fieldNames.includes('startdate') || fieldNames.includes('start_date')) &&
    (fieldNames.includes('enddate') || fieldNames.includes('end_date'))
  ) {
    mappings.push({
      type: 'event',
      confidence: 0.8,
      reason: 'Contains event date fields',
    });
  }

  // Check for product-like model
  if (fieldNames.includes('price') || fieldNames.includes('priceinCents')) {
    mappings.push({
      type: 'product',
      confidence: 0.7,
      reason: 'Contains pricing fields',
    });
  }

  return mappings;
}

/**
 * Generate API client code
 */
function generateApiClient(features, includeTypes) {
  let code = `/**
 * L4YERCAK3 API Client
 * Generated by L4YERCAK3 CLI
 */

const L4YERCAK3_API_KEY = process.env.L4YERCAK3_API_KEY;
const BACKEND_URL = process.env.L4YERCAK3_BACKEND_URL || 'https://agreeable-lion-828.convex.site';

class L4yercak3Client {
  constructor() {
    if (!L4YERCAK3_API_KEY) {
      console.warn('L4YERCAK3_API_KEY not set');
    }
  }

  async request(method, endpoint, data = null) {
    const url = \`\${BACKEND_URL}\${endpoint}\`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${L4YERCAK3_API_KEY}\`,
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || \`API request failed: \${response.status}\`);
    }

    return responseData;
  }
`;

  if (features.includes('crm')) {
    code += `
  // ==================
  // CRM Methods
  // ==================

  async listContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', \`/api/v1/crm/contacts?\${query}\`);
  }

  async createContact(data) {
    return this.request('POST', '/api/v1/crm/contacts', data);
  }

  async getContact(contactId) {
    return this.request('GET', \`/api/v1/crm/contacts/\${contactId}\`);
  }

  async updateContact(contactId, data) {
    return this.request('PATCH', \`/api/v1/crm/contacts/\${contactId}\`, data);
  }

  async deleteContact(contactId) {
    return this.request('DELETE', \`/api/v1/crm/contacts/\${contactId}\`);
  }
`;
  }

  if (features.includes('events')) {
    code += `
  // ==================
  // Events Methods
  // ==================

  async listEvents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', \`/api/v1/events?\${query}\`);
  }

  async createEvent(data) {
    return this.request('POST', '/api/v1/events', data);
  }

  async getEvent(eventId) {
    return this.request('GET', \`/api/v1/events/\${eventId}\`);
  }

  async updateEvent(eventId, data) {
    return this.request('PATCH', \`/api/v1/events/\${eventId}\`, data);
  }

  async getEventAttendees(eventId) {
    return this.request('GET', \`/api/v1/events/\${eventId}/attendees\`);
  }
`;
  }

  if (features.includes('forms')) {
    code += `
  // ==================
  // Forms Methods
  // ==================

  async listForms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', \`/api/v1/forms?\${query}\`);
  }

  async createForm(data) {
    return this.request('POST', '/api/v1/forms', data);
  }

  async getForm(formId) {
    return this.request('GET', \`/api/v1/forms/\${formId}\`);
  }

  async getFormResponses(formId) {
    return this.request('GET', \`/api/v1/forms/\${formId}/responses\`);
  }

  async submitFormResponse(formId, data) {
    return this.request('POST', \`/api/v1/forms/\${formId}/responses\`, data);
  }
`;
  }

  code += `}

export const l4yercak3 = new L4yercak3Client();
export default l4yercak3;
`;

  return code;
}

/**
 * Generate sync adapter code
 */
function generateSyncAdapter(localModel, layerCakeType, fieldMappings, syncDirection) {
  const modelLower = localModel.toLowerCase();

  return `/**
 * ${localModel} <-> L4YERCAK3 ${layerCakeType} Sync Adapter
 * Generated by L4YERCAK3 CLI
 */

import { l4yercak3 } from './client';

// Field mappings
const FIELD_MAPPINGS = ${JSON.stringify(fieldMappings, null, 2)};

/**
 * Transform local model to L4YERCAK3 format
 */
export function toLayerCake(local${localModel}) {
  const data = {};

  for (const mapping of FIELD_MAPPINGS) {
    let value = local${localModel}[mapping.local];

    // Apply transformations
    if (value && mapping.transform) {
      switch (mapping.transform) {
        case 'uppercase':
          value = value.toUpperCase();
          break;
        case 'lowercase':
          value = value.toLowerCase();
          break;
      }
    }

    data[mapping.layerCake] = value;
  }

  return data;
}

/**
 * Transform L4YERCAK3 format to local model
 */
export function toLocal(layerCakeData) {
  const data = {};

  for (const mapping of FIELD_MAPPINGS) {
    data[mapping.local] = layerCakeData[mapping.layerCake];
  }

  return data;
}

${
  syncDirection === 'push' || syncDirection === 'bidirectional'
    ? `
/**
 * Push local ${localModel} to L4YERCAK3
 */
export async function push${localModel}(local${localModel}, layerCakeId = null) {
  const data = toLayerCake(local${localModel});

  if (layerCakeId) {
    // Update existing
    return l4yercak3.request('PATCH', \`/api/v1/${layerCakeType}/\${layerCakeId}\`, data);
  } else {
    // Create new
    return l4yercak3.request('POST', '/api/v1/${layerCakeType}', data);
  }
}
`
    : ''
}

${
  syncDirection === 'pull' || syncDirection === 'bidirectional'
    ? `
/**
 * Pull ${localModel} from L4YERCAK3
 */
export async function pull${localModel}(layerCakeId) {
  const response = await l4yercak3.request('GET', \`/api/v1/${layerCakeType}/\${layerCakeId}\`);
  return toLocal(response);
}

/**
 * Pull all ${localModel}s from L4YERCAK3
 */
export async function pullAll${localModel}s(params = {}) {
  const response = await l4yercak3.request('GET', '/api/v1/${layerCakeType}', params);
  return (response.items || []).map(toLocal);
}
`
    : ''
}

/**
 * Handle webhook event
 */
export function handleWebhookEvent(event) {
  switch (event.type) {
    case '${layerCakeType}.created':
      return { action: 'create', data: toLocal(event.data) };
    case '${layerCakeType}.updated':
      return { action: 'update', data: toLocal(event.data) };
    case '${layerCakeType}.deleted':
      return { action: 'delete', id: event.data.id };
    default:
      return null;
  }
}
`;
}

/**
 * Generate webhook handler code
 */
function generateWebhookHandler(events, routerType) {
  if (routerType === 'app') {
    return `/**
 * L4YERCAK3 Webhook Handler
 * Generated by L4YERCAK3 CLI
 *
 * Route: app/api/webhooks/l4yercak3/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.L4YERCAK3_WEBHOOK_SECRET;

/**
 * Verify webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-l4yercak3-signature');

    // Verify signature
    if (!signature || !verifySignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);

    // Handle events
    switch (event.type) {
${events
  .map(
    e => `      case '${e}':
        await handle${e.replace(/\./g, '_')}(event);
        break;`
  )
  .join('\n')}
      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// ==================
// Event Handlers
// ==================

${events
  .map(
    e => `async function handle${e.replace(/\./g, '_')}(event: any) {
  // TODO: Implement ${e} handler
  console.log('Handling ${e}:', event.data);
}`
  )
  .join('\n\n')}
`;
  }

  // Pages router
  return `/**
 * L4YERCAK3 Webhook Handler
 * Generated by L4YERCAK3 CLI
 *
 * Route: pages/api/webhooks/l4yercak3.ts
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.L4YERCAK3_WEBHOOK_SECRET;

function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = JSON.stringify(req.body);
    const signature = req.headers['x-l4yercak3-signature'] as string;

    if (!signature || !verifySignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    switch (event.type) {
${events.map(e => `      case '${e}': await handle${e.replace(/\./g, '_')}(event); break;`).join('\n')}
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

${events
  .map(
    e => `async function handle${e.replace(/\./g, '_')}(event: any) {
  console.log('Handling ${e}:', event.data);
}`
  )
  .join('\n\n')}
`;
}
