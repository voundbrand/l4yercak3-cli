# L4YERCAK3 CLI - API Reference

Complete reference for all backend APIs available via CLI.

---

## Authentication

### CLI Session Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/cli/validate` | GET | Validate CLI session token |
| `/api/v1/auth/cli/refresh` | POST | Refresh CLI session token |
| `/auth/cli-login` | GET | Browser OAuth login page |
| `/api/auth/oauth-signup` | GET | Direct OAuth provider redirect |

**CLI Session Token Format:** `cli_session_{64_hex_chars}`

**Session Lifetime:** 30 days

---

## Organizations

### List Organizations
```
GET /api/v1/organizations
Authorization: Bearer {cli_token}
```

Response:
```json
{
  "organizations": [
    {
      "id": "org_xxx",
      "name": "My Company",
      "slug": "my-company",
      "planTier": "starter"
    }
  ]
}
```

### Create Organization
```
POST /api/v1/organizations
Authorization: Bearer {cli_token}

{
  "name": "New Organization"
}
```

---

## API Keys

### List API Keys
```
GET /api/v1/api-keys/list?organizationId={org_id}
Authorization: Bearer {cli_token}
```

Response:
```json
{
  "keys": [
    {
      "id": "key_xxx",
      "name": "CLI Generated Key",
      "keyPreview": "sk_live_xxx...",
      "scopes": ["*"],
      "status": "active",
      "createdAt": 1704067200000
    }
  ],
  "limit": 3,
  "currentCount": 1,
  "canCreateMore": true,
  "limitDescription": "1/3"
}
```

### Generate API Key
```
POST /api/v1/api-keys/generate
Authorization: Bearer {cli_token}

{
  "organizationId": "org_xxx",
  "name": "Production API Key",
  "scopes": ["*"]
}
```

Response:
```json
{
  "id": "key_xxx",
  "key": "l4yer_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "name": "Production API Key",
  "scopes": ["*"],
  "createdAt": 1704067200000
}
```

---

## CRM - Contacts

### List Contacts
```
GET /api/v1/crm/contacts?organizationId={org_id}&limit=50&offset=0
Authorization: Bearer {api_key}
```

Response:
```json
{
  "contacts": [
    {
      "id": "obj_xxx",
      "type": "contact",
      "displayName": "John Doe",
      "customProperties": {
        "email": "john@example.com",
        "phone": "+1234567890",
        "company": "Acme Corp"
      },
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ],
  "total": 150,
  "hasMore": true
}
```

### Create Contact
```
POST /api/v1/crm/contacts
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "displayName": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "customFields": {
    "department": "Engineering"
  }
}
```

### Get Contact
```
GET /api/v1/crm/contacts/{contactId}
Authorization: Bearer {api_key}
```

### Update Contact
```
PATCH /api/v1/crm/contacts/{contactId}
Authorization: Bearer {api_key}

{
  "displayName": "Jane Doe",
  "customFields": {
    "title": "Senior Engineer"
  }
}
```

### Delete Contact
```
DELETE /api/v1/crm/contacts/{contactId}
Authorization: Bearer {api_key}
```

### Create Contact from Event Registration
```
POST /api/v1/crm/contacts/from-event
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "eventId": "obj_event_xxx",
  "attendeeData": {
    "email": "attendee@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

## CRM - Organizations

### List CRM Organizations
```
GET /api/v1/crm/organizations?organizationId={org_id}
Authorization: Bearer {api_key}
```

### Create CRM Organization
```
POST /api/v1/crm/organizations
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "name": "Client Company Inc",
  "website": "https://clientcompany.com",
  "industry": "Technology",
  "taxId": "DE123456789"
}
```

---

## Events

### List Events
```
GET /api/v1/events?organizationId={org_id}&status=published
Authorization: Bearer {api_key}
```

Response:
```json
{
  "events": [
    {
      "id": "obj_xxx",
      "type": "event",
      "subtype": "conference",
      "status": "published",
      "displayName": "Tech Conference 2025",
      "customProperties": {
        "startDate": "2025-06-15T09:00:00Z",
        "endDate": "2025-06-17T18:00:00Z",
        "location": "Berlin, Germany",
        "capacity": 500,
        "registeredCount": 342
      }
    }
  ]
}
```

### Create Event
```
POST /api/v1/events
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "name": "Product Launch 2025",
  "subtype": "conference",
  "startDate": "2025-06-15T09:00:00Z",
  "endDate": "2025-06-15T18:00:00Z",
  "location": "Berlin",
  "capacity": 200,
  "description": "Annual product launch event"
}
```

### Get Event
```
GET /api/v1/events/{eventId}
Authorization: Bearer {api_key}
```

### Update Event
```
PATCH /api/v1/events/{eventId}
Authorization: Bearer {api_key}

