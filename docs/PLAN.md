# 🍰 L4YERCAK3 CLI Tool - Strategic Plan

## Executive Summary

This document outlines the strategic plan for the **Icing on the L4yercak3** CLI tool - a universal adapter that connects any frontend application to the L4YERCAK3 backend API platform.

### Vision

Enable developers to quickly connect their Next.js applications (or any frontend) to the L4YERCAK3 backend API with minimal configuration, automating the setup of:
- API client configuration
- OAuth authentication
- Environment variables
- Type definitions
- Integration patterns

---

## Current State Analysis

### What We Have

#### 1. **Backend Platform (vc83-com)**
- ✅ Full-featured Convex backend with ontology system
- ✅ CRM integration (contacts, organizations)
- ✅ OAuth authentication endpoints
- ✅ Project management backend
- ✅ Invoicing system backend
- ✅ API endpoints for core features
- ✅ Publishing ontology (`convex/publishingOntology.ts`) - manages published pages, deployment configs, env vars

#### 2. **Example Frontend Applications**

**A. L4YERCAK3 Landing Page** (`l4yercak3-landing`)
- ✅ CRM integration via `backend-client.ts`
- ✅ Uses environment variables: `BACKEND_CRM_URL`, `BACKEND_CRM_API_KEY`
- ✅ Contact creation patterns established
- ✅ Newsletter, application, appointment integrations

**B. Freelancer Client Portal** (`freelancer-client-portal`)
- ✅ NextAuth.js OAuth setup (Google/Microsoft)
- ✅ API client with Bearer token auth
- ✅ Uses environment variables: `NEXT_PUBLIC_BACKEND_API_URL`, `BACKEND_API_URL`
- ✅ Typed API functions for projects, invoices, messages
- ✅ Protected routes with middleware

#### 3. **CLI Tool (Current State)**
- ✅ Basic structure with logo display
- ✅ Package configured for npm publishing
- ✅ Commands scaffolded (`spread`, `--help`, `--version`)
- ❌ No actual functionality yet

---

## Strategic Approach

### Option A: CLI Tool as Primary Integration Method (Recommended)

**Why CLI Tool?**
1. **Universal Adapter**: Works with any Next.js project, not just boilerplates
2. **Developer Experience**: One command to set up entire integration
3. **Flexibility**: Can adapt to different project structures
4. **Discoverability**: Easy to find and use via npm
5. **Version Control**: Can update integration patterns over time

**How It Works:**
```bash
# In any Next.js project
npx @l4yercak3/cli spread

# Interactive setup:
# 1. Detect project type (Next.js, Vite, etc.)
# 2. Ask for backend API URL
# 3. Generate API key (or use existing)
# 4. Set up OAuth (if needed)
# 5. Generate API client files
# 6. Create environment variable templates
# 7. Add type definitions
# 8. Configure NextAuth.js (if Next.js)
```

### Option B: Deployment Ontology (Secondary/Complementary)

**When to Use:**
- Automated deployments from backend
- CI/CD pipeline integration
- Multi-project management
- Backend-initiated setups

**Relationship:**
- CLI tool = Developer-initiated integration
- Deployment ontology = Backend-initiated/automated integration
- Both can coexist and complement each other

---

## CLI Tool Feature Roadmap

### Phase 1: Core Integration (MVP) 🎯

#### 1.1 Project Detection
- [ ] Detect Next.js projects (check for `next.config.*`, `package.json`)
- [ ] Detect project structure (App Router vs Pages Router)
- [ ] Detect existing API client patterns
- [ ] Detect existing OAuth setup

#### 1.2 Configuration Wizard
- [ ] Interactive prompts for:
  - Backend API URL
  - API key (generate or use existing)
  - OAuth providers (Google, Microsoft)
  - Features to enable (CRM, Projects, Invoices, etc.)
- [ ] Save configuration to `.l4yercak3/config.json`

