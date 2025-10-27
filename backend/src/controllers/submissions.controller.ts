import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { SubmissionService } from '../services/submissions/SubmissionService';
import { EventService } from '../services/events/EventService';
import { FileUploadService } from '../services/uploads/FileUploadService';
import {
  AuthRequest,
  CreateSubmissionDTO,
  SubmissionResponseDTO,
  SubmissionFileDTO,
  ApiResponse,
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from '../types';
import { logger } from '../utils/logger';

// Initialize services
const eventService = new EventService(prisma);
const submissionService = new SubmissionService(prisma, eventService);
const fileUploadService = new FileUploadService();

/**
 * Submissions Controller - Handles submission-related HTTP requests
 */
export class SubmissionsController {
  /**
   * POST /api/submissions
   * Create a new draft submission
   */
  async createSubmission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const data: CreateSubmissionDTO = req.body;

      const submission = await submissionService.create(req.user.id, data);

      logger.info(`Submission created: ${submission.id} by user ${req.user.email}`);

      // Format response
      const submissionResponse: SubmissionResponseDTO = this.formatSubmission(submission);

      const response: ApiResponse<SubmissionResponseDTO> = {
        success: true,
        data: submissionResponse,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/submissions/:id/files
   * Upload file to submission
   */
  async uploadFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;

      // Check if file was uploaded
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      // Store file
      const fileMetadata = await fileUploadService.storeFile(req.file);

      // Add file to submission
      const file = await submissionService.addFile(id, req.user.id, fileMetadata);

      logger.info(`File uploaded to submission ${id}: ${file.originalName}`);

      // Format response
      const fileResponse: SubmissionFileDTO = {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: file.uploadedAt.toISOString(),
      };

      const response: ApiResponse<SubmissionFileDTO> = {
        success: true,
        data: fileResponse,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/submissions/:id/files/:fileId
   * Remove file from submission
   */
  async removeFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { fileId } = req.params;

      await submissionService.removeFile(fileId, req.user.id);

      logger.info(`File removed from submission: ${fileId}`);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'File removed successfully' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/submissions/:id/submit
   * Submit submission for review
   */
  async submitForReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;

      const submission = await submissionService.submit(id, req.user.id);

      logger.info(`Submission submitted for review: ${id} by user ${req.user.email}`);

      // Format response
      const submissionResponse: SubmissionResponseDTO = this.formatSubmission(submission);

      const response: ApiResponse<SubmissionResponseDTO> = {
        success: true,
        data: submissionResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/submissions/:id/review
   * Start review (Project Leader only)
   */
  async startReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;

      const submission = await submissionService.startReview(id, req.user.id);

      logger.info(`Review started for submission: ${id} by user ${req.user.email}`);

      // Format response
      const submissionResponse: SubmissionResponseDTO = this.formatSubmission(submission);

      const response: ApiResponse<SubmissionResponseDTO> = {
        success: true,
        data: submissionResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/submissions/:id/approve
   * Approve submission (Project Leader only)
   */
  async approveSubmission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;
      const { reviewNotes } = req.body;

      const submission = await submissionService.approve(id, req.user.id, reviewNotes);

      logger.info(`Submission approved: ${id} by user ${req.user.email}`);

      // Format response
      const submissionResponse: SubmissionResponseDTO = this.formatSubmission(submission);

      const response: ApiResponse<SubmissionResponseDTO> = {
        success: true,
        data: submissionResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/submissions/:id/reject
   * Reject submission (Project Leader only)
   */
  async rejectSubmission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;
      const { reviewNotes } = req.body;

      if (!reviewNotes) {
        throw new ValidationError('Review notes are required when rejecting a submission');
      }

      const submission = await submissionService.reject(id, req.user.id, reviewNotes);

      logger.info(`Submission rejected: ${id} by user ${req.user.email}`);

      // Format response
      const submissionResponse: SubmissionResponseDTO = this.formatSubmission(submission);

      const response: ApiResponse<SubmissionResponseDTO> = {
        success: true,
        data: submissionResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/submissions/:id/request-revision
   * Request revision on submission (Project Leader only)
   */
  async requestRevision(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;
      const { reviewNotes } = req.body;

      if (!reviewNotes) {
        throw new ValidationError('Review notes are required when requesting revisions');
      }

      const submission = await submissionService.requestRevision(id, req.user.id, reviewNotes);

      logger.info(`Revision requested for submission: ${id} by user ${req.user.email}`);

      // Format response
      const submissionResponse: SubmissionResponseDTO = this.formatSubmission(submission);

      const response: ApiResponse<SubmissionResponseDTO> = {
        success: true,
        data: submissionResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions/:id
   * Get submission by ID
   */
  async getSubmissionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { id } = req.params;

      const submission = await submissionService.getById(id);

      if (!submission) {
        throw new NotFoundError('Submission');
      }

      // Format response
      const submissionResponse: SubmissionResponseDTO = this.formatSubmission(submission);

      const response: ApiResponse<SubmissionResponseDTO> = {
        success: true,
        data: submissionResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions/my
   * Get all submissions by authenticated user
   */
  async getMySubmissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const submissions = await submissionService.getByContributor(req.user.id);

      // Format response
      const submissionResponses: SubmissionResponseDTO[] = submissions.map((submission) =>
        this.formatSubmission(submission)
      );

      const response: ApiResponse<SubmissionResponseDTO[]> = {
        success: true,
        data: submissionResponses,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/challenges/:challengeId/submissions
   * Get all submissions for a challenge
   */
  async getSubmissionsByChallenge(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { challengeId } = req.params;

      const submissions = await submissionService.getByChallenge(challengeId);

      // Format response
      const submissionResponses: SubmissionResponseDTO[] = submissions.map((submission) =>
        this.formatSubmission(submission)
      );

      const response: ApiResponse<SubmissionResponseDTO[]> = {
        success: true,
        data: submissionResponses,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper method to format submission response
   */
  private formatSubmission(submission: any): SubmissionResponseDTO {
    return {
      id: submission.id,
      challengeId: submission.challengeId,
      challenge: {
        id: submission.challenges.id,
        title: submission.challenges.title,
        status: submission.challenges.status,
      },
      contributor: {
        id: submission.users_submissions_contributorIdTousers.id,
        email: submission.users_submissions_contributorIdTousers.email,
      },
      contributorId: submission.contributorId,
      proposalId: submission.proposalId || undefined,
      title: submission.title,
      description: submission.description,
      status: submission.status,
      submittedAt: submission.submittedAt?.toISOString(),
      reviewedBy: submission.users_submissions_reviewedByTousers
        ? {
            id: submission.users_submissions_reviewedByTousers.id,
            email: submission.users_submissions_reviewedByTousers.email,
          }
        : undefined,
      reviewedAt: submission.reviewedAt?.toISOString(),
      reviewNotes: submission.reviewNotes || undefined,
      files: submission.submission_files.map((file: any) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: file.uploadedAt.toISOString(),
      })),
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
    };
  }
}

export const submissionsController = new SubmissionsController();