{
  "status": "published",
  "capacity": 300
}
```

### Delete Event
```
DELETE /api/v1/events/{eventId}
Authorization: Bearer {api_key}
```

---

## Products

### List Products
```
GET /api/v1/products?organizationId={org_id}
Authorization: Bearer {api_key}
```

Response:
```json
{
  "products": [
    {
      "id": "obj_xxx",
      "type": "product",
      "subtype": "ticket",
      "status": "active",
      "displayName": "Early Bird Ticket",
      "customProperties": {
        "price": 19900,
        "currency": "EUR",
        "quantity": 100,
        "sold": 45,
        "linkedEventId": "obj_event_xxx"
      }
    }
  ]
}
```

### Create Product
```
POST /api/v1/products
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "name": "VIP Ticket",
  "subtype": "ticket",
  "price": 49900,
  "currency": "EUR",
  "quantity": 50,
  "linkedEventId": "obj_xxx",
  "description": "VIP access with backstage pass"
}
```

### Get Product
```
GET /api/v1/products/{productId}
Authorization: Bearer {api_key}
```

### Update Product
```
PATCH /api/v1/products/{productId}
Authorization: Bearer {api_key}

{
  "price": 39900,
  "status": "active"
}
```

### Delete Product
```
DELETE /api/v1/products/{productId}
Authorization: Bearer {api_key}
```

---

## Tickets

### List Tickets
```
GET /api/v1/tickets?organizationId={org_id}&eventId={event_id}
Authorization: Bearer {api_key}
```

Response:
```json
{
  "tickets": [
    {
      "id": "obj_xxx",
      "type": "ticket",
      "status": "valid",
      "displayName": "Ticket #001",
      "customProperties": {
        "qrCode": "TKT-ABC123-XYZ",
        "attendeeName": "John Doe",
        "attendeeEmail": "john@example.com",
        "productId": "obj_product_xxx",
        "eventId": "obj_event_xxx",
        "checkedIn": false,
        "checkedInAt": null
      }
    }
  ]
}
```

### Generate Ticket
```
POST /api/v1/tickets
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "productId": "obj_xxx",
  "eventId": "obj_xxx",
  "attendeeName": "Jane Doe",
  "attendeeEmail": "jane@example.com",
  "formResponseData": {
    "dietaryRequirements": "vegetarian"
  }
}
```

### Redeem Ticket (Check-in)
```
POST /api/v1/tickets/{ticketId}/redeem
Authorization: Bearer {api_key}
```

### Get Ticket PDF
```
GET /api/v1/tickets/{ticketId}/pdf
Authorization: Bearer {api_key}

Response: application/pdf
```

### Bulk Export Tickets
```
GET /api/v1/tickets/export?eventId={event_id}&format=csv
Authorization: Bearer {api_key}

Response: text/csv
```

---

## Checkout & Transactions

### Create Checkout Session
```
POST /api/v1/checkout/sessions
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "productId": "obj_xxx",
  "customerEmail": "customer@example.com",
  "successUrl": "https://myapp.com/success",
  "cancelUrl": "https://myapp.com/cancel"
}
```

Response:
```json
{
  "sessionId": "cs_xxx",
  "checkoutUrl": "https://app.l4yercak3.com/checkout/cs_xxx",
  "expiresAt": 1704153600000
}
```

### Verify Payment
```
POST /api/v1/checkout/confirm
Authorization: Bearer {api_key}

