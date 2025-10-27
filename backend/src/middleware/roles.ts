import { Response, NextFunction } from 'express';
import { AuthRequest, AuthorizationError } from '../types';
import { prisma } from '../config/database';

export const requireRole = (requiredRole: 'ADMIN' | 'MODERATOR') => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      // Fetch user with role from database
      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
        select: { role: true },
      });

      if (!user) {
        throw new AuthorizationError('User not found');
      }

      // Check if user has required role
      if (user.role !== requiredRole && user.role !== 'ADMIN') {
        throw new AuthorizationError(`${requiredRole} role required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
