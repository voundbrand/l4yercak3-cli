/**
 * Tests for Environment Generator
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

const EnvGenerator = require('../src/generators/env-generator');

describe('EnvGenerator', () => {
  const mockProjectPath = '/test/project';
  const mockEnvPath = path.join(mockProjectPath, '.env.local');

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    fs.writeFileSync.mockReturnValue(undefined);
  });

  describe('generate', () => {
    it('creates basic env file with core config', () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: [],
        oauthProviders: [],
      };

      const result = EnvGenerator.generate(options);

      expect(result).toBe(mockEnvPath);
      expect(fs.writeFileSync).toHaveBeenCalled();

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('L4YERCAK3_API_KEY=test-api-key');
      expect(writtenContent).toContain('L4YERCAK3_BACKEND_URL=https://backend.test.com');
      expect(writtenContent).toContain('L4YERCAK3_ORGANIZATION_ID=org-123');
      expect(writtenContent).toContain('NEXT_PUBLIC_L4YERCAK3_BACKEND_URL=https://backend.test.com');
    });

    it('adds Google OAuth variables when enabled', () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['oauth'],
        oauthProviders: ['google'],
      };

      EnvGenerator.generate(options);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('GOOGLE_CLIENT_ID=');
      expect(writtenContent).toContain('GOOGLE_CLIENT_SECRET=');
      expect(writtenContent).toContain('NEXTAUTH_URL=');
      expect(writtenContent).toContain('NEXTAUTH_SECRET=');
    });

    it('adds Microsoft OAuth variables when enabled', () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['oauth'],
        oauthProviders: ['microsoft'],
      };

      EnvGenerator.generate(options);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('AZURE_CLIENT_ID=');
      expect(writtenContent).toContain('AZURE_CLIENT_SECRET=');
      expect(writtenContent).toContain('AZURE_TENANT_ID=');
    });

    it('adds GitHub OAuth variables when enabled', () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['oauth'],
        oauthProviders: ['github'],
      };

      EnvGenerator.generate(options);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('GITHUB_CLIENT_ID=');
      expect(writtenContent).toContain('GITHUB_CLIENT_SECRET=');
    });

    it('adds Stripe variables when enabled', () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['stripe'],
        oauthProviders: [],
      };

      EnvGenerator.generate(options);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=');
      expect(writtenContent).toContain('STRIPE_SECRET_KEY=');
      expect(writtenContent).toContain('STRIPE_WEBHOOK_SECRET=');
    });

    it('preserves existing env values', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`
GOOGLE_CLIENT_ID=existing-google-id
GOOGLE_CLIENT_SECRET=existing-google-secret
CUSTOM_VAR=custom-value
`);

      const options = {
        projectPath: mockProjectPath,
        apiKey: 'new-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['oauth'],
        oauthProviders: ['google'],
      };

      EnvGenerator.generate(options);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('GOOGLE_CLIENT_ID=existing-google-id');
      expect(writtenContent).toContain('GOOGLE_CLIENT_SECRET=existing-google-secret');
      expect(writtenContent).toContain('L4YERCAK3_API_KEY=new-api-key');
    });

    it('adds all OAuth providers when multiple selected', () => {
      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        features: ['oauth'],
        oauthProviders: ['google', 'microsoft', 'github'],
      };

      EnvGenerator.generate(options);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('GOOGLE_CLIENT_ID=');
      expect(writtenContent).toContain('AZURE_CLIENT_ID=');
      expect(writtenContent).toContain('GITHUB_CLIENT_ID=');
    });
  });

  describe('readExistingEnv', () => {
    it('returns empty object when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const result = EnvGenerator.readExistingEnv(mockEnvPath);

      expect(result).toEqual({});
    });

    it('parses simple key=value pairs', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`
API_KEY=test123
SECRET=mysecret
`);

      const result = EnvGenerator.readExistingEnv(mockEnvPath);

      expect(result).toEqual({
        API_KEY: 'test123',
        SECRET: 'mysecret',
      });
    });

    it('ignores comments', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`
# This is a comment
API_KEY=test123
# Another comment
`);

      const result = EnvGenerator.readExistingEnv(mockEnvPath);

      expect(result).toEqual({
        API_KEY: 'test123',
      });
    });

    it('handles empty lines', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`
API_KEY=test123

SECRET=mysecret

`);

      const result = EnvGenerator.readExistingEnv(mockEnvPath);

      expect(result).toEqual({
        API_KEY: 'test123',
        SECRET: 'mysecret',
      });
    });

    it('handles read errors gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read failed');
      });

      const result = EnvGenerator.readExistingEnv(mockEnvPath);

      expect(result).toEqual({});
    });
  });

  describe('formatEnvFile', () => {
    it('includes header comment', () => {
      const envVars = {
        L4YERCAK3_API_KEY: 'key',
        L4YERCAK3_BACKEND_URL: 'url',
        L4YERCAK3_ORGANIZATION_ID: 'org',
        NEXT_PUBLIC_L4YERCAK3_BACKEND_URL: 'url',
      };

      const result = EnvGenerator.formatEnvFile(envVars);

      expect(result).toContain('# L4YERCAK3 Configuration');
      expect(result).toContain('# Auto-generated by @l4yercak3/cli');
      expect(result).toContain('# DO NOT commit this file to git');
    });

    it('groups OAuth variables under OAuth section', () => {
      const envVars = {
        L4YERCAK3_API_KEY: 'key',
        L4YERCAK3_BACKEND_URL: 'url',
        L4YERCAK3_ORGANIZATION_ID: 'org',
        NEXT_PUBLIC_L4YERCAK3_BACKEND_URL: 'url',
        GOOGLE_CLIENT_ID: 'google-id',
        GOOGLE_CLIENT_SECRET: 'google-secret',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'secret',
      };

      const result = EnvGenerator.formatEnvFile(envVars);

      expect(result).toContain('# OAuth Configuration');
    });

    it('groups Stripe variables under Stripe section', () => {
      const envVars = {
        L4YERCAK3_API_KEY: 'key',
        L4YERCAK3_BACKEND_URL: 'url',
        L4YERCAK3_ORGANIZATION_ID: 'org',
        NEXT_PUBLIC_L4YERCAK3_BACKEND_URL: 'url',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test',
        STRIPE_SECRET_KEY: 'sk_test',
        STRIPE_WEBHOOK_SECRET: 'whsec_test',
      };

      const result = EnvGenerator.formatEnvFile(envVars);

      expect(result).toContain('# Stripe Configuration');
    });
  });
});
