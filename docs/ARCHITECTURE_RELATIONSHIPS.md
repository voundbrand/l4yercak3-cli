# Architecture & Relationships - CORRECTED

## The Correct Hierarchy

### For Agency Organizations

```
┌─────────────────────────────────────────────────────────┐
│  Agency Organization (Platform User)                     │
│  - Platform organization account                        │
│  - Can create sub-organizations                         │
│  - Owns the relationship                                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Creates/manages
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Sub-Organization (Agency's Customer)                   │
│  - The customer the boilerplate is built FOR            │
│  - Owns their own Stripe account (legal requirement)    │
│  - Has CRM Organizations (their customers)              │
│  - Frontend app is built for THIS sub-organization      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Has customers (CRM data)
                   ▼
┌─────────────────────────────────────────────────────────┐
│  CRM Organization (Sub-Org's Customer)                  │
│  - The customer's customer                              │
│  - NOT a platform organization                          │
│  - Stored in CRM system                                 │
│  - Has CRM Contacts (people within the org)            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Contains
                   ▼
┌─────────────────────────────────────────────────────────┐
│  CRM Contacts / Frontend Users                          │
│  - People who log into the frontend                     │
│  - Created via NextAuth.js OAuth                        │
│  - Linked to CRM Organization                           │
│  - Authentication managed by backend                     │
└─────────────────────────────────────────────────────────┘
```

### For Regular Organizations (Non-Agency)

```
┌─────────────────────────────────────────────────────────┐
│  Regular Organization (Platform User)                   │
│  - Platform organization account                        │
│  - Works for themselves                                 │
│  - Owns their own Stripe account                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Has customers (CRM data)
                   ▼
┌─────────────────────────────────────────────────────────┐
│  CRM Organization (Organization's Customer)             │
│  - The organization's customer                          │
│  - NOT a platform organization                          │
│  - Stored in CRM system                                 │
│  - Has CRM Contacts (people within the org)            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Contains
                   ▼
┌─────────────────────────────────────────────────────────┐
│  CRM Contacts / Frontend Users                          │
│  - People who log into the frontend                     │
│  - Created via NextAuth.js OAuth                        │
│  - Linked to CRM Organization                           │
│  - Authentication managed by backend                     │
└─────────────────────────────────────────────────────────┘
```

---

## Key Distinctions

### Platform Organizations vs CRM Organizations

**Platform Organizations:**
- Agency Organization: Platform account, can create sub-organizations
- Sub-Organization: Platform account, created by agency, owns Stripe account
- Regular Organization: Platform account, works for themselves

**CRM Organizations:**
- NOT platform organizations
- Customer data stored in CRM system
- The customer's customer (for agencies) or the organization's customer (for regular)
- Has CRM Contacts (people)

### Why "CRM" Prefix?

**CRM Organization** = Customer data, not platform organization data
- Stored in `objects` table with `type: "crm_organization"`
- Part of CRM system, not platform organization system
- Represents the end customer

**CRM Contact** = Person within a CRM Organization
- Stored in `objects` table with `type: "crm_contact"`
- Can become a Frontend User when they authenticate
- Linked to CRM Organization

---

## Complete Flow Examples

### Example 1: Agency Building Site for Customer

```
1. Agency Organization: "WebDev Agency"
   ↓ Creates sub-organization
2. Sub-Organization: "Acme Corp" (Agency's customer)
   - Boilerplate built FOR Acme Corp
   - Acme Corp connects their Stripe account
   ↓ Has customers (CRM data)
3. CRM Organization: "Widgets Inc" (Acme Corp's customer)
   ↓ Contains people
4. CRM Contacts: "John Doe", "Jane Smith" (people at Widgets Inc)
   ↓ When they authenticate
5. Frontend Users: John and Jane log into Acme Corp's frontend
```

**In Backend:**
- Agency Organization: `organizations` table
- Sub-Organization: `organizations` table (with `parentOrganizationId`)
- CRM Organization: `objects` table (`type: "crm_organization"`)
- CRM Contacts: `objects` table (`type: "crm_contact"`)
- Frontend Users: `objects` table (`type: "frontend_user"`)

