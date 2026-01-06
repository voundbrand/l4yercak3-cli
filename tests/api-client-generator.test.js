/**
 * Tests for API Client Generator
 */

const fs = require('fs');
const path = require('path');

jest.mock('fs');

const ApiClientGenerator = require('../src/generators/api-client-generator');

describe('ApiClientGenerator', () => {
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockReturnValue(undefined);
    fs.writeFileSync.mockReturnValue(undefined);
  });

  describe('generate', () => {
    it('creates api-client.js in lib folder when no src exists', () => {
      fs.existsSync.mockReturnValue(false);

      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        isTypeScript: false,
      };

      const result = ApiClientGenerator.generate(options);

      expect(result).toBe(path.join(mockProjectPath, 'lib', 'api-client.js'));
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'lib'),
        { recursive: true }
      );
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('creates api-client.ts in src/lib folder when src exists', () => {
      fs.existsSync.mockImplementation((p) =>
        p === path.join(mockProjectPath, 'src')
      );

      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        isTypeScript: true,
      };

      const result = ApiClientGenerator.generate(options);

      expect(result).toBe(path.join(mockProjectPath, 'src', 'lib', 'api-client.ts'));
    });

    it('does not create lib dir if it exists', () => {
      fs.existsSync.mockReturnValue(true);

      const options = {
        projectPath: mockProjectPath,
        apiKey: 'test-api-key',
        backendUrl: 'https://backend.test.com',
        organizationId: 'org-123',
        isTypeScript: false,
      };

      ApiClientGenerator.generate(options);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('generateCode', () => {
    it('generates JavaScript code without type annotations', () => {
      const code = ApiClientGenerator.generateCode({
        apiKey: 'my-api-key',
        backendUrl: 'https://api.example.com',
        organizationId: 'org-456',
        isTypeScript: false,
      });

      expect(code).toContain('L4YERCAK3 API Client');
      expect(code).toContain("apiKey = 'my-api-key'");
      expect(code).toContain("baseUrl = 'https://api.example.com'");
      expect(code).toContain("this.organizationId = 'org-456'");
      expect(code).toContain('module.exports = L4YERCAK3Client;');
      expect(code).not.toContain(': string');
      expect(code).not.toContain(': Promise<any>');
    });

    it('generates TypeScript code with type annotations', () => {
      const code = ApiClientGenerator.generateCode({
        apiKey: 'my-api-key',
        backendUrl: 'https://api.example.com',
        organizationId: 'org-456',
        isTypeScript: true,
      });

      expect(code).toContain(': string');
      expect(code).toContain(': Promise<any>');
      expect(code).toContain(': RequestInit');
      expect(code).toContain('export default L4YERCAK3Client;');
    });

    it('includes CRM methods', () => {
      const code = ApiClientGenerator.generateCode({
        apiKey: 'key',
        backendUrl: 'url',
        organizationId: 'org',
        isTypeScript: false,
      });

      expect(code).toContain('getContacts()');
      expect(code).toContain('getContact(contactId');
      expect(code).toContain('createContact(data');
      expect(code).toContain('updateContact(contactId');
      expect(code).toContain('deleteContact(contactId');
    });

    it('includes Projects methods', () => {
      const code = ApiClientGenerator.generateCode({
        apiKey: 'key',
        backendUrl: 'url',
        organizationId: 'org',
        isTypeScript: false,
      });

      expect(code).toContain('getProjects()');
      expect(code).toContain('getProject(projectId');
      expect(code).toContain('createProject(data');
      expect(code).toContain('updateProject(projectId');
      expect(code).toContain('deleteProject(projectId');
    });

    it('includes Invoices methods', () => {
      const code = ApiClientGenerator.generateCode({
        apiKey: 'key',
        backendUrl: 'url',
        organizationId: 'org',
        isTypeScript: false,
      });

      expect(code).toContain('getInvoices()');
      expect(code).toContain('getInvoice(invoiceId');
      expect(code).toContain('createInvoice(data');
      expect(code).toContain('updateInvoice(invoiceId');
      expect(code).toContain('deleteInvoice(invoiceId');
    });

    it('includes request method with proper headers', () => {
      const code = ApiClientGenerator.generateCode({
        apiKey: 'key',
        backendUrl: 'url',
        organizationId: 'org',
        isTypeScript: false,
      });

      expect(code).toContain("'Content-Type': 'application/json'");
      expect(code).toContain('Authorization');
      expect(code).toContain('X-Organization-Id');
    });
  });
});
