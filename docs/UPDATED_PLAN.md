# 🍰 L4YERCAK3 CLI Tool - Updated Strategic Plan

## Executive Summary

Based on new information about backend capabilities and publishing ontology, this updated plan refines the CLI tool strategy with a focus on **maximum automation** and **one-click integration**.

---

## Key Updates

### ✅ API Key Generation
- **Status:** Can be implemented via backend API
- **Action:** Create `POST /api/v1/api-keys/generate` endpoint
- **CLI Integration:** CLI will call this endpoint to generate API keys automatically

### ✅ OAuth Automation - CLARIFIED
- **What We're Automating:** Frontend OAuth (customer login), NOT backend OAuth
- **Strategy:** Use Google Cloud API, Microsoft Graph API, GitHub API to create OAuth apps
- **User Input Required:** One-time permission grant to create OAuth apps
- **Result:** OAuth credentials automatically generated and saved to `.env.local`
- **Business Value:** More automation = higher pricing potential
- **See:** `docs/OAUTH_CLARIFICATION.md` for detailed explanation

### ✅ TypeScript Types Generation - CLARIFIED
- **Approach:** Schema endpoint that returns API structure (OpenAPI/JSON Schema)
- **Security:** Read-only, requires authentication, NO database access
- **What It Returns:** API endpoint definitions, request/response types
- **Example:** Like OpenAPI spec - just describes API structure
- **Implementation:** `GET /api/v1/schema` endpoint (needs to be created)

### ✅ Publishing Ontology Integration
- **Location:** `vc83-com/convex/publishingOntology.ts`
- **Key Features:**
  - Auto-detect env vars from GitHub repos
  - Deployment configuration management
  - Environment variable storage
- **CLI Integration:** Use for env var detection and template discovery

---

## Enhanced Integration Workflow

### One-Click Integration Flow

```
1. Developer runs: npx @l4yercak3/cli spread
   ↓
2. CLI detects project type (Next.js, etc.)
   ↓
3. CLI checks if GitHub repo exists
   ↓
4. If GitHub repo found:
   - Auto-detect env vars from .env.example
   - Pre-fill deployment configuration
   ↓
5. Interactive setup (minimal):
   - Backend API URL (auto-detect if possible)
   - Organization selection/login
   - Features to enable (CRM, Projects, Invoices, OAuth, Stripe)
   ↓
6. CLI automates:
   - Generate API key via backend API
   - Create OAuth apps (where possible)
   - Generate callback URLs
   - Create published page config (if using publishing ontology)
   ↓
7. CLI generates:
   - API client code with TypeScript types
   - Environment files (.env.local)
   - NextAuth.js configuration (if OAuth enabled)
   - Stripe webhook handler (if Stripe enabled)
   - Type definitions
   ↓
8. Developer fills in any remaining OAuth credentials (if not automated)
   ↓
9. Integration complete! 🎉
```

---

## Publishing Ontology Integration Strategy

### How CLI Uses Publishing Ontology

#### 1. **Environment Variable Detection**
```javascript
// CLI can call backend action
const envVars = await backendClient.autoDetectEnvVarsFromGithub({
  githubUrl: 'https://github.com/user/repo'
});

// Returns:
// {
//   success: true,
//   foundFile: '.env.example',
//   envVars: [
//     { key: 'NEXT_PUBLIC_API_URL', description: '...', required: true },
//     { key: 'API_KEY', description: '...', required: true }
//   ]
// }
```

**Benefits:**
- Automatically detect required env vars from template repos
- Pre-fill environment file templates
- Reduce setup friction

#### 2. **Deployment Configuration**
```javascript
// CLI can read existing deployment config
const deployment = await backendClient.getDeploymentEnvVars({
  pageId: 'published_page_id'
});

// Use this to pre-fill env vars if page already exists
```

#### 3. **Template Discovery**
- CLI can query published pages to discover available templates
- Use template configs to generate appropriate code
- Link frontend projects to published page configs

