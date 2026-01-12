# L4YERCAK3 MCP Server Extension Guide

## Purpose

This document outlines the MCP (Model Context Protocol) tools needed to enable Claude Code to effectively build mobile applications that integrate with the L4YERCAK3 backend. The goal is to expose read/write capabilities for core business objects so AI assistants can generate, test, and iterate on mobile app features.

---

## Current State

### Existing MCP Tools

| Tool | Purpose | Status |
|------|---------|--------|
| `l4yercak3_check_auth_status` | Verify user authentication | ✅ Working |
| `l4yercak3_get_capabilities` | List available features by category | ✅ Working |
| `l4yercak3_list_organizations` | Get user's organizations | ✅ Working |
| `l4yercak3_switch_organization` | Change org context | ✅ Working |
| `l4yercak3_create_organization` | Create new org | ✅ Working |
| `l4yercak3_get_application` | Get connected app details | ✅ Working |
| `l4yercak3_list_applications` | List connected apps | ⚠️ Error |
| `l4yercak3_analyze_schema` | Analyze database schemas | ✅ Working |
| `l4yercak3_suggest_model_mappings` | Suggest L4YERCAK3 type mappings | ✅ Working |
| `l4yercak3_generate_api_client` | Generate TypeScript client | ✅ Working |
| `l4yercak3_generate_sync_adapter` | Generate sync code | ✅ Working |
| `l4yercak3_generate_webhook_handler` | Generate webhook handlers | ✅ Working |
| `l4yercak3_generate_env_template` | Generate .env template | ✅ Working |

### What's Missing

The current MCP server is optimized for **code generation** but lacks **data access** capabilities. To build and test mobile apps effectively, Claude needs to:

1. **Read real data** to understand schemas and test UI
2. **Write test data** to verify functionality
3. **Query relationships** between objects
4. **Validate business logic** against actual backend behavior

---

## Required New MCP Tools

### Priority 1: Core Data Access (Must Have)

These tools are essential for building any mobile app feature.

#### 1.1 Events Module

```typescript
// l4yercak3_events_list
{
  name: "l4yercak3_events_list",
  description: "List events for the current organization. Returns published and draft events with pagination.",
  parameters: {
    status?: "draft" | "published" | "cancelled" | "completed",
    limit?: number,        // Default: 20, Max: 100
    offset?: number,       // For pagination
    startDateAfter?: string,  // ISO date - filter future events
    startDateBefore?: string, // ISO date - filter past events
    search?: string,       // Search by name/description
  },
  returns: {
    events: Array<{
      id: string,
      name: string,
      description: string,
      status: string,
      startDate: string,
      endDate: string,
      venue: { name: string, address: string, city: string } | null,
      imageUrl: string | null,
      ticketCount: number,
      attendeeCount: number,
    }>,
    total: number,
    hasMore: boolean,
  }
}

// l4yercak3_events_get
{
  name: "l4yercak3_events_get",
  description: "Get detailed information about a specific event including tickets, agenda, and sponsors.",
  parameters: {
    eventId: string,  // Required
    include?: Array<"tickets" | "agenda" | "sponsors" | "forms">,
  },
  returns: {
    event: {
      id: string,
      name: string,
      description: string,
      status: string,
      startDate: string,
      endDate: string,
      timezone: string,
      venue: { ... } | null,
      imageUrl: string | null,
      bannerUrl: string | null,
      // Included if requested:
      tickets?: Array<{ id, name, price, currency, available, sold }>,
      agenda?: Array<{ id, title, startTime, endTime, speaker, track }>,
      sponsors?: Array<{ id, name, tier, logoUrl }>,
      forms?: Array<{ id, name, type, fieldCount }>,
    }
  }
}

// l4yercak3_events_get_attendees
{
  name: "l4yercak3_events_get_attendees",
  description: "Get attendees for an event with their ticket and check-in status.",
  parameters: {
    eventId: string,
    status?: "registered" | "checked_in" | "cancelled",
    ticketId?: string,    // Filter by ticket type
    search?: string,      // Search by name/email
    limit?: number,
    offset?: number,
  },
  returns: {
    attendees: Array<{
      id: string,
      contactId: string,
      name: string,
      email: string,
      ticketName: string,
      ticketId: string,
      status: string,
      checkedInAt: string | null,
      registeredAt: string,
      formResponses?: Record<string, any>,
    }>,
    total: number,
    hasMore: boolean,
  }
}
```

