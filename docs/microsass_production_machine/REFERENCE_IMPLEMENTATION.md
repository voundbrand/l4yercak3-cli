# L4YERCAK3 CLI - Reference Implementation Analysis

**Source:** HaffNet L4YerCak3 Frontend (`/.kiro/haffnet-l4yercak3/`)

This document analyzes the real-world HaffNet integration to inform CLI code generation.

---

## Overview

HaffNet is a **medical education platform** (CME courses) built on:
- **Next.js 16** + TypeScript
- **Convex** (frontend real-time database + auth)
- **L4YERCAK3 Backend** (CRM, events, checkout, invoicing)

This is the **gold standard** for how external apps should connect to L4YERCAK3.

---

## Architecture Pattern: Dual Database

### The Key Insight

HaffNet uses **TWO databases**:

1. **Convex (Frontend)** - Fast, real-time, local to the app
   - User authentication (sessions, passwords)
   - CMS content (page configs, checkout instances)
   - Local user profiles

2. **L4YERCAK3 Backend** - Business logic, shared data
   - CRM contacts
   - Events & products
   - Checkout & transactions
   - Invoicing
   - Workflows

### Why This Pattern?

| Concern | Convex (Frontend) | L4YERCAK3 (Backend) |
|---------|-------------------|---------------------|
| **Auth speed** | ✅ < 50ms | ❌ ~200ms |
| **Real-time** | ✅ Native | ❌ Polling |
| **CRM data** | ❌ Duplication | ✅ Source of truth |
| **Business logic** | ❌ None | ✅ Workflows |
| **Invoicing** | ❌ None | ✅ Full system |
| **Multi-app sharing** | ❌ Isolated | ✅ Central |

### User Sync Pattern

```typescript
// STEP 1: Create Convex auth user (fast)
const convexUser = await convexAuth.register({
  email, password, firstName, lastName
});

// STEP 2: Create Backend user (links to CRM)
const backendUser = await userApi.registerUser({
  email, firstName, lastName,
  convexUserId: convexUser._id  // Link for sync
});

// Result: User exists in both systems, linked by IDs
// convexUser._id ↔ backendUser.frontendUserId
// backendUser.crmContactId → CRM contact
```

---

## API Client Structure

The CLI should generate an API client similar to HaffNet's `src/lib/api-client.ts`:

### Core Pattern

```typescript
// Environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID;

// Base fetch wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}
```

### Module Organization

```typescript
// Event API
export const eventApi = {
  getEvents(params?: { status?, upcoming?, limit? }),
  getEvent(eventId: string),
  getEventProducts(eventId: string),
};

// Form API
export const formApi = {
  getPublicForm(formId: string),
  submitForm({ formId, responses, metadata }),
};

// Checkout API (main registration flow)
export const checkoutApi = {
  submitRegistration(data: RegistrationInput, checkoutInstanceId: string),
};

// Ticket API
export const ticketApi = {
  getTicket(ticketId: string),
  verifyTicket(ticketId: string),
};

// Transaction API
export const transactionApi = {
  getTransaction(transactionId: string),
  getTicketByTransaction(transactionId: string),
};

// User API (sync with Backend)
export const userApi = {
  registerUser(userData: {
    email, firstName, lastName, convexUserId
  }),
};
```

---

## Universal Event Pattern

The most important pattern from HaffNet is the **workflow trigger API**:

```typescript
POST /api/v1/workflows/trigger
Authorization: Bearer {API_KEY}

{
  "trigger": "registration_complete",
  "inputData": {
    "eventType": "seminar_registration",
    "source": "haffnet_website",
    "eventId": "event_xxx",

    "customerData": {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+49123456789",
      "organization": "Hospital Name"
    },

    "formResponses": {
      "specialty": "Cardiology",
      "dietary_requirements": "vegetarian"
    },

    "transactionData": {
      "productId": "product_xxx",
      "price": 0,
      "currency": "EUR"
    }
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "ticketId": "ticket_xxx",
  "invoiceId": "invoice_xxx",
  "crmContactId": "contact_xxx",
  "frontendUserId": "user_xxx",
  "isGuestRegistration": true,
  "downloadUrls": {
    "tickets": "https://...",
    "invoice": "https://..."
  }
}
```

---

## Type Definitions to Generate

### Event Type
```typescript
interface Event {
  id: string;
  name: string;
  description?: string;
  subtype: string;           // "symposium", "workshop", etc.
  status: string;            // "draft", "published", "completed"

  // Flattened from customProperties
  startDate?: number;
  endDate?: number;
  location?: string;
  capacity?: number;
  registrations?: number;
  registrationFormId?: string;
  checkoutInstanceId?: string;
  agenda?: AgendaItem[];

  // Legacy nested format
  customProperties?: {
    startDate?: number;
    endDate?: number;
    location?: string;
    venue?: string;
    address?: Address;
    registration?: {
      enabled: boolean;
      openDate: number;
      closeDate: number;
    };
  };
}
```

### Product Type
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  type: string;
  subtype: string;
  status: string;
  customProperties: {
    price: number;
    currency: string;
    sold: number;
    categoryCode: string;
    categoryLabel: string;
    invoiceConfig?: {
      employerSourceField: string;
      employerMapping: Record<string, string>;
      defaultPaymentTerms: string;
    };
    addons: ProductAddon[];
  };
}
```

### Registration Input
```typescript
interface RegistrationInput {
  eventId: string;
  formId: string;

