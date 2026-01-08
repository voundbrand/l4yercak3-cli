# L4YERCAK3 CLI Integration Paths Architecture

## Overview

When a developer runs `l4yercak3 spread`, they go through a comprehensive setup flow that results in a fully integrated application. This document outlines the three integration paths and what each generates.

## Flow Diagram

```
l4yercak3 spread
      │
      ▼
┌─────────────────────────────────────┐
│  1. DETECT PROJECT                  │
│  - Framework (Next.js, Expo, etc.)  │
│  - TypeScript/JavaScript            │
│  - Router type (App/Pages)          │
│  - Existing database (detect)       │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  2. SELECT FEATURES                 │
│  ◉ CRM (contacts, organizations)    │
│  ◉ Events (ticketing, check-in)     │
│  ◉ Forms (builder, submissions)     │
│  ◉ Products (catalog, inventory)    │
│  ◉ Checkout (cart, payments)        │
│  ◉ Invoicing (B2B/B2C)              │
│  ◉ Benefits (claims, commissions)   │
│  ◉ Certificates (CME, attendance)   │
│  ◉ Projects (task management)       │
│  ◉ Authentication (OAuth providers) │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  3. CHOOSE INTEGRATION PATH         │
│                                     │
│  ◉ Quick Start (Recommended)        │
│    Full-stack with UI components    │
│                                     │
│  ○ API Only                         │
│    Just the typed API client        │
│                                     │
│  ○ MCP-Assisted                     │
│    AI-powered custom generation     │
└─────────────────────────────────────┘
      │
      ▼ (if Quick Start or no DB detected)
┌─────────────────────────────────────┐
│  4. DATABASE SELECTION              │
│  (only if no existing DB detected)  │
│                                     │
│  ◉ Convex (Recommended)             │
│    Real-time, serverless            │
│                                     │
│  ○ Supabase                         │
│    PostgreSQL + Auth + Storage      │
│                                     │
│  ○ None / Existing                  │
│    Skip database setup              │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  5. GENERATE & CONFIGURE            │
│  - Create files based on path       │
│  - Set up database (if selected)    │
│  - Configure MCP server             │
│  - Register with L4YERCAK3 backend  │
└─────────────────────────────────────┘
```

---

## Integration Path 1: Quick Start (Full Stack)

**Target User:** Developers who want a working app fast with best practices baked in.

### What Gets Generated

```
project/
├── .env.local                      # API keys, DB connection
├── l4yercak3.config.ts             # L4YERCAK3 configuration
│
├── lib/
│   ├── l4yercak3/
│   │   ├── client.ts               # API client (typed)
│   │   ├── types.ts                # All TypeScript types
│   │   ├── hooks/                  # React Query hooks
│   │   │   ├── use-contacts.ts
│   │   │   ├── use-events.ts
│   │   │   ├── use-forms.ts
│   │   │   ├── use-products.ts
│   │   │   ├── use-checkout.ts
│   │   │   └── ...
│   │   └── utils.ts                # Helper functions
│   │
│   └── db/                         # Database layer
│       ├── convex/                 # If Convex selected
│       │   ├── schema.ts           # Convex schema
│       │   ├── contacts.ts         # Contact queries/mutations
│       │   ├── events.ts
│       │   └── ...
│       └── supabase/               # If Supabase selected
│           ├── schema.sql          # PostgreSQL schema
│           ├── migrations/
│           └── client.ts
│
├── components/
│   └── l4yercak3/
│       ├── crm/
│       │   ├── ContactList.tsx
│       │   ├── ContactCard.tsx
│       │   ├── ContactForm.tsx
│       │   ├── ContactDetail.tsx
│       │   └── OrganizationList.tsx
│       ├── events/
│       │   ├── EventList.tsx
│       │   ├── EventCard.tsx
│       │   ├── EventDetail.tsx
│       │   ├── TicketSelector.tsx
│       │   └── CheckInScanner.tsx
│       ├── forms/
│       │   ├── FormRenderer.tsx
│       │   ├── FormBuilder.tsx     # (if admin features enabled)
│       │   └── FormSubmissions.tsx
│       ├── checkout/
│       │   ├── Cart.tsx
│       │   ├── CheckoutForm.tsx
│       │   └── OrderConfirmation.tsx
│       ├── invoicing/
│       │   ├── InvoiceList.tsx
│       │   ├── InvoiceDetail.tsx
│       │   └── InvoicePDF.tsx
│       ├── benefits/
│       │   ├── ClaimsList.tsx
│       │   ├── ClaimForm.tsx
│       │   └── WalletManager.tsx
│       └── shared/
│           ├── LoadingSpinner.tsx
│           ├── ErrorBoundary.tsx
│           └── Pagination.tsx
│
├── app/                            # Next.js App Router
│   ├── api/
│   │   └── l4yercak3/
│   │       └── [...path]/
│   │           └── route.ts        # API proxy route
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/page.tsx
│   │
│   ├── crm/
│   │   ├── page.tsx                # Contact list
│   │   └── [id]/page.tsx           # Contact detail
│   │
│   ├── events/
│   │   ├── page.tsx                # Event listing
│   │   ├── [id]/page.tsx           # Event detail
│   │   └── [id]/register/page.tsx  # Registration form
│   │
│   ├── checkout/
│   │   ├── page.tsx                # Cart/checkout
│   │   └── success/page.tsx        # Order confirmation
│   │
│   └── admin/                      # (if admin features)
│       ├── events/page.tsx
│       ├── forms/page.tsx
│       └── invoices/page.tsx
│
└── convex/                         # If Convex selected
    ├── _generated/
    ├── schema.ts
    ├── contacts.ts
    ├── events.ts
    ├── forms.ts
    ├── products.ts
    ├── orders.ts
    └── sync.ts                     # L4YERCAK3 sync logic
```

