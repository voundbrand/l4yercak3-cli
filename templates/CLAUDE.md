# L4YERCAK3 Integration - Claude Code Configuration

## About This Integration

This project uses **L4YERCAK3** for backend services. The integration was set up using `@l4yercak3/cli`.

## L4YERCAK3 CLI

Install the CLI globally to manage your L4YERCAK3 integration:

```bash
npm install -g @l4yercak3/cli
```

### Commands

| Command | Description |
|---------|-------------|
| `l4yercak3 login` | Authenticate with L4YERCAK3 platform |
| `l4yercak3 logout` | Log out from L4YERCAK3 |
| `l4yercak3 status` | Check authentication and session status |
| `l4yercak3 spread` | Re-run setup wizard to add/update features |
| `icing` | Shorthand alias for `l4yercak3` |

## Generated Files

The CLI generates these files based on selected features:

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (API keys, secrets) |
| `src/lib/l4yercak3/api-client.js` | API client for L4YERCAK3 backend |
| `src/app/api/auth/[...nextauth]/route.js` | NextAuth.js configuration (if OAuth enabled) |
| `OAUTH_SETUP_GUIDE.md` | OAuth provider setup instructions (if OAuth enabled) |

## Environment Variables

Required variables in `.env.local`:

```bash
L4YERCAK3_API_KEY=        # Your L4YERCAK3 API key
L4YERCAK3_BACKEND_URL=    # Backend API URL
L4YERCAK3_ORG_ID=         # Your organization ID
NEXTAUTH_SECRET=          # NextAuth secret (if using OAuth)
NEXTAUTH_URL=             # Your app URL (if using OAuth)
```

## Using the API Client

```javascript
import { l4yercak3 } from '@/lib/l4yercak3/api-client';

// Example: Fetch CRM contacts
const contacts = await l4yercak3.crm.getContacts();

// Example: Create a customer
const customer = await l4yercak3.crm.createContact({
  email: 'user@example.com',
  name: 'John Doe'
});
```

## Re-running Setup

To add new features or update configuration:

```bash
l4yercak3 spread
```

This will detect existing setup and allow you to add additional features without overwriting current configuration.

## Support

- Documentation: https://docs.l4yercak3.com
- CLI GitHub: https://github.com/voundbrand/l4yercak3-cli
- npm: https://www.npmjs.com/package/@l4yercak3/cli
