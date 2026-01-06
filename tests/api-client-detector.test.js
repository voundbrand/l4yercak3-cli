/**
 * Tests for API Client Detector
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

const ApiClientDetector = require('../src/detectors/api-client-detector');

describe('ApiClientDetector', () => {
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
  });

  describe('detect', () => {
    it('returns hasApiClient false when no API client exists', () => {
      fs.existsSync.mockReturnValue(false);

      const result = ApiClientDetector.detect(mockProjectPath);

      expect(result.hasApiClient).toBe(false);
      expect(result.clientPath).toBeNull();
      expect(result.clientType).toBeNull();
    });

    describe('API client path detection', () => {
      const testPaths = [
        'lib/api-client.ts',
        'lib/api-client.js',
        'lib/api.ts',
        'lib/api.js',
        'src/lib/api-client.ts',
        'src/lib/api-client.js',
        'utils/api-client.ts',
        'utils/api.js',
        'src/utils/api-client.ts',
      ];

      testPaths.forEach((clientPath) => {
        it(`detects API client at ${clientPath}`, () => {
          fs.existsSync.mockImplementation((p) =>
            p === path.join(mockProjectPath, clientPath)
          );
          fs.readFileSync.mockReturnValue('fetch()');

          const result = ApiClientDetector.detect(mockProjectPath);

          expect(result.hasApiClient).toBe(true);
          expect(result.clientPath).toBe(clientPath);
        });
      });
    });

    describe('client type detection', () => {
      it('detects axios client', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'lib/api-client.ts')
        );
        fs.readFileSync.mockReturnValue(`
          import axios from 'axios';
          export const api = axios.create({});
        `);

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.clientType).toBe('axios');
      });

      it('detects fetch client', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'lib/api-client.ts')
        );
        fs.readFileSync.mockReturnValue(`
          export async function request(url) {
            return fetch(url);
          }
        `);

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.clientType).toBe('fetch');
      });

      it('detects custom client (no axios or fetch)', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'lib/api-client.ts')
        );
        fs.readFileSync.mockReturnValue(`
          import { request } from 'custom-http';
          export const api = request;
        `);

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.clientType).toBe('custom');
      });

      it('prefers axios over fetch when both present', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'lib/api-client.ts')
        );
        fs.readFileSync.mockReturnValue(`
          import axios from 'axios';
          // also uses fetch as fallback
          const fallback = fetch;
        `);

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.clientType).toBe('axios');
      });

      it('returns unknown on read error', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'lib/api-client.ts')
        );
        fs.readFileSync.mockImplementation(() => {
          throw new Error('Read failed');
        });

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.hasApiClient).toBe(true);
        expect(result.clientType).toBe('unknown');
      });
    });

    describe('environment file detection', () => {
      it('detects .env.local', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, '.env.local')
        );

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.hasEnvFile).toBe(true);
        expect(result.envFilePath).toBe('.env.local');
      });

      it('detects .env', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, '.env')
        );

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.hasEnvFile).toBe(true);
        expect(result.envFilePath).toBe('.env');
      });

      it('detects .env.development', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, '.env.development')
        );

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.hasEnvFile).toBe(true);
        expect(result.envFilePath).toBe('.env.development');
      });

      it('detects .env.production', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, '.env.production')
        );

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.hasEnvFile).toBe(true);
        expect(result.envFilePath).toBe('.env.production');
      });

      it('prefers .env.local over other env files', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, '.env.local') ||
          p === path.join(mockProjectPath, '.env')
        );

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.envFilePath).toBe('.env.local');
      });

      it('returns hasEnvFile false when no env file exists', () => {
        fs.existsSync.mockReturnValue(false);

        const result = ApiClientDetector.detect(mockProjectPath);

        expect(result.hasEnvFile).toBe(false);
        expect(result.envFilePath).toBeNull();
      });
    });

    it('stops at first found API client', () => {
      let callCount = 0;
      fs.existsSync.mockImplementation((p) => {
        callCount++;
        return p === path.join(mockProjectPath, 'lib/api-client.ts');
      });
      fs.readFileSync.mockReturnValue('fetch');

      ApiClientDetector.detect(mockProjectPath);

      // Should stop checking after finding first client
      // (only checks up to lib/api-client.ts which is index 0)
      expect(callCount).toBeLessThan(20);
    });
  });
});