### Database Schema (Convex Example)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Local cache of L4YERCAK3 contacts
  contacts: defineTable({
    l4yercak3Id: v.string(),        // ID from L4YERCAK3 backend
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    status: v.string(),
    tags: v.array(v.string()),
    syncedAt: v.number(),
    localOnly: v.boolean(),         // Not yet synced to L4YERCAK3
  })
    .index("by_l4yercak3_id", ["l4yercak3Id"])
    .index("by_email", ["email"]),

  // Local cache of events
  events: defineTable({
    l4yercak3Id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    location: v.string(),
    status: v.string(),
    maxCapacity: v.optional(v.number()),
    syncedAt: v.number(),
  })
    .index("by_l4yercak3_id", ["l4yercak3Id"])
    .index("by_status", ["status"]),

  // Local orders/purchases
  orders: defineTable({
    l4yercak3Id: v.optional(v.string()),
    contactId: v.id("contacts"),
    eventId: v.optional(v.id("events")),
    items: v.array(v.object({
      productId: v.string(),
      name: v.string(),
      quantity: v.number(),
      priceInCents: v.number(),
    })),
    totalInCents: v.number(),
    currency: v.string(),
    status: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    createdAt: v.number(),
    syncedAt: v.optional(v.number()),
  })
    .index("by_contact", ["contactId"])
    .index("by_status", ["status"]),

  // Form submissions (local + synced)
  formSubmissions: defineTable({
    l4yercak3FormId: v.string(),
    l4yercak3ResponseId: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
    data: v.any(),
    submittedAt: v.number(),
    syncedAt: v.optional(v.number()),
  })
    .index("by_form", ["l4yercak3FormId"]),

  // Sync metadata
  syncStatus: defineTable({
    entityType: v.string(),         // "contacts", "events", etc.
    lastSyncAt: v.number(),
    lastSyncCursor: v.optional(v.string()),
    status: v.string(),             // "idle", "syncing", "error"
    errorMessage: v.optional(v.string()),
  })
    .index("by_entity", ["entityType"]),
});
```

### Sync Strategy

```typescript
// convex/sync.ts
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Bidirectional sync with L4YERCAK3
export const syncContacts = internalMutation({
  args: { direction: v.union(v.literal("push"), v.literal("pull"), v.literal("both")) },
  handler: async (ctx, { direction }) => {
    // 1. Pull changes from L4YERCAK3
    if (direction === "pull" || direction === "both") {
      const lastSync = await ctx.db
        .query("syncStatus")
        .withIndex("by_entity", (q) => q.eq("entityType", "contacts"))
        .first();

      // Fetch from L4YERCAK3 API
      // Update local records
      // Track sync cursor
    }

    // 2. Push local changes to L4YERCAK3
    if (direction === "push" || direction === "both") {
      const localOnlyContacts = await ctx.db
        .query("contacts")
        .filter((q) => q.eq(q.field("localOnly"), true))
        .collect();

      // Push to L4YERCAK3 API
      // Update l4yercak3Id on local records
    }
  },
});
```

---

## Integration Path 2: API Only

**Target User:** Developers who want full control over UI but need a solid API foundation.

### What Gets Generated

```
project/
├── .env.local                      # API keys
├── l4yercak3.config.ts             # Configuration
│
└── lib/
    └── l4yercak3/
        ├── client.ts               # Full typed API client
        ├── types.ts                # All TypeScript types
        ├── auth.ts                 # Authentication helpers
        ├── webhooks.ts             # Webhook handler utilities
        └── index.ts                # Main export
