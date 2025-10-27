/**
 * Type definitions for Phase 4.1 Governance System
 */

export type ComplianceStatus = 'GREEN' | 'AMBER' | 'RED';

export interface ComplianceCheck {
  name: string;
  status: ComplianceStatus;
  details: string;
  blocksAction?: boolean;
}

export interface Heartbeat {
  overall: ComplianceStatus;
  checks: ComplianceCheck[];
  timestamp: string;
  challengeId?: string;
}

export interface Event {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: {
    id: string;
    email: string;
    role: string;
  };
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface PayoutValidation {
  ok: boolean;
  violations: string[];
  warnings: string[];
  evidencePackUrl?: string;
}

export interface AdminStats {
  totalChallenges: number;
  totalUsers: number;
  totalPayouts: number;
  pendingVetting: number;
}

export interface VettingChallenge {
  id: string;
  title: string;
  description: string;
  bountyAmount: number;
  vettingStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  sponsor: {
    id: string;
    email: string;
  };
}

export interface VettingResponse {
  approved: boolean;
  reason?: string;
}
