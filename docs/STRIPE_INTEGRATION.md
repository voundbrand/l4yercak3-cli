# Stripe Integration Setup via CLI

## Overview

The L4YERCAK3 platform uses **Stripe Connect** to allow organizations to connect their own Stripe accounts. This enables organizations to accept payments from their customers while transactions flow through the platform.

### Key Concepts

1. **Stripe Connect Platform**: Your platform acts as a Stripe Connect platform
2. **Organization Stripe Accounts**: Each organization connects their own Stripe account
3. **Transaction Flow**: Customer → Organization's Stripe Account → Platform (for tracking/CRM)
4. **Webhooks**: Frontend apps need webhook endpoints to receive Stripe events
5. **Organization Types**:
   - **Regular Organization**: Single Stripe account, owns all transactions
   - **Agency Organization** (future): Can create sub-organizations, each with their own Stripe account

---

## Current Stripe Connect Flow

### Backend Setup (Already Exists)

The backend already has:
- ✅ Stripe Connect OAuth flow (`convex/stripeConnect.ts`)
- ✅ Webhook handlers (`convex/stripeWebhooks.ts`)
- ✅ Account status management
- ✅ Transaction tracking

### What Organizations Need to Do (Currently Manual)

1. **Connect Stripe Account**:
   - Go to platform UI
   - Click "Connect Stripe"
   - Complete Stripe OAuth flow
   - Stripe account ID stored in backend

2. **Frontend Webhook Setup** (if using separate frontend):
   - Configure webhook endpoint in Stripe Dashboard
   - Set webhook URL: `https://your-frontend.com/api/webhooks/stripe`
   - Forward webhooks to backend API

3. **Environment Variables**:
   ```bash
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...  # Organization's secret key (if needed)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

---

## CLI Automation Strategy

### What the CLI Can Automate

#### 1. **Stripe Connect OAuth Flow** ✅
- Initiate Stripe Connect onboarding via backend API
- Open browser for OAuth flow
- Store account ID automatically

#### 2. **Webhook Configuration** 🎯
- Generate webhook endpoint URL
- Configure webhook in Stripe Dashboard (via Stripe API)
- Set up webhook forwarding to backend

#### 3. **Environment Variables** ✅
- Auto-detect from organization's Stripe account
- Generate `.env.local` with Stripe keys
- Store webhook secrets securely

#### 4. **Code Generation** ✅
- Generate Stripe integration code
- Generate webhook handler templates
- Generate payment components

---

## CLI Integration Flow

### Complete Stripe Setup via CLI

```
1. Developer runs: npx @l4yercak3/cli spread
   ↓
2. CLI asks: "Enable Stripe payments?" (y/n)
   ↓
3. If "Yes":
   a. CLI checks if organization has Stripe account
      - If yes: Use existing account
      - If no: Start OAuth flow
   ↓
4. Stripe OAuth Flow:
   a. CLI calls backend: POST /api/v1/stripe/start-onboarding
   b. Backend returns OAuth URL
   c. CLI opens browser with OAuth URL
   d. User completes Stripe onboarding
   e. Stripe redirects to backend callback
   f. Backend stores account ID
   ↓
5. Webhook Setup:
   a. CLI detects frontend URL (from project config)
   b. CLI generates webhook endpoint: {frontend_url}/api/webhooks/stripe
   c. CLI calls Stripe API to create webhook endpoint
   d. CLI stores webhook secret
   ↓
6. Environment Variables:
   a. CLI fetches Stripe keys from backend API
   b. CLI generates .env.local with:
      - STRIPE_PUBLISHABLE_KEY
      - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      - STRIPE_WEBHOOK_SECRET
   ↓
7. Code Generation:
   a. CLI generates webhook handler: app/api/webhooks/stripe/route.ts
   b. CLI generates Stripe client utilities
   c. CLI generates payment components (if template selected)
   ↓
