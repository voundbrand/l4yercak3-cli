/**
 * Tests for ConfigManager
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock fs module
jest.mock('fs');

// We need to require after mocking
const ConfigManager = require('../src/config/config-manager');

describe('ConfigManager', () => {
  const mockConfigDir = path.join(os.homedir(), '.l4yercak3');
  const mockConfigFile = path.join(mockConfigDir, 'config.json');

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: config directory exists
    fs.existsSync.mockImplementation((p) => {
      if (p === mockConfigDir) return true;
      if (p === mockConfigFile) return false;
      return false;
    });
  });

  describe('getConfig', () => {
    it('returns default config when no config file exists', () => {
      fs.existsSync.mockReturnValue(false);

      const config = ConfigManager.getConfig();

      expect(config).toEqual({
        session: null,
        organizations: [],
        settings: {
          backendUrl: 'https://aromatic-akita-723.convex.site',
        },
      });
    });

    it('reads and parses existing config file', () => {
      const mockConfig = {
        session: { token: 'test-token' },
        organizations: [{ id: '1', name: 'Test Org' }],
        settings: { backendUrl: 'https://custom.url' },
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const config = ConfigManager.getConfig();

      expect(config).toEqual(mockConfig);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigFile, 'utf8');
    });

    it('returns default config on parse error', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const config = ConfigManager.getConfig();

      expect(config).toEqual({
        session: null,
        organizations: [],
        settings: {},
      });

      consoleSpy.mockRestore();
    });
  });

  describe('saveConfig', () => {
    it('creates config directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockReturnValue(undefined);
      fs.writeFileSync.mockReturnValue(undefined);

      ConfigManager.saveConfig({ test: true });

      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, {
        recursive: true,
        mode: 0o700,
      });
    });

    it('writes config with secure permissions', () => {
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockReturnValue(undefined);

      const config = { session: { token: 'test' } };
      const result = ConfigManager.saveConfig(config);

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify(config, null, 2),
        { mode: 0o600 }
      );
    });

    it('returns false on write error', () => {
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = ConfigManager.saveConfig({ test: true });

      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('session management', () => {
    it('getSession returns null when no session exists', () => {
      fs.existsSync.mockImplementation((p) => p === mockConfigDir);

      const session = ConfigManager.getSession();

      expect(session).toBeNull();
    });

    it('saveSession updates session in config', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: null,
        organizations: [],
        settings: {},
      }));
      fs.writeFileSync.mockReturnValue(undefined);

      const session = { token: 'new-token', expiresAt: Date.now() + 3600000 };
      ConfigManager.saveSession(session);

      expect(fs.writeFileSync).toHaveBeenCalled();
      const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(savedConfig.session).toEqual(session);
    });

    it('clearSession removes session from config', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: { token: 'existing' },
        organizations: [],
        settings: {},
      }));
      fs.writeFileSync.mockReturnValue(undefined);

      ConfigManager.clearSession();

      const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(savedConfig.session).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('returns false when no session', () => {
      fs.existsSync.mockImplementation((p) => p === mockConfigDir);

      expect(ConfigManager.isLoggedIn()).toBe(false);
    });

    it('returns false when session expired', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: {
          token: 'test-token',
          expiresAt: Date.now() - 1000, // Expired
        },
        organizations: [],
        settings: {},
      }));

      expect(ConfigManager.isLoggedIn()).toBe(false);
    });

    it('returns true when session valid', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: {
          token: 'test-token',
          expiresAt: Date.now() + 3600000, // Valid for 1 hour
        },
        organizations: [],
        settings: {},
      }));

      expect(ConfigManager.isLoggedIn()).toBe(true);
    });
  });

  describe('getBackendUrl', () => {
    it('returns default URL when not configured', () => {
      fs.existsSync.mockImplementation((p) => p === mockConfigDir);

      const url = ConfigManager.getBackendUrl();

      expect(url).toBe('https://aromatic-akita-723.convex.site');
    });

    it('returns configured URL from settings', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: null,
        organizations: [],
        settings: { backendUrl: 'https://custom.backend.com' },
      }));

      const url = ConfigManager.getBackendUrl();

      expect(url).toBe('https://custom.backend.com');
    });
  });

  describe('organization management', () => {
    it('addOrganization adds new organization', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: null,
        organizations: [],
        settings: {},
      }));
      fs.writeFileSync.mockReturnValue(undefined);

      const org = { id: '123', name: 'New Org' };
      ConfigManager.addOrganization(org);

      const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(savedConfig.organizations).toContainEqual(org);
    });

    it('addOrganization replaces existing organization with same id', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: null,
        organizations: [{ id: '123', name: 'Old Name' }],
        settings: {},
      }));
      fs.writeFileSync.mockReturnValue(undefined);

      const org = { id: '123', name: 'New Name' };
      ConfigManager.addOrganization(org);

      const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(savedConfig.organizations).toHaveLength(1);
      expect(savedConfig.organizations[0].name).toBe('New Name');
    });

    it('getOrganizations returns empty array when none exist', () => {
      fs.existsSync.mockImplementation((p) => p === mockConfigDir);

      const orgs = ConfigManager.getOrganizations();

      expect(orgs).toEqual([]);
    });
  });

  describe('project configuration', () => {
    it('saveProjectConfig stores project config by path', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: null,
        organizations: [],
        settings: {},
      }));
      fs.writeFileSync.mockReturnValue(undefined);

      const projectPath = '/path/to/project';
      const projectConfig = { apiKey: 'key123', features: ['crm'] };
      ConfigManager.saveProjectConfig(projectPath, projectConfig);

      const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      const normalizedPath = path.resolve(projectPath);
      expect(savedConfig.projects[normalizedPath]).toMatchObject(projectConfig);
      expect(savedConfig.projects[normalizedPath].updatedAt).toBeDefined();
    });

    it('getProjectConfig returns null when project not found', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: null,
        organizations: [],
        settings: {},
        projects: {},
      }));

      const config = ConfigManager.getProjectConfig('/nonexistent/path');

      expect(config).toBeNull();
    });

    it('getProjectConfig returns config for existing project', () => {
      const projectPath = '/path/to/project';
      const normalizedPath = path.resolve(projectPath);
      const projectConfig = { apiKey: 'key123' };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        session: null,
        organizations: [],
        settings: {},
        projects: {
          [normalizedPath]: projectConfig,
        },
      }));

      const config = ConfigManager.getProjectConfig(projectPath);

      expect(config).toEqual(projectConfig);
    });
  });
});
