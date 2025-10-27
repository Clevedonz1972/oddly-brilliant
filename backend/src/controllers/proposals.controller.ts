import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ProposalService } from '../services/proposals/ProposalService';
import { EventService } from '../services/events/EventService';
import {
  AuthRequest,
  CreateProposalDTO,
  RespondToProposalDTO,
  ProposalResponseDTO,
  ApiResponse,
  NotFoundError,
  AuthorizationError,
} from '../types';
import { logger } from '../utils/logger';
import { ProposalStatus } from '@prisma/client';

// Initialize services
const eventService = new EventService(prisma);
const proposalService = new ProposalService(prisma, eventService);

/**
 * Proposals Controller - Handles proposal-related HTTP requests
 */
export class ProposalsController {
  /**
   * POST /api/proposals
   * Create a new proposal
   */
  async createProposal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const data: CreateProposalDTO = req.body;

      const proposal = await proposalService.create(req.user.id, data);

      logger.info(`Proposal created: ${proposal.id} by user ${req.user.email}`);

      // Format response
      const proposalResponse: ProposalResponseDTO = {
        id: proposal.id,
        challengeId: proposal.challengeId,
        challenge: {
          id: proposal.challenges.id,
          title: proposal.challenges.title,
          status: proposal.challenges.status,
        },
        contributor: {
          id: proposal.users_proposals_contributorIdTousers.id,
          email: proposal.users_proposals_contributorIdTousers.email,
        },
        contributorId: proposal.contributorId,
        message: proposal.message || undefined,
        status: proposal.status,
        respondedBy: proposal.users_proposals_respondedByTousers
          ? {
              id: proposal.users_proposals_respondedByTousers.id,
              email: proposal.users_proposals_respondedByTousers.email,
            }
          : undefined,
        respondedAt: proposal.respondedAt?.toISOString(),
        responseMessage: proposal.responseMessage || undefined,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
      };

