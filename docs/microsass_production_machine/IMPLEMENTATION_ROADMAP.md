# L4YERCAK3 CLI - Implementation Roadmap

Detailed step-by-step implementation plan for CLI v2.0.

---

## Current State

### Completed (CLI v1)
- [x] OAuth login flow with CSRF protection
- [x] Session management
- [x] API key generation/listing
- [x] Project detection (Next.js, GitHub)
- [x] Basic file generators (env, api-client, nextauth)
- [x] Upgrade flow for plan limits

### Ready in Backend
- [x] CLI session tables (cliSessions, cliLoginStates)
- [x] API key management with limits
- [x] Full REST API for most objects
- [x] Multi-tenant object system

---

## Phase 1: Foundation Enhancement

**Duration:** 2 weeks
**Goal:** Complete basic CLI with CRUD operations and backend registration

### Week 1: Backend Registration System

#### Task 1.1: Create cli_connected_apps Table
**File:** `convex/schemas/coreSchemas.ts`

```typescript
cliConnectedApps: defineTable({
  organizationId: v.id("organizations"),
  name: v.string(),
  projectPathHash: v.string(),  // SHA256 of local path
  framework: v.string(),
  frameworkVersion: v.optional(v.string()),
  apiKeyId: v.optional(v.id("apiKeys")),
  modelMappings: v.array(v.object({
    localModel: v.string(),
    layerCakeType: v.string(),
    syncDirection: v.union(
      v.literal("bidirectional"),
      v.literal("push"),
      v.literal("pull")
    ),
    fieldMappings: v.array(v.object({
      localField: v.string(),
      layerCakeField: v.string(),
      transform: v.optional(v.string()),
    })),
  })),
  features: v.array(v.string()),
  productionDomain: v.optional(v.string()),
  status: v.union(
    v.literal("active"),
    v.literal("paused"),
    v.literal("disconnected")
  ),
  lastSyncAt: v.optional(v.number()),
  syncStats: v.optional(v.object({
    totalSynced: v.number(),
    lastSyncErrors: v.number(),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_organization", ["organizationId"])
.index("by_api_key", ["apiKeyId"])
.index("by_path_hash", ["projectPathHash", "organizationId"])
```

#### Task 1.2: Create Connected Apps API
**File:** `convex/api/v1/cliApps.ts`

Functions to implement:
- `registerConnectedApp` - Register new app
- `listConnectedApps` - List apps for org
- `getConnectedApp` - Get single app
- `updateConnectedApp` - Update app config
- `disconnectApp` - Remove app

#### Task 1.3: Create REST Routes
**Files:**
- `src/app/api/v1/cli/apps/route.ts` (list, create)
- `src/app/api/v1/cli/apps/[appId]/route.ts` (get, update, delete)

#### Task 1.4: Update CLI spread Command
**File:** `l4yercak3-cli/src/commands/spread.js`

Changes:
1. After successful setup, call `registerConnectedApp`
2. Generate project path hash
3. Store backend app ID in local config
4. Show registration confirmation

### Week 2: CRM Commands

#### Task 2.1: Implement contacts Command
**File:** `l4yercak3-cli/src/commands/crm/contacts.js`

```javascript
// Commands to implement
l4yercak3 crm contacts list
l4yercak3 crm contacts create
l4yercak3 crm contacts get <id>
l4yercak3 crm contacts update <id>
l4yercak3 crm contacts delete <id>
l4yercak3 crm contacts import <file>
l4yercak3 crm contacts export
```

#### Task 2.2: Implement organizations Command
**File:** `l4yercak3-cli/src/commands/crm/orgs.js`

```javascript
// Commands to implement
l4yercak3 crm orgs list
l4yercak3 crm orgs create
l4yercak3 crm orgs get <id>
l4yercak3 crm orgs update <id>
```