#### 1.2 Tickets Module

```typescript
// l4yercak3_tickets_list
{
  name: "l4yercak3_tickets_list",
  description: "List ticket products for an event or all tickets in the organization.",
  parameters: {
    eventId?: string,     // Filter by event
    status?: "active" | "sold_out" | "hidden",
    limit?: number,
    offset?: number,
  },
  returns: {
    tickets: Array<{
      id: string,
      eventId: string,
      eventName: string,
      name: string,
      description: string,
      price: number,
      currency: string,
      quantity: number,
      sold: number,
      available: number,
      salesStart: string | null,
      salesEnd: string | null,
      status: string,
    }>,
    total: number,
    hasMore: boolean,
  }
}

// l4yercak3_tickets_get_purchased
{
  name: "l4yercak3_tickets_get_purchased",
  description: "Get purchased tickets for a contact or the current user.",
  parameters: {
    contactId?: string,   // If omitted, returns current user's tickets
    eventId?: string,     // Filter by event
    status?: "valid" | "used" | "refunded" | "expired",
    limit?: number,
    offset?: number,
  },
  returns: {
    purchasedTickets: Array<{
      id: string,
      ticketId: string,
      ticketName: string,
      eventId: string,
      eventName: string,
      eventDate: string,
      purchasedAt: string,
      status: string,
      qrCode: string,           // QR code data for scanning
      confirmationNumber: string,
      price: number,
      currency: string,
    }>,
    total: number,
  }
}
```

#### 1.3 CRM Module

```typescript
// l4yercak3_crm_list_contacts
{
  name: "l4yercak3_crm_list_contacts",
  description: "List contacts in the CRM with filtering and search.",
  parameters: {
    type?: "individual" | "organization",
    status?: "active" | "archived",
    tags?: string[],
    pipelineStage?: string,
    search?: string,      // Search name, email, phone
    limit?: number,
    offset?: number,
    orderBy?: "name" | "createdAt" | "updatedAt",
    orderDir?: "asc" | "desc",
  },
  returns: {
    contacts: Array<{
      id: string,
      type: string,
      firstName: string | null,
      lastName: string | null,
      displayName: string,
      email: string | null,
      phone: string | null,
      organizationId: string | null,
      organizationName: string | null,
      tags: string[],
      pipelineStage: string | null,
      avatarUrl: string | null,
      createdAt: string,
    }>,
    total: number,
    hasMore: boolean,
  }
}

// l4yercak3_crm_get_contact
{
  name: "l4yercak3_crm_get_contact",
  description: "Get detailed contact information including activities and linked objects.",
  parameters: {
    contactId: string,
    include?: Array<"activities" | "notes" | "tickets" | "invoices" | "forms">,
  },
  returns: {
    contact: {
      id: string,
      type: string,
      firstName: string | null,
      lastName: string | null,
      displayName: string,
      email: string | null,
      phone: string | null,
      address: { street, city, state, postalCode, country } | null,
      organizationId: string | null,
      organizationName: string | null,
      tags: string[],
      customFields: Record<string, any>,
      pipelineStage: string | null,
      avatarUrl: string | null,
      createdAt: string,
      updatedAt: string,
      // Included if requested:
      activities?: Array<{ id, type, subject, date, notes }>,
      notes?: Array<{ id, content, createdAt, createdBy }>,
      tickets?: Array<{ id, eventName, ticketName, status }>,
      invoices?: Array<{ id, number, amount, status, dueDate }>,
      forms?: Array<{ id, formName, submittedAt }>,
    }
  }
}

// l4yercak3_crm_create_contact
{
  name: "l4yercak3_crm_create_contact",
  description: "Create a new contact in the CRM.",
  parameters: {
    type: "individual" | "organization",
    firstName?: string,
    lastName?: string,
    email?: string,
    phone?: string,
    organizationId?: string,  // Link to parent organization
    address?: { street?, city?, state?, postalCode?, country? },
    tags?: string[],
    customFields?: Record<string, any>,
    pipelineStage?: string,
  },
  returns: {
    contactId: string,
    contact: { ... },
  }
}

// l4yercak3_crm_update_contact
{
  name: "l4yercak3_crm_update_contact",
  description: "Update an existing contact.",
  parameters: {
    contactId: string,
    firstName?: string,
    lastName?: string,
    email?: string,
    phone?: string,
    organizationId?: string,
    address?: { ... },
    tags?: string[],
    customFields?: Record<string, any>,
    pipelineStage?: string,
  },
  returns: {
    success: boolean,
    contact: { ... },
  }
}

// l4yercak3_crm_list_organizations
{
  name: "l4yercak3_crm_list_organizations",
  description: "List organization contacts (companies, employers) in the CRM.",
  parameters: {
    status?: "active" | "archived",
    industry?: string,
    search?: string,
    limit?: number,
    offset?: number,
  },
  returns: {
    organizations: Array<{
      id: string,
      name: string,
      industry: string | null,
      website: string | null,
      email: string | null,
      phone: string | null,
      employeeCount: number,
      address: { ... } | null,
      createdAt: string,
    }>,
    total: number,
    hasMore: boolean,
  }
}
```

