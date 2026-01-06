# Implementation Phases - Backend & CLI Breakdown

## Overview

This document breaks down the implementation into clear phases, separating **Backend tasks** from **CLI tasks**, and identifying dependencies between them.

**Key Principle:** CLI sets up boilerplate and connects it to backend. Backend provides APIs that CLI needs.

---

## Phase 0: Foundation & Backend Prerequisites 🏗️

**Goal:** Set up backend APIs that CLI needs to function

### Backend Tasks

#### 0.1 CLI Authentication Flow (Like GitHub CLI)
- [ ] **CLI Login Command** (Browser-based OAuth)
  - User runs: `l4yercak3 login`
  - Opens browser for OAuth flow (similar to `gh auth login`)
  - User authenticates with platform (Google/Microsoft/GitHub)
  - Returns session token stored locally (`~/.l4yercak3/config.json` or similar)
  - **Security:** Requires 2FA if enabled on account
  - **Pattern:** Follow GitHub CLI authentication pattern
  - **Dependency:** Backend OAuth endpoints (for platform login, not frontend OAuth)
  - **Priority:** 🔴 HIGH (foundation for everything else)

- [ ] **CLI Session Management**
  - Store session token securely
  - Refresh tokens when expired
  - Validate session before API calls
  - **Dependency:** CLI login
  - **Priority:** 🔴 HIGH

- [ ] **Create Organization** (After authentication)
  - `POST /api/v1/organizations/create` (or use existing endpoint)
  - Requires authenticated session
  - Creates organization for logged-in user
  - Returns: `{ organizationId, apiKey }`
  - **Note:** User must be logged in first (via CLI login)
  - **Dependency:** CLI authentication
  - **Priority:** 🔴 HIGH

- [ ] **Create Sub-Organization Endpoint** (for agencies) ⚠️ FUTURE FEATURE
  - `POST /api/v1/organizations/create-sub`
  - Creates sub-organization under agency
  - Returns: `{ subOrganizationId, apiKey }`
  - **Status:** Sub-org feature not yet implemented (see `vc83-com/.kiro/sub_org_feature/`)
  - **Dependency:** Sub-org feature implementation
  - **Priority:** 🟢 LOW (can skip for MVP, add when sub-org feature is ready)

- [ ] **Detect Organization Type**
  - `GET /api/v1/organizations/type`
  - Returns: `{ type: "agency" | "regular", canCreateSubOrgs: boolean }`
  - **Dependency:** None
  - **Priority:** 🟡 MEDIUM

#### 0.2 API Key Management ✅ ALREADY EXISTS
- [x] **Generate API Key Action** - `convex/actions/apiKeys.ts:generateApiKey`
  - Already implemented! ✅
  - Action: `generateApiKey({ sessionId, organizationId, name, scopes, type })`
  - Returns: `{ id, key, keyPrefix, name, scopes, createdAt, warning }`
  - **Note:** Requires sessionId - CLI will have session from login
  - **CLI Task:** Call Convex action directly using authenticated session
  - **Priority:** 🔴 HIGH (but already exists!)

- [ ] **List API Keys**
  - `GET /api/v1/api-keys`
  - Returns list of organization's API keys
  - **Dependency:** None
  - **Priority:** 🟢 LOW

#### 0.3 Schema Endpoint
- [ ] **API Schema Endpoint**
  - `GET /api/v1/schema`
  - Returns API structure/types (OpenAPI or JSON Schema format)
  - Read-only, requires authentication
  - **Dependency:** None
  - **Priority:** 🟡 MEDIUM (needed for TypeScript type generation)

### CLI Tasks

#### 0.1 Project Structure Setup
- [ ] Create command structure (`src/commands/`)
- [ ] Create generator structure (`src/generators/`)
- [ ] Create detector structure (`src/detectors/`)
- [ ] Create config manager (`src/config/`)
- [ ] Create backend API client (`src/api/backend-client.js`)
- [ ] **Dependency:** None
- **Priority:** 🔴 HIGH

#### 0.2 Backend API Client
- [ ] Implement backend API client class
- [ ] Handle authentication (API key, session tokens)
- [ ] Error handling and retries
- [ ] **Dependency:** Backend endpoints (0.1, 0.2)
- **Priority:** 🔴 HIGH

---

## Phase 1: Core Integration (MVP) 🎯

**Goal:** Basic CLI that can set up boilerplate and connect to backend

### Backend Tasks

