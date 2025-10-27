/**
 * Type definitions for the oddly-brilliant platform
 */

export const ChallengeStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
} as const;

export type ChallengeStatus = typeof ChallengeStatus[keyof typeof ChallengeStatus];

export const ContributionType = {
  CODE: 'CODE',
  DESIGN: 'DESIGN',
  IDEA: 'IDEA',
  RESEARCH: 'RESEARCH',
} as const;

export type ContributionType = typeof ContributionType[keyof typeof ContributionType];

export interface User {
  id: string;
  email: string;
  walletAddress?: string;
  profile?: {
    name?: string;
    bio?: string;
    avatar?: string;
    thinkingStyle?: string;
    interests?: string;
    displayName?: string;
  };
  createdAt: string;
  stats?: {
    totalContributions?: number;
    tokensEarned?: number;
    challengesCreated?: number;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  bountyAmount: number;
  status: ChallengeStatus;
  sponsorId: string;
  sponsor: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  contributionCount?: number;
}

export interface Contribution {
  id: string;
  challengeId: string;
  userId: string;
  content: string;
  type: ContributionType;
  tokenValue: number;
  createdAt: string;
  updatedAt?: string;
  user?: User;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Payment {
  id: string;
  challengeId: string;
  userId: string;
  amount: number;
  method: 'CRYPTO' | 'FIAT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  blockchainTxHash?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface PaymentSplit {
  userId: string;
  contributionId: string;
  percentage: number;
  amount: number;
  tokenValue: number;
}

export interface PaymentSummary {
  totalAmount: number;
  totalRecipients: number;
  splits: PaymentSplit[];
}

export interface CompleteChallengeResponse {
  challenge: Challenge;
  payments: Payment[];
  paymentSummary: PaymentSummary;
}
