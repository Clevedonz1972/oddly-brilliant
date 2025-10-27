// /src/routes/admin/evidence.ts

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EvidenceGenerator } from '../../services/ai/evidence/EvidenceGenerator';

const router = Router();
const prisma = new PrismaClient();
const evidenceGenerator = new EvidenceGenerator(prisma);

/**
 * POST /api/admin/evidence/generate/:challengeId
 * Generate evidence package (PDF audit trail)
 */
router.post('/generate/:challengeId', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const {
      packageType = 'PAYOUT_AUDIT',
      includeTimeline = true,
      includeFileHashes = true,
      includeSignatures = true,
      includeAIAnalysis = true,
    } = req.body;

    const evidence = await evidenceGenerator.createAuditPack({
      challengeId,
      packageType,
      includeTimeline,
      includeFileHashes,
      includeSignatures,
      includeAIAnalysis,
    });

    res.json({
      success: true,
      data: {
        packageId: evidence.metadata.sha256,
        fileName: evidence.fileName,
        pages: evidence.metadata.pages,
        generatedAt: evidence.metadata.generatedAt,
        verificationUrl: evidence.metadata.verificationUrl,
        sha256: evidence.metadata.sha256,
      },
    });
  } catch (error: any) {
    console.error('[EvidenceAPI] Generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate evidence package',
    });
  }
});

/**
 * GET /api/admin/evidence/download/:packageId
 * Download evidence package PDF
 */
router.get('/download/:packageId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageId } = req.params;

    const pkg = await prisma.evidence_packages.findFirst({
      where: { sha256: packageId },
    });

    if (!pkg) {
      res.status(404).json({
        success: false,
        error: 'Evidence package not found',
      });
      return;
    }

    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), pkg.storageKey);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'Evidence file not found on disk',
      });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pkg.fileName}"`);
    res.sendFile(filePath);
  } catch (error: any) {
    console.error('[EvidenceAPI] Download error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download evidence package',
    });
  }
});

/**
 * GET /api/admin/evidence/verify/:packageId
 * Verify evidence package integrity
 */
router.get('/verify/:packageId', async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;

    const result = await evidenceGenerator.verifyPackage(packageId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[EvidenceAPI] Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify evidence package',
    });
  }
});

/**
 * GET /api/admin/evidence/list/:challengeId
 * List all evidence packages for a challenge
 */
router.get('/list/:challengeId', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;

    const packages = await evidenceGenerator.listPackages(challengeId);

    res.json({
      success: true,
      data: packages,
    });
  } catch (error: any) {
    console.error('[EvidenceAPI] List error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list evidence packages',
    });
  }
});

export default router;
