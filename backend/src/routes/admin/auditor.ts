import express from 'express';
import { AuditorService } from '../../services/auditor/AuditorService';
import { prisma } from '../../config/database';

const router = express.Router();
const auditorService = new AuditorService(prisma);

// System-wide compliance heartbeat
router.get('/heartbeat', async (_req, res) => {
  try {
    const heartbeat = await auditorService.heartbeat();
    res.json({
      success: true,
      data: heartbeat,
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

// Challenge-specific compliance check
router.get('/heartbeat/:challengeId', async (req, res) => {
  try {
    const heartbeat = await auditorService.heartbeat(req.params.challengeId);
    res.json({
      success: true,
      data: heartbeat,
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

// Validate payout before release
router.post('/payout/validate/:challengeId', async (req, res) => {
  try {
    const validation = await auditorService.validatePayout(req.params.challengeId);
    res.json({
      success: validation.ok,
      data: validation,
    });
  } catch (error) {
    console.error('Payout validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Get evidence pack (placeholder)
router.get('/evidence/:challengeId', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Evidence pack generation coming in Phase 4.2',
        challengeId: req.params.challengeId,
      },
    });
  } catch (error) {
    console.error('Evidence pack error:', error);
    res.status(500).json({ error: 'Evidence pack failed' });
  }
});

export default router;
