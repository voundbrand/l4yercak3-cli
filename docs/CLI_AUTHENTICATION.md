# CLI Authentication Design

## Overview

The CLI follows the **GitHub CLI (`gh`)** authentication pattern - users must authenticate before using the CLI. This ensures security and proper access control.

## Authentication Flow

### 1. User Runs Login Command

```bash
$ l4yercak3 login
```

### 2. Browser-Based OAuth Flow

1. CLI opens browser to: `https://platform.l4yercak3.com/auth/cli-login`
2. User authenticates with platform (Google/Microsoft/GitHub)
3. User may need to complete 2FA if enabled
4. Platform generates CLI session token
5. Browser redirects to: `l4yercak3://auth/callback?token=...`
6. CLI receives token via local server or deep link

### 3. Store Session Securely

CLI stores session token in:
- **macOS/Linux:** `~/.l4yercak3/config.json`
- **Windows:** `%APPDATA%/.l4yercak3/config.json`

```json
{
  "session": {
    "token": "cli_session_abc123...",
    "expiresAt": 1234567890,
    "userId": "user_123",
    "email": "user@example.com"
  },
  "organizations": [
    {
      "id": "org_123",
      "name": "My Organization",
      "apiKey": "sk_live_..."
    }
  ]
}
```

### 4. Use Session for API Calls

All CLI commands use the stored session token:
- Validate session before each command
- Refresh token if expired
- Prompt re-login if session invalid

## Commands

### Login

```bash
$ l4yercak3 login
```

**Flow:**
1. Opens browser for OAuth
2. User authenticates
3. Stores session token
4. Confirms login success

### Logout

```bash
$ l4yercak3 logout
```

**Flow:**
1. Removes session token
2. Clears stored credentials
3. Confirms logout

### Status

```bash
$ l4yercak3 auth status
```

**Shows:**
- Logged in: Yes/No
- User email
- Session expiration
- Organizations accessible

## Security Considerations

### Session Tokens

- **Format:** `cli_session_{random_32_bytes}`
- **Expiration:** 30 days (configurable)
- **Storage:** Encrypted at rest (OS keychain on macOS)
- **Scope:** Limited to CLI operations

### Token Refresh

- Automatically refresh before expiration
- Prompt re-login if refresh fails
- Handle 2FA gracefully

### 2FA Support

- If user has 2FA enabled, require it during login
- Store 2FA status in session
- Re-prompt if session expires

## Backend Requirements

### OAuth Endpoints Needed

1. **CLI Login Initiation**
   - `GET /auth/cli-login`
   - Redirects to OAuth provider
   - Sets up callback URL: `l4yercak3://auth/callback`

2. **CLI Callback Handler**
   - `GET /auth/cli/callback`
   - Receives OAuth code
   - Exchanges for CLI session token
   - Redirects to: `l4yercak3://auth/callback?token=...`

3. **Session Validation**
   - `GET /auth/cli/validate`
   - Validates CLI session token
   - Returns user info and organizations

4. **Session Refresh**
   - `POST /auth/cli/refresh`
   - Refreshes expired session
   - Returns new token

### Session Storage

Backend stores CLI sessions in:
- `cli_sessions` table (or similar)
- Fields: `token`, `userId`, `expiresAt`, `createdAt`, `lastUsedAt`
- Auto-cleanup expired sessions

## Implementation Phases

### Phase 0: Basic Authentication

- [ ] CLI login command
- [ ] Browser OAuth flow
- [ ] Session token storage
- [ ] Session validation

### Phase 1: Session Management

- [ ] Token refresh
- [ ] Auto-logout on expiration
- [ ] Status command

### Phase 2: Security Enhancements

- [ ] 2FA support
- [ ] OS keychain integration (macOS)
- [ ] Encrypted storage
- [ ] Session revocation

## Example Usage

```bash
# First time user
$ l4yercak3 login
Opening browser for authentication...
✓ Successfully logged in as user@example.com

# Check status
$ l4yercak3 auth status
Logged in as: user@example.com
Session expires: 2025-02-14
Organizations: 2

# Use CLI commands (session automatically used)
$ l4yercak3 spread
✓ Using organization: My Organization
✓ Generating boilerplate...

# Logout
$ l4yercak3 logout
✓ Logged out successfully
```

## Comparison to GitHub CLI

| Feature | GitHub CLI (`gh`) | L4YERCAK3 CLI |
|---------|------------------|---------------|
| Login Command | `gh auth login` | `l4yercak3 login` |
| Browser OAuth | ✅ | ✅ |
| 2FA Support | ✅ | ✅ |
| Session Storage | `~/.config/gh/` | `~/.l4yercak3/` |
| Token Format | `gho_...` | `cli_session_...` |
| Auto Refresh | ✅ | ✅ |

## Benefits

1. **Security:** Users authenticate securely with 2FA
2. **Familiar:** Follows industry standard (GitHub CLI pattern)
3. **Flexible:** Can create multiple orgs after login
4. **Auditable:** All actions tied to authenticated user
5. **Revocable:** Sessions can be revoked from platform UI

---

**Status:** Design Phase  
**Next:** Implement Phase 0 authentication flow