### Example 2: Regular Organization

```
1. Regular Organization: "Freelancer Joe"
   - Works for themselves
   - Connects their own Stripe account
   ↓ Has customers (CRM data)
2. CRM Organization: "Client Corp" (Joe's customer)
   ↓ Contains people
3. CRM Contacts: "Alice", "Bob" (people at Client Corp)
   ↓ When they authenticate
4. Frontend Users: Alice and Bob log into Joe's frontend
```

---

## Stripe Account Ownership

### Agency Scenario

**Sub-Organization owns Stripe account:**
- Sub-Organization (Acme Corp) connects their Stripe account
- Agency (WebDev Agency) can view transactions (read-only)
- Agency CANNOT onboard sub-org to Stripe (legal requirement)
- Sub-Organization must onboard themselves

**CRM Organizations do NOT have Stripe accounts:**
- CRM Organizations are just customer data
- They don't process payments
- Payments go through Sub-Organization's Stripe account

### Regular Organization Scenario

**Organization owns Stripe account:**
- Regular Organization (Freelancer Joe) connects their Stripe account
- All transactions go through this account
- CRM Organizations are just customer data (no Stripe accounts)

---

## Frontend Authentication Flow

### Who Authenticates?

**Frontend Users authenticate:**
- These are CRM Contacts who log into the frontend
- They authenticate via NextAuth.js (Google/Microsoft)
- Creates `frontend_user` object in backend
- Automatically linked to `crm_contact` object
- Scoped to the Sub-Organization (for agencies) or Regular Organization

### Example Flow

```
1. Alice (CRM Contact at Widgets Inc) visits Acme Corp's frontend
   ↓
2. Alice clicks "Sign in with Google"
   ↓
3. NextAuth.js handles OAuth
   ↓
4. Frontend calls backend: POST /api/v1/auth/sync-user
   Body: {
     email: "alice@widgetsinc.com",
     name: "Alice",
     oauthProvider: "google",
     oauthId: "123456"
   }
   ↓
5. Backend:
   a. Creates/updates frontend_user object
   b. Finds CRM contact by email (alice@widgetsinc.com)
   c. Links frontend_user to crm_contact
   d. Links to CRM Organization (Widgets Inc)
   e. Scopes to Sub-Organization (Acme Corp)
   ↓
6. Alice can now use Acme Corp's frontend
   - All API calls scoped to Acme Corp (Sub-Organization)
   - Alice's data linked to Widgets Inc (CRM Organization)
```

---

## CLI Boilerplate Generation

### What Gets Generated

#### For Agency Setting Up Boilerplate

```
1. Agency runs: npx @l4yercak3/cli spread
   ↓
2. CLI asks: "Organization type?" [regular/agency] agency
   ↓
3. CLI asks: "Create sub-organization for customer?" (y/n) y
   ? Customer name: Acme Corp
   ? Customer email: contact@acme.com
   ✅ Sub-Organization created: sub_org_123
   ✅ API key generated: l4y_sub_org_123...
   ↓
4. CLI generates boilerplate:
   - API client (scoped to Sub-Organization)
   - Authentication (creates frontend_users → crm_contacts)
   - Stripe onboarding page (for Sub-Org to connect)
   - Webhook handler (forwards to backend)
   ↓
5. Sub-Organization (Acme Corp) connects Stripe account
   ↓
6. CRM Organizations (Acme Corp's customers) added via CRM
   ↓
7. CRM Contacts authenticate and become Frontend Users
```

#### For Regular Organization

```
1. Organization runs: npx @l4yercak3/cli spread
   ↓
2. CLI asks: "Organization type?" [regular/agency] regular
   ↓
3. CLI uses existing organization
   ✅ API key: l4y_org_123...
   ↓
4. CLI generates boilerplate:
   - API client (scoped to Organization)
   - Authentication (creates frontend_users → crm_contacts)
   - Stripe onboarding page (for Organization to connect)
   - Webhook handler (forwards to backend)
   ↓
5. Organization connects Stripe account
   ↓
6. CRM Organizations (Organization's customers) added via CRM
   ↓
7. CRM Contacts authenticate and become Frontend Users
```