#### 1.3 File Generation
- [ ] Generate `lib/api-client.ts` (or adapt existing)
- [ ] Generate `.env.local.example` with required variables
- [ ] Generate TypeScript types from backend schema
- [ ] Generate NextAuth.js configuration (if Next.js)
- [ ] Generate API integration examples

#### 1.4 Environment Setup
- [ ] Create `.env.local` from template
- [ ] Add `.env.local` to `.gitignore` (if not present)
- [ ] Validate environment variables

### Phase 2: Advanced Features 🚀

#### 2.1 API Key Management
- [ ] Generate API keys via backend API
- [ ] Store API keys securely (local keychain)
- [ ] Rotate API keys
- [ ] List active API keys

#### 2.2 OAuth Setup Automation
- [ ] Guide through OAuth app registration
- [ ] Generate OAuth callback URLs
- [ ] Validate OAuth configuration
- [ ] Test OAuth flow

#### 2.3 Code Generation
- [ ] Generate CRUD operations for resources
- [ ] Generate React hooks for API calls
- [ ] Generate form components with validation
- [ ] Generate TypeScript types from API schema

#### 2.4 Integration Testing
- [ ] Test API connectivity
- [ ] Test OAuth flow
- [ ] Validate API responses
- [ ] Generate integration test templates

### Phase 3: Developer Experience ✨

#### 3.1 Project Templates
- [ ] `l4yercak3 spread --template landing-page`
- [ ] `l4yercak3 spread --template client-portal`
- [ ] `l4yercak3 spread --template e-commerce`
- [ ] Custom template support

#### 3.2 Documentation Generation
- [ ] Generate API documentation from backend
- [ ] Create integration guides
- [ ] Generate code examples
- [ ] Create troubleshooting guides

#### 3.3 Update Management
- [ ] Check for CLI updates
- [ ] Update integration patterns
- [ ] Migrate old integrations to new patterns
- [ ] Version compatibility checking

---

## Technical Architecture

### CLI Tool Structure

```
l4yercak3-cli/
├── bin/
│   └── cli.js                 # Entry point
├── src/
│   ├── commands/
│   │   ├── spread.js         # Main integration command
│   │   ├── init.js           # Initialize new project
│   │   ├── login.js          # Authenticate with backend
│   │   ├── generate.js       # Generate code/templates
│   │   └── test.js            # Test integration
│   ├── generators/
│   │   ├── api-client.js     # Generate API client
│   │   ├── oauth.js          # Generate OAuth config
│   │   ├── env.js            # Generate env files
│   │   └── types.js          # Generate TypeScript types
│   ├── detectors/
│   │   ├── project-type.js   # Detect project type
│   │   └── existing-setup.js # Detect existing integrations
│   ├── config/
│   │   └── manager.js        # Config file management
│   ├── api/
│   │   └── backend-client.js # Backend API client for CLI
│   └── utils/
│       ├── prompts.js        # Interactive prompts
│       └── file-operations.js
├── templates/
│   ├── nextjs/
│   │   ├── api-client.ts
│   │   ├── nextauth.ts
│   │   └── env.example
│   └── types/
│       └── api.ts
└── package.json
```

### Integration Patterns

#### Pattern 1: API Client Generation

**Input:**
- Backend API URL
- API key
- Selected features (CRM, Projects, Invoices)

**Output:**
```typescript
// lib/api-client.ts
export class L4yercak3Client {
  constructor(private apiKey: string, private baseUrl: string) {}
  
  // CRM methods
  async createContact(data: CreateContactRequest) { ... }
  async getContacts(filters?: ContactFilters) { ... }
  
  // Project methods
  async createProject(data: CreateProjectRequest) { ... }
  async getProjects(filters?: ProjectFilters) { ... }
  
  // Invoice methods
  async createInvoice(data: CreateInvoiceRequest) { ... }
  async getInvoices(filters?: InvoiceFilters) { ... }
}
```

