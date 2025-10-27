// /src/services/ai/ethics/EthicsService.ts

import { PrismaClient } from '@prisma/client';
import { BaseAIService } from '../base/BaseAIService';
import { EthicsAuditResult, RedFlag, Recommendation } from '../types/ethics.types';
import { GiniCalculator } from './calculators/GiniCalculator';
import { FairnessScorer } from './calculators/FairnessScorer';
import { RedFlagDetector } from './detectors/RedFlagDetector';
import { GreenFlagDetector } from './detectors/GreenFlagDetector';
import { generateId } from '../../../utils/idGenerator';

/**
 * EthicsService - Performs fairness auditing on challenge payout distributions
 *
 * Uses pure statistical analysis (no AI/ML) to detect:
 * - Unfair payout distributions (Gini coefficient)
 * - Exploitation patterns (red flags)
 * - Positive fairness indicators (green flags)
 *
 * Generates actionable recommendations for each detected issue.
 */
export class EthicsService extends BaseAIService {
  private giniCalculator: GiniCalculator;
  private fairnessScorer: FairnessScorer;
  private redFlagDetector: RedFlagDetector;
  private greenFlagDetector: GreenFlagDetector;

  constructor(prisma: PrismaClient) {
    super(prisma, 'ETHICS', {
      cacheTTLSeconds: 604800, // 7 days cache
      enableCaching: true,
    });

    this.giniCalculator = new GiniCalculator();
    this.fairnessScorer = new FairnessScorer();
    this.redFlagDetector = new RedFlagDetector();
    this.greenFlagDetector = new GreenFlagDetector();
  }

  /**
   * Audit a challenge for fairness and ethics compliance
   *
   * Steps:
   * 1. Fetch challenge data (contributions, manifest, payout proposal)
   * 2. Calculate Gini coefficient for inequality analysis
   * 3. Detect red flags (critical issues)
   * 4. Detect green flags (positive patterns)
   * 5. Generate recommendations based on findings
   * 6. Calculate overall fairness score
   * 7. Store audit record in database
   * 8. Return comprehensive audit result
   *
   * @param challengeId - Challenge ID to audit
   * @returns Ethics audit result with flags and recommendations
   * @throws Error if challenge not found or missing required data
   */
  async auditChallenge(challengeId: string): Promise<EthicsAuditResult> {
    console.log(`[EthicsService] Starting audit for challenge: ${challengeId}`);

    // Step 1: Fetch challenge data with all required relations
    const challenge = await this.prisma.challenges.findUnique({
      where: { id: challengeId },
      include: {
        contributions: {
          select: {
            userId: true,
            type: true,
          },
        },
        composition_manifests: true,
        payout_proposals: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get most recent proposal
        },
      },
    });

    if (!challenge) {
      throw new Error(`Challenge not found: ${challengeId}`);
    }

    // Get distribution data from payout proposal OR existing payments
    let distribution: any[] = [];
    const payoutProposal = challenge.payout_proposals[0];

    if (payoutProposal) {
      // Use payout proposal if available
      distribution = payoutProposal.distribution as any[];
      if (!Array.isArray(distribution) || distribution.length === 0) {
        throw new Error(`Invalid or empty distribution in payout proposal`);
      }
    } else {
      // Fall back to payments if no proposal exists (e.g., for completed challenges)
      console.log(`[EthicsService] No payout proposal found, using payment records`);
      const payments = await this.prisma.payments.findMany({
        where: { challengeId },
        include: { users: { select: { id: true, email: true } } },
      });

      if (payments.length === 0) {
        throw new Error(`No payout proposal or payments found for challenge: ${challengeId}`);
      }

      // Convert payments to distribution format
      distribution = payments.map(payment => ({
        userId: payment.userId,
        contributionId: payment.id, // Use payment ID as reference
        amount: Number(payment.amount),
        email: payment.users.email,
      }));
    }

    // Step 2: Calculate Gini coefficient
    const payouts = distribution.map(d => Number(d.amount) || 0);
    const giniCoefficient = this.giniCalculator.calculate(payouts);
    console.log(`[EthicsService] Gini coefficient: ${giniCoefficient.toFixed(3)}`);

