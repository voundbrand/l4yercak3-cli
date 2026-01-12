/**
 * Tests for Database Detector
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

const databaseDetector = require('../src/detectors/database-detector');

describe('DatabaseDetector', () => {
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
  });

  describe('detect', () => {
    it('returns hasDatabase false when no database detected', () => {
      fs.existsSync.mockReturnValue(false);

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(false);
      expect(result.detections).toHaveLength(0);
      expect(result.primary).toBeNull();
    });

    it('detects Convex from directory', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'convex') ||
               filePath === path.join(mockProjectPath, 'convex', 'schema.ts');
      });

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      expect(result.primary.type).toBe('convex');
      expect(result.primary.confidence).toBe('high');
      expect(result.primary.hasSchema).toBe(true);
    });

    it('detects Supabase from directory', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'supabase') ||
               filePath === path.join(mockProjectPath, 'supabase', 'migrations');
      });

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      expect(result.primary.type).toBe('supabase');
      expect(result.primary.confidence).toBe('high');
      expect(result.primary.hasMigrations).toBe(true);
    });

    it('detects Prisma from directory', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'prisma') ||
               filePath === path.join(mockProjectPath, 'prisma', 'schema.prisma');
      });

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      expect(result.primary.type).toBe('prisma');
      expect(result.primary.confidence).toBe('high');
      expect(result.primary.hasSchema).toBe(true);
    });

    it('detects Drizzle from config file', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'drizzle.config.ts');
      });

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      expect(result.primary.type).toBe('drizzle');
      expect(result.primary.confidence).toBe('high');
    });

    it('detects database from package.json dependencies', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'package.json');
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          'convex': '^1.0.0',
        },
      }));

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      expect(result.primary.type).toBe('convex');
      expect(result.primary.confidence).toBe('medium');
      expect(result.primary.source).toBe('package.json');
    });

    it('detects Supabase from package.json', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'package.json');
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          '@supabase/supabase-js': '^2.0.0',
        },
      }));

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      expect(result.primary.type).toBe('supabase');
    });

    it('detects MongoDB/Mongoose from package.json', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'package.json');
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          'mongoose': '^7.0.0',
        },
      }));

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      expect(result.primary.type).toBe('mongodb');
      expect(result.primary.details.client).toBe('mongoose');
    });

    it('detects Firebase from package.json', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'package.json');
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          'firebase': '^9.0.0',
        },
      }));

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      expect(result.primary.type).toBe('firebase');
    });

    it('prioritizes high confidence detections', () => {
      // Both directory and package.json detected
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'convex') ||
               filePath === path.join(mockProjectPath, 'package.json');
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          'mongoose': '^7.0.0',
        },
      }));

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      // Convex directory detection should be primary (high confidence)
      expect(result.primary.type).toBe('convex');
      expect(result.primary.confidence).toBe('high');
      // MongoDB should also be in detections
      expect(result.detections.some(d => d.type === 'mongodb')).toBe(true);
    });

    it('returns multiple detections when multiple databases found', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'package.json');
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          'convex': '^1.0.0',
          'mongoose': '^7.0.0',
        },
      }));

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(true);
      expect(result.detections.length).toBeGreaterThan(1);
    });

    it('handles malformed package.json gracefully', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === path.join(mockProjectPath, 'package.json');
      });

      fs.readFileSync.mockReturnValue('not valid json');

      const result = databaseDetector.detect(mockProjectPath);

      expect(result.hasDatabase).toBe(false);
    });

    it('uses current directory as default', () => {
      const originalCwd = process.cwd;
      process.cwd = jest.fn().mockReturnValue(mockProjectPath);

      fs.existsSync.mockReturnValue(false);

      const result = databaseDetector.detect();

      expect(result.hasDatabase).toBe(false);
      process.cwd = originalCwd;
    });
  });
});