```

### Generated API Client

```typescript
// lib/l4yercak3/client.ts
import type {
  Contact, ContactCreateInput, ContactUpdateInput,
  Event, EventCreateInput,
  Form, FormSubmission,
  Product, Order,
  // ... all types
} from './types';

export class L4yercak3Client {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.l4yercak3.com';
  }

  // ============ CRM ============

  async listContacts(params?: {
    limit?: number;
    status?: 'active' | 'inactive' | 'archived';
    search?: string;
  }): Promise<{ contacts: Contact[]; total: number }> {
    return this.request('GET', '/api/v1/crm/contacts', { params });
  }

  async getContact(id: string, options?: {
    includeActivities?: boolean;
    includeNotes?: boolean;
  }): Promise<Contact> {
    return this.request('GET', `/api/v1/crm/contacts/${id}`, { params: options });
  }

  async createContact(data: ContactCreateInput): Promise<Contact> {
    return this.request('POST', '/api/v1/crm/contacts', { body: data });
  }

  async updateContact(id: string, data: ContactUpdateInput): Promise<Contact> {
    return this.request('PATCH', `/api/v1/crm/contacts/${id}`, { body: data });
  }

  async deleteContact(id: string): Promise<void> {
    return this.request('DELETE', `/api/v1/crm/contacts/${id}`);
  }

  // ============ Events ============

  async listEvents(params?: {
    status?: 'draft' | 'published' | 'cancelled';
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Promise<{ events: Event[]; total: number }> {
    return this.request('GET', '/api/v1/events', { params });
  }

  async getEvent(id: string, options?: {
    includeProducts?: boolean;
    includeSponsors?: boolean;
  }): Promise<Event> {
    return this.request('GET', `/api/v1/events/${id}`, { params: options });
  }

  async createEvent(data: EventCreateInput): Promise<Event> {
    return this.request('POST', '/api/v1/events', { body: data });
  }

  async getEventAttendees(eventId: string, params?: {
    status?: 'registered' | 'checked_in' | 'cancelled';
    limit?: number;
  }): Promise<{ attendees: Attendee[]; total: number }> {
    return this.request('GET', `/api/v1/events/${eventId}/attendees`, { params });
  }

  // ============ Forms ============

  async listForms(params?: {
    status?: 'draft' | 'published';
    eventId?: string;
  }): Promise<{ forms: Form[]; total: number }> {
    return this.request('GET', '/api/v1/forms', { params });
  }

  async getForm(id: string): Promise<Form> {
    return this.request('GET', `/api/v1/forms/${id}`);
  }

  async submitForm(formId: string, data: Record<string, unknown>): Promise<FormSubmission> {
    return this.request('POST', `/api/v1/forms/${formId}/submit`, { body: data });
  }

  async getFormResponses(formId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ responses: FormSubmission[]; total: number }> {
    return this.request('GET', `/api/v1/forms/${formId}/responses`, { params });
  }

  // ============ Products & Checkout ============

  async listProducts(params?: {
    eventId?: string;
    status?: 'active' | 'sold_out' | 'hidden';
  }): Promise<{ products: Product[]; total: number }> {
    return this.request('GET', '/api/v1/products', { params });
  }

  async createCheckoutSession(data: {
    items: Array<{ productId: string; quantity: number }>;
    contactId?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; checkoutUrl: string }> {
    return this.request('POST', '/api/v1/checkout/sessions', { body: data });
  }

  // ============ Invoicing ============

  async listInvoices(params?: {
    contactId?: string;
    status?: 'draft' | 'sent' | 'paid' | 'overdue';
  }): Promise<{ invoices: Invoice[]; total: number }> {
    return this.request('GET', '/api/v1/invoices', { params });
  }

  async createInvoice(data: InvoiceCreateInput): Promise<Invoice> {
    return this.request('POST', '/api/v1/invoices', { body: data });
  }

  async sendInvoice(id: string): Promise<void> {
    return this.request('POST', `/api/v1/invoices/${id}/send`);
  }

  // ============ Benefits ============

  async listBenefitClaims(params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'paid';
    memberId?: string;
  }): Promise<{ claims: BenefitClaim[]; total: number }> {
    return this.request('GET', '/api/v1/benefits/claims', { params });
  }

  async createBenefitClaim(data: BenefitClaimInput): Promise<BenefitClaim> {
    return this.request('POST', '/api/v1/benefits/claims', { body: data });
  }

  // ============ Internal ============

  private async request<T>(
    method: string,
    path: string,
    options?: { params?: Record<string, unknown>; body?: unknown }
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new L4yercak3Error(response.status, error.message || 'Request failed', error);
    }

    return response.json();
  }
}

export class L4yercak3Error extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'L4yercak3Error';
  }
}

// Singleton instance
let client: L4yercak3Client | null = null;

