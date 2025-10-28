import type { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';

class PaymentsController {
  /**
   * Get all payments for the authenticated user
   */
  async getMyPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const payments = await prisma.payments.findMany({
        where: {
          userId,
        },
        include: {
          challenges: {
            select: {
              id: true,
              title: true,
              bountyAmount: true,
            },
          },
          users: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate summary statistics
      const stats = {
        total: payments.length,
        totalEarnings: payments
          .filter(p => p.status === 'COMPLETED')
          .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        pendingEarnings: payments
          .filter(p => p.status === 'PENDING')
          .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        failedAmount: payments
          .filter(p => p.status === 'FAILED')
          .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
      };

      res.json({
        success: true,
        data: {
          payments,
          stats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all payments for a specific challenge
   */
  async getPaymentsByChallenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { challengeId } = req.params;
      const userId = req.user!.id;

      // First check if user is sponsor or contributor of this challenge
      const challenge = await prisma.challenges.findUnique({
        where: { id: challengeId },
        include: {
          contributions: {
            where: { userId },
            select: { id: true },
          },
        },
      });

      if (!challenge) {
        res.status(404).json({
          success: false,
          error: 'Challenge not found',
        });
        return;
      }

      // Check authorization: must be sponsor or have contributed
      const isSponsor = challenge.sponsorId === userId;
      const isContributor = challenge.contributions.length > 0;

      if (!isSponsor && !isContributor) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to view payments for this challenge',
        });
        return;
      }

      const payments = await prisma.payments.findMany({
        where: {
          challengeId,
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single payment by ID
   */
  async getPaymentById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const payment = await prisma.payments.findUnique({
        where: { id },
        include: {
          challenges: {
            select: {
              id: true,
              title: true,
              bountyAmount: true,
            },
          },
          users: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
        return;
      }

      // Only the recipient can view their payment
      if (payment.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to view this payment',
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
