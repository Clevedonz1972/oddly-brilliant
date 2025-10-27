import { ProposalService } from '../ProposalService';
import { EventService } from '../../events/EventService';
import { ProposalStatus, ChallengeStatus, Role } from '@prisma/client';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '../../../types';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  prisma: {
    proposals: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    challenges: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('ProposalService', () => {
  let proposalService: ProposalService;
  let mockPrisma: any;
  let mockEventService: jest.Mocked<EventService>;

  // Mock data
  const mockContributor = {
    id: 'contributor-123',
    email: 'contributor@example.com',
    passwordHash: 'hash',
    walletAddress: null,
    profile: null,
    role: Role.USER,
    kycStatus: 'PENDING',
    kycVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProjectLeader = {
    id: 'leader-123',
    email: 'leader@example.com',
    passwordHash: 'hash',
    walletAddress: null,
    profile: null,
    role: Role.USER,
    kycStatus: 'PENDING',
    kycVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSponsor = {
    id: 'sponsor-123',
    email: 'sponsor@example.com',
    passwordHash: 'hash',
    walletAddress: null,
    profile: null,
    role: Role.USER,
    kycStatus: 'PENDING',
    kycVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChallenge = {
    id: 'challenge-123',
    title: 'Test Challenge',
    description: 'Test description',
    bountyAmount: 1000,
    status: ChallengeStatus.OPEN,
    sponsorId: mockSponsor.id,
    projectLeaderId: mockProjectLeader.id,
    scopeSignedOff: null,
    scopingComplete: false,
    vettedAt: null,
    vettedBy: null,
    vettingNotes: null,
    vettingStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    sponsor: {
      id: mockSponsor.id,
      email: mockSponsor.email,
    },
  };

  const mockProposal = {
    id: 'proposal-123',
    challengeId: mockChallenge.id,
    contributorId: mockContributor.id,
    message: 'I would love to work on this',
    status: ProposalStatus.PENDING,
    respondedBy: null,
    respondedAt: null,
    responseMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    challenge: {
      id: mockChallenge.id,
      title: mockChallenge.title,
      status: mockChallenge.status,
      sponsorId: mockChallenge.sponsorId,
      projectLeaderId: mockChallenge.projectLeaderId,
    },
    contributor: {
      id: mockContributor.id,
      email: mockContributor.email,
    },
    responder: null,
  };

  beforeEach(() => {
    // Create mock prisma
    mockPrisma = {
      proposals: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      challenges: {
        findUnique: jest.fn(),
      },
    };

    // Create mock event service
    mockEventService = {
      emit: jest.fn(),
      getTrail: jest.fn(),
      getByActor: jest.fn(),
      getRecent: jest.fn(),
    } as any;

    proposalService = new ProposalService(mockPrisma as any, mockEventService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    const createProposalDTO = {
      challengeId: mockChallenge.id,
      message: 'I would love to work on this',
    };

    describe('Success Cases', () => {
      it('should create proposal successfully', async () => {
        // Arrange
        mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge);
        mockPrisma.proposals.findFirst.mockResolvedValue(null);
        mockPrisma.proposals.create.mockResolvedValue(mockProposal);
        mockEventService.emit.mockResolvedValue({} as any);

        // Act
        const result = await proposalService.create(mockContributor.id, createProposalDTO);

        // Assert
        expect(result).toEqual(mockProposal);
        expect(mockPrisma.proposals.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            challengeId: createProposalDTO.challengeId,
            contributorId: mockContributor.id,
            message: createProposalDTO.message,
            status: ProposalStatus.PENDING,
          }),
          include: expect.any(Object),
        });
      });

      it('should emit CREATE_PROPOSAL event', async () => {
        // Arrange
        mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge);
        mockPrisma.proposals.findFirst.mockResolvedValue(null);
        mockPrisma.proposals.create.mockResolvedValue(mockProposal);
        mockEventService.emit.mockResolvedValue({} as any);

        // Act
        await proposalService.create(mockContributor.id, createProposalDTO);

        // Assert
        expect(mockEventService.emit).toHaveBeenCalledWith({
          actorId: mockContributor.id,
          entityType: 'PROPOSAL',
          entityId: mockProposal.id,
          action: 'CREATE_PROPOSAL',
          snapshot: expect.objectContaining({
            challengeId: mockProposal.challengeId,
            challengeTitle: mockProposal.challenge.title,
            message: mockProposal.message,
          }),
          metadata: expect.any(Object),
        });
      });

      it('should create proposal without message', async () => {
        // Arrange
        const dtoWithoutMessage = { challengeId: mockChallenge.id };
        const proposalWithoutMessage = { ...mockProposal, message: null };
        mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge);
        mockPrisma.proposals.findFirst.mockResolvedValue(null);
        mockPrisma.proposals.create.mockResolvedValue(proposalWithoutMessage);
        mockEventService.emit.mockResolvedValue({} as any);

        // Act
        const result = await proposalService.create(mockContributor.id, dtoWithoutMessage);

        // Assert
        expect(result.message).toBeNull();
      });
    });

    describe('Validation Errors', () => {
      it('should fail if challenge not found', async () => {
        // Arrange
        mockPrisma.challenges.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          proposalService.create(mockContributor.id, createProposalDTO)
        ).rejects.toThrow(NotFoundError);
        await expect(
          proposalService.create(mockContributor.id, createProposalDTO)
        ).rejects.toThrow('Challenge');
      });

      it('should fail if contributor is sponsor', async () => {
        // Arrange
        mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge);

        // Act & Assert
        await expect(
          proposalService.create(mockSponsor.id, createProposalDTO)
        ).rejects.toThrow(ValidationError);
        await expect(
          proposalService.create(mockSponsor.id, createProposalDTO)
        ).rejects.toThrow('Challenge sponsor cannot propose to their own challenge');
      });

      it('should fail if challenge not OPEN', async () => {
        // Arrange
        const inProgressChallenge = { ...mockChallenge, status: ChallengeStatus.IN_PROGRESS };
        mockPrisma.challenges.findUnique.mockResolvedValue(inProgressChallenge);

        // Act & Assert
        await expect(
          proposalService.create(mockContributor.id, createProposalDTO)
        ).rejects.toThrow(ValidationError);
        await expect(
          proposalService.create(mockContributor.id, createProposalDTO)
        ).rejects.toThrow('Can only propose to OPEN challenges');
      });

      it('should fail if existing PENDING proposal exists', async () => {
        // Arrange
        mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge);
        mockPrisma.proposals.findFirst.mockResolvedValue(mockProposal);

        // Act & Assert
        await expect(
          proposalService.create(mockContributor.id, createProposalDTO)
        ).rejects.toThrow(ConflictError);
        await expect(
          proposalService.create(mockContributor.id, createProposalDTO)
        ).rejects.toThrow('You already have a pending proposal for this challenge');
      });

      it('should fail if existing ACCEPTED proposal exists', async () => {
        // Arrange
        const acceptedProposal = { ...mockProposal, status: ProposalStatus.ACCEPTED };
        mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge);
        mockPrisma.proposals.findFirst.mockResolvedValue(acceptedProposal);

        // Act & Assert
        await expect(
          proposalService.create(mockContributor.id, createProposalDTO)
        ).rejects.toThrow(ConflictError);
        await expect(
          proposalService.create(mockContributor.id, createProposalDTO)
        ).rejects.toThrow('You already have an accepted proposal for this challenge');
      });
    });
  });

  describe('getById()', () => {
    it('should return proposal by ID', async () => {
      // Arrange
      mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);

      // Act
      const result = await proposalService.getById(mockProposal.id);

      // Assert
      expect(result).toEqual(mockProposal);
      expect(mockPrisma.proposals.findUnique).toHaveBeenCalledWith({
        where: { id: mockProposal.id },
        include: expect.any(Object),
      });
    });

    it('should return null if proposal not found', async () => {
      // Arrange
      mockPrisma.proposals.findUnique.mockResolvedValue(null);

      // Act
      const result = await proposalService.getById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getByChallenge()', () => {
    it('should return all proposals for a challenge', async () => {
      // Arrange
      const proposals = [mockProposal, { ...mockProposal, id: 'proposal-456' }];
      mockPrisma.proposals.findMany.mockResolvedValue(proposals);

      // Act
      const result = await proposalService.getByChallenge(mockChallenge.id);

      // Assert
      expect(result).toEqual(proposals);
      expect(mockPrisma.proposals.findMany).toHaveBeenCalledWith({
        where: { challengeId: mockChallenge.id },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter proposals by status', async () => {
      // Arrange
      const pendingProposals = [mockProposal];
      mockPrisma.proposals.findMany.mockResolvedValue(pendingProposals);

      // Act
      const result = await proposalService.getByChallenge(
        mockChallenge.id,
        ProposalStatus.PENDING
      );

      // Assert
      expect(result).toEqual(pendingProposals);
      expect(mockPrisma.proposals.findMany).toHaveBeenCalledWith({
        where: { challengeId: mockChallenge.id, status: ProposalStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getByContributor()', () => {
    it('should return all proposals by contributor', async () => {
      // Arrange
      const proposals = [mockProposal];
      mockPrisma.proposals.findMany.mockResolvedValue(proposals);

      // Act
      const result = await proposalService.getByContributor(mockContributor.id);

      // Assert
      expect(result).toEqual(proposals);
      expect(mockPrisma.proposals.findMany).toHaveBeenCalledWith({
        where: { contributorId: mockContributor.id },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('accept()', () => {
    const acceptedProposal = {
      ...mockProposal,
      status: ProposalStatus.ACCEPTED,
      respondedBy: mockProjectLeader.id,
      respondedAt: new Date(),
      responseMessage: 'Welcome aboard!',
      responder: {
        id: mockProjectLeader.id,
        email: mockProjectLeader.email,
      },
    };

    describe('Success Cases', () => {
      it('should accept proposal successfully', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);
        mockPrisma.proposals.update.mockResolvedValue(acceptedProposal);
        mockEventService.emit.mockResolvedValue({} as any);

        // Act
        const result = await proposalService.accept(
          mockProposal.id,
          mockProjectLeader.id,
          'Welcome aboard!'
        );

        // Assert
        expect(result.status).toBe(ProposalStatus.ACCEPTED);
        expect(result.respondedBy).toBe(mockProjectLeader.id);
        expect(mockPrisma.proposals.update).toHaveBeenCalledWith({
          where: { id: mockProposal.id },
          data: expect.objectContaining({
            status: ProposalStatus.ACCEPTED,
            respondedBy: mockProjectLeader.id,
            responseMessage: 'Welcome aboard!',
          }),
          include: expect.any(Object),
        });
      });

      it('should emit ACCEPT_PROPOSAL event', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);
        mockPrisma.proposals.update.mockResolvedValue(acceptedProposal);
        mockEventService.emit.mockResolvedValue({} as any);

        // Act
        await proposalService.accept(mockProposal.id, mockProjectLeader.id);

        // Assert
        expect(mockEventService.emit).toHaveBeenCalledWith({
          actorId: mockProjectLeader.id,
          entityType: 'PROPOSAL',
          entityId: mockProposal.id,
          action: 'ACCEPT_PROPOSAL',
          snapshot: expect.any(Object),
          metadata: expect.objectContaining({
            previousStatus: ProposalStatus.PENDING,
            newStatus: ProposalStatus.ACCEPTED,
          }),
        });
      });
    });

    describe('Validation Errors', () => {
      it('should fail if proposal not found', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          proposalService.accept(mockProposal.id, mockProjectLeader.id)
        ).rejects.toThrow(NotFoundError);
      });

      it('should fail if not Project Leader', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);

        // Act & Assert
        await expect(
          proposalService.accept(mockProposal.id, mockContributor.id)
        ).rejects.toThrow(AuthorizationError);
        await expect(
          proposalService.accept(mockProposal.id, mockContributor.id)
        ).rejects.toThrow('Only the Project Leader can accept proposals');
      });

      it('should fail if proposal not PENDING', async () => {
        // Arrange
        const rejectedProposal = { ...mockProposal, status: ProposalStatus.REJECTED };
        mockPrisma.proposals.findUnique.mockResolvedValue(rejectedProposal);

        // Act & Assert
        await expect(
          proposalService.accept(mockProposal.id, mockProjectLeader.id)
        ).rejects.toThrow(ValidationError);
        await expect(
          proposalService.accept(mockProposal.id, mockProjectLeader.id)
        ).rejects.toThrow('Only PENDING proposals can be accepted');
      });

      it('should fail if challenge is COMPLETED', async () => {
        // Arrange
        const completedChallengeProposal = {
          ...mockProposal,
          challenge: {
            ...mockProposal.challenge,
            status: ChallengeStatus.COMPLETED,
          },
        };
        mockPrisma.proposals.findUnique.mockResolvedValue(completedChallengeProposal);

        // Act & Assert
        await expect(
          proposalService.accept(mockProposal.id, mockProjectLeader.id)
        ).rejects.toThrow(ValidationError);
        await expect(
          proposalService.accept(mockProposal.id, mockProjectLeader.id)
        ).rejects.toThrow('Cannot accept proposals for completed challenges');
      });
    });
  });

  describe('reject()', () => {
    const rejectedProposal = {
      ...mockProposal,
      status: ProposalStatus.REJECTED,
      respondedBy: mockProjectLeader.id,
      respondedAt: new Date(),
      responseMessage: 'Not a good fit',
      responder: {
        id: mockProjectLeader.id,
        email: mockProjectLeader.email,
      },
    };

    describe('Success Cases', () => {
      it('should reject proposal successfully', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);
        mockPrisma.proposals.update.mockResolvedValue(rejectedProposal);
        mockEventService.emit.mockResolvedValue({} as any);

        // Act
        const result = await proposalService.reject(
          mockProposal.id,
          mockProjectLeader.id,
          'Not a good fit'
        );

        // Assert
        expect(result.status).toBe(ProposalStatus.REJECTED);
        expect(result.respondedBy).toBe(mockProjectLeader.id);
      });

      it('should emit REJECT_PROPOSAL event', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);
        mockPrisma.proposals.update.mockResolvedValue(rejectedProposal);
        mockEventService.emit.mockResolvedValue({} as any);

        // Act
        await proposalService.reject(mockProposal.id, mockProjectLeader.id);

        // Assert
        expect(mockEventService.emit).toHaveBeenCalledWith({
          actorId: mockProjectLeader.id,
          entityType: 'PROPOSAL',
          entityId: mockProposal.id,
          action: 'REJECT_PROPOSAL',
          snapshot: expect.any(Object),
          metadata: expect.objectContaining({
            previousStatus: ProposalStatus.PENDING,
            newStatus: ProposalStatus.REJECTED,
          }),
        });
      });
    });

    describe('Validation Errors', () => {
      it('should fail if not Project Leader', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);

        // Act & Assert
        await expect(
          proposalService.reject(mockProposal.id, mockContributor.id)
        ).rejects.toThrow(AuthorizationError);
        await expect(
          proposalService.reject(mockProposal.id, mockContributor.id)
        ).rejects.toThrow('Only the Project Leader can reject proposals');
      });
    });
  });

  describe('withdraw()', () => {
    const withdrawnProposal = {
      ...mockProposal,
      status: ProposalStatus.WITHDRAWN,
    };

    describe('Success Cases', () => {
      it('should withdraw proposal successfully', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);
        mockPrisma.proposals.update.mockResolvedValue(withdrawnProposal);
        mockEventService.emit.mockResolvedValue({} as any);

        // Act
        const result = await proposalService.withdraw(mockProposal.id, mockContributor.id);

        // Assert
        expect(result.status).toBe(ProposalStatus.WITHDRAWN);
      });

      it('should emit WITHDRAW_PROPOSAL event', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);
        mockPrisma.proposals.update.mockResolvedValue(withdrawnProposal);
        mockEventService.emit.mockResolvedValue({} as any);

        // Act
        await proposalService.withdraw(mockProposal.id, mockContributor.id);

        // Assert
        expect(mockEventService.emit).toHaveBeenCalledWith({
          actorId: mockContributor.id,
          entityType: 'PROPOSAL',
          entityId: mockProposal.id,
          action: 'WITHDRAW_PROPOSAL',
          snapshot: expect.any(Object),
          metadata: expect.objectContaining({
            previousStatus: ProposalStatus.PENDING,
            newStatus: ProposalStatus.WITHDRAWN,
          }),
        });
      });
    });

    describe('Validation Errors', () => {
      it('should fail if not contributor', async () => {
        // Arrange
        mockPrisma.proposals.findUnique.mockResolvedValue(mockProposal);

        // Act & Assert
        await expect(
          proposalService.withdraw(mockProposal.id, mockProjectLeader.id)
        ).rejects.toThrow(AuthorizationError);
        await expect(
          proposalService.withdraw(mockProposal.id, mockProjectLeader.id)
        ).rejects.toThrow('Only the proposal creator can withdraw it');
      });

      it('should fail if proposal not PENDING', async () => {
        // Arrange
        const acceptedProposal = { ...mockProposal, status: ProposalStatus.ACCEPTED };
        mockPrisma.proposals.findUnique.mockResolvedValue(acceptedProposal);

        // Act & Assert
        await expect(
          proposalService.withdraw(mockProposal.id, mockContributor.id)
        ).rejects.toThrow(ValidationError);
        await expect(
          proposalService.withdraw(mockProposal.id, mockContributor.id)
        ).rejects.toThrow('Only PENDING proposals can be withdrawn');
      });
    });
  });
});
