/**
 * MCP Guide Generator
 * Generates MCP configuration and guide for AI-powered development
 */

const fs = require('fs');
const path = require('path');
const { ensureDir, writeFileWithBackup, checkFileOverwrite } = require('../utils/file-utils');

class McpGuideGenerator {
  /**
   * Generate MCP configuration and guide files
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated file paths
   */
  async generate(options) {
    const results = {
      config: null,
      guide: null,
    };

    results.config = await this.generateConfig(options);
    results.guide = await this.generateGuide(options);

    return results;
  }

  /**
   * Generate .claude/mcp.json configuration
   */
  async generateConfig(options) {
    const { projectPath } = options;

    const claudeDir = path.join(projectPath, '.claude');
    ensureDir(claudeDir);

    const outputPath = path.join(claudeDir, 'mcp.json');

    // Check if file exists
    let existingConfig = {};
    if (fs.existsSync(outputPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      } catch {
        // Ignore parse errors
      }
    }

    // Merge with existing config
    const config = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        l4yercak3: {
          command: 'npx',
          args: ['@l4yercak3/cli', 'mcp', 'start'],
          env: {
            L4YERCAK3_CONFIG_PATH: '${workspaceFolder}/.l4yercak3',
          },
        },
      },
    };

    const action = await checkFileOverwrite(outputPath);
    if (action === 'skip') {
      return null;
    }

    return writeFileWithBackup(outputPath, JSON.stringify(config, null, 2), action);
  }

  /**
   * Generate MCP integration guide
   */
  async generateGuide(options) {
    const {
      projectPath,
      organizationName,
      features,
    } = options;

    const docsDir = path.join(projectPath, 'docs');
    ensureDir(docsDir);

    const outputPath = path.join(docsDir, 'L4YERCAK3_MCP_GUIDE.md');

    const action = await checkFileOverwrite(outputPath);
    if (action === 'skip') {
      return null;
    }

    const content = this.generateGuideContent({
      organizationName,
      features,
    });

    return writeFileWithBackup(outputPath, content, action);
  }

  generateGuideContent({ organizationName, features }) {
    const featureList = features || ['crm'];

    return `# L4YERCAK3 MCP Integration Guide

Your project is connected to L4YERCAK3! You can now use Claude Code to build
custom integrations using natural language.

## Getting Started

The L4YERCAK3 MCP server has been configured in \`.claude/mcp.json\`. When you
use Claude Code in this project, it will have access to L4YERCAK3 tools.

## Available MCP Tools

### CRM Tools (contacts:read, contacts:write)
${featureList.includes('crm') ? `
- \`l4yercak3_crm_list_contacts\` - List and search contacts
- \`l4yercak3_crm_create_contact\` - Create new contacts
- \`l4yercak3_crm_get_contact\` - Get contact details
- \`l4yercak3_crm_update_contact\` - Update contacts
- \`l4yercak3_crm_delete_contact\` - Delete contacts
- \`l4yercak3_crm_add_tags\` - Add tags to contacts
- \`l4yercak3_crm_list_organizations\` - List organizations
- \`l4yercak3_crm_create_organization\` - Create organizations
` : '*Not enabled*'}

### Events Tools (events:read, events:write)
${featureList.includes('events') ? `
- \`l4yercak3_events_list\` - List events
- \`l4yercak3_events_create\` - Create events
- \`l4yercak3_events_get\` - Get event details with products/sponsors
- \`l4yercak3_events_get_attendees\` - List attendees
- \`l4yercak3_events_check_in\` - Check in attendees
` : '*Not enabled*'}

### Forms Tools (forms:read, forms:write)
${featureList.includes('forms') ? `
- \`l4yercak3_forms_list\` - List forms
- \`l4yercak3_forms_get\` - Get form with fields
- \`l4yercak3_forms_submit\` - Submit form responses
- \`l4yercak3_forms_get_responses\` - Get form submissions
` : '*Not enabled*'}

### Products Tools (products:read)
${featureList.includes('products') ? `
- \`l4yercak3_products_list\` - List products
- \`l4yercak3_products_get\` - Get product details
` : '*Not enabled*'}

