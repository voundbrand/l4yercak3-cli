/**
 * Tests for Detector Index (ProjectDetector)
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

jest.mock('fs');
jest.mock('child_process');

const ProjectDetector = require('../src/detectors/index');

describe('ProjectDetector', () => {
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    execSync.mockReturnValue('');
  });

  describe('detect', () => {
    it('returns combined detection results', () => {
      const result = ProjectDetector.detect(mockProjectPath);

      expect(result).toHaveProperty('framework');
      expect(result).toHaveProperty('github');
      expect(result).toHaveProperty('apiClient');
      expect(result).toHaveProperty('oauth');
      expect(result).toHaveProperty('projectPath');
      expect(result).toHaveProperty('_raw');
    });

    it('includes projectPath in results', () => {
      const result = ProjectDetector.detect(mockProjectPath);

      expect(result.projectPath).toBe(mockProjectPath);
    });

    describe('framework detection', () => {
      it('returns null type when no framework detected', () => {
        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.framework.type).toBeNull();
        expect(result.framework.confidence).toBe(0);
      });

      it('detects Next.js framework', () => {
        fs.existsSync.mockImplementation((p) => {
          if (p === path.join(mockProjectPath, 'package.json')) return true;
          return false;
        });
        fs.readFileSync.mockReturnValue(JSON.stringify({
          dependencies: { next: '^14.0.0' },
        }));

        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.framework.type).toBe('nextjs');
        expect(result.framework.confidence).toBeGreaterThan(0.8);
      });

      it('includes supported features for detected framework', () => {
        fs.existsSync.mockImplementation((p) => {
          if (p === path.join(mockProjectPath, 'package.json')) return true;
          return false;
        });
        fs.readFileSync.mockReturnValue(JSON.stringify({
          dependencies: { next: '^14.0.0' },
        }));

        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.framework.supportedFeatures).toHaveProperty('oauth');
        expect(result.framework.supportedFeatures).toHaveProperty('stripe');
      });

      it('includes available generators for detected framework', () => {
        fs.existsSync.mockImplementation((p) => {
          if (p === path.join(mockProjectPath, 'package.json')) return true;
          return false;
        });
        fs.readFileSync.mockReturnValue(JSON.stringify({
          dependencies: { next: '^14.0.0' },
        }));

        const result = ProjectDetector.detect(mockProjectPath);

        expect(Array.isArray(result.framework.availableGenerators)).toBe(true);
        expect(result.framework.availableGenerators).toContain('api-client');
      });

      it('returns empty features/generators when no framework detected', () => {
        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.framework.supportedFeatures).toEqual({});
        expect(result.framework.availableGenerators).toEqual([]);
      });
    });

    describe('github detection', () => {
      it('detects GitHub repository info', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, '.git')
        );
        execSync
          .mockReturnValueOnce('https://github.com/owner/repo.git\n')
          .mockReturnValueOnce('main\n');

        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.github.isGitHub).toBe(true);
        expect(result.github.owner).toBe('owner');
        expect(result.github.repo).toBe('repo');
      });

      it('returns github info even without GitHub remote', () => {
        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.github).toHaveProperty('hasGit');
        expect(result.github).toHaveProperty('isGitHub');
      });
    });

    describe('apiClient detection', () => {
      it('detects existing API client', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'lib/api-client.ts')
        );
        fs.readFileSync.mockReturnValue('import axios');

        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.apiClient.hasApiClient).toBe(true);
        expect(result.apiClient.clientType).toBe('axios');
      });

      it('returns apiClient info even without existing client', () => {
        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.apiClient).toHaveProperty('hasApiClient');
        expect(result.apiClient).toHaveProperty('clientPath');
      });
    });

    describe('oauth detection', () => {
      it('detects OAuth setup', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'app/api/auth/[...nextauth]/route.ts')
        );
        fs.readFileSync.mockReturnValue('GoogleProvider');

        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.oauth.hasOAuth).toBe(true);
        expect(result.oauth.providers).toContain('google');
      });

      it('returns oauth info even without existing setup', () => {
        const result = ProjectDetector.detect(mockProjectPath);

        expect(result.oauth).toHaveProperty('hasOAuth');
        expect(result.oauth).toHaveProperty('providers');
      });
    });

    describe('raw results', () => {
      it('includes raw framework detection results', () => {
        const result = ProjectDetector.detect(mockProjectPath);

        expect(result._raw).toHaveProperty('frameworkResults');
        expect(Array.isArray(result._raw.frameworkResults)).toBe(true);
      });
    });
  });

  describe('getDetector', () => {
    it('returns detector by type name', () => {
      const detector = ProjectDetector.getDetector('nextjs');

      expect(detector).not.toBeNull();
      expect(detector.name).toBe('nextjs');
    });

    it('returns null for unknown type', () => {
      const detector = ProjectDetector.getDetector('unknown');

      expect(detector).toBeNull();
    });
  });

  describe('getAvailableTypes', () => {
    it('returns array of detector names', () => {
      const types = ProjectDetector.getAvailableTypes();

      expect(Array.isArray(types)).toBe(true);
      expect(types).toContain('nextjs');
    });

    it('returns strings only', () => {
      const types = ProjectDetector.getAvailableTypes();

      types.forEach((type) => {
        expect(typeof type).toBe('string');
      });
    });
  });
});
