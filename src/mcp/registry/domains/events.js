/**
 * Events Domain Tools
 *
 * Event management tools for creating events, managing tickets,
 * tracking attendees, and handling sponsors.
 *
 * @module mcp/registry/domains/events
 */

const backendClient = require('../../../api/backend-client');

/**
 * Events domain definition
 */
module.exports = {
  name: 'events',
  description: 'Event management - events, tickets, attendees, sponsors',
  tools: [
    // ========================================
    // Event CRUD Tools
    // ========================================
    {
      name: 'l4yercak3_events_list',
      description: `List all events for the organization.
Returns events with their basic details, status, and dates.`,
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'],
            description: 'Filter by event status',
          },
          subtype: {
            type: 'string',
            enum: ['conference', 'workshop', 'concert', 'meetup', 'seminar'],
            description: 'Filter by event type',
          },
          fromDate: {
            type: 'string',
            description: 'ISO date - only events starting after this date',
          },
          toDate: {
            type: 'string',
            description: 'ISO date - only events starting before this date',
          },
          limit: {
            type: 'number',
            description: 'Max events to return (default 50)',
          },
        },
      },
      requiresAuth: true,
      requiredPermissions: ['events:read'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        queryParams.set('organizationId', authContext.organizationId);
        if (params.status) queryParams.set('status', params.status);
        if (params.subtype) queryParams.set('subtype', params.subtype);
        if (params.fromDate) queryParams.set('fromDate', params.fromDate);
        if (params.toDate) queryParams.set('toDate', params.toDate);
        if (params.limit) queryParams.set('limit', Math.min(params.limit, 100));

        const response = await backendClient.request(
          'GET',
          `/api/v1/events?${queryParams.toString()}`
        );

        return {
          events: (response.events || []).map(event => ({
            id: event._id,
            name: event.name,
            description: event.description,
            subtype: event.subtype,
            status: event.status,
            startDate: event.customProperties?.startDate,
            endDate: event.customProperties?.endDate,
            location: event.customProperties?.location,
            slug: event.customProperties?.slug,
            attendeeCount: event.customProperties?.attendeeCount || 0,
          })),
          total: response.total || (response.events || []).length,
        };
      },
    },

    {
      name: 'l4yercak3_events_create',
      description: `Create a new event.
Events start in 'draft' status and can be published when ready.`,
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Event name',
          },
          description: {
            type: 'string',
            description: 'Event description',
          },
          subtype: {
            type: 'string',
            enum: ['conference', 'workshop', 'concert', 'meetup', 'seminar'],
            description: 'Event type (default: meetup)',
          },
          startDate: {
            type: 'string',
            description: 'Start date/time (ISO format)',
          },
          endDate: {
            type: 'string',
            description: 'End date/time (ISO format)',
          },
          location: {
            type: 'string',
            description: 'Event location/venue',
          },
          timezone: {
            type: 'string',
            description: 'Timezone (e.g., America/New_York)',
          },
          maxCapacity: {
            type: 'number',
            description: 'Maximum attendee capacity',
          },
        },
        required: ['name', 'startDate', 'endDate', 'location'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:write'],
      handler: async (params, authContext) => {
        // Convert ISO dates to timestamps
        const startDate = new Date(params.startDate).getTime();
        const endDate = new Date(params.endDate).getTime();

        const response = await backendClient.request('POST', '/api/v1/events', {
          organizationId: authContext.organizationId,
          name: params.name,
          description: params.description,
          subtype: params.subtype || 'meetup',
          startDate,
          endDate,
          location: params.location,
          customProperties: {
            timezone: params.timezone || 'UTC',
            maxCapacity: params.maxCapacity,
          },
        });

        return {
          success: true,
          eventId: response.eventId || response.id,
          status: 'draft',
          message: `Created event: ${params.name} (draft)`,
          nextSteps: [
            'Add ticket products with l4yercak3_events_create_product',
            'Publish the event with l4yercak3_events_publish',
          ],
        };
      },
    },

    {
      name: 'l4yercak3_events_get',
      description: `Get detailed information about a specific event.
Includes agenda, products, and optionally sponsors.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID',
          },
          includeProducts: {
            type: 'boolean',
            description: 'Include linked products/tickets (default: true)',
          },
          includeSponsors: {
            type: 'boolean',
            description: 'Include sponsors (default: false)',
          },
        },
        required: ['eventId'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:read'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        if (params.includeProducts !== false) queryParams.set('includeProducts', 'true');
        if (params.includeSponsors) queryParams.set('includeSponsors', 'true');

        const response = await backendClient.request(
          'GET',
          `/api/v1/events/${params.eventId}?${queryParams.toString()}`
        );

        const event = response.event || response;

        return {
          id: event._id,
          name: event.name,
          description: event.description,
          subtype: event.subtype,
          status: event.status,
          startDate: event.customProperties?.startDate,
          endDate: event.customProperties?.endDate,
          location: event.customProperties?.location,
          formattedAddress: event.customProperties?.formattedAddress,
          timezone: event.customProperties?.timezone,
          slug: event.customProperties?.slug,
          maxCapacity: event.customProperties?.maxCapacity,
          agenda: event.customProperties?.agenda || [],
          detailedDescription: event.customProperties?.detailedDescription,
          products: response.products || [],
          sponsors: response.sponsors || [],
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        };
      },
    },

    {
      name: 'l4yercak3_events_update',
      description: `Update an existing event.
Can update name, dates, location, and other properties.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID to update',
          },
          name: { type: 'string', description: 'New event name' },
          description: { type: 'string', description: 'New description' },
          subtype: {
            type: 'string',
            enum: ['conference', 'workshop', 'concert', 'meetup', 'seminar'],
          },
          startDate: { type: 'string', description: 'New start date (ISO)' },
          endDate: { type: 'string', description: 'New end date (ISO)' },
          location: { type: 'string', description: 'New location' },
          maxCapacity: { type: 'number', description: 'New capacity limit' },
        },
        required: ['eventId'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:write'],
      handler: async (params, authContext) => {
        const { eventId, startDate, endDate, ...updates } = params;

        // Convert dates if provided
        if (startDate) updates.startDate = new Date(startDate).getTime();
        if (endDate) updates.endDate = new Date(endDate).getTime();

        await backendClient.request('PATCH', `/api/v1/events/${eventId}`, updates);

        return {
          success: true,
          eventId,
          message: 'Event updated successfully',
        };
      },
    },

    {
      name: 'l4yercak3_events_publish',
      description: `Publish an event to make it publicly visible.
Changes status from 'draft' to 'published'.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID to publish',
          },
        },
        required: ['eventId'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:write'],
      handler: async (params, authContext) => {
        await backendClient.request('POST', `/api/v1/events/${params.eventId}/publish`);

        return {
          success: true,
          eventId: params.eventId,
          status: 'published',
          message: 'Event published successfully',
        };
      },
    },

    {
      name: 'l4yercak3_events_cancel',
      description: `Cancel an event.
Sets status to 'cancelled'. This is a soft delete.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID to cancel',
          },
        },
        required: ['eventId'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:write'],
      handler: async (params, authContext) => {
        await backendClient.request('POST', `/api/v1/events/${params.eventId}/cancel`);

        return {
          success: true,
          eventId: params.eventId,
          status: 'cancelled',
          message: 'Event cancelled',
        };
      },
    },

    // ========================================
    // Event Agenda Tools
    // ========================================
    {
      name: 'l4yercak3_events_update_agenda',
      description: `Update the event agenda/schedule.
Replace the entire agenda with a new list of agenda items.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID',
          },
          agenda: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: {
                  type: 'string',
                  description: 'Time (e.g., "09:00 AM" or ISO timestamp)',
                },
                title: {
                  type: 'string',
                  description: 'Session title',
                },
                description: {
                  type: 'string',
                  description: 'Session description',
                },
                speaker: {
                  type: 'string',
                  description: 'Speaker name',
                },
                location: {
                  type: 'string',
                  description: 'Room/venue within event',
                },
                duration: {
                  type: 'number',
                  description: 'Duration in minutes',
                },
              },
              required: ['time', 'title'],
            },
            description: 'List of agenda items',
          },
        },
        required: ['eventId', 'agenda'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:write'],
      handler: async (params, authContext) => {
        await backendClient.request('PATCH', `/api/v1/events/${params.eventId}/agenda`, {
          agenda: params.agenda,
        });

        return {
          success: true,
          eventId: params.eventId,
          agendaItemCount: params.agenda.length,
          message: 'Event agenda updated',
        };
      },
    },

    // ========================================
    // Product/Ticket Tools
    // ========================================
    {
      name: 'l4yercak3_events_get_products',
      description: `Get all products (tickets) offered by an event.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID',
          },
        },
        required: ['eventId'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:read'],
      handler: async (params, authContext) => {
        const response = await backendClient.request(
          'GET',
          `/api/v1/events/${params.eventId}/products`
        );

        return {
          products: (response.products || []).map(product => ({
            id: product._id,
            name: product.name,
            description: product.description,
            priceInCents: product.customProperties?.priceInCents,
            currency: product.customProperties?.currency || 'EUR',
            quantity: product.customProperties?.quantity,
            soldCount: product.customProperties?.soldCount || 0,
            status: product.status,
            isFeatured: product.linkProperties?.isFeatured || false,
          })),
        };
      },
    },

    {
      name: 'l4yercak3_events_create_product',
      description: `Create a product (ticket type) for an event.
Products can be tickets, merchandise, or add-ons.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID',
          },
          name: {
            type: 'string',
            description: 'Product name (e.g., "Early Bird Ticket")',
          },
          description: {
            type: 'string',
            description: 'Product description',
          },
          priceInCents: {
            type: 'number',
            description: 'Price in cents (e.g., 5000 = €50.00)',
          },
          currency: {
            type: 'string',
            description: 'Currency code (default: EUR)',
          },
          quantity: {
            type: 'number',
            description: 'Available quantity (null = unlimited)',
          },
          subtype: {
            type: 'string',
            enum: ['ticket', 'merchandise', 'addon', 'donation'],
            description: 'Product type (default: ticket)',
          },
          isFeatured: {
            type: 'boolean',
            description: 'Feature this product prominently',
          },
        },
        required: ['eventId', 'name', 'priceInCents'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:write'],
      handler: async (params, authContext) => {
        const response = await backendClient.request('POST', '/api/v1/products', {
          organizationId: authContext.organizationId,
          eventId: params.eventId,
          name: params.name,
          description: params.description,
          priceInCents: params.priceInCents,
          currency: params.currency || 'EUR',
          quantity: params.quantity,
          subtype: params.subtype || 'ticket',
          isFeatured: params.isFeatured || false,
        });

        return {
          success: true,
          productId: response.productId || response.id,
          message: `Created product: ${params.name}`,
        };
      },
    },

    // ========================================
    // Attendee Tools
    // ========================================
    {
      name: 'l4yercak3_events_get_attendees',
      description: `Get all attendees (ticket holders) for an event.
Returns people who have purchased tickets.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID',
          },
          status: {
            type: 'string',
            enum: ['issued', 'checked_in', 'cancelled'],
            description: 'Filter by ticket status',
          },
          limit: {
            type: 'number',
            description: 'Max attendees to return',
          },
        },
        required: ['eventId'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:read'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.set('status', params.status);
        if (params.limit) queryParams.set('limit', params.limit);

        const response = await backendClient.request(
          'GET',
          `/api/v1/events/${params.eventId}/attendees?${queryParams.toString()}`
        );

        return {
          attendees: (response.attendees || []).map(attendee => ({
            ticketId: attendee._id,
            holderName: attendee.holderName,
            holderEmail: attendee.holderEmail,
            holderPhone: attendee.holderPhone,
            ticketNumber: attendee.ticketNumber,
            ticketType: attendee.ticketType,
            status: attendee.status,
            purchaseDate: attendee.purchaseDate,
            pricePaid: attendee.pricePaid,
            formResponses: attendee.formResponses,
          })),
          total: response.total || (response.attendees || []).length,
        };
      },
    },

    // ========================================
    // Sponsor Tools
    // ========================================
    {
      name: 'l4yercak3_events_get_sponsors',
      description: `Get all sponsors for an event.
Sponsors are CRM organizations linked to the event.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID',
          },
          sponsorLevel: {
            type: 'string',
            enum: ['platinum', 'gold', 'silver', 'bronze', 'community'],
            description: 'Filter by sponsor level',
          },
        },
        required: ['eventId'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:read'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        if (params.sponsorLevel) queryParams.set('sponsorLevel', params.sponsorLevel);

        const response = await backendClient.request(
          'GET',
          `/api/v1/events/${params.eventId}/sponsors?${queryParams.toString()}`
        );

        return {
          sponsors: (response.sponsors || []).map(sponsor => ({
            crmOrganizationId: sponsor._id,
            name: sponsor.name,
            website: sponsor.customProperties?.website,
            sponsorLevel: sponsor.sponsorshipProperties?.sponsorLevel,
            logoUrl: sponsor.sponsorshipProperties?.logoUrl,
            description: sponsor.sponsorshipProperties?.description,
          })),
        };
      },
    },

    {
      name: 'l4yercak3_events_add_sponsor',
      description: `Add a sponsor (CRM organization) to an event.`,
      inputSchema: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'The event ID',
          },
          crmOrganizationId: {
            type: 'string',
            description: 'The CRM organization ID to add as sponsor',
          },
          sponsorLevel: {
            type: 'string',
            enum: ['platinum', 'gold', 'silver', 'bronze', 'community'],
            description: 'Sponsor level (default: community)',
          },
          logoUrl: {
            type: 'string',
            description: 'Sponsor logo URL',
          },
          websiteUrl: {
            type: 'string',
            description: 'Sponsor website URL',
          },
          description: {
            type: 'string',
            description: 'Sponsor description',
          },
        },
        required: ['eventId', 'crmOrganizationId'],
      },
      requiresAuth: true,
      requiredPermissions: ['events:write'],
      handler: async (params, authContext) => {
        await backendClient.request('POST', `/api/v1/events/${params.eventId}/sponsors`, {
          crmOrganizationId: params.crmOrganizationId,
          sponsorLevel: params.sponsorLevel || 'community',
          logoUrl: params.logoUrl,
          websiteUrl: params.websiteUrl,
          description: params.description,
        });

        return {
          success: true,
          message: 'Sponsor added to event',
        };
      },
    },
  ],
};
