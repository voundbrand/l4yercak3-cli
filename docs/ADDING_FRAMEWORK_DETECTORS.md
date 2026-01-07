# Adding New Framework Detectors

This guide explains how to add support for new frameworks/platforms to the L4YERCAK3 CLI.

## Overview

The CLI uses a detector system to identify what type of project it's running in. Each detector:
1. Checks if the project matches its framework
2. Returns metadata about the project (version, router type, TypeScript, etc.)
3. Specifies which features and generators are supported

## Architecture

```
src/detectors/
├── base-detector.js     # Base class all detectors extend
├── registry.js          # Central registry that runs all detectors
├── index.js             # Main entry point (orchestrates detection)
├── nextjs-detector.js   # Next.js detector
├── expo-detector.js     # Expo/React Native detector
└── [your-detector].js   # Your new detector
```

## Step 1: Create the Detector File

Create a new file in `src/detectors/` named `{framework}-detector.js`.

### Template

```javascript
/**
 * {Framework} Project Detector
 * Detects {Framework} projects and their configuration
 */

const fs = require('fs');
const path = require('path');
const BaseDetector = require('./base-detector');

class {Framework}Detector extends BaseDetector {
  /**
   * Unique identifier for this framework
   * Used in registration data and throughout the CLI
   */
  get name() {
    return '{framework}'; // lowercase, e.g., 'remix', 'astro', 'sveltekit'
  }

  /**
   * Detection priority (0-100)
   *
   * Guidelines:
   * - 100: Meta-frameworks (Next.js, Nuxt, SvelteKit)
   * - 95: Platform-specific (Expo, Tauri)
   * - 75: Framework + bundler (Vite + React)
   * - 50: Pure frameworks (React, Vue)
   * - 25: Generic projects
   */
  get priority() {
    return 90; // Adjust based on specificity
  }

  /**
   * Detect if this is a {Framework} project
   *
   * @param {string} projectPath - Directory to check
   * @returns {object} Detection result
   */
  detect(projectPath = process.cwd()) {
    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { detected: false, confidence: 0, metadata: {} };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for framework-specific dependency
      if (!dependencies['{framework-package}']) {
        return { detected: false, confidence: 0, metadata: {} };
      }

      // Gather metadata
      const metadata = {
        version: dependencies['{framework-package}'],
        hasTypeScript: !!dependencies.typescript ||
                       fs.existsSync(path.join(projectPath, 'tsconfig.json')),
        // Add framework-specific metadata:
        routerType: this.detectRouterType(dependencies),
        // config, plugins, etc.
      };

      return {
        detected: true,
        confidence: 0.95, // Adjust based on detection certainty
        metadata,
      };
    } catch (error) {
      return { detected: false, confidence: 0, metadata: {} };
    }
  }

  /**
   * Detect router type for this framework
   * IMPORTANT: Always return a string, never null/undefined
   */
  detectRouterType(dependencies) {
    // Example for a framework with multiple router options
    if (dependencies['{file-router-package}']) {
      return 'file-based';
    } else if (dependencies['{other-router}']) {
      return 'manual';
    }
    return 'default'; // Always have a fallback!
  }

  /**
   * Features supported by this framework
   */
  getSupportedFeatures() {
    return {
      oauth: true,      // true = full support, 'manual' = guide only, false = none
      stripe: true,     // Payment integration
      crm: true,        // CRM API access
      projects: true,   // Projects feature
      invoices: true,   // Invoices feature
    };
  }

  /**
   * Available generators for this framework
   */
  getAvailableGenerators() {
    return [
      'api-client',    // Always include - generates API client
      'env',           // Always include - generates .env.local
      'oauth-guide',   // Include if oauth is supported
      // Framework-specific generators:
      // '{framework}-auth',
    ];
  }
}

module.exports = new {Framework}Detector();
```

## Step 2: Register the Detector

Add your detector to `src/detectors/registry.js`:

```javascript
const nextJsDetector = require('./nextjs-detector');
const expoDetector = require('./expo-detector');
const yourDetector = require('./{framework}-detector'); // Add this

const detectors = [
  nextJsDetector,
  expoDetector,
  yourDetector, // Add this
];
```

## Step 3: Update File Generators (if needed)

If your framework needs special file generation, update `src/generators/index.js`:

```javascript
// Check for your framework
if (frameworkType === '{framework}') {
  // Generate framework-specific files
}
```

And update `src/generators/api-client-generator.js` for proper file paths:

```javascript
isMobileFramework(frameworkType) {
  return ['expo', 'react-native', '{framework}'].includes(frameworkType);
}
```

## Step 4: Update Spread Command (if needed)