---

## Enhanced Feature Roadmap

### Phase 1: Core Integration (MVP) 🎯

#### 1.1 Project Detection & Analysis
- [x] Detect Next.js projects
- [ ] Detect GitHub repository (from git remote)
- [ ] Detect existing API client patterns
- [ ] Detect existing OAuth setup
- [ ] **NEW:** Auto-detect env vars from GitHub repo

#### 1.2 Configuration Wizard (Minimal Input)
- [ ] **NEW:** Account creation (if no account exists)
- [ ] **NEW:** Organization type selection (agency vs regular)
- [ ] **NEW:** Sub-organization creation (if agency)
- [ ] Backend API URL (with auto-detection)
- [ ] Organization login/selection (or use newly created)
- [ ] Features to enable (CRM, Projects, Invoices, OAuth, Stripe)
- [ ] **NEW:** Use publishing ontology to pre-fill env vars

#### 1.3 Automated Setup
- [ ] **NEW:** Create user account + organization via backend API
- [ ] **NEW:** Generate API key via backend API (or use existing)
- [ ] **NEW:** Create OAuth apps programmatically (Google/Microsoft/GitHub APIs)
- [ ] **NEW:** Request user permission for OAuth app creation (one-time)
- [ ] Generate OAuth callback URLs automatically
- [ ] **NEW:** Create/update published page config

#### 1.4 File Generation
- [ ] Generate API client with TypeScript types
  - Scoped to Sub-Organization (for agencies) or Organization (for regular)
  - NOT scoped to CRM Organization (CRM Org is customer data, not platform org)
- [ ] Generate `.env.local` with detected/pre-filled values
- [ ] Generate NextAuth.js configuration (if OAuth enabled)
  - Creates frontend_users linked to crm_contacts
  - Scoped to Sub-Organization or Organization
  - All user management in backend
- [ ] Generate Stripe webhook handler (if Stripe enabled)
- [ ] **NEW:** Generate Stripe onboarding page
  - For Sub-Organization (if agency) or Organization (if regular)
  - Customer-facing, simple UI
  - Uses Sub-Org's or Org's API key
- [ ] Generate TypeScript type definitions

### Phase 2: Advanced Automation 🚀

