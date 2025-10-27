import { PrismaClient, SubmissionStatus, ProposalStatus } from '@prisma/client';
import { generateId } from '../../utils/idGenerator';
import { EventService } from '../events/EventService';
import { FileUploadService, FileMetadata } from '../uploads/FileUploadService';
import { CreateSubmissionDTO } from '../../types';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '../../types';
import { logger } from '../../utils/logger';

/**
 * SubmissionService - Manages work submissions for challenges
 *
 * Business Rules:
 * - Only accepted proposal contributors can create submissions for a challenge
 * - Submissions start in DRAFT status
 * - Contributors can submit (DRAFT → SUBMITTED)
 * - Only Project Leaders can review submissions
 * - Review actions: APPROVE, REJECT, REQUEST_REVISION
 * - File uploads: max 25MB per file, specific allowed types
 * - All state changes logged via EventService
 */
export class SubmissionService {
  private fileUploadService: FileUploadService;

  constructor(
    private prisma: PrismaClient,
    private eventService: EventService
  ) {
    this.fileUploadService = new FileUploadService();
  }

  /**
   * Create a new draft submission
   * Only accepted proposal contributors can create submissions
   */
  async create(contributorId: string, data: CreateSubmissionDTO) {
    // Validate challenge exists
    const challenge = await this.prisma.challenges.findUnique({
      where: { id: data.challengeId },
      include: {
        users_challenges_projectLeaderIdTousers: {
          select: { id: true, email: true },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundError('Challenge');
    }

    // Check if contributor has an accepted proposal for this challenge
    const acceptedProposal = await this.prisma.proposals.findFirst({
      where: {
        challengeId: data.challengeId,
        contributorId,
        status: ProposalStatus.ACCEPTED,
      },
    });

    if (!acceptedProposal) {
      throw new AuthorizationError(
        'You must have an accepted proposal to submit work for this challenge'
      );
    }

    // Check if contributor already has a non-rejected submission
    const existingSubmission = await this.prisma.submissions.findFirst({
      where: {
        challengeId: data.challengeId,
        contributorId,
        status: {
          notIn: [SubmissionStatus.REJECTED],
        },
      },
    });

    if (existingSubmission) {
      throw new ConflictError(
        'You already have an active submission for this challenge. Complete or delete it first.'
      );
    }

    // Create submission
    const submission = await this.prisma.submissions.create({
      data: {
        id: generateId(),
        challengeId: data.challengeId,
        contributorId,
        proposalId: data.proposalId || acceptedProposal.id,
        title: data.title,
        description: data.description,
        status: SubmissionStatus.DRAFT,
      },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        users_submissions_contributorIdTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        submission_files: true,
      },
    });

    // Emit event for audit trail
    await this.eventService.emit({
      actorId: contributorId,
      entityType: 'SUBMISSION',
      entityId: submission.id,
      action: 'submission.created',
      snapshot: {
        challengeId: submission.challengeId,
        challengeTitle: submission.challenges.title,
        title: submission.title,
        description: submission.description,
      },
      metadata: {
        challengeId: data.challengeId,
        proposalId: submission.proposalId,
        status: submission.status,
      },
    });

    logger.info(
      `Submission created: ${submission.id} by ${submission.users_submissions_contributorIdTousers.email}`
    );

    return submission;
  }

  /**
   * Add file to submission
   */
  async addFile(submissionId: string, contributorId: string, fileData: FileMetadata) {
    // Get submission
    const submission = await this.getById(submissionId);

    if (!submission) {
      throw new NotFoundError('Submission');
    }

    // Validate contributor owns the submission
    if (submission.contributorId !== contributorId) {
      throw new AuthorizationError('You can only add files to your own submissions');
    }

    // Validate submission is in DRAFT or REVISION_REQUESTED status
    if (
      submission.status !== SubmissionStatus.DRAFT &&
      submission.status !== SubmissionStatus.REVISION_REQUESTED
    ) {
      throw new ValidationError('Can only add files to DRAFT or REVISION_REQUESTED submissions');
    }

    // Create file record
    const file = await this.prisma.submission_files.create({
      data: {
        id: generateId(),
        submissionId,
        filename: fileData.filename,
        originalName: fileData.originalName,
        mimetype: fileData.mimetype,
        size: fileData.size,
        path: fileData.path,
      },
    });

    // Emit event
    await this.eventService.emit({
      actorId: contributorId,
      entityType: 'SUBMISSION',
      entityId: submissionId,
      action: 'submission.file_added',
      snapshot: {
        fileId: file.id,
        filename: file.originalName,
        size: file.size,
      },
      metadata: {
        fileId: file.id,
        submissionId,
      },
    });

    logger.info(`File added to submission ${submissionId}: ${file.originalName}`);

    return file;
  }

  /**
   * Remove file from submission
   */
  async removeFile(fileId: string, contributorId: string) {
    // Get file with submission
    const file = await this.prisma.submission_files.findUnique({
      where: { id: fileId },
      include: {
        submissions: {
          select: {
            id: true,
            contributorId: true,
            status: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundError('File');
    }

    // Validate contributor owns the submission
    if (file.submissions.contributorId !== contributorId) {
      throw new AuthorizationError('You can only remove files from your own submissions');
    }

    // Validate submission is in DRAFT or REVISION_REQUESTED status
    if (
      file.submissions.status !== SubmissionStatus.DRAFT &&
      file.submissions.status !== SubmissionStatus.REVISION_REQUESTED
    ) {
      throw new ValidationError(
        'Can only remove files from DRAFT or REVISION_REQUESTED submissions'
      );
    }

    // Delete file from storage
    await this.fileUploadService.deleteFile(file.path);

    // Delete file record
    await this.prisma.submission_files.delete({
      where: { id: fileId },
    });

    // Emit event
    await this.eventService.emit({
      actorId: contributorId,
      entityType: 'SUBMISSION',
      entityId: file.submissionId,
      action: 'submission.file_removed',
      snapshot: {
        fileId: file.id,
        filename: file.originalName,
      },
      metadata: {
        fileId: file.id,
        submissionId: file.submissionId,
      },
    });

    logger.info(`File removed from submission ${file.submissionId}: ${file.originalName}`);
  }

  /**
   * Submit submission for review (DRAFT → SUBMITTED)
   */
  async submit(submissionId: string, contributorId: string) {
    // Get submission
    const submission = await this.getById(submissionId);

    if (!submission) {
      throw new NotFoundError('Submission');
    }

    // Validate contributor owns the submission
    if (submission.contributorId !== contributorId) {
      throw new AuthorizationError('You can only submit your own submissions');
    }

    // Validate submission is in DRAFT or REVISION_REQUESTED status
    if (
      submission.status !== SubmissionStatus.DRAFT &&
      submission.status !== SubmissionStatus.REVISION_REQUESTED
    ) {
      throw new ValidationError('Can only submit DRAFT or REVISION_REQUESTED submissions');
    }

    // Update submission
    const updatedSubmission = await this.prisma.submissions.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        users_submissions_contributorIdTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        users_submissions_reviewedByTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        submission_files: true,
      },
    });

    // Emit event
    await this.eventService.emit({
      actorId: contributorId,
      entityType: 'SUBMISSION',
      entityId: submissionId,
      action: 'submission.submitted',
      snapshot: {
        challengeId: submission.challengeId,
        challengeTitle: submission.challenges.title,
        title: submission.title,
        fileCount: updatedSubmission.submission_files.length,
      },
      metadata: {
        submissionId,
        challengeId: submission.challengeId,
        previousStatus: submission.status,
        newStatus: SubmissionStatus.SUBMITTED,
      },
    });

    logger.info(
      `Submission submitted for review: ${submissionId} by ${submission.users_submissions_contributorIdTousers.email}`
    );

    return updatedSubmission;
  }

  /**
   * Start review (SUBMITTED → IN_REVIEW)
   * Only Project Leader can start review
   */
  async startReview(submissionId: string, reviewerId: string) {
    // Get submission with challenge details
    const submission = await this.getById(submissionId);

    if (!submission) {
      throw new NotFoundError('Submission');
    }

    // Validate submission is SUBMITTED
    if (submission.status !== SubmissionStatus.SUBMITTED) {
      throw new ValidationError('Only SUBMITTED submissions can be reviewed');
    }

    // Validate reviewer is Project Leader
    if (submission.challenges.projectLeaderId !== reviewerId) {
      throw new AuthorizationError('Only the Project Leader can review submissions');
    }

    // Update submission
    const updatedSubmission = await this.prisma.submissions.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.IN_REVIEW,
        reviewedBy: reviewerId,
      },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        users_submissions_contributorIdTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        users_submissions_reviewedByTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        submission_files: true,
      },
    });