#### 1.4 Forms Module

```typescript
// l4yercak3_forms_list
{
  name: "l4yercak3_forms_list",
  description: "List forms in the organization.",
  parameters: {
    type?: "registration" | "survey" | "application" | "feedback",
    eventId?: string,
    status?: "draft" | "active" | "closed",
    limit?: number,
    offset?: number,
  },
  returns: {
    forms: Array<{
      id: string,
      name: string,
      type: string,
      status: string,
      eventId: string | null,
      eventName: string | null,
      fieldCount: number,
      responseCount: number,
      createdAt: string,
    }>,
    total: number,
    hasMore: boolean,
  }
}

// l4yercak3_forms_get
{
  name: "l4yercak3_forms_get",
  description: "Get form details including field definitions.",
  parameters: {
    formId: string,
  },
  returns: {
    form: {
      id: string,
      name: string,
      description: string,
      type: string,
      status: string,
      eventId: string | null,
      fields: Array<{
        id: string,
        type: "text" | "email" | "phone" | "select" | "multiselect" | "checkbox" | "date" | "file" | "number",
        label: string,
        required: boolean,
        options?: string[],
        placeholder?: string,
        validation?: { min?, max?, pattern? },
        conditionalOn?: { fieldId: string, value: any },
      }>,
      settings: {
        submitButtonText: string,
        confirmationMessage: string,
        redirectUrl: string | null,
        notifyEmails: string[],
      },
      createdAt: string,
      updatedAt: string,
    }
  }
}

// l4yercak3_forms_get_responses
{
  name: "l4yercak3_forms_get_responses",
  description: "Get form submissions/responses.",
  parameters: {
    formId: string,
    contactId?: string,
    startDate?: string,
    endDate?: string,
    limit?: number,
    offset?: number,
  },
  returns: {
    responses: Array<{
      id: string,
      formId: string,
      contactId: string | null,
      contactName: string | null,
      contactEmail: string | null,
      data: Record<string, any>,  // Field responses
      submittedAt: string,
      status: "submitted" | "reviewed" | "approved" | "rejected",
    }>,
    total: number,
    hasMore: boolean,
  }
}
```

### Priority 2: User & Auth Context (Important)

These tools provide user context needed for personalization.

