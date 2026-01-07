# CLI Requirements - What CLI Teams Need to Implement

**Purpose:** This document tells CLI teams exactly what to build to register and manage connected applications in L4YERCAK3.

---

## Overview

The CLI needs to:
1. **Authenticate** users via browser OAuth flow
2. **Detect** project framework and models
3. **Register** the application with L4YERCAK3 backend
4. **Generate** API client code and types
5. **Sync** data between local app and L4YERCAK3

---

## Part 1: Authentication (Already Implemented)

CLI authentication is working. For reference:

```bash
l4yercak3 login
```

**Flow:**
1. CLI opens browser to `https://l4yercak3.com/cli/login?state={uuid}`
2. User authenticates with L4YERCAK3
3. Backend creates CLI session token
4. Browser redirects to localhost callback OR user copies token
5. CLI stores token in `~/.l4yercak3/config.json`

**Token Format:** `cli_session_{64_hex_chars}`
**Token Lifetime:** 30 days

---

## Part 2: Application Registration (NEW - Priority 1)

### Command: `l4yercak3 init`

This is the main command CLI teams need to implement.

**What it does:**
1. Detects project framework
2. Asks user which features to enable
3. Registers application with L4YERCAK3 backend
4. Generates API client files

### Step 2.1: Project Detection

CLI must detect and collect:

```typescript
interface ProjectDetection {
  // Framework detection
  framework: "nextjs" | "remix" | "astro" | "vite" | "nuxt" | "sveltekit" | "other";
  frameworkVersion?: string;      // From package.json
  hasTypeScript: boolean;         // tsconfig.json exists
  routerType?: "app" | "pages";   // For Next.js only

  // Project identification
  projectPath: string;            // Absolute path
  projectPathHash: string;        // SHA256(projectPath) - for identifying returning projects
  projectName: string;            // From package.json name or directory name

  // Database detection (optional)
  hasFrontendDatabase: boolean;
  frontendDatabaseType?: "convex" | "prisma" | "drizzle" | "other";
}
```

**Detection Logic:**

```typescript
// Framework detection
if (existsSync('next.config.js') || existsSync('next.config.ts')) {
  framework = 'nextjs';
  routerType = existsSync('app/') ? 'app' : 'pages';
}
if (existsSync('remix.config.js')) framework = 'remix';
if (existsSync('astro.config.mjs')) framework = 'astro';
// etc.

// TypeScript detection
hasTypeScript = existsSync('tsconfig.json');

// Database detection
hasFrontendDatabase = existsSync('convex/') || existsSync('prisma/schema.prisma');
if (existsSync('convex/')) frontendDatabaseType = 'convex';
if (existsSync('prisma/')) frontendDatabaseType = 'prisma';

// Project hash for identification
projectPathHash = sha256(absolutePath);
```

### Step 2.2: Feature Selection

CLI should prompt user for features:

```
? Which L4YERCAK3 features do you want to use?
  ◉ CRM (contacts, organizations)
  ◉ Events (event management, registrations)
  ◉ Products (product catalog)
  ◉ Checkout (payment processing)
  ◉ Tickets (ticket generation)
  ◉ Invoicing (invoice creation)
  ◉ Forms (dynamic forms)
  ◉ Projects (project management)
  ◯ Workflows (automation)
  ◯ Templates (document templates)
  ◯ AI (AI assistant)
```

Result:

```typescript
const selectedFeatures: string[] = [
  "crm", "events", "products", "checkout", "tickets", "invoicing", "forms"
];
```

### Step 2.3: API Registration

**Endpoint:** `POST /api/v1/cli/applications`

**Headers:**
```
Authorization: Bearer cli_session_xxx
Content-Type: application/json
```

**Request Body:**

```typescript
interface RegisterApplicationRequest {
  // Organization (from login)
  organizationId: string;

  // Basic info
  name: string;                   // Project name (user can edit)
  description?: string;           // Optional description

  // Source detection
  source: {
    type: "cli";
    projectPathHash: string;      // SHA256 of absolute path
    cliVersion: string;           // "1.0.0"
    framework: string;            // "nextjs"
    frameworkVersion?: string;    // "15.0.0"
    hasTypeScript: boolean;
    routerType?: "app" | "pages";
  };

  // Connection config
  connection: {
    features: string[];           // ["crm", "events", "checkout"]
    hasFrontendDatabase: boolean;
    frontendDatabaseType?: string;
  };

  // Optional: Model mappings if detected
  modelMappings?: Array<{
    localModel: string;           // "User", "Event"
    layerCakeType: string;        // "contact", "event"
    syncDirection: "push" | "pull" | "bidirectional" | "none";
    confidence: number;           // 0-100
    isAutoDetected: boolean;
  }>;
}
```

**Response:**

