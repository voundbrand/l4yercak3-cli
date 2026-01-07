# L4YERCAK3 CLI - Product Vision v2.0

**The Ultimate Bridge Between External Apps and L4YERCAK3 Backend**

> "Your external app is the face. L4YERCAK3 is the brain. The CLI is the spine that connects them."

---

## Executive Summary

The L4YERCAK3 CLI is not just a setup tool - it's an **intelligent integration platform** that analyzes external applications, understands their architecture, and creates seamless bi-directional connections to the L4YERCAK3 backend. It transforms L4YERCAK3 from a standalone platform into a **headless backend-as-a-service** that developers can plug into any frontend.

---

## Vision Statement

**Make L4YERCAK3 the invisible backend for any business application.**

The CLI enables developers to:
1. **Connect** their frontend to L4YERCAK3's powerful backend
2. **Sync** data models between their app and L4YERCAK3 objects
3. **Access** all L4YERCAK3 applications (CRM, Events, Invoicing, etc.) via API
4. **Manage** users, authentication, and payments through L4YERCAK3
5. **Automate** business logic with L4YERCAK3 workflows

---

## Current State Analysis

### What We Have (CLI v1)

```
l4yercak3-cli/
├── commands/
│   ├── login.js      ✅ OAuth browser flow with CSRF protection
│   ├── logout.js     ✅ Clear session
│   ├── spread.js     ✅ Basic project setup wizard
│   ├── status.js     ✅ Show current session/config
│   ├── api-keys.js   ✅ List/manage API keys
│   └── upgrade.js    ✅ Open upgrade page
├── detectors/
│   ├── nextjs-detector.js    ✅ Detect Next.js projects
│   ├── github-detector.js    ✅ Detect GitHub repos
│   ├── oauth-detector.js     ✅ Detect existing OAuth setup
│   └── api-client-detector.js ✅ Detect existing API client
├── generators/
│   ├── api-client-generator.js  ✅ Generate L4YERCAK3 API client
│   ├── env-generator.js         ✅ Generate .env.local
│   ├── nextauth-generator.js    ✅ Generate NextAuth config
│   └── gitignore-generator.js   ✅ Update .gitignore
└── api/
    └── backend-client.js  ✅ API communication layer
```

### What We're Missing

| Feature | Status | Priority |
|---------|--------|----------|
| Object type mapping | ❌ | HIGH |
| Backend registration of connected apps | ❌ | HIGH |
| Real-time sync commands | ❌ | HIGH |
| Multi-application CLI access | ❌ | HIGH |
| Bulk data operations | ❌ | MEDIUM |
| Template management | ❌ | MEDIUM |
| AI Assistant integration | ❌ | MEDIUM |
| Webhook management | ❌ | MEDIUM |

---

## L4YERCAK3 Backend Applications

Based on our backend analysis, here are ALL applications available for CLI integration:

### Tier 1: Core Business (HIGH Priority for CLI)

| Application | Object Types | CLI Value |
|-------------|--------------|-----------|
| **CRM** | contact, crm_organization | Sync customers, manage leads |
| **Events** | event, ticket | Create/manage events, issue tickets |
| **Products** | product | Manage inventory, pricing |
| **Checkout** | checkout_session, transaction | Process payments |
| **Invoicing** | invoice | Generate, send, track invoices |
| **Forms** | form, form_response | Build forms, collect data |

### Tier 2: Extended Features (MEDIUM Priority)

| Application | Object Types | CLI Value |
|-------------|--------------|-----------|
| **Projects** | project, milestone, task | Client project management |
| **Templates** | template, template_set | Manage email/PDF templates |
| **Workflows** | workflow | Automate business logic |
| **Web Publishing** | page | Deploy landing pages |
| **Certificates** | certificate | Issue achievement certificates |
| **Benefits** | benefit | Membership perks |

### Tier 3: Platform Features (LOWER Priority)

| Application | Object Types | CLI Value |
|-------------|--------------|-----------|
| **AI Assistant** | conversation, message | AI-powered operations |
| **Media Library** | media_item, media_folder | File management |
| **Compliance** | compliance_record | Regulatory tracking |

---

## Core Architecture: The "Model Mapping" System

