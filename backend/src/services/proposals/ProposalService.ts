import { PrismaClient, ProposalStatus, ChallengeStatus } from '@prisma/client';
import { generateId } from '../../utils/idGenerator';
import { EventService } from '../events/EventService';
import { CreateProposalDTO } from '../../types';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '../../types';

/**
 * ProposalService - Manages contributor proposals for challenges
 *
 * Business Rules:
 * - Contributors can propose to join OPEN challenges
 * - Contributors cannot propose if they are the sponsor
 * - Only one PENDING or ACCEPTED proposal per contributor per challenge
 * - Project Leaders can accept/reject PENDING proposals
 * - Contributors can withdraw their own PENDING proposals
 * - All actions are logged via EventService for audit trail
 */
export class ProposalService {
  constructor(
    private prisma: PrismaClient,
    private eventService: EventService
  ) {}

  /**
   * Create a new proposal
   * Validates business rules before creating
   */
  async create(contributorId: string, data: CreateProposalDTO) {
    // Validate challenge exists and is OPEN
    const challenge = await this.prisma.challenges.findUnique({
      where: { id: data.challengeId },
      include: {
        users_challenges_sponsorIdTousers: {
          select: { id: true, email: true },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundError('Challenge');
    }

    // Check contributor is not the sponsor
    if (challenge.sponsorId === contributorId) {
      throw new ValidationError('Challenge sponsor cannot propose to their own challenge');
    }

    // Check challenge is OPEN
    if (challenge.status !== ChallengeStatus.OPEN) {
      throw new ValidationError('Can only propose to OPEN challenges');
    }

    // Check for existing PENDING or ACCEPTED proposal
    const existingProposal = await this.prisma.proposals.findFirst({
      where: {
        challengeId: data.challengeId,
        contributorId,
        status: {
          in: [ProposalStatus.PENDING, ProposalStatus.ACCEPTED],
        },
      },
    });

    if (existingProposal) {
      if (existingProposal.status === ProposalStatus.ACCEPTED) {
        throw new ConflictError('You already have an accepted proposal for this challenge');
      }
      throw new ConflictError('You already have a pending proposal for this challenge');
    }

    // Create proposal
    const proposal = await this.prisma.proposals.create({
      data: {
        id: generateId(),
        challengeId: data.challengeId,
        contributorId,
        message: data.message,
        status: ProposalStatus.PENDING,
      },
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

    // Emit event for audit trail
    await this.eventService.emit({
      actorId: contributorId,
      entityType: 'PROPOSAL',
      entityId: proposal.id,
      action: 'CREATE_PROPOSAL',
      snapshot: {
        challengeId: proposal.challengeId,
        challengeTitle: proposal.challenges?.title || '',
        message: proposal.message,
      },
      metadata: {
        challengeId: data.challengeId,
        status: proposal.status,
      },
    });

    return proposal;
  }

  /**
   * Get proposal by ID
   */
  async getById(proposalId: string) {
    const proposal = await this.prisma.proposals.findUnique({
      where: { id: proposalId },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true,
            sponsorId: true,
            projectLeaderId: true,
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

    return proposal;
  }

  /**
   * Get all proposals for a challenge
   * Optionally filter by status
   */
  async getByChallenge(challengeId: string, status?: ProposalStatus) {
    const where: any = { challengeId };
    if (status) {
      where.status = status;
    }

    const proposals = await this.prisma.proposals.findMany({
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

    return proposals;
  }

  /**
   * Get all proposals by a contributor
   */
  async getByContributor(contributorId: string) {
    const proposals = await this.prisma.proposals.findMany({
      where: { contributorId },
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

    return proposals;
  }

  /**
   * Accept a proposal
   * Only Project Leader can accept
   */
  async accept(proposalId: string, responderId: string, responseMessage?: string) {
    // Get proposal with challenge details
    const proposal = await this.getById(proposalId);

    if (!proposal) {
      throw new NotFoundError('Proposal');
    }

    // Validate proposal is PENDING
    if (proposal.status !== ProposalStatus.PENDING) {
      throw new ValidationError('Only PENDING proposals can be accepted');
    }

    // Validate challenge is not COMPLETED
    if (proposal.challenges.status === ChallengeStatus.COMPLETED) {
      throw new ValidationError('Cannot accept proposals for completed challenges');
    }

    // Validate responder is Project Leader
    if (proposal.challenges.projectLeaderId !== responderId) {
      throw new AuthorizationError('Only the Project Leader can accept proposals');
    }

    // Update proposal
    const updatedProposal = await this.prisma.proposals.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.ACCEPTED,
        respondedBy: responderId,
        respondedAt: new Date(),
        responseMessage,
      },
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

    // Emit event for audit trail
    await this.eventService.emit({
      actorId: responderId,
      entityType: 'PROPOSAL',
      entityId: proposalId,
      action: 'ACCEPT_PROPOSAL',
      snapshot: {
        challengeId: proposal.challengeId,
        challengeTitle: proposal.challenges?.title || '',
        contributorId: proposal.contributorId,
        contributorEmail: proposal.users_proposals_contributorIdTousers.email,
        responseMessage,
      },
      metadata: {
        challengeId: proposal.challengeId,
        contributorId: proposal.contributorId,
        previousStatus: ProposalStatus.PENDING,
        newStatus: ProposalStatus.ACCEPTED,
      },
    });

    return updatedProposal;
  }

  /**
   * Reject a proposal
   * Only Project Leader can reject
   */
  async reject(proposalId: string, responderId: string, responseMessage?: string) {
    // Get proposal with challenge details
    const proposal = await this.getById(proposalId);

    if (!proposal) {
      throw new NotFoundError('Proposal');
    }

    // Validate proposal is PENDING
    if (proposal.status !== ProposalStatus.PENDING) {
      throw new ValidationError('Only PENDING proposals can be rejected');
    }

    // Validate responder is Project Leader
    if (proposal.challenges.projectLeaderId !== responderId) {
      throw new AuthorizationError('Only the Project Leader can reject proposals');
    }

    // Update proposal
    const updatedProposal = await this.prisma.proposals.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.REJECTED,
        respondedBy: responderId,
        respondedAt: new Date(),
        responseMessage,
      },
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

    // Emit event for audit trail
    await this.eventService.emit({
      actorId: responderId,
      entityType: 'PROPOSAL',
      entityId: proposalId,
      action: 'REJECT_PROPOSAL',
      snapshot: {
        challengeId: proposal.challengeId,
        challengeTitle: proposal.challenges?.title || '',
        contributorId: proposal.contributorId,
        contributorEmail: proposal.users_proposals_contributorIdTousers.email,
        responseMessage,
      },
      metadata: {
        challengeId: proposal.challengeId,
        contributorId: proposal.contributorId,
        previousStatus: ProposalStatus.PENDING,
        newStatus: ProposalStatus.REJECTED,
      },
    });

    return updatedProposal;
  }

  /**
   * Withdraw a proposal
   * Only contributor can withdraw their own proposal
   */
  async withdraw(proposalId: string, contributorId: string) {
    // Get proposal
    const proposal = await this.getById(proposalId);

    if (!proposal) {
      throw new NotFoundError('Proposal');
    }

    // Validate user is the contributor
    if (proposal.contributorId !== contributorId) {
      throw new AuthorizationError('Only the proposal creator can withdraw it');
    }

    // Validate proposal is PENDING
    if (proposal.status !== ProposalStatus.PENDING) {
      throw new ValidationError('Only PENDING proposals can be withdrawn');
    }

    // Update proposal
    const updatedProposal = await this.prisma.proposals.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.WITHDRAWN,
      },
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

    // Emit event for audit trail
    await this.eventService.emit({
      actorId: contributorId,
      entityType: 'PROPOSAL',
      entityId: proposalId,
      action: 'WITHDRAW_PROPOSAL',
      snapshot: {
        challengeId: proposal.challengeId,
        challengeTitle: proposal.challenges?.title || '',
      },
      metadata: {
        challengeId: proposal.challengeId,
        previousStatus: ProposalStatus.PENDING,
        newStatus: ProposalStatus.WITHDRAWN,
      },
    });

    return updatedProposal;
  }
}
