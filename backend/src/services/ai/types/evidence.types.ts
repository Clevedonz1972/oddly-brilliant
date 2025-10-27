// /src/services/ai/types/evidence.types.ts

export type EvidencePackageType =
  | 'PAYOUT_AUDIT'
  | 'COMPLIANCE_REPORT'
  | 'INCIDENT_EVIDENCE'
  | 'ETHICS_CERTIFICATION';

export interface EvidencePackageData {
  challengeId: string;
  packageType: EvidencePackageType;
  includeTimeline: boolean;
  includeFileHashes: boolean;
  includeSignatures: boolean;
  includeAIAnalysis: boolean;
}

export interface GeneratedEvidence {
  fileName: string;
  buffer: Buffer;
  metadata: {
    pages: number;
    generatedAt: string;
    verificationUrl: string;
    sha256: string;
  };
}
