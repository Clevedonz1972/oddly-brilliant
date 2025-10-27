// /src/services/ai/safety/SafetyService.ts

import { PrismaClient } from '@prisma/client';
import { BaseAIService } from '../base/BaseAIService';
import { LocalAnalyzer } from './analyzers/LocalAnalyzer';
import { OpenAIAnalyzer } from './analyzers/OpenAIAnalyzer';
import { SafetyAnalysisResult, SafetyCategory } from '../types/safety.types';
import { generateId } from '../../../utils/idGenerator';

export class SafetyService extends BaseAIService {
  private localAnalyzer: LocalAnalyzer;
  private apiAnalyzer: OpenAIAnalyzer;

  constructor(prisma: PrismaClient) {
    super(prisma, 'SAFETY', {
      cacheTTLSeconds: 604800, // 7 days for safety checks
      enableCaching: true,
    });

    this.localAnalyzer = new LocalAnalyzer();
    this.apiAnalyzer = new OpenAIAnalyzer();
  }

  /**
   * Analyze content for safety issues
   * Uses local analysis first, falls back to API for ambiguous cases
   */
  async analyzeContent(params: {
    content: string;
    entityType: string;
    entityId: string;
    authorId: string;
  }): Promise<SafetyAnalysisResult> {
    const inputHash = this.hashInput(params);

    // Check cache
    const cached = await this.checkCache<SafetyAnalysisResult>(inputHash);
    if (cached) return cached;

    // Step 1: Local analysis (fast, private)
    const localResult = await this.localAnalyzer.analyze(params.content);

    // Step 2: If high confidence OR clearly safe/harmful, skip API
    if (localResult.confidence > 0.85 || localResult.overallScore < 0.1 || localResult.overallScore > 0.9) {
      const result: SafetyAnalysisResult = {
        ...localResult,
        detectionMethod: 'LOCAL',
        flagged: localResult.overallScore > 0.4, // More sensitive threshold
        autoBlocked: localResult.overallScore > 0.9,
      };

      // Store in database
      await this.storeResult(params, result);

      // Cache result
      await this.setCache(inputHash, result, localResult.confidence);

      return result;
    }

    // Step 3: Ambiguous case - use API for second opinion
    try {
      const apiResult = await this.withTimeout(
        this.apiAnalyzer.analyze(params.content),
        3000 // 3s timeout
      );

      const result: SafetyAnalysisResult = {
        overallScore: (localResult.overallScore + apiResult.overallScore) / 2,
        categories: this.mergeCategories(localResult.categories, apiResult.categories),
        confidence: Math.min(localResult.confidence, apiResult.confidence),
        detectionMethod: 'LOCAL+API',
        flagged: apiResult.overallScore > 0.4, // More sensitive threshold
        autoBlocked: apiResult.overallScore > 0.9,
      };

      await this.storeResult(params, result);
      await this.setCache(inputHash, result, result.confidence);

      return result;
    } catch (error) {
      // API failed - use local result with lower confidence
      const result: SafetyAnalysisResult = {
        ...localResult,
        confidence: localResult.confidence * 0.8,
        detectionMethod: 'LOCAL',
        flagged: localResult.overallScore > 0.5, // Higher threshold due to uncertainty
        autoBlocked: false, // Don't auto-block without API confirmation
      };

      await this.storeResult(params, result);
      return result;
    }
  }

  /**
   * Auto-flag content and create incident if needed
   */
  async moderateAndFlag(params: {
    content: string;
    entityType: string;
    entityId: string;
    authorId: string;
  }): Promise<{ blocked: boolean; incidentId?: string }> {
    const analysis = await this.analyzeContent(params);

    if (!analysis.flagged) {
      return { blocked: false };
    }

    // Determine severity (1-5)
    const severity = this.calculateSeverity(analysis.overallScore);

    // Create safety incident
    const incident = await this.prisma.safety_incidents.create({
      data: {
        id: generateId(),
        raisedById: 'SYSTEM', // AI-detected (would need a system user ID in production)
        status: 'OPEN',
        category: this.getCategoryName(analysis.categories),
        severity,
        description: `AI-detected safety issue (confidence: ${(analysis.confidence * 100).toFixed(1)}%)`,
        evidenceEventIds: [],
        aiDetected: true,
      },
    });

    return {
      blocked: analysis.autoBlocked,
      incidentId: incident.id,
    };
  }

  // Helper methods

  private async storeResult(
    params: { entityType: string; entityId: string },
    result: SafetyAnalysisResult
  ): Promise<void> {
    await this.prisma.safety_moderation_results.create({
      data: {
        id: generateId(),
        entityType: params.entityType,
        entityId: params.entityId,
        overallScore: result.overallScore,
        categories: result.categories as any,
        flagged: result.flagged,
        autoBlocked: result.autoBlocked,
        detectionMethod: result.detectionMethod,
        confidence: result.confidence,
      },
    });
  }

  private calculateSeverity(score: number): number {
    if (score >= 0.9) return 5; // Critical
    if (score >= 0.75) return 4; // High
    if (score >= 0.6) return 3; // Medium
    if (score >= 0.4) return 2; // Low
    return 1; // Minimal
  }

  private getCategoryName(categories: Record<SafetyCategory, number>): string {
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const map: Record<SafetyCategory, string> = {
      harassment: 'HARASSMENT',
      hate: 'HATE',
      selfHarm: 'SELF_HARM',
      violence: 'VIOLENCE',
      sexual: 'SEXUAL',
      spam: 'SPAM',
    };
    return map[sorted[0][0] as SafetyCategory] || 'OTHER';
  }

  private mergeCategories(
    local: Record<SafetyCategory, number>,
    api: Record<SafetyCategory, number>
  ): Record<SafetyCategory, number> {
    const result: any = {};
    for (const key of Object.keys(local) as SafetyCategory[]) {
      result[key] = (local[key] + api[key]) / 2;
    }
    return result;
  }
}
