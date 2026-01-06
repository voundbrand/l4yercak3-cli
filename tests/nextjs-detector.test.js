/**
 * Tests for Next.js Detector
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

const NextJsDetector = require('../src/detectors/nextjs-detector');

describe('NextJsDetector', () => {
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('properties', () => {
    it('has correct name', () => {
      expect(NextJsDetector.name).toBe('nextjs');
    });

    it('has high priority', () => {
      expect(NextJsDetector.priority).toBe(100);
    });
  });

  describe('detect', () => {
    it('returns not detected when no package.json exists', () => {
      fs.existsSync.mockReturnValue(false);

      const result = NextJsDetector.detect(mockProjectPath);

      // When package.json doesn't exist, returns raw results object
      expect(result.isNextJs).toBe(false);
      expect(result.version).toBeNull();
    });

    it('returns not detected when Next.js is not in dependencies', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          react: '^18.0.0',
        },
      }));

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result).toEqual({
        detected: false,
        confidence: 0,
        metadata: {},
      });
    });

    it('detects Next.js project with version', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p === path.join(mockProjectPath, 'package.json')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
        },
      }));

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBe(0.95);
      expect(result.metadata.version).toBe('^14.0.0');
    });

    it('detects TypeScript from dependencies', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p === path.join(mockProjectPath, 'package.json')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
        },
      }));

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result.metadata.hasTypeScript).toBe(true);
    });

    it('detects TypeScript from tsconfig.json', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p === path.join(mockProjectPath, 'package.json')) return true;
        if (p === path.join(mockProjectPath, 'tsconfig.json')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
        },
      }));

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result.metadata.hasTypeScript).toBe(true);
    });

    it('detects App Router from app directory', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p === path.join(mockProjectPath, 'package.json')) return true;
        if (p === path.join(mockProjectPath, 'app')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
        },
      }));

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result.metadata.routerType).toBe('app');
    });

    it('detects App Router from src/app directory', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p === path.join(mockProjectPath, 'package.json')) return true;
        if (p === path.join(mockProjectPath, 'src', 'app')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
        },
      }));

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result.metadata.routerType).toBe('app');
    });

    it('detects Pages Router from pages directory', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p === path.join(mockProjectPath, 'package.json')) return true;
        if (p === path.join(mockProjectPath, 'pages')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
        },
      }));

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result.metadata.routerType).toBe('pages');
    });

    it('detects next.config.js', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p === path.join(mockProjectPath, 'package.json')) return true;
        if (p === path.join(mockProjectPath, 'next.config.js')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
        },
      }));

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result.metadata.config).toBe('next.config.js');
    });

    it('detects next.config.mjs', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p === path.join(mockProjectPath, 'package.json')) return true;
        if (p === path.join(mockProjectPath, 'next.config.mjs')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
        },
      }));

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result.metadata.config).toBe('next.config.mjs');
    });

    it('handles JSON parse errors gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');

      const result = NextJsDetector.detect(mockProjectPath);

      expect(result).toEqual({
        detected: false,
        confidence: 0,
        metadata: {},
      });
    });
  });

  describe('getSupportedFeatures', () => {
    it('returns all features as supported', () => {
      const features = NextJsDetector.getSupportedFeatures();

      expect(features).toEqual({
        oauth: true,
        stripe: true,
        crm: true,
        projects: true,
        invoices: true,
      });
    });
  });

  describe('getAvailableGenerators', () => {
    it('returns list of available generators', () => {
      const generators = NextJsDetector.getAvailableGenerators();

      expect(generators).toContain('api-client');
      expect(generators).toContain('env');
      expect(generators).toContain('nextauth');
      expect(generators).toContain('oauth-guide');
    });
  });
});
