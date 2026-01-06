/**
 * Tests for Logout Command
 */

jest.mock('../../src/config/config-manager');
jest.mock('chalk', () => ({
  yellow: (str) => str,
  green: (str) => str,
}));

const configManager = require('../../src/config/config-manager');
const logoutCommand = require('../../src/commands/logout');

describe('Logout Command', () => {
  let consoleOutput = [];
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleOutput = [];
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('module exports', () => {
    it('exports command name', () => {
      expect(logoutCommand.command).toBe('logout');
    });

    it('exports description', () => {
      expect(logoutCommand.description).toBe('Log out from L4YERCAK3 platform');
    });

    it('exports handler function', () => {
      expect(typeof logoutCommand.handler).toBe('function');
    });
  });

  describe('handler', () => {
    it('shows warning when not logged in', async () => {
      configManager.isLoggedIn.mockReturnValue(false);

      await logoutCommand.handler();

      expect(consoleOutput.some((line) => line.includes('not logged in'))).toBe(true);
      expect(configManager.clearSession).not.toHaveBeenCalled();
    });

    it('clears session when logged in', async () => {
      configManager.isLoggedIn.mockReturnValue(true);

      await logoutCommand.handler();

      expect(configManager.clearSession).toHaveBeenCalled();
    });

    it('shows success message after logout', async () => {
      configManager.isLoggedIn.mockReturnValue(true);

      await logoutCommand.handler();

      expect(consoleOutput.some((line) => line.includes('Successfully logged out'))).toBe(true);
    });
  });
});
