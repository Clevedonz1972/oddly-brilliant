/**
 * Type definitions for the Proposal system
 */

export const ProposalStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN'
} as const;

export type ProposalStatus = typeof ProposalStatus[keyof typeof ProposalStatus];

export interface Proposal {
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

export interface CreateProposalData {
  challengeId: string;
  message?: string;
}

export interface RespondToProposalData {
  action: 'ACCEPT' | 'REJECT';
  responseMessage?: string;
}