#### Pattern 2: OAuth Setup

**Input:**
- OAuth providers (Google, Microsoft)
- Project URL

**Output:**
- NextAuth.js configuration
- OAuth provider setup guide
- Environment variables

#### Pattern 3: Environment Variables

**Generated `.env.local.example`:**
```bash
# L4YERCAK3 Backend API
NEXT_PUBLIC_BACKEND_API_URL=https://your-backend.convex.site
BACKEND_API_URL=https://your-backend.convex.site
BACKEND_CRM_URL=https://your-backend.convex.site
BACKEND_CRM_API_KEY=your-api-key-here

# NextAuth.js (if OAuth enabled)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Google OAuth (if enabled)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft OAuth (if enabled)
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
```

---

## Integration Workflow

### Developer Journey

```
1. Developer starts new Next.js project
   ↓
2. Runs: npx @l4yercak3/cli spread
   ↓
3. CLI detects project type
   ↓
4. Interactive setup:
   - Backend API URL
   - API key (generate or provide)
   - Features to enable
   - OAuth providers
   ↓
5. CLI generates:
   - API client code
   - Environment files
   - Type definitions
   - OAuth configuration
   ↓
6. Developer fills in OAuth credentials
   ↓
7. Developer runs: npm run dev
   ↓
8. Integration complete! 🎉
```

### Example Commands

```bash
# Initialize integration
npx @l4yercak3/cli spread

# Initialize with template
npx @l4yercak3/cli spread --template client-portal

# Generate API key
npx @l4yercak3/cli generate api-key

# Test integration
npx @l4yercak3/cli test

# Update integration patterns
npx @l4yercak3/cli update

# Show integration status
npx @l4yercak3/cli status
```

---

## Comparison: CLI vs Deployment Ontology

### CLI Tool Advantages
- ✅ Works with any project structure
- ✅ Developer-initiated (on-demand)
- ✅ Can adapt to existing codebases
- ✅ Version controlled via npm
- ✅ Easy to discover and use
- ✅ Can work offline (after initial setup)

### Deployment Ontology Advantages
- ✅ Backend-initiated (automated)
- ✅ Can manage multiple projects
- ✅ CI/CD integration
- ✅ Centralized configuration
- ✅ Deployment tracking

### Recommendation

**Use CLI Tool as Primary Method:**
- Better developer experience
- More flexible
- Easier to adopt
- Works with existing projects

**Use Deployment Ontology as Secondary:**
- For automated deployments
- For multi-project management
- For backend-initiated setups
- For CI/CD pipelines

**Both can coexist:**
- CLI for initial setup
- Deployment ontology for ongoing management
- CLI can read from deployment ontology config

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up CLI command structure
- [ ] Implement project detection
- [ ] Create configuration wizard
- [ ] Generate basic API client template
- [ ] Generate environment file templates

### Phase 2: Core Features (Week 3-4)
- [ ] Implement API key generation
- [ ] Add OAuth setup automation
- [ ] Generate TypeScript types
- [ ] Create NextAuth.js templates
- [ ] Add integration testing

### Phase 3: Polish (Week 5-6)
- [ ] Add project templates
- [ ] Improve error handling
- [ ] Add update mechanism
- [ ] Create documentation
- [ ] Publish to npm

---

## Success Metrics

### Adoption Metrics
- Number of projects using CLI tool
- Time to integrate (before vs after)
- Developer satisfaction scores

### Technical Metrics
- Integration success rate
- API call success rate
- Error rates
- Support requests

---

## Next Steps

1. **Immediate (This Week)**
   - [ ] Set up development standards (linting, type checking)
   - [ ] Create `.cursor` configuration
   - [ ] Review deployment ontology in backend
   - [ ] Design CLI command structure

2. **Short-term (Next 2 Weeks)**
   - [ ] Implement project detection
   - [ ] Create configuration wizard
   - [ ] Generate API client templates
   - [ ] Test with example projects