```typescript
// l4yercak3_get_current_user
{
  name: "l4yercak3_get_current_user",
  description: "Get the currently authenticated user's profile and permissions.",
  parameters: {},
  returns: {
    user: {
      id: string,
      email: string,
      firstName: string | null,
      lastName: string | null,
      displayName: string,
      avatarUrl: string | null,
      role: string,
      permissions: string[],
      preferences: {
        language: string,
        timezone: string,
        theme: "light" | "dark" | "system",
      },
      organizations: Array<{
        id: string,
        name: string,
        slug: string,
        role: string,
        isDefault: boolean,
      }>,
      currentOrganization: {
        id: string,
        name: string,
        slug: string,
        role: string,
      } | null,
    }
  }
}

// l4yercak3_get_organization_details
{
  name: "l4yercak3_get_organization_details",
  description: "Get detailed information about an organization including settings and subscription.",
  parameters: {
    organizationId?: string,  // If omitted, uses current org
  },
  returns: {
    organization: {
      id: string,
      name: string,
      slug: string,
      businessName: string | null,
      logo: string | null,
      website: string | null,
      industry: string | null,
      address: { ... } | null,
      subscription: {
        plan: "free" | "pro" | "business" | "enterprise",
        status: "active" | "trialing" | "past_due" | "cancelled",
        trialEndsAt: string | null,
        currentPeriodEnd: string | null,
      },
      settings: {
        defaultCurrency: string,
        defaultTimezone: string,
        defaultLanguage: string,
      },
      features: string[],  // Enabled features based on plan
      memberCount: number,
      createdAt: string,
    }
  }
}
```

### Priority 3: Invoicing & Payments (Nice to Have)

```typescript
// l4yercak3_invoices_list
{
  name: "l4yercak3_invoices_list",
  description: "List invoices for the organization.",
  parameters: {
    contactId?: string,
    status?: "draft" | "sent" | "paid" | "overdue" | "cancelled",
    type?: "b2b" | "b2c",
    startDate?: string,
    endDate?: string,
    limit?: number,
    offset?: number,
  },
  returns: {
    invoices: Array<{
      id: string,
      number: string,
      contactId: string,
      contactName: string,
      type: string,
      status: string,
      amount: number,
      currency: string,
      dueDate: string,
      paidAt: string | null,
      lineItemCount: number,
      createdAt: string,
    }>,
    total: number,
    hasMore: boolean,
  }
}

// l4yercak3_invoices_get
{
  name: "l4yercak3_invoices_get",
  description: "Get detailed invoice information.",
  parameters: {
    invoiceId: string,
  },
  returns: {
    invoice: {
      id: string,
      number: string,
      contactId: string,
      contact: { name, email, address },
      type: string,
      status: string,
      issueDate: string,
      dueDate: string,
      paidAt: string | null,
      lineItems: Array<{
        description: string,
        quantity: number,
        unitPrice: number,
        amount: number,
      }>,
      subtotal: number,
      tax: number,
      taxRate: number,
      total: number,
      currency: string,
      notes: string | null,
      pdfUrl: string | null,
    }
  }
}

// l4yercak3_payments_list
{
  name: "l4yercak3_payments_list",
  description: "List payment transactions.",
  parameters: {
    contactId?: string,
    status?: "pending" | "succeeded" | "failed" | "refunded",
    startDate?: string,
    endDate?: string,
    limit?: number,
    offset?: number,
  },
  returns: {
    payments: Array<{
      id: string,
      amount: number,
      currency: string,
      status: string,
      method: "card" | "bank_transfer" | "paypal",
      contactId: string,
      contactName: string,
      invoiceId: string | null,
      invoiceNumber: string | null,
      description: string,
      processedAt: string,
    }>,
    total: number,
    hasMore: boolean,
  }
}
```

### Priority 4: Check-in & Scanning (Mobile-Specific)

```typescript
// l4yercak3_checkin_scan
{
  name: "l4yercak3_checkin_scan",
  description: "Validate and check-in an attendee by scanning their ticket QR code.",
  parameters: {
    qrCode: string,       // The scanned QR code data
    eventId: string,      // Event context for validation
  },
  returns: {
    valid: boolean,
    status: "success" | "already_checked_in" | "invalid" | "wrong_event" | "expired",
    message: string,
    attendee?: {
      id: string,
      name: string,
      email: string,
      ticketName: string,
      checkedInAt: string,
      photoUrl: string | null,
    },
  }
}

// l4yercak3_checkin_manual
{
  name: "l4yercak3_checkin_manual",
  description: "Manually check-in an attendee by name or email lookup.",
  parameters: {
    eventId: string,
    search: string,       // Name or email to search
  },
  returns: {
    matches: Array<{
      attendeeId: string,
      name: string,
      email: string,
      ticketName: string,
      status: "registered" | "checked_in",
      checkedInAt: string | null,
    }>,
  }
}

// l4yercak3_checkin_confirm
{
  name: "l4yercak3_checkin_confirm",
  description: "Confirm check-in for a specific attendee (after manual lookup).",
  parameters: {
    attendeeId: string,
    eventId: string,
  },
  returns: {
    success: boolean,
    attendee: {
      id: string,
      name: string,
      checkedInAt: string,
    },
  }
}
```

