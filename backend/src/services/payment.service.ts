import { prisma } from '../config/database';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { PaymentSplit, NotFoundError, ValidationError } from '../types';
import { generateId } from '../utils/idGenerator';

/**
 * Payment Service - Handles payment calculation and distribution logic
 */
export class PaymentService {
  /**
   * Calculate payment splits for a completed challenge
   *
   * This method implements the core value proposition: fair distribution
   * of bounty based on token values from different contribution types.
   *
   * Algorithm:
   * 1. Get all contributions for the challenge
   * 2. Sum total token values
   * 3. Calculate each contributor's percentage share
   * 4. Split bounty amount proportionally
   *
   * @param challengeId - The challenge to calculate splits for
   * @returns Array of payment splits showing how bounty should be distributed
   */
  async calculatePaymentSplits(challengeId: string): Promise<PaymentSplit[]> {
    // Get challenge with all contributions
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId },
      include: {
        contributions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundError('Challenge');
    }

    // Handle edge case: no contributions
    if (challenge.contributions.length === 0) {
      logger.warn(`Challenge ${challengeId} has no contributions - no payments to distribute`);
      return [];
    }

    // Calculate total token value across all contributions
    const totalTokens = challenge.contributions.reduce(
      (sum, contrib) => sum + contrib.tokenValue.toNumber(),
      0
    );

    // Prevent division by zero (though this should be caught by length check above)
    if (totalTokens === 0) {
      logger.error(`Challenge ${challengeId} has zero total tokens despite having contributions`);
      throw new ValidationError('Cannot distribute payments: total token value is zero');
    }

    // Calculate payment split for each contribution
    const splits: PaymentSplit[] = challenge.contributions.map((contrib) => {
      const tokenValue = contrib.tokenValue.toNumber();
      const percentage = (tokenValue / totalTokens) * 100;
      const amount = (tokenValue / totalTokens) * challenge.bountyAmount.toNumber();

      return {
        userId: contrib.userId,
        contributionId: contrib.id,
        percentage,
        amount,
        tokenValue,
      };
    });

    logger.info(
      `Calculated payment splits for challenge ${challengeId}: ` +
        `${splits.length} contributors sharing ${challenge.bountyAmount} bounty`
    );

    return splits;
  }

  /**
   * Create payment records for all contributors based on calculated splits
   *
   * This creates Payment records in PENDING status. They can later be
   * updated to COMPLETED when actual payment is processed.
   *
   * @param challengeId - The challenge to create payments for
   * @param splits - Pre-calculated payment splits
   * @param method - Payment method (CRYPTO or FIAT)
   * @returns Array of created payment records
   */
  async distributePayments(
    challengeId: string,
    splits: PaymentSplit[],
    method: PaymentMethod = PaymentMethod.FIAT
  ) {
    if (splits.length === 0) {
      logger.warn(`No payment splits provided for challenge ${challengeId}`);
      return [];
    }

    // Create all payment records in a single transaction
    const payments = await prisma.$transaction(
      splits.map((split) =>
        prisma.payments.create({
          data: {
            id: generateId(),
            challengeId,
            userId: split.userId,
            amount: split.amount,
            method,
            status: PaymentStatus.PENDING,
            updatedAt: new Date(),
          },
        })
      )
    );

    logger.info(
      `Created ${payments.length} payment records for challenge ${challengeId} ` +
        `(Total: $${splits.reduce((sum, s) => sum + s.amount, 0).toFixed(2)})`
    );

    return payments;
  }

  /**
   * Get payment history for a specific user
   *
   * @param userId - User ID to get payment history for
   * @returns Array of payments ordered by creation date (newest first)
   */
  async getUserPayments(userId: string) {
    return prisma.payments.findMany({
      where: { userId },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            bountyAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get total earnings for a user (completed payments only)
   *
   * This sums up all payments that have been marked as COMPLETED,
   * excluding PENDING or FAILED payments.
   *
   * @param userId - User ID to calculate earnings for
   * @returns Total amount earned from completed payments
   */
  async getUserTotalEarnings(userId: string): Promise<number> {
    const result = await prisma.payments.aggregate({
      where: {
        userId,
        status: PaymentStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount?.toNumber() || 0;
  }

  /**
   * Get all payments for a specific challenge
   *
   * @param challengeId - Challenge ID to get payments for
   * @returns Array of payments for the challenge
   */
  async getChallengePayments(challengeId: string) {
    return prisma.payments.findMany({
      where: { challengeId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            walletAddress: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update payment status (e.g., mark as COMPLETED after processing)
   *
   * @param paymentId - Payment ID to update
   * @param status - New payment status
   * @param blockchainTxHash - Optional transaction hash if paid via crypto
   * @returns Updated payment record
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    blockchainTxHash?: string
  ) {
    const payment = await prisma.payments.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    const updatedPayment = await prisma.payments.update({
      where: { id: paymentId },
      data: {
        status,
        blockchainTxHash,
        updatedAt: new Date(),
      },
    });

    logger.info(
      `Payment ${paymentId} status updated to ${status}` +
        (blockchainTxHash ? ` (tx: ${blockchainTxHash})` : '')
    );

    return updatedPayment;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
