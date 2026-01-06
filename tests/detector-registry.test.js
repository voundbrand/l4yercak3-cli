/**
 * Tests for Detector Registry
 */

const registry = require('../src/detectors/registry');

describe('Detector Registry', () => {
  describe('detectProjectType', () => {
    it('returns results object with expected structure', () => {
      const result = registry.detectProjectType('/nonexistent/path');

      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('allResults');
      expect(Array.isArray(result.allResults)).toBe(true);
    });

    it('returns detected: null when no framework matches', () => {
      const result = registry.detectProjectType('/nonexistent/path');

      expect(result.detected).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('includes all detector results in allResults', () => {
      const result = registry.detectProjectType('/nonexistent/path');

      expect(result.allResults.length).toBeGreaterThan(0);
      expect(result.allResults[0]).toHaveProperty('detector');
      expect(result.allResults[0]).toHaveProperty('priority');
    });
  });

  describe('getDetector', () => {
    it('returns nextjs detector by name', () => {
      const detector = registry.getDetector('nextjs');

      expect(detector).not.toBeNull();
      expect(detector.name).toBe('nextjs');
    });

    it('returns null for unknown detector name', () => {
      const detector = registry.getDetector('unknown-detector');

      expect(detector).toBeNull();
    });

    it('returns null for empty name', () => {
      const detector = registry.getDetector('');

      expect(detector).toBeNull();
    });
  });

  describe('getAllDetectors', () => {
    it('returns array of detectors', () => {
      const detectors = registry.getAllDetectors();

      expect(Array.isArray(detectors)).toBe(true);
      expect(detectors.length).toBeGreaterThan(0);
    });

    it('returns detectors sorted by priority (highest first)', () => {
      const detectors = registry.getAllDetectors();

      for (let i = 1; i < detectors.length; i++) {
        expect(detectors[i - 1].priority).toBeGreaterThanOrEqual(detectors[i].priority);
      }
    });

    it('each detector has required properties', () => {
      const detectors = registry.getAllDetectors();

      for (const detector of detectors) {
        expect(detector).toHaveProperty('name');
        expect(detector).toHaveProperty('priority');
        expect(typeof detector.detect).toBe('function');
      }
    });
  });

  describe('detectors export', () => {
    it('exports sorted detectors array', () => {
      expect(Array.isArray(registry.detectors)).toBe(true);
      expect(registry.detectors.length).toBeGreaterThan(0);
    });

    it('exported detectors match getAllDetectors', () => {
      expect(registry.detectors).toEqual(registry.getAllDetectors());
    });
  });
});