### Priority 5: Certificates (Professional Use)

```typescript
// l4yercak3_certificates_list
{
  name: "l4yercak3_certificates_list",
  description: "List certificates issued to a contact or for an event.",
  parameters: {
    contactId?: string,
    eventId?: string,
    type?: "cme" | "cle" | "cpe" | "attendance" | "completion",
    limit?: number,
    offset?: number,
  },
  returns: {
    certificates: Array<{
      id: string,
      type: string,
      title: string,
      recipientId: string,
      recipientName: string,
      eventId: string | null,
      eventName: string | null,
      credits: number | null,
      creditType: string | null,
      issuedAt: string,
      expiresAt: string | null,
      verificationUrl: string,
      pdfUrl: string,
    }>,
    total: number,
    hasMore: boolean,
  }
}

// l4yercak3_certificates_verify
{
  name: "l4yercak3_certificates_verify",
  description: "Verify a certificate by its verification code.",
  parameters: {
    verificationCode: string,
  },
  returns: {
    valid: boolean,
    certificate?: {
      id: string,
      type: string,
      title: string,
      recipientName: string,
      issuedAt: string,
      expiresAt: string | null,
      credits: number | null,
      creditType: string | null,
      issuerOrganization: string,
    },
    message?: string,  // If invalid
  }
}
```

---

## Implementation Guidelines

### Authentication

All MCP tools should use the existing authentication flow:

```typescript
// Every tool should validate auth first
const authStatus = await checkAuthStatus();
if (!authStatus.authenticated) {
  return {
    error: "Not authenticated",
    loginInstructions: "Run 'l4yercak3 login' in terminal",
  };
}
```

### Organization Context

Tools that access org-scoped data should:

1. Use the current organization from auth context
2. Optionally accept `organizationId` parameter to override
3. Validate user has access to the specified org

```typescript
// Pattern for org-scoped tools
parameters: {
  organizationId?: string,  // Optional override
  // ... other params
}

// In handler:
const orgId = args.organizationId || authContext.currentOrganizationId;
if (!orgId) {
  return { error: "No organization selected. Use l4yercak3_switch_organization first." };
}
```

### Error Handling

Return structured errors:

```typescript
// Success
{ success: true, data: { ... } }

// Client error (4xx equivalent)
{ error: "Contact not found", code: "NOT_FOUND" }

// Validation error
{ error: "Invalid email format", code: "VALIDATION_ERROR", field: "email" }

// Permission error
{ error: "Access denied", code: "FORBIDDEN" }

// Server error (5xx equivalent)
{ error: "Internal server error", code: "INTERNAL_ERROR" }
```

### Pagination Pattern

Use consistent pagination:

```typescript
parameters: {
  limit?: number,   // Default: 20, Max: 100
  offset?: number,  // Default: 0
}

returns: {
  items: [...],
  total: number,
  hasMore: boolean,
  // Optionally:
  nextOffset?: number,
}
```

### Backend Mapping

Map MCP tools to existing Convex functions:

| MCP Tool | Convex Function |
|----------|-----------------|
| `l4yercak3_events_list` | `eventsOntology.getEvents` |
| `l4yercak3_crm_list_contacts` | `crmOntology.getContacts` |
| `l4yercak3_forms_get_responses` | `formsOntology.getFormResponses` |

Reference the existing HTTP API routes in `convex/http.ts` and the ontology files for the correct query/mutation signatures.

---

## Testing Checklist

For each new MCP tool:

- [ ] Tool appears in `l4yercak3_get_capabilities` output
- [ ] Tool works without organizationId (uses current org)
- [ ] Tool works with explicit organizationId
- [ ] Tool returns proper error for unauthenticated requests
- [ ] Tool returns proper error for unauthorized org access
- [ ] Pagination works correctly (limit, offset, hasMore)
- [ ] Search/filter parameters work as expected
- [ ] Response matches documented schema
- [ ] Tool is usable by Claude Code to build mobile features

---

