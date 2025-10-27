import { Request } from 'express';
import { ChallengeStatus, ContributionType, PaymentMethod, PaymentStatus, ProposalStatus } from '@prisma/client';

/**
 * Express Request with authenticated user information
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    walletAddress?: string;
  };
}

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * User DTOs (Data Transfer Objects)
 */
export interface CreateUserDTO {
  email: string;
  password: string;
  walletAddress?: string;
  profile?: Record<string, unknown>;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  walletAddress?: string;
  profile?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Challenge DTOs
 */
export interface CreateChallengeDTO {
  title: string;
  description: string;
  bountyAmount: number;
  sponsorId: string;
}

export interface UpdateChallengeDTO {
  title?: string;
  description?: string;
  bountyAmount?: number;
  status?: ChallengeStatus;
}

export interface ChallengeResponseDTO {
  id: string;
  title: string;
  description: string;
  bountyAmount: number;
  status: ChallengeStatus;
  sponsorId: string;
  sponsor?: {
    id: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  contributionCount?: number;
}

/**
 * Contribution DTOs
 */
export interface CreateContributionDTO {
  challengeId: string;
  userId: string;
  content: string;
  type: ContributionType;
  tokenValue?: number; // Optional - will be calculated based on type
  blockchainTxHash?: string;
}

export interface ContributionResponseDTO {
  id: string;
  challengeId: string;
  userId: string;
  content: string;
  type: ContributionType;
  tokenValue: number;
  blockchainTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
  };
  challenge?: {
    id: string;
    title: string;
  };
}

/**
 * Payment DTOs
 */
export interface CreatePaymentDTO {
  challengeId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  blockchainTxHash?: string;
}

export interface PaymentResponseDTO {
  id: string;
  challengeId: string;
  userId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  blockchainTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Split calculation result
 */
export interface PaymentSplit {
  userId: string;
  contributionId: string;
  percentage: number;
  amount: number;
  tokenValue: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Custom Error types
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

/**
 * Proposal DTOs
 */
export interface CreateProposalDTO {
  challengeId: string;
  message?: string;
}

export interface RespondToProposalDTO {
  action: 'ACCEPT' | 'REJECT';
  responseMessage?: string;
}

export interface ProposalResponseDTO {
  id: string;
  challengeId: string;
  challenge: {
    id: string;
    title: string;
    status: string;
  };
  contributor: {
    id: string;
    email: string;
  };
  contributorId: string;
  message?: string;
  status: ProposalStatus;
  respondedBy?: {
    id: string;
    email: string;
  };
  respondedAt?: string;
  responseMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Export ProposalStatus for convenience
export { ProposalStatus };

/**
 * Submission DTOs
 */
export interface CreateSubmissionDTO {
  challengeId: string;
  proposalId?: string;
  title: string;
  description: string;
}

export interface SubmitSubmissionDTO {
  submissionId: string;
}

export interface ReviewSubmissionDTO {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  reviewNotes?: string;
}

export interface SubmissionFileDTO {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: string;
}

export interface SubmissionResponseDTO {
  id: string;
  challengeId: string;
  challenge: {
    id: string;
    title: string;
    status: string;
  };
  contributor: {
    id: string;
    email: string;
  };
  contributorId: string;
  proposalId?: string;
  title: string;
  description: string;
  status: string;
  submittedAt?: string;
  reviewedBy?: {
    id: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  files: SubmissionFileDTO[];
  createdAt: string;
  updatedAt: string;
}

// Re-export SubmissionStatus enum from Prisma
export { SubmissionStatus } from '@prisma/client';