### The Big Idea

When a developer runs `l4yercak3 spread`, the CLI should:

1. **Detect** the external app's data models (Prisma schema, TypeScript types, etc.)
2. **Map** them to L4YERCAK3 object types
3. **Generate** sync code that keeps both systems in sync
4. **Register** the connection in the L4YERCAK3 backend

### Example Flow

```bash
$ l4yercak3 spread

  🍰 Layer Cake Integration Wizard

  🔍 Analyzing your project...

  ✅ Detected: Next.js 15 (App Router)
  ✅ Detected: Prisma ORM with 8 models
  ✅ Detected: NextAuth.js (Microsoft, Google)

  📊 Your Data Models:

  ┌─────────────────────────────────────────────────────┐
  │ Your Model      → L4YERCAK3 Object    Confidence   │
  ├─────────────────────────────────────────────────────┤
  │ User            → contact              95%         │
  │ Company         → crm_organization     92%         │
  │ Event           → event                100%        │
  │ Ticket          → ticket               98%         │
  │ Invoice         → invoice              96%         │
  │ Subscription    → (custom mapping)     70%         │
  └─────────────────────────────────────────────────────┘

  ? Accept this mapping? (y/n)
```

---

## CLI Command Structure (v2.0)

### Authentication & Session
```bash
l4yercak3 login                    # Browser OAuth flow
l4yercak3 logout                   # Clear session
l4yercak3 status                   # Show session info
l4yercak3 whoami                   # Current user/org details
```

### Project Setup
```bash
l4yercak3 spread                   # Interactive setup wizard
l4yercak3 spread --template <name> # Use template (landing, portal, saas)
l4yercak3 init                     # Alias for spread
l4yercak3 config                   # View/edit project config
l4yercak3 config set <key> <val>   # Set config value
```

### Organization & API Keys
```bash
l4yercak3 orgs                     # List organizations
l4yercak3 orgs switch <id>         # Switch active org
l4yercak3 api-keys list            # List API keys
l4yercak3 api-keys create <name>   # Generate new key
l4yercak3 api-keys revoke <id>     # Revoke key
```

### CRM Operations
```bash
l4yercak3 crm contacts             # List contacts
l4yercak3 crm contacts create      # Create contact (interactive)
l4yercak3 crm contacts import <f>  # Import from CSV/JSON
l4yercak3 crm contacts export      # Export to CSV
l4yercak3 crm contacts sync        # Sync with local DB
l4yercak3 crm orgs                 # List CRM organizations
l4yercak3 crm orgs create          # Create organization
```

### Events & Tickets
```bash
l4yercak3 events list              # List events
l4yercak3 events create            # Create event (interactive)
l4yercak3 events <id>              # Event details
l4yercak3 events <id> tickets      # List tickets for event
l4yercak3 tickets generate <id>    # Generate ticket PDFs
l4yercak3 tickets scan <code>      # Scan/redeem ticket QR
l4yercak3 tickets export <event>   # Export ticket list
```

### Products & Checkout
```bash
l4yercak3 products list            # List products
l4yercak3 products create          # Create product
l4yercak3 products <id>            # Product details
l4yercak3 checkout create <prod>   # Create checkout session
l4yercak3 checkout verify <id>     # Verify payment
l4yercak3 transactions list        # List transactions
```

### Invoicing
```bash
l4yercak3 invoices list            # List invoices
l4yercak3 invoices create          # Create invoice
l4yercak3 invoices <id>            # Invoice details
l4yercak3 invoices <id> send       # Send invoice email
l4yercak3 invoices <id> pdf        # Download PDF
l4yercak3 invoices consolidate     # Run consolidation rules
```

### Forms
```bash
l4yercak3 forms list               # List forms
l4yercak3 forms create             # Create form (opens editor)
l4yercak3 forms <id> responses     # View form responses
l4yercak3 forms <id> export        # Export responses
```

### Projects
```bash
l4yercak3 projects list            # List projects
l4yercak3 projects create          # Create project
l4yercak3 projects <id>            # Project details
l4yercak3 projects <id> tasks      # List tasks
l4yercak3 projects <id> add-task   # Add task
```

