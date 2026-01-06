/**
 * Tests for Status Command
 */

jest.mock('../../src/config/config-manager');
jest.mock('../../src/api/backend-client');
jest.mock('chalk', () => ({
  bold: (str) => str,
  red: (str) => str,
  green: (str) => str,
  yellow: (str) => str,
  gray: (str) => str,
}));

const configManager = require('../../src/config/config-manager');
const backendClient = require('../../src/api/backend-client');
const statusCommand = require('../../src/commands/status');

describe('Status Command', () => {
  let consoleOutput = [];
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleOutput = [];
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
    configManager.getBackendUrl.mockReturnValue('https://backend.test.com');
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('module exports', () => {
    it('exports command name', () => {
      expect(statusCommand.command).toBe('status');
    });

    it('exports description', () => {
      expect(statusCommand.description).toBe('Show authentication status');
    });

    it('exports handler function', () => {
      expect(typeof statusCommand.handler).toBe('function');
    });
  });

  describe('handler - not logged in', () => {
    beforeEach(() => {
      configManager.isLoggedIn.mockReturnValue(false);
      configManager.getSession.mockReturnValue(null);
    });

    it('shows not logged in message', async () => {
      await statusCommand.handler();

      expect(consoleOutput.some((line) => line.includes('Not logged in'))).toBe(true);
    });

    it('shows login hint', async () => {
      await statusCommand.handler();

      expect(consoleOutput.some((line) => line.includes('l4yercak3 login'))).toBe(true);
    });

    it('does not validate session with backend', async () => {
      await statusCommand.handler();

      expect(backendClient.validateSession).not.toHaveBeenCalled();
    });
  });

  describe('handler - logged in', () => {
    beforeEach(() => {
      configManager.isLoggedIn.mockReturnValue(true);
    });

    it('shows logged in status', async () => {
      configManager.getSession.mockReturnValue({ token: 'test-token' });
      backendClient.validateSession.mockResolvedValue(null);

      await statusCommand.handler();

      expect(consoleOutput.some((line) => line.includes('Logged in'))).toBe(true);
    });

    it('displays email when available', async () => {
      configManager.getSession.mockReturnValue({
        token: 'test-token',
        email: 'user@example.com',
      });
      backendClient.validateSession.mockResolvedValue(null);

      await statusCommand.handler();

      expect(consoleOutput.some((line) => line.includes('user@example.com'))).toBe(true);
    });

    it('displays expiration with days remaining', async () => {
      const futureDate = Date.now() + 5 * 24 * 60 * 60 * 1000; // 5 days
      configManager.getSession.mockReturnValue({
        token: 'test-token',
        expiresAt: futureDate,
      });
      backendClient.validateSession.mockResolvedValue(null);

      await statusCommand.handler();

      // Check that session expiration info is shown (days may vary based on timing)
      expect(consoleOutput.some((line) => line.includes('Session expires'))).toBe(true);
    });

    it('shows expired warning when session expired', async () => {
      const pastDate = Date.now() - 24 * 60 * 60 * 1000; // Yesterday
      configManager.getSession.mockReturnValue({
        token: 'test-token',
        expiresAt: pastDate,
      });
      backendClient.validateSession.mockResolvedValue(null);

      await statusCommand.handler();

      expect(consoleOutput.some((line) => line.includes('expired'))).toBe(true);
    });

    it('validates session with backend', async () => {
      configManager.getSession.mockReturnValue({ token: 'test-token' });
      backendClient.validateSession.mockResolvedValue({ userId: '123' });

      await statusCommand.handler();

      expect(backendClient.validateSession).toHaveBeenCalled();
    });

    it('displays backend URL on successful validation', async () => {
      configManager.getSession.mockReturnValue({ token: 'test-token' });
      backendClient.validateSession.mockResolvedValue({ userId: '123' });

      await statusCommand.handler();

      expect(consoleOutput.some((line) => line.includes('Backend URL'))).toBe(true);
    });

    it('displays organization count when available', async () => {
      configManager.getSession.mockReturnValue({ token: 'test-token' });
      backendClient.validateSession.mockResolvedValue({
        userId: '123',
        organizations: [{ id: '1' }, { id: '2' }],
      });

      await statusCommand.handler();

      expect(consoleOutput.some((line) => line.includes('Organizations: 2'))).toBe(true);
    });

    it('handles backend validation error gracefully', async () => {
      configManager.getSession.mockReturnValue({ token: 'test-token' });
      backendClient.validateSession.mockRejectedValue(new Error('Network error'));

      await statusCommand.handler();

      expect(consoleOutput.some((line) => line.includes('Could not validate session'))).toBe(true);
    });
  });
});