      const response: ApiResponse<ProposalResponseDTO> = {
        success: true,
        data: proposalResponse,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/proposals/my
   * Get all proposals by authenticated user
   */
  async getMyProposals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const proposals = await proposalService.getByContributor(req.user.id);

      // Format response
      const proposalResponses: ProposalResponseDTO[] = proposals.map((proposal) => ({
        id: proposal.id,
        challengeId: proposal.challengeId,
        challenge: {
          id: proposal.challenges.id,
          title: proposal.challenges.title,
          status: proposal.challenges.status,
        },
        contributor: {
          id: proposal.users_proposals_contributorIdTousers.id,
          email: proposal.users_proposals_contributorIdTousers.email,
        },
        contributorId: proposal.contributorId,
        message: proposal.message || undefined,
        status: proposal.status,
        respondedBy: proposal.users_proposals_respondedByTousers
          ? {
              id: proposal.users_proposals_respondedByTousers.id,
              email: proposal.users_proposals_respondedByTousers.email,
            }
          : undefined,
        respondedAt: proposal.respondedAt?.toISOString(),
        responseMessage: proposal.responseMessage || undefined,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
      }));

      const response: ApiResponse<ProposalResponseDTO[]> = {
        success: true,
        data: proposalResponses,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/proposals/:id
   * Get proposal by ID
   */
  async getProposalById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;

      const proposal = await proposalService.getById(id);

      if (!proposal) {
        throw new NotFoundError('Proposal');
      }

      // Format response
      const proposalResponse: ProposalResponseDTO = {
        id: proposal.id,
        challengeId: proposal.challengeId,
        challenge: {
          id: proposal.challenges.id,
          title: proposal.challenges.title,
          status: proposal.challenges.status,
        },
        contributor: {
          id: proposal.users_proposals_contributorIdTousers.id,
          email: proposal.users_proposals_contributorIdTousers.email,
        },
        contributorId: proposal.contributorId,
        message: proposal.message || undefined,
        status: proposal.status,
        respondedBy: proposal.users_proposals_respondedByTousers
          ? {
              id: proposal.users_proposals_respondedByTousers.id,
              email: proposal.users_proposals_respondedByTousers.email,
            }
          : undefined,
        respondedAt: proposal.respondedAt?.toISOString(),
        responseMessage: proposal.responseMessage || undefined,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
      };

      const response: ApiResponse<ProposalResponseDTO> = {
        success: true,
        data: proposalResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/proposals/:id/respond
   * Accept or reject a proposal (Project Leader only)
   */
  async respondToProposal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;
      const data: RespondToProposalDTO = req.body;

      let proposal;

      if (data.action === 'ACCEPT') {
        proposal = await proposalService.accept(id, req.user.id, data.responseMessage);
        logger.info(`Proposal ${id} accepted by ${req.user.email}`);
      } else if (data.action === 'REJECT') {
        proposal = await proposalService.reject(id, req.user.id, data.responseMessage);
        logger.info(`Proposal ${id} rejected by ${req.user.email}`);
      } else {
        throw new Error('Invalid action');
      }

      // Format response
      const proposalResponse: ProposalResponseDTO = {
        id: proposal.id,
        challengeId: proposal.challengeId,
        challenge: {
          id: proposal.challenges.id,
          title: proposal.challenges.title,
          status: proposal.challenges.status,
        },
        contributor: {
          id: proposal.users_proposals_contributorIdTousers.id,
          email: proposal.users_proposals_contributorIdTousers.email,
        },
        contributorId: proposal.contributorId,
        message: proposal.message || undefined,
        status: proposal.status,
        respondedBy: proposal.users_proposals_respondedByTousers
          ? {
              id: proposal.users_proposals_respondedByTousers.id,
              email: proposal.users_proposals_respondedByTousers.email,
            }
          : undefined,
        respondedAt: proposal.respondedAt?.toISOString(),
        responseMessage: proposal.responseMessage || undefined,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
      };

      const response: ApiResponse<ProposalResponseDTO> = {
        success: true,
        data: proposalResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/proposals/:id/withdraw
   * Withdraw a proposal (contributor only)
   */
  async withdrawProposal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;

      const proposal = await proposalService.withdraw(id, req.user.id);

      logger.info(`Proposal ${id} withdrawn by ${req.user.email}`);

      // Format response
      const proposalResponse: ProposalResponseDTO = {
        id: proposal.id,
        challengeId: proposal.challengeId,
        challenge: {
          id: proposal.challenges.id,
          title: proposal.challenges.title,
          status: proposal.challenges.status,
        },
        contributor: {
          id: proposal.users_proposals_contributorIdTousers.id,
          email: proposal.users_proposals_contributorIdTousers.email,
        },
        contributorId: proposal.contributorId,
        message: proposal.message || undefined,
        status: proposal.status,
        respondedBy: proposal.users_proposals_respondedByTousers
          ? {
              id: proposal.users_proposals_respondedByTousers.id,
              email: proposal.users_proposals_respondedByTousers.email,
            }
          : undefined,
        respondedAt: proposal.respondedAt?.toISOString(),
        responseMessage: proposal.responseMessage || undefined,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
      };

      const response: ApiResponse<ProposalResponseDTO> = {
        success: true,
        data: proposalResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/challenges/:id/proposals
   * Get all proposals for a challenge
   */
  async getProposalsByChallenge(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;
      const { status } = req.query;

      const proposals = await proposalService.getByChallenge(
        id,
        status as ProposalStatus | undefined
      );

      // Format response
      const proposalResponses: ProposalResponseDTO[] = proposals.map((proposal) => ({
        id: proposal.id,
        challengeId: proposal.challengeId,
        challenge: {
          id: proposal.challenges.id,
          title: proposal.challenges.title,
          status: proposal.challenges.status,
        },
        contributor: {
          id: proposal.users_proposals_contributorIdTousers.id,
          email: proposal.users_proposals_contributorIdTousers.email,
        },
        contributorId: proposal.contributorId,
        message: proposal.message || undefined,
        status: proposal.status,
        respondedBy: proposal.users_proposals_respondedByTousers
          ? {
              id: proposal.users_proposals_respondedByTousers.id,
              email: proposal.users_proposals_respondedByTousers.email,
            }
          : undefined,
        respondedAt: proposal.respondedAt?.toISOString(),
        responseMessage: proposal.responseMessage || undefined,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
      }));

      const response: ApiResponse<ProposalResponseDTO[]> = {
        success: true,
        data: proposalResponses,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/proposals
   * Get all proposals (admin only)
   */
  async getAllProposals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { status } = req.query;

      // Get all proposals (filtered by status if provided)
      const where: any = {};
      if (status) {
        where.status = status as ProposalStatus;
      }

      const proposals = await prisma.proposals.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          challenges: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          users_proposals_contributorIdTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          users_proposals_respondedByTousers: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      // Format response
      const proposalResponses: ProposalResponseDTO[] = proposals.map((proposal) => ({
        id: proposal.id,
        challengeId: proposal.challengeId,
        challenge: {
          id: proposal.challenges.id,
          title: proposal.challenges.title,
          status: proposal.challenges.status,
        },
        contributor: {
          id: proposal.users_proposals_contributorIdTousers.id,
          email: proposal.users_proposals_contributorIdTousers.email,
        },
        contributorId: proposal.contributorId,
        message: proposal.message || undefined,
        status: proposal.status,
        respondedBy: proposal.users_proposals_respondedByTousers
          ? {
              id: proposal.users_proposals_respondedByTousers.id,
              email: proposal.users_proposals_respondedByTousers.email,
            }
          : undefined,
        respondedAt: proposal.respondedAt?.toISOString(),
        responseMessage: proposal.responseMessage || undefined,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
      }));

      const response: ApiResponse<ProposalResponseDTO[]> = {
        success: true,
        data: proposalResponses,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const proposalsController = new ProposalsController();
