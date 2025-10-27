// /src/services/ai/safety/analyzers/LocalAnalyzer.ts

import compromise from 'compromise';
import { SafetyAnalysisResult, SafetyCategory } from '../../types/safety.types';
import {
  customProfanityList,
  harassmentPatterns,
  selfHarmIndicators,
  spamPatterns,
} from '../rules/profanityRules';

export class LocalAnalyzer {
  private filter: any;
  private filterInitialized: boolean = false;

  constructor() {
    // Filter will be initialized lazily on first use
    this.initializeFilter();
  }

  private async initializeFilter() {
    if (this.filterInitialized) return;

    try {
      // Dynamic import for ES module compatibility
      const FilterModule = await import('bad-words');
      const Filter = FilterModule.default || FilterModule;
      this.filter = new (Filter as any)();
      this.filter.addWords(...customProfanityList);
      this.filterInitialized = true;
    } catch (error) {
      console.warn('Failed to load bad-words filter, using basic profanity detection:', error);
      // Fallback: simple profanity detection without bad-words
      this.filter = {
        isProfane: (text: string) => customProfanityList.some(word => text.toLowerCase().includes(word.toLowerCase())),
        clean: (text: string) => {
          let cleaned = text;
          customProfanityList.forEach(word => {
            const regex = new RegExp(word, 'gi');
            cleaned = cleaned.replace(regex, '*'.repeat(word.length));
          });
          return cleaned;
        },
      };
      this.filterInitialized = true;
    }
  }

  /**
   * Analyze content using local NLP and pattern matching
   */
  async analyze(content: string): Promise<Omit<SafetyAnalysisResult, 'detectionMethod' | 'flagged' | 'autoBlocked'>> {
    // Ensure filter is initialized
    await this.initializeFilter();
    const categories: Record<SafetyCategory, number> = {
      harassment: this.detectHarassment(content),
      hate: this.detectHate(content),
      selfHarm: this.detectSelfHarm(content),
      violence: this.detectViolence(content),
      sexual: this.detectSexual(content),
      spam: this.detectSpam(content),
    };

    // Calculate overall score (weighted average)
    const weights = {
      harassment: 1.2,
      hate: 1.5,
      selfHarm: 2.0,
      violence: 1.3,
      sexual: 1.0,
      spam: 0.5,
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const overallScore = Object.entries(categories).reduce(
      (score, [category, value]) => {
        const weight = weights[category as SafetyCategory];
        return score + (value * weight) / totalWeight;
      },
      0
    );

    // Confidence is higher for extreme scores
    const confidence = Math.min(
      0.95,
      0.6 + Math.abs(overallScore - 0.5) * 0.7
    );

    return {
      overallScore: Math.min(1.0, overallScore),
      categories,
      confidence,
    };
  }

  private detectHarassment(content: string): number {
    let score = 0;

    // Check harassment patterns
    for (const pattern of harassmentPatterns) {
      if (pattern.test(content)) {
        score += 0.3;
      }
    }

    // Check for aggressive tone
    const doc = compromise(content);
    const negatives = doc.match('#Negative').length;
    const total = doc.terms().length;
    if (total > 0 && negatives / total > 0.3) {
      score += 0.2;
    }

    // Check for profanity
    if (this.filter.isProfane(content)) {
      score += 0.4;
    }

    return Math.min(1.0, score);
  }

  private detectHate(content: string): number {
    let score = 0;

    // Use bad-words library
    if (this.filter.isProfane(content)) {
      const cleanedLength = this.filter.clean(content).replace(/\*/g, '').length;
      const originalLength = content.length;
      const profanityRatio = 1 - (cleanedLength / originalLength);
      score += profanityRatio * 0.8;
    }

    // Check for hate speech patterns (simplified for now)
    const hateSpeechKeywords = ['hate', 'disgust', 'subhuman', 'vermin'];
    const lowerContent = content.toLowerCase();
    for (const keyword of hateSpeechKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.25;
      }
    }

    return Math.min(1.0, score);
  }

  private detectSelfHarm(content: string): number {
    let score = 0;

    for (const indicator of selfHarmIndicators) {
      if (indicator.test(content)) {
        score += 0.5; // High weight for self-harm
      }
    }

    return Math.min(1.0, score);
  }

  private detectViolence(content: string): number {
    let score = 0;

    const violenceKeywords = ['kill', 'murder', 'attack', 'destroy', 'harm', 'hurt'];
    const doc = compromise(content);
    const lowerContent = content.toLowerCase();

    for (const keyword of violenceKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.15;
      }
    }

    // Check for weapons
    const weapons = doc.match('(gun|knife|weapon|bomb)').length;
    if (weapons > 0) {
      score += weapons * 0.2;
    }

    return Math.min(1.0, score);
  }

  private detectSexual(content: string): number {
    let score = 0;

    // Let bad-words handle most sexual content
    if (this.filter.isProfane(content)) {
      const sexualTerms = ['sex', 'sexual', 'porn', 'nude', 'naked'];
      const lowerContent = content.toLowerCase();
      for (const term of sexualTerms) {
        if (lowerContent.includes(term)) {
          score += 0.3;
        }
      }
    }

    return Math.min(1.0, score);
  }

  private detectSpam(content: string): number {
    let score = 0;

    for (const pattern of spamPatterns) {
      if (pattern.test(content)) {
        score += 0.2;
      }
    }

    // Check for excessive capitalization
    const caps = content.replace(/[^A-Z]/g, '').length;
    const letters = content.replace(/[^A-Za-z]/g, '').length;
    if (letters > 0 && caps / letters > 0.6) {
      score += 0.3;
    }

    // Check for excessive punctuation
    const punct = content.replace(/[^!?.]/g, '').length;
    if (punct > 5) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }
}
