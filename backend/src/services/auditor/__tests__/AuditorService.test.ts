import { AuditorService } from '../AuditorService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    users: {
      count: jest.fn(),
    },
    challenges: {
      findUnique: jest.fn(),
    },
    composition_manifests: {
      findUnique: jest.fn(),
    },
    payout_proposals: {
      findFirst: jest.fn(),
    },
    events: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('AuditorService', () => {
  let auditorService: AuditorService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    auditorService = new AuditorService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('heartbeat()', () => {
    it('should return GREEN when all checks pass', async () => {
      // Mock all checks to return GREEN
      mockPrisma.users.count.mockResolvedValue(0);
      mockPrisma.events.count.mockResolvedValue(10);

      const result = await auditorService.heartbeat();

      expect(result.overall).toBe('GREEN');
      expect(result.checks).toHaveLength(5);
      expect(result.timestamp).toBeTruthy();
    });

    it('should return AMBER when any check returns AMBER', async () => {
      // Mock some users pending KYC
      mockPrisma.users.count.mockResolvedValue(5);
      mockPrisma.events.count.mockResolvedValue(10);

      const result = await auditorService.heartbeat();

      expect(result.overall).toBe('AMBER');
      const kycCheck = result.checks.find(c => c.name === 'KYC/AML');
      expect(kycCheck?.status).toBe('AMBER');
    });

    it('should return RED when any check returns RED', async () => {
      const challengeId = 'challenge-123';

      // Mock challenge with unverified contributors
      mockPrisma.challenges.findUnique.mockResolvedValue({
        id: challengeId,
        contributions: [
          { user: { email: 'user1@example.com', kycStatus: 'PENDING' } },
        ],
      });
      mockPrisma.composition_manifests.findUnique.mockResolvedValue(null);
      mockPrisma.payout_proposals.findFirst.mockResolvedValue(null);
      mockPrisma.events.count.mockResolvedValue(0);

      const result = await auditorService.heartbeat(challengeId);

      expect(result.overall).toBe('RED');
    });

    it('should include challengeId when provided', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue({
        contributions: [],
      });
      mockPrisma.composition_manifests.findUnique.mockResolvedValue(null);
      mockPrisma.payout_proposals.findFirst.mockResolvedValue(null);
      mockPrisma.events.count.mockResolvedValue(5);

      const result = await auditorService.heartbeat('challenge-123');

      expect(result.challengeId).toBe('challenge-123');
    });
  });

  describe('validatePayout()', () => {
    it('should pass validation for complete challenge', async () => {
      const mockChallenge = {
        id: 'challenge-123',
        contributions: [
          { user: { email: 'user1@example.com', kycStatus: 'VERIFIED' } },
        ],
        manifest: {
          signedByLeader: true,
          totalDeclared: { toNumber: () => 1.0 },
        },
        payoutProposals: [
          {
            signedByLeader: true,
            sponsorApproved: true,
            withinTolerance: true,
          },
        ],
      };

      mockPrisma.challenges.findUnique.mockResolvedValue(mockChallenge);
      mockPrisma.events.findMany.mockResolvedValue([{ id: 'event-1' }]);

      const result = await auditorService.validatePayout('challenge-123');

      expect(result.ok).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when challenge not found', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue(null);

      const result = await auditorService.validatePayout('non-existent');

      expect(result.ok).toBe(false);
      expect(result.violations).toContain('Challenge not found');
    });

    it('should fail when manifest missing', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue({
        contributions: [],
        manifest: null,
        payoutProposals: [],
      });
      mockPrisma.events.findMany.mockResolvedValue([]);

      const result = await auditorService.validatePayout('challenge-123');

      expect(result.ok).toBe(false);
      expect(result.violations).toContain('No composition manifest');
    });

    it('should fail when manifest not signed', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue({
        contributions: [],
        manifest: {
          signedByLeader: false,
          totalDeclared: { toNumber: () => 1.0 },
        },
        payoutProposals: [],
      });
      mockPrisma.events.findMany.mockResolvedValue([]);

      const result = await auditorService.validatePayout('challenge-123');

      expect(result.ok).toBe(false);
      expect(result.violations).toContain('Composition manifest not signed by leader');
    });

    it('should fail when manifest total is not 1.0', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue({
        contributions: [],
        manifest: {
          signedByLeader: true,
          totalDeclared: { toNumber: () => 0.95 },
        },
        payoutProposals: [],
      });
      mockPrisma.events.findMany.mockResolvedValue([]);

      const result = await auditorService.validatePayout('challenge-123');

      expect(result.ok).toBe(false);
      expect(result.violations.some(v => v.includes('Manifest total is'))).toBe(true);
    });

    it('should fail when contributors not KYC verified', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue({
        contributions: [
          { user: { email: 'unverified@example.com', kycStatus: 'PENDING' } },
        ],
        manifest: {
          signedByLeader: true,
          totalDeclared: { toNumber: () => 1.0 },
        },
        payoutProposals: [],
      });
      mockPrisma.events.findMany.mockResolvedValue([]);

      const result = await auditorService.validatePayout('challenge-123');

      expect(result.ok).toBe(false);
      expect(result.violations.some(v => v.includes('KYC not verified'))).toBe(true);
    });

    it('should warn when no event trail', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue({
        contributions: [
          { user: { email: 'user@example.com', kycStatus: 'VERIFIED' } },
        ],
        manifest: {
          signedByLeader: true,
          totalDeclared: { toNumber: () => 1.0 },
        },
        payoutProposals: [
          {
            signedByLeader: true,
            sponsorApproved: true,
            withinTolerance: true,
          },
        ],
      });
      mockPrisma.events.findMany.mockResolvedValue([]);

      const result = await auditorService.validatePayout('challenge-123');

      expect(result.warnings).toContain('No event trail found (unusual)');
    });

    it('should warn when payout not approved by sponsor', async () => {
      mockPrisma.challenges.findUnique.mockResolvedValue({
        contributions: [
          { user: { email: 'user@example.com', kycStatus: 'VERIFIED' } },
        ],
        manifest: {
          signedByLeader: true,
          totalDeclared: { toNumber: () => 1.0 },
        },
        payoutProposals: [
          {
            signedByLeader: true,
            sponsorApproved: false,
            withinTolerance: true,
          },
        ],
      });
      mockPrisma.events.findMany.mockResolvedValue([{ id: 'event-1' }]);

      const result = await auditorService.validatePayout('challenge-123');

      expect(result.warnings).toContain('Payout proposal not approved by sponsor');
    });
  });

  describe('generateEvidencePack()', () => {
    it('should return evidence pack URL', async () => {
      const url = await auditorService.generateEvidencePack('challenge-123');

      expect(url).toBe('/api/admin/auditor/evidence/challenge-123');
    });
  });
});
