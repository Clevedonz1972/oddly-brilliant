/**
 * Type definitions for the Submission system
 */

export const SubmissionStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED'
} as const;

export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus];

export interface SubmissionFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: string;
}

export interface Submission {
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
  status: SubmissionStatus;
  submittedAt?: string;
  reviewedBy?: {
    id: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  files: SubmissionFile[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionData {
  challengeId: string;
  proposalId?: string;
  title: string;
  description: string;
}

export interface ReviewSubmissionData {
  reviewNotes?: string;
}
