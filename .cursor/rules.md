# L4YERCAK3 CLI Tool - Development Rules

This document defines the coding standards, quality checks, and development practices for the L4YERCAK3 CLI tool.

## Quality Assurance Checklist

Every code change must pass these checks before being considered complete:

### 1. Type Checking ✅
- **Command**: `npm run type-check`
- **Requirement**: All TypeScript/JavaScript code must pass type checking
- **Action**: Fix all type errors before committing

### 2. Linting ✅
- **Command**: `npm run lint`
- **Requirement**: Code must pass ESLint without errors
- **Action**: Fix all linting errors or disable rules with justification

### 3. Production Build ✅
- **Command**: `npm run build`
- **Requirement**: Package must build successfully for production
- **Action**: Ensure all dependencies are properly declared

### 4. Testing ✅
- **Command**: `npm test`
- **Requirement**: All tests must pass
- **Action**: Add tests for new features, fix failing tests

## Development Workflow

### Before Committing
1. Run `npm run verify` (runs all checks)
2. Ensure all checks pass
3. Review changes
4. Commit with descriptive message

### After Major Changes
1. Run full verification suite
2. Test CLI locally with `npm link`
3. Test with example projects
4. Update documentation if needed

## Code Standards

### JavaScript/Node.js
- Use CommonJS (require/module.exports) for compatibility
- Follow Node.js best practices
- Use async/await for asynchronous operations
- Handle errors properly with try/catch

### File Structure
- Keep files modular and focused
- Use descriptive file names
- Group related functionality together
- Document complex logic

### Error Handling
- Always handle errors gracefully
- Provide helpful error messages
- Log errors appropriately
- Don't expose sensitive information

### Code Style
- Use consistent indentation (2 spaces)
- Use meaningful variable names
- Keep functions small and focused
- Add comments for complex logic

## Architecture Principles

### Modularity
- Keep commands separate from generators
- Separate concerns (detection, generation, configuration)
- Make code reusable across commands

### User Experience
- Provide clear, helpful error messages
- Show progress indicators for long operations
- Use colors and formatting for better readability
- Guide users through setup process

### Maintainability
- Write self-documenting code
- Add JSDoc comments for public APIs
- Keep dependencies minimal
- Update dependencies regularly

## Dependencies

### Current Dependencies
- `chalk@^4.1.2` - Terminal colors (v4 for CommonJS compatibility)
- `figlet@^1.7.0` - ASCII art generation

### Adding New Dependencies
- Prefer lightweight, well-maintained packages
- Check bundle size impact
- Ensure CommonJS compatibility
- Document why dependency is needed

## Testing Strategy

### Unit Tests
- Test individual functions
- Mock external dependencies
- Test error cases
- Test edge cases

### Integration Tests
- Test CLI commands end-to-end
- Test with real project structures
- Test error scenarios
- Test with different Node.js versions

## Documentation

### Code Documentation
- Add JSDoc comments for all public functions
- Document complex algorithms
- Explain non-obvious code

### User Documentation
- Keep README.md up to date
- Document all commands
- Provide examples
- Include troubleshooting section

## Version Management

### Semantic Versioning
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Before Publishing
1. Update version in package.json
2. Update CHANGELOG.md
3. Run full test suite
4. Test installation via npm

## Security

### Sensitive Data
- Never commit API keys or secrets
- Use environment variables for configuration
- Validate user input
- Sanitize file paths

### Dependencies
- Keep dependencies up to date
- Check for security vulnerabilities: `npm audit`
- Review dependency changes

## Performance

### CLI Performance
- Minimize startup time
- Use lazy loading where appropriate
- Cache expensive operations
- Optimize file I/O

## Compatibility

### Node.js Versions
- Support Node.js 14+ (as specified in package.json)
- Test on multiple Node.js versions
- Use features available in minimum version

### Operating Systems
- Test on macOS, Linux, Windows
- Handle path differences
- Test file permissions

## Git Workflow

### Commit Messages
- Use descriptive commit messages
- Reference issues when applicable
- Keep commits focused and atomic

### Branching
- Use feature branches for new features
- Keep main branch stable
- Use descriptive branch names

## Continuous Improvement

### Code Review
- Review all changes before merging
- Look for potential bugs
- Suggest improvements
- Ensure standards are followed

### Refactoring
- Refactor when code becomes complex
- Improve based on usage patterns
- Keep code maintainable
- Don't refactor working code unnecessarily

---

**Remember**: Quality over speed. Take time to write clean, maintainable code that others (and future you) will appreciate.

