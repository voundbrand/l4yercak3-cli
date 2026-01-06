# 🍰 Icing on the L4yercak3

**The sweet finishing touch for your Layer Cake integration**

A beautiful CLI tool for setting up external projects that integrate with the Layer Cake platform.

## 🎨 Features

- ✨ Beautiful ASCII art logo with 3D font and rainbow gradient
- 🏗️ Visual building/plumbing metaphor
- 🎨 Colorful terminal output
- 🚀 Easy project setup

## 📦 Installation

```bash
npm install -g @l4yercak3/cli
```

Or use with npx:

```bash
npx @l4yercak3/cli
```

## 🚀 Usage

### Quick Start

```bash
# Show logo and welcome message
npx @l4yercak3/cli

# Or if installed globally
l4yercak3
# or use the alias
icing
```

### Commands (Coming Soon)

```bash
# Initialize a new project
npx @l4yercak3/cli spread

# Show help
npx @l4yercak3/cli --help

# Show version
npx @l4yercak3/cli --version
```

### Bin Commands

The package exposes two bin commands (both point to the same CLI):
- `l4yercak3` - Main command name
- `icing` - Alias (short for "icing on the l4yercak3")

## 🏗️ The Metaphor

**l4yercak3 = The Plumbing/Foundation**
- Database, Auth, Payments, CRM, Workflows
- Lives in the basement/cellar
- One platform powering everything

**External Projects = The Floors**
- Landing pages, client portals, mobile apps
- Each floor built on the same foundation
- Connect via API layer (plumbing pipes)

**icing = The CLI Tool**
- Automates the connection
- "Spreads" the integration smoothly
- The sweet finishing touch!

## 🎨 Logo

The logo uses:
- **Font**: 3D-ASCII (from figlet)
- **Colors**: Rainbow gradient
- **Style**: Colorful, eye-catching, professional

## 📝 Development

### Package Location
The package is located at: `~/Development/l4yercak3-cli`

### Package Structure
```
l4yercak3-cli/
├── bin/
│   └── cli.js          # CLI entry point (executable)
├── src/
│   └── logo.js         # Logo display module (3D-ASCII font, rainbow gradient)
├── package.json         # npm package config
├── README.md           # This file
└── .gitignore          # Git ignore file
```

### Local Development

```bash
# Navigate to package directory
cd ~/Development/l4yercak3-cli

# Install dependencies
npm install

# Run locally
npm start
# or
node bin/cli.js

# Test it locally (link globally for testing)
npm link
l4yercak3
# or use the alias
icing
```

### Logo Details

The logo uses **VERSION 6** from the demo files:
- **Font**: `3D-ASCII` (from figlet)
- **Colors**: Rainbow gradient (`#FF1493` → `#FF69B4` → `#FF00FF` → `#9F7AEA` → `#8B5CF6` → `#3B82F6` → `#00BFFF` → `#10B981` → `#F59E0B` → `#EF4444` → `#FF6B6B`)
- **Style**: Colorful, eye-catching, professional
- **Metaphor**: Includes building/plumbing visualization below the logo

### Publishing to npm

When ready to publish:

```bash
# Navigate to package directory
cd ~/Development/l4yercak3-cli

# Login to npm (if not already logged in)
npm login

# Publish (make sure version is updated in package.json first)
npm publish --access public

# After publishing, users can install with:
npm install -g @l4yercak3/cli

# Or use with npx (no install needed):
npx @l4yercak3/cli
```

### Version Management

Before publishing, update the version in `package.json`:
- Patch: `npm version patch` (1.0.0 → 1.0.1)
- Minor: `npm version minor` (1.0.0 → 1.1.0)
- Major: `npm version major` (1.0.0 → 2.0.0)

### Next Steps / TODO

- [ ] Add CLI commands (spread, login, etc.)
- [ ] Add interactive questionnaire for project setup
- [ ] Add OAuth credential generation
- [ ] Add environment file generation
- [ ] Add API client template generation
- [ ] Add webhook handler templates
- [ ] Add Stripe integration setup
- [ ] Add School/CRM integration setup
- [ ] Add project templates (landing page, portal, app)
- [ ] Add help command with examples
- [ ] Add update checker
- [ ] Add telemetry (opt-in)

### Related Files

The logo demo files are located at:
- `vc83-com/.kiro/npm_l4yercak3_tool/demo-logo-figlet-building.js` - All font variations
- `vc83-com/.kiro/npm_l4yercak3_tool/demo-logo-plumbing-building.js` - Building metaphor versions
- `vc83-com/.kiro/npm_l4yercak3_tool/PROJECT_VISION.md` - Full project vision and roadmap

## 📄 License

MIT

## 🔧 Dependencies

- **chalk@^4.1.2** - Terminal colors (v4 for CommonJS compatibility)
- **figlet@^1.7.0** - ASCII art generation

**Note**: We use chalk v4 (not v5) because v5 is ESM-only and this package uses CommonJS.

## 🐛 Troubleshooting

### Command not found after npm link

If `l4yercak3` or `icing` commands aren't found after `npm link`:
1. Check that `bin/cli.js` has executable permissions: `chmod +x bin/cli.js`
2. Verify npm bin path: `npm bin -g`
3. Make sure npm bin is in your PATH
4. Try: `npm unlink` then `npm link` again

### Colors not showing

If colors don't appear in your terminal:
- Make sure your terminal supports ANSI colors
- Try setting `FORCE_COLOR=1` environment variable
- Check terminal color settings

### figlet font not found

If you get a font error:
- Make sure figlet is installed: `npm install figlet`
- The font `3D-ASCII` should be included with figlet
- Try listing available fonts: `figlet -l` (if figlet CLI is installed)

## 🙏 Credits

Built with:
- [figlet](https://github.com/patorjk/figlet.js) - ASCII art generation
- [chalk](https://github.com/chalk/chalk) - Terminal colors

## 📚 Related Documentation

- See `PROJECT_VISION.md` in `vc83-com/.kiro/npm_l4yercak3_tool/` for full project vision
- See demo files in `vc83-com/.kiro/npm_l4yercak3_tool/` for logo variations

---

**🍰 Icing on the L4yercak3 - Build your floors on our foundation! 🍰**
