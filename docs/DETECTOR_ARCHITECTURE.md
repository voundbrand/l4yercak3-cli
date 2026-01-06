# Project Detector Architecture

## Overview

The CLI uses a **plugin-based detector system** that can identify different project types (Next.js, React, Vue, Svelte, etc.) and generate appropriate boilerplate for each.

## Design Principles

1. **Extensibility**: Easy to add new project types without modifying core code
2. **Separation of Concerns**: Detectors detect, generators generate
3. **Type Safety**: Each project type has its own detector and generator
4. **Graceful Degradation**: CLI works even if project type isn't fully supported

---

## Architecture

### 1. Base Detector Interface

All project detectors implement a common interface:

```javascript
{
  name: string,              // e.g., "nextjs", "react", "vue"
  priority: number,          // Detection priority (higher = checked first)
  detect(projectPath): {
    detected: boolean,       // Is this project type?
    confidence: number,      // 0-1, how confident are we?
    metadata: object,        // Type-specific metadata
  }
}
```

### 2. Detector Registry

Detectors are registered in a central registry:

```javascript
// src/detectors/registry.js
const detectors = [
  require('./nextjs-detector'),
  require('./react-detector'),      // Future
  require('./vue-detector'),        // Future
  // ... more detectors
];
```

### 3. Detection Flow

```
1. User runs `l4yercak3 spread`
2. CLI scans project directory
3. Runs all detectors (sorted by priority)
4. First detector with confidence > 0.8 wins
5. If no match, prompt user to select type
6. Use matched detector's metadata for generation
```

### 4. Generator Mapping

Each project type maps to specific generators:

```javascript
{
  nextjs: {
    generators: ['api-client', 'nextauth', 'env'],
    supportedFeatures: ['oauth', 'stripe', 'crm', 'projects', 'invoices']
  },
  react: {
    generators: ['api-client', 'env'],
    supportedFeatures: ['oauth', 'crm', 'projects']  // No NextAuth
  },
  vue: {
    generators: ['api-client', 'env'],
    supportedFeatures: ['oauth', 'crm', 'projects']
  }
}
```

---

## Current Implementation (MVP)

### Phase 1: Next.js Only

- ✅ `nextjs-detector.js` - Detects Next.js projects
- ✅ `github-detector.js` - Detects Git/GitHub (framework-agnostic)
- ✅ `api-client-detector.js` - Detects existing API clients (framework-agnostic)

**Current Flow:**
- If Next.js detected → Full feature support
- If not Next.js → Warn user, but still allow basic setup

### Future: Multi-Framework Support

When adding new frameworks:

1. **Create Detector** (`src/detectors/react-detector.js`)
   ```javascript
   class ReactDetector {
     name = 'react';
     priority = 50;  // Lower than Next.js (100)
     
     detect(projectPath) {
       // Check for React-specific files
       return {
         detected: hasReact,
         confidence: 0.9,
         metadata: { version, hasTypeScript, ... }
       };
     }
   }
   ```

2. **Register Detector** (`src/detectors/registry.js`)
   ```javascript
   const detectors = [
     require('./nextjs-detector'),
     require('./react-detector'),  // Add here
   ];
   ```

3. **Create Generators** (if needed)
   - React might need different OAuth setup (no NextAuth)
   - React might need different file structure
   - API client generator can be shared

4. **Update Feature Matrix** (`src/generators/feature-matrix.js`)
   ```javascript
   {
     react: {
       oauth: 'manual',  // No NextAuth, manual setup
       stripe: 'full',
       crm: 'full',
     }
   }
   ```

---

## Detector Interface Specification

### Required Methods

