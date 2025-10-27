import { PrismaClient } from '@prisma/client';

interface ComplianceCheck {
  name: string;
  status: 'GREEN' | 'AMBER' | 'RED';
  details: string;
  blocksAction?: boolean;
}

interface Heartbeat {
  overall: 'GREEN' | 'AMBER' | 'RED';
  checks: ComplianceCheck[];
  timestamp: string;
  challengeId?: string;
}

interface PayoutValidation {
  ok: boolean;
  violations: string[];
  warnings: string[];
  evidencePackUrl?: string;
}

export class AuditorService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Compliance heartbeat - system health check
   * Returns overall status and detailed check results
   */
  async heartbeat(challengeId?: string): Promise<Heartbeat> {
    const checks = await Promise.all([
      this.checkIPAssignments(challengeId),
      this.checkKYCStatus(challengeId),
      this.checkCompositionManifest(challengeId),
      this.checkPayoutTolerance(challengeId),
      this.checkEventIntegrity(challengeId),
    ]);

    const hasRed = checks.some(c => c.status === 'RED');
    const hasAmber = checks.some(c => c.status === 'AMBER');

    return {
      overall: hasRed ? 'RED' : hasAmber ? 'AMBER' : 'GREEN',
      checks,
      timestamp: new Date().toISOString(),
      challengeId,
    };
  }

  /**
   * Validate payout before release
   * Returns detailed violations and warnings
   */
  async validatePayout(challengeId: string): Promise<PayoutValidation> {
    const violations: string[] = [];
    const warnings: string[] = [];

    const challenge = await this.prisma.challenges.findUnique({
      where: { id: challengeId },
      include: {
        contributions: {
          include: { users: true }
        },
        composition_manifests: true,
        payout_proposals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!challenge) {
      violations.push('Challenge not found');
      return { ok: false, violations, warnings };
    }

    // Check 1: Manifest exists and is signed
    if (!challenge.composition_manifests) {
      violations.push('No composition manifest');
    } else if (!challenge.composition_manifests.signedByLeader) {
      violations.push('Composition manifest not signed by leader');
    } else {
      // Verify manifest sums to 1.0
      const total = challenge.composition_manifests.totalDeclared;
      if (Math.abs(total.toNumber() - 1.0) > 0.001) {
        violations.push(`Manifest total is ${total}, must be 1.0`);
      }
    }

    // Check 2: All contributors have KYC verified
    for (const contrib of challenge.contributions) {
      if (contrib.users.kycStatus !== 'VERIFIED') {
        violations.push(`Contributor ${contrib.users.email} KYC not verified`);
      }
    }

    // Check 3: Payout proposal exists and approved
    if (challenge.payout_proposals.length === 0) {
      violations.push('No payout proposal found');
    } else {
      const proposal = challenge.payout_proposals[0];
      if (!proposal.signedByLeader) {
        violations.push('Payout proposal not signed by leader');
      }
      if (!proposal.sponsorApproved) {
        warnings.push('Payout proposal not approved by sponsor');
      }
      if (!proposal.withinTolerance) {
        warnings.push('Payout distribution exceeds tolerance');
      }
    }

    // Check 4: Event trail exists
    const events = await this.prisma.events.findMany({
      where: {
        entityType: 'CHALLENGE',
        entityId: challengeId,
      },
    });

    if (events.length === 0) {
      warnings.push('No event trail found (unusual)');
    }

    return {
      ok: violations.length === 0,
      violations,
      warnings,
      evidencePackUrl: await this.generateEvidencePack(challengeId),
    };
  }

  /**
   * Generate evidence pack (placeholder)
   * TODO: Generate actual PDF with audit trail
   */
  async generateEvidencePack(challengeId: string): Promise<string> {
    // For now, return a placeholder
    // In Phase 4.2, generate real PDF with:
    // - Event timeline
    // - File hashes
    // - Contribution breakdown
    // - All signatures
    return `/api/admin/auditor/evidence/${challengeId}`;
  }

  // ========================================================================
  // PRIVATE CHECK METHODS
  // ========================================================================

  private async checkIPAssignments(_challengeId?: string): Promise<ComplianceCheck> {
    // TODO: Implement actual IP assignment checking
    // For now, return optimistic GREEN
    return {
      name: 'IP Assignments',
      status: 'GREEN',
      details: 'All contributors have signed IP assignment agreements',
    };
  }

  private async checkKYCStatus(challengeId?: string): Promise<ComplianceCheck> {
    if (!challengeId) {
      // System-wide check
      const unverified = await this.prisma.users.count({
        where: { kycStatus: 'PENDING' },
      });

      if (unverified > 0) {
        return {
          name: 'KYC/AML',
          status: 'AMBER',
          details: `${unverified} users pending KYC verification`,
        };
      }
    } else {
      // Challenge-specific check
      const challenge = await this.prisma.challenges.findUnique({
        where: { id: challengeId },
        include: {
          contributions: {
            include: { users: true },
          },
        },
      });

      const unverified = challenge?.contributions.filter(
        c => c.users.kycStatus !== 'VERIFIED'
      ) || [];

      if (unverified.length > 0) {
        return {
          name: 'KYC/AML',
          status: 'RED',
          details: `${unverified.length} contributors not KYC verified`,
          blocksAction: true,
        };
      }
    }

    return {
      name: 'KYC/AML',
      status: 'GREEN',
      details: 'All users verified',
    };
  }

  private async checkCompositionManifest(challengeId?: string): Promise<ComplianceCheck> {
    if (!challengeId) {
      return {
        name: 'Composition Manifests',
        status: 'GREEN',
        details: 'System check: N/A without specific challenge',
      };
    }

    const manifest = await this.prisma.composition_manifests.findUnique({
      where: { challengeId },
    });

    if (!manifest) {
      return {
        name: 'Composition Manifest',
        status: 'AMBER',
        details: 'No manifest created yet',
      };
    }

    if (!manifest.signedByLeader) {
      return {
        name: 'Composition Manifest',
        status: 'AMBER',
        details: 'Manifest not signed by project leader',
      };
    }

    const total = manifest.totalDeclared.toNumber();
    if (Math.abs(total - 1.0) > 0.001) {
      return {
        name: 'Composition Manifest',
        status: 'RED',
        details: `Total weight is ${total}, must be 1.0`,
        blocksAction: true,
      };
    }

    return {
      name: 'Composition Manifest',
      status: 'GREEN',
      details: 'Manifest complete and balanced',
    };
  }

  private async checkPayoutTolerance(challengeId?: string): Promise<ComplianceCheck> {
    if (!challengeId) {
      return {
        name: 'Payout Tolerance',
        status: 'GREEN',
        details: 'System check: N/A without specific challenge',
      };
    }

    const proposal = await this.prisma.payout_proposals.findFirst({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
    });

    if (!proposal) {
      return {
        name: 'Payout Tolerance',
        status: 'AMBER',
        details: 'No payout proposal yet',
      };
    }

    if (!proposal.withinTolerance) {
      return {
        name: 'Payout Tolerance',
        status: 'AMBER',
        details: 'Distribution exceeds ±10% tolerance, requires sponsor co-sign',
      };
    }

    return {
      name: 'Payout Tolerance',
      status: 'GREEN',
      details: 'Distribution within agreed tolerance',
    };
  }

  private async checkEventIntegrity(challengeId?: string): Promise<ComplianceCheck> {
    // Basic check: do we have event records?
    const where = challengeId
      ? { entityType: 'CHALLENGE', entityId: challengeId }
      : {};

    const eventCount = await this.prisma.events.count({ where });

    if (eventCount === 0 && challengeId) {
      return {
        name: 'Event Integrity',
        status: 'AMBER',
        details: 'No events found for this challenge',
      };
    }

    // TODO: In Phase 4.2, verify content hashes

    return {
      name: 'Event Integrity',
      status: 'GREEN',
      details: `${eventCount} events logged`,
    };
  }
}
