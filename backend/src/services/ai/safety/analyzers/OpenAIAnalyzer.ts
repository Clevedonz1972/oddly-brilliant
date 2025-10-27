// /src/services/ai/safety/analyzers/OpenAIAnalyzer.ts

import OpenAI from 'openai';
import { SafetyAnalysisResult, SafetyCategory } from '../../types/safety.types';

export class OpenAIAnalyzer {
  private client: OpenAI | null = null;
  private enabled: boolean;

  constructor() {
    // Only initialize if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORG_ID,
      });
      this.enabled = true;
    } else {
      this.enabled = false;
      console.warn('[OpenAIAnalyzer] No API key found - fallback disabled');
    }
  }

  /**
   * Analyze content using OpenAI Moderation API
   * NOTE: Free tier available, no cost for moderate usage
   */
  async analyze(content: string): Promise<Omit<SafetyAnalysisResult, 'detectionMethod' | 'flagged' | 'autoBlocked'>> {
    if (!this.enabled || !this.client) {
      throw new Error('OpenAI analyzer not enabled (no API key)');
    }

    try {
      const response = await this.client.moderations.create({
        input: content,
      });

      const result = response.results[0];

      // Map OpenAI categories to our categories
      const categories: Record<SafetyCategory, number> = {
        harassment: result.category_scores.harassment + result.category_scores['harassment/threatening'],
        hate: result.category_scores.hate + result.category_scores['hate/threatening'],
        selfHarm: result.category_scores['self-harm'] + result.category_scores['self-harm/intent'] + result.category_scores['self-harm/instructions'],
        violence: result.category_scores.violence + result.category_scores['violence/graphic'],
        sexual: result.category_scores.sexual + result.category_scores['sexual/minors'],
        spam: 0, // OpenAI doesn't detect spam
      };

      // Overall score is max of any category
      const overallScore = Math.max(...Object.values(categories));

      // OpenAI provides high confidence results
      const confidence = 0.95;

      return {
        overallScore,
        categories,
        confidence,
      };
    } catch (error) {
      console.error('[OpenAIAnalyzer] API error:', error);
      throw error;
    }
  }
}
