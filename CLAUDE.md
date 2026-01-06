# L4YERCAK3 CLI - Claude Code Configuration

## About This Project

This is **L4YERCAK3 CLI** (`@l4yercak3/cli`) - the official CLI tool for integrating Next.js projects with the Layer Cake platform. It handles authentication, project setup, and generates boilerplate code for L4YERCAK3 features.

## Installation

```bash
npm install -g @l4yercak3/cli
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `l4yercak3 login` | Authenticate with the L4YERCAK3 platform (opens browser) |
| `l4yercak3 logout` | Log out and clear session |
| `l4yercak3 status` | Show authentication status and session info |
| `l4yercak3 spread` | Initialize L4YERCAK3 in a Next.js project (interactive setup) |
| `icing` | Alias for `l4yercak3` command |

## Project Structure

```
src/
├── api/                 # Backend API client
│   └── backend-client.js
├── commands/            # CLI command handlers
│   ├── login.js         # Browser-based OAuth login
│   ├── logout.js        # Session cleanup
│   ├── spread.js        # Project initialization wizard
│   └── status.js        # Auth status display
├── config/              # Configuration management
│   └── config-manager.js
├── detectors/           # Project analysis
│   ├── nextjs-detector.js
│   ├── github-detector.js
│   ├── oauth-detector.js
│   └── api-client-detector.js
├── generators/          # Code generators
│   ├── api-client-generator.js
│   ├── env-generator.js
│   ├── nextauth-generator.js
│   ├── oauth-guide-generator.js
│   └── gitignore-generator.js
├── index.js             # Main entry point
└── logo.js              # ASCII art branding
```

## Development Commands

```bash
npm run build          # Build for production
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run type-check     # TypeScript type checking (via JSDoc)
npm test               # Run Jest tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run verify         # Run lint + type-check + test + build
```

## Code Style

- JavaScript with JSDoc type annotations
- ESLint with Prettier formatting
- Jest for testing with mocks for fs, fetch, and external dependencies
- Keep files focused and under 500 lines
- Use async/await for asynchronous operations

## Testing Patterns

When writing tests:
- Mock `fs` module for file operations
- Mock `node-fetch` for API calls
- Mock `chalk` to return plain strings
- Use `jest.spyOn(console, 'error').mockImplementation(() => {})` to silence expected errors
- For singleton modules that instantiate on require, set up mocks BEFORE requiring the module

## Configuration Storage

User config is stored at `~/.l4yercak3/config.json` with:
- Session tokens and expiration
- Organization memberships
- Project configurations by path
- Backend URL settings

## Available Features

The `spread` command can set up:
- **CRM** - Customer relationship management integration
- **OAuth** - Social login with Google, GitHub, Discord, etc.
- **Stripe** - Payment processing integration
- **Analytics** - Usage tracking and metrics

## Links

- npm: https://www.npmjs.com/package/@l4yercak3/cli
- GitHub: https://github.com/voundbrand/l4yercak3-cli
