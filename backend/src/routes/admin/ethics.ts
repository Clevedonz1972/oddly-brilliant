// /src/routes/admin/ethics.ts

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EthicsService } from '../../services/ai/ethics/EthicsService';

const router = Router();
const prisma = new PrismaClient();
const ethicsService = new EthicsService(prisma);

/**
 * POST /api/admin/ethics/audit/:challengeId
 * Run ethics audit on challenge
 */
router.post('/audit/:challengeId', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;

    const result = await ethicsService.auditChallenge(challengeId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[EthicsAPI] Audit error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run ethics audit',
    });
  }
});

/**
 * GET /api/admin/ethics/audits/:challengeId
 * Get all ethics audits for challenge
 */
router.get('/audits/:challengeId', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;

    const audits = await prisma.ethics_audits.findMany({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: audits,
    });
  } catch (error: any) {
    console.error('[EthicsAPI] Fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ethics audits',
    });
  }
});

/**
 * GET /api/admin/ethics/report/:challengeId
 * Get ethics report summary
 */
router.get('/report/:challengeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { challengeId } = req.params;

    // Get latest audit
    const latestAudit = await prisma.ethics_audits.findFirst({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestAudit) {
      res.status(404).json({
        success: false,
        error: 'No ethics audit found for this challenge',
      });
      return;
    }

    // Get challenge details
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId },
      include: {
        users_challenges_sponsorIdTousers: { select: { id: true, email: true } },
        contributions: { select: { userId: true, type: true, tokenValue: true } },
      },
    });

    res.json({
      success: true,
      data: {
        challenge: {
          id: challenge?.id,
          title: challenge?.title,
          bountyAmount: challenge?.bountyAmount,
        },
        audit: latestAudit,
        contributorCount: challenge?.contributions.length || 0,
        totalValue: challenge?.contributions.reduce((sum, c) => sum + Number(c.tokenValue), 0) || 0,
      },
    });
  } catch (error: any) {
    console.error('[EthicsAPI] Report error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate ethics report',
    });
  }
});

export default router;