## File Locations

| Component | Path |
|-----------|------|
| MCP Server Entry | `packages/cli/src/mcp/server.ts` |
| Tool Definitions | `packages/cli/src/mcp/tools/` |
| Convex HTTP Routes | `convex/http.ts` |
| Ontology Files | `convex/*Ontology.ts` |
| API v1 Routes | `convex/api/v1/` |
| Schema Definitions | `convex/schema/` |

---

## Questions?

Contact the mobile app development team or refer to the existing MCP tool implementations for patterns and examples.

---

---

## Priority 0: AI Agent & Chat System (HIGHEST PRIORITY)

This is the **killer feature** for mobile. Users should be able to chat with the AI assistant directly from their phone, execute business tasks via natural language, and approve/reject tool executions on the go.

### Architecture Overview

The L4YERCAK3 AI system consists of:

1. **AI Conversations** - Chat sessions between user and AI assistant
2. **AI Messages** - Individual messages in conversations
3. **AI Tool Registry** - 40+ tools the AI can execute (CRM, Events, Forms, Projects, etc.)
4. **AI Tool Executions** - Human-in-the-loop approval workflow for tool calls
5. **AI Work Items** - Preview/approve workflow for batch operations
6. **AI Settings** - Per-org model selection, budgets, approval modes

### 0.1 Conversation Management

```typescript
// l4yercak3_ai_create_conversation
{
  name: "l4yercak3_ai_create_conversation",
  description: "Create a new AI conversation session.",
  parameters: {},
  returns: {
    conversationId: string,
    createdAt: string,
  }
}

// l4yercak3_ai_list_conversations
{
  name: "l4yercak3_ai_list_conversations",
  description: "List AI conversations for the current user.",
  parameters: {
    status?: "active" | "archived",
    limit?: number,
    offset?: number,
  },
  returns: {
    conversations: Array<{
      id: string,
      title: string | null,
      status: string,
      modelName: string | null,
      messageCount: number,
      createdAt: string,
      updatedAt: string,
    }>,
    total: number,
    hasMore: boolean,
  }
}

// l4yercak3_ai_get_conversation
{
  name: "l4yercak3_ai_get_conversation",
  description: "Get a conversation with its messages.",
  parameters: {
    conversationId: string,
    messageLimit?: number,  // Default: 50
    messageOffset?: number,
  },
  returns: {
    conversation: {
      id: string,
      title: string | null,
      status: string,
      modelId: string | null,
      modelName: string | null,
      messageCount: number,
      createdAt: string,
      updatedAt: string,
    },
    messages: Array<{
      id: string,
      role: "system" | "user" | "assistant" | "tool",
      content: string,
      modelId: string | null,
      toolCalls: Array<{
        id: string,
        name: string,
        arguments: object,
        result: any | null,
        status: "success" | "failed",
        error: string | null,
      }> | null,
      timestamp: string,
    }>,
    hasMoreMessages: boolean,
  }
}

// l4yercak3_ai_archive_conversation
{
  name: "l4yercak3_ai_archive_conversation",
  description: "Archive a conversation (soft delete).",
  parameters: {
    conversationId: string,
  },
  returns: {
    success: boolean,
  }
}
```

### 0.2 Chat Messaging (Core Feature)

```typescript
// l4yercak3_ai_send_message
{
  name: "l4yercak3_ai_send_message",
  description: "Send a message to the AI assistant and get a response. This is the main chat endpoint. The AI may propose tool executions that require approval.",
  parameters: {
    conversationId?: string,     // If omitted, creates new conversation
    message: string,             // User's message
    selectedModel?: string,      // Override model (e.g., "anthropic/claude-3-5-sonnet")
    attachments?: Array<{        // For multimodal (images, files)
      type: "image" | "file",
      url: string,
      mimeType: string,
      fileName?: string,
    }>,
  },
  returns: {
    conversationId: string,
    message: string,             // AI's response
    toolCalls: Array<{
      id: string,
      name: string,
      arguments: object,
      result: any | null,
      status: "success" | "failed" | "pending_approval",
      error: string | null,
    }>,
    usage: {
      prompt_tokens: number,
      completion_tokens: number,
      total_tokens: number,
    },
    cost: number,                // Cost in USD
    pendingApprovals: number,    // Number of tool executions awaiting approval
  }
}

// l4yercak3_ai_stream_message (FUTURE - for real-time streaming)
{
  name: "l4yercak3_ai_stream_message",
  description: "Send a message with streaming response. Returns a stream ID to poll for chunks.",
  parameters: {
    conversationId?: string,
    message: string,
    selectedModel?: string,
  },
  returns: {
    streamId: string,
    conversationId: string,
  }
}

// l4yercak3_ai_get_stream_chunk (FUTURE)
{
  name: "l4yercak3_ai_get_stream_chunk",
  description: "Get the next chunk of a streaming response.",
  parameters: {
    streamId: string,
  },
  returns: {
    chunk: string | null,
    isComplete: boolean,
    toolCalls: Array<...> | null,  // Populated when complete
  }
}
```