#### 2.1 Stripe Integration
- [ ] **Stripe Connect OAuth:** Initiate Stripe Connect onboarding
- [ ] **Customer-Facing Onboarding:** Generate simple UI for Sub-Organization/Organization to onboard themselves
  - **CRITICAL:** Agencies cannot onboard Sub-Organizations (legal requirement)
  - Sub-Organizations must complete OAuth flow themselves
  - **NOTE:** CRM Organizations do NOT have Stripe accounts (they're customer data)
- [ ] **Webhook Setup:** Create webhook endpoints via Stripe API
- [ ] **Environment Variables:** Auto-detect and configure Stripe keys
- [ ] **Code Generation:** Generate webhook handlers and Stripe utilities
- [ ] **Agency Support:** Handle Sub-Organization Stripe setup (customer self-service)

#### 2.2 OAuth Automation
- [ ] **Google OAuth:** Use Google Cloud API to create OAuth apps
- [ ] **Microsoft OAuth:** Use Azure AD API to create OAuth apps
- [ ] **GitHub OAuth:** Use GitHub API to create OAuth apps
- [ ] Store OAuth credentials securely
- [ ] Test OAuth flow automatically

#### 2.3 Publishing Ontology Integration
- [ ] Create published page configs automatically
- [ ] Link frontend projects to published pages
- [ ] Sync deployment configurations
- [ ] Manage environment variables via publishing ontology

#### 2.4 TypeScript Types
- [ ] **Option A:** Fetch schema from backend endpoint
- [ ] **Option B:** Maintain types manually based on API docs
- [ ] Generate type definitions from schema/types
- [ ] Keep types in sync with backend changes

### Phase 3: One-Click Experience ✨

#### 3.1 Intelligent Defaults
- [ ] Auto-detect backend URL from organization
- [ ] Auto-select features based on project type
- [ ] Auto-configure OAuth based on organization settings
- [ ] Auto-generate all possible configurations

#### 3.2 Template Integration
- [ ] Discover templates from publishing ontology
- [ ] Generate code based on template configs
- [ ] Link projects to template pages
- [ ] Sync template updates

#### 3.3 Zero-Config Mode
- [ ] `l4yercak3 spread --auto` - fully automated setup
- [ ] `l4yercak3 spread --template <name>` - use template
- [ ] `l4yercak3 spread --github <url>` - auto-detect from GitHub

---

## Technical Implementation Details

### Backend API Endpoints Needed

#### 1. Account Creation
```typescript
POST /api/v1/auth/create-account
Body: {
  email: string;
  name: string;
  organizationName: string;
}
Response: {
  userId: string;
  organizationId: string;
  apiKey: string; // Auto-generated
  sessionToken: string; // For CLI to use
}
```

#### 2. API Key Generation
```typescript
POST /api/v1/api-keys/generate
Authorization: Bearer <user_session_token>
Body: {
  name: string;
  scopes?: string[];
}
Response: {
  apiKey: string;
  keyPrefix: string;
  createdAt: number;
}
```

#### 3. OAuth App Creation
**Note:** This happens via provider APIs (Google Cloud, Microsoft Graph, GitHub), not backend API.
CLI uses provider APIs directly with user's permission.

#### 4. Stripe Integration
```typescript
POST /api/v1/stripe/start-onboarding
Authorization: Bearer <api_key>
Body: {
  returnUrl: string;
  refreshUrl: string;
  isTestMode?: boolean;
}
Response: {
  onboardingUrl: string;
  state: string;
}

GET /api/v1/stripe/status
Authorization: Bearer <api_key>
Response: {
  isConnected: boolean;
  accountId?: string;
  status: string;
  publishableKey?: string;
}

GET /api/v1/stripe/keys
Authorization: Bearer <api_key>
Response: {
  publishableKey: string;
}
```

#### 5. Schema/Type Definitions
```typescript
GET /api/v1/schema
Response: {
  // OpenAPI spec or JSON Schema
  // Or TypeScript type definitions
}
```

### CLI Backend Client

```javascript
// src/api/backend-client.js
class BackendClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  // Generate API key
  async generateApiKey(name, scopes) {
    // Call POST /api/v1/api-keys/generate
  }

  // Auto-detect env vars from GitHub
  async autoDetectEnvVars(githubUrl) {
    // Call publishing ontology action
  }

  // Create OAuth app via provider APIs
  async createOAuthApp(provider, config) {
    // Use Google Cloud API / Microsoft Graph API / GitHub API
    // Requires user permission (one-time grant)
  }
  
  // Create account
  async createAccount(email, name, orgName) {
    // Call POST /api/v1/auth/create-account
  }

  // Get schema/types
  async getSchema() {
    // Call schema endpoint
  }

  // Stripe integration
  async startStripeOnboarding(returnUrl, refreshUrl, isTestMode) {
    // Call POST /api/v1/stripe/start-onboarding
  }

  async getStripeStatus() {
    // Call GET /api/v1/stripe/status
  }

  async getStripeKeys() {
    // Call GET /api/v1/stripe/keys
  }
}
```

---

## Updated Success Metrics

### Automation Metrics
- **Setup Time:** Target < 2 minutes from `npx @l4yercak3/cli spread` to working integration
- **Manual Steps:** Target < 3 manual inputs required
- **OAuth Automation:** Target 80%+ of OAuth setups fully automated
- **Env Var Detection:** Target 90%+ accuracy in auto-detection

### Developer Experience Metrics
- **One-Click Success Rate:** % of integrations completed with `--auto` flag
- **Error Rate:** < 5% of integrations require manual troubleshooting
- **Documentation Views:** Track which docs are needed most

---

## Next Steps

### Immediate (This Week)
1. **Backend Team:**
   - [ ] Create API key generation endpoint
   - [ ] Document OAuth app creation APIs (if available)
   - [ ] Clarify TypeScript types approach (schema endpoint vs manual)

2. **CLI Team:**
   - [ ] Implement GitHub repo detection
   - [ ] Integrate publishing ontology env var detection
   - [ ] Build backend API client for CLI

### Short-term (Next 2 Weeks)
1. **OAuth Automation Research:**
   - [ ] Research Google Cloud API for OAuth app creation
   - [ ] Research Microsoft Graph API for OAuth app creation
   - [ ] Research GitHub API for OAuth app creation
   - [ ] Document automation possibilities

2. **TypeScript Types:**
   - [ ] Implement schema fetching (if endpoint available)
   - [ ] Or create manual type definitions based on API docs
   - [ ] Build type generation system

### Medium-term (Next Month)
1. **One-Click Integration:**
   - [ ] Implement `--auto` flag
   - [ ] Reduce manual inputs to minimum
   - [ ] Test with real projects

---

## Questions for Backend Team

1. ✅ **TypeScript Types:** CLARIFIED - Schema endpoint preferred (read-only API structure)
   - **Action:** Create `GET /api/v1/schema` endpoint
   - **Security:** Requires auth, read-only, no database access

2. ✅ **OAuth App Creation:** CLARIFIED - Use provider APIs directly
   - Google Cloud API ✅
   - Microsoft Graph API ✅
   - GitHub API ✅
   - **Action:** Research provider APIs, implement in CLI

3. **Account Creation:** Can we create accounts via API?
   - **Action:** Create `POST /api/v1/auth/create-account` endpoint
   - **Returns:** User, org, API key, session token

4. **API Key Generation:** Timeline for endpoint implementation?
   - **Action:** Create `POST /api/v1/api-keys/generate` endpoint

5. **Publishing Ontology:** Can CLI create/update published page configs during setup?
   - **Action:** Verify CLI can call publishing ontology mutations

6. ✅ **Stripe Integration:** CLARIFIED - Stripe Connect setup needed
   - **Action:** Create Stripe API endpoints (start-onboarding, status, keys)
   - **Action:** Implement Stripe webhook automation via Stripe API
   - **CRITICAL:** Generate customer-facing Stripe onboarding page (for agencies)
   - **Legal Requirement:** Customers must onboard themselves (agencies cannot)
   - **See:** `docs/STRIPE_INTEGRATION.md` for detailed plan
   - **See:** `docs/ARCHITECTURE_RELATIONSHIPS.md` for relationship hierarchy

7. ✅ **User Management & Relationships:** CLARIFIED & CORRECTED
   - **Backend Owns All:** Frontend users, CRM contacts managed in backend
   - **Hierarchy (Agency):** Agency → Sub-Organization → CRM Organization → CRM Contacts/Frontend Users
   - **Hierarchy (Regular):** Organization → CRM Organization → CRM Contacts/Frontend Users
   - **Key Distinction:** CRM Organization = Customer data (NOT platform organization)
   - **Sub-Organization:** Platform organization created by agency (the customer boilerplate is built FOR)
   - **Authentication:** Creates frontend_users linked to crm_contacts automatically
   - **Scoping:** Boilerplate scoped to Sub-Organization (for agencies) or Organization (for regular)
   - **Stripe:** Sub-Organization or Organization owns Stripe account (NOT CRM Organization)
   - **See:** `docs/ARCHITECTURE_RELATIONSHIPS_V2.md` for corrected complete picture

---

**Last Updated:** 2025-01-14  
**Status:** Updated with new information  
**Next Review:** After backend team clarifications