```typescript
interface RegisterApplicationResponse {
  success: boolean;
  applicationId: string;          // ID of created connected_application

  // API credentials
  apiKey: {
    id: string;
    key: string;                  // Full key, only shown once: "org_xxx_sk_live_yyy"
    prefix: string;               // "org_xxx_sk_live_..."
  };

  // Backend URLs
  backendUrl: string;             // "https://agreeable-lion-828.convex.site"

  // If application already exists (same projectPathHash)
  existingApplication?: boolean;
  message?: string;
}
```

**Error Responses:**

```typescript
// 401 Unauthorized
{ error: "Invalid or expired CLI session", code: "INVALID_SESSION" }

// 400 Bad Request
{ error: "Missing required field: name", code: "VALIDATION_ERROR" }

// 409 Conflict (optional - if we want to prevent duplicates)
{
  error: "Application already registered for this project",
  code: "DUPLICATE_APPLICATION",
  existingApplicationId: "app_xxx"
}
```

### Step 2.4: Check Existing Application

Before registering, CLI should check if app already exists:

**Endpoint:** `GET /api/v1/cli/applications/by-path?hash={projectPathHash}`

**Response:**

```typescript
interface ExistingApplicationResponse {
  found: boolean;
  application?: {
    id: string;
    name: string;
    status: string;
    features: string[];
    lastActivityAt: number;
  };
}
```

If found, CLI should ask: "Application already registered. Update it? (Y/n)"

---

## Part 3: Code Generation (Priority 2)

After registration, CLI generates files.

### Files to Generate

**1. API Client: `src/lib/layercake.ts`**

```typescript
// Auto-generated by L4YERCAK3 CLI v1.0.0
// Do not edit manually - run `l4yercak3 generate` to regenerate

const API_URL = process.env.NEXT_PUBLIC_L4YERCAK3_URL!;
const API_KEY = process.env.NEXT_PUBLIC_L4YERCAK3_KEY!;
const ORG_ID = process.env.NEXT_PUBLIC_L4YERCAK3_ORG_ID!;

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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// Feature modules based on selection...
export const eventApi = { /* ... */ };
export const crmApi = { /* ... */ };
// etc.
```

**2. Types: `src/types/layercake.ts`**

```typescript
// Auto-generated by L4YERCAK3 CLI v1.0.0

export interface Event {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: number;
  endDate?: number;
  // ...
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  // ...
}

// Types for each enabled feature...
```

**3. Environment: `.env.local.example`**

```bash
# L4YERCAK3 Backend - Generated by CLI
NEXT_PUBLIC_L4YERCAK3_URL=https://agreeable-lion-828.convex.site
NEXT_PUBLIC_L4YERCAK3_KEY=your_api_key_here
NEXT_PUBLIC_L4YERCAK3_ORG_ID=org_xxx
```

**4. Update actual `.env.local`**

CLI should either:
- Append to existing `.env.local` with comments
- Ask user permission before modifying

### Generation Templates

CLI needs templates for each feature. Store in CLI package:

```
cli/
├── templates/
│   ├── api-client.ts.hbs         # Handlebars template
│   ├── types/
│   │   ├── event.ts.hbs
│   │   ├── contact.ts.hbs
│   │   ├── product.ts.hbs
│   │   └── ...
│   └── hooks/
│       ├── use-events.ts.hbs
│       └── ...
```

---

## Part 4: Update Application (Priority 3)

### Command: `l4yercak3 update`

Re-runs detection and updates backend.

**Endpoint:** `PATCH /api/v1/cli/applications/:id`

**Request:**

```typescript
interface UpdateApplicationRequest {
  // Any fields from RegisterApplicationRequest
  name?: string;
  description?: string;
  connection?: {
    features?: string[];
  };
  modelMappings?: ModelMapping[];
}
```

---

## Part 5: Sync Status (Priority 3)

### Command: `l4yercak3 status`

Shows connection status and sync info.

**Endpoint:** `GET /api/v1/cli/applications/:id`

**Response:**

```typescript
interface ApplicationStatusResponse {
  id: string;
  name: string;
  status: "active" | "paused" | "disconnected";

  connection: {
    features: string[];
    apiKeyPrefix: string;
  };

  sync: {
    enabled: boolean;
    lastSyncAt?: number;
    lastSyncStatus?: "success" | "partial" | "failed";
  };

  deployment?: {
    productionUrl?: string;
    stagingUrl?: string;
    deploymentStatus: string;
    lastDeployedAt?: number;
  };

  cli: {
    registeredAt: number;
    lastActivityAt: number;
    generatedFiles: Array<{
      path: string;
      type: string;
      generatedAt: number;
    }>;
  };
}
```

### Command: `l4yercak3 sync`

Syncs data between local and backend.

**Endpoint:** `POST /api/v1/cli/applications/:id/sync`

**Request:**

