// /src/services/ai/ethics/detectors/GreenFlagDetector.ts

/**
 * GreenFlagDetector - Detects positive fairness patterns in payout proposals
 *
 * Implements 4 green flag checks:
 * 1. DIVERSE_CONTRIBUTION_TYPES - 3+ different contribution types
 * 2. ALL_CONTRIBUTORS_PAID - No zero payouts for contributors
 * 3. FAIR_DISTRIBUTION - Gini coefficient < 0.4
 * 4. TRANSPARENT_MANIFEST - Manifest signed >24hrs before payout
 */
export class GreenFlagDetector {
  /**
   * Detect all green flags (positive patterns) in a payout proposal
   *
   * @param challenge - Challenge data with contributions
   * @param manifest - Composition manifest (or null if missing)
   * @param payoutProposal - Proposed payout distribution
   * @param gini - Calculated Gini coefficient
   * @returns Array of detected green flags
   */
  detect(
    challenge: {
      contributions: Array<{ userId: string; type: string }>;
    },
    manifest: {
      signedAt: Date | null;
    } | null,
    payoutProposal: {
      distribution: Array<{ userId: string; amount: number }>;
      createdAt: Date;
    },
    gini: number
  ): string[] {
    const flags: string[] = [];

    // Check 1: DIVERSE_CONTRIBUTION_TYPES
    if (this.checkDiverseContributionTypes(challenge.contributions)) {
      flags.push('DIVERSE_CONTRIBUTION_TYPES');
    }

    // Check 2: ALL_CONTRIBUTORS_PAID
    if (this.checkAllContributorsPaid(challenge.contributions, payoutProposal.distribution)) {
      flags.push('ALL_CONTRIBUTORS_PAID');
    }

    // Check 3: FAIR_DISTRIBUTION
    if (this.checkFairDistribution(gini)) {
      flags.push('FAIR_DISTRIBUTION');
    }

    // Check 4: TRANSPARENT_MANIFEST
    if (manifest && this.checkTransparentManifest(manifest.signedAt, payoutProposal.createdAt)) {
      flags.push('TRANSPARENT_MANIFEST');
    }

    return flags;
  }

  /**
   * Check if challenge has 3+ different contribution types
   */
  private checkDiverseContributionTypes(
    contributions: Array<{ userId: string; type: string }>
  ): boolean {
    const types = new Set(contributions.map(c => c.type.toUpperCase()));
    return types.size >= 3;
  }

  /**
   * Check if all contributors with recorded work receive payment
   */
  private checkAllContributorsPaid(
    contributions: Array<{ userId: string; type: string }>,
    distribution: Array<{ userId: string; amount: number }>
  ): boolean {
    const contributorIds = new Set(contributions.map(c => c.userId));
    const paidIds = new Set(distribution.filter(d => d.amount > 0).map(d => d.userId));

    // All contributors must have payout > 0
    for (const contributorId of contributorIds) {
      if (!paidIds.has(contributorId)) {
        return false;
      }
    }

    return contributorIds.size > 0; // Only flag if contributors exist
  }

  /**
   * Check if Gini coefficient indicates fair distribution (<0.4)
   */
  private checkFairDistribution(gini: number): boolean {
    return gini < 0.4;
  }

  /**
   * Check if manifest was signed >24hrs before payout proposal (transparent process)
   */
  private checkTransparentManifest(
    manifestSignedAt: Date | null,
    payoutCreatedAt: Date
  ): boolean {
    if (!manifestSignedAt) {
      return false; // No manifest = not transparent
    }

    // Calculate time difference in milliseconds
    const timeDiff = payoutCreatedAt.getTime() - manifestSignedAt.getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    return timeDiff >= twentyFourHoursMs; // Signed at least 24 hours before
  }
}
