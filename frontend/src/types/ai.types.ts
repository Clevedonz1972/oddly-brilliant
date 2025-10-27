/**
 * Type definitions for AI services (Safety, Ethics, Evidence)
 */

// Safety Service Types

export const SafetyCategory = {
  HARASSMENT: 'harassment',
  HATE_SPEECH: 'hate',
  SELF_HARM: 'selfHarm',
  SEXUAL: 'sexual',
  VIOLENCE: 'violence',
  SPAM: 'spam',
  TOXIC: 'toxic',
} as const;

export type SafetyCategory = typeof SafetyCategory[keyof typeof SafetyCategory];

export interface SafetyCategoryScore {
  [key: string]: number; // 0.00 to 1.00
}

export interface SafetyAnalysisResult {
  overallScore: number; // 0.00 = safe, 1.00 = harmful
  categories: SafetyCategoryScore;
  flagged: boolean;
  confidence: number;
  detectionMethod: 'LOCAL' | 'API' | 'MANUAL';
}

export interface SafetyModerationResult {
  id: string;
  entityType: string; // "CONTRIBUTION" | "CHALLENGE" | "COMMENT"
  entityId: string;
  overallScore: number;
  categories: SafetyCategoryScore;
  flagged: boolean;
  autoBlocked: boolean;
  detectionMethod: 'LOCAL' | 'API' | 'MANUAL';
  confidence: number;
  incidentId?: string;
  createdAt: string;
}

export interface AnalyzeContentRequest {
  content: string;
  entityType: string;
  entityId: string;
}

export interface ModerateContentRequest {
  content: string;
}

// Ethics Service Types

export const EthicsRedFlag = {
  SINGLE_CONTRIBUTOR_DOMINANCE: 'SINGLE_CONTRIBUTOR_DOMINANCE',
  UNPAID_WORK: 'UNPAID_WORK',
  SPONSOR_BIAS: 'SPONSOR_BIAS',
  EXCLUSIONARY_BEHAVIOR: 'EXCLUSIONARY_BEHAVIOR',
  UNFAIR_DISTRIBUTION: 'UNFAIR_DISTRIBUTION',
} as const;

export type EthicsRedFlag = typeof EthicsRedFlag[keyof typeof EthicsRedFlag];

export const EthicsGreenFlag = {
  DIVERSE_PARTICIPATION: 'DIVERSE_PARTICIPATION',
  FAIR_TOKEN_DISTRIBUTION: 'FAIR_TOKEN_DISTRIBUTION',
  TRANSPARENT_PROCESS: 'TRANSPARENT_PROCESS',
  INCLUSIVE_COLLABORATION: 'INCLUSIVE_COLLABORATION',
} as const;

export type EthicsGreenFlag = typeof EthicsGreenFlag[keyof typeof EthicsGreenFlag];

export interface EthicsRecommendation {
  type: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface EthicsAuditResult {
  id: string;
  challengeId: string;
  fairnessScore: number; // 0.00 = unfair, 1.00 = fair
  giniCoefficient?: number; // 0-1, inequality measure
  redFlags: string[];
  yellowFlags: string[];
  greenFlags: string[];
  recommendations: EthicsRecommendation[];
  evidenceLinks: string[];
  createdAt: string;
}

export interface EthicsReportSummary {
  challenge: {
    id: string;
    title: string;
    bountyAmount: number;
  };
  audit: EthicsAuditResult;
  contributorCount: number;
  totalValue: number;
}

// Evidence Generator Types

export const EvidencePackageType = {
  PAYOUT_AUDIT: 'PAYOUT_AUDIT',
  COMPLIANCE_REPORT: 'COMPLIANCE_REPORT',
  INCIDENT_EVIDENCE: 'INCIDENT_EVIDENCE',
} as const;

export type EvidencePackageType = typeof EvidencePackageType[keyof typeof EvidencePackageType];

export interface EvidencePackage {
  id: string;
  challengeId: string;
  packageType: string;
  fileName: string;
  fileSize: number;
  storageKey: string;
  sha256: string;
  includesEvents: boolean;
  includesFiles: boolean;
  includesSignatures: boolean;
  includesAIAnalysis: boolean;
  verificationUrl?: string;
  createdAt: string;
}

export interface GenerateEvidenceRequest {
  packageType?: string;
  includeTimeline?: boolean;
  includeFileHashes?: boolean;
  includeSignatures?: boolean;
  includeAIAnalysis?: boolean;
}

export interface GenerateEvidenceResponse {
  packageId: string;
  fileName: string;
  pages: number;
  generatedAt: string;
  verificationUrl?: string;
  sha256: string;
}

export interface VerificationResult {
  packageId: string;
  valid: boolean;
  fileName: string;
  sha256: string;
  generatedAt: string;
  fileExists: boolean;
  hashMatches: boolean;
  message?: string;
}

// API Response Wrappers

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
