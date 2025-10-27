import express from 'express';
import { EventService } from '../../services/events/EventService';
import { prisma } from '../../config/database';

const router = express.Router();
const eventService = new EventService(prisma);

// Get recent events (admin dashboard)
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await eventService.getRecent(limit);

    // BUG FIX: Standardize response format to match other admin endpoints
    // Map 'users' relation to 'actor' for frontend compatibility
    const eventsWithActor = events.map(event => ({
      ...event,
      actor: event.users,
    }));

    res.json({
      success: true,
      data: eventsWithActor
    });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

// Get events by actor (user activity)
router.get('/actor/:actorId', async (req, res) => {
  try {
    const { actorId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const events = await eventService.getByActor(actorId, limit);
    res.json({ events });
  } catch (error) {
    console.error('Failed to fetch actor events:', error);
    res.status(500).json({ error: 'Failed to fetch actor events' });
  }
});

// Get event trail for specific entity
router.get('/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const trail = await eventService.getTrail(entityType, entityId);
    res.json({ trail });
  } catch (error) {
    console.error('Failed to fetch event trail:', error);
    res.status(500).json({ error: 'Failed to fetch event trail' });
  }
});

export default router;