### Checkout Tools (checkout:write)
${featureList.includes('checkout') ? `
- \`l4yercak3_checkout_create_session\` - Create checkout session
- \`l4yercak3_checkout_get_session\` - Get checkout status
- \`l4yercak3_orders_list\` - List orders
- \`l4yercak3_orders_get\` - Get order details
` : '*Not enabled*'}

### Invoicing Tools (invoices:read, invoices:write)
${featureList.includes('invoicing') ? `
- \`l4yercak3_invoices_list\` - List invoices
- \`l4yercak3_invoices_create\` - Create invoices
- \`l4yercak3_invoices_get\` - Get invoice details
- \`l4yercak3_invoices_send\` - Send invoice to customer
- \`l4yercak3_invoices_mark_paid\` - Mark invoice as paid
- \`l4yercak3_invoices_get_pdf\` - Get invoice PDF URL
` : '*Not enabled*'}

### Benefits Tools (benefits:read, benefits:write)
${featureList.includes('benefits') ? `
- \`l4yercak3_benefits_list_claims\` - List benefit claims
- \`l4yercak3_benefits_create_claim\` - Submit a benefit claim
- \`l4yercak3_benefits_approve_claim\` - Approve a claim
- \`l4yercak3_benefits_reject_claim\` - Reject a claim
- \`l4yercak3_benefits_list_commissions\` - List commission payouts
` : '*Not enabled*'}

### Code Generation Tools
- \`l4yercak3_generate_api_client\` - Generate typed API client
- \`l4yercak3_generate_component\` - Generate React components
- \`l4yercak3_generate_hook\` - Generate React hooks
- \`l4yercak3_generate_page\` - Generate Next.js pages

## Example Prompts

Here are some things you can ask Claude Code to do:

### CRM & Contacts
1. "Create a contact management page with search, filtering by tags, and the ability to add notes"
2. "Build a contact detail view that shows all activities and related organizations"
3. "Generate a contact import feature that reads from CSV"

### Events & Registrations
4. "Build an event registration flow with ticket selection and Stripe checkout"
5. "Create an event listing page with filters for date, location, and category"
6. "Build a mobile-friendly check-in scanner for event attendees"

### Forms
7. "Generate a form builder that lets admins create custom forms and view submissions"
8. "Create a contact form that saves to L4YERCAK3 CRM"
9. "Build a survey results dashboard with charts"

### E-commerce
10. "Create a product catalog with categories and search"
11. "Build a shopping cart with quantity controls"
12. "Generate an order history page for customers"

### Invoicing
13. "Create an invoice dashboard showing pending, paid, and overdue invoices"
14. "Build a send invoice flow with email preview"
15. "Generate an invoice PDF viewer component"

### Dashboard & Analytics
16. "Create a dashboard showing CRM contacts, recent events, and pending invoices"
17. "Build a revenue analytics chart from order data"
18. "Generate a customer lifetime value report"

## Your Configuration

- **Organization:** ${organizationName || 'Your Organization'}
- **Features Enabled:** ${featureList.join(', ')}
- **API Key:** Stored in .env.local

## Tips for Best Results

1. **Be specific about your UI framework** - Tell Claude if you're using Tailwind, shadcn/ui, Material UI, etc.

2. **Reference existing patterns** - Say "match the style of my existing components" so Claude reads your code first.

3. **Start with data** - Ask Claude to show what data is available from the API before designing UI.

4. **Iterate incrementally** - Start simple and add features one at a time.

5. **Ask for explanations** - Claude can explain what MCP tools are available and how they work.

## Webhook Integration

You can also ask Claude to set up webhooks for real-time updates:

- "Set up a webhook handler for new contact creation"
- "Create a webhook endpoint that syncs orders to our local database"
- "Build a notification system triggered by invoice.paid webhooks"

## Need Help?

- Ask Claude: "What L4YERCAK3 MCP tools are available?"
- Ask Claude: "Show me an example of using the contacts API"
- Ask Claude: "Help me debug this L4YERCAK3 integration"

---

Generated by @l4yercak3/cli
`;
  }
}

module.exports = new McpGuideGenerator();
