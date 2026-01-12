/**
 * Database Detector
 * Detects existing database configurations in a project
 */

const fs = require('fs');
const path = require('path');

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Read and parse package.json
 * @param {string} projectPath - Project root path
 * @returns {object|null}
 */
function readPackageJson(projectPath) {
  try {
    const packagePath = path.join(projectPath, 'package.json');
    if (fileExists(packagePath)) {
      const content = fs.readFileSync(packagePath, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Detect database configuration in a project
 * @param {string} projectPath - Project root path
 * @returns {object} Detection result
 */
function detectDatabase(projectPath = process.cwd()) {
  const detections = [];

  // Check for Convex
  const convexDir = path.join(projectPath, 'convex');
  if (fileExists(convexDir)) {
    const hasSchema = fileExists(path.join(convexDir, 'schema.ts')) ||
                      fileExists(path.join(convexDir, 'schema.js'));
    detections.push({
      type: 'convex',
      confidence: 'high',
      configPath: 'convex/',
      hasSchema,
      details: {
        schemaFile: hasSchema ? 'convex/schema.ts' : null,
      },
    });
  }

  // Check for Supabase
  const supabaseDir = path.join(projectPath, 'supabase');
  if (fileExists(supabaseDir)) {
    const hasMigrations = fileExists(path.join(supabaseDir, 'migrations'));
    detections.push({
      type: 'supabase',
      confidence: 'high',
      configPath: 'supabase/',
      hasMigrations,
      details: {
        migrationsDir: hasMigrations ? 'supabase/migrations/' : null,
      },
    });
  }

  // Check for Prisma
  const prismaDir = path.join(projectPath, 'prisma');
  if (fileExists(prismaDir)) {
    const hasSchema = fileExists(path.join(prismaDir, 'schema.prisma'));
    detections.push({
      type: 'prisma',
      confidence: 'high',
      configPath: 'prisma/',
      hasSchema,
      details: {
        schemaFile: hasSchema ? 'prisma/schema.prisma' : null,
      },
    });
  }

  // Check for Drizzle config
  const drizzleConfig = [
    'drizzle.config.ts',
    'drizzle.config.js',
    'drizzle.config.mjs',
  ].find(f => fileExists(path.join(projectPath, f)));
  if (drizzleConfig) {
    detections.push({
      type: 'drizzle',
      confidence: 'high',
      configPath: drizzleConfig,
      details: {
        configFile: drizzleConfig,
      },
    });
  }

  // Check package.json for database dependencies
  const packageJson = readPackageJson(projectPath);
  if (packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Convex from package.json
    if (deps['convex'] && !detections.find(d => d.type === 'convex')) {
      detections.push({
        type: 'convex',
        confidence: 'medium',
        source: 'package.json',
        details: {
          version: deps['convex'],
        },
      });
    }

    // Supabase from package.json
    if (deps['@supabase/supabase-js'] && !detections.find(d => d.type === 'supabase')) {
      detections.push({
        type: 'supabase',
        confidence: 'medium',
        source: 'package.json',
        details: {
          version: deps['@supabase/supabase-js'],
        },
      });
    }

    // Prisma from package.json
    if ((deps['prisma'] || deps['@prisma/client']) && !detections.find(d => d.type === 'prisma')) {
      detections.push({
        type: 'prisma',
        confidence: 'medium',
        source: 'package.json',
        details: {
          version: deps['prisma'] || deps['@prisma/client'],
        },
      });
    }

    // Drizzle from package.json
    if (deps['drizzle-orm'] && !detections.find(d => d.type === 'drizzle')) {
      detections.push({
        type: 'drizzle',
        confidence: 'medium',
        source: 'package.json',
        details: {
          version: deps['drizzle-orm'],
        },
      });
    }

    // MongoDB/Mongoose
    if (deps['mongoose']) {
      detections.push({
        type: 'mongodb',
        confidence: 'medium',
        source: 'package.json',
        details: {
          client: 'mongoose',
          version: deps['mongoose'],
        },
      });
    }

    if (deps['mongodb'] && !detections.find(d => d.type === 'mongodb')) {
      detections.push({
        type: 'mongodb',
        confidence: 'medium',
        source: 'package.json',
        details: {
          client: 'mongodb',
          version: deps['mongodb'],
        },
      });
    }

    // Firebase/Firestore
    if (deps['firebase'] || deps['firebase-admin']) {
      detections.push({
        type: 'firebase',
        confidence: 'medium',
        source: 'package.json',
        details: {
          client: deps['firebase'] ? 'firebase' : 'firebase-admin',
          version: deps['firebase'] || deps['firebase-admin'],
        },
      });
    }

    // PostgreSQL (pg)
    if (deps['pg'] && !detections.find(d => ['prisma', 'drizzle', 'supabase'].includes(d.type))) {
      detections.push({
        type: 'postgresql',
        confidence: 'low',
        source: 'package.json',
        details: {
          client: 'pg',
          version: deps['pg'],
        },
      });
    }

    // MySQL
    if (deps['mysql2'] || deps['mysql']) {
      detections.push({
        type: 'mysql',
        confidence: 'low',
        source: 'package.json',
        details: {
          client: deps['mysql2'] ? 'mysql2' : 'mysql',
          version: deps['mysql2'] || deps['mysql'],
        },
      });
    }
  }

  // Sort by confidence (high first)
  const sortedDetections = detections.sort((a, b) => {
    const confidenceOrder = { high: 2, medium: 1, low: 0 };
    return (confidenceOrder[b.confidence] || 0) - (confidenceOrder[a.confidence] || 0);
  });

  return {
    hasDatabase: sortedDetections.length > 0,
    detections: sortedDetections,
    primary: sortedDetections[0] || null,
  };
}

module.exports = {
  detect: detectDatabase,
  detectDatabase,
};
