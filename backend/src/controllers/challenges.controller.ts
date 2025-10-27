import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import {
  AuthRequest,
  CreateChallengeDTO,
  UpdateChallengeDTO,
  ChallengeResponseDTO,
  ApiResponse,
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from '../types';
import { getPagination } from '../utils/helpers';
import { logger } from '../utils/logger';
import { ChallengeStatus, PaymentMethod } from '@prisma/client';
import { paymentService } from '../services/payment.service';
import { generateId } from '../utils/idGenerator';

/**
 * Challenges Controller - Handles challenge-related HTTP requests
 */
export class ChallengesController {
  /**
   * GET /api/challenges
   * Get all challenges with pagination and filtering
   */
  async getAllChallenges(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const pagination = getPagination(page as string, limit as string);

      // Build filter conditions
      const where: { status?: ChallengeStatus } = {};
      if (status && typeof status === 'string') {
        where.status = status as ChallengeStatus;
      }

      // Get challenges with pagination
      const [challenges, total] = await Promise.all([
        prisma.challenges.findMany({
          where,
          skip: pagination.skip,
          take: pagination.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            users_challenges_sponsorIdTousers: {
              select: {
                id: true,
                email: true,
              },
            },
            _count: {
              select: {
                contributions: true,
              },
            },
          },
        }),
        prisma.challenges.count({ where }),
      ]);

      // Format response
      const formattedChallenges: ChallengeResponseDTO[] = challenges.map((challenge) => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        bountyAmount: challenge.bountyAmount.toNumber(),
        status: challenge.status,
        sponsorId: challenge.sponsorId,
        sponsor: challenge.users_challenges_sponsorIdTousers,
        createdAt: challenge.createdAt,
        updatedAt: challenge.updatedAt,
        contributionCount: challenge._count.contributions,
      }));

      const response: ApiResponse<ChallengeResponseDTO[]> = {
        success: true,
        data: formattedChallenges,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/challenges/:id
   * Get single challenge by ID
   */
  async getChallengeById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const challenge = await prisma.challenges.findUnique({
        where: { id },
        include: {
          users_challenges_sponsorIdTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      });

      if (!challenge) {
        throw new NotFoundError('Challenge');
      }

      // Format response consistently with getAllChallenges
      const formattedChallenge: ChallengeResponseDTO = {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        bountyAmount: challenge.bountyAmount.toNumber(),
        status: challenge.status,
        sponsorId: challenge.sponsorId,
        sponsor: challenge.users_challenges_sponsorIdTousers,
        createdAt: challenge.createdAt,
        updatedAt: challenge.updatedAt,
        contributionCount: challenge._count.contributions,
      };

      const response: ApiResponse<ChallengeResponseDTO> = {
        success: true,
        data: formattedChallenge,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/challenges
   * Create a new challenge
   */
  async createChallenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const data: CreateChallengeDTO = {
        ...req.body,
        sponsorId: req.user.id, // Set sponsor to authenticated user
      };

      const challenge = await prisma.challenges.create({
        data: {
          id: generateId(),
          title: data.title,
          description: data.description,
          bountyAmount: data.bountyAmount,
          sponsorId: data.sponsorId,
          updatedAt: new Date(),
        },
        include: {
          users_challenges_sponsorIdTousers: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Challenge created: ${challenge.id} by user ${req.user.email}`);

      const response: ApiResponse<typeof challenge> = {
        success: true,
        data: challenge,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/challenges/:id
   * Update challenge (only by sponsor)
   */
  async updateChallenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;
      const updates: UpdateChallengeDTO = req.body;

      // Check if challenge exists and user is the sponsor
      const existingChallenge = await prisma.challenges.findUnique({
        where: { id },
      });

      if (!existingChallenge) {
        throw new NotFoundError('Challenge');
      }

      if (existingChallenge.sponsorId !== req.user.id) {
        throw new AuthorizationError('Only the challenge sponsor can update it');
      }

      // Update challenge
      const challenge = await prisma.challenges.update({
        where: { id },
        data: updates,
        include: {
          users_challenges_sponsorIdTousers: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Challenge updated: ${challenge.id}`);

      const response: ApiResponse<typeof challenge> = {
        success: true,
        data: challenge,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/challenges/:id/complete
   * Complete challenge and distribute payments to contributors
   */
  async completeChallenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;

      // Get challenge with contributions
      const challenge = await prisma.challenges.findUnique({
        where: { id },
        include: {
          contributions: {
            include: {
              users: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          users_challenges_sponsorIdTousers: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!challenge) {
        throw new NotFoundError('Challenge');
      }

      // Verify user is the sponsor
      if (challenge.sponsorId !== req.user.id) {
        throw new AuthorizationError('Only the challenge sponsor can complete it');
      }

      // Verify challenge status is IN_PROGRESS
      if (challenge.status === ChallengeStatus.COMPLETED) {
        throw new ValidationError('Challenge is already completed');
      }

      if (challenge.status === ChallengeStatus.OPEN) {
        throw new ValidationError(
          'Challenge must be in progress before it can be completed (requires at least one contribution)'
        );
      }

      // Calculate payment splits based on contributions
      const paymentSplits = await paymentService.calculatePaymentSplits(id);

      // Create payment records for all contributors
      const payments = await paymentService.distributePayments(
        id,
        paymentSplits,
        PaymentMethod.FIAT
      );

      // Update challenge status to COMPLETED
      const updatedChallenge = await prisma.challenges.update({
        where: { id },
        data: {
          status: ChallengeStatus.COMPLETED,
          updatedAt: new Date(),
        },
        include: {
          users_challenges_sponsorIdTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      });

      logger.info(
        `Challenge ${id} completed by sponsor ${req.user.email}. ` +
          `${payments.length} payments created totaling $${challenge.bountyAmount}`
      );

      // Format response
      const challengeResponse: ChallengeResponseDTO = {
        id: updatedChallenge.id,
        title: updatedChallenge.title,
        description: updatedChallenge.description,
        bountyAmount: updatedChallenge.bountyAmount.toNumber(),
        status: updatedChallenge.status,
        sponsorId: updatedChallenge.sponsorId,
        sponsor: updatedChallenge.users_challenges_sponsorIdTousers,
        createdAt: updatedChallenge.createdAt,
        updatedAt: updatedChallenge.updatedAt,
        contributionCount: updatedChallenge._count.contributions,
      };

      const paymentResponses = payments.map((payment) => ({
        id: payment.id,
        challengeId: payment.challengeId,
        userId: payment.userId,
        amount: payment.amount.toString(),
        method: payment.method,
        status: payment.status,
        blockchainTxHash: payment.blockchainTxHash || undefined,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      }));

      const response: ApiResponse<{
        challenge: ChallengeResponseDTO;
        payments: typeof paymentResponses;
        paymentSummary: {
          totalAmount: number;
          totalRecipients: number;
          splits: typeof paymentSplits;
        };
      }> = {
        success: true,
        data: {
          challenge: challengeResponse,
          payments: paymentResponses,
          paymentSummary: {
            totalAmount: challenge.bountyAmount.toNumber(),
            totalRecipients: payments.length,
            splits: paymentSplits,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/challenges/:id
   * Delete challenge (only by sponsor)
   */
  async deleteChallenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;

      // Check if challenge exists and user is the sponsor
      const existingChallenge = await prisma.challenges.findUnique({
        where: { id },
      });

      if (!existingChallenge) {
        throw new NotFoundError('Challenge');
      }

      if (existingChallenge.sponsorId !== req.user.id) {
        throw new AuthorizationError('Only the challenge sponsor can delete it');
      }

      // Delete challenge (cascade will delete related contributions and payments)
      await prisma.challenges.delete({
        where: { id },
      });

      logger.info(`Challenge deleted: ${id}`);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Challenge deleted successfully' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const challengesController = new ChallengesController();