export function getL4yercak3Client(): L4yercak3Client {
  if (!client) {
    const apiKey = process.env.L4YERCAK3_API_KEY;
    if (!apiKey) {
      throw new Error('L4YERCAK3_API_KEY environment variable is required');
    }
    client = new L4yercak3Client({ apiKey });
  }
  return client;
}
```

### Generated Types

```typescript
// lib/l4yercak3/types.ts

// ============ CRM Types ============

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: 'active' | 'inactive' | 'unsubscribed' | 'archived';
  subtype: 'customer' | 'lead' | 'prospect' | 'partner';
  tags: string[];
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  subtype?: 'customer' | 'lead' | 'prospect' | 'partner';
  tags?: string[];
}

export interface ContactUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: 'active' | 'inactive' | 'unsubscribed';
  tags?: string[];
}

export interface Organization {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  subtype: 'customer' | 'prospect' | 'partner' | 'vendor';
  address?: Address;
  taxId?: string;
  contacts?: Contact[];
  createdAt: string;
  updatedAt: string;
}

// ============ Event Types ============

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  location: string;
  venue?: Venue;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  subtype: 'conference' | 'workshop' | 'webinar' | 'meetup' | 'other';
  maxCapacity?: number;
  imageUrl?: string;
  products?: Product[];
  sponsors?: Sponsor[];
  createdAt: string;
  updatedAt: string;
}

export interface EventCreateInput {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  subtype?: 'conference' | 'workshop' | 'webinar' | 'meetup' | 'other';
  maxCapacity?: number;
}

export interface Attendee {
  id: string;
  contactId: string;
  contact: Contact;
  eventId: string;
  ticketId: string;
  ticketName: string;
  status: 'registered' | 'checked_in' | 'cancelled' | 'no_show';
  checkedInAt?: string;
  registeredAt: string;
}

// ============ Form Types ============

