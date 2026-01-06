# OAuth Automation & CLI Onboarding - Clarification

## Two Different OAuth Systems

### 1. **Backend OAuth (Platform OAuth)** ✅ Already Exists
**Purpose:** Platform administrators/staff connecting their Microsoft/Google accounts to the backend
- **Use Case:** Staff members sync their Microsoft 365 account to send emails, access calendars, etc.
- **Storage:** `users` table + `oauthConnections` table
- **Handler:** Convex backend (`convex/oauth/microsoft.ts`)
- **Status:** ✅ Fully implemented

**This is NOT what we're automating with the CLI.**

---

### 2. **Frontend OAuth (Customer OAuth)** 🎯 What We're Automating
**Purpose:** End users (customers/freelancers) logging into FRONTEND applications
- **Use Case:** Freelancers log into the freelancer portal with Google/Microsoft
- **Storage:** `objects` table with `type: "frontend_user"`
- **Handler:** NextAuth.js on the frontend + Backend sync endpoint
- **Status:** Backend ready, frontend needs OAuth app setup

**This IS what we want to automate with the CLI.**

---

## The OAuth App Setup Problem

When a developer wants to add OAuth login to their frontend app, they currently need to:

1. **Go to Google Cloud Console**
   - Create OAuth client ID
   - Configure redirect URIs
   - Copy Client ID and Secret

2. **Go to Microsoft Azure Portal**
   - Register application
   - Configure redirect URIs
   - Create client secret
   - Copy Client ID, Secret, and Tenant ID

3. **Add to `.env.local`**
   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   AZURE_CLIENT_ID=...
   AZURE_CLIENT_SECRET=...
   ```

**This is manual, tedious, and error-prone.**

---

## OAuth Automation Goal

**Automate steps 1-2 above** by using provider APIs to create OAuth apps programmatically.

### What We Can Automate

#### Google OAuth
- **API:** Google Cloud API
- **Can Create:** OAuth client IDs programmatically
- **Requires:** Google Cloud project access (user grants permission)
- **Result:** Client ID and Secret automatically generated

#### Microsoft OAuth
- **API:** Microsoft Graph API / Azure AD API
- **Can Create:** App registrations programmatically
- **Requires:** Azure AD admin access (user grants permission)
- **Result:** Client ID, Secret, Tenant ID automatically generated

#### GitHub OAuth
- **API:** GitHub API
- **Can Create:** OAuth apps programmatically
- **Requires:** GitHub account access
- **Result:** Client ID and Secret automatically generated

### What We Still Need User Input For

- **User's Google Cloud Project** (or create one)
- **User's Azure AD Tenant** (or use default)
- **User's GitHub Account** (for GitHub OAuth)
- **Permission to create OAuth apps** (one-time grant)

---

## CLI-Based Onboarding Flow

### Complete Onboarding via CLI 🚀

```
1. Developer runs: npx @l4yercak3/cli spread
   ↓
2. CLI asks: "Do you have an account?"
   - [ ] Yes, I'll log in
   - [ ] No, create one for me
   ↓
3. If "No":
   - CLI asks for email, name, organization name
   - CLI calls backend: POST /api/v1/auth/create-account
   - Backend creates:
     - User account
     - Organization
     - Initial API key
   - CLI stores session token
   ↓
4. CLI asks: "What features do you want?"
   - [ ] CRM Integration
   - [ ] OAuth Login (Google/Microsoft)
   - [ ] Project Management
   - [ ] Invoicing
   ↓
5. If OAuth selected:
   - CLI asks: "Which providers?"
     - [ ] Google
     - [ ] Microsoft
     - [ ] GitHub
   - CLI opens browser for OAuth app creation
   - User grants permission once
   - CLI creates OAuth apps automatically
   - CLI stores credentials securely
   ↓
6. CLI generates:
   - API client code
   - Environment files (with OAuth credentials pre-filled!)
   - NextAuth.js configuration
   - Type definitions
   ↓
7. Integration complete! 🎉
```

---

## Schema Endpoint Security Clarification

### What a Schema Endpoint Would Return

**NOT database access!** Just API structure/types:

```json
{
  "endpoints": {
    "/api/v1/crm/contacts": {
      "method": "POST",
      "request": {
        "type": "object",
        "properties": {
          "firstName": { "type": "string" },
          "lastName": { "type": "string" },
          "email": { "type": "string" }
        }
      },
      "response": {
        "type": "object",
        "properties": {
          "_id": { "type": "string" },
          "name": { "type": "string" },
          "email": { "type": "string" }
        }
      }
    }
  }
}
```

**This is just documentation/structure** - no actual data, no database access.

### Security Considerations

1. **Authentication Required:** Schema endpoint should require API key or session
2. **Read-Only:** Only returns API structure, never actual data
3. **Rate Limited:** Prevent abuse
4. **Scoped:** Only show endpoints user has access to

**It's like an OpenAPI spec** - just describes the API, doesn't access the database.

---

## Updated CLI Onboarding Features

### Account Creation via CLI

```bash
npx @l4yercak3/cli spread

# If no account:
? Create new account? (y/n) y
? Email: user@example.com
? Name: John Doe
? Organization Name: Acme Corp
✅ Account created! Organization ID: org_123
✅ API key generated: l4y_abc123...
```

**Backend Endpoint Needed:**
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
  apiKey: string;
  sessionToken: string;
}
```

### OAuth App Creation via CLI

```bash
? Enable OAuth login? (y/n) y
? Which providers? [Google, Microsoft]
? Grant permission to create OAuth apps? (opens browser)
✅ Google OAuth app created!
   Client ID: 123456.apps.googleusercontent.com
   Client Secret: GOCSPX-abc123...
✅ Microsoft OAuth app created!
   Client ID: abcd-1234-...
   Client Secret: xyz~ABC...
✅ Credentials saved to .env.local
```

**This requires:**
1. User grants CLI permission to create OAuth apps (one-time)
2. CLI uses provider APIs to create apps
3. CLI stores credentials securely

---

## Summary

### What We're Automating

1. ✅ **Account Creation** - Create user account + organization via CLI
2. ✅ **API Key Generation** - Generate API keys automatically
3. ✅ **OAuth App Creation** - Create OAuth apps with Google/Microsoft/GitHub APIs
4. ✅ **Environment Setup** - Generate `.env.local` with all credentials
5. ✅ **Code Generation** - Generate API client, NextAuth config, types

### What We're NOT Automating

- ❌ Backend OAuth (platform OAuth) - that's separate
- ❌ Database access - schema endpoint is read-only API structure
- ❌ User's provider accounts - they still need Google/Microsoft/GitHub accounts

### Security Notes

- **Schema Endpoint:** Read-only API structure, requires auth, no database access
- **OAuth Automation:** Requires user permission, one-time grant
- **Account Creation:** Secure endpoint, creates proper user/org structure

---

**The goal:** Make onboarding as smooth as possible, with UI as fallback if CLI fails or user gets stuck.

