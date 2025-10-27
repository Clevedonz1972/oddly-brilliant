// /src/services/ai/ethics/calculators/GiniCalculator.ts

/**
 * GiniCalculator - Calculates Gini coefficient for inequality measurement
 *
 * Gini coefficient ranges from 0 to 1:
 * - 0 = Perfect equality (everyone gets equal payout)
 * - 1 = Perfect inequality (one person gets everything)
 *
 * Used to detect unfair payout distributions in challenges.
 */
export class GiniCalculator {
  /**
   * Calculate Gini coefficient from payout amounts
   *
   * Formula: Gini = (2 * sum(i * sorted_payout[i])) / (n * sum(payouts)) - (n + 1) / n
   *
   * @param payouts - Array of payout amounts (in any order)
   * @returns Gini coefficient (0.0 - 1.0)
   *
   * @example
   * calculate([100, 100, 100]) // Perfect equality → ~0.0
   * calculate([300, 0, 0])     // Extreme inequality → ~0.67
   * calculate([200, 75, 25])   // Moderate inequality → ~0.42
   */
  calculate(payouts: number[]): number {
    // Edge case: Empty or single payout
    if (payouts.length === 0) {
      return 0;
    }

    if (payouts.length === 1) {
      return 0; // Single recipient = no inequality to measure
    }

    // Handle all-zero payouts
    const totalPayout = payouts.reduce((sum, val) => sum + val, 0);
    if (totalPayout === 0) {
      return 0; // No payouts distributed = no inequality
    }

    // Step 1: Sort payouts in ascending order
    const sorted = [...payouts].sort((a, b) => a - b);
    const n = sorted.length;

    // Step 2: Calculate weighted sum: sum(i * sorted_payout[i])
    // Index starts at 1 for Gini formula (not 0)
    let weightedSum = 0;
    for (let i = 0; i < n; i++) {
      weightedSum += (i + 1) * sorted[i];
    }

    // Step 3: Apply Gini formula
    // Gini = (2 * weightedSum) / (n * totalPayout) - (n + 1) / n
    const gini = (2 * weightedSum) / (n * totalPayout) - (n + 1) / n;

    // Clamp to [0, 1] range (handle floating point errors)
    return Math.max(0, Math.min(1, gini));
  }

  /**
   * Interpret Gini coefficient as a human-readable category
   *
   * @param gini - Gini coefficient (0.0 - 1.0)
   * @returns Category string
   */
  interpretGini(gini: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'EXTREME' {
    if (gini < 0.3) return 'EXCELLENT'; // Very equal distribution
    if (gini < 0.4) return 'GOOD';      // Fair distribution
    if (gini < 0.6) return 'FAIR';      // Moderate inequality
    if (gini < 0.7) return 'POOR';      // High inequality
    return 'EXTREME';                    // Extreme inequality (red flag)
  }
}
