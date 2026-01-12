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

  describe('legacy generate (backward compatibility)', () => {
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
        integrationPath: 'legacy', // Use legacy path for backward compatibility tests
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
        integrationPath: 'legacy',
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
        integrationPath: 'legacy',
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
        integrationPath: 'legacy',
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
        frameworkType: 'nextjs',
        integrationPath: 'legacy',
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
        integrationPath: 'legacy',
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
        integrationPath: 'legacy',
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
        integrationPath: 'legacy',
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
        integrationPath: 'legacy',
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
        integrationPath: 'legacy',
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
        integrationPath: 'legacy',
      };

      const result = await FileGenerator.generate(options);

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
        integrationPath: 'legacy',
      };

      const result = await FileGenerator.generate(options);

      expect(result.apiClient).not.toBeNull();
      expect(result.envFile).not.toBeNull();
      expect(result.nextauth).not.toBeNull();
      expect(result.oauthGuide).not.toBeNull();
    });
  });

  describe('api-only integration path', () => {
    it('returns results object with expected structure', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm'],
        oauthProviders: [],
        isTypeScript: true,
        integrationPath: 'api-only',
      };

      const result = await FileGenerator.generate(options);

      expect(result).toHaveProperty('apiClient');
      expect(result).toHaveProperty('types');
      expect(result).toHaveProperty('webhooks');
      expect(result).toHaveProperty('index');
      expect(result).toHaveProperty('envFile');
      expect(result).toHaveProperty('gitignore');
    });

    it('generates typed client file', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm'],
        oauthProviders: [],
        isTypeScript: true,
        integrationPath: 'api-only',
      };

      const result = await FileGenerator.generate(options);

      expect(result.apiClient).not.toBeNull();
      expect(result.apiClient).toContain('client.ts');
    });

    it('generates types file for TypeScript projects', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm'],
        oauthProviders: [],
        isTypeScript: true,
        integrationPath: 'api-only',
      };

      const result = await FileGenerator.generate(options);

      expect(result.types).not.toBeNull();
      expect(result.types).toContain('types.ts');
    });

    it('does not generate types file for JavaScript projects', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm'],
        oauthProviders: [],
        isTypeScript: false,
        integrationPath: 'api-only',
      };

      const result = await FileGenerator.generate(options);

      expect(result.types).toBeNull();
    });

    it('generates webhooks utility file', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm'],
        oauthProviders: [],
        isTypeScript: true,
        integrationPath: 'api-only',
      };

      const result = await FileGenerator.generate(options);

      expect(result.webhooks).not.toBeNull();
      expect(result.webhooks).toContain('webhooks.ts');
    });
  });

  describe('quickstart integration path', () => {
    it('returns results object with expected structure', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm', 'oauth'],
        oauthProviders: ['google'],
        isTypeScript: true,
        frameworkType: 'nextjs',
        integrationPath: 'quickstart',
      };

      const result = await FileGenerator.generate(options);

      expect(result).toHaveProperty('apiClient');
      expect(result).toHaveProperty('types');
      expect(result).toHaveProperty('webhooks');
      expect(result).toHaveProperty('envFile');
      expect(result).toHaveProperty('nextauth');
      expect(result).toHaveProperty('oauthGuide');
      expect(result).toHaveProperty('gitignore');
    });

    it('generates NextAuth for Next.js with oauth feature', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['crm', 'oauth'],
        oauthProviders: ['google'],
        isTypeScript: true,
        frameworkType: 'nextjs',
        integrationPath: 'quickstart',
      };

      const result = await FileGenerator.generate(options);

      expect(result.nextauth).not.toBeNull();
      expect(result.oauthGuide).not.toBeNull();
    });
  });

  describe('mcp-assisted integration path', () => {
    it('returns results object with expected structure', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        organizationName: 'Test Org',
        features: ['crm'],
        oauthProviders: [],
        isTypeScript: true,
        integrationPath: 'mcp-assisted',
      };

      const result = await FileGenerator.generate(options);

      expect(result).toHaveProperty('mcpConfig');
      expect(result).toHaveProperty('mcpGuide');
      expect(result).toHaveProperty('envFile');
      expect(result).toHaveProperty('gitignore');
    });

    it('generates MCP config file', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        organizationName: 'Test Org',
        features: ['crm'],
        oauthProviders: [],
        isTypeScript: true,
        integrationPath: 'mcp-assisted',
      };

      const result = await FileGenerator.generate(options);

      expect(result.mcpConfig).not.toBeNull();
      expect(result.mcpConfig).toContain('mcp.json');
    });

    it('generates MCP guide file', async () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        organizationName: 'Test Org',
        features: ['crm'],
        oauthProviders: [],
        isTypeScript: true,
        integrationPath: 'mcp-assisted',
      };

      const result = await FileGenerator.generate(options);

      expect(result.mcpGuide).not.toBeNull();
      expect(result.mcpGuide).toContain('L4YERCAK3_MCP_GUIDE.md');
    });
  });
});
