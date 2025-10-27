// /src/services/ai/types/ethics.types.ts

export type RedFlag =
  | 'SINGLE_CONTRIBUTOR_DOMINANCE' // One person >70% payout
  | 'UNPAID_WORK_DETECTED'          // Contributors with 0 payout
  | 'EXTREME_INEQUALITY'            // Gini > 0.7
  | 'MISSING_ATTRIBUTION'           // Contributions without manifest entry
  | 'SUSPICIOUS_TIMING'             // Manifest signed <1hr before payout
  | 'UNEXPLAINED_VARIANCE'          // Payout != manifest weights
  | 'NO_DIVERSE_ROLES'              // All contributors same type
  | 'EXPLOITATION_PATTERN';         // Historical pattern of unfairness

export interface EthicsAuditResult {
  fairnessScore: number; // 0.0 - 1.0
  giniCoefficient: number; // 0.0 - 1.0 (0 = perfect equality)
  redFlags: RedFlag[];
  yellowFlags: string[];
  greenFlags: string[];
  recommendations: Recommendation[];
  evidenceLinks: string[];
}

export interface Recommendation {
  type: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
  description: string;
  actionRequired: boolean;
}
