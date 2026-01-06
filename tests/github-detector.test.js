/**
 * Tests for GitHub Detector
 */

const fs = require('fs');
const { execSync } = require('child_process');

jest.mock('fs');
jest.mock('child_process');

const GitHubDetector = require('../src/detectors/github-detector');

describe('GitHubDetector', () => {
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detect', () => {
    it('returns hasGit false when no .git directory exists', () => {
      fs.existsSync.mockReturnValue(false);

      const result = GitHubDetector.detect(mockProjectPath);

      expect(result.hasGit).toBe(false);
      expect(result.isGitHub).toBe(false);
      expect(result.owner).toBeNull();
      expect(result.repo).toBeNull();
    });

    it('returns hasGit true when .git directory exists', () => {
      fs.existsSync.mockReturnValue(true);
      execSync.mockReturnValue('https://github.com/owner/repo.git\n');

      const result = GitHubDetector.detect(mockProjectPath);

      expect(result.hasGit).toBe(true);
    });

    it('parses HTTPS GitHub URL correctly', () => {
      fs.existsSync.mockReturnValue(true);
      execSync
        .mockReturnValueOnce('https://github.com/myorg/myrepo.git\n')
        .mockReturnValueOnce('main\n');

      const result = GitHubDetector.detect(mockProjectPath);

      expect(result.isGitHub).toBe(true);
      expect(result.owner).toBe('myorg');
      expect(result.repo).toBe('myrepo');
      expect(result.url).toBe('https://github.com/myorg/myrepo');
      expect(result.branch).toBe('main');
    });

    it('parses SSH GitHub URL correctly', () => {
      fs.existsSync.mockReturnValue(true);
      execSync
        .mockReturnValueOnce('git@github.com:myorg/myrepo.git\n')
        .mockReturnValueOnce('develop\n');

      const result = GitHubDetector.detect(mockProjectPath);

      expect(result.isGitHub).toBe(true);
      expect(result.owner).toBe('myorg');
      expect(result.repo).toBe('myrepo');
      expect(result.url).toBe('https://github.com/myorg/myrepo');
      expect(result.branch).toBe('develop');
    });

    it('parses GitHub URL without .git extension', () => {
      fs.existsSync.mockReturnValue(true);
      execSync
        .mockReturnValueOnce('https://github.com/owner/repo\n')
        .mockReturnValueOnce('main\n');

      const result = GitHubDetector.detect(mockProjectPath);

      expect(result.isGitHub).toBe(true);
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('returns isGitHub false for non-GitHub remote', () => {
      fs.existsSync.mockReturnValue(true);
      execSync.mockReturnValue('https://gitlab.com/owner/repo.git\n');

      const result = GitHubDetector.detect(mockProjectPath);

      expect(result.hasGit).toBe(true);
      expect(result.isGitHub).toBe(false);
      expect(result.owner).toBeNull();
      expect(result.repo).toBeNull();
    });

    it('handles empty remote URL', () => {
      fs.existsSync.mockReturnValue(true);
      execSync.mockReturnValue('\n');

      const result = GitHubDetector.detect(mockProjectPath);

      expect(result.hasGit).toBe(true);
      expect(result.isGitHub).toBe(false);
    });

    it('handles git command failure gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      execSync.mockImplementation(() => {
        throw new Error('git command failed');
      });

      const result = GitHubDetector.detect(mockProjectPath);

      expect(result.hasGit).toBe(true);
      expect(result.isGitHub).toBe(false);
    });

    it('handles branch detection failure gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      execSync
        .mockReturnValueOnce('https://github.com/owner/repo.git\n')
        .mockImplementationOnce(() => {
          throw new Error('branch command failed');
        });

      const result = GitHubDetector.detect(mockProjectPath);

      expect(result.isGitHub).toBe(true);
      expect(result.owner).toBe('owner');
      expect(result.branch).toBeNull();
    });

    it('uses correct working directory for git commands', () => {
      fs.existsSync.mockReturnValue(true);
      execSync.mockReturnValue('https://github.com/owner/repo.git\n');

      GitHubDetector.detect(mockProjectPath);

      expect(execSync).toHaveBeenCalledWith(
        'git config --get remote.origin.url',
        expect.objectContaining({ cwd: mockProjectPath })
      );
    });
  });
});
