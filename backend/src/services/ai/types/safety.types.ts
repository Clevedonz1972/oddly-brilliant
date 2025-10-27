// /src/services/ai/types/safety.types.ts

export type SafetyCategory =
  | 'harassment'
  | 'hate'
  | 'selfHarm'
  | 'violence'
  | 'sexual'
  | 'spam';

export interface SafetyAnalysisResult {
  overallScore: number; // 0.0 - 1.0
  categories: Record<SafetyCategory, number>;
  confidence: number; // 0.0 - 1.0
  detectionMethod: 'LOCAL' | 'API' | 'LOCAL+API' | 'MANUAL';
  flagged: boolean;
  autoBlocked: boolean;
}

export interface SafetyModerationInput {
  content: string;
  entityType: string;
  entityId: string;
  authorId: string;
}
