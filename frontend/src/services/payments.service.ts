import type { Payment, Contribution } from '../types';

/**
 * Payments service for managing payment-related API calls
 *
 * Note: Backend doesn't have a dedicated GET /api/payments/my endpoint yet.
 * Payments are currently only returned via the CompleteChallenge response.
 * This service provides utility methods for working with payment data.
 */
export const paymentsService = {
  /**
   * Get payments for the current user
   *
   * TODO: This endpoint doesn't exist yet in backend
   * For now, this throws an error. Payments must be retrieved from
   * completed challenges via challengesService.completeChallenge()
   *
   * @returns Promise resolving to array of payments
   * @throws Error indicating endpoint is not implemented
   */
  async getMyPayments(): Promise<Payment[]> {
    // Backend endpoint not implemented yet
    throw new Error('GET /api/payments/my endpoint not implemented in backend. Retrieve payments from completed challenges instead.');
  },

  /**
   * Get payments for a specific challenge
   *
   * Note: Payments are included in the CompleteChallengeResponse
   * This is a placeholder for future direct payment queries
   *
   * @returns Promise resolving to array of payments
   */
  async getByChallengeId(): Promise<Payment[]> {
    // Payments are currently only available via completeChallenge response
    // This is a placeholder for future implementation
    return [];
  },

  /**
   * Calculate total earnings from COMPLETED payments
   *
   * @param payments - Array of payment objects
   * @returns Total amount of completed payments
   */
  getTotalEarnings(payments: Payment[]): number {
    return payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);
  },

  /**
   * Calculate pending earnings from PENDING payments
   *
   * @param payments - Array of payment objects
   * @returns Total amount of pending payments
   */
  getPendingEarnings(payments: Payment[]): number {
    return payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);
  },

  /**
   * Calculate failed payment amounts
   *
   * @param payments - Array of payment objects
   * @returns Total amount of failed payments
   */
  getFailedPayments(payments: Payment[]): number {
    return payments
      .filter(p => p.status === 'FAILED')
      .reduce((sum, p) => sum + p.amount, 0);
  },

  /**
   * Group payments by status
   *
   * @param payments - Array of payment objects
   * @returns Object with payments grouped by status
   */
  groupByStatus(payments: Payment[]): {
    pending: Payment[];
    completed: Payment[];
    failed: Payment[];
  } {
    return {
      pending: payments.filter(p => p.status === 'PENDING'),
      completed: payments.filter(p => p.status === 'COMPLETED'),
      failed: payments.filter(p => p.status === 'FAILED'),
    };
  },

  /**
   * Get payment statistics
   *
   * @param payments - Array of payment objects
   * @returns Statistics object with totals and counts
   */
  getStatistics(payments: Payment[]): {
    totalEarnings: number;
    pendingEarnings: number;
    failedAmount: number;
    totalCount: number;
    pendingCount: number;
    completedCount: number;
    failedCount: number;
  } {
    const grouped = this.groupByStatus(payments);

    return {
      totalEarnings: this.getTotalEarnings(payments),
      pendingEarnings: this.getPendingEarnings(payments),
      failedAmount: this.getFailedPayments(payments),
      totalCount: payments.length,
      pendingCount: grouped.pending.length,
      completedCount: grouped.completed.length,
      failedCount: grouped.failed.length,
    };
  },

  /**
   * Extract payments from completed challenges
   * Workaround for missing payments API endpoint
   *
   * @returns Array of payments from completed challenges
   */
  extractPaymentsFromChallenges(): Payment[] {
    // This is a workaround - in real implementation, challenges would have
    // a payments array attached. For now, this returns empty array.
    // Payments should be stored when challenge.complete() is called
    return [];
  },

  /**
   * Calculate payment preview from contributions
   * Simulates backend payment calculation logic
   *
   * @param contributions - Array of contributions
   * @param bountyAmount - Total bounty amount
   * @returns Array of payment amounts by user
   */
  calculatePaymentPreview(contributions: Contribution[], bountyAmount: number): {
    userId: string;
    userEmail: string;
    contributionType: string;
    tokenValue: number;
    percentage: number;
    amount: number;
  }[] {
    // Calculate total token value
    const totalTokens = contributions.reduce((sum, c) => sum + c.tokenValue, 0);

    if (totalTokens === 0) {
      return [];
    }

    // Group contributions by user
    const userContributions = new Map<string, {
      userId: string;
      userEmail: string;
      totalTokens: number;
      contributions: Contribution[];
    }>();

    contributions.forEach(c => {
      const existing = userContributions.get(c.userId);
      if (existing) {
        existing.totalTokens += c.tokenValue;
        existing.contributions.push(c);
      } else {
        userContributions.set(c.userId, {
          userId: c.userId,
          userEmail: c.user?.email || 'Unknown',
          totalTokens: c.tokenValue,
          contributions: [c],
        });
      }
    });

    // Calculate payment amounts
    return Array.from(userContributions.values()).map(userInfo => {
      const percentage = (userInfo.totalTokens / totalTokens) * 100;
      const amount = (userInfo.totalTokens / totalTokens) * bountyAmount;

      // Use the most recent contribution type for display
      const latestContribution = userInfo.contributions[userInfo.contributions.length - 1];

      return {
        userId: userInfo.userId,
        userEmail: userInfo.userEmail,
        contributionType: latestContribution.type,
        tokenValue: userInfo.totalTokens,
        percentage,
        amount,
      };
    });
  },
};