    // Step 3: Detect red flags
    // Fetch project leader reputation if available
    let leaderReputation = undefined;
    if (challenge.projectLeaderId) {
      const reputation = await this.prisma.reputations.findUnique({
        where: { userId: challenge.projectLeaderId },
      });
      if (reputation) {
        leaderReputation = {
          userId: reputation.userId,
          disputesRaised: reputation.disputesRaised,
          disputesAgainst: reputation.disputesAgainst,
          asProjectLeader: reputation.asProjectLeader,
        };
      }
    }

    // Prepare manifest data
    let manifestData: any = null;
    if (challenge.composition_manifests) {
      const entries = (challenge.composition_manifests.entries as any[]) || [];
      manifestData = {
        entries: entries.map(e => ({
          type: e.type || '',
          contributorId: e.contributorId || '',
          weight: Number(e.weight) || 0,
          ref: e.ref,
        })),
        signedAt: challenge.composition_manifests.signedAt,
        totalDeclared: Number(challenge.composition_manifests.totalDeclared),
      };

      // Validate manifest weights sum to 1.000 (within tolerance)
      const totalWeight = manifestData.entries.reduce((sum: number, e: any) => sum + e.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.001) {
        console.warn(`[EthicsService] Manifest weights sum to ${totalWeight}, expected 1.000`);
      }
    }

    // Prepare challenge data for detection
    const challengeData = {
      id: challenge.id,
      bountyAmount: Number(challenge.bountyAmount),
      contributions: challenge.contributions.map(c => ({
        userId: c.userId,
        type: c.type,
      })),
    };

    // Prepare payout data for detection
    const payoutData = {
      distribution: distribution.map(d => ({
        userId: d.userId || '',
        amount: Number(d.amount) || 0,
        reason: d.reason,
        evidence: d.evidence || [],
      })),
      createdAt: payoutProposal?.createdAt || new Date(),
    };

    const redFlags = this.redFlagDetector.detect(
      challengeData,
      manifestData,
      payoutData,
      leaderReputation
    );
    console.log(`[EthicsService] Red flags detected: ${redFlags.length}`);

    // Step 4: Detect green flags
    const greenFlags = this.greenFlagDetector.detect(
      challengeData,
      manifestData || { signedAt: null },
      payoutData,
      giniCoefficient
    );
    console.log(`[EthicsService] Green flags detected: ${greenFlags.length}`);

    // Step 5: Generate recommendations
    const recommendations = this.generateRecommendations(
      redFlags,
      greenFlags,
      giniCoefficient,
      manifestData
    );

    // Step 6: Calculate overall fairness score
    const fairnessScore = this.fairnessScorer.calculateFairnessScore(
      giniCoefficient,
      redFlags.length,
      greenFlags.length
    );
    console.log(`[EthicsService] Fairness score: ${fairnessScore.toFixed(2)}`);

    // Step 7: Collect evidence links (event IDs, file hashes)
    const evidenceLinks = await this.collectEvidenceLinks(challengeId);

    // Step 8: Store audit record in database
    const auditRecord = await this.prisma.ethics_audits.create({
      data: {
        id: generateId(),
        challengeId,
        fairnessScore,
        giniCoefficient,
        redFlags: redFlags as string[],
        yellowFlags: [], // Not implemented yet
        greenFlags,
        recommendations: recommendations as any,
        evidenceLinks,
      },
    });

    console.log(`[EthicsService] Audit stored with ID: ${auditRecord.id}`);

    // Step 9: Return comprehensive result
    const result: EthicsAuditResult = {
      fairnessScore,
      giniCoefficient,
      redFlags,
      yellowFlags: [],
      greenFlags,
      recommendations,
      evidenceLinks,
    };

