# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Run the CLI locally
npm start

# Or link globally for testing
npm link
l4yercak3
```

## Development Standards

### Quality Checks

Before committing, always run:

```bash
npm run verify
```

This runs:
- ✅ Linting (`npm run lint`)
- ✅ Type checking (`npm run type-check`)
- ✅ Build verification (`npm run build`)

### Individual Commands

```bash
# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check types
npm run type-check

# Verify build
npm run build
```

## Project Structure

```
l4yercak3-cli/
├── .cursor/
│   └── rules.md              # Development rules for Cursor AI
├── bin/
│   └── cli.js                # CLI entry point
├── src/
│   └── logo.js               # Logo display module
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore rules
├── package.json              # Package configuration
├── PLAN.md                   # Strategic plan document
├── README.md                 # User documentation
└── DEVELOPMENT.md            # This file
```

## Adding New Features

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Implement Feature
- Follow code standards in `.cursor/rules.md`
- Add JSDoc comments
- Keep functions small and focused

### 3. Test Locally
```bash
npm link
# Test in a real project
cd ~/Development/test-project
l4yercak3 your-command
```

### 4. Run Quality Checks
```bash
npm run verify
```

### 5. Commit and Push
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

## Code Style

### JavaScript/Node.js
- Use CommonJS (`require`/`module.exports`)
- Use async/await for async operations
- Handle errors with try/catch
- Use meaningful variable names

### Example
```javascript
const chalk = require('chalk');

async function doSomething() {
  try {
    console.log(chalk.green('Success!'));
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
  }
}
```

## Testing

### Manual Testing
1. Link package: `npm link`
2. Test in example project
3. Verify all features work
4. Check error handling

### Example Projects
- `~/Development/l4yercak3-landing`
- `~/Development/freelancer-client-portal`

## Publishing

### Before Publishing
1. Update version in `package.json`
2. Update CHANGELOG.md (if exists)
3. Run `npm run verify`
4. Test installation: `npm pack` then `npm install -g *.tgz`

### Publishing Steps
```bash
# Login to npm (if needed)
npm login

# Publish
npm publish --access public
```

### Version Management
```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch

# Minor version (1.0.0 → 1.1.0)
npm version minor

# Major version (1.0.0 → 2.0.0)
npm version major
```

## Troubleshooting

### Command Not Found After `npm link`
```bash
# Check executable permissions
chmod +x bin/cli.js

# Verify npm bin path
npm bin -g

# Try unlinking and relinking
npm unlink
npm link
```

### Linting Errors
```bash
# Auto-fix what can be fixed
npm run lint:fix

# Check specific file
npx eslint bin/cli.js
```

### Build Errors
- Check Node.js version: `node --version` (should be >=14)
- Verify package.json structure
- Check for syntax errors

## Resources

- [Plan Document](./PLAN.md) - Strategic plan and roadmap
- [Development Rules](./.cursor/rules.md) - Detailed coding standards
- [README](./README.md) - User documentation

