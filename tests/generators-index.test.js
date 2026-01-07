/**
 * Tests for Generators Index (FileGenerator)
 */

const fs = require('fs');

jest.mock('fs');
jest.mock('../src/utils/file-utils', () => ({
  checkFileOverwrite: jest.fn().mockResolvedValue('write'),
  writeFileWithBackup: jest.fn((filePath, content, action) => {
    if (action === 'skip') return null;
    return filePath;
  }),
  ensureDir: jest.fn(),
}));

const FileGenerator = require('../src/generators/index');

describe('FileGenerator', () => {
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockReturnValue(undefined);
    fs.writeFileSync.mockReturnValue(undefined);
    fs.readFileSync.mockReturnValue('');
  });

  describe('generate', () => {
    it('returns results object with expected structure', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: [],
        oauthProviders: [],
        isTypeScript: false,
        routerType: 'app',
      };

      const result = await FileGenerator.generate(options);

      expect(result).toHaveProperty('apiClient');
      expect(result).toHaveProperty('envFile');
      expect(result).toHaveProperty('nextauth');
      expect(result).toHaveProperty('oauthGuide');
      expect(result).toHaveProperty('gitignore');
    });

    it('generates API client when features are provided', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm'],
        oauthProviders: [],
        isTypeScript: false,
      };

      const result = await FileGenerator.generate(options);

      expect(result.apiClient).not.toBeNull();
      expect(result.apiClient).toContain('api-client');
    });

    it('does not generate API client when no features', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: [],
        oauthProviders: [],
        isTypeScript: false,
      };

      const result = await FileGenerator.generate(options);

      expect(result.apiClient).toBeNull();
    });

    it('always generates env file', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: [],
        oauthProviders: [],
      };

      const result = await FileGenerator.generate(options);

      expect(result.envFile).not.toBeNull();
      expect(result.envFile).toContain('.env.local');
    });

    it('generates NextAuth config when oauth feature enabled (Next.js)', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['oauth'],
        oauthProviders: ['google'],
        isTypeScript: false,
        routerType: 'app',
        frameworkType: 'nextjs', // NextAuth is Next.js only
      };

      const result = await FileGenerator.generate(options);

      expect(result.nextauth).not.toBeNull();
    });

    it('does not generate NextAuth for Expo/mobile apps', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['oauth'],
        oauthProviders: ['google'],
        isTypeScript: true,
        frameworkType: 'expo',
      };

      const result = await FileGenerator.generate(options);

      expect(result.nextauth).toBeNull();
    });

    it('does not generate NextAuth when oauth not in features', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm'],
        oauthProviders: ['google'],
        isTypeScript: false,
        routerType: 'app',
      };

      const result = await FileGenerator.generate(options);

      expect(result.nextauth).toBeNull();
    });

    it('does not generate NextAuth when no oauthProviders', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['oauth'],
        oauthProviders: null,
        isTypeScript: false,
        routerType: 'app',
      };

      const result = await FileGenerator.generate(options);

      expect(result.nextauth).toBeNull();
    });

    it('generates OAuth guide when oauth feature enabled', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['oauth'],
        oauthProviders: ['google'],
        productionDomain: 'example.com',
        appName: 'Test App',
      };

      const result = await FileGenerator.generate(options);

      expect(result.oauthGuide).not.toBeNull();
      expect(result.oauthGuide).toContain('OAUTH_SETUP_GUIDE.md');
    });

    it('does not generate OAuth guide when oauth not enabled', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm'],
        oauthProviders: [],
      };

      const result = await FileGenerator.generate(options);

      expect(result.oauthGuide).toBeNull();
    });

    it('always attempts to update gitignore', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: [],
        oauthProviders: [],
      };

      const result = await FileGenerator.generate(options);

      // gitignore generator returns path or null depending on if update needed
      expect(result).toHaveProperty('gitignore');
    });

    it('generates all files when all features enabled (Next.js)', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm', 'oauth', 'stripe'],
        oauthProviders: ['google', 'github'],
        isTypeScript: true,
        routerType: 'app',
        productionDomain: 'example.com',
        appName: 'Full App',
        frameworkType: 'nextjs',
      };

      const result = await FileGenerator.generate(options);

      expect(result.apiClient).not.toBeNull();
      expect(result.envFile).not.toBeNull();
      expect(result.nextauth).not.toBeNull();
      expect(result.oauthGuide).not.toBeNull();
    });
  });
});