```typescript
interface SyncRequest {
  direction: "push" | "pull" | "bidirectional";
  models?: string[];              // Optional: specific models to sync
  dryRun?: boolean;               // Preview without making changes
}
```

**Response:**

```typescript
interface SyncResponse {
  success: boolean;
  direction: string;
  results: Array<{
    model: string;
    recordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    errors: number;
  }>;
  duration: number;
}
```

---

## Part 6: Model Detection (Priority 4)

### Detecting Local Models

CLI should detect models from:

**Prisma:**
```typescript
// Parse prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String?
  lastName  String?
}
```

**TypeScript interfaces:**
```typescript
// Scan src/types/*.ts for interface definitions
interface User {
  id: string;
  email: string;
  firstName?: string;
}
```

### Mapping to L4YERCAK3 Types

```typescript
const TYPE_MAPPINGS = {
  // Model name patterns → L4YERCAK3 type
  'user': 'contact',
  'customer': 'contact',
  'member': 'contact',
  'company': 'crm_organization',
  'organization': 'crm_organization',
  'event': 'event',
  'meeting': 'event',
  'product': 'product',
  'item': 'product',
  'order': 'transaction',
  'invoice': 'invoice',
  'ticket': 'ticket',
  'form': 'form',
  'project': 'project',
};

function detectModelMapping(localModel: string): {
  layerCakeType: string;
  confidence: number;
} {
  const normalized = localModel.toLowerCase();

  for (const [pattern, type] of Object.entries(TYPE_MAPPINGS)) {
    if (normalized.includes(pattern)) {
      return { layerCakeType: type, confidence: 80 };
    }
  }

  return { layerCakeType: 'unknown', confidence: 0 };
}
```

---

## Summary: Implementation Priority

### Week 1-2: Core Registration

1. **`l4yercak3 init`** command
   - Project detection (framework, TypeScript, databases)
   - Feature selection prompt
   - API call to register application
   - Basic code generation (API client + types)

2. **Backend endpoints** (we build these)
   - `POST /api/v1/cli/applications`
   - `GET /api/v1/cli/applications/by-path`

### Week 3-4: Status & Updates

3. **`l4yercak3 status`** command
   - Show application status
   - Show connected features
   - Show last sync time

4. **`l4yercak3 update`** command
   - Re-run detection
   - Update features
   - Regenerate code

5. **Backend endpoints**
   - `GET /api/v1/cli/applications/:id`
   - `PATCH /api/v1/cli/applications/:id`

### Week 5-6: Sync & Models

6. **`l4yercak3 sync`** command
   - Push/pull data
   - Dry run mode

7. **Model detection**
   - Prisma schema parsing
   - TypeScript interface detection
   - Mapping suggestions

8. **Backend endpoints**
   - `POST /api/v1/cli/applications/:id/sync`

---

## CLI Team Deliverables Checklist

### Phase 1 (Start Now)

- [ ] **Project detection function** - Detect framework, TypeScript, databases
- [ ] **Project hash function** - SHA256 of absolute path
- [ ] **Feature selection UI** - Multi-select prompt for features
- [ ] **Register application API call** - POST to `/api/v1/cli/applications`
- [ ] **Check existing application** - GET `/api/v1/cli/applications/by-path`
- [ ] **API client template** - Generate `layercake.ts`
- [ ] **Types template** - Generate `layercake.types.ts`
- [ ] **Env file handling** - Create/update `.env.local`

### Phase 2 (After Phase 1)

- [ ] **Status command** - Show application status
- [ ] **Update command** - Update application config
- [ ] **Regenerate command** - Regenerate files from templates

### Phase 3 (After Phase 2)

- [ ] **Sync command** - Push/pull data
- [ ] **Model detection** - Parse Prisma/TypeScript
- [ ] **Mapping suggestions** - Auto-suggest model mappings

---

## Questions for CLI Team

1. **Config storage location?** Currently `~/.l4yercak3/config.json` - is this correct?
2. **Multiple organizations?** How should CLI handle users with access to multiple orgs?
3. **Offline mode?** Should CLI work offline with cached data?
4. **Interactive vs flags?** Support both `l4yercak3 init` (interactive) and `l4yercak3 init --features=crm,events` (flags)?

---

## Backend Endpoints We Need to Build

For CLI teams to work, we need to implement these endpoints:

| Endpoint | Method | Priority | Description |
|----------|--------|----------|-------------|
| `/api/v1/cli/applications` | POST | P1 | Register new application |
| `/api/v1/cli/applications/by-path` | GET | P1 | Find by project hash |
| `/api/v1/cli/applications/:id` | GET | P2 | Get application details |
| `/api/v1/cli/applications/:id` | PATCH | P2 | Update application |
| `/api/v1/cli/applications/:id/sync` | POST | P3 | Trigger/report sync |
| `/api/v1/cli/applications` | GET | P2 | List all applications |

**These endpoints will be built in parallel with CLI work.**