{
  "sessionId": "cs_xxx"
}
```

### List Transactions
```
GET /api/v1/transactions?organizationId={org_id}
Authorization: Bearer {api_key}
```

Response:
```json
{
  "transactions": [
    {
      "id": "obj_xxx",
      "type": "transaction",
      "status": "completed",
      "displayName": "Order #12345",
      "customProperties": {
        "lineItems": [
          {
            "productId": "obj_xxx",
            "productName": "Early Bird Ticket",
            "quantity": 2,
            "unitPrice": 19900,
            "total": 39800
          }
        ],
        "subtotal": 39800,
        "tax": 7562,
        "total": 47362,
        "currency": "EUR",
        "customerEmail": "customer@example.com",
        "paymentMethod": "card"
      }
    }
  ]
}
```

### Get Transaction
```
GET /api/v1/transactions/{transactionId}
Authorization: Bearer {api_key}
```

---

## Invoices

### List Invoices
```
GET /api/v1/invoices?organizationId={org_id}&status=sent
Authorization: Bearer {api_key}
```

Response:
```json
{
  "invoices": [
    {
      "id": "obj_xxx",
      "type": "invoice",
      "status": "sent",
      "displayName": "INV-2025-001",
      "customProperties": {
        "invoiceNumber": "INV-2025-001",
        "clientId": "obj_contact_xxx",
        "clientName": "Acme Corp",
        "lineItems": [
          {
            "description": "Consulting Services",
            "quantity": 10,
            "unitPrice": 15000,
            "total": 150000
          }
        ],
        "subtotal": 150000,
        "taxRate": 19,
        "tax": 28500,
        "total": 178500,
        "currency": "EUR",
        "dueDate": "2025-02-15",
        "paymentTerms": "net30"
      }
    }
  ]
}
```

### Create Invoice
```
POST /api/v1/invoices
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "clientId": "obj_contact_xxx",
  "lineItems": [
    {
      "description": "Website Development",
      "quantity": 1,
      "unitPrice": 500000
    }
  ],
  "taxRate": 19,
  "currency": "EUR",
  "dueDate": "2025-02-28",
  "paymentTerms": "net30",
  "notes": "Thank you for your business!"
}
```

### Get Invoice
```
GET /api/v1/invoices/{invoiceId}
Authorization: Bearer {api_key}
```

### Update Invoice (Draft Only)
```
PATCH /api/v1/invoices/{invoiceId}
Authorization: Bearer {api_key}

{
  "lineItems": [...],
  "notes": "Updated notes"
}
```

### Seal Invoice
```
POST /api/v1/invoices/{invoiceId}/seal
Authorization: Bearer {api_key}
```

### Send Invoice
```
POST /api/v1/invoices/{invoiceId}/send
Authorization: Bearer {api_key}

{
  "recipientEmail": "client@acmecorp.com",
  "message": "Please find attached invoice."
}
```

### Mark as Paid
```
POST /api/v1/invoices/{invoiceId}/mark-paid
Authorization: Bearer {api_key}

{
  "paidAmount": 178500,
  "paymentMethod": "bank_transfer",
  "paymentDate": "2025-01-20"
}
```

### Get Invoice PDF
```
GET /api/v1/invoices/{invoiceId}/pdf
Authorization: Bearer {api_key}

Response: application/pdf
```

### Sync Invoice to Stripe
```
POST /api/v1/invoices/{invoiceId}/sync-stripe
Authorization: Bearer {api_key}
```

---

## Forms

### List Forms
```
GET /api/v1/forms?organizationId={org_id}
Authorization: Bearer {api_key}
```

Response:
```json
{
  "forms": [
    {
      "id": "obj_xxx",
      "type": "form",
      "subtype": "registration",
      "status": "published",
      "displayName": "Event Registration",
      "customProperties": {
        "fields": [
          {
            "id": "f1",
            "type": "text",
            "label": "Full Name",
            "required": true
          },
          {
            "id": "f2",
            "type": "email",
            "label": "Email",
            "required": true
          }
        ],
        "responseCount": 45
      }
    }
  ]
}
```

### Create Form
```
POST /api/v1/forms
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "name": "Workshop Registration",
  "subtype": "registration",
  "fields": [
    {
      "type": "text",
      "label": "Name",
      "required": true
    },
    {
      "type": "email",
      "label": "Email",
      "required": true
    },
    {
      "type": "select",
      "label": "Experience Level",
      "options": ["Beginner", "Intermediate", "Advanced"],
      "required": true
    }
  ]
}
```

### Submit Form Response
```
POST /api/v1/forms/{formId}/submit
Authorization: Bearer {api_key}