#### Task 2.3: Create Backend Routes (if missing)
**Files:**
- `src/app/api/v1/crm/contacts/route.ts`
- `src/app/api/v1/crm/contacts/[contactId]/route.ts`
- `src/app/api/v1/crm/organizations/route.ts`

#### Task 2.4: Add to Backend Client
**File:** `l4yercak3-cli/src/api/backend-client.js`

Add methods:
- `listContacts(orgId, options)`
- `createContact(orgId, data)`
- `getContact(contactId)`
- `updateContact(contactId, data)`
- `deleteContact(contactId)`
- Same for organizations

### Phase 1 Deliverables
- [ ] Connected apps appear in L4YERCAK3 dashboard
- [ ] CLI can CRUD contacts
- [ ] CLI can CRUD organizations
- [ ] Import/export contacts works

---

## Phase 2: Events & Commerce

**Duration:** 2 weeks
**Goal:** Full event lifecycle and payment processing

### Week 3: Events Commands

#### Task 3.1: Implement events Command
**File:** `l4yercak3-cli/src/commands/events.js`

```javascript
// Commands to implement
l4yercak3 events list
l4yercak3 events create
l4yercak3 events get <id>
l4yercak3 events update <id>
l4yercak3 events publish <id>
l4yercak3 events delete <id>
l4yercak3 events stats <id>
```

#### Task 3.2: Implement tickets Command
**File:** `l4yercak3-cli/src/commands/tickets.js`

```javascript
// Commands to implement
l4yercak3 tickets list --event <id>
l4yercak3 tickets get <id>
l4yercak3 tickets scan <qrCode>
l4yercak3 tickets export --event <id> --format csv
l4yercak3 tickets pdf <id>
```

#### Task 3.3: Create Backend Routes
**Files:**
- `src/app/api/v1/events/route.ts`
- `src/app/api/v1/events/[eventId]/route.ts`
- `src/app/api/v1/tickets/route.ts`
- `src/app/api/v1/tickets/[ticketId]/route.ts`
- `src/app/api/v1/tickets/[ticketId]/redeem/route.ts`
- `src/app/api/v1/tickets/export/route.ts`

#### Task 3.4: Ticket QR Scanning
- Implement ticket lookup by QR code
- Mark as redeemed
- Return attendee info

### Week 4: Products & Checkout

#### Task 4.1: Implement products Command
**File:** `l4yercak3-cli/src/commands/products.js`

```javascript
// Commands to implement
l4yercak3 products list
l4yercak3 products create
l4yercak3 products get <id>
l4yercak3 products update <id>
l4yercak3 products publish <id>
l4yercak3 products delete <id>
```

#### Task 4.2: Implement checkout Command
**File:** `l4yercak3-cli/src/commands/checkout.js`

```javascript
// Commands to implement
l4yercak3 checkout create --product <id> --email <email>
l4yercak3 checkout verify <sessionId>
l4yercak3 checkout status <sessionId>
```

#### Task 4.3: Implement transactions Command
**File:** `l4yercak3-cli/src/commands/transactions.js`

```javascript
// Commands to implement
l4yercak3 transactions list
l4yercak3 transactions get <id>
l4yercak3 transactions export --format csv
```

### Phase 2 Deliverables
- [ ] Full event CRUD via CLI
- [ ] Ticket management including scan
- [ ] PDF ticket export
- [ ] Product management
- [ ] Checkout session creation
- [ ] Transaction listing

---

## Phase 3: Invoicing & Projects

**Duration:** 2 weeks
**Goal:** B2B operations support

### Week 5: Invoicing

#### Task 5.1: Implement invoices Command
**File:** `l4yercak3-cli/src/commands/invoices.js`

```javascript
// Commands to implement
l4yercak3 invoices list
l4yercak3 invoices create
l4yercak3 invoices get <id>
l4yercak3 invoices update <id>
l4yercak3 invoices seal <id>
l4yercak3 invoices send <id>
l4yercak3 invoices mark-paid <id>
l4yercak3 invoices pdf <id>
l4yercak3 invoices consolidate
```

