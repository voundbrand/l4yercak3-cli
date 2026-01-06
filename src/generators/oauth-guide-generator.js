/**
 * OAuth Setup Guide Generator
 * Generates OAuth setup guide markdown file
 */

const fs = require('fs');
const path = require('path');

class OAuthGuideGenerator {
  /**
   * Generate OAuth setup guide
   */
  generate(options) {
    const {
      projectPath,
      oauthProviders,
      productionDomain,
      appName,
    } = options;

    const guidePath = path.join(projectPath, 'OAUTH_SETUP_GUIDE.md');
    const content = this.generateGuide({
      oauthProviders,
      productionDomain,
      appName,
    });

    fs.writeFileSync(guidePath, content, 'utf8');
    return guidePath;
  }

  /**
   * Generate guide content
   */
  generateGuide({ oauthProviders, productionDomain, appName }) {
    const hasGoogle = oauthProviders.includes('google');
    const hasMicrosoft = oauthProviders.includes('microsoft');
    const hasGitHub = oauthProviders.includes('github');

    let content = `# 🔐 OAuth Authentication Setup Guide

## Overview

This guide will walk you through setting up OAuth authentication for your frontend application. You'll need to create OAuth apps with each provider and add the credentials to your \`.env.local\` file.

**Estimated Time:** 15-20 minutes per provider

---

## ✅ Setup Checklist

`;

    if (hasGoogle) content += `- [ ] Google OAuth setup\n`;
    if (hasMicrosoft) content += `- [ ] Microsoft OAuth setup\n`;
    if (hasGitHub) content += `- [ ] GitHub OAuth setup\n`;

    content += `\n---\n\n`;

    // Google OAuth section
    if (hasGoogle) {
      content += `## 1. Google OAuth Setup

### Step 1: Go to Google Cloud Console

1. Navigate to: https://console.cloud.google.com/
2. Select your project or create a new one

### Step 2: Enable Google+ API

1. Go to "APIs & Services" → "Enable APIs and Services"
2. Search for "Google+ API" and enable it

### Step 3: Create OAuth Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: \`${appName || 'Your App'} - Frontend\`

### Step 4: Configure Redirect URIs

Add these redirect URIs:

**Production:**
\`\`\`
https://${productionDomain || 'your-domain.com'}/api/auth/callback/google
\`\`\`

**Development:**
\`\`\`
http://localhost:3000/api/auth/callback/google
\`\`\`

### Step 5: Save Credentials

1. Copy the **Client ID** and **Client Secret**
2. Add them to your \`.env.local\` file (see below)

---

`;
    }

    // Microsoft OAuth section
    if (hasMicrosoft) {
      content += `## ${hasGoogle ? '2' : '1'}. Microsoft Entra ID (Azure AD) Setup

### Step 1: Go to Azure Portal

1. Navigate to: https://portal.azure.com/
2. Go to "Microsoft Entra ID" (formerly Azure AD)

### Step 2: Register Application

1. Go to "App registrations" → "New registration"
2. Name: \`${appName || 'Your App'} - Frontend\`
3. Supported account types: Choose based on your needs
4. Redirect URI: **Web**

### Step 3: Configure Redirect URIs

Add these redirect URIs:

**Production:**
\`\`\`
https://${productionDomain || 'your-domain.com'}/api/auth/callback/azure-ad
\`\`\`

**Development:**
\`\`\`
http://localhost:3000/api/auth/callback/azure-ad
\`\`\`

### Step 4: Create Client Secret

1. Go to "Certificates & secrets" → "New client secret"
2. Description: \`Frontend OAuth Secret\`
3. Expires: Choose expiration (recommend 24 months)
4. Copy the **Value** (not the Secret ID) - you won't see it again!

### Step 5: Save Credentials

1. Copy the **Application (client) ID**, **Directory (tenant) ID**, and **Client Secret Value**
2. Add them to your \`.env.local\` file (see below)

---

`;
    }

    // GitHub OAuth section
    if (hasGitHub) {
      const sectionNum = (hasGoogle ? 1 : 0) + (hasMicrosoft ? 1 : 0) + 1;
      content += `## ${sectionNum}. GitHub OAuth Setup

### Step 1: Go to GitHub Developer Settings

1. Navigate to: https://github.com/settings/developers
2. Click "New OAuth App"

### Step 2: Create OAuth App

1. **Application name:** \`${appName || 'Your App'} - Frontend\`
2. **Homepage URL:** \`https://${productionDomain || 'your-domain.com'}\`
3. **Authorization callback URL:**
   \`\`\`
   https://${productionDomain || 'your-domain.com'}/api/auth/callback/github
   \`\`\`

### Step 3: Save Credentials

1. Copy the **Client ID**
2. Click "Generate a new client secret"
3. Copy the **Client Secret** (you won't see it again!)
4. Add them to your \`.env.local\` file (see below)

---

`;
    }

    content += `## ${(hasGoogle ? 1 : 0) + (hasMicrosoft ? 1 : 0) + (hasGitHub ? 1 : 0) + 1}. Update Environment Variables

Add these to your \`.env.local\` file:

\`\`\`bash
`;

    if (hasGoogle) {
      content += `# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

`;
    }

    if (hasMicrosoft) {
      content += `# Microsoft OAuth
AZURE_CLIENT_ID=your_azure_client_id_here
AZURE_CLIENT_SECRET=your_azure_client_secret_value_here
AZURE_TENANT_ID=your_azure_tenant_id_here

`;
    }

    if (hasGitHub) {
      content += `# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

`;
    }

    content += `\`\`\`

**⚠️ Important:** Never commit \`.env.local\` to git! It's already in \`.gitignore\`.

---

## ${(hasGoogle ? 1 : 0) + (hasMicrosoft ? 1 : 0) + (hasGitHub ? 1 : 0) + 2}. Test Your Setup

1. Start your development server: \`npm run dev\`
2. Navigate to: \`http://localhost:3000/auth/signin\`
3. Try signing in with each provider
4. Verify that users are created in your backend

---

## Troubleshooting

### Redirect URI Mismatch

**Error:** "Redirect URI mismatch"

**Solution:** Make sure the redirect URI in your OAuth app matches exactly:
- Check for trailing slashes
- Check http vs https
- Check localhost vs 127.0.0.1

### Invalid Client Secret

**Error:** "Invalid client secret"

**Solution:** 
- Make sure you copied the **Value** (not Secret ID) for Azure
- Regenerate the secret if needed
- Restart your dev server after updating \`.env.local\`

### Provider Not Found

**Error:** "Provider not found"

**Solution:**
- Check that the provider is configured in \`app/api/auth/[...nextauth]/route.ts\` (or \`pages/api/auth/[...nextauth].ts\`)
- Verify environment variables are set correctly

---

## Next Steps

Once OAuth is set up:
1. ✅ Users can sign in with their Google/Microsoft/GitHub accounts
2. ✅ User accounts are automatically created in your backend
3. ✅ Users are linked to CRM contacts
4. ✅ You can use protected routes and API calls

---

**Need Help?** Check the [L4YERCAK3 Documentation](https://docs.l4yercak3.com) or contact support.
`;

    return content;
  }
}

module.exports = new OAuthGuideGenerator();
