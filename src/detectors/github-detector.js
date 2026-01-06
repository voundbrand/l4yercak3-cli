/**
 * GitHub Repository Detector
 * Detects GitHub repository information from git remotes
 */

const { execSync } = require('child_process');
const path = require('path');

class GitHubDetector {
  /**
   * Detect GitHub repository information
   */
  detect(projectPath = process.cwd()) {
    const results = {
      hasGit: false,
      isGitHub: false,
      owner: null,
      repo: null,
      url: null,
      branch: null,
    };

    // Check if .git directory exists
    const gitDir = path.join(projectPath, '.git');
    if (!require('fs').existsSync(gitDir)) {
      return results;
    }

    results.hasGit = true;

    try {
      // Get git remote URL
      const remoteUrl = execSync('git config --get remote.origin.url', {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      if (!remoteUrl) {
        return results;
      }

      // Parse GitHub URL (supports both HTTPS and SSH formats)
      // https://github.com/owner/repo.git
      // git@github.com:owner/repo.git
      const githubMatch = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
      
      if (githubMatch) {
        results.isGitHub = true;
        results.owner = githubMatch[1];
        results.repo = githubMatch[2].replace(/\.git$/, '');
        results.url = `https://github.com/${results.owner}/${results.repo}`;
      }

      // Get current branch
      try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: projectPath,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();
        results.branch = branch;
      } catch (error) {
        // Couldn't get branch
      }
    } catch (error) {
      // Error reading git config
    }

    return results;
  }
}

module.exports = new GitHubDetector();
