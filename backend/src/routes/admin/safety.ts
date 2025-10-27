// /src/routes/admin/safety.ts

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SafetyService } from '../../services/ai/safety/SafetyService';

const router = Router();
const prisma = new PrismaClient();
const safetyService = new SafetyService(prisma);

/**
 * POST /api/admin/safety/analyze
 * Analyze content for safety issues
 */
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, entityType, entityId } = req.body;

    if (!content || !entityType || !entityId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: content, entityType, entityId',
      });
      return;
    }

    const result = await safetyService.analyzeContent({
      content,
      entityType,
      entityId,
      authorId: (req as any).user?.id || 'anonymous',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[SafetyAPI] Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze content',
    });
  }
});

/**
 * POST /api/admin/safety/moderate/:entityType/:entityId
 * Auto-moderate and flag if needed
 */
router.post('/moderate/:entityType/:entityId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: content',
      });
      return;
    }

    const result = await safetyService.moderateAndFlag({
      content,
      entityType,
      entityId,
      authorId: (req as any).user?.id || 'anonymous',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[SafetyAPI] Moderation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to moderate content',
    });
  }
});

/**
 * GET /api/admin/safety/results/:entityType/:entityId
 * Get moderation results for entity
 */
router.get('/results/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    const results = await prisma.safety_moderation_results.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('[SafetyAPI] Fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch results',
    });
  }
});

export default router;