  products: Array<{
    productId: string;
    quantity: number;
  }>;

  customerData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    salutation?: string;
    title?: string;
    organization?: string;
  };

  formResponses: Record<string, unknown>;

  transactionData: {
    currency: string;
    breakdown: {
      basePrice: number;
      addons?: Array<{
        id: string;
        name: string;
        quantity: number;
        pricePerUnit: number;
        total: number;
      }>;
      subtotal: number;
      tax?: number;
      total: number;
    };
  };

  metadata?: {
    source: string;
    ipAddress?: string;
    userAgent?: string;
  };
}
```

---

## Files CLI Should Generate

Based on HaffNet, the CLI `spread` command should generate:

### 1. API Client (`src/lib/layercake.ts`)
```
- Base fetch wrapper with auth
- Event API module
- Form API module
- Checkout API module
- Ticket API module
- Transaction API module
- User API module (if auth feature selected)
- Full TypeScript types
```

### 2. Environment File (`.env.local`)
```bash
# L4YERCAK3 Backend
NEXT_PUBLIC_API_URL=https://agreeable-lion-828.convex.site/api/v1
NEXT_PUBLIC_API_KEY=org_xxx_yyy
NEXT_PUBLIC_ORG_ID=xxx

# Optional: Convex (if dual-db pattern)
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOYMENT=dev:xxx
```

### 3. Auth Integration (`src/lib/layercake-auth.ts`)
```typescript
// Only if OAuth feature selected
// User sync between frontend auth and Backend CRM
```

### 4. Hooks (`src/hooks/useLayercake.ts`)
```typescript
// React hooks for common operations
useEvents()
useEvent(id)
useCheckout()
```

### 5. Types (`src/types/layercake.ts`)
```typescript
// All type definitions
Event, Product, Ticket, Transaction, Form, etc.
```

---

## Feature Flags from HaffNet

Features that can be enabled/disabled:

| Feature | Files Generated |
|---------|-----------------|
| **events** | Event API, Event types |
| **forms** | Form API, Form types |
| **checkout** | Checkout API, Registration types |
| **tickets** | Ticket API, Ticket types |
| **invoicing** | Invoice types (accessed via checkout) |
| **user-sync** | User API, Auth sync hooks |
| **crm** | Contact API, CRM types |

---

## Convex CMS Pattern

HaffNet uses Convex for CMS content. The CLI could generate:

### convex-client.ts
```typescript
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

/**
 * Get published page content from CMS
 */
export async function getPageContent(orgSlug: string, pagePath: string) {
  // Fetch from Convex CMS
}

/**
 * Extract checkout instance ID from page content
 */
export function getCheckoutInstanceId(pageContent: PageContent): string | null {
  return pageContent?.content?.checkout?.checkoutInstanceId || null;
}

/**
 * Check if page has checkout configured
 */
export function hasCheckoutConfigured(pageContent: PageContent): boolean {
  return !!getCheckoutInstanceId(pageContent);
}
```

---

## Error Handling Patterns

From HaffNet:

```typescript
// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Response handling
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Check content type before parsing
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status}`);
    } else {
      const errorText = await response.text();
      console.error('API Error Response (non-JSON):', errorText.substring(0, 500));
      throw new Error(`API Error: ${response.status}`);
    }
  }

  if (!isJson) {
    throw new Error('API returned non-JSON response');
  }

  return response.json();
}
```

---

## Security Practices

From HaffNet:

1. **API key in server-side only**
   - Use `NEXT_PUBLIC_` prefix carefully
   - Server actions for sensitive operations

2. **Honeypot spam protection**
   ```typescript
   body: JSON.stringify({
     responses: data.responses,
     bot_trap: '', // Must be empty for legitimate submissions
   })
   ```

3. **Rate limiting awareness**
   - Document: 5 submissions/hour per IP for public forms

4. **Input validation**
   - Zod schemas before API calls
   - Field-level error messages

---

## Documentation Structure

HaffNet has 25+ documentation files. Key ones:

| Document | Purpose |
|----------|---------|
| `README.md` | Overview & navigation |
| `QUICK_REFERENCE.md` | One-page cheat sheet |
| `API_SPECIFICATION.md` | Complete API reference |
| `UNIVERSAL_EVENT_PAYLOAD.md` | Event structure |
| `FRONTEND_INTEGRATION.md` | Code examples |
| `USER_SYNC_ARCHITECTURE.md` | Dual-DB pattern |

**CLI should generate similar docs for each project.**

---

## CLI Generation Templates

Based on HaffNet, create templates:

### Template: `api-client.template.ts`
Full API client with all modules

### Template: `types.template.ts`
All TypeScript type definitions

### Template: `hooks.template.ts`
React hooks for data fetching

### Template: `auth-sync.template.ts`
User sync between auth systems

### Template: `README.template.md`
Project-specific documentation

---

## Summary: What CLI Should Do

1. **Detect** existing project structure (Next.js, Convex, etc.)
2. **Ask** which features to enable (events, forms, checkout, etc.)
3. **Generate** API client with only needed modules
4. **Generate** TypeScript types for enabled features
5. **Generate** hooks for common operations
6. **Generate** auth sync if user-sync enabled
7. **Create** environment template
8. **Create** documentation for the integration
9. **Register** the connection in L4YERCAK3 backend

---

*This analysis based on production code from HaffNet L4YerCak3 Frontend*
