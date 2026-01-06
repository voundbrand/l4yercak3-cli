/**
 * Tests for OAuth Guide Generator
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

const OAuthGuideGenerator = require('../src/generators/oauth-guide-generator');

describe('OAuthGuideGenerator', () => {
  const mockProjectPath = '/test/project';
  const mockGuidePath = path.join(mockProjectPath, 'OAUTH_SETUP_GUIDE.md');

  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync.mockReturnValue(undefined);
  });

  describe('generate', () => {
    it('creates OAUTH_SETUP_GUIDE.md in project root', () => {
      const options = {
        projectPath: mockProjectPath,
        oauthProviders: ['google'],
        productionDomain: 'example.com',
        appName: 'Test App',
      };

      const result = OAuthGuideGenerator.generate(options);

      expect(result).toBe(mockGuidePath);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockGuidePath,
        expect.any(String),
        'utf8'
      );
    });
  });

  describe('generateGuide', () => {
    describe('header and overview', () => {
      it('includes title and overview', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google'],
          productionDomain: 'example.com',
          appName: 'Test App',
        });

        expect(guide).toContain('# 🔐 OAuth Authentication Setup Guide');
        expect(guide).toContain('## Overview');
        expect(guide).toContain('Estimated Time');
      });

      it('includes checklist for selected providers', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google', 'microsoft', 'github'],
          productionDomain: 'example.com',
          appName: 'Test App',
        });

        expect(guide).toContain('- [ ] Google OAuth setup');
        expect(guide).toContain('- [ ] Microsoft OAuth setup');
        expect(guide).toContain('- [ ] GitHub OAuth setup');
      });

      it('only includes checklist items for selected providers', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google'],
          productionDomain: 'example.com',
          appName: 'Test App',
        });

        expect(guide).toContain('- [ ] Google OAuth setup');
        expect(guide).not.toContain('- [ ] Microsoft OAuth setup');
        expect(guide).not.toContain('- [ ] GitHub OAuth setup');
      });
    });

    describe('Google OAuth section', () => {
      it('includes Google setup instructions', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google'],
          productionDomain: 'example.com',
          appName: 'My App',
        });

        expect(guide).toContain('## 1. Google OAuth Setup');
        expect(guide).toContain('https://console.cloud.google.com/');
        expect(guide).toContain('Google+ API');
        expect(guide).toContain('My App - Frontend');
      });

      it('includes correct redirect URIs', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google'],
          productionDomain: 'myapp.com',
          appName: 'Test',
        });

        expect(guide).toContain('https://myapp.com/api/auth/callback/google');
        expect(guide).toContain('http://localhost:3000/api/auth/callback/google');
      });

      it('uses placeholder when no domain provided', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google'],
          productionDomain: undefined,
          appName: undefined,
        });

        expect(guide).toContain('your-domain.com');
        expect(guide).toContain('Your App');
      });
    });

    describe('Microsoft OAuth section', () => {
      it('includes Microsoft/Azure setup instructions', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['microsoft'],
          productionDomain: 'example.com',
          appName: 'My App',
        });

        expect(guide).toContain('Microsoft Entra ID (Azure AD) Setup');
        expect(guide).toContain('https://portal.azure.com/');
        expect(guide).toContain('Certificates & secrets');
        expect(guide).toContain('AZURE_TENANT_ID');
      });

      it('includes correct redirect URIs', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['microsoft'],
          productionDomain: 'myapp.com',
          appName: 'Test',
        });

        expect(guide).toContain('https://myapp.com/api/auth/callback/azure-ad');
        expect(guide).toContain('http://localhost:3000/api/auth/callback/azure-ad');
      });
    });

    describe('GitHub OAuth section', () => {
      it('includes GitHub setup instructions', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['github'],
          productionDomain: 'example.com',
          appName: 'My App',
        });

        expect(guide).toContain('GitHub OAuth Setup');
        expect(guide).toContain('https://github.com/settings/developers');
        expect(guide).toContain('New OAuth App');
      });

      it('includes correct redirect URIs', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['github'],
          productionDomain: 'myapp.com',
          appName: 'Test',
        });

        expect(guide).toContain('https://myapp.com/api/auth/callback/github');
      });
    });

    describe('section numbering', () => {
      it('numbers sections correctly for single provider', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['github'],
          productionDomain: 'example.com',
          appName: 'Test',
        });

        expect(guide).toContain('## 1. GitHub OAuth Setup');
        expect(guide).toContain('## 2. Update Environment Variables');
        expect(guide).toContain('## 3. Test Your Setup');
      });

      it('numbers sections correctly for all providers', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google', 'microsoft', 'github'],
          productionDomain: 'example.com',
          appName: 'Test',
        });

        expect(guide).toContain('## 1. Google OAuth Setup');
        expect(guide).toContain('## 2. Microsoft Entra ID');
        expect(guide).toContain('## 3. GitHub OAuth Setup');
        expect(guide).toContain('## 4. Update Environment Variables');
        expect(guide).toContain('## 5. Test Your Setup');
      });
    });

    describe('environment variables section', () => {
      it('includes Google env vars', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google'],
          productionDomain: 'example.com',
          appName: 'Test',
        });

        expect(guide).toContain('# Google OAuth');
        expect(guide).toContain('GOOGLE_CLIENT_ID=');
        expect(guide).toContain('GOOGLE_CLIENT_SECRET=');
      });

      it('includes Microsoft env vars', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['microsoft'],
          productionDomain: 'example.com',
          appName: 'Test',
        });

        expect(guide).toContain('# Microsoft OAuth');
        expect(guide).toContain('AZURE_CLIENT_ID=');
        expect(guide).toContain('AZURE_CLIENT_SECRET=');
        expect(guide).toContain('AZURE_TENANT_ID=');
      });

      it('includes GitHub env vars', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['github'],
          productionDomain: 'example.com',
          appName: 'Test',
        });

        expect(guide).toContain('# GitHub OAuth');
        expect(guide).toContain('GITHUB_CLIENT_ID=');
        expect(guide).toContain('GITHUB_CLIENT_SECRET=');
      });

      it('includes security warning', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google'],
          productionDomain: 'example.com',
          appName: 'Test',
        });

        expect(guide).toContain('Never commit `.env.local` to git');
      });
    });

    describe('troubleshooting section', () => {
      it('includes common troubleshooting tips', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google'],
          productionDomain: 'example.com',
          appName: 'Test',
        });

        expect(guide).toContain('## Troubleshooting');
        expect(guide).toContain('Redirect URI Mismatch');
        expect(guide).toContain('Invalid Client Secret');
        expect(guide).toContain('Provider Not Found');
      });
    });

    describe('next steps section', () => {
      it('includes next steps and help link', () => {
        const guide = OAuthGuideGenerator.generateGuide({
          oauthProviders: ['google'],
          productionDomain: 'example.com',
          appName: 'Test',
        });

        expect(guide).toContain('## Next Steps');
        expect(guide).toContain('L4YERCAK3 Documentation');
        expect(guide).toContain('docs.l4yercak3.com');
      });
    });
  });
});
