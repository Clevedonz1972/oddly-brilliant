// /src/services/ai/ethics/calculators/FairnessScorer.ts

/**
 * FairnessScorer - Calculates overall fairness score for payout distributions
 *
 * Combines multiple fairness signals:
 * - Gini coefficient (inequality measure)
 * - Red flags (critical issues)
 * - Green flags (positive patterns)
 *
 * Output: Score from 0.0 (extremely unfair) to 1.0 (perfectly fair)
 */
export class FairnessScorer {
  /**
   * Calculate overall fairness score
   *
   * Algorithm:
   * 1. Start at perfect score (1.0)
   * 2. Subtract penalty for inequality (gini * 0.3)
   * 3. Subtract penalty for each red flag (0.15 per flag)
   * 4. Add bonus for each green flag (0.05 per flag)
   * 5. Clamp result to [0.0, 1.0]
   *
   * @param gini - Gini coefficient (0.0 - 1.0)
   * @param redFlags - Number of critical issues detected
   * @param greenFlags - Number of positive patterns detected
   * @returns Fairness score (0.0 - 1.0)
   *
   * @example
   * calculateFairnessScore(0.3, 0, 3) // Good distribution, no issues → 0.85
   * calculateFairnessScore(0.7, 2, 0) // High inequality, 2 red flags → 0.29
   * calculateFairnessScore(0.0, 0, 4) // Perfect equality, 4 green flags → 1.0
   */
  calculateFairnessScore(
    gini: number,
    redFlags: number,
    greenFlags: number
  ): number {
    // Step 1: Start at perfect fairness
    let score = 1.0;

    // Step 2: Penalize for inequality
    // Gini penalty: 0.0-1.0 scaled by 0.3 weight
    // Example: Gini 0.7 → penalty of 0.21
    const giniPenalty = gini * 0.3;
    score -= giniPenalty;

    // Step 3: Penalize for red flags
    // Each red flag reduces score by 0.15
    // Example: 2 red flags → penalty of 0.30
    const redFlagPenalty = redFlags * 0.15;
    score -= redFlagPenalty;

    // Step 4: Reward for green flags
    // Each green flag increases score by 0.05
    // Example: 3 green flags → bonus of 0.15
    const greenFlagBonus = greenFlags * 0.05;
    score += greenFlagBonus;

    // Step 5: Clamp to valid range [0.0, 1.0]
    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Interpret fairness score as a category
   *
   * @param score - Fairness score (0.0 - 1.0)
   * @returns Category string
   */
  interpretScore(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
    if (score >= 0.85) return 'EXCELLENT'; // Highly fair distribution
    if (score >= 0.7)  return 'GOOD';      // Acceptable fairness
    if (score >= 0.5)  return 'FAIR';      // Marginal fairness
    if (score >= 0.3)  return 'POOR';      // Significant issues
    return 'CRITICAL';                      // Critical fairness violations
  }

  /**
   * Determine if a score passes minimum threshold
   *
   * @param score - Fairness score (0.0 - 1.0)
   * @param threshold - Minimum acceptable score (default: 0.7)
   * @returns True if score meets or exceeds threshold
   */
  passesThreshold(score: number, threshold: number = 0.7): boolean {
    return score >= threshold;
  }
}