---

## Environment Variables by Context

### Sub-Organization (Agency's Customer)

```bash
# Sub-Organization's API key (for their frontend)
BACKEND_API_URL=https://backend.convex.site
BACKEND_API_KEY=l4y_sub_org_123...  # Sub-Org's key

# Stripe (Sub-Organization's Stripe account)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Sub-Org's key
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth (for CRM Contacts/Frontend Users)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Regular Organization

```bash
# Organization's API key (for their frontend)
BACKEND_API_URL=https://backend.convex.site
BACKEND_API_KEY=l4y_org_123...  # Organization's key

# Stripe (Organization's Stripe account)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Org's key
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth (for CRM Contacts/Frontend Users)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Key Principles (Corrected)

### 1. **Platform Organizations vs CRM Organizations**

**Platform Organizations:**
- Agency Organization: Platform account
- Sub-Organization: Platform account (created by agency)
- Regular Organization: Platform account

**CRM Organizations:**
- NOT platform organizations
- Customer data in CRM system
- The customer's customer (for agencies) or organization's customer (for regular)
- Stored as `objects` with `type: "crm_organization"`

### 2. **Stripe Account Ownership**

**Agency Scenario:**
- Sub-Organization owns Stripe account
- Agency can view transactions (read-only)
- Agency CANNOT onboard sub-org (legal requirement)
- Sub-Organization must onboard themselves

**Regular Scenario:**
- Organization owns Stripe account
- All transactions go through this account

### 3. **Frontend Authentication**

**Who authenticates:**
- CRM Contacts authenticate and become Frontend Users
- Scoped to Sub-Organization (for agencies) or Organization (for regular)
- All user management in backend

### 4. **Boilerplate Scope**

**For Agencies:**
- Boilerplate scoped to Sub-Organization
- Uses Sub-Organization's API key
- Stripe onboarding for Sub-Organization
- Frontend users are CRM Contacts from CRM Organizations

**For Regular:**
- Boilerplate scoped to Organization
- Uses Organization's API key
- Stripe onboarding for Organization
- Frontend users are CRM Contacts from CRM Organizations

---

## Updated CLI Generation Checklist

### For Agency Setting Up Boilerplate

- [ ] Detect organization type (agency vs regular)
- [ ] Create Sub-Organization via backend API (not CRM Organization)
- [ ] Generate API key for Sub-Organization
- [ ] Generate API client scoped to Sub-Organization
- [ ] Generate authentication (NextAuth.js)
  - Creates frontend_users from crm_contacts
  - Scoped to Sub-Organization
- [ ] Generate Stripe onboarding page (for Sub-Organization)
- [ ] Generate webhook handler
- [ ] Document: CRM Organizations are customer data, not platform orgs

### For Regular Organization

- [ ] Use existing Organization
- [ ] Generate API client scoped to Organization
- [ ] Generate authentication (NextAuth.js)
  - Creates frontend_users from crm_contacts
  - Scoped to Organization
- [ ] Generate Stripe onboarding page (for Organization)
- [ ] Generate webhook handler

---

## Questions Resolved ✅

1. **What is a CRM Organization?**
   - ✅ Customer data, NOT a platform organization
   - ✅ The customer's customer (for agencies) or organization's customer (for regular)
   - ✅ Stored in CRM system (`objects` table)

2. **What is a Sub-Organization?**
   - ✅ Platform organization created by Agency
   - ✅ The customer the boilerplate is built FOR
   - ✅ Owns their own Stripe account
   - ✅ Has CRM Organizations as their customers

3. **Who owns Stripe accounts?**
   - ✅ Sub-Organization (for agencies) or Organization (for regular)
   - ✅ NOT CRM Organizations (they're just customer data)
   - ✅ Customers must onboard themselves (legal requirement)

4. **Who authenticates?**
   - ✅ CRM Contacts authenticate and become Frontend Users
   - ✅ Scoped to Sub-Organization (for agencies) or Organization (for regular)
   - ✅ All managed by backend

---

**Last Updated:** 2025-01-14  
**Status:** Architecture Corrected  
**Key Insight:** CRM Organization = Customer data, NOT platform organization