#### Task 5.2: Create Backend Routes (if missing)
- Verify all invoice endpoints exist
- Add PDF download endpoint
- Add mark-paid endpoint

#### Task 5.3: Invoice PDF Download
- Fetch PDF from backend
- Save to local file
- Option to open in browser

### Week 6: Projects & Forms

#### Task 6.1: Implement projects Command
**File:** `l4yercak3-cli/src/commands/projects.js`

```javascript
// Commands to implement
l4yercak3 projects list
l4yercak3 projects create
l4yercak3 projects get <id>
l4yercak3 projects update <id>
l4yercak3 projects tasks <id>
l4yercak3 projects add-task <id>
l4yercak3 projects complete-task <projectId> <taskId>
```

#### Task 6.2: Implement forms Command
**File:** `l4yercak3-cli/src/commands/forms.js`

```javascript
// Commands to implement
l4yercak3 forms list
l4yercak3 forms get <id>
l4yercak3 forms responses <id>
l4yercak3 forms export <id> --format csv
```

### Phase 3 Deliverables
- [ ] Full invoice workflow via CLI
- [ ] PDF download works
- [ ] Project management
- [ ] Task management
- [ ] Form response viewing/export

---

## Phase 4: Intelligence & Automation

**Duration:** 2 weeks
**Goal:** Smart features and automation

### Week 7: Model Detection

#### Task 7.1: Prisma Schema Detector
**File:** `l4yercak3-cli/src/detectors/prisma-detector.js`

Features:
- Parse `schema.prisma` file
- Extract model definitions
- Map fields to types
- Generate mapping suggestions

```javascript
// Prisma detection output
{
  models: [
    {
      name: "User",
      fields: [
        { name: "email", type: "String", required: true },
        { name: "name", type: "String", required: false },
        { name: "createdAt", type: "DateTime", required: true },
      ],
      suggestedType: "contact",
      confidence: 95,
    }
  ]
}
```

#### Task 7.2: TypeScript Type Detector
**File:** `l4yercak3-cli/src/detectors/typescript-detector.js`

Features:
- Scan for interface/type definitions
- Parse field types
- Generate mapping suggestions

#### Task 7.3: Mapping Configuration Generator
**File:** `l4yercak3-cli/src/generators/mapping-generator.js`

Generate `.l4yercak3/mappings.yaml` file with detected mappings.

### Week 8: Workflows & AI

#### Task 8.1: Implement workflows Command
**File:** `l4yercak3-cli/src/commands/workflows.js`

```javascript
// Commands to implement
l4yercak3 workflows list
l4yercak3 workflows get <id>
l4yercak3 workflows run <id>
l4yercak3 workflows logs <id>
l4yercak3 workflows pause <id>
l4yercak3 workflows activate <id>
```

#### Task 8.2: Implement ai Command
**File:** `l4yercak3-cli/src/commands/ai.js`

```javascript
// Commands to implement
l4yercak3 ai "<prompt>"           // One-shot command
l4yercak3 ai chat                 // Interactive mode
l4yercak3 ai tools                // List available tools
```

#### Task 8.3: Implement webhooks Command
**File:** `l4yercak3-cli/src/commands/webhooks.js`

```javascript
// Commands to implement
l4yercak3 webhooks list
l4yercak3 webhooks create <url>
l4yercak3 webhooks delete <id>
l4yercak3 webhooks test <id>
```

### Phase 4 Deliverables
- [ ] Prisma schema detection works
- [ ] TypeScript type detection works
- [ ] Auto-generated mappings.yaml
- [ ] Workflow management via CLI
- [ ] Basic AI commands work
- [ ] Webhook configuration

---

## Phase 5: Polish & Templates

**Duration:** 2 weeks
**Goal:** Production-ready with templates

### Week 9: Templates & Publishing