export interface Form {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'closed';
  subtype: 'registration' | 'survey' | 'application' | 'feedback' | 'contact';
  eventId?: string;
  fields: FormField[];
  settings: FormSettings;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'file' | 'textarea';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormSettings {
  submitButtonText: string;
  confirmationMessage: string;
  redirectUrl?: string;
  notifyEmails: string[];
}

export interface FormSubmission {
  id: string;
  formId: string;
  contactId?: string;
  data: Record<string, unknown>;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  submittedAt: string;
}

// ============ Product & Checkout Types ============

export interface Product {
  id: string;
  name: string;
  description?: string;
  priceInCents: number;
  currency: string;
  eventId?: string;
  category?: string;
  status: 'active' | 'sold_out' | 'hidden';
  inventory?: number;
  maxPerOrder?: number;
  salesStart?: string;
  salesEnd?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  contactId: string;
  contact?: Contact;
  items: OrderItem[];
  totalInCents: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  stripePaymentIntentId?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceInCents: number;
}

// ============ Invoice Types ============

export interface Invoice {
  id: string;
  number: string;
  contactId: string;
  contact?: Contact;
  type: 'b2b' | 'b2c';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  notes?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceCreateInput {
  contactId: string;
  type: 'b2b' | 'b2c';
  dueDate: string;
  lineItems: Omit<InvoiceLineItem, 'amount'>[];
  taxRate?: number;
  notes?: string;
}

// ============ Benefits Types ============

export interface BenefitClaim {
  id: string;
  memberId: string;
  memberName: string;
  benefitType: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  description?: string;
  supportingDocuments?: string[];
  submittedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface BenefitClaimInput {
  memberId: string;
  benefitType: string;
  amount: number;
  currency?: string;
  description?: string;
  supportingDocuments?: string[];
}

export interface CommissionPayout {
  id: string;
  memberId: string;
  memberName: string;
  commissionType: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sourceTransaction?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

// ============ Common Types ============

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Venue {
  name: string;
  address: Address;
  capacity?: number;
}

export interface Sponsor {
  id: string;
  organizationId: string;
  organizationName: string;
  level: 'platinum' | 'gold' | 'silver' | 'bronze' | 'community';
  logoUrl?: string;
  websiteUrl?: string;
}

// ============ Pagination ============

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
```

---

## Integration Path 3: MCP-Assisted

**Target User:** Developers using Claude Code who want AI to generate custom integrations.

### What Gets Generated

```
project/
├── .env.local                      # API keys
├── l4yercak3.config.ts             # Configuration
│
├── .claude/                        # Claude Code config
│   └── mcp.json                    # MCP server configuration
│
└── docs/
    └── L4YERCAK3_MCP_GUIDE.md      # Instructions for Claude
```

### MCP Configuration

```json
// .claude/mcp.json (or added to existing)
{
  "mcpServers": {
    "l4yercak3": {
      "command": "npx",
      "args": ["@l4yercak3/cli", "mcp", "start"],
      "env": {
        "L4YERCAK3_CONFIG_PATH": "${workspaceFolder}/.l4yercak3"
      }
    }
  }
}
```

### Generated Guide

```markdown
# L4YERCAK3 MCP Integration Guide

Your project is connected to L4YERCAK3! You can now use Claude Code to build
custom integrations using natural language.

## Available MCP Tools

### CRM (contacts:read, contacts:write)
- `l4yercak3_crm_list_contacts` - List and search contacts
- `l4yercak3_crm_create_contact` - Create new contacts
- `l4yercak3_crm_get_contact` - Get contact details
- `l4yercak3_crm_update_contact` - Update contacts
- `l4yercak3_crm_delete_contact` - Delete contacts
- ... and more

### Events (events:read, events:write)
- `l4yercak3_events_list` - List events
- `l4yercak3_events_create` - Create events
- `l4yercak3_events_get` - Get event details with products/sponsors
- `l4yercak3_events_get_attendees` - List attendees
- ... and more

### Forms (forms:read, forms:write)
- `l4yercak3_forms_list` - List forms
- `l4yercak3_forms_create` - Create forms with fields
- `l4yercak3_forms_get_responses` - Get form submissions
- ... and more

### Code Generation
- `l4yercak3_generate_api_client` - Generate typed API client
- `l4yercak3_generate_component` - Generate React components
- `l4yercak3_generate_hook` - Generate React hooks
- `l4yercak3_generate_page` - Generate Next.js pages

## Example Prompts

1. "Create a contact management page with search, filtering by tags,
   and the ability to add notes"

2. "Build an event registration flow with ticket selection and
   Stripe checkout"

3. "Generate a form builder that lets admins create custom forms
   and view submissions"

4. "Create a dashboard showing CRM contacts, recent events, and
   pending invoices"

5. "Build a mobile-friendly check-in scanner for event attendees"

## Your Configuration

- **Organization:** ${organizationName}
- **Features Enabled:** ${features.join(', ')}
- **API Key:** Stored in .env.local

## Tips

- Claude can read your existing code and generate components that match your style
- Ask Claude to explain what MCP tools are available before starting
- Use Claude to set up webhooks for real-time updates from L4YERCAK3
```

---

## Database Detection & Setup

### Detection Logic

```javascript
// src/detectors/database-detector.js

async function detectDatabase(projectPath) {
  const detections = [];

  // Check for Convex
  if (await fileExists(path.join(projectPath, 'convex'))) {
    detections.push({
      type: 'convex',
      confidence: 'high',
      configPath: 'convex/',
      hasSchema: await fileExists(path.join(projectPath, 'convex/schema.ts')),
    });
  }

  // Check for Supabase
  if (await fileExists(path.join(projectPath, 'supabase'))) {
    detections.push({
      type: 'supabase',
      confidence: 'high',
      configPath: 'supabase/',
    });
  }

  // Check package.json for DB clients
  const packageJson = await readPackageJson(projectPath);
  if (packageJson) {
    if (packageJson.dependencies?.['convex']) {
      detections.push({ type: 'convex', confidence: 'medium', source: 'package.json' });
    }
    if (packageJson.dependencies?.['@supabase/supabase-js']) {
      detections.push({ type: 'supabase', confidence: 'medium', source: 'package.json' });
    }
    if (packageJson.dependencies?.['prisma'] || packageJson.dependencies?.['@prisma/client']) {
      detections.push({ type: 'prisma', confidence: 'medium', source: 'package.json' });
    }
    if (packageJson.dependencies?.['drizzle-orm']) {
      detections.push({ type: 'drizzle', confidence: 'medium', source: 'package.json' });
    }
    if (packageJson.dependencies?.['mongoose']) {
      detections.push({ type: 'mongodb', confidence: 'medium', source: 'package.json' });
    }
  }

  // Check for Prisma schema
  if (await fileExists(path.join(projectPath, 'prisma/schema.prisma'))) {
    detections.push({ type: 'prisma', confidence: 'high', configPath: 'prisma/' });
  }

  // Check for Drizzle
  if (await fileExists(path.join(projectPath, 'drizzle.config.ts'))) {
    detections.push({ type: 'drizzle', confidence: 'high' });
  }

  return {
    hasDatabase: detections.length > 0,
    detections,
    primary: detections.sort((a, b) =>
      (b.confidence === 'high' ? 1 : 0) - (a.confidence === 'high' ? 1 : 0)
    )[0] || null,
  };
}
```

### Database Selection Prompt

```javascript
// In spread.js, after feature selection

const dbDetection = await detectDatabase(projectPath);

if (!dbDetection.hasDatabase && integrationPath === 'quickstart') {
  console.log(chalk.yellow('\n  No database detected in your project.\n'));

  const { database } = await inquirer.prompt([
    {
      type: 'list',
      name: 'database',
      message: 'Which database would you like to use?',
      choices: [
        {
          name: 'Convex (Recommended) - Real-time, serverless, TypeScript-first',
          value: 'convex',
        },
        {
          name: 'Supabase - PostgreSQL with Auth, Storage, and Edge Functions',
          value: 'supabase',
        },
        {
          name: 'None - I\'ll set up my own database later',
          value: 'none',
        },
      ],
    },
  ]);

  if (database !== 'none') {
    await setupDatabase(projectPath, database, selectedFeatures);
  }
} else if (dbDetection.hasDatabase) {
  console.log(chalk.green(`\n  ✓ Detected ${dbDetection.primary.type} database\n`));
}
```

---

## File Structure Summary

```
src/
├── commands/
│   └── spread.js                   # Updated with 3-path flow
│
├── detectors/
│   ├── index.js
│   ├── nextjs-detector.js
│   ├── database-detector.js        # NEW
│   └── ...
│
├── generators/
│   ├── quickstart/                 # NEW - Full stack generation
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── crm.js
│   │   │   ├── events.js
│   │   │   ├── forms.js
│   │   │   ├── checkout.js
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── index.js
│   │   ├── pages/
│   │   │   └── index.js
│   │   └── database/
│   │       ├── convex.js
│   │       └── supabase.js
│   │
│   ├── api-only/                   # NEW - API client generation
│   │   ├── index.js
│   │   ├── client.js
│   │   ├── types.js
│   │   └── webhooks.js
│   │
│   ├── mcp-assisted/               # NEW - MCP setup
│   │   ├── index.js
│   │   ├── config.js
│   │   └── guide.js
│   │
│   └── ... (existing generators)
│
└── templates/                      # NEW - Template files
    ├── components/
    │   ├── ContactList.tsx.template
    │   ├── EventCard.tsx.template
    │   └── ...
    ├── hooks/
    │   ├── useContacts.ts.template
    │   └── ...
    ├── pages/
    │   ├── crm.tsx.template
    │   └── ...
    └── database/
        ├── convex-schema.ts.template
        └── supabase-schema.sql.template
```

---

## Implementation Priority

### Phase 1: Foundation
1. Update `spread.js` with 3-path selection
2. Create database detector
3. Implement API-only generator (client + types)

### Phase 2: Quick Start
4. Create component templates for each feature
5. Implement Convex database setup
6. Implement Supabase database setup
7. Create page generators

### Phase 3: MCP Enhancement
8. Update MCP server config generator
9. Create comprehensive MCP guide generator
10. Add code generation MCP tools

### Phase 4: Polish
11. Add progress indicators
12. Improve error handling
13. Add rollback on failure
14. Write tests

---

## Core Design Principles

### 1. Ontology-First Database Design

Instead of creating separate tables for each entity (contacts, events, forms), we mirror L4YERCAK3's
**ontology pattern** with a universal `objects` table. This provides:

- **Flexibility**: Add new entity types without schema changes
- **Consistency**: Same sync logic for all entity types
- **Compatibility**: Direct mapping to L4YERCAK3 backend structure

```typescript
// The objects table stores ALL entity types
objects: defineTable({
  l4yercak3Id: v.optional(v.string()),     // null if local-only
  type: v.string(),                         // "contact", "event", "form", etc.
  subtype: v.optional(v.string()),          // "customer", "conference", etc.
  name: v.string(),
  status: v.string(),
  customProperties: v.any(),                // Type-specific data
  syncStatus: v.string(),                   // "synced", "pending_push", etc.
})

// Relationships between objects
objectLinks: defineTable({
  fromObjectId: v.id("objects"),
  toObjectId: v.id("objects"),
  linkType: v.string(),                     // "attendee", "sponsor", etc.
})
```

### 2. Frontend User Management

Users authenticate **locally** (OAuth, credentials) but sync to L4YERCAK3 as CRM contacts:

```
┌──────────────────────────────────────────────────────────┐
│  LOCAL (Your App)              │  L4YERCAK3 BACKEND      │
├────────────────────────────────┼─────────────────────────┤
│  NextAuth.js / Supabase Auth   │                         │
│  ├─ OAuth tokens (encrypted)   │                         │
│  ├─ Session management         │                         │
│  ├─ Password hashes            │                         │
│  └─ Provider connections       │                         │
│                                │                         │
│  frontendUsers table ──────────┼──► CRM Contact          │
│  ├─ email, name, image         │    (auto-created)       │
│  ├─ l4yercak3ContactId ◄───────┼─── contactId            │
│  └─ role, metadata             │                         │
│                                │                         │
│  User actions ─────────────────┼──► Activity tracking    │
│  ├─ Event registrations        │    Purchase history     │
│  ├─ Form submissions           │    Engagement metrics   │
│  └─ Purchases                  │                         │
└──────────────────────────────────────────────────────────┘
```

**Why local auth?**
- OAuth redirect URLs must match your domain
- Sessions need low-latency local access
- Tokens must be securely stored locally
- L4YERCAK3 backend tracks the *business relationship*, not auth credentials

### 3. Stripe Integration Pattern

Stripe API calls happen **locally** (your keys, your webhooks), but transactions sync to L4YERCAK3:

```typescript
// Local: Handle Stripe webhook
export async function POST(req: Request) {
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  if (event.type === 'payment_intent.succeeded') {
    // 1. Store locally first (immediate)
    await db.insert('stripePayments', {
      stripePaymentIntentId: event.data.object.id,
      amount: event.data.object.amount,
      status: 'succeeded',
      syncStatus: 'pending_push',
    });

    // 2. Sync to L4YERCAK3 (async)
    await syncPaymentToL4yercak3(event.data.object);
  }
}

// Sync creates Order + Invoice objects in L4YERCAK3
async function syncPaymentToL4yercak3(payment) {
  const order = await l4yercak3.createOrder({
    contactId: payment.metadata.l4yercak3ContactId,
    items: JSON.parse(payment.metadata.items),
    totalInCents: payment.amount,
    stripePaymentIntentId: payment.id,
  });

  // Update local record with L4YERCAK3 ID
  await db.patch(localPaymentId, {
    l4yercak3OrderId: order.id,
    syncStatus: 'synced'
  });
}
```

**What stays local:**
- Stripe API keys and webhook secrets
- Payment intent creation
- Webhook endpoint handling
- Stripe Customer Portal integration

**What syncs to L4YERCAK3:**
- Order records (for CRM, reporting)
- Invoice generation (if B2B)
- Transaction history
- Revenue analytics
- Refund tracking

### 4. Organization Owner Perspective

As an organization owner using L4YERCAK3, your **frontend users** are your customers:

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU (Organization Owner)                                       │
│  └─► L4YERCAK3 Dashboard                                        │
│       ├─► CRM: See all your frontend users as contacts          │
│       ├─► Events: See registrations, check-ins                  │
│       ├─► Forms: See submissions from your users                │
│       ├─► Invoicing: Generate invoices for purchases            │
│       └─► Analytics: User engagement, revenue, etc.             │
│                                                                 │
│  YOUR APP (Built with L4YERCAK3 CLI)                            │
│  └─► Your frontend users                                        │
│       ├─► Sign up/login (local auth)                            │
│       ├─► Browse events, register (syncs to L4YERCAK3)          │
│       ├─► Fill forms (syncs to L4YERCAK3)                       │
│       ├─► Purchase tickets (Stripe local, syncs order)          │
│       └─► View their profile, history (reads from local + sync) │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Convex - Full)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // ONTOLOGY: Universal object storage
  // ============================================

  objects: defineTable({
    // L4YERCAK3 sync
    l4yercak3Id: v.optional(v.string()),
    organizationId: v.string(),

    // Core fields (all objects have these)
    type: v.string(),                         // "contact", "event", "form", "product", "order"
    subtype: v.optional(v.string()),          // Type-specific classification
    name: v.string(),
    status: v.string(),

    // Type-specific data
    customProperties: v.any(),

    // Sync tracking
    syncStatus: v.union(
      v.literal("synced"),
      v.literal("pending_push"),
      v.literal("pending_pull"),
      v.literal("conflict"),
      v.literal("local_only")
    ),
    syncedAt: v.optional(v.number()),
    localVersion: v.number(),
    remoteVersion: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),        // Soft delete
  })
    .index("by_l4yercak3_id", ["l4yercak3Id"])
    .index("by_type", ["type"])
    .index("by_type_status", ["type", "status"])
    .index("by_type_subtype", ["type", "subtype"])
    .index("by_sync_status", ["syncStatus"])
    .index("by_updated", ["updatedAt"]),

  objectLinks: defineTable({
    l4yercak3Id: v.optional(v.string()),
    fromObjectId: v.id("objects"),
    toObjectId: v.id("objects"),
    linkType: v.string(),
    metadata: v.optional(v.any()),
    syncStatus: v.string(),
    createdAt: v.number(),
  })
    .index("by_from", ["fromObjectId"])
    .index("by_to", ["toObjectId"])
    .index("by_from_type", ["fromObjectId", "linkType"])
    .index("by_to_type", ["toObjectId", "linkType"]),

  // ============================================
  // AUTHENTICATION: Local user management
  // ============================================

  frontendUsers: defineTable({
    // L4YERCAK3 sync
    l4yercak3ContactId: v.optional(v.string()),
    l4yercak3FrontendUserId: v.optional(v.string()),
    organizationId: v.string(),

    // Core identity
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Local auth
    passwordHash: v.optional(v.string()),     // If using credentials

    // OAuth (stored locally, not synced)
    oauthAccounts: v.array(v.object({
      provider: v.string(),
      providerAccountId: v.string(),
      accessToken: v.optional(v.string()),
      refreshToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
      scope: v.optional(v.string()),
    })),

    // App-specific
    role: v.string(),                         // "user", "admin", "moderator"
    preferences: v.optional(v.object({
      language: v.optional(v.string()),
      timezone: v.optional(v.string()),
      theme: v.optional(v.string()),
      emailNotifications: v.optional(v.boolean()),
    })),

    // Sync
    syncStatus: v.string(),
    syncedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_l4yercak3_contact", ["l4yercak3ContactId"])
    .index("by_oauth", ["oauthAccounts"]),

  sessions: defineTable({
    userId: v.id("frontendUsers"),
    sessionToken: v.string(),
    expiresAt: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_token", ["sessionToken"])
    .index("by_user", ["userId"]),

  // ============================================
  // STRIPE: Local payment handling
  // ============================================

  stripeCustomers: defineTable({
    frontendUserId: v.id("frontendUsers"),
    stripeCustomerId: v.string(),
    l4yercak3ContactId: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    defaultPaymentMethodId: v.optional(v.string()),
    syncStatus: v.string(),
    createdAt: v.number(),
  })
    .index("by_stripe_id", ["stripeCustomerId"])
    .index("by_user", ["frontendUserId"]),

  stripePayments: defineTable({
    stripePaymentIntentId: v.string(),
    stripeCustomerId: v.optional(v.string()),
    frontendUserId: v.optional(v.id("frontendUsers")),

    // Payment details
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    paymentMethod: v.optional(v.string()),

    // What was purchased
    metadata: v.object({
      type: v.string(),                       // "event_ticket", "product", "subscription"
      items: v.array(v.object({
        objectId: v.optional(v.id("objects")),
        l4yercak3ProductId: v.optional(v.string()),
        name: v.string(),
        quantity: v.number(),
        priceInCents: v.number(),
      })),
      eventId: v.optional(v.string()),
    }),

    // L4YERCAK3 sync
    l4yercak3OrderId: v.optional(v.string()),
    l4yercak3InvoiceId: v.optional(v.string()),
    syncStatus: v.string(),
    syncedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_stripe_id", ["stripePaymentIntentId"])
    .index("by_customer", ["stripeCustomerId"])
    .index("by_user", ["frontendUserId"])
    .index("by_sync_status", ["syncStatus"]),

  stripeSubscriptions: defineTable({
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    frontendUserId: v.id("frontendUsers"),

    status: v.string(),
    priceId: v.string(),
    productId: v.string(),

    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),

    l4yercak3SubscriptionId: v.optional(v.string()),
    syncStatus: v.string(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stripe_id", ["stripeSubscriptionId"])
    .index("by_user", ["frontendUserId"]),

  // ============================================
  // SYNC: Job tracking
  // ============================================

  syncJobs: defineTable({
    entityType: v.string(),
    direction: v.union(v.literal("push"), v.literal("pull"), v.literal("bidirectional")),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),

    cursor: v.optional(v.string()),
    processedCount: v.number(),
    totalCount: v.optional(v.number()),

    errorMessage: v.optional(v.string()),
    errorDetails: v.optional(v.any()),

    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_entity", ["entityType"]),

  syncConflicts: defineTable({
    objectId: v.id("objects"),
    localVersion: v.any(),
    remoteVersion: v.any(),
    conflictType: v.string(),                 // "update_conflict", "delete_conflict"
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),       // "local_wins", "remote_wins", "merged"
    createdAt: v.number(),
  })
    .index("by_object", ["objectId"])
    .index("by_unresolved", ["resolvedAt"]),
});
```

---

## Notes

- **MCP is always available** - Even Quick Start users can use Claude Code to customize
- **Database is optional** - API-only path doesn't require local DB
- **Sync is bidirectional** - Quick Start includes L4YERCAK3 ↔ Local DB sync
- **Templates are customizable** - Users can modify generated code
- **Type safety throughout** - Full TypeScript support in all paths
- **Ontology pattern** - Universal objects table mirrors L4YERCAK3 backend
- **Local auth** - OAuth/credentials handled locally, users sync as CRM contacts
- **Local Stripe** - Payment processing local, transactions sync to L4YERCAK3