3. **Medium-term (Next Month)**
   - [ ] Add OAuth automation
   - [ ] Generate TypeScript types
   - [ ] Create project templates
   - [ ] Publish to npm

---

## Questions Resolved ✅

### 1. **Backend API Key Generation** ✅ RESOLVED
**Answer:** Not yet implemented, but can be added!
- Currently: API keys are generated when user creates their account for the first time
- **Action Required:** Create backend API endpoint for CLI to generate API keys
- **Implementation:** Add endpoint like `POST /api/v1/api-keys/generate` that creates a new API key for the organization

### 2. **OAuth App Registration** ✅ RESOLVED
**Answer:** Automate as much as possible - one-click is the goal!
- **Strategy:** Automate everything we can, only ask for user input when absolutely necessary
- **Business Value:** The closer to one-click, the more we can charge for it
- **Implementation Approach:**
  - Use OAuth provider APIs to create apps programmatically where possible
  - Guide through manual steps only when APIs don't support automation
  - Pre-fill all possible fields automatically
  - Generate callback URLs automatically

### 3. **Backend Schema Access for TypeScript Types** ❓ NEEDS CLARIFICATION
**Question:** How should the CLI generate TypeScript type definitions for API responses?

**Context:** When generating the API client, we want to provide proper TypeScript types so developers get autocomplete and type safety. For example:
```typescript
interface Contact {
  _id: string;
  name: string;
  email: string;
  // ... other fields
}
```

**Options to Consider:**
- **Option A:** Backend provides a schema endpoint (e.g., `/api/v1/schema`) that returns JSON Schema or OpenAPI spec
- **Option B:** CLI makes sample API calls and infers types from responses (less reliable)
- **Option C:** Types are manually maintained in CLI based on documented API structure
- **Option D:** Backend exports TypeScript types that CLI can import/generate from

**Recommendation:** Option A (schema endpoint) is best for accuracy and maintainability. If not available, Option C (manual maintenance) is acceptable for MVP.

### 4. **Publishing Ontology** ✅ RESOLVED
**Location:** `/Users/foundbrand_001/Development/vc83-com/convex/publishingOntology.ts`

**What It Does:**
- Manages published pages with templates/themes
- Stores deployment information (GitHub repos, Vercel URLs)
- Manages environment variables for deployments
- Auto-detects env vars from GitHub repos (`autoDetectEnvVarsFromGithub`)
- Provides deployment validation and pre-flight checks

**How CLI Can Integrate:**
- **Env Var Detection:** Use `autoDetectEnvVarsFromGithub` to automatically detect required env vars from template repos
- **Deployment Config:** Read deployment env vars from published pages to pre-fill CLI setup
- **Template Discovery:** Use published page configs to discover available templates
- **Integration:** CLI can create/update published page configs when setting up integrations

**Key Functions Available:**
- `autoDetectEnvVarsFromGithub` - Fetches `.env.example` from GitHub and parses env vars
- `getDeploymentEnvVars` - Retrieves configured env vars for a page
- `updateDeploymentEnvVars` - Stores env vars for deployment
- `validateGithubRepo` - Validates GitHub repo exists
- `checkApiKeyStatus` - Checks if org has API keys

---

## Related Documentation

- [CLI README](./README.md)
- [Backend API Documentation](../freelancer-client-portal/docs/API_STATUS_AND_DOCUMENTATION.md)
- [OAuth Setup Guide](../freelancer-client-portal/docs/FRONTEND_OAUTH_SETUP.md)
- [Example: Landing Page Integration](../l4yercak3-landing/src/lib/crm-integration/backend-client.ts)
- [Example: Client Portal Integration](../freelancer-client-portal/lib/api-client.ts)

---

**Last Updated:** 2025-01-14
**Status:** Planning Phase
**Next Review:** After Phase 1 completion

