/**
 * Tests for NextAuth Generator
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

const NextAuthGenerator = require('../src/generators/nextauth-generator');

describe('NextAuthGenerator', () => {
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockReturnValue(undefined);
    fs.writeFileSync.mockReturnValue(undefined);
  });

  describe('generate', () => {
    it('creates route.js in app/api/auth/[...nextauth] for App Router', () => {
      const options = {
        projectPath: mockProjectPath,
        backendUrl: 'https://backend.test.com',
        oauthProviders: ['google'],
        routerType: 'app',
        isTypeScript: false,
      };

      const result = NextAuthGenerator.generate(options);

      expect(result).toBe(
        path.join(mockProjectPath, 'app', 'api', 'auth', '[...nextauth]', 'route.js')
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'app', 'api', 'auth'),
        { recursive: true }
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'app', 'api', 'auth', '[...nextauth]'),
        { recursive: true }
      );
    });

    it('creates [...nextauth].ts in pages/api/auth for Pages Router', () => {
      const options = {
        projectPath: mockProjectPath,
        backendUrl: 'https://backend.test.com',
        oauthProviders: ['google'],
        routerType: 'pages',
        isTypeScript: true,
      };

      const result = NextAuthGenerator.generate(options);

      expect(result).toBe(
        path.join(mockProjectPath, 'pages', 'api', 'auth', '[...nextauth].ts')
      );
    });

    it('does not create [...nextauth] dir for Pages Router', () => {
      const options = {
        projectPath: mockProjectPath,
        backendUrl: 'https://backend.test.com',
        oauthProviders: ['google'],
        routerType: 'pages',
        isTypeScript: false,
      };

      NextAuthGenerator.generate(options);

      // Should only create pages/api/auth, not [...nextauth] dir
      const mkdirCalls = fs.mkdirSync.mock.calls.map((c) => c[0]);
      expect(mkdirCalls).not.toContain(
        path.join(mockProjectPath, 'pages', 'api', 'auth', '[...nextauth]')
      );
    });
  });

  describe('generateCode', () => {
    describe('Google provider', () => {
      it('includes Google provider import and config', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['google'],
          routerType: 'app',
          isTypeScript: false,
        });

        expect(code).toContain("import GoogleProvider from 'next-auth/providers/google'");
        expect(code).toContain('GoogleProvider({');
        expect(code).toContain('process.env.GOOGLE_CLIENT_ID');
        expect(code).toContain('process.env.GOOGLE_CLIENT_SECRET');
      });
    });

    describe('Microsoft provider', () => {
      it('includes Azure AD provider import and config', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['microsoft'],
          routerType: 'app',
          isTypeScript: false,
        });

        expect(code).toContain("import AzureADProvider from 'next-auth/providers/azure-ad'");
        expect(code).toContain('AzureADProvider({');
        expect(code).toContain('process.env.AZURE_CLIENT_ID');
        expect(code).toContain('process.env.AZURE_CLIENT_SECRET');
        expect(code).toContain('process.env.AZURE_TENANT_ID');
      });
    });

    describe('GitHub provider', () => {
      it('includes GitHub provider import and config', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['github'],
          routerType: 'app',
          isTypeScript: false,
        });

        expect(code).toContain("import GitHubProvider from 'next-auth/providers/github'");
        expect(code).toContain('GitHubProvider({');
        expect(code).toContain('process.env.GITHUB_CLIENT_ID');
        expect(code).toContain('process.env.GITHUB_CLIENT_SECRET');
      });
    });

    describe('multiple providers', () => {
      it('includes all selected providers', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['google', 'microsoft', 'github'],
          routerType: 'app',
          isTypeScript: false,
        });

        expect(code).toContain('GoogleProvider');
        expect(code).toContain('AzureADProvider');
        expect(code).toContain('GitHubProvider');
      });
    });

    describe('App Router format', () => {
      it('uses route handler exports', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['google'],
          routerType: 'app',
          isTypeScript: false,
        });

        expect(code).toContain('export { handler as GET, handler as POST }');
        expect(code).toContain('const handler = NextAuth(authOptions)');
        expect(code).toContain("import type { NextAuthOptions } from 'next-auth'");
      });
    });

    describe('Pages Router format', () => {
      it('uses default export', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['google'],
          routerType: 'pages',
          isTypeScript: false,
        });

        expect(code).toContain('export default NextAuth({');
        expect(code).not.toContain('export { handler as GET');
      });
    });

    describe('TypeScript support', () => {
      it('adds non-null assertions for TypeScript', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['google'],
          routerType: 'app',
          isTypeScript: true,
        });

        expect(code).toContain('process.env.GOOGLE_CLIENT_ID!');
        expect(code).toContain('process.env.GOOGLE_CLIENT_SECRET!');
      });

      it('omits non-null assertions for JavaScript', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['google'],
          routerType: 'app',
          isTypeScript: false,
        });

        expect(code).not.toContain('GOOGLE_CLIENT_ID!');
        expect(code).not.toContain('GOOGLE_CLIENT_SECRET!');
      });
    });

    describe('callbacks', () => {
      it('includes signIn callback with backend sync', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['google'],
          routerType: 'app',
          isTypeScript: false,
        });

        expect(code).toContain('async signIn({ user, account, profile })');
        expect(code).toContain('/api/v1/auth/sync-user');
        expect(code).toContain('NEXT_PUBLIC_L4YERCAK3_BACKEND_URL');
        expect(code).toContain('L4YERCAK3_API_KEY');
      });

      it('includes session callback', () => {
        const code = NextAuthGenerator.generateCode({
          oauthProviders: ['google'],
          routerType: 'app',
          isTypeScript: false,
        });

        expect(code).toContain('async session({ session, user');
        expect(code).toContain('session.user.id');
        expect(code).toContain('session.user.organizationId');
      });
    });

    it('includes custom signin page', () => {
      const code = NextAuthGenerator.generateCode({
        oauthProviders: ['google'],
        routerType: 'app',
        isTypeScript: false,
      });

      expect(code).toContain("signIn: '/auth/signin'");
    });
  });
});