    // Emit event
    await this.eventService.emit({
      actorId: reviewerId,
      entityType: 'SUBMISSION',
      entityId: submissionId,
      action: 'submission.review_started',
      snapshot: {
        challengeId: submission.challengeId,
        challengeTitle: submission.challenges.title,
        contributorId: submission.contributorId,
        contributorEmail: submission.users_submissions_contributorIdTousers.email,
      },
      metadata: {
        submissionId,
        challengeId: submission.challengeId,
        previousStatus: SubmissionStatus.SUBMITTED,
        newStatus: SubmissionStatus.IN_REVIEW,
      },
    });

    logger.info(
      `Review started for submission ${submissionId} by ${updatedSubmission.users_submissions_reviewedByTousers?.email}`
    );

    return updatedSubmission;
  }

  /**
   * Approve submission
   * Only Project Leader can approve
   */
  async approve(submissionId: string, reviewerId: string, reviewNotes?: string) {
    // Get submission with challenge details
    const submission = await this.getById(submissionId);

    if (!submission) {
      throw new NotFoundError('Submission');
    }

    // Validate submission is IN_REVIEW
    if (submission.status !== SubmissionStatus.IN_REVIEW) {
      throw new ValidationError('Only IN_REVIEW submissions can be approved');
    }

    // Validate reviewer is Project Leader
    if (submission.challenges.projectLeaderId !== reviewerId) {
      throw new AuthorizationError('Only the Project Leader can approve submissions');
    }

    // Update submission
    const updatedSubmission = await this.prisma.submissions.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.APPROVED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
      },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        users_submissions_contributorIdTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        users_submissions_reviewedByTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        submission_files: true,
      },
    });

    // Emit event
    await this.eventService.emit({
      actorId: reviewerId,
      entityType: 'SUBMISSION',
      entityId: submissionId,
      action: 'submission.approved',
      snapshot: {
        challengeId: submission.challengeId,
        challengeTitle: submission.challenges.title,
        contributorId: submission.contributorId,
        contributorEmail: submission.users_submissions_contributorIdTousers.email,
        reviewNotes,
      },
      metadata: {
        submissionId,
        challengeId: submission.challengeId,
        previousStatus: SubmissionStatus.IN_REVIEW,
        newStatus: SubmissionStatus.APPROVED,
      },
    });

    logger.info(
      `Submission approved: ${submissionId} by ${updatedSubmission.users_submissions_reviewedByTousers?.email}`
    );

    return updatedSubmission;
  }

  /**
   * Reject submission
   * Only Project Leader can reject
   */
  async reject(submissionId: string, reviewerId: string, reviewNotes: string) {
    // Get submission with challenge details
    const submission = await this.getById(submissionId);

    if (!submission) {
      throw new NotFoundError('Submission');
    }

    // Validate submission is IN_REVIEW
    if (submission.status !== SubmissionStatus.IN_REVIEW) {
      throw new ValidationError('Only IN_REVIEW submissions can be rejected');
    }

    // Validate reviewer is Project Leader
    if (submission.challenges.projectLeaderId !== reviewerId) {
      throw new AuthorizationError('Only the Project Leader can reject submissions');
    }

    // Validate review notes provided
    if (!reviewNotes || reviewNotes.trim().length === 0) {
      throw new ValidationError('Review notes are required when rejecting a submission');
    }

    // Update submission
    const updatedSubmission = await this.prisma.submissions.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.REJECTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
      },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        users_submissions_contributorIdTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        users_submissions_reviewedByTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        submission_files: true,
      },
    });

    // Emit event
    await this.eventService.emit({
      actorId: reviewerId,
      entityType: 'SUBMISSION',
      entityId: submissionId,
      action: 'submission.rejected',
      snapshot: {
        challengeId: submission.challengeId,
        challengeTitle: submission.challenges.title,
        contributorId: submission.contributorId,
        contributorEmail: submission.users_submissions_contributorIdTousers.email,
        reviewNotes,
      },
      metadata: {
        submissionId,
        challengeId: submission.challengeId,
        previousStatus: SubmissionStatus.IN_REVIEW,
        newStatus: SubmissionStatus.REJECTED,
      },
    });

    logger.info(
      `Submission rejected: ${submissionId} by ${updatedSubmission.users_submissions_reviewedByTousers?.email}`
    );

    return updatedSubmission;
  }

  /**
   * Request revision on submission
   * Only Project Leader can request revision
   */
  async requestRevision(submissionId: string, reviewerId: string, reviewNotes: string) {
    // Get submission with challenge details
    const submission = await this.getById(submissionId);

    if (!submission) {
      throw new NotFoundError('Submission');
    }

    // Validate submission is IN_REVIEW
    if (submission.status !== SubmissionStatus.IN_REVIEW) {
      throw new ValidationError('Only IN_REVIEW submissions can have revisions requested');
    }

    // Validate reviewer is Project Leader
    if (submission.challenges.projectLeaderId !== reviewerId) {
      throw new AuthorizationError('Only the Project Leader can request revisions');
    }

    // Validate review notes provided
    if (!reviewNotes || reviewNotes.trim().length === 0) {
      throw new ValidationError('Review notes are required when requesting revisions');
    }

    // Update submission
    const updatedSubmission = await this.prisma.submissions.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.REVISION_REQUESTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
      },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        users_submissions_contributorIdTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        users_submissions_reviewedByTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        submission_files: true,
      },
    });

    // Emit event
    await this.eventService.emit({
      actorId: reviewerId,
      entityType: 'SUBMISSION',
      entityId: submissionId,
      action: 'submission.revision_requested',
      snapshot: {
        challengeId: submission.challengeId,
        challengeTitle: submission.challenges.title,
        contributorId: submission.contributorId,
        contributorEmail: submission.users_submissions_contributorIdTousers.email,
        reviewNotes,
      },
      metadata: {
        submissionId,
        challengeId: submission.challengeId,
        previousStatus: SubmissionStatus.IN_REVIEW,
        newStatus: SubmissionStatus.REVISION_REQUESTED,
      },
    });

    logger.info(
      `Revision requested for submission ${submissionId} by ${updatedSubmission.users_submissions_reviewedByTousers?.email}`
    );

    return updatedSubmission;
  }

  /**
   * Get submission by ID with all relations
   */
  async getById(id: string) {
    const submission = await this.prisma.submissions.findUnique({
      where: { id },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true,
            projectLeaderId: true,
          },
        },
        users_submissions_contributorIdTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        users_submissions_reviewedByTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        submission_files: {
          orderBy: {
            uploadedAt: 'asc',
          },
        },
      },
    });

    return submission;
  }

  /**
   * Get all submissions for a challenge
   */
  async getByChallenge(challengeId: string) {
    const submissions = await this.prisma.submissions.findMany({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        users_submissions_contributorIdTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        users_submissions_reviewedByTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        submission_files: {
          orderBy: {
            uploadedAt: 'asc',
          },
        },
      },
    });

    return submissions;
  }

  /**
   * Get all submissions by a contributor
   */
  async getByContributor(contributorId: string) {
    const submissions = await this.prisma.submissions.findMany({
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
        users_submissions_contributorIdTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        users_submissions_reviewedByTousers: {
          select: {
            id: true,
            email: true,
          },
        },
        submission_files: {
          orderBy: {
            uploadedAt: 'asc',
          },
        },
      },
    });

    return submissions;
  }
}
