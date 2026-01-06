# Adding a New Project Type

Quick guide for adding support for new frameworks (React, Vue, Svelte, etc.)

## Quick Start

### 1. Create Detector File

Create `src/detectors/react-detector.js` (example for React):

```javascript
const BaseDetector = require('./base-detector');
const fs = require('fs');
const path = require('path');

class ReactDetector extends BaseDetector {
  get name() {
    return 'react';
  }

  get priority() {
    return 50; // Lower than Next.js (100)
  }

  detect(projectPath = process.cwd()) {
    // Check for React-specific files
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { detected: false, confidence: 0, metadata: {} };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const hasReact = !!deps.react;
      const hasTypeScript = !!deps.typescript || fs.existsSync(path.join(projectPath, 'tsconfig.json'));

      if (!hasReact) {
        return { detected: false, confidence: 0, metadata: {} };
      }

      return {
        detected: true,
        confidence: 0.9,
        metadata: {
          version: deps.react,
          hasTypeScript,
        },
      };
    } catch (error) {
      return { detected: false, confidence: 0, metadata: {} };
    }
  }

  getSupportedFeatures() {
    return {
      oauth: 'manual',  // No NextAuth, manual setup only
      stripe: true,
      crm: true,
      projects: true,
      invoices: true,
    };
  }

  getAvailableGenerators() {
    return [
      'api-client',  // Shared generator
      'env',          // Shared generator
      // Add React-specific generators here if needed
    ];
  }
}

module.exports = new ReactDetector();
```

### 2. Register Detector

Add to `src/detectors/registry.js`:

```javascript
const nextJsDetector = require('./nextjs-detector');
const reactDetector = require('./react-detector');  // Add this

const detectors = [
  nextJsDetector,
  reactDetector,  // Add this
];
```

### 3. Test

```bash
cd /path/to/react/project
l4yercak3 spread
```

You should see:
```
✅ Detected react project
```

---

## What Gets Generated?

### Shared Generators (Work for All Frameworks)

- **`api-client`** - Generates API client (framework-agnostic)
- **`env`** - Generates `.env.local.example` (framework-agnostic)

### Framework-Specific Generators

- **Next.js**: `nextauth` (NextAuth.js setup)
- **React**: (none yet, but can add `react-auth` generator)
- **Vue**: (none yet, but can add `vue-auth` generator)

---

## Feature Support Matrix

When implementing `getSupportedFeatures()`, use:

- `true` - Full support (e.g., Next.js OAuth with NextAuth.js)
- `'manual'` - Guide only (e.g., React OAuth setup guide)
- `false` - Not supported

---

## Priority Guidelines

Set detector priority based on specificity:

- **100**: Very specific (Next.js, Nuxt, SvelteKit)
- **75**: Framework + build tool (Vite + React, Webpack + Vue)
- **50**: Pure framework (React, Vue, Svelte)
- **25**: Generic (JavaScript/TypeScript)

Higher priority detectors run first. First match with confidence > 0.8 wins.

---

## Example: Adding Vue Support

1. Create `src/detectors/vue-detector.js`
2. Register in `registry.js`
3. Test with a Vue project
4. Add Vue-specific generators if needed (e.g., `vue-auth-generator.js`)

That's it! The architecture handles the rest automatically.

---

**See:** `DETECTOR_ARCHITECTURE.md` for full architecture details

