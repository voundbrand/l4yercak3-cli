# Implementation Phase Summary

## Quick Overview

**What CLI Does:** Sets up boilerplate and connects it to backend API  
**What Backend Provides:** APIs for account management, Stripe, OAuth, CRM, etc.

---

## Phase Breakdown

### Phase 0: Foundation 🏗️ (Week 1-2)

**Backend Must Build:**
- ✅ Account creation endpoint (`POST /api/v1/auth/create-account`)
- ✅ API key generation endpoint (`POST /api/v1/api-keys/generate`)
- ✅ Sub-organization creation endpoint (`POST /api/v1/organizations/create-sub`) - for agencies

**CLI Must Build:**
- ✅ Project structure (commands, generators, detectors)
- ✅ Backend API client

**Dependencies:** None - foundation for everything else

---

### Phase 1: Core Integration 🎯 (Week 2-3)

**Backend Must Build:**
- ✅ Stripe API wrappers (wrap existing functions)
  - `POST /api/v1/stripe/start-onboarding`
  - `GET /api/v1/stripe/status`
  - `GET /api/v1/stripe/keys`

**CLI Must Build:**
- ✅ Project detection (Next.js, GitHub, etc.)
- ✅ Configuration wizard
- ✅ API client generation
- ✅ Environment file generation

**Dependencies:** Phase 0 complete

**Outcome:** CLI can generate boilerplate that connects to backend

---

### Phase 2: Authentication & OAuth 🚀 (Week 3-4)

**Backend Must Build:**
- 🟡 OAuth app creation APIs (if provider APIs support it)
- OR: Manual setup guide (if automation not possible)

**CLI Must Build:**
- ✅ OAuth setup (automated or manual)
- ✅ NextAuth.js configuration generation
- ✅ Sign-in page generation

**Dependencies:** Phase 1 complete

**Outcome:** Frontend users can authenticate, linked to CRM contacts

---

### Phase 3: Stripe Integration 💳 (Week 4-5)

**Backend Must Build:**
- ✅ Stripe webhook forwarding (`POST /api/v1/stripe/webhooks/forward`)

**CLI Must Build:**
- ✅ Stripe onboarding page generation (customer-facing)
- ✅ Webhook handler generation
- ✅ Stripe environment setup

**Dependencies:** Phase 1 complete (Stripe APIs)

**Outcome:** Sub-Organization/Organization can connect Stripe, webhooks work

---

### Phase 4: Advanced Features ✨ (Week 6+)

**Backend Must Build:**
- 🟢 Publishing ontology APIs
- 🟢 Schema endpoint (for TypeScript types)

**CLI Must Build:**
- 🟢 TypeScript types generation
- 🟢 Project templates
- 🟢 Advanced automation

**Dependencies:** Phases 1-3 complete

**Outcome:** Polish and advanced features

---

## Critical Backend Endpoints Needed

### Must Have (Phase 0-1)
1. ✅ **CLI Authentication** - Browser OAuth flow (`GET /auth/cli-login`, `GET /auth/cli/callback`)
2. ✅ **Session Management** - Validate/refresh CLI sessions (`GET /auth/cli/validate`, `POST /auth/cli/refresh`)
3. ✅ `generateApiKey` action exists - Call directly with authenticated session (`convex/actions/apiKeys.ts`)
4. ⚠️ `POST /api/v1/organizations/create-sub` - Create sub-org (SKIP for MVP - feature not implemented yet)
5. `POST /api/v1/stripe/start-onboarding` - Wrap `getStripeOnboardingUrl` action
6. ✅ `getStripeConnectStatus` query exists - Call directly with authenticated session
7. `GET /api/v1/stripe/keys` - Get Stripe publishable key (may need to create)
8. `POST /api/v1/stripe/webhooks/forward` - Forward webhooks from frontend

### Nice to Have (Phase 2-4)
8. `GET /api/v1/schema` - API schema for TypeScript types
9. OAuth app creation APIs (if provider APIs support it)
10. Publishing ontology APIs

---

## Questions for Backend Team ✅ ALL ANSWERED

### Phase 0 Questions ✅ ANSWERED
1. ✅ **Sub-Organization Creation:** Still being built - Skip for MVP, add when feature is ready
2. ✅ **API Key Generation:** Already exists! `convex/actions/apiKeys.ts:generateApiKey` - Call directly with authenticated session
3. ✅ **Account Creation:** CLI requires login first (like GitHub CLI) - User authenticates via browser OAuth, then CLI can create orgs/API keys
4. ✅ **CLI Authentication:** Follow GitHub CLI pattern - `l4yercak3 login` opens browser OAuth, stores session token

### Phase 1 Questions ✅ ANSWERED
4. ✅ **Stripe APIs:** Can wrap existing:
   - `getStripeOnboardingUrl` action (requires sessionId)
   - `getStripeConnectStatus` query ✅ (already exists)
5. **Schema Endpoint:** Do we want to implement this now or later? (Still open)

### Phase 2 Questions ✅ ANSWERED
6. ✅ **OAuth Automation:** Manual setup approach:
   - Generate step-by-step guide with todo list
   - Generate example `.env.local` file
   - Include links to provider setup pages
   - User completes manually, fills in env vars

---

## Next Steps

1. **Backend Team:** Review Phase 0-1 endpoints, confirm what exists vs what needs to be built
2. **CLI Team:** Start Phase 0 CLI tasks (project structure, backend API client)
3. **Both Teams:** Coordinate on API contracts and testing

---

**See:** `IMPLEMENTATION_PHASES.md` for detailed breakdown  
**See:** `ARCHITECTURE_RELATIONSHIPS.md` for organization hierarchy

