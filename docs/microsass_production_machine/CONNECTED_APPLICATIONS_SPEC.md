# Connected Applications - Schema Specification

## Overview

The `connected_application` object type represents an external application connected to L4YERCAK3 via CLI or boilerplate deployment. It's the **parent container** that ties together API connections, model mappings, deployments, and published pages.

---

## Object Type: `connected_application`

### Base Structure (in `objects` table)

```typescript
{
  _id: Id<"objects">,
  organizationId: Id<"organizations">,
  type: "connected_application",
  subtype: "cli" | "boilerplate" | "manual",
  name: string,                    // "HaffNet Medical Platform"
  description: string,             // "CME course registration platform"
  status: "active" | "paused" | "disconnected" | "archived",
  customProperties: ConnectedApplicationProperties,
  createdBy: Id<"users">,
  createdAt: number,
  updatedAt: number,
}
```

### Custom Properties

```typescript
interface ConnectedApplicationProperties {
  // ========================================
  // SOURCE: Where the app comes from
  // ========================================
  source: {
    type: "cli" | "boilerplate" | "manual";

    // CLI-specific
    projectPathHash?: string;      // SHA256 of local project path (for identification)
    cliVersion?: string;           // CLI version that registered this app

    // Boilerplate-specific
    boilerplateId?: string;        // "freelancer-portal", "event-landing", etc.
    boilerplateVersion?: string;   // Version of boilerplate used

    // Framework detection
    framework: string;             // "nextjs", "remix", "astro", etc.
    frameworkVersion?: string;     // "16.0.0"
    hasTypeScript: boolean;
    routerType?: "app" | "pages";  // For Next.js
  };

  // ========================================
  // CONNECTION: How app talks to L4YERCAK3
  // ========================================
  connection: {
    apiKeyId?: Id<"apiKeys">;      // Reference to API key used
    apiKeyPrefix?: string;         // "sk_live_xxx..." for display
    backendUrl: string;            // "https://app.l4yercak3.com"

    // Features enabled for this app
    features: Array<
      | "crm"
      | "events"
      | "products"
      | "checkout"
      | "tickets"
      | "invoicing"
      | "forms"
      | "projects"
      | "workflows"
      | "templates"
      | "ai"
    >;

    // Dual-database pattern (like HaffNet)
    hasFrontendDatabase: boolean;
    frontendDatabaseType?: "convex" | "prisma" | "drizzle" | "other";
    frontendDatabaseUrl?: string;  // For reference only, not stored
  };

  // ========================================
  // MODEL MAPPINGS: How app models map to L4YERCAK3
  // ========================================
  modelMappings: Array<{
    localModel: string;            // "User", "Company", "Event"
    layerCakeType: string;         // "contact", "crm_organization", "event"
    syncDirection: "push" | "pull" | "bidirectional" | "none";
    confidence: number;            // 0-100, from CLI detection
    isAutoDetected: boolean;       // true if CLI detected, false if manual
    fieldMappings: Array<{
      localField: string;          // "email", "firstName"
      layerCakeField: string;      // "email", "customProperties.firstName"
      transform?: string;          // Optional transform expression
    }>;
  }>;

  // ========================================
  // DEPLOYMENT: Where app is deployed
  // ========================================
  deployment: {
    // Links to deployment system (Phase 1-2 work)
    configurationId?: Id<"objects">;  // deployment_configuration object

    // Quick access URLs
    productionUrl?: string;        // "https://haffnet.vercel.app"
    stagingUrl?: string;           // "https://staging.haffnet.vercel.app"
    localDevUrl?: string;          // "http://localhost:3000"

    // GitHub repo
    githubRepo?: string;           // "owner/repo"
    githubBranch?: string;         // "main"

    // Deployment status
    deploymentStatus: "not_deployed" | "deploying" | "deployed" | "failed";
    lastDeployedAt?: number;
  };

  // ========================================
  // PAGES: Published pages owned by this app
  // ========================================
  pageIds: Array<Id<"objects">>;   // References to published_page objects

  // ========================================
  // SYNC STATUS: Data synchronization state
  // ========================================
  sync: {
    enabled: boolean;
    lastSyncAt?: number;
    lastSyncDirection?: "push" | "pull" | "bidirectional";
    lastSyncStatus?: "success" | "partial" | "failed";

    // Per-model sync stats
    stats: Record<string, {        // Keyed by layerCakeType
      totalRecords: number;
      syncedRecords: number;
      lastSyncAt: number;
      errors: number;
      lastError?: string;
    }>;
  };

  // ========================================
  // CLI METADATA
  // ========================================
  cli: {
    registeredAt: number;          // When CLI first registered this app
    registeredBy?: Id<"users">;    // User who ran CLI
    lastActivityAt: number;        // Last CLI command for this app
    cliSessionId?: string;         // Current/last CLI session

    // Generated files tracking
    generatedFiles: Array<{
      path: string;                // "src/lib/layercake.ts"
      type: string;                // "api-client", "types", "env"
      generatedAt: number;
      hash?: string;               // For change detection
    }>;
  };
}
```

---

## Object Links

### Application → API Key
```typescript
{
  fromObjectId: applicationId,
  toObjectId: apiKeyId,  // In apiKeys table, not objects
  linkType: "uses_api_key",
  organizationId,
  properties: {
    linkedAt: number,
  }
}
```

