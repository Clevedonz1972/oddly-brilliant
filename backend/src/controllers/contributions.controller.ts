import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import {
  AuthRequest,
  CreateContributionDTO,
  ContributionResponseDTO,
  ApiResponse,
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from '../types';
import { getPagination, calculateTokenValue } from '../utils/helpers';
import { logger } from '../utils/logger';
import { generateId } from '../utils/idGenerator';

/**
 * Contributions Controller - Handles contribution-related HTTP requests
 */
export class ContributionsController {
  /**
   * GET /api/contributions
   * Get all contributions with pagination and filtering
   */
  async getAllContributions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, challengeId, userId } = req.query;
      const pagination = getPagination(page as string, limit as string);

      // Build filter conditions
      const where: { challengeId?: string; userId?: string } = {};
      if (challengeId && typeof challengeId === 'string') {
        where.challengeId = challengeId;
      }
      if (userId && typeof userId === 'string') {
        where.userId = userId;
      }

      // Get contributions with pagination
      const [contributions, total] = await Promise.all([
        prisma.contributions.findMany({
          where,
          skip: pagination.skip,
          take: pagination.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            users: {
              select: {
                id: true,
                email: true,
              },
            },
            challenges: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
        prisma.contributions.count({ where }),
      ]);

      // Format response
      const formattedContributions: ContributionResponseDTO[] = contributions.map(
        (contribution) => ({
          id: contribution.id,
          challengeId: contribution.challengeId,
          userId: contribution.userId,
          content: contribution.content,
          type: contribution.type,
          tokenValue: contribution.tokenValue.toNumber(),
          blockchainTxHash: contribution.blockchainTxHash || undefined,
          createdAt: contribution.createdAt,
          updatedAt: contribution.updatedAt,
          user: contribution.users,
          challenge: contribution.challenges,
        })
      );

      const response: ApiResponse<ContributionResponseDTO[]> = {
        success: true,
        data: formattedContributions,
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
   * GET /api/contributions/:id
   * Get single contribution by ID
   */
  async getContributionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const contribution = await prisma.contributions.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              walletAddress: true,
            },
          },
          challenges: {
            select: {
              id: true,
              title: true,
              bountyAmount: true,
              status: true,
            },
          },
        },
      });

      if (!contribution) {
        throw new NotFoundError('Contribution');
      }

      const response: ApiResponse<typeof contribution> = {
        success: true,
        data: contribution,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/contributions
   * Create a new contribution
   */
  async createContribution(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const data: Omit<CreateContributionDTO, 'userId'> = req.body;

      // Verify challenge exists
      const challenge = await prisma.challenges.findUnique({
        where: { id: data.challengeId },
      });

      if (!challenge) {
        throw new NotFoundError('Challenge');
      }

      // Check if challenge is still open or in progress
      if (challenge.status === 'COMPLETED') {
        throw new ValidationError('Cannot contribute to a completed challenge');
      }

      // Calculate token value based on contribution type
      const tokenValue = calculateTokenValue(data.type);

      // Create contribution
      const contribution = await prisma.contributions.create({
        data: {
          id: generateId(),
          challengeId: data.challengeId,
          userId: req.user.id,
          content: data.content,
          type: data.type,
          tokenValue,
          blockchainTxHash: data.blockchainTxHash,
          updatedAt: new Date(),
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
            },
          },
          challenges: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Update challenge status to IN_PROGRESS if it's OPEN
      if (challenge.status === 'OPEN') {
        await prisma.challenges.update({
          where: { id: data.challengeId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      logger.info(`Contribution created: ${contribution.id} by user ${req.user.email}`);

      const response: ApiResponse<typeof contribution> = {
        success: true,
        data: contribution,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/contributions/:id
   * Delete contribution (only by creator)
   */
  async deleteContribution(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;

      // Check if contribution exists and user is the creator
      const existingContribution = await prisma.contributions.findUnique({
        where: { id },
      });

      if (!existingContribution) {
        throw new NotFoundError('Contribution');
      }

      if (existingContribution.userId !== req.user.id) {
        throw new AuthorizationError('Only the contribution creator can delete it');
      }

      // Delete contribution
      await prisma.contributions.delete({
        where: { id },
      });

      logger.info(`Contribution deleted: ${id}`);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Contribution deleted successfully' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const contributionsController = new ContributionsController();
