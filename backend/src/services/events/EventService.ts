import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { generateId } from '../../utils/idGenerator';

interface EmitEventParams {
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  snapshot?: any;
  metadata?: any;
}

export class EventService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Emit an event with optional content hashing
   * This creates an immutable audit trail
   */
  async emit(params: EmitEventParams) {
    const contentHash = params.snapshot
      ? this.hashContent(params.snapshot)
      : null;

    return await this.prisma.events.create({
      data: {
        id: generateId(),
        actorId: params.actorId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        contentHash,
        metadata: params.metadata,
      },
    });
  }

  /**
   * Get complete event trail for an entity
   * Returns chronological history
   */
  async getTrail(entityType: string, entityId: string) {
    return await this.prisma.events.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
          }
        }
      },
    });
  }

  /**
   * Get all events by a specific actor
   * Useful for user activity history
   */
  async getByActor(actorId: string, limit = 100) {
    return await this.prisma.events.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get recent events across the system
   * For admin dashboard
   */
  async getRecent(limit = 50) {
    return await this.prisma.events.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
          }
        }
      },
    });
  }

  /**
   * Hash content for audit trail
   * Uses canonical JSON (sorted keys) for consistency
   */
  private hashContent(content: any): string {
    const canonical = JSON.stringify(
      content,
      Object.keys(content).sort()
    );
    return crypto
      .createHash('sha256')
      .update(canonical)
      .digest('hex');
  }

  /**
   * Verify content hasn't changed
   * Compares computed hash with stored hash
   */
  verifyHash(content: any, expectedHash: string): boolean {
    return this.hashContent(content) === expectedHash;
  }
}