#### 1.1 Stripe Integration APIs (Wrap Existing Functions) ✅ MOSTLY EXISTS
- [ ] **Start Stripe Onboarding API** (Wrap existing)
  - Wrap existing `convex/stripeConnect.ts:getStripeOnboardingUrl` action
  - `POST /api/v1/stripe/start-onboarding`
  - **Note:** Requires `sessionId` - CLI will need to handle sessions
  - **Dependency:** Stripe Connect already exists ✅
  - **Priority:** 🟡 MEDIUM

- [x] **Get Stripe Status Query** - `convex/stripeConnect.ts:getStripeConnectStatus` ✅
  - Already implemented! ✅
  - Query: `getStripeConnectStatus({ organizationId })`
  - Returns account status, onboarding status, etc.
  - **CLI Task:** Wrap in API endpoint OR call Convex query directly
  - **Priority:** 🟡 MEDIUM

- [ ] **Get Stripe Keys API**
  - `GET /api/v1/stripe/keys`
  - Returns organization's Stripe publishable key
  - **Dependency:** Stripe Connect already exists ✅
  - **Priority:** 🟡 MEDIUM

#### 1.2 OAuth User Sync (Already Exists ✅)
- [x] `POST /api/v1/auth/sync-user` - Already implemented
- [x] `GET /api/v1/auth/user` - Already implemented
- [x] `POST /api/v1/auth/validate-token` - Already implemented

### CLI Tasks

#### 1.1 Project Detection ✅ COMPLETE
- [x] Detect Next.js projects
  - Check for `next.config.*`, `package.json`
  - Detect App Router vs Pages Router
- [x] Detect GitHub repository (from git remote)
- [x] Detect existing API client patterns
- [x] Detect existing OAuth setup ✅ NEW
- [ ] **Dependency:** None
- **Priority:** 🔴 HIGH

#### 1.2 Configuration Wizard ✅ COMPLETE
- [x] Check if user is logged in (check for session token)
  - If not logged in: Prompt `l4yercak3 login` first
  - If logged in: Continue with setup
- [x] Interactive prompts:
  - Organization type (agency vs regular) - Note: Agency sub-orgs not yet implemented
  - Create new organization or use existing?
  - Sub-organization creation (if agency) - ⚠️ Future feature
  - Backend API URL (auto-detect if possible)
  - Features to enable (CRM, Projects, Invoices, OAuth, Stripe)
- [x] Save configuration to `.l4yercak3/config.json` ✅ NEW
- [ ] **Dependency:** CLI authentication (Phase 0)
- **Priority:** 🔴 HIGH

#### 1.3 File Generation ✅ COMPLETE
- [x] Generate API client (`lib/api-client.ts`)
  - Scoped to Organization (Sub-Organization support deferred)
  - Uses organization's API key
  - Typed functions for CRM, Projects, Invoices
- [x] Generate environment file (`.env.local`)
  - Pre-fill with detected values
  - Include all required variables
- [x] Generate `.gitignore` updates (if needed) ✅ NEW
- [ ] **Dependency:** Backend API client (Phase 0)
- **Priority:** 🔴 HIGH

#### 1.4 Basic Testing
- [ ] Test with example projects
  - `l4yercak3-landing`
  - `freelancer-client-portal`
- [ ] Verify API client works
- [ ] Verify environment variables are correct
- [ ] **Dependency:** All Phase 1 tasks
- **Priority:** 🔴 HIGH

---

## Phase 2: Authentication & OAuth 🚀

**Goal:** Automate OAuth setup for frontend authentication

### Backend Tasks

#### 2.1 OAuth App Creation APIs (If Possible)
- [ ] Research provider APIs:
  - Google Cloud API for OAuth app creation
  - Microsoft Graph API for OAuth app creation
  - GitHub API for OAuth app creation
- [ ] **Decision Point:** Can we automate this?
  - If yes: Create backend endpoints to proxy provider APIs
  - If no: CLI guides user through manual setup
- [ ] **Dependency:** Provider API research
- **Priority:** 🟡 MEDIUM (can guide manually if needed)

### CLI Tasks

