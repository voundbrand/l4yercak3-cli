/**
 * Tests for Expo/React Native Project Detector
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

const detector = require('../src/detectors/expo-detector');

describe('ExpoDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic detection', () => {
    it('detects Expo project', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          expo: '^51.0.0',
          'react-native': '0.74.0',
        },
      }));

      const result = detector.detect('/test/project');

      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.isExpo).toBe(true);
      expect(result.metadata.expoVersion).toBe('^51.0.0');
    });

    it('detects React Native project without Expo (below confidence threshold)', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          'react-native': '0.74.0',
        },
      }));

      const result = detector.detect('/test/project');

      // Pure React Native has lower confidence (0.7)
      // which is below the 0.8 threshold, so it won't be the "detected" match
      // but the detector still returns useful data
      expect(result.detected).toBe(true);
      expect(result.confidence).toBe(0.7);
    });

    it('does not detect non-Expo/React Native project', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
        },
      }));

      const result = detector.detect('/test/project');

      expect(result.detected).toBe(false);
    });

    it('does not detect when no package.json', () => {
      fs.existsSync.mockReturnValue(false);

      const result = detector.detect('/test/project');

      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe('routerType detection', () => {
    it('detects expo-router', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          expo: '^51.0.0',
          'expo-router': '^3.5.0',
          'react-native': '0.74.0',
        },
      }));

      const result = detector.detect('/test/project');

      expect(result.detected).toBe(true);
      expect(result.metadata.routerType).toBe('expo-router');
    });

    it('detects react-navigation', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          expo: '^51.0.0',
          '@react-navigation/native': '^6.0.0',
          'react-native': '0.74.0',
        },
      }));

      const result = detector.detect('/test/project');

      expect(result.detected).toBe(true);
      expect(result.metadata.routerType).toBe('react-navigation');
    });

    it('defaults to native when no router package is present', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          expo: '^51.0.0',
          'react-native': '0.74.0',
        },
      }));

      const result = detector.detect('/test/project');

      expect(result.detected).toBe(true);
      expect(result.metadata.routerType).toBe('native');
    });

    it('NEVER returns null for routerType when project is detected', () => {
      // This is the critical test - routerType must never be null
      // when the project is successfully detected
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          expo: '^51.0.0',
          'react-native': '0.74.0',
          // No router packages at all
        },
      }));

      const result = detector.detect('/test/project');

      expect(result.detected).toBe(true);
      // This must NEVER be null - backend requires string
      expect(result.metadata.routerType).not.toBeNull();
      expect(result.metadata.routerType).not.toBeUndefined();
      expect(typeof result.metadata.routerType).toBe('string');
    });
  });

  describe('TypeScript detection', () => {
    it('detects TypeScript via dependency', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          expo: '^51.0.0',
          'react-native': '0.74.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
        },
      }));

      const result = detector.detect('/test/project');

      expect(result.metadata.hasTypeScript).toBe(true);
    });

    it('detects TypeScript via tsconfig.json', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('tsconfig.json')) return true;
        if (p.includes('package.json')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          expo: '^51.0.0',
          'react-native': '0.74.0',
        },
      }));

      const result = detector.detect('/test/project');

      expect(result.metadata.hasTypeScript).toBe(true);
    });
  });

  describe('app config detection', () => {
    it('detects app.json config', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('app.json')) return true;
        if (p.includes('package.json')) return true;
        return false;
      });
      fs.readFileSync.mockImplementation((p) => {
        if (p.includes('app.json')) {
          return JSON.stringify({
            expo: {
              sdkVersion: '51.0.0',
            },
          });
        }
        return JSON.stringify({
          dependencies: {
            expo: '^51.0.0',
            'react-native': '0.74.0',
          },
        });
      });

      const result = detector.detect('/test/project');

      expect(result.metadata.config).toBe('app.json');
      expect(result.metadata.sdkVersion).toBe('51.0.0');
      expect(result.confidence).toBe(0.95);
    });

    it('detects app.config.js config', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('app.config.js')) return true;
        if (p.includes('package.json')) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          expo: '^51.0.0',
          'react-native': '0.74.0',
        },
      }));

      const result = detector.detect('/test/project');

      expect(result.metadata.config).toBe('app.config.js');
    });
  });

  describe('features and generators', () => {
    it('returns supported features', () => {
      const features = detector.getSupportedFeatures();

      expect(features.oauth).toBe(true);
      expect(features.stripe).toBe(true);
      expect(features.crm).toBe(true);
      expect(features.projects).toBe(true);
      expect(features.invoices).toBe(true);
    });

    it('returns available generators', () => {
      const generators = detector.getAvailableGenerators();

      expect(generators).toContain('api-client');
      expect(generators).toContain('env');
      expect(generators).toContain('oauth-guide');
      // Should NOT include Next.js specific generators
      expect(generators).not.toContain('nextauth');
    });
  });

  describe('detector properties', () => {
    it('has correct name', () => {
      expect(detector.name).toBe('expo');
    });

    it('has high priority', () => {
      expect(detector.priority).toBe(95);
      // Should be higher than generic React but lower than Expo with config
    });
  });
});