#### Task 9.1: Implement templates Command
**File:** `l4yercak3-cli/src/commands/templates.js`

```javascript
// Commands to implement
l4yercak3 templates list
l4yercak3 templates list --type email
l4yercak3 templates get <id>
l4yercak3 templates preview <id>
```

#### Task 9.2: Implement pages Command
**File:** `l4yercak3-cli/src/commands/pages.js`

```javascript
// Commands to implement
l4yercak3 pages list
l4yercak3 pages get <id>
l4yercak3 pages deploy <id>
l4yercak3 pages status <id>
```

#### Task 9.3: Implement sync Command
**File:** `l4yercak3-cli/src/commands/sync.js`

```javascript
// Commands to implement
l4yercak3 sync                    // Sync all mapped models
l4yercak3 sync contacts           // Sync specific type
l4yercak3 sync --pull             // Pull from L4YERCAK3
l4yercak3 sync --push             // Push to L4YERCAK3
l4yercak3 sync --dry-run          // Preview changes
```

### Week 10: Bulk Operations & Dev Tools

#### Task 10.1: Implement bulk Command
**File:** `l4yercak3-cli/src/commands/bulk.js`

```javascript
// Commands to implement
l4yercak3 bulk import <file> --type contacts
l4yercak3 bulk export contacts --format csv
l4yercak3 bulk update contacts --field status --value archived
```

#### Task 10.2: Implement dev Command
**File:** `l4yercak3-cli/src/commands/dev.js`

```javascript
// Commands to implement
l4yercak3 dev                     // Watch mode
l4yercak3 dev logs                // Stream logs
l4yercak3 test api                // Test connection
l4yercak3 test webhooks           // Test webhooks
```

#### Task 10.3: Documentation
- Update README with all commands
- Add examples for each command
- Create troubleshooting guide

### Phase 5 Deliverables
- [ ] Template management
- [ ] Page deployment
- [ ] Data sync works
- [ ] Bulk import/export
- [ ] Dev mode with logs
- [ ] Complete documentation

---

## Technical Implementation Details

### CLI Command Structure

```
l4yercak3-cli/
├── bin/
│   └── l4yercak3.js          # Entry point
├── src/
│   ├── commands/
│   │   ├── login.js
│   │   ├── logout.js
│   │   ├── status.js
│   │   ├── spread.js
│   │   ├── api-keys.js
│   │   ├── upgrade.js
│   │   ├── crm/
│   │   │   ├── contacts.js
│   │   │   └── orgs.js
│   │   ├── events.js
│   │   ├── tickets.js
│   │   ├── products.js
│   │   ├── checkout.js
│   │   ├── transactions.js
│   │   ├── invoices.js
│   │   ├── projects.js
│   │   ├── forms.js
│   │   ├── workflows.js
│   │   ├── webhooks.js
│   │   ├── templates.js
│   │   ├── pages.js
│   │   ├── sync.js
│   │   ├── bulk.js
│   │   ├── ai.js
│   │   └── dev.js
│   ├── detectors/
│   │   ├── index.js
│   │   ├── nextjs-detector.js
│   │   ├── prisma-detector.js     # NEW
│   │   ├── typescript-detector.js  # NEW
│   │   ├── github-detector.js
│   │   ├── oauth-detector.js
│   │   └── api-client-detector.js
│   ├── generators/
│   │   ├── index.js
│   │   ├── api-client-generator.js
│   │   ├── env-generator.js
│   │   ├── nextauth-generator.js
│   │   ├── mapping-generator.js   # NEW
│   │   └── gitignore-generator.js
│   ├── api/
│   │   └── backend-client.js
│   ├── config/
│   │   └── config-manager.js
│   ├── utils/
│   │   ├── file-utils.js
│   │   ├── table-formatter.js     # NEW - for CLI output
│   │   ├── csv-handler.js         # NEW - import/export
│   │   └── progress-indicator.js  # NEW - for long operations
│   └── logo.js
├── templates/
│   ├── api-client/
│   ├── nextauth/
│   └── mappings/
└── package.json
```