If your framework needs special handling in the setup flow, update `src/commands/spread.js`:

```javascript
// Framework-specific detection display
if (detection.framework.type === '{framework}') {
  console.log(chalk.gray(`     Router: ${meta.routerType}`));
}

// Framework-specific next steps
if (frameworkType === '{framework}') {
  console.log(chalk.gray('     3. Install {framework}-specific package'));
}
```

## Step 5: Write Tests

Create `tests/{framework}-detector.test.js`:

```javascript
const fs = require('fs');
const path = require('path');

jest.mock('fs');

const detector = require('../src/detectors/{framework}-detector');

describe('{Framework}Detector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects {framework} project', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({
      dependencies: {
        '{framework-package}': '^1.0.0',
      },
    }));

    const result = detector.detect('/test/project');

    expect(result.detected).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('returns correct metadata', () => {
    fs.existsSync.mockImplementation((p) => {
      if (p.includes('tsconfig.json')) return true;
      if (p.includes('package.json')) return true;
      return false;
    });
    fs.readFileSync.mockReturnValue(JSON.stringify({
      dependencies: {
        '{framework-package}': '^1.0.0',
        'typescript': '^5.0.0',
      },
    }));

    const result = detector.detect('/test/project');

    expect(result.metadata.hasTypeScript).toBe(true);
    expect(result.metadata.routerType).toBeDefined();
  });

  it('does not detect non-{framework} project', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({
      dependencies: {
        'some-other-framework': '^1.0.0',
      },
    }));

    const result = detector.detect('/test/project');

    expect(result.detected).toBe(false);
  });
});
```

## Important Rules

### 1. Always Return a Router Type

The backend expects `routerType` to be a string if present. Never return `null` or `undefined`:

```javascript
// ❌ Bad
routerType: dependencies['some-router'] ? 'router' : null,

// ✅ Good
routerType: dependencies['some-router'] ? 'specific-router' : 'default',
```

### 2. Priority Order Matters

Higher priority detectors run first. If a project could match multiple detectors (e.g., Next.js is also React), the more specific one should have higher priority.

### 3. Confidence Levels

- `0.95+`: Very certain (found framework + config file)
- `0.85-0.94`: Certain (found framework package)
- `0.70-0.84`: Likely (found related packages)
- `< 0.70`: Uncertain

### 4. Metadata Requirements

These fields should always be present in metadata if applicable:
- `version`: Framework version from package.json
- `hasTypeScript`: Boolean
- `routerType`: String (never null!)
- `config`: Config file name if detected

## Example: Adding Remix Support

```javascript
// src/detectors/remix-detector.js

const fs = require('fs');
const path = require('path');
const BaseDetector = require('./base-detector');

class RemixDetector extends BaseDetector {
  get name() {
    return 'remix';
  }

  get priority() {
    return 100; // Meta-framework, high priority
  }

  detect(projectPath = process.cwd()) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { detected: false, confidence: 0, metadata: {} };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for Remix
      if (!dependencies['@remix-run/react']) {
        return { detected: false, confidence: 0, metadata: {} };
      }

      // Detect adapter
      let adapter = 'node'; // default
      if (dependencies['@remix-run/vercel']) adapter = 'vercel';
      else if (dependencies['@remix-run/cloudflare']) adapter = 'cloudflare';
      else if (dependencies['@remix-run/deno']) adapter = 'deno';

      return {
        detected: true,
        confidence: 0.95,
        metadata: {
          version: dependencies['@remix-run/react'],
          hasTypeScript: !!dependencies.typescript ||
                         fs.existsSync(path.join(projectPath, 'tsconfig.json')),
          routerType: 'file-based', // Remix always uses file-based routing
          adapter,
        },
      };
    } catch {
      return { detected: false, confidence: 0, metadata: {} };
    }
  }

  getSupportedFeatures() {
    return {
      oauth: true,
      stripe: true,
      crm: true,
      projects: true,
      invoices: true,
    };
  }

  getAvailableGenerators() {
    return ['api-client', 'env', 'oauth-guide'];
  }
}

module.exports = new RemixDetector();
```

## Checklist

Before submitting a new detector:

- [ ] Detector extends `BaseDetector`
- [ ] `name` getter returns lowercase string
- [ ] `priority` is set appropriately (0-100)
- [ ] `detect()` returns `{ detected, confidence, metadata }`
- [ ] `routerType` in metadata is never null/undefined
- [ ] `getSupportedFeatures()` returns feature matrix
- [ ] `getAvailableGenerators()` returns generator list
- [ ] Detector is registered in `registry.js`
- [ ] Tests are written and passing
- [ ] File generators updated if needed
- [ ] Spread command updated if needed
