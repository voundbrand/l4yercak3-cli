/**
 * Tests for OAuth Detector
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

const OAuthDetector = require('../src/detectors/oauth-detector');

describe('OAuthDetector', () => {
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
  });

  describe('detect', () => {
    it('returns hasOAuth false when no OAuth setup exists', () => {
      fs.existsSync.mockReturnValue(false);

      const result = OAuthDetector.detect(mockProjectPath);

      expect(result.hasOAuth).toBe(false);
      expect(result.oauthType).toBeNull();
      expect(result.configPath).toBeNull();
      expect(result.providers).toEqual([]);
    });

    describe('NextAuth.js detection', () => {
      it('detects App Router NextAuth config (TypeScript)', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'app/api/auth/[...nextauth]/route.ts')
        );
        fs.readFileSync.mockReturnValue('GoogleProvider({})');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasOAuth).toBe(true);
        expect(result.oauthType).toBe('nextauth');
        expect(result.configPath).toBe('app/api/auth/[...nextauth]/route.ts');
      });

      it('detects App Router NextAuth config (JavaScript)', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'app/api/auth/[...nextauth]/route.js')
        );
        fs.readFileSync.mockReturnValue('export default');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasOAuth).toBe(true);
        expect(result.oauthType).toBe('nextauth');
        expect(result.configPath).toBe('app/api/auth/[...nextauth]/route.js');
      });

      it('detects Pages Router NextAuth config', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'pages/api/auth/[...nextauth].ts')
        );
        fs.readFileSync.mockReturnValue('export default NextAuth');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasOAuth).toBe(true);
        expect(result.oauthType).toBe('nextauth');
        expect(result.configPath).toBe('pages/api/auth/[...nextauth].ts');
      });

      it('detects src/app NextAuth config', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'src/app/api/auth/[...nextauth]/route.ts')
        );
        fs.readFileSync.mockReturnValue('NextAuth');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasOAuth).toBe(true);
        expect(result.configPath).toBe('src/app/api/auth/[...nextauth]/route.ts');
      });
    });

    describe('provider detection', () => {
      it('detects Google provider', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'app/api/auth/[...nextauth]/route.ts')
        );
        fs.readFileSync.mockReturnValue('GoogleProvider({ clientId: "" })');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.providers).toContain('google');
      });

      it('detects Microsoft/Azure provider', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'app/api/auth/[...nextauth]/route.ts')
        );
        fs.readFileSync.mockReturnValue('AzureADProvider({ clientId: "" })');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.providers).toContain('microsoft');
      });

      it('detects GitHub provider', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'app/api/auth/[...nextauth]/route.ts')
        );
        fs.readFileSync.mockReturnValue('GitHubProvider({ clientId: "" })');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.providers).toContain('github');
      });

      it('detects multiple providers', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'app/api/auth/[...nextauth]/route.ts')
        );
        fs.readFileSync.mockReturnValue(`
          GoogleProvider({}),
          AzureADProvider({}),
          GitHubProvider({})
        `);

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.providers).toContain('google');
        expect(result.providers).toContain('microsoft');
        expect(result.providers).toContain('github');
      });

      it('detects provider by keyword (lowercase)', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'app/api/auth/[...nextauth]/route.ts')
        );
        fs.readFileSync.mockReturnValue('providers: [google, azure, github]');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.providers).toContain('google');
        expect(result.providers).toContain('microsoft');
        expect(result.providers).toContain('github');
      });
    });

    describe('environment variable detection', () => {
      it('detects OAuth env vars in .env.local', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, '.env.local')
        );
        fs.readFileSync.mockReturnValue('NEXTAUTH_SECRET=secret123');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasEnvVars).toBe(true);
      });

      it('detects OAuth env vars in .env', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, '.env')
        );
        fs.readFileSync.mockReturnValue('GOOGLE_CLIENT_ID=abc123');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasEnvVars).toBe(true);
      });

      it('detects various OAuth env var names', () => {
        const oauthVars = [
          'NEXTAUTH_URL',
          'NEXTAUTH_SECRET',
          'GOOGLE_CLIENT_ID',
          'GOOGLE_CLIENT_SECRET',
          'MICROSOFT_CLIENT_ID',
          'GITHUB_CLIENT_ID',
          'GOOGLE_OAUTH_CLIENT_ID',
        ];

        for (const varName of oauthVars) {
          fs.existsSync.mockImplementation((p) =>
            p === path.join(mockProjectPath, '.env.local')
          );
          fs.readFileSync.mockReturnValue(`${varName}=value`);

          const result = OAuthDetector.detect(mockProjectPath);

          expect(result.hasEnvVars).toBe(true);
        }
      });
    });

    describe('package.json detection', () => {
      it('detects next-auth in dependencies', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'package.json')
        );
        fs.readFileSync.mockReturnValue(JSON.stringify({
          dependencies: { 'next-auth': '^4.0.0' },
        }));

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasOAuth).toBe(true);
        expect(result.oauthType).toBe('nextauth');
      });

      it('detects next-auth in devDependencies', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'package.json')
        );
        fs.readFileSync.mockReturnValue(JSON.stringify({
          devDependencies: { 'next-auth': '^4.0.0' },
        }));

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasOAuth).toBe(true);
      });

      it('handles package.json read errors', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'package.json')
        );
        fs.readFileSync.mockImplementation(() => {
          throw new Error('Read failed');
        });

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasOAuth).toBe(false);
      });

      it('handles invalid JSON in package.json', () => {
        fs.existsSync.mockImplementation((p) =>
          p === path.join(mockProjectPath, 'package.json')
        );
        fs.readFileSync.mockReturnValue('invalid json');

        const result = OAuthDetector.detect(mockProjectPath);

        expect(result.hasOAuth).toBe(false);
      });
    });

    it('handles config file read errors gracefully', () => {
      fs.existsSync.mockImplementation((p) =>
        p === path.join(mockProjectPath, 'app/api/auth/[...nextauth]/route.ts')
      );
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read failed');
      });

      const result = OAuthDetector.detect(mockProjectPath);

      expect(result.hasOAuth).toBe(true);
      expect(result.providers).toEqual([]);
    });
  });
});
