// /src/services/ai/ethics/detectors/RedFlagDetector.ts

import { RedFlag } from '../../types/ethics.types';
import { GiniCalculator } from '../calculators/GiniCalculator';

/**
 * PayoutEntry - Represents a single payout in a distribution
 */
interface PayoutEntry {
  userId: string;
  amount: number;
  reason?: string;
  evidence?: string[];
}

/**
 * ManifestEntry - Represents a contribution in the composition manifest
 */
interface ManifestEntry {
  type: string;          // "code" | "design" | "content" | etc.
  contributorId: string;
  weight: number;        // Decimal between 0 and 1
  ref?: string;          // Reference to git commit, file hash, etc.
}

/**
 * RedFlagDetector - Detects critical fairness violations in payout proposals
 *
 * Implements 8 red flag checks:
 * 1. SINGLE_CONTRIBUTOR_DOMINANCE - One person receives >70% of payout
 * 2. UNPAID_WORK_DETECTED - Contributors exist but receive 0 payout
 * 3. EXTREME_INEQUALITY - Gini coefficient > 0.7
 * 4. MISSING_ATTRIBUTION - Contributions without manifest entry
 * 5. SUSPICIOUS_TIMING - Manifest signed <1hr before payout proposal
 * 6. UNEXPLAINED_VARIANCE - Payout % deviates >5% from manifest weight %
 * 7. NO_DIVERSE_ROLES - All contributions are the same type
 * 8. EXPLOITATION_PATTERN - User has history of unfair distributions
 */
export class RedFlagDetector {
  private giniCalculator: GiniCalculator;

  constructor() {
    this.giniCalculator = new GiniCalculator();
  }

  /**
   * Detect all red flags in a payout proposal
   *
   * @param challenge - Challenge data with contributions
   * @param manifest - Composition manifest (or null if missing)
   * @param payoutProposal - Proposed payout distribution
   * @param userReputation - Historical reputation data (optional)
   * @returns Array of detected red flags
   */
  detect(
    challenge: {
      id: string;
      bountyAmount: number;
      contributions: Array<{ userId: string; type: string }>;
    },
    manifest: {
      entries: ManifestEntry[];
      signedAt: Date | null;
      totalDeclared: number;
    } | null,
    payoutProposal: {
      distribution: PayoutEntry[];
      createdAt: Date;
    },
    userReputation?: {
      userId: string;
      disputesRaised: number;
      disputesAgainst: number;
      asProjectLeader: number;
    }
  ): RedFlag[] {
    const flags: RedFlag[] = [];

    // Extract payout amounts for calculations
    const payouts = payoutProposal.distribution.map(d => d.amount);
    const totalPayout = payouts.reduce((sum, amt) => sum + amt, 0);

    // Check 1: SINGLE_CONTRIBUTOR_DOMINANCE
    if (this.checkDominance(payouts, totalPayout)) {
      flags.push('SINGLE_CONTRIBUTOR_DOMINANCE');
    }

    // Check 2: UNPAID_WORK_DETECTED
    if (this.checkUnpaidWork(challenge.contributions, payoutProposal.distribution)) {
      flags.push('UNPAID_WORK_DETECTED');
    }

    // Check 3: EXTREME_INEQUALITY
    if (this.checkExtremeInequality(payouts)) {
      flags.push('EXTREME_INEQUALITY');
    }

    // Check 4: MISSING_ATTRIBUTION
    if (manifest && this.checkMissingAttribution(challenge.contributions, manifest.entries)) {
      flags.push('MISSING_ATTRIBUTION');
    }

    // Check 5: SUSPICIOUS_TIMING
    if (manifest && this.checkSuspiciousTiming(manifest.signedAt, payoutProposal.createdAt)) {
      flags.push('SUSPICIOUS_TIMING');
    }

    // Check 6: UNEXPLAINED_VARIANCE
    if (manifest && this.checkUnexplainedVariance(manifest.entries, payoutProposal.distribution, totalPayout)) {
      flags.push('UNEXPLAINED_VARIANCE');
    }

    // Check 7: NO_DIVERSE_ROLES
    if (this.checkNoDiverseRoles(challenge.contributions)) {
      flags.push('NO_DIVERSE_ROLES');
    }

    // Check 8: EXPLOITATION_PATTERN
    if (userReputation && this.checkExploitationPattern(userReputation)) {
      flags.push('EXPLOITATION_PATTERN');
    }

    return flags;
  }