8. Integration complete! 🎉
```

---

## Backend API Endpoints Needed

### 1. Start Stripe Onboarding
```typescript
POST /api/v1/stripe/start-onboarding
Authorization: Bearer <api_key>
Body: {
  returnUrl: string;  // Where to redirect after OAuth
  refreshUrl: string;  // Where to redirect if onboarding incomplete
  isTestMode?: boolean; // Test vs live mode
}
Response: {
  onboardingUrl: string; // Stripe OAuth URL
  state: string; // CSRF token
}
```

### 2. Get Stripe Account Status
```typescript
GET /api/v1/stripe/status
Authorization: Bearer <api_key>
Response: {
  isConnected: boolean;
  accountId?: string;
  status: "pending" | "active" | "restricted" | "disabled";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  publishableKey?: string; // Organization's publishable key
}
```

### 3. Get Stripe Keys
```typescript
GET /api/v1/stripe/keys
Authorization: Bearer <api_key>
Response: {
  publishableKey: string; // Organization's publishable key
  // Note: Secret key is NOT returned (security)
}
```

### 4. Webhook Forwarding Endpoint
```typescript
POST /api/v1/stripe/webhooks/forward
Authorization: Bearer <api_key>
Body: {
  eventType: string;
  eventData: object;
  signature: string;
}
Response: {
  success: boolean;
}
```

---

## Frontend Webhook Handler Template

### Generated Code: `app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Forward to backend API
  const backendUrl = process.env.BACKEND_API_URL!;
  const apiKey = process.env.BACKEND_API_KEY!;

  try {
    const response = await fetch(`${backendUrl}/api/v1/stripe/webhooks/forward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        eventType: event.type,
        eventData: event.data.object,
        signature,
      }),
    });

    if (!response.ok) {
      throw new Error('Backend webhook forwarding failed');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error forwarding webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

---

## Organization Types & Stripe Setup

### Regular Organization

**Setup:**
- Single Stripe account
- All transactions go through this account
- Organization owns all transactions

**CLI Flow:**
```bash
? Enable Stripe payments? (y/n) y
? Connect existing Stripe account or create new? [existing/new] new
✅ Opening Stripe OAuth flow...
✅ Stripe account connected: acct_1234567890
✅ Webhook configured: https://your-app.com/api/webhooks/stripe
✅ Environment variables saved to .env.local
```

### Agency Organization (Future)

**Setup:**
- Parent organization can see all sub-org transactions (read-only)
- Each Sub-Organization has their own Stripe account
- Sub-Organizations own their transactions (tax/legal reasons)
- **CRITICAL:** Agencies CANNOT onboard Sub-Organizations - Sub-Orgs must onboard themselves
- **NOTE:** CRM Organizations do NOT have Stripe accounts (they're customer data)

**CLI Flow (Agency Setting Up Boilerplate):**
```bash
? Organization type? [regular/agency] agency
? Create sub-organization for customer? (y/n) y
? Customer name: Acme Corp
? Customer email: contact@acme.com
✅ Sub-Organization created: sub_org_123
✅ API key generated: l4y_sub_org_123...
✅ Boilerplate generated with customer-facing Stripe onboarding
```

**Customer-Facing Stripe Onboarding (Generated in Boilerplate):**
```typescript
// Generated: app/stripe/connect/page.tsx
// Simple UI for Sub-Organization to connect their own Stripe account
// Sub-Org visits: https://their-site.com/stripe/connect
// Sub-Org completes OAuth flow themselves
// Uses Sub-Organization's API key (not Agency's)
```

**Sub-Organization Setup (Customer Self-Service):**
```
1. Sub-Organization visits their frontend: /stripe/connect
2. Sub-Organization clicks "Connect Stripe Account"
3. Sub-Organization completes Stripe OAuth flow
4. Stripe account linked to Sub-Organization
5. Agency can view transactions (read-only)
```

---

## Environment Variables Generated

### `.env.local` (Generated by CLI)

```bash
# Stripe Connect (Organization's Stripe Account)
STRIPE_PUBLISHABLE_KEY=pk_test_51Abc123...  # From organization's account
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Abc123...
STRIPE_WEBHOOK_SECRET=whsec_xyz789...  # From webhook endpoint

# Backend API (for webhook forwarding)
BACKEND_API_URL=https://your-backend.convex.site
BACKEND_API_KEY=l4y_abc123...

# Note: STRIPE_SECRET_KEY is NOT stored in frontend
# Frontend only needs publishable key for client-side operations
```

---

## Webhook Configuration

### Stripe Dashboard Setup

**Manual Steps (Current):**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-frontend.com/api/webhooks/stripe`
3. Select events to listen for
4. Copy webhook signing secret

**Automated via CLI (Future):**
```bash
? Configure Stripe webhooks? (y/n) y
? Frontend URL: https://your-app.com
✅ Creating webhook endpoint in Stripe...
✅ Webhook endpoint created: https://your-app.com/api/webhooks/stripe
✅ Webhook secret saved to .env.local
```

**Required Webhook Events:**
- `account.updated` - Account status changes
- `account.application.deauthorized` - Account disconnected
- `payment_intent.succeeded` - Payment completed
- `charge.refunded` - Refund processed
- `invoice.payment_succeeded` - Invoice paid
- `invoice.payment_failed` - Invoice payment failed

---

## Security Considerations

### Frontend Stripe Integration

1. **Never Store Secret Keys in Frontend**
   - Only publishable keys in frontend
   - Secret keys stay in backend only

2. **Webhook Signature Verification**
   - Always verify webhook signatures
   - Use webhook secret from environment

3. **API Key Security**
   - Backend API key stored securely
   - Never commit to git
   - Use environment variables

4. **Organization Isolation**
   - Each organization's Stripe account is isolated
   - Transactions scoped to organization
   - Agency orgs can view but not control sub-org accounts

---

## CLI Commands

### Stripe Setup Commands

```bash
# Full Stripe integration setup
npx @l4yercak3/cli spread --stripe

# Connect Stripe account only
npx @l4yercak3/cli stripe connect

# Configure webhooks only
npx @l4yercak3/cli stripe webhooks

# Check Stripe status
npx @l4yercak3/cli stripe status

# Disconnect Stripe account
npx @l4yercak3/cli stripe disconnect
```

---

## Implementation Checklist

### Phase 1: Basic Stripe Connect
- [ ] Backend API endpoint: `POST /api/v1/stripe/start-onboarding`
- [ ] Backend API endpoint: `GET /api/v1/stripe/status`
- [ ] Backend API endpoint: `GET /api/v1/stripe/keys`
- [ ] CLI: Stripe OAuth flow initiation
- [ ] CLI: Browser opening for OAuth
- [ ] CLI: Account status checking

### Phase 2: Webhook Automation
- [ ] Stripe API integration for webhook creation
- [ ] CLI: Auto-detect frontend URL
- [ ] CLI: Create webhook endpoint via Stripe API
- [ ] CLI: Store webhook secret securely
- [ ] CLI: Generate webhook handler code

### Phase 3: Code Generation
- [ ] Generate webhook handler template
- [ ] Generate Stripe client utilities
- [ ] Generate payment components (optional)
- [ ] Generate environment variable templates

### Phase 4: Agency Organization Support
- [ ] Detect agency organization type
- [ ] Generate customer-facing Stripe onboarding page
- [ ] Use Sub-Organization's API key (not Agency's)
- [ ] Support customer self-service onboarding
- [ ] Parent org transaction viewing (read-only)
- [ ] Sub-org account isolation
- [ ] **CRITICAL:** Ensure Sub-Organizations onboard themselves (legal requirement)

---

## Questions to Resolve

1. **Stripe API Access**: Does CLI need Stripe API access to create webhooks?
   - **Answer:** Yes, CLI needs Stripe API key to create webhook endpoints
   - **Security:** Use organization's Stripe API key (from backend)

2. **Webhook Secret Storage**: Where to store webhook secrets?
   - **Answer:** In `.env.local` for frontend, backend stores in database

3. **Agency Organization Timeline**: When will sub-organizations be available?
   - **Answer:** Future feature, plan for it now but implement later

4. **Test vs Live Mode**: How to handle test/live mode selection?
   - **Answer:** Organization chooses during onboarding, stored in backend

---

**Last Updated:** 2025-01-14  
**Status:** Planning Phase  
**Next Steps:** Implement backend API endpoints, then CLI integration