#### 2.1 OAuth Setup (Manual Guide Approach) ✅ DECISION MADE
- [ ] Detect OAuth providers needed (Google, Microsoft, GitHub)
- [ ] **Generate OAuth Setup Guide** (Manual approach - no automation)
  - Create step-by-step todo list
  - Generate example `.env.local` file with placeholders
  - Include links to provider setup pages:
    - Google Cloud Console
    - Microsoft Azure Portal
    - GitHub Developer Settings
  - Include correct redirect URLs (production + development)
  - Generate markdown guide file: `OAUTH_SETUP_GUIDE.md`
  - **Template:** See `docs/OAUTH_SETUP_GUIDE_TEMPLATE.md`
- [ ] Generate NextAuth.js configuration
  - `app/api/auth/[...nextauth]/route.ts`
  - Configure providers (with placeholder env vars)
  - Set up sync-user callback
- [ ] Generate sign-in page (`app/auth/signin/page.tsx`)
- [ ] **Note:** User will manually complete OAuth app setup, then fill in `.env.local`
- [ ] **Future:** Video tutorial (user will create)
- [ ] **Dependency:** None (manual setup)
- **Priority:** 🟡 MEDIUM

#### 2.2 Authentication Code Generation
- [ ] Generate session provider wrapper
- [ ] Generate protected route middleware
- [ ] Generate auth utilities
- [ ] **Dependency:** OAuth setup (2.1)
- **Priority:** 🟡 MEDIUM

---

## Phase 3: Stripe Integration 💳

**Goal:** Automate Stripe Connect setup and webhook configuration

### Backend Tasks

#### 3.1 Stripe API Endpoints (Wrap Existing Functions)
- [ ] **Start Onboarding API**
  - Wrap existing `getStripeOnboardingUrl` action
  - `POST /api/v1/stripe/start-onboarding`
  - **Dependency:** Stripe Connect already exists ✅
  - **Priority:** 🟡 MEDIUM

- [ ] **Complete Onboarding Callback**
  - Wrap existing `handleOAuthCallback` mutation
  - `POST /api/v1/stripe/complete-onboarding`
  - **Dependency:** Stripe Connect already exists ✅
  - **Priority:** 🟡 MEDIUM

- [ ] **Webhook Forwarding**
  - `POST /api/v1/stripe/webhooks/forward`
  - Receives webhooks from frontend
  - Forwards to existing webhook processor
  - **Dependency:** Stripe webhooks already exist ✅
  - **Priority:** 🟡 MEDIUM

### CLI Tasks

#### 3.1 Stripe Onboarding Page Generation
- [ ] Generate Stripe connect page (`app/stripe/connect/page.tsx`)
  - Simple UI for Sub-Organization/Organization
  - Calls backend to get onboarding URL
  - Opens Stripe OAuth flow
- [ ] Generate callback handler (`app/stripe/connect/callback/page.tsx`)
  - Handles Stripe OAuth callback
  - Calls backend to complete onboarding
  - Shows success/error states
- [ ] **Dependency:** Backend Stripe APIs (3.1)
- **Priority:** 🟡 MEDIUM

#### 3.2 Webhook Handler Generation
- [ ] Generate webhook handler (`app/api/webhooks/stripe/route.ts`)
  - Verifies Stripe webhook signatures
  - Forwards to backend API
  - Handles errors gracefully
- [ ] **Dependency:** Backend webhook forwarding (3.1)
- **Priority:** 🟡 MEDIUM

#### 3.3 Stripe Environment Variables
- [ ] Fetch Stripe keys from backend
- [ ] Generate `.env.local` with Stripe variables
- [ ] Store webhook secrets securely
- [ ] **Dependency:** Backend Stripe APIs (3.1)
- **Priority:** 🟡 MEDIUM

---

## Phase 4: Advanced Features ✨

**Goal:** Polish and advanced automation

### Backend Tasks

#### 4.1 Publishing Ontology Integration
- [ ] Expose publishing ontology functions via API
  - `GET /api/v1/publishing/env-vars` - Get deployment env vars
  - `POST /api/v1/publishing/env-vars` - Update deployment env vars
- [ ] **Dependency:** Publishing ontology already exists ✅
- **Priority:** 🟢 LOW

#### 4.2 TypeScript Types Generation
- [ ] Implement schema endpoint (if not done in Phase 0)
- [ ] Return OpenAPI/JSON Schema format
- [ ] **Dependency:** None
- **Priority:** 🟢 LOW

### CLI Tasks

#### 4.1 Publishing Ontology Integration
- [ ] Use publishing ontology for env var detection
- [ ] Auto-detect env vars from GitHub repos
- [ ] Pre-fill deployment configurations
- [ ] **Dependency:** Backend publishing APIs (4.1)
- **Priority:** 🟢 LOW

