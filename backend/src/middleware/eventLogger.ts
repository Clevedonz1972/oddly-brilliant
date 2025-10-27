import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/events/EventService';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';

/**
 * Middleware to automatically log events for key actions
 * Wraps response to emit event after successful operation
 */
export function eventLogger(entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    const authReq = req as AuthRequest;

    res.json = function(data: any) {
      // Only log successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const eventService = new EventService(prisma);

        eventService.emit({
          actorId: authReq.user?.id || 'system',
          entityType,
          entityId: data.id || req.params.id,
          action: mapMethodToAction(req.method),
          snapshot: data,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            method: req.method,
          },
        }).catch(err => {
          // Don't block response on event failure
          console.error('Event logging failed:', err);
        });
      }

      return originalJson(data);
    };

    next();
  };
}

function mapMethodToAction(method: string): string {
  const map: Record<string, string> = {
    'POST': 'CREATED',
    'PUT': 'UPDATED',
    'PATCH': 'UPDATED',
    'DELETE': 'DELETED',
    'GET': 'VIEWED',
  };
  return map[method] || 'UNKNOWN';
}