### Templates
```bash
l4yercak3 templates list           # List templates
l4yercak3 templates <type>         # List by type (ticket_pdf, invoice_pdf, email)
l4yercak3 templates preview <id>   # Preview template
```

### Workflows & Automation
```bash
l4yercak3 workflows list           # List workflows
l4yercak3 workflows <id> run       # Manually trigger workflow
l4yercak3 workflows <id> logs      # View execution logs
```

### Publishing
```bash
l4yercak3 pages list               # List published pages
l4yercak3 pages <id> deploy        # Deploy page
l4yercak3 pages <id> status        # Deployment status
```

### Data Sync Operations
```bash
l4yercak3 sync                     # Sync all mapped models
l4yercak3 sync contacts            # Sync contacts only
l4yercak3 sync --pull              # Pull from L4YERCAK3 → local
l4yercak3 sync --push              # Push from local → L4YERCAK3
l4yercak3 sync --dry-run           # Show what would sync
```

### Bulk Operations
```bash
l4yercak3 bulk import <file>       # Import data from CSV/JSON
l4yercak3 bulk export <type>       # Export object type
l4yercak3 bulk update <type>       # Bulk update objects
```

### AI Assistant
```bash
l4yercak3 ai "<prompt>"            # One-shot AI command
l4yercak3 ai chat                  # Interactive AI chat
l4yercak3 ai tools                 # List available AI tools
```

### Webhooks
```bash
l4yercak3 webhooks list            # List webhook subscriptions
l4yercak3 webhooks create <url>    # Create webhook
l4yercak3 webhooks test <id>       # Send test payload
```

### Development Tools
```bash
l4yercak3 dev                      # Start dev mode (watch for changes)
l4yercak3 dev logs                 # Stream backend logs
l4yercak3 test api                 # Test API connection
l4yercak3 test webhooks            # Test webhook delivery
```

---

## Backend Registration: Connected Apps

When a project runs `l4yercak3 spread`, it should register in the backend:

### New Table: `cli_connected_apps`

```typescript
// Schema addition
cliConnectedApps: defineTable({
  organizationId: v.id("organizations"),
  name: v.string(),                    // "My Benefits Platform"
  projectPath: v.string(),             // Hash of local path (for identification)
  framework: v.string(),               // "nextjs", "remix", etc.
  apiKeyId: v.optional(v.id("apiKeys")), // Linked API key
  modelMappings: v.array(v.object({
    localModel: v.string(),            // "User"
    layerCakeType: v.string(),         // "contact"
    syncDirection: v.string(),         // "bidirectional" | "push" | "pull"
    fieldMappings: v.array(v.object({
      localField: v.string(),
      layerCakeField: v.string(),
    })),
  })),
  features: v.array(v.string()),       // ["crm", "invoicing", "events"]
  productionDomain: v.optional(v.string()),
  status: v.string(),                  // "active" | "paused" | "disconnected"
  lastSyncAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_organization", ["organizationId"])
.index("by_api_key", ["apiKeyId"])
```

### UI: "Connected Apps" Section

In the L4YERCAK3 dashboard, add a "Connected Apps" window showing:
- List of all CLI-connected applications
- Connection status (last sync, health)
- Model mappings
- Sync controls (pause, force sync, disconnect)
- Activity log

---

## Implementation Phases

### Phase 1: Foundation Enhancement (Weeks 1-2)

**Goal:** Complete the basic CLI with all essential operations

Tasks:
1. ✅ Login/logout flow (DONE)
2. ✅ API key management (DONE)
3. [ ] Create `cli_connected_apps` table
4. [ ] Backend registration on `spread`
5. [ ] CRM commands (contacts, orgs)
6. [ ] Basic sync functionality

Deliverables:
- CLI can CRUD contacts and organizations
- Connected apps appear in backend UI
- Basic two-way sync works

### Phase 2: Event & Commerce (Weeks 3-4)

**Goal:** Full event management and payment processing

Tasks:
1. [ ] Events commands (list, create, manage)
2. [ ] Tickets commands (generate, scan, export)
3. [ ] Products commands (CRUD)
4. [ ] Checkout integration
5. [ ] Transactions listing

Deliverables:
- Complete event lifecycle via CLI
- Ticket PDF generation
- Payment processing works

