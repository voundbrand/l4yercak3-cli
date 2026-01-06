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
| `src/lib/api-client.js` | API client for L4YERCAK3 backend (or `.ts` for TypeScript) |
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
import L4YERCAK3Client from '@/lib/api-client';

// Create client instance (uses env defaults if no args)
const client = new L4YERCAK3Client();

// CRM Methods
const contacts = await client.getContacts();
const contact = await client.getContact('contact-id');
const newContact = await client.createContact({ email: 'user@example.com', name: 'John Doe' });
await client.updateContact('contact-id', { name: 'Jane Doe' });
await client.deleteContact('contact-id');

// Projects Methods
const projects = await client.getProjects();
const project = await client.createProject({ name: 'New Project' });

// Invoices Methods
const invoices = await client.getInvoices();
const invoice = await client.createInvoice({ amount: 100, contactId: 'contact-id' });
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