### 0.3 Tool Execution Approval (Human-in-the-Loop)

```typescript
// l4yercak3_ai_list_pending_approvals
{
  name: "l4yercak3_ai_list_pending_approvals",
  description: "Get all tool executions awaiting user approval.",
  parameters: {
    conversationId?: string,     // Filter to specific conversation
    limit?: number,
    offset?: number,
  },
  returns: {
    pendingApprovals: Array<{
      id: string,
      conversationId: string,
      toolName: string,
      parameters: object,
      proposalMessage: string,   // AI's explanation of what it wants to do
      status: "proposed",
      createdAt: string,
    }>,
    total: number,
  }
}

// l4yercak3_ai_approve_tool
{
  name: "l4yercak3_ai_approve_tool",
  description: "Approve a proposed tool execution. The tool will execute and results will be fed back to the AI.",
  parameters: {
    executionId: string,
    approvalType: "approve" | "approve_always",  // approve_always = don't ask again for this tool
  },
  returns: {
    success: boolean,
    result: any,                 // Tool execution result
    error: string | null,
    aiResponse: string | null,   // AI's follow-up response after seeing result
  }
}

// l4yercak3_ai_reject_tool
{
  name: "l4yercak3_ai_reject_tool",
  description: "Reject a proposed tool execution. Optionally provide feedback to the AI.",
  parameters: {
    executionId: string,
    feedback?: string,           // Optional: tell AI why you rejected
  },
  returns: {
    success: boolean,
    aiResponse: string | null,   // AI's response to rejection/feedback
  }
}

// l4yercak3_ai_cancel_tool
{
  name: "l4yercak3_ai_cancel_tool",
  description: "Cancel/dismiss a proposed tool execution without feedback to AI.",
  parameters: {
    executionId: string,
  },
  returns: {
    success: boolean,
  }
}
```

### 0.4 Work Items (Batch Operations)

```typescript
// l4yercak3_ai_list_work_items
{
  name: "l4yercak3_ai_list_work_items",
  description: "Get AI work items (batch operations) awaiting approval or in progress.",
  parameters: {
    status?: "preview" | "approved" | "executing" | "completed" | "failed" | "cancelled",
    conversationId?: string,
    limit?: number,
    offset?: number,
  },
  returns: {
    workItems: Array<{
      id: string,
      type: string,              // "crm_create_organization", "contact_sync", etc.
      name: string,              // User-friendly name
      status: string,
      previewData: Array<any> | null,  // What will happen (for preview status)
      results: any | null,             // What happened (for completed status)
      progress: {
        total: number,
        completed: number,
        failed: number,
      } | null,
      createdAt: string,
      completedAt: string | null,
    }>,
    total: number,
    hasMore: boolean,
  }
}

// l4yercak3_ai_approve_work_item
{
  name: "l4yercak3_ai_approve_work_item",
  description: "Approve a work item to execute the batch operation.",
  parameters: {
    workItemId: string,
  },
  returns: {
    success: boolean,
    status: string,              // New status after approval
  }
}

// l4yercak3_ai_cancel_work_item
{
  name: "l4yercak3_ai_cancel_work_item",
  description: "Cancel a work item.",
  parameters: {
    workItemId: string,
  },
  returns: {
    success: boolean,
  }
}
```

### 0.5 AI Settings & Models