### Application → Published Pages
```typescript
{
  fromObjectId: applicationId,
  toObjectId: publishedPageId,
  linkType: "owns_page",
  organizationId,
  properties: {
    addedAt: number,
  }
}
```

### Application → Deployment Configuration
```typescript
{
  fromObjectId: applicationId,
  toObjectId: deploymentConfigId,
  linkType: "deploys_via",
  organizationId,
  properties: {
    environment: "production" | "staging",
  }
}
```

---

## Convex Functions Required

### Mutations

```typescript
// Register new application (called by CLI)
registerConnectedApplication(args: {
  token: string,                   // CLI session token
  organizationId: Id<"organizations">,
  name: string,
  source: SourceConfig,
  connection: ConnectionConfig,
  modelMappings?: ModelMapping[],
  deployment?: DeploymentConfig,
}): Promise<{
  applicationId: Id<"objects">,
  apiKeyId?: Id<"apiKeys">,        // If new key was generated
}>

// Update application (called by CLI on re-run)
updateConnectedApplication(args: {
  token: string,
  applicationId: Id<"objects">,
  updates: Partial<ConnectedApplicationProperties>,
}): Promise<void>

// Update sync status (called after sync operations)
updateApplicationSyncStatus(args: {
  token: string,
  applicationId: Id<"objects">,
  syncResult: SyncResult,
}): Promise<void>

// Pause/resume application
setApplicationStatus(args: {
  sessionId: string,
  applicationId: Id<"objects">,
  status: "active" | "paused",
}): Promise<void>

// Disconnect application (soft delete)
disconnectApplication(args: {
  sessionId: string,
  applicationId: Id<"objects">,
}): Promise<void>

// Link page to application
linkPageToApplication(args: {
  sessionId: string,
  applicationId: Id<"objects">,
  pageId: Id<"objects">,
}): Promise<void>
```

### Queries

```typescript
// List all applications for org (for Web Publishing UI)
getConnectedApplications(args: {
  sessionId: string,
  organizationId: Id<"organizations">,
  status?: string,
}): Promise<ConnectedApplication[]>

// Get single application with full details
getConnectedApplication(args: {
  sessionId: string,
  applicationId: Id<"objects">,
}): Promise<ConnectedApplication | null>

// Get application by project path hash (for CLI to find existing)
getApplicationByPathHash(args: {
  token: string,
  organizationId: Id<"organizations">,
  projectPathHash: string,
}): Promise<ConnectedApplication | null>

// Get applications using specific API key
getApplicationsByApiKey(args: {
  sessionId: string,
  apiKeyId: Id<"apiKeys">,
}): Promise<ConnectedApplication[]>
```

---

## REST API Endpoints

### For CLI

```
POST   /api/v1/cli/applications              - Register application
GET    /api/v1/cli/applications              - List applications
GET    /api/v1/cli/applications/:id          - Get application
PATCH  /api/v1/cli/applications/:id          - Update application
DELETE /api/v1/cli/applications/:id          - Disconnect application
POST   /api/v1/cli/applications/:id/sync     - Trigger/report sync
GET    /api/v1/cli/applications/by-path      - Find by project path hash
```

### Authentication

All CLI endpoints use Bearer token authentication:
```
Authorization: Bearer cli_session_xxx
```

---

## Web Publishing UI Changes

### New "Applications" Tab

Position: First tab (before Pages)

**Content:**
- List of connected applications with:
  - Name & framework icon
  - Status badge (active/paused/disconnected)
  - Features enabled (icons)
  - Last sync time
  - Production URL (if deployed)
  - Quick actions: View, Pause, Settings, Disconnect

**Empty State:**
- "No applications connected"
- "Use the L4YERCAK3 CLI to connect an external app, or deploy a boilerplate"
- Buttons: "CLI Documentation", "Deploy Boilerplate"

### Application Detail View

When clicking an application:
- **Overview Tab**: Status, URLs, features, last activity
- **Model Mappings Tab**: Visual mapping table
- **Sync Tab**: Sync status, stats, manual sync button
- **Pages Tab**: Published pages owned by this app
- **Settings Tab**: Edit name, features, deployment config
- **Logs Tab**: Recent CLI activity, sync history

---

## Integration with Existing Systems

### With API Keys (`apiKeys` table)
- Application references API key via `connection.apiKeyId`
- Can query "which apps use this key"
- Revoking key should warn about connected apps

### With Published Pages (`published_page` objects)
- Pages can belong to an application via `pageIds` array
- Page detail shows parent application (if any)
- Deleting app can optionally delete pages

### With Deployment System (`deployment_configuration` objects)
- Application links to deployment config
- Shares GitHub/Vercel settings
- Deployment status synced

### With CLI Sessions (`cliSessions` table)
- Application tracks which CLI session registered it
- Last activity updates on CLI commands
- Session expiry doesn't disconnect app

---

## Migration Strategy

1. **No existing data to migrate** - This is a new object type
2. **Backward compatible** - Existing pages/deployments continue to work
3. **Optional adoption** - Apps without CLI still function
4. **Gradual rollout** - UI can show "Applications" tab only when apps exist

---

## Success Criteria

- [ ] CLI can register application and see it in Web Publishing
- [ ] Web Publishing shows all connected applications
- [ ] Model mappings visible and editable
- [ ] Sync status accurately reflects last CLI sync
- [ ] Disconnecting app doesn't break existing pages
- [ ] API key relationship bidirectional (key → apps, app → key)