### Phase 3: Invoicing & Projects (Weeks 5-6)

**Goal:** B2B operations support

Tasks:
1. [ ] Invoice commands (create, send, PDF)
2. [ ] Invoice consolidation rules
3. [ ] Projects commands
4. [ ] Task management
5. [ ] Forms commands

Deliverables:
- Full invoicing workflow via CLI
- Project management for client work

### Phase 4: Intelligence & Automation (Weeks 7-8)

**Goal:** Smart features and automation

Tasks:
1. [ ] Model detection and mapping
2. [ ] Schema analysis (Prisma, TypeScript)
3. [ ] AI assistant integration
4. [ ] Workflow management
5. [ ] Webhook configuration

Deliverables:
- Intelligent model mapping
- AI-powered CLI commands
- Automation setup

### Phase 5: Polish & Templates (Weeks 9-10)

**Goal:** Production-ready with templates

Tasks:
1. [ ] Template management commands
2. [ ] Web publishing integration
3. [ ] Bulk operations
4. [ ] Dev mode with hot reload
5. [ ] Comprehensive documentation

Deliverables:
- Full template support
- Bulk import/export
- Developer documentation

---

## Model Detection Strategy

### Supported Detection Sources

1. **Prisma Schema** (`schema.prisma`)
   - Parse model definitions
   - Extract field types and relationships
   - Map to L4YERCAK3 object types

2. **TypeScript Types** (`*.ts`, `*.tsx`)
   - Find interface/type definitions
   - Extract field types
   - Infer L4YERCAK3 mappings

3. **Convex Schema** (for Convex-based apps)
   - Parse table definitions
   - Direct type mapping

4. **GraphQL Schema** (`*.graphql`)
   - Parse type definitions
   - Map to objects

### Mapping Intelligence

```javascript
// Example mapping rules
const mappingRules = {
  // Name-based matching
  namePatterns: {
    contact: ['user', 'customer', 'member', 'subscriber', 'lead'],
    crm_organization: ['company', 'organization', 'business', 'client'],
    event: ['event', 'conference', 'workshop', 'meetup', 'webinar'],
    ticket: ['ticket', 'registration', 'booking', 'rsvp'],
    product: ['product', 'item', 'sku', 'offering'],
    invoice: ['invoice', 'bill', 'receipt'],
    transaction: ['transaction', 'payment', 'order', 'purchase'],
    project: ['project', 'campaign', 'engagement'],
  },

  // Field-based matching (presence of certain fields increases confidence)
  fieldPatterns: {
    contact: ['email', 'phone', 'firstName', 'lastName'],
    crm_organization: ['companyName', 'taxId', 'industry'],
    event: ['startDate', 'endDate', 'location', 'capacity'],
    invoice: ['invoiceNumber', 'lineItems', 'dueDate', 'totalAmount'],
  },
};
```

---

## User Journey Examples

### Journey 1: Benefits Platform Developer

```bash
# Developer has a Next.js app for employee benefits

$ cd my-benefits-app
$ l4yercak3 login
  ✅ Logged in as developer@company.com

$ l4yercak3 spread
  🔍 Analyzing your project...

  ✅ Next.js 15 (App Router, TypeScript)
  ✅ Prisma with 5 models detected

  📊 Suggested Mapping:
  ┌────────────────────────────────────────┐
  │ Employee    → contact (95%)            │
  │ Company     → crm_organization (92%)   │
  │ Benefit     → benefit (100%)           │
  │ Enrollment  → form_response (88%)      │
  └────────────────────────────────────────┘

  ? Accept mapping? Yes
  ? Select features: [x] CRM [x] Benefits [ ] Invoicing

  ✅ Generated: lib/layercake.ts
  ✅ Generated: .env.local
  ✅ Registered in L4YERCAK3 backend

  🍰 Your Benefits app is now connected!

  Next: Run "l4yercak3 sync" to sync your employees

$ l4yercak3 sync --dry-run
  Would sync:
  - 150 Employees → L4YERCAK3 contacts
  - 3 Companies → L4YERCAK3 organizations

$ l4yercak3 sync
  ✅ Synced 150 contacts
  ✅ Synced 3 organizations
```