{
  "responses": {
    "f1": "John Doe",
    "f2": "john@example.com",
    "f3": "Intermediate"
  }
}
```

### Get Form Responses
```
GET /api/v1/forms/{formId}/responses
Authorization: Bearer {api_key}
```

### Export Form Responses
```
GET /api/v1/forms/{formId}/export?format=csv
Authorization: Bearer {api_key}

Response: text/csv
```

---

## Projects

### List Projects
```
GET /api/v1/projects?organizationId={org_id}
Authorization: Bearer {api_key}
```

Response:
```json
{
  "projects": [
    {
      "id": "obj_xxx",
      "type": "project",
      "status": "active",
      "displayName": "Brand Redesign",
      "customProperties": {
        "clientId": "obj_contact_xxx",
        "clientName": "Acme Corp",
        "budget": 1500000,
        "startDate": "2025-01-01",
        "endDate": "2025-03-31",
        "progress": 35,
        "milestones": [
          {
            "id": "m1",
            "name": "Discovery",
            "status": "completed"
          }
        ]
      }
    }
  ]
}
```

### Create Project
```
POST /api/v1/projects
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "name": "Website Redesign",
  "clientId": "obj_xxx",
  "budget": 2000000,
  "startDate": "2025-02-01",
  "endDate": "2025-05-31",
  "description": "Complete website overhaul"
}
```

### Get Project
```
GET /api/v1/projects/{projectId}
Authorization: Bearer {api_key}
```

### Update Project
```
PATCH /api/v1/projects/{projectId}
Authorization: Bearer {api_key}

{
  "status": "completed",
  "progress": 100
}
```

### Add Task to Project
```
POST /api/v1/projects/{projectId}/tasks
Authorization: Bearer {api_key}

{
  "title": "Design mockups",
  "description": "Create initial design mockups",
  "assigneeId": "user_xxx",
  "dueDate": "2025-02-15",
  "priority": "high"
}
```

### List Project Tasks
```
GET /api/v1/projects/{projectId}/tasks
Authorization: Bearer {api_key}
```

---

## Workflows

### List Workflows
```
GET /api/v1/workflows?organizationId={org_id}
Authorization: Bearer {api_key}
```

### Create Workflow
```
POST /api/v1/workflows
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "name": "New Contact Welcome",
  "trigger": {
    "type": "contact_created"
  },
  "actions": [
    {
      "type": "send_email",
      "templateId": "obj_template_xxx",
      "delay": 0
    }
  ]
}
```

### Update Workflow
```
PATCH /api/v1/workflows/{workflowId}
Authorization: Bearer {api_key}

{
  "status": "active"
}
```

### Manually Trigger Workflow
```
POST /api/v1/workflows/{workflowId}/run
Authorization: Bearer {api_key}

{
  "contextData": {
    "contactId": "obj_xxx"
  }
}
```

### Get Workflow Logs
```
GET /api/v1/workflows/{workflowId}/logs
Authorization: Bearer {api_key}
```

---

## Templates

### List Templates
```
GET /api/v1/templates?organizationId={org_id}&type=email
Authorization: Bearer {api_key}
```

Response:
```json
{
  "templates": [
    {
      "id": "obj_xxx",
      "type": "template",
      "subtype": "email",
      "displayName": "Invoice Email",
      "customProperties": {
        "subject": "Invoice {{invoiceNumber}} from {{organizationName}}",
        "htmlContent": "...",
        "variables": ["invoiceNumber", "organizationName", "clientName"]
      }
    }
  ]
}
```

### Get Template
```
GET /api/v1/templates/{templateId}
Authorization: Bearer {api_key}
```

### Preview Template (with data)
```
POST /api/v1/templates/{templateId}/preview
Authorization: Bearer {api_key}

{
  "data": {
    "invoiceNumber": "INV-2025-001",
    "organizationName": "My Company",
    "clientName": "Acme Corp"
  }
}
```

---

## Bookings

### Create Booking
```
POST /api/v1/bookings
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "eventId": "obj_xxx",
  "productId": "obj_xxx",
  "attendeeEmail": "attendee@example.com",
  "attendeeName": "John Doe",
  "quantity": 2
}
```

### List Bookings
```
GET /api/v1/bookings?organizationId={org_id}&eventId={event_id}
Authorization: Bearer {api_key}
```

---

## Webhooks

### List Webhook Subscriptions
```
GET /api/v1/webhooks?organizationId={org_id}
Authorization: Bearer {api_key}
```

### Create Webhook
```
POST /api/v1/webhooks
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "url": "https://myapp.com/webhook",
  "events": ["contact.created", "transaction.completed", "invoice.paid"],
  "secret": "whsec_xxx"
}
```

### Delete Webhook
```
DELETE /api/v1/webhooks/{webhookId}
Authorization: Bearer {api_key}
```

### Test Webhook
```
POST /api/v1/webhooks/{webhookId}/test
Authorization: Bearer {api_key}
```

---

## Bulk Operations

### Bulk Import
```
POST /api/v1/bulk/import
Authorization: Bearer {api_key}
Content-Type: multipart/form-data

