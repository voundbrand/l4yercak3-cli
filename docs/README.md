# 🍰 L4YERCAK3 CLI Tool Documentation

## Quick Links

- **[Implementation Phases](./IMPLEMENTATION_PHASES.md)** - Complete phase breakdown (Backend vs CLI tasks)
- **[Architecture & Relationships](./ARCHITECTURE_RELATIONSHIPS.md)** - Organization hierarchy and relationships
- **[Updated Plan](./UPDATED_PLAN.md)** - Strategic plan with all updates
- **[Stripe Integration](./STRIPE_INTEGRATION.md)** - Stripe Connect setup guide
- **[OAuth Clarification](./OAUTH_CLARIFICATION.md)** - OAuth automation details
- **[Development Guide](./DEVELOPMENT.md)** - Developer workflow and standards

## Key Concepts

### Organization Hierarchy

**For Agencies:**
```
Agency Organization → Sub-Organization → CRM Organization → CRM Contacts/Frontend Users
```

**For Regular Organizations:**
```
Regular Organization → CRM Organization → CRM Contacts/Frontend Users
```

**Key Distinction:**
- **CRM Organization** = Customer data (NOT a platform organization)
- **Sub-Organization** = Platform organization (for agencies, boilerplate built FOR this)
- Boilerplate is scoped to Sub-Organization (for agencies) or Organization (for regular)

### What the CLI Does

1. **Sets up boilerplate** - Generates code to connect frontend to backend
2. **Connects to backend** - Uses organization's API key to make API calls
3. **Generates integration code** - API client, authentication, Stripe setup, etc.

### What Backend Provides

- Account & organization management
- API key generation
- Stripe Connect OAuth flow
- User authentication (frontend_users → crm_contacts)
- CRM, Projects, Invoices APIs

## Getting Started

See [Implementation Phases](./IMPLEMENTATION_PHASES.md) for:
- What needs to be built on backend
- What needs to be built in CLI
- Dependencies between tasks
- Timeline and priorities

---

**Last Updated:** 2025-01-14

