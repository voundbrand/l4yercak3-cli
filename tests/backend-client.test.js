/**
 * Tests for Backend Client
 */

jest.mock('node-fetch');
jest.mock('../src/config/config-manager');

const fetch = require('node-fetch');
const configManager = require('../src/config/config-manager');

// Set up mock before requiring BackendClient
configManager.getBackendUrl.mockReturnValue('https://backend.test.com');

// Need to require after mocking
const BackendClient = require('../src/api/backend-client');

// API Base URL for all CLI endpoints (Convex HTTP)
const API_BASE_URL = 'https://aromatic-akita-723.convex.site';
// App URL only for browser login
const APP_URL = 'https://app.l4yercak3.com';

describe('BackendClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configManager.getBackendUrl.mockReturnValue(API_BASE_URL);
    configManager.getSession.mockReturnValue(null);
    // Reset URLs since the module was already instantiated
    BackendClient.baseUrl = API_BASE_URL;
    BackendClient.appUrl = APP_URL;
  });

  describe('getHeaders', () => {
    it('returns Content-Type header when no session', () => {
      configManager.getSession.mockReturnValue(null);

      const headers = BackendClient.getHeaders();

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBeUndefined();
    });

    it('includes Authorization header when session exists', () => {
      configManager.getSession.mockReturnValue({ token: 'test-token-123' });

      const headers = BackendClient.getHeaders();

      expect(headers['Authorization']).toBe('Bearer test-token-123');
    });

    it('does not include Authorization when session has no token', () => {
      configManager.getSession.mockReturnValue({ expiresAt: Date.now() });

      const headers = BackendClient.getHeaders();

      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('request', () => {
    it('makes GET request without body', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.request('GET', '/api/test');

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/test`,
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('makes POST request with body', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      fetch.mockResolvedValue(mockResponse);

      await BackendClient.request('POST', '/api/test', { name: 'test' });

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/test`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      );
    });

    it('makes PUT request with body', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      fetch.mockResolvedValue(mockResponse);

      await BackendClient.request('PUT', '/api/test', { name: 'updated' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'updated' }),
        })
      );
    });

    it('makes PATCH request with body', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      fetch.mockResolvedValue(mockResponse);

      await BackendClient.request('PATCH', '/api/test', { name: 'patched' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'patched' }),
        })
      );
    });

    it('does not include body for DELETE request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ deleted: true }),
      };
      fetch.mockResolvedValue(mockResponse);

      await BackendClient.request('DELETE', '/api/test', { id: '123' });

      const fetchCall = fetch.mock.calls[0][1];
      expect(fetchCall.body).toBeUndefined();
    });

    it('throws error on non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      };
      fetch.mockResolvedValue(mockResponse);

      await expect(BackendClient.request('GET', '/api/test')).rejects.toThrow('Unauthorized');
    });

    it('throws generic error when no message in response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({}),
      };
      fetch.mockResolvedValue(mockResponse);

      await expect(BackendClient.request('GET', '/api/test')).rejects.toThrow('API request failed: 500');
    });

    it('throws network error on fetch failure', async () => {
      fetch.mockRejectedValue(new Error('fetch failed: network error'));

      await expect(BackendClient.request('GET', '/api/test')).rejects.toThrow(
        'Network error: Could not connect to backend'
      );
    });

    it('rethrows non-fetch errors', async () => {
      fetch.mockRejectedValue(new Error('Something else went wrong'));

      await expect(BackendClient.request('GET', '/api/test')).rejects.toThrow(
        'Something else went wrong'
      );
    });
  });

  describe('validateSession', () => {
    it('returns response on success', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true, userId: '123' }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.validateSession();

      expect(result).toEqual({ valid: true, userId: '123' });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/cli/validate'),
        expect.any(Object)
      );
    });

    it('returns null on error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const result = await BackendClient.validateSession();

      expect(result).toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('refreshes and updates session', async () => {
      configManager.getSession.mockReturnValue({ token: 'old-token' });
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          token: 'new-token',
          expiresAt: Date.now() + 3600000,
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.refreshSession();

      expect(result.token).toBe('new-token');
      expect(configManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'new-token' })
      );
    });

    it('throws error when no session exists', async () => {
      configManager.getSession.mockReturnValue(null);

      await expect(BackendClient.refreshSession()).rejects.toThrow('No session to refresh');
    });

    it('throws error when session has no token', async () => {
      configManager.getSession.mockReturnValue({ expiresAt: Date.now() });

      await expect(BackendClient.refreshSession()).rejects.toThrow('No session to refresh');
    });

    it('clears session on refresh failure', async () => {
      configManager.getSession.mockReturnValue({ token: 'old-token' });
      fetch.mockRejectedValue(new Error('Refresh failed'));

      await expect(BackendClient.refreshSession()).rejects.toThrow('Refresh failed');
      expect(configManager.clearSession).toHaveBeenCalled();
    });
  });

  describe('generateState', () => {
    it('generates a 64-character hex string', () => {
      const state = BackendClient.generateState();

      expect(state).toMatch(/^[a-f0-9]{64}$/);
    });

    it('generates unique values each time', () => {
      const state1 = BackendClient.generateState();
      const state2 = BackendClient.generateState();

      expect(state1).not.toBe(state2);
    });
  });

  describe('getLoginUrl', () => {
    it('returns provider selection URL with state when no provider specified', () => {
      const state = 'test-state-token';
      const url = BackendClient.getLoginUrl(state);

      // Login URL uses APP_URL (Next.js), not API_BASE_URL
      expect(url).toContain(APP_URL);
      expect(url).toContain('/auth/cli-login');
      expect(url).toContain('state=test-state-token');
      expect(url).toContain('callback=');
    });

    it('returns direct OAuth URL when provider specified', () => {
      const state = 'test-state-token';
      const url = BackendClient.getLoginUrl(state, 'google');

      expect(url).toContain(APP_URL);
      expect(url).toContain('/api/auth/oauth-signup');
      expect(url).toContain('provider=google');
      expect(url).toContain('sessionType=cli');
      expect(url).toContain('state=test-state-token');
    });

    it('includes encoded callback URL', () => {
      const state = 'test-state-token';
      const url = BackendClient.getLoginUrl(state, 'github');

      expect(url).toContain(encodeURIComponent('http://localhost:3333/callback'));
    });
  });

  describe('generateApiKey', () => {
    it('calls API to generate key', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          key: 'new-api-key',
          id: 'key-123',
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.generateApiKey('org-123', 'My Key', ['read', 'write']);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/cli/api-keys'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            organizationId: 'org-123',
            name: 'My Key',
            scopes: ['read', 'write'],
          }),
        })
      );
      expect(result.key).toBe('new-api-key');
    });

    it('uses default scopes when not provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ key: 'key' }),
      };
      fetch.mockResolvedValue(mockResponse);

      await BackendClient.generateApiKey('org-123', 'My Key');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            organizationId: 'org-123',
            name: 'My Key',
            scopes: ['*'],
          }),
        })
      );
    });
  });

  describe('getOrganizations', () => {
    it('fetches organizations list', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          organizations: [{ id: '1', name: 'Org 1' }],
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.getOrganizations();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/cli/organizations'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.organizations).toHaveLength(1);
    });
  });

  describe('createOrganization', () => {
    it('creates organization with name', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'new-org-123',
          name: 'New Org',
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.createOrganization('New Org');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/cli/organizations'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Org' }),
        })
      );
      expect(result.name).toBe('New Org');
    });
  });

  // ============================================
  // Connected Applications API Tests (Convex HTTP)
  // ============================================

  describe('checkExistingApplication', () => {
    it('returns found=true when application exists', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          found: true,
          application: {
            id: 'app-123',
            name: 'My App',
          },
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.checkExistingApplication('org-123', 'hash123');

      // Should use Convex URL, not main backend
      expect(fetch).toHaveBeenCalledWith(
        'https://aromatic-akita-723.convex.site/api/v1/cli/applications/by-path?organizationId=org-123&hash=hash123',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.found).toBe(true);
      expect(result.application.id).toBe('app-123');
    });

    it('returns found=false when 404', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.checkExistingApplication('org-123', 'hash456');

      expect(result.found).toBe(false);
    });

    it('throws error on non-404 errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' }),
      };
      fetch.mockResolvedValue(mockResponse);

      await expect(BackendClient.checkExistingApplication('org-123', 'hash789'))
        .rejects.toThrow('Server error');
    });
  });

  describe('registerApplication', () => {
    it('registers new application via Convex URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          applicationId: 'app-new-123',
          backendUrl: 'https://api.l4yercak3.com',
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const registrationData = {
        organizationId: 'org-123',
        name: 'My New App',
        source: {
          type: 'cli',
          projectPathHash: 'hash123',
          framework: 'nextjs',
        },
        connection: {
          features: ['crm', 'events'],
        },
      };

      const result = await BackendClient.registerApplication(registrationData);

      // Should use Convex URL, not main backend
      expect(fetch).toHaveBeenCalledWith(
        'https://aromatic-akita-723.convex.site/api/v1/cli/applications',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(registrationData),
        })
      );
      expect(result.applicationId).toBe('app-new-123');
    });
  });

  describe('updateApplication', () => {
    it('updates existing application via Convex URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          applicationId: 'app-123',
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const updates = {
        connection: {
          features: ['crm', 'events', 'invoicing'],
        },
      };

      const result = await BackendClient.updateApplication('app-123', updates);

      expect(fetch).toHaveBeenCalledWith(
        'https://aromatic-akita-723.convex.site/api/v1/cli/applications/app-123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updates),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getApplication', () => {
    it('fetches application details via Convex URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'app-123',
          name: 'My App',
          status: 'active',
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.getApplication('app-123');

      expect(fetch).toHaveBeenCalledWith(
        'https://aromatic-akita-723.convex.site/api/v1/cli/applications/app-123',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.id).toBe('app-123');
      expect(result.status).toBe('active');
    });
  });

  describe('listApplications', () => {
    it('lists applications for organization via Convex URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          applications: [
            { id: 'app-1', name: 'App One' },
            { id: 'app-2', name: 'App Two' },
          ],
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BackendClient.listApplications('org-123');

      expect(fetch).toHaveBeenCalledWith(
        'https://aromatic-akita-723.convex.site/api/v1/cli/applications?organizationId=org-123',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.applications).toHaveLength(2);
    });
  });

  describe('syncApplication', () => {
    it('syncs application data via Convex URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          syncedRecords: 42,
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const syncData = {
        direction: 'bidirectional',
        models: ['contacts', 'organizations'],
      };

      const result = await BackendClient.syncApplication('app-123', syncData);

      expect(fetch).toHaveBeenCalledWith(
        'https://aromatic-akita-723.convex.site/api/v1/cli/applications/app-123/sync',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(syncData),
        })
      );
      expect(result.success).toBe(true);
      expect(result.syncedRecords).toBe(42);
    });
  });
});