### Journey 2: Event Organizer

```bash
# Organizer uses CLI to manage events

$ l4yercak3 events create
  ? Event name: Tech Conference 2025
  ? Type: conference
  ? Start date: 2025-06-15
  ? Location: Berlin
  ✅ Event created (ID: evt_abc123)

$ l4yercak3 products create
  ? Product name: Early Bird Ticket
  ? Price: 199
  ? Link to event: evt_abc123
  ✅ Product created (ID: prod_xyz789)

$ l4yercak3 tickets export evt_abc123 --format csv
  ✅ Exported 342 tickets to tickets_evt_abc123.csv

$ l4yercak3 tickets scan QR_CODE_DATA
  ✅ Ticket redeemed: John Doe (VIP)
```

### Journey 3: Freelancer with Client Portal

```bash
# Freelancer connects their portfolio/client portal

$ l4yercak3 spread --template freelancer-portal

  🔍 Analyzing...

  ? Your business name: Jane Design Studio
  ? Enable: [x] Projects [x] Invoicing [x] CRM

  ✅ Configured for freelancer workflow

$ l4yercak3 projects create
  ? Client: Acme Corp
  ? Project name: Brand Redesign
  ? Budget: 15000
  ✅ Project created

$ l4yercak3 invoices create
  ? Select project: Brand Redesign
  ? Description: Phase 1 - Discovery
  ? Amount: 5000
  ✅ Invoice created (#INV-2025-001)

$ l4yercak3 invoices INV-2025-001 send
  ✅ Invoice sent to client@acmecorp.com
```

---

## Technical Specifications

### API Client Structure (Generated)

```typescript
// lib/layercake.ts (auto-generated)

import { LayerCakeClient } from '@l4yercak3/sdk';

export const layercake = new LayerCakeClient({
  apiKey: process.env.L4YERCAK3_API_KEY,
  organizationId: process.env.L4YERCAK3_ORG_ID,
});

// Type-safe access to mapped objects
export const contacts = layercake.crm.contacts;
export const events = layercake.events;
export const invoices = layercake.invoicing;

// Sync helpers
export async function syncContacts(localUsers: User[]) {
  return layercake.sync.contacts(localUsers, {
    mapping: {
      email: 'email',
      name: 'displayName',
      company: 'customProperties.company',
    },
  });
}
```

### Environment Variables

```bash
# .env.local (auto-generated)

# L4YERCAK3 Configuration
L4YERCAK3_API_KEY=sk_live_xxxxx
L4YERCAK3_ORG_ID=org_xxxxx
L4YERCAK3_BACKEND_URL=https://app.l4yercak3.com

# Sync Configuration
L4YERCAK3_SYNC_ENABLED=true
L4YERCAK3_SYNC_DIRECTION=bidirectional

# Feature Flags
L4YERCAK3_FEATURES=crm,events,invoicing
```

---

## Success Metrics

### Phase 1 Success
- [ ] CLI can create/list contacts
- [ ] Connected apps appear in dashboard
- [ ] Basic sync works bidirectionally
- [ ] < 5 second response for all commands

### Phase 2 Success
- [ ] Full event lifecycle manageable via CLI
- [ ] Ticket PDFs generate correctly
- [ ] Payment flow works end-to-end

### Phase 3 Success
- [ ] Invoice workflow complete via CLI
- [ ] Project/task management functional
- [ ] Form responses accessible

### Phase 4 Success
- [ ] Model detection works for Prisma
- [ ] AI commands functional
- [ ] Webhooks configurable

### Phase 5 Success
- [ ] Complete documentation
- [ ] All templates available
- [ ] Bulk operations handle 10k+ records

---

## Appendix A: Full API Endpoint Reference

See [CLI_API_REFERENCE.md](./CLI_API_REFERENCE.md) for complete endpoint documentation.

## Appendix B: Object Type Mappings

See [OBJECT_MAPPINGS.md](./OBJECT_MAPPINGS.md) for full mapping rules.

## Appendix C: Migration Guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for upgrading from CLI v1.

---

*Document Version: 2.0*
*Last Updated: January 2025*
*Author: L4YERCAK3 Team*
