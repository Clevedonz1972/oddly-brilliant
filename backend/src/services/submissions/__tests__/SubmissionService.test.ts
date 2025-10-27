import { PrismaClient, SubmissionStatus, ProposalStatus, ChallengeStatus } from '@prisma/client';
import { SubmissionService } from '../SubmissionService';
import { EventService } from '../../events/EventService';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '../../../types';
import { generateId } from '../../../utils/idGenerator';

// Mock Prisma Client
jest.mock('@prisma/client');
jest.mock('../../../utils/idGenerator');

describe('SubmissionService', () => {
  let submissionService: SubmissionService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockEventService: jest.Mocked<EventService>;

  // Test data
  const mockUserId = 'user-123';
  const mockChallengeId = 'challenge-123';
  const mockProposalId = 'proposal-123';
  const mockSubmissionId = 'submission-123';
  const mockFileId = 'file-123';
  const mockProjectLeaderId = 'leader-123';

  const mockChallenge = {
    id: mockChallengeId,
    title: 'Test Challenge',
    description: 'Test Description',
    bountyAmount: 1000,
    status: ChallengeStatus.OPEN,
    sponsorId: 'sponsor-123',
    projectLeaderId: mockProjectLeaderId,
    createdAt: new Date(),
    updatedAt: new Date(),
    users_challenges_projectLeaderIdTousers: {
      id: mockProjectLeaderId,
      email: 'leader@test.com',
    },
  };

  const mockProposal = {
    id: mockProposalId,
    challengeId: mockChallengeId,
    contributorId: mockUserId,
    status: ProposalStatus.ACCEPTED,
    message: 'Test proposal',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubmission = {
    id: mockSubmissionId,
    challengeId: mockChallengeId,
    contributorId: mockUserId,
    proposalId: mockProposalId,
    title: 'Test Submission',
    description: 'Test submission description',
    status: SubmissionStatus.DRAFT,
    submittedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    challenges: {
      id: mockChallengeId,
      title: 'Test Challenge',
      status: ChallengeStatus.OPEN,
      projectLeaderId: mockProjectLeaderId,
    },
    users_submissions_contributorIdTousers: {
      id: mockUserId,
      email: 'user@test.com',
    },
    users_submissions_reviewedByTousers: null,
    submission_files: [],
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock Prisma client
    mockPrisma = {
      challenges: {
        findUnique: jest.fn(),
      },
      proposals: {
        findFirst: jest.fn(),
      },
      submissions: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      submission_files: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    } as any;

    // Create mock event service
    mockEventService = {
      emit: jest.fn().mockResolvedValue({}),
    } as any;

    // Create service instance
    submissionService = new SubmissionService(mockPrisma, mockEventService);

    // Mock generateId
    (generateId as jest.Mock).mockReturnValue(mockSubmissionId);
  });

  describe('create', () => {
    it('should create a draft submission successfully', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge as any);
      mockPrisma.proposals.findFirst.mockResolvedValue(mockProposal as any);
      mockPrisma.submissions.findFirst.mockResolvedValue(null);
      mockPrisma.submissions.create.mockResolvedValue(mockSubmission as any);

      const result = await submissionService.create(mockUserId, {
        challengeId: mockChallengeId,
        title: 'Test Submission',
        description: 'Test submission description',
      });

      expect(result).toEqual(mockSubmission);
      expect(mockPrisma.submissions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubmissionStatus.DRAFT,
            contributorId: mockUserId,
          }),
        })
      );
      expect(mockEventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'submission.created',
        })
      );
    });

    it('should throw NotFoundError if challenge does not exist', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue(null);

      await expect(
        submissionService.create(mockUserId, {
          challengeId: mockChallengeId,
          title: 'Test Submission',
          description: 'Test submission description',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if contributor has no accepted proposal', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge as any);
      mockPrisma.proposals.findFirst.mockResolvedValue(null);

      await expect(
        submissionService.create(mockUserId, {
          challengeId: mockChallengeId,
          title: 'Test Submission',
          description: 'Test submission description',
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw ConflictError if contributor already has an active submission', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge as any);
      mockPrisma.proposals.findFirst.mockResolvedValue(mockProposal as any);
      mockPrisma.submissions.findFirst.mockResolvedValue(mockSubmission as any);

      await expect(
        submissionService.create(mockUserId, {
          challengeId: mockChallengeId,
          title: 'Test Submission',
          description: 'Test submission description',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('addFile', () => {
    const mockFileMetadata = {
      filename: 'test_file.pdf',
      originalName: 'test file.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      path: '/uploads/test_file.pdf',
    };

    const mockFile = {
      id: mockFileId,
      submissionId: mockSubmissionId,
      ...mockFileMetadata,
      uploadedAt: new Date(),
    };

    it('should add file to submission successfully', async () => {
      mockPrisma.submissions.findUnique.mockResolvedValue(mockSubmission as any);
      mockPrisma.submission_files.create.mockResolvedValue(mockFile as any);

      const result = await submissionService.addFile(
        mockSubmissionId,
        mockUserId,
        mockFileMetadata
      );

      expect(result).toEqual(mockFile);
      expect(mockPrisma.submission_files.create).toHaveBeenCalled();
      expect(mockEventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'submission.file_added',
        })
      );
    });

    it('should throw NotFoundError if submission does not exist', async () => {
      mockPrisma.submissions.findUnique.mockResolvedValue(null);

      await expect(
        submissionService.addFile(mockSubmissionId, mockUserId, mockFileMetadata)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if user is not the contributor', async () => {
      mockPrisma.submissions.findUnique.mockResolvedValue({
        ...mockSubmission,
        contributorId: 'different-user-id',
      } as any);

      await expect(
        submissionService.addFile(mockSubmissionId, mockUserId, mockFileMetadata)
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw ValidationError if submission is not in DRAFT or REVISION_REQUESTED status', async () => {
      mockPrisma.submissions.findUnique.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.SUBMITTED,
      } as any);

      await expect(
        submissionService.addFile(mockSubmissionId, mockUserId, mockFileMetadata)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('submit', () => {
    it('should submit submission for review successfully', async () => {
      const submittedSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      };
      mockPrisma.submissions.findUnique.mockResolvedValue(mockSubmission as any);
      mockPrisma.submissions.update.mockResolvedValue(submittedSubmission as any);

      const result = await submissionService.submit(mockSubmissionId, mockUserId);

      expect(result.status).toBe(SubmissionStatus.SUBMITTED);
      expect(mockPrisma.submissions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubmissionStatus.SUBMITTED,
          }),
        })
      );
      expect(mockEventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'submission.submitted',
        })
      );
    });

    it('should throw AuthorizationError if user is not the contributor', async () => {
      mockPrisma.submissions.findUnique.mockResolvedValue({
        ...mockSubmission,
        contributorId: 'different-user-id',
      } as any);

      await expect(submissionService.submit(mockSubmissionId, mockUserId)).rejects.toThrow(
        AuthorizationError
      );
    });

    it('should throw ValidationError if submission is not in DRAFT or REVISION_REQUESTED status', async () => {
      mockPrisma.submissions.findUnique.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.APPROVED,
      } as any);

      await expect(submissionService.submit(mockSubmissionId, mockUserId)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('startReview', () => {
    it('should start review successfully', async () => {
      const submittedSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.SUBMITTED,
      };
      const reviewingSubmission = {
        ...submittedSubmission,
        status: SubmissionStatus.IN_REVIEW,
        reviewedBy: mockProjectLeaderId,
      };

      mockPrisma.submissions.findUnique.mockResolvedValue(submittedSubmission as any);
      mockPrisma.submissions.update.mockResolvedValue(reviewingSubmission as any);

      const result = await submissionService.startReview(
        mockSubmissionId,
        mockProjectLeaderId
      );

      expect(result.status).toBe(SubmissionStatus.IN_REVIEW);
      expect(mockEventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'submission.review_started',
        })
      );
    });

    it('should throw AuthorizationError if user is not the project leader', async () => {
      const submittedSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.SUBMITTED,
      };
      mockPrisma.submissions.findUnique.mockResolvedValue(submittedSubmission as any);

      await expect(
        submissionService.startReview(mockSubmissionId, 'not-leader-id')
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw ValidationError if submission is not in SUBMITTED status', async () => {
      mockPrisma.submissions.findUnique.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.DRAFT,
      } as any);

      await expect(
        submissionService.startReview(mockSubmissionId, mockProjectLeaderId)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('approve', () => {
    it('should approve submission successfully', async () => {
      const reviewingSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.IN_REVIEW,
      };
      const approvedSubmission = {
        ...reviewingSubmission,
        status: SubmissionStatus.APPROVED,
        reviewedBy: mockProjectLeaderId,
        reviewedAt: new Date(),
        reviewNotes: 'Great work!',
      };

      mockPrisma.submissions.findUnique.mockResolvedValue(reviewingSubmission as any);
      mockPrisma.submissions.update.mockResolvedValue(approvedSubmission as any);

      const result = await submissionService.approve(
        mockSubmissionId,
        mockProjectLeaderId,
        'Great work!'
      );

      expect(result.status).toBe(SubmissionStatus.APPROVED);
      expect(mockEventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'submission.approved',
        })
      );
    });

    it('should throw AuthorizationError if user is not the project leader', async () => {
      const reviewingSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.IN_REVIEW,
      };
      mockPrisma.submissions.findUnique.mockResolvedValue(reviewingSubmission as any);

      await expect(
        submissionService.approve(mockSubmissionId, 'not-leader-id', 'Notes')
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('reject', () => {
    it('should reject submission successfully with notes', async () => {
      const reviewingSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.IN_REVIEW,
      };
      const rejectedSubmission = {
        ...reviewingSubmission,
        status: SubmissionStatus.REJECTED,
        reviewedBy: mockProjectLeaderId,
        reviewedAt: new Date(),
        reviewNotes: 'Does not meet requirements',
      };

      mockPrisma.submissions.findUnique.mockResolvedValue(reviewingSubmission as any);
      mockPrisma.submissions.update.mockResolvedValue(rejectedSubmission as any);

      const result = await submissionService.reject(
        mockSubmissionId,
        mockProjectLeaderId,
        'Does not meet requirements'
      );

      expect(result.status).toBe(SubmissionStatus.REJECTED);
      expect(mockEventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'submission.rejected',
        })
      );
    });

    it('should throw ValidationError if review notes are empty', async () => {
      const reviewingSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.IN_REVIEW,
      };
      mockPrisma.submissions.findUnique.mockResolvedValue(reviewingSubmission as any);

      await expect(
        submissionService.reject(mockSubmissionId, mockProjectLeaderId, '')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('requestRevision', () => {
    it('should request revision successfully with notes', async () => {
      const reviewingSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.IN_REVIEW,
      };
      const revisionRequestedSubmission = {
        ...reviewingSubmission,
        status: SubmissionStatus.REVISION_REQUESTED,
        reviewedBy: mockProjectLeaderId,
        reviewedAt: new Date(),
        reviewNotes: 'Please fix the following issues...',
      };

      mockPrisma.submissions.findUnique.mockResolvedValue(reviewingSubmission as any);
      mockPrisma.submissions.update.mockResolvedValue(revisionRequestedSubmission as any);

      const result = await submissionService.requestRevision(
        mockSubmissionId,
        mockProjectLeaderId,
        'Please fix the following issues...'
      );

      expect(result.status).toBe(SubmissionStatus.REVISION_REQUESTED);
      expect(mockEventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'submission.revision_requested',
        })
      );
    });

    it('should throw ValidationError if review notes are empty', async () => {
      const reviewingSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.IN_REVIEW,
      };
      mockPrisma.submissions.findUnique.mockResolvedValue(reviewingSubmission as any);

      await expect(
        submissionService.requestRevision(mockSubmissionId, mockProjectLeaderId, '')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getById', () => {
    it('should retrieve submission by ID with all relations', async () => {
      mockPrisma.submissions.findUnique.mockResolvedValue(mockSubmission as any);

      const result = await submissionService.getById(mockSubmissionId);

      expect(result).toEqual(mockSubmission);
      expect(mockPrisma.submissions.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSubmissionId },
          include: expect.any(Object),
        })
      );
    });

    it('should return null if submission does not exist', async () => {
      mockPrisma.submissions.findUnique.mockResolvedValue(null);

      const result = await submissionService.getById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getByChallenge', () => {
    it('should retrieve all submissions for a challenge', async () => {
      const mockSubmissions = [mockSubmission, { ...mockSubmission, id: 'submission-456' }];
      mockPrisma.submissions.findMany.mockResolvedValue(mockSubmissions as any);

      const result = await submissionService.getByChallenge(mockChallengeId);

      expect(result).toEqual(mockSubmissions);
      expect(mockPrisma.submissions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { challengeId: mockChallengeId },
        })
      );
    });
  });

  describe('getByContributor', () => {
    it('should retrieve all submissions by a contributor', async () => {
      const mockSubmissions = [mockSubmission, { ...mockSubmission, id: 'submission-456' }];
      mockPrisma.submissions.findMany.mockResolvedValue(mockSubmissions as any);

      const result = await submissionService.getByContributor(mockUserId);

      expect(result).toEqual(mockSubmissions);
      expect(mockPrisma.submissions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contributorId: mockUserId },
        })
      );
    });
  });
});