#### 4.2 TypeScript Types Generation
- [ ] Fetch schema from backend
- [ ] Generate TypeScript type definitions
- [ ] Keep types in sync with backend
- [ ] **Dependency:** Backend schema endpoint (4.2)
- **Priority:** 🟢 LOW

#### 4.3 Project Templates
- [ ] Create template system
- [ ] Landing page template
- [ ] Client portal template
- [ ] E-commerce template
- [ ] **Dependency:** Core generation (Phase 1)
- **Priority:** 🟢 LOW

---

## Implementation Timeline

### Week 1-2: Phase 0 + Phase 1 Foundation
**Backend:**
- CLI authentication endpoints (`/auth/cli-login`, `/auth/cli/callback`)
- CLI session management (validate, refresh)
- Organization creation endpoint (for authenticated users)

**CLI:**
- CLI login command (`l4yercak3 login`)
- Browser OAuth flow
- Session token storage
- Project structure setup
- Backend API client (with session handling)
- Project detection
- Basic configuration wizard
- API client generation

### Week 3-4: Phase 1 Complete + Phase 2 Start
**Backend:**
- Stripe API wrappers (if needed)
- Schema endpoint (if needed)

**CLI:**
- Complete file generation
- Environment file generation
- OAuth setup (manual or automated)
- NextAuth.js configuration generation

### Week 5-6: Phase 2 Complete + Phase 3
**Backend:**
- Stripe webhook forwarding (if needed)

**CLI:**
- Stripe onboarding page generation
- Webhook handler generation
- Stripe environment setup

### Week 7+: Phase 4 (Polish)
**Backend:**
- Publishing ontology APIs
- Advanced features

**CLI:**
- TypeScript types generation
- Project templates
- Advanced automation

---

## Questions for Backend Team

### Immediate (Phase 0)
1. **Sub-Organization Creation:** Do we need a separate endpoint, or can we use existing organization creation with `parentOrganizationId`?
2. **API Key Generation:** Does this already exist, or do we need to create it?
3. **Account Creation:** Should this be a single endpoint or multiple steps?

### Phase 1
4. **Stripe APIs:** Can we wrap existing Stripe Connect functions, or do we need new endpoints?
5. **Schema Endpoint:** Do we want to implement this now or later?

### Phase 2
6. **OAuth Automation:** Which providers support programmatic app creation?
   - Google Cloud API?
   - Microsoft Graph API?
   - GitHub API?

---

## Dependencies Map

```
Phase 0 (Backend)
  ├─> Account Creation → CLI needs this
  ├─> API Key Generation → CLI needs this
  └─> Sub-Org Creation → CLI needs this (for agencies)

Phase 0 (CLI)
  ├─> Project Structure → Foundation
  └─> Backend API Client → Needs backend endpoints

Phase 1 (CLI)
  ├─> Project Detection → Independent
  ├─> Config Wizard → Needs backend endpoints
  └─> File Generation → Needs backend API client

Phase 2 (CLI)
  └─> OAuth Setup → Can work manually if automation fails

Phase 3 (CLI)
  └─> Stripe Setup → Needs backend Stripe APIs

Phase 4 (CLI)
  └─> Advanced Features → Nice to have, not critical
```

---

## Success Criteria by Phase

### Phase 0 ✅
- [ ] Backend endpoints exist and are tested
- [ ] CLI can call backend APIs
- [ ] CLI project structure is set up

### Phase 1 ✅
- [ ] CLI detects Next.js projects
- [ ] CLI generates API client
- [ ] CLI generates environment files
- [ ] Generated boilerplate connects to backend
- [ ] Can make API calls successfully

### Phase 2 ✅
- [ ] OAuth setup works (manual or automated)
- [ ] NextAuth.js configuration generated
- [ ] Frontend users can authenticate
- [ ] Frontend users linked to CRM contacts

### Phase 3 ✅
- [ ] Stripe onboarding page generated
- [ ] Sub-Organization/Organization can connect Stripe
- [ ] Webhook handler generated
- [ ] Webhooks forward to backend successfully

### Phase 4 ✅
- [ ] TypeScript types generated from schema
- [ ] Project templates available
- [ ] Advanced automation working

---

**Last Updated:** 2025-01-14  
**Status:** Ready for Implementation  
**Next Step:** Start Phase 0 Backend tasks