```javascript
class BaseDetector {
  /**
   * Unique identifier for this project type
   */
  get name() {
    return 'project-type';
  }

  /**
   * Detection priority (higher = checked first)
   * Range: 0-100
   */
  get priority() {
    return 50;
  }

  /**
   * Detect if project matches this type
   * @param {string} projectPath - Path to project directory
   * @returns {object} Detection result
   */
  detect(projectPath) {
    return {
      detected: boolean,      // Is this the project type?
      confidence: number,      // 0-1, how sure are we?
      metadata: {             // Type-specific info
        version: string,
        hasTypeScript: boolean,
        // ... more metadata
      }
    };
  }

  /**
   * Get supported features for this project type
   * @returns {object} Feature support matrix
   */
  getSupportedFeatures() {
    return {
      oauth: boolean | 'manual',  // true = full support, 'manual' = guide only, false = not supported
      stripe: boolean,
      crm: boolean,
      projects: boolean,
      invoices: boolean,
    };
  }

  /**
   * Get available generators for this project type
   * @returns {string[]} List of generator names
   */
  getAvailableGenerators() {
    return ['api-client', 'env'];
  }
}
```

---

## Generator Interface Specification

Generators are framework-agnostic where possible, but can be framework-specific when needed.

### Shared Generators (Work for all frameworks)

- `api-client-generator.js` - Generates API client (framework-agnostic)
- `env-generator.js` - Generates `.env.local.example` (framework-agnostic)

### Framework-Specific Generators

- `nextauth-generator.js` - Next.js only (NextAuth.js)
- `react-auth-generator.js` - React only (manual OAuth)
- `vue-auth-generator.js` - Vue only (manual OAuth)

---

## Detection Priority System

Detectors run in priority order. First match wins (if confidence > 0.8).

**Priority Levels:**
- **100**: Very specific frameworks (Next.js, Nuxt, SvelteKit)
- **75**: Framework with build tool (Vite + React, Webpack + Vue)
- **50**: Pure frameworks (React, Vue, Svelte)
- **25**: Generic JavaScript/TypeScript projects

**Example:**
```
Next.js (100) → Detected first
React + Vite (75) → Only checked if Next.js not detected
React (50) → Only checked if above not detected
Generic JS (25) → Fallback
```

---

## Adding a New Project Type

### Step-by-Step Guide

1. **Create Detector** (`src/detectors/myframework-detector.js`)
   ```javascript
   const BaseDetector = require('./base-detector');
   
   class MyFrameworkDetector extends BaseDetector {
     get name() { return 'myframework'; }
     get priority() { return 50; }
     
     detect(projectPath) {
       // Detection logic
       return {
         detected: true,
         confidence: 0.9,
         metadata: { version: '1.0.0' }
       };
     }
     
     getSupportedFeatures() {
       return {
         oauth: 'manual',
         stripe: true,
         crm: true,
         projects: true,
         invoices: false,
       };
     }
   }
   
   module.exports = new MyFrameworkDetector();
   ```

2. **Register Detector** (`src/detectors/registry.js`)
   ```javascript
   const detectors = [
     require('./nextjs-detector'),
     require('./myframework-detector'),  // Add here
   ];
   ```

3. **Create Generators** (if needed)
   - Check if existing generators work
   - Create framework-specific generators if needed

4. **Test**
   - Run `l4yercak3 spread` in a MyFramework project
   - Verify detection works
   - Verify generation works

---

## Current Status

### ✅ Implemented (Phase 1)
- Next.js detector (full support)
- GitHub detector (framework-agnostic)
- API client detector (framework-agnostic)
- Basic registry system

### 🚧 Future (Phase 4+)
- React detector
- Vue detector
- Svelte detector
- Generic JavaScript/TypeScript detector
- Framework-specific generators

---

## Benefits of This Architecture

1. **Easy to Extend**: Add new detectors without touching core code
2. **Type Safety**: Each framework has its own detection logic
3. **Feature Gating**: Can disable features per framework
4. **Graceful Degradation**: Works even if framework not fully supported
5. **Maintainable**: Clear separation between detection and generation

---

**Last Updated:** 2025-01-14  
**Status:** Phase 1 (Next.js only)  
**Next:** Ready for multi-framework support when needed