file: (CSV or JSON file)
type: contacts | products | events
organizationId: org_xxx
options: {
  "updateExisting": true,
  "skipInvalid": true
}
```

Response:
```json
{
  "jobId": "bulk_xxx",
  "status": "processing",
  "total": 500,
  "processed": 0,
  "errors": []
}
```

### Bulk Export
```
POST /api/v1/bulk/export
Authorization: Bearer {api_key}

{
  "organizationId": "org_xxx",
  "type": "contacts",
  "format": "csv",
  "filters": {
    "createdAfter": "2024-01-01"
  }
}
```

Response:
```json
{
  "jobId": "export_xxx",
  "downloadUrl": "https://...",
  "expiresAt": 1704153600000
}
```

### Get Bulk Job Status
```
GET /api/v1/bulk/jobs/{jobId}
Authorization: Bearer {api_key}
```

---

## Connected Apps (CLI Registration)

### Register Connected App
```
POST /api/v1/cli/apps/register
Authorization: Bearer {cli_token}

{
  "organizationId": "org_xxx",
  "name": "My Benefits Platform",
  "framework": "nextjs",
  "features": ["crm", "benefits", "invoicing"],
  "modelMappings": [
    {
      "localModel": "User",
      "layerCakeType": "contact",
      "syncDirection": "bidirectional",
      "fieldMappings": [
        {"localField": "email", "layerCakeField": "email"},
        {"localField": "name", "layerCakeField": "displayName"}
      ]
    }
  ],
  "productionDomain": "myapp.vercel.app"
}
```

### List Connected Apps
```
GET /api/v1/cli/apps?organizationId={org_id}
Authorization: Bearer {cli_token}
```

### Update Connected App
```
PATCH /api/v1/cli/apps/{appId}
Authorization: Bearer {cli_token}

{
  "status": "paused",
  "modelMappings": [...]
}
```

### Disconnect App
```
DELETE /api/v1/cli/apps/{appId}
Authorization: Bearer {cli_token}
```

### Sync App Data
```
POST /api/v1/cli/apps/{appId}/sync
Authorization: Bearer {cli_token}

{
  "direction": "bidirectional",
  "models": ["contacts", "organizations"]
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `SESSION_EXPIRED` | 401 | CLI session expired |
| `NOT_AUTHORIZED` | 403 | No permission for this resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `MISSING_PARAM` | 400 | Required parameter missing |
| `API_KEY_LIMIT_REACHED` | 429 | API key quota exceeded |
| `RATE_LIMITED` | 429 | Too many requests |
| `RESOURCE_LIMIT` | 429 | Plan resource limit reached |
| `UNKNOWN_ERROR` | 500 | Internal server error |

---

## Rate Limits

| Plan | Requests/minute | Bulk operations/day |
|------|-----------------|---------------------|
| Free | 60 | 10 |
| Starter | 300 | 50 |
| Professional | 1000 | 200 |
| Agency | 3000 | 500 |
| Enterprise | Unlimited | Unlimited |

---

## Webhooks Payload Format

```json
{
  "id": "evt_xxx",
  "type": "contact.created",
  "timestamp": 1704067200000,
  "data": {
    "id": "obj_xxx",
    "type": "contact",
    "displayName": "John Doe",
    "customProperties": {...}
  },
  "organizationId": "org_xxx"
}
```

### Available Webhook Events

- `contact.created`
- `contact.updated`
- `contact.deleted`
- `transaction.completed`
- `transaction.refunded`
- `invoice.created`
- `invoice.sent`
- `invoice.paid`
- `event.published`
- `ticket.issued`
- `ticket.redeemed`
- `form.submitted`
- `project.created`
- `project.completed`

---

*Document Version: 1.0*
*Last Updated: January 2025*
