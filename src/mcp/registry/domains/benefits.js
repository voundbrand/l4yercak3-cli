/**
 * Benefits Domain Tools
 *
 * Tools for managing benefits, commission payouts, member wallets,
 * and platform fees tracking.
 *
 * @module mcp/registry/domains/benefits
 */

const backendClient = require('../../../api/backend-client');

/**
 * Benefits domain definition
 */
module.exports = {
  name: 'benefits',
  description: 'Benefits Platform - claims, commissions, wallets, and fees',
  tools: [
    // ========================================
    // Benefit Claims Tools
    // ========================================
    {
      name: 'l4yercak3_benefits_list_claims',
      description: `List benefit claims for the organization.
Use this to retrieve pending, approved, or rejected benefit claims.

Returns claims with their status, amount, and member information.`,
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'paid', 'cancelled'],
            description: 'Filter by claim status',
          },
          memberId: {
            type: 'string',
            description: 'Filter by member ID',
          },
          benefitType: {
            type: 'string',
            description: 'Filter by benefit type',
          },
          limit: {
            type: 'number',
            description: 'Max claims to return (default 50, max 100)',
          },
          offset: {
            type: 'number',
            description: 'Offset for pagination',
          },
        },
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:read'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        queryParams.set('organizationId', authContext.organizationId);
        if (params.status) queryParams.set('status', params.status);
        if (params.memberId) queryParams.set('memberId', params.memberId);
        if (params.benefitType) queryParams.set('benefitType', params.benefitType);
        if (params.limit) queryParams.set('limit', Math.min(params.limit, 100));
        if (params.offset) queryParams.set('offset', params.offset);

        const response = await backendClient.request(
          'GET',
          `/api/v1/benefits/claims?${queryParams.toString()}`
        );

        return {
          claims: (response.claims || []).map(claim => ({
            id: claim._id,
            memberId: claim.memberId,
            memberName: claim.memberName,
            benefitType: claim.benefitType,
            amount: claim.amount,
            currency: claim.currency || 'EUR',
            status: claim.status,
            description: claim.description,
            submittedAt: claim.submittedAt,
            processedAt: claim.processedAt,
            notes: claim.notes,
          })),
          total: response.total || (response.claims || []).length,
          hasMore: response.hasMore || false,
        };
      },
    },

    {
      name: 'l4yercak3_benefits_create_claim',
      description: `Create a new benefit claim.
Use this to submit a benefit claim on behalf of a member.`,
      inputSchema: {
        type: 'object',
        properties: {
          memberId: {
            type: 'string',
            description: 'Member ID submitting the claim',
          },
          benefitType: {
            type: 'string',
            description: 'Type of benefit being claimed',
          },
          amount: {
            type: 'number',
            description: 'Claim amount',
          },
          currency: {
            type: 'string',
            description: 'Currency code (default: EUR)',
          },
          description: {
            type: 'string',
            description: 'Description of the claim',
          },
          supportingDocuments: {
            type: 'array',
            items: { type: 'string' },
            description: 'URLs to supporting documents',
          },
        },
        required: ['memberId', 'benefitType', 'amount'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:write'],
      handler: async (params, authContext) => {
        const response = await backendClient.request('POST', '/api/v1/benefits/claims', {
          organizationId: authContext.organizationId,
          memberId: params.memberId,
          benefitType: params.benefitType,
          amount: params.amount,
          currency: params.currency || 'EUR',
          description: params.description,
          supportingDocuments: params.supportingDocuments || [],
          source: 'mcp',
        });

        return {
          success: true,
          claimId: response.claimId || response._id,
          status: 'pending',
          message: 'Benefit claim submitted successfully',
        };
      },
    },

    {
      name: 'l4yercak3_benefits_get_claim',
      description: `Get details of a specific benefit claim.`,
      inputSchema: {
        type: 'object',
        properties: {
          claimId: {
            type: 'string',
            description: 'The claim ID',
          },
        },
        required: ['claimId'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:read'],
      handler: async (params, _authContext) => {
        const response = await backendClient.request(
          'GET',
          `/api/v1/benefits/claims/${params.claimId}`
        );

        const claim = response.claim || response;

        return {
          id: claim._id,
          memberId: claim.memberId,
          memberName: claim.memberName,
          memberEmail: claim.memberEmail,
          benefitType: claim.benefitType,
          amount: claim.amount,
          currency: claim.currency || 'EUR',
          status: claim.status,
          description: claim.description,
          supportingDocuments: claim.supportingDocuments || [],
          submittedAt: claim.submittedAt,
          processedAt: claim.processedAt,
          processedBy: claim.processedBy,
          notes: claim.notes,
          history: claim.history || [],
        };
      },
    },

    {
      name: 'l4yercak3_benefits_update_claim_status',
      description: `Update the status of a benefit claim (approve, reject, etc.).`,
      inputSchema: {
        type: 'object',
        properties: {
          claimId: {
            type: 'string',
            description: 'The claim ID to update',
          },
          status: {
            type: 'string',
            enum: ['approved', 'rejected', 'paid', 'cancelled'],
            description: 'New status for the claim',
          },
          notes: {
            type: 'string',
            description: 'Notes about the status change',
          },
        },
        required: ['claimId', 'status'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:write'],
      handler: async (params, _authContext) => {
        await backendClient.request(
          'PATCH',
          `/api/v1/benefits/claims/${params.claimId}/status`,
          {
            status: params.status,
            notes: params.notes,
          }
        );

        return {
          success: true,
          claimId: params.claimId,
          status: params.status,
          message: `Claim ${params.status} successfully`,
        };
      },
    },

    // ========================================
    // Commission Payout Tools
    // ========================================
    {
      name: 'l4yercak3_benefits_list_commissions',
      description: `List commission payouts for the organization.
Use this to view pending, processing, or completed commission payouts.`,
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
            description: 'Filter by payout status',
          },
          memberId: {
            type: 'string',
            description: 'Filter by member ID',
          },
          commissionType: {
            type: 'string',
            description: 'Filter by commission type',
          },
          limit: {
            type: 'number',
            description: 'Max payouts to return (default 50)',
          },
          offset: {
            type: 'number',
            description: 'Offset for pagination',
          },
        },
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:read'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        queryParams.set('organizationId', authContext.organizationId);
        if (params.status) queryParams.set('status', params.status);
        if (params.memberId) queryParams.set('memberId', params.memberId);
        if (params.commissionType) queryParams.set('commissionType', params.commissionType);
        if (params.limit) queryParams.set('limit', Math.min(params.limit, 100));
        if (params.offset) queryParams.set('offset', params.offset);

        const response = await backendClient.request(
          'GET',
          `/api/v1/benefits/commissions?${queryParams.toString()}`
        );

        return {
          commissions: (response.commissions || []).map(payout => ({
            id: payout._id,
            memberId: payout.memberId,
            memberName: payout.memberName,
            commissionType: payout.commissionType,
            amount: payout.amount,
            currency: payout.currency || 'EUR',
            status: payout.status,
            sourceTransaction: payout.sourceTransaction,
            calculatedAt: payout.calculatedAt,
            paidAt: payout.paidAt,
            paymentMethod: payout.paymentMethod,
          })),
          total: response.total || (response.commissions || []).length,
          hasMore: response.hasMore || false,
        };
      },
    },

    {
      name: 'l4yercak3_benefits_create_commission',
      description: `Create a new commission payout record.
Use this to record a commission earned by a member.`,
      inputSchema: {
        type: 'object',
        properties: {
          memberId: {
            type: 'string',
            description: 'Member ID earning the commission',
          },
          commissionType: {
            type: 'string',
            description: 'Type of commission (e.g., referral, sales, affiliate)',
          },
          amount: {
            type: 'number',
            description: 'Commission amount',
          },
          currency: {
            type: 'string',
            description: 'Currency code (default: EUR)',
          },
          sourceTransaction: {
            type: 'string',
            description: 'ID of the transaction that generated this commission',
          },
          description: {
            type: 'string',
            description: 'Description of the commission',
          },
        },
        required: ['memberId', 'commissionType', 'amount'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:write'],
      handler: async (params, authContext) => {
        const response = await backendClient.request('POST', '/api/v1/benefits/commissions', {
          organizationId: authContext.organizationId,
          memberId: params.memberId,
          commissionType: params.commissionType,
          amount: params.amount,
          currency: params.currency || 'EUR',
          sourceTransaction: params.sourceTransaction,
          description: params.description,
          source: 'mcp',
        });

        return {
          success: true,
          commissionId: response.commissionId || response._id,
          status: 'pending',
          message: 'Commission payout created successfully',
        };
      },
    },

    {
      name: 'l4yercak3_benefits_get_commission',
      description: `Get details of a specific commission payout.`,
      inputSchema: {
        type: 'object',
        properties: {
          commissionId: {
            type: 'string',
            description: 'The commission payout ID',
          },
        },
        required: ['commissionId'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:read'],
      handler: async (params, _authContext) => {
        const response = await backendClient.request(
          'GET',
          `/api/v1/benefits/commissions/${params.commissionId}`
        );

        const commission = response.commission || response;

        return {
          id: commission._id,
          memberId: commission.memberId,
          memberName: commission.memberName,
          commissionType: commission.commissionType,
          amount: commission.amount,
          currency: commission.currency || 'EUR',
          status: commission.status,
          sourceTransaction: commission.sourceTransaction,
          description: commission.description,
          calculatedAt: commission.calculatedAt,
          paidAt: commission.paidAt,
          paymentMethod: commission.paymentMethod,
          paymentReference: commission.paymentReference,
          history: commission.history || [],
        };
      },
    },

    {
      name: 'l4yercak3_benefits_process_commission',
      description: `Process a pending commission payout (mark as processing, completed, or failed).`,
      inputSchema: {
        type: 'object',
        properties: {
          commissionId: {
            type: 'string',
            description: 'The commission ID to process',
          },
          status: {
            type: 'string',
            enum: ['processing', 'completed', 'failed', 'cancelled'],
            description: 'New status for the payout',
          },
          paymentMethod: {
            type: 'string',
            description: 'Payment method used (e.g., bank_transfer, crypto, paypal)',
          },
          paymentReference: {
            type: 'string',
            description: 'Payment reference/transaction ID',
          },
          notes: {
            type: 'string',
            description: 'Notes about the processing',
          },
        },
        required: ['commissionId', 'status'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:write'],
      handler: async (params, _authContext) => {
        await backendClient.request(
          'PATCH',
          `/api/v1/benefits/commissions/${params.commissionId}/process`,
          {
            status: params.status,
            paymentMethod: params.paymentMethod,
            paymentReference: params.paymentReference,
            notes: params.notes,
          }
        );

        return {
          success: true,
          commissionId: params.commissionId,
          status: params.status,
          message: `Commission payout ${params.status} successfully`,
        };
      },
    },

    // ========================================
    // Member Wallet Tools
    // ========================================
    {
      name: 'l4yercak3_benefits_list_wallets',
      description: `List member wallets for the organization.
Use this to view linked crypto wallets for members.`,
      inputSchema: {
        type: 'object',
        properties: {
          memberId: {
            type: 'string',
            description: 'Filter by member ID',
          },
          walletType: {
            type: 'string',
            enum: ['ethereum', 'bitcoin', 'solana', 'polygon', 'other'],
            description: 'Filter by wallet type/network',
          },
          verified: {
            type: 'boolean',
            description: 'Filter by verification status',
          },
          limit: {
            type: 'number',
            description: 'Max wallets to return (default 50)',
          },
        },
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:read'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        queryParams.set('organizationId', authContext.organizationId);
        if (params.memberId) queryParams.set('memberId', params.memberId);
        if (params.walletType) queryParams.set('walletType', params.walletType);
        if (params.verified !== undefined) queryParams.set('verified', params.verified);
        if (params.limit) queryParams.set('limit', Math.min(params.limit, 100));

        const response = await backendClient.request(
          'GET',
          `/api/v1/benefits/wallets?${queryParams.toString()}`
        );

        return {
          wallets: (response.wallets || []).map(wallet => ({
            id: wallet._id,
            memberId: wallet.memberId,
            memberName: wallet.memberName,
            walletType: wallet.walletType,
            walletAddress: wallet.walletAddress,
            label: wallet.label,
            verified: wallet.verified || false,
            verifiedAt: wallet.verifiedAt,
            createdAt: wallet.createdAt,
          })),
          total: response.total || (response.wallets || []).length,
        };
      },
    },

    {
      name: 'l4yercak3_benefits_link_wallet',
      description: `Link a crypto wallet to a member for receiving commission payouts.`,
      inputSchema: {
        type: 'object',
        properties: {
          memberId: {
            type: 'string',
            description: 'Member ID to link wallet to',
          },
          walletType: {
            type: 'string',
            enum: ['ethereum', 'bitcoin', 'solana', 'polygon', 'other'],
            description: 'Wallet network type',
          },
          walletAddress: {
            type: 'string',
            description: 'Wallet address',
          },
          label: {
            type: 'string',
            description: 'Optional label for the wallet (e.g., "Primary ETH Wallet")',
          },
        },
        required: ['memberId', 'walletType', 'walletAddress'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:write'],
      handler: async (params, authContext) => {
        const response = await backendClient.request('POST', '/api/v1/benefits/wallets', {
          organizationId: authContext.organizationId,
          memberId: params.memberId,
          walletType: params.walletType,
          walletAddress: params.walletAddress,
          label: params.label,
          source: 'mcp',
        });

        return {
          success: true,
          walletId: response.walletId || response._id,
          verified: false,
          message: 'Wallet linked successfully. Verification may be required.',
        };
      },
    },

    {
      name: 'l4yercak3_benefits_verify_wallet',
      description: `Verify a member's linked wallet.`,
      inputSchema: {
        type: 'object',
        properties: {
          walletId: {
            type: 'string',
            description: 'Wallet ID to verify',
          },
          verificationSignature: {
            type: 'string',
            description: 'Signature proving wallet ownership (if required)',
          },
        },
        required: ['walletId'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:write'],
      handler: async (params, _authContext) => {
        await backendClient.request(
          'POST',
          `/api/v1/benefits/wallets/${params.walletId}/verify`,
          {
            verificationSignature: params.verificationSignature,
          }
        );

        return {
          success: true,
          walletId: params.walletId,
          verified: true,
          message: 'Wallet verified successfully',
        };
      },
    },

    {
      name: 'l4yercak3_benefits_remove_wallet',
      description: `Remove a linked wallet from a member.`,
      inputSchema: {
        type: 'object',
        properties: {
          walletId: {
            type: 'string',
            description: 'Wallet ID to remove',
          },
        },
        required: ['walletId'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:write'],
      handler: async (params, _authContext) => {
        await backendClient.request('DELETE', `/api/v1/benefits/wallets/${params.walletId}`);

        return {
          success: true,
          message: 'Wallet removed successfully',
        };
      },
    },

    // ========================================
    // Platform Fee Tools
    // ========================================
    {
      name: 'l4yercak3_benefits_list_fees',
      description: `List platform fees for the organization.
Use this to view fee transactions for billing purposes.`,
      inputSchema: {
        type: 'object',
        properties: {
          feeType: {
            type: 'string',
            description: 'Filter by fee type (e.g., transaction, subscription, processing)',
          },
          status: {
            type: 'string',
            enum: ['pending', 'collected', 'waived', 'refunded'],
            description: 'Filter by fee status',
          },
          startDate: {
            type: 'string',
            description: 'Start date for date range filter (ISO format)',
          },
          endDate: {
            type: 'string',
            description: 'End date for date range filter (ISO format)',
          },
          limit: {
            type: 'number',
            description: 'Max fees to return (default 50)',
          },
          offset: {
            type: 'number',
            description: 'Offset for pagination',
          },
        },
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:read'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        queryParams.set('organizationId', authContext.organizationId);
        if (params.feeType) queryParams.set('feeType', params.feeType);
        if (params.status) queryParams.set('status', params.status);
        if (params.startDate) queryParams.set('startDate', params.startDate);
        if (params.endDate) queryParams.set('endDate', params.endDate);
        if (params.limit) queryParams.set('limit', Math.min(params.limit, 100));
        if (params.offset) queryParams.set('offset', params.offset);

        const response = await backendClient.request(
          'GET',
          `/api/v1/benefits/fees?${queryParams.toString()}`
        );

        return {
          fees: (response.fees || []).map(fee => ({
            id: fee._id,
            feeType: fee.feeType,
            amount: fee.amount,
            currency: fee.currency || 'EUR',
            status: fee.status,
            sourceTransaction: fee.sourceTransaction,
            description: fee.description,
            createdAt: fee.createdAt,
            collectedAt: fee.collectedAt,
          })),
          total: response.total || (response.fees || []).length,
          summary: response.summary || {
            totalPending: 0,
            totalCollected: 0,
          },
          hasMore: response.hasMore || false,
        };
      },
    },

    {
      name: 'l4yercak3_benefits_get_fee_summary',
      description: `Get a summary of platform fees for a period.`,
      inputSchema: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['day', 'week', 'month', 'quarter', 'year'],
            description: 'Period for the summary (default: month)',
          },
          startDate: {
            type: 'string',
            description: 'Custom start date (ISO format)',
          },
          endDate: {
            type: 'string',
            description: 'Custom end date (ISO format)',
          },
        },
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:read'],
      handler: async (params, authContext) => {
        const queryParams = new URLSearchParams();
        queryParams.set('organizationId', authContext.organizationId);
        if (params.period) queryParams.set('period', params.period);
        if (params.startDate) queryParams.set('startDate', params.startDate);
        if (params.endDate) queryParams.set('endDate', params.endDate);

        const response = await backendClient.request(
          'GET',
          `/api/v1/benefits/fees/summary?${queryParams.toString()}`
        );

        return {
          period: params.period || 'month',
          startDate: response.startDate,
          endDate: response.endDate,
          totalFees: response.totalFees || 0,
          feesByType: response.feesByType || {},
          feesByStatus: response.feesByStatus || {},
          currency: response.currency || 'EUR',
          transactionCount: response.transactionCount || 0,
        };
      },
    },

    // ========================================
    // Member Benefits Summary
    // ========================================
    {
      name: 'l4yercak3_benefits_get_member_summary',
      description: `Get a summary of benefits for a specific member.
Shows claims, commissions, and wallet information.`,
      inputSchema: {
        type: 'object',
        properties: {
          memberId: {
            type: 'string',
            description: 'Member ID to get summary for',
          },
        },
        required: ['memberId'],
      },
      requiresAuth: true,
      requiredPermissions: ['benefits:read'],
      handler: async (params, authContext) => {
        const response = await backendClient.request(
          'GET',
          `/api/v1/benefits/members/${params.memberId}/summary?organizationId=${authContext.organizationId}`
        );

        return {
          memberId: params.memberId,
          memberName: response.memberName,
          claims: {
            total: response.claims?.total || 0,
            pending: response.claims?.pending || 0,
            approved: response.claims?.approved || 0,
            totalAmount: response.claims?.totalAmount || 0,
          },
          commissions: {
            total: response.commissions?.total || 0,
            pending: response.commissions?.pending || 0,
            paid: response.commissions?.paid || 0,
            totalAmount: response.commissions?.totalAmount || 0,
          },
          wallets: {
            linked: response.wallets?.linked || 0,
            verified: response.wallets?.verified || 0,
          },
          currency: response.currency || 'EUR',
        };
      },
    },
  ],
};
