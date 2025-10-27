import { EventService } from '../EventService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaEvents = {
    create: jest.fn(),
    findMany: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => ({
      events: mockPrismaEvents,
    })),
  };
});

describe('EventService', () => {
  let eventService: EventService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    eventService = new EventService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('emit()', () => {
    it('should create event without snapshot', async () => {
      const eventData = {
        actorId: 'user-123',
        entityType: 'CHALLENGE',
        entityId: 'challenge-456',
        action: 'CREATED',
      };

      const mockEvent = {
        id: 'event-789',
        ...eventData,
        contentHash: null,
        metadata: null,
        createdAt: new Date(),
      };

      mockPrisma.events.create.mockResolvedValue(mockEvent);

      const result = await eventService.emit(eventData);

      expect(mockPrisma.events.create).toHaveBeenCalledWith({
        data: {
          actorId: eventData.actorId,
          entityType: eventData.entityType,
          entityId: eventData.entityId,
          action: eventData.action,
          contentHash: null,
          metadata: undefined,
        },
      });

      expect(result).toEqual(mockEvent);
    });

    it('should create event with snapshot and hash', async () => {
      const eventData = {
        actorId: 'user-123',
        entityType: 'CHALLENGE',
        entityId: 'challenge-456',
        action: 'CREATED',
        snapshot: { title: 'Test Challenge', bounty: 1000 },
      };

      const mockEvent = {
        id: 'event-789',
        ...eventData,
        contentHash: 'abc123hash',
        createdAt: new Date(),
      };

      mockPrisma.events.create.mockResolvedValue(mockEvent);

      await eventService.emit(eventData);

      expect(mockPrisma.events.create).toHaveBeenCalled();
      const callArgs = mockPrisma.events.create.mock.calls[0][0];
      expect(callArgs.data.contentHash).toBeTruthy();
      expect(typeof callArgs.data.contentHash).toBe('string');
      expect(callArgs.data.contentHash.length).toBe(64); // SHA256 = 64 hex chars
    });

    it('should include metadata when provided', async () => {
      const eventData = {
        actorId: 'user-123',
        entityType: 'CHALLENGE',
        entityId: 'challenge-456',
        action: 'CREATED',
        metadata: {
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      mockPrisma.events.create.mockResolvedValue({
        id: 'event-789',
        ...eventData,
        createdAt: new Date(),
      });

      await eventService.emit(eventData);

      expect(mockPrisma.events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: eventData.metadata,
        }),
      });
    });
  });

  describe('getTrail()', () => {
    it('should return events for entity in chronological order', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          action: 'CREATED',
          createdAt: new Date('2024-01-01'),
          actor: { id: 'user-1', email: 'user1@example.com', role: 'USER' },
        },
        {
          id: 'event-2',
          action: 'UPDATED',
          createdAt: new Date('2024-01-02'),
          actor: { id: 'user-2', email: 'user2@example.com', role: 'USER' },
        },
      ];

      mockPrisma.events.findMany.mockResolvedValue(mockEvents);

      const result = await eventService.getTrail('CHALLENGE', 'challenge-123');

      expect(mockPrisma.events.findMany).toHaveBeenCalledWith({
        where: { entityType: 'CHALLENGE', entityId: 'challenge-123' },
        orderBy: { createdAt: 'asc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              role: true,
            }
          }
        },
      });

      expect(result).toEqual(mockEvents);
    });
  });

  describe('getByActor()', () => {
    it('should return events by actor with default limit', async () => {
      const mockEvents = [
        { id: 'event-1', action: 'CREATED', createdAt: new Date() },
        { id: 'event-2', action: 'UPDATED', createdAt: new Date() },
      ];

      mockPrisma.events.findMany.mockResolvedValue(mockEvents);

      const result = await eventService.getByActor('user-123');

      expect(mockPrisma.events.findMany).toHaveBeenCalledWith({
        where: { actorId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      expect(result).toEqual(mockEvents);
    });

    it('should respect custom limit', async () => {
      mockPrisma.events.findMany.mockResolvedValue([]);

      await eventService.getByActor('user-123', 50);

      expect(mockPrisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });
  });

  describe('getRecent()', () => {
    it('should return recent events with actor info', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          action: 'CREATED',
          createdAt: new Date(),
          actor: { id: 'user-1', email: 'user1@example.com', role: 'USER' },
        },
      ];

      mockPrisma.events.findMany.mockResolvedValue(mockEvents);

      const result = await eventService.getRecent(50);

      expect(mockPrisma.events.findMany).toHaveBeenCalledWith({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              role: true,
            }
          }
        },
      });

      expect(result).toEqual(mockEvents);
    });
  });

  describe('verifyHash()', () => {
    it('should return true for matching content', () => {
      const content = { title: 'Test', bounty: 1000 };
      const hash = eventService['hashContent'](content);

      const result = eventService.verifyHash(content, hash);

      expect(result).toBe(true);
    });

    it('should return false for different content', () => {
      const content1 = { title: 'Test', bounty: 1000 };
      const content2 = { title: 'Different', bounty: 2000 };

      const hash = eventService['hashContent'](content1);
      const result = eventService.verifyHash(content2, hash);

      expect(result).toBe(false);
    });

    it('should produce consistent hashes for same content', () => {
      const content = { b: 2, a: 1, c: 3 };
      const hash1 = eventService['hashContent'](content);
      const hash2 = eventService['hashContent'](content);

      expect(hash1).toBe(hash2);
    });
  });
});