```typescript
// l4yercak3_ai_get_settings
{
  name: "l4yercak3_ai_get_settings",
  description: "Get AI settings for the current organization.",
  parameters: {},
  returns: {
    enabled: boolean,
    tier: "standard" | "privacy-enhanced" | "private-llm" | null,
    llm: {
      enabledModels: Array<{
        modelId: string,
        name: string,
        isDefault: boolean,
        customLabel: string | null,
      }>,
      defaultModelId: string | null,
      temperature: number,
      maxTokens: number,
    },
    budget: {
      monthlyBudgetUsd: number | null,
      currentMonthSpend: number,
      remainingBudget: number | null,
    },
    humanInLoopEnabled: boolean,
    toolApprovalMode: "all" | "dangerous" | "none",
    autoRecovery: {
      enabled: boolean,
      maxRetries: number,
    } | null,
  }
}

// l4yercak3_ai_list_models
{
  name: "l4yercak3_ai_list_models",
  description: "List available AI models the user can select.",
  parameters: {
    includeDisabled?: boolean,   // Include models not enabled for org
  },
  returns: {
    models: Array<{
      modelId: string,           // "anthropic/claude-3-5-sonnet"
      name: string,              // "Claude 3.5 Sonnet"
      provider: string,          // "anthropic"
      isEnabled: boolean,        // Enabled for this org
      isDefault: boolean,        // Is org's default model
      isSystemDefault: boolean,  // Is platform-recommended
      pricing: {
        promptPerMToken: number,
        completionPerMToken: number,
      },
      capabilities: {
        toolCalling: boolean,
        multimodal: boolean,
        vision: boolean,
      },
      contextLength: number,
    }>,
  }
}

// l4yercak3_ai_set_default_model
{
  name: "l4yercak3_ai_set_default_model",
  description: "Set the default AI model for the organization.",
  parameters: {
    modelId: string,
  },
  returns: {
    success: boolean,
    model: { modelId, name, provider },
  }
}
```

### 0.6 Available AI Tools Reference

The AI assistant has access to 40+ tools across these categories:

| Category | Ready Tools | Placeholder Tools |
|----------|-------------|-------------------|
| **Meta** | `request_feature` | - |
| **OAuth** | `check_oauth_connection` | - |
| **CRM** | `manage_crm`, `sync_contacts`, `send_bulk_crm_email`, `create_contact` | `search_contacts`, `update_contact`, `tag_contacts` |
| **Events** | `create_event` | `list_events`, `update_event`, `register_attendee` |
| **Projects** | `manage_projects` | - |
| **Benefits** | `manage_benefits` | - |
| **Forms** | `create_form`, `manage_forms` | `list_forms`, `publish_form`, `get_form_responses` |
| **Products** | `create_product` | `list_products`, `set_product_price` |
| **Payments** | - | `create_invoice`, `send_invoice`, `process_payment` |
| **Tickets** | - | `create_ticket`, `update_ticket_status`, `list_tickets` |
| **Workflows** | - | `create_workflow`, `enable_workflow` |
| **Media** | - | `upload_media`, `search_media` |
| **Templates** | - | `create_template`, `send_email_from_template` |
| **Publishing** | - | `create_page`, `publish_page` |
| **Checkout** | - | `create_checkout_page` |
| **Certificates** | - | `generate_certificate` |
| **Settings** | - | `update_organization_settings`, `configure_ai_models` |

**Tool Statuses:**
- **ready**: Fully implemented, executes immediately (with approval if enabled)
- **placeholder**: Returns tutorial steps for manual completion
- **beta**: Implemented but may have limitations

### Mobile-Specific Considerations for AI Chat

1. **Push Notifications**: When AI proposes a tool execution, send push notification
2. **Quick Actions**: Pre-built quick action buttons for common tasks
3. **Voice Input**: Support voice-to-text for hands-free messaging
4. **Offline Queue**: Queue messages when offline, sync when connected
5. **Attachment Support**: Camera/photo library integration for multimodal
6. **Haptic Feedback**: Vibrate on new AI response or approval request

---

**Document Version:** 1.1
**Created:** 2025-01-07
**Updated:** 2025-01-07
**Author:** Claude Code (AI Assistant)
**For:** L4YERCAK3 MCP Development Team