    return result;
  }

  /**
   * Generate actionable recommendations based on detected flags
   *
   * @param redFlags - Critical issues detected
   * @param greenFlags - Positive patterns detected
   * @param gini - Gini coefficient
   * @param manifest - Manifest data (or null)
   * @returns Array of recommendations
   */
  private generateRecommendations(
    redFlags: RedFlag[],
    greenFlags: string[],
    gini: number,
    manifest: any | null
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Generate critical recommendations for red flags
    for (const flag of redFlags) {
      switch (flag) {
        case 'SINGLE_CONTRIBUTOR_DOMINANCE':
          recommendations.push({
            type: 'CRITICAL',
            description: 'One contributor receives >70% of payout. Review contribution weights to ensure fair attribution.',
            actionRequired: true,
          });
          break;

        case 'UNPAID_WORK_DETECTED':
          recommendations.push({
            type: 'CRITICAL',
            description: 'Contributors with recorded work are not receiving payment. Ensure all contributors are compensated.',
            actionRequired: true,
          });
          break;

        case 'EXTREME_INEQUALITY':
          recommendations.push({
            type: 'CRITICAL',
            description: `Distribution shows extreme inequality (Gini: ${gini.toFixed(2)}). Consider more equitable payout allocation.`,
            actionRequired: true,
          });
          break;

        case 'MISSING_ATTRIBUTION':
          recommendations.push({
            type: 'CRITICAL',
            description: 'Some contributors are missing from the composition manifest. Update manifest to include all contributors.',
            actionRequired: true,
          });
          break;

        case 'SUSPICIOUS_TIMING':
          recommendations.push({
            type: 'WARNING',
            description: 'Manifest was signed <1 hour before payout proposal. Allow adequate review time for transparency.',
            actionRequired: true,
          });
          break;

        case 'UNEXPLAINED_VARIANCE':
          recommendations.push({
            type: 'CRITICAL',
            description: 'Payout percentages deviate >5% from manifest weights without explanation. Align payouts with agreed attribution.',
            actionRequired: true,
          });
          break;

        case 'NO_DIVERSE_ROLES':
          recommendations.push({
            type: 'WARNING',
            description: 'All contributions are the same type. Consider if additional skills/roles were needed but unrecognized.',
            actionRequired: false,
          });
          break;

        case 'EXPLOITATION_PATTERN':
          recommendations.push({
            type: 'CRITICAL',
            description: 'Project leader has history of disputes/unfair distributions. Require additional oversight for this payout.',
            actionRequired: true,
          });
          break;
      }
    }

    // Generate suggestions based on overall state
    if (redFlags.length === 0 && greenFlags.length >= 3) {
      recommendations.push({
        type: 'SUGGESTION',
        description: 'Excellent fairness practices detected. This distribution serves as a good model for future challenges.',
        actionRequired: false,
      });
    }

    if (!manifest) {
      recommendations.push({
        type: 'WARNING',
        description: 'No composition manifest found. Create and sign a manifest to improve transparency and auditability.',
        actionRequired: true,
      });
    }

    if (gini > 0.5 && gini <= 0.7 && !redFlags.includes('EXTREME_INEQUALITY')) {
      recommendations.push({
        type: 'WARNING',
        description: `Distribution shows moderate inequality (Gini: ${gini.toFixed(2)}). Review if this reflects actual contribution differences.`,
        actionRequired: false,
      });
    }

    return recommendations;
  }

  /**
   * Collect evidence links (event IDs, file hashes) for audit trail
   *
   * @param challengeId - Challenge ID
   * @returns Array of evidence identifiers
   */
  private async collectEvidenceLinks(challengeId: string): Promise<string[]> {
    const evidenceLinks: string[] = [];

    // Collect relevant event IDs
    const events = await this.prisma.events.findMany({
      where: {
        entityType: 'CHALLENGE',
        entityId: challengeId,
        action: {
          in: [
            'MANIFEST_SIGNED',
            'PAYOUT_PROPOSED',
            'CONTRIBUTION_SUBMITTED',
            'CHALLENGE_COMPLETED',
          ],
        },
      },
      select: {
        id: true,
        action: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const event of events) {
      evidenceLinks.push(`event:${event.id}:${event.action}`);
    }

    // Collect file artifact hashes
    const files = await this.prisma.file_artifacts.findMany({
      where: { challengeId },
      select: {
        sha256: true,
        filename: true,
      },
    });

    for (const file of files) {
      evidenceLinks.push(`file:${file.sha256}:${file.filename}`);
    }

    return evidenceLinks;
  }

  /**
   * Get all ethics audits for a challenge
   *
   * @param challengeId - Challenge ID
   * @returns Array of historical audits
   */
  async getAuditHistory(challengeId: string) {
    return this.prisma.ethics_audits.findMany({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get latest ethics audit for a challenge
   *
   * @param challengeId - Challenge ID
   * @returns Latest audit or null
   */
  async getLatestAudit(challengeId: string) {
    return this.prisma.ethics_audits.findFirst({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