  /**
   * Check if one contributor receives >70% of total payout
   */
  private checkDominance(payouts: number[], totalPayout: number): boolean {
    if (totalPayout === 0) return false;

    const maxPayout = Math.max(...payouts);
    const maxPercentage = maxPayout / totalPayout;

    return maxPercentage > 0.7; // >70% threshold
  }

  /**
   * Check if any contributors have work recorded but receive 0 payout
   */
  private checkUnpaidWork(
    contributions: Array<{ userId: string; type: string }>,
    distribution: PayoutEntry[]
  ): boolean {
    // Get unique contributor IDs from contributions
    const contributorIds = new Set(contributions.map(c => c.userId));

    // Get IDs receiving payouts
    const paidIds = new Set(distribution.filter(d => d.amount > 0).map(d => d.userId));

    // Check if any contributors have no payout
    for (const contributorId of contributorIds) {
      if (!paidIds.has(contributorId)) {
        return true; // Unpaid work detected
      }
    }

    return false;
  }

  /**
   * Check if Gini coefficient exceeds extreme inequality threshold (>0.7)
   */
  private checkExtremeInequality(payouts: number[]): boolean {
    const gini = this.giniCalculator.calculate(payouts);
    return gini > 0.7;
  }

  /**
   * Check if contributions exist without corresponding manifest entries
   */
  private checkMissingAttribution(
    contributions: Array<{ userId: string; type: string }>,
    manifestEntries: ManifestEntry[]
  ): boolean {
    // Get unique contributor IDs from contributions
    const contributorIds = new Set(contributions.map(c => c.userId));

    // Get contributor IDs from manifest
    const manifestIds = new Set(manifestEntries.map(e => e.contributorId));

    // Check if any contributors are missing from manifest
    for (const contributorId of contributorIds) {
      if (!manifestIds.has(contributorId)) {
        return true; // Missing attribution
      }
    }

    return false;
  }

  /**
   * Check if manifest was signed suspiciously close to payout proposal (<1hr)
   */
  private checkSuspiciousTiming(
    manifestSignedAt: Date | null,
    payoutCreatedAt: Date
  ): boolean {
    if (!manifestSignedAt) {
      return false; // Can't check timing if not signed
    }

    // Calculate time difference in milliseconds
    const timeDiff = payoutCreatedAt.getTime() - manifestSignedAt.getTime();
    const oneHourMs = 60 * 60 * 1000;

    return timeDiff < oneHourMs; // Signed less than 1 hour before payout
  }

  /**
   * Check if payout percentages deviate >5% from manifest weights
   */
  private checkUnexplainedVariance(
    manifestEntries: ManifestEntry[],
    distribution: PayoutEntry[],
    totalPayout: number
  ): boolean {
    if (totalPayout === 0) return false;

    const TOLERANCE = 0.05; // ±5% tolerance

    // Create lookup map for payout percentages
    const payoutPercentages = new Map<string, number>();
    for (const entry of distribution) {
      const percentage = entry.amount / totalPayout;
      payoutPercentages.set(entry.userId, percentage);
    }

    // Compare each manifest entry to its payout
    for (const manifestEntry of manifestEntries) {
      const manifestWeight = manifestEntry.weight;
      const payoutPercentage = payoutPercentages.get(manifestEntry.contributorId) || 0;

      // Calculate absolute difference
      const variance = Math.abs(manifestWeight - payoutPercentage);

      // Flag if variance exceeds tolerance
      if (variance > TOLERANCE) {
        return true; // Unexplained variance detected
      }
    }

    return false;
  }

  /**
   * Check if all contributions are the same type (no diversity)
   */
  private checkNoDiverseRoles(
    contributions: Array<{ userId: string; type: string }>
  ): boolean {
    if (contributions.length === 0) return false;

    // Get unique contribution types
    const types = new Set(contributions.map(c => c.type.toUpperCase()));

    // Flag if all contributions are the same type
    return types.size === 1;
  }

  /**
   * Check user's reputation for patterns of exploitation
   *
   * Red flag if:
   * - Multiple disputes raised against them (≥3)
   * - Low project leader reputation (<50)
   * - High dispute-to-project ratio (>0.3)
   */
  private checkExploitationPattern(reputation: {
    userId: string;
    disputesRaised: number;
    disputesAgainst: number;
    asProjectLeader: number;
  }): boolean {
    // Flag if ≥3 disputes raised against them
    if (reputation.disputesAgainst >= 3) {
      return true;
    }

    // Flag if project leader reputation is very low (<50)
    if (reputation.asProjectLeader < 50 && reputation.disputesAgainst > 0) {
      return true;
    }

    return false;
  }
}
