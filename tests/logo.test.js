/**
 * Tests for Logo Module
 */

const figlet = require('figlet');

jest.mock('chalk', () => {
  const mockChalk = (text) => text;
  mockChalk.hex = () => mockChalk;
  return mockChalk;
});

jest.mock('figlet', () => ({
  textSync: jest.fn().mockReturnValue('MOCK LOGO\nLINE 2\nLINE 3'),
}));

// Spy on console.log
const originalConsoleLog = console.log;
let consoleOutput = [];

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((...args) => {
    consoleOutput.push(args.join(' '));
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

const { showLogo, rainbow } = require('../src/logo');

describe('Logo Module', () => {
  describe('rainbow export', () => {
    it('exports rainbow color array', () => {
      expect(Array.isArray(rainbow)).toBe(true);
      expect(rainbow.length).toBeGreaterThan(0);
    });

    it('contains valid hex colors', () => {
      rainbow.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('showLogo', () => {
    it('calls figlet.textSync with L4YERCAK3', () => {
      showLogo(false);

      expect(figlet.textSync).toHaveBeenCalledWith(
        'L4YERCAK3',
        expect.objectContaining({
          font: '3D-ASCII',
        })
      );
    });

    it('prints logo lines to console', () => {
      showLogo(false);

      // Should have printed the mocked logo lines
      expect(consoleOutput.some((line) => line.includes('MOCK LOGO'))).toBe(true);
    });

    it('shows building metaphor by default', () => {
      showLogo();

      // Should print building metaphor lines
      const output = consoleOutput.join('\n');
      expect(output.length).toBeGreaterThan(100);
    });

    it('hides building metaphor when showBuilding is false', () => {
      showLogo(false);

      // Output should be shorter without building
      const outputWithoutBuilding = consoleOutput.length;

      consoleOutput = [];
      showLogo(true);

      const outputWithBuilding = consoleOutput.length;

      expect(outputWithBuilding).toBeGreaterThan(outputWithoutBuilding);
    });

    it('prints spacing after logo', () => {
      showLogo(false);

      // Last output should be empty (spacing)
      expect(consoleOutput[consoleOutput.length - 1]).toBe('');
    });
  });
});
