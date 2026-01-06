/**
 * Tests for Base Detector
 */

const BaseDetector = require('../src/detectors/base-detector');

describe('BaseDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new BaseDetector();
  });

  describe('name getter', () => {
    it('throws error when not overridden', () => {
      expect(() => detector.name).toThrow('Detector must implement name getter');
    });
  });

  describe('priority getter', () => {
    it('returns default priority of 50', () => {
      expect(detector.priority).toBe(50);
    });
  });

  describe('detect', () => {
    it('throws error when not overridden', () => {
      expect(() => detector.detect()).toThrow('Detector must implement detect() method');
    });

    it('throws error with custom path', () => {
      expect(() => detector.detect('/custom/path')).toThrow('Detector must implement detect() method');
    });
  });

  describe('getSupportedFeatures', () => {
    it('returns default features (all false)', () => {
      const features = detector.getSupportedFeatures();

      expect(features).toEqual({
        oauth: false,
        stripe: false,
        crm: false,
        projects: false,
        invoices: false,
      });
    });
  });

  describe('getAvailableGenerators', () => {
    it('returns default generators', () => {
      const generators = detector.getAvailableGenerators();

      expect(generators).toEqual(['api-client', 'env']);
    });
  });

  describe('inheritance', () => {
    it('can be extended with custom implementation', () => {
      class CustomDetector extends BaseDetector {
        get name() {
          return 'custom';
        }

        get priority() {
          return 75;
        }

        detect(projectPath) {
          return {
            detected: true,
            confidence: 0.9,
            metadata: { path: projectPath },
          };
        }

        getSupportedFeatures() {
          return {
            oauth: true,
            stripe: true,
            crm: false,
            projects: false,
            invoices: false,
          };
        }

        getAvailableGenerators() {
          return ['api-client', 'env', 'custom-generator'];
        }
      }

      const customDetector = new CustomDetector();

      expect(customDetector.name).toBe('custom');
      expect(customDetector.priority).toBe(75);
      expect(customDetector.detect('/test').detected).toBe(true);
      expect(customDetector.getSupportedFeatures().oauth).toBe(true);
      expect(customDetector.getAvailableGenerators()).toContain('custom-generator');
    });
  });
});