### Backend Client Extensions

```javascript
// Additional methods for BackendClient

// CRM
listContacts(orgId, { limit, offset, search })
createContact(orgId, data)
getContact(contactId)
updateContact(contactId, data)
deleteContact(contactId)

// Events
listEvents(orgId, { status })
createEvent(orgId, data)
getEvent(eventId)
updateEvent(eventId, data)
publishEvent(eventId)

// Tickets
listTickets(orgId, { eventId })
redeemTicket(ticketId)
getTicketPdf(ticketId)
exportTickets(eventId, format)

// Products
listProducts(orgId)
createProduct(orgId, data)
getProduct(productId)
updateProduct(productId, data)

// Checkout
createCheckoutSession(data)
verifyPayment(sessionId)

// Transactions
listTransactions(orgId, { status, startDate, endDate })
getTransaction(transactionId)

// Invoices
listInvoices(orgId, { status })
createInvoice(orgId, data)
getInvoice(invoiceId)
sealInvoice(invoiceId)
sendInvoice(invoiceId, recipientEmail)
markInvoicePaid(invoiceId, paymentData)
getInvoicePdf(invoiceId)

// Projects
listProjects(orgId)
createProject(orgId, data)
getProject(projectId)
addTask(projectId, taskData)
updateTask(projectId, taskId, data)

// Forms
listForms(orgId)
getFormResponses(formId)
exportFormResponses(formId, format)

// Workflows
listWorkflows(orgId)
runWorkflow(workflowId, context)
getWorkflowLogs(workflowId)

// Webhooks
listWebhooks(orgId)
createWebhook(orgId, data)
deleteWebhook(webhookId)
testWebhook(webhookId)

// Templates
listTemplates(orgId, { type })
getTemplate(templateId)

// Pages
listPages(orgId)
deployPage(pageId)
getDeploymentStatus(pageId)

// Sync
syncData(appId, direction, modelTypes)

// Bulk
bulkImport(orgId, type, data)
bulkExport(orgId, type, filters)

// AI
sendAiMessage(conversationId, message)
createAiConversation(orgId)

// Connected Apps
registerApp(orgId, data)
listApps(orgId)
updateApp(appId, data)
disconnectApp(appId)
```

---

## Testing Strategy

### Unit Tests
- Test each command handler
- Test detectors independently
- Test generators with mock data

### Integration Tests
- Test full CLI flows
- Mock backend responses
- Test error handling

### E2E Tests
- Test against staging backend
- Full workflow tests
- Performance benchmarks

---

## Release Plan

### v2.0.0-alpha.1 (After Phase 1)
- Backend registration
- CRM commands

### v2.0.0-alpha.2 (After Phase 2)
- Events & tickets
- Products & checkout

### v2.0.0-beta.1 (After Phase 3)
- Invoicing
- Projects

### v2.0.0-beta.2 (After Phase 4)
- Model detection
- AI commands

### v2.0.0 (After Phase 5)
- Full feature set
- Complete documentation
- Production ready

---

## Success Metrics by Phase

### Phase 1
- [ ] `spread` registers app in backend
- [ ] Contacts CRUD < 2s response
- [ ] Import 1000 contacts < 30s

### Phase 2
- [ ] Event creation works end-to-end
- [ ] Ticket scan < 500ms
- [ ] PDF generation < 5s

### Phase 3
- [ ] Invoice workflow complete via CLI
- [ ] Project task updates reflect immediately

### Phase 4
- [ ] Prisma detection > 90% accuracy
- [ ] AI responses < 10s

### Phase 5
- [ ] Bulk import 10k records < 2min
- [ ] Sync detects all changes
- [ ] Zero critical bugs

---

*Document Version: 1.0*
*Last Updated: January 2025*
