import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Prisma Client singleton instance
 * Uses a global variable to prevent multiple instances in development with hot reloading
 */
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma Client with logging configuration
 */
const createPrismaClient = (): PrismaClient => {
  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

  // Log queries in development
  if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
      logger.debug(`Query: ${e.query}`);
      logger.debug(`Duration: ${e.duration}ms`);
    });
  }

  // Log errors
  prisma.$on('error', (e) => {
    logger.error('Prisma Error:', e);
  });

  // Log warnings
  prisma.$on('warn', (e) => {
    logger.warn('Prisma Warning:', e);
  });

  return prisma;
};

/**
 * Export singleton Prisma Client instance
 */
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Test database connection
 * @returns Promise that resolves if connection is successful
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
};

/**
 * Gracefully disconnect from database
 */
export const disconnect = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};
