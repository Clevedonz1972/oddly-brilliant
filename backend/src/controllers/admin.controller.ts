import { Response, NextFunction } from 'express';
import { AuthRequest, NotFoundError, ValidationError } from '../types';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

class AdminController {
  async getAllUsers(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await prisma.users.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          walletAddress: true,
          createdAt: true,
          _count: {
            select: {
              challenges_challenges_sponsorIdTousers: true,
              contributions: true,
              payments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllChallenges(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challenges = await prisma.challenges.findMany({
        include: {
          users_challenges_sponsorIdTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          _count: {
            select: {
              contributions: true,
              payments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: challenges,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUsers,
        totalChallenges,
        totalContributions,
        totalPayments,
        totalBountyAmount,
        totalPaidAmount,
      ] = await Promise.all([
        prisma.users.count(),
        prisma.challenges.count(),
        prisma.contributions.count(),
        prisma.payments.count(),
        prisma.challenges.aggregate({
          _sum: { bountyAmount: true },
        }),
        prisma.payments.aggregate({
          _sum: { amount: true },
          where: { status: 'COMPLETED' },
        }),
      ]);

      const stats = {
        users: totalUsers,
        challenges: totalChallenges,
        contributions: totalContributions,
        payments: totalPayments,
        totalBounty: totalBountyAmount._sum.bountyAmount?.toString() || '0',
        totalPaid: totalPaidAmount._sum.amount?.toString() || '0',
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
        throw new ValidationError('Invalid role');
      }

      const user = await prisma.users.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const updatedUser = await prisma.users.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      logger.info(`Admin ${req.user?.email} updated user ${user.email} role to ${role}`);

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await prisma.users.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Prevent deleting admin users (safety measure)
      if (user.role === 'ADMIN') {
        throw new ValidationError('Cannot delete admin users');
      }

      await prisma.users.delete({
        where: { id },
      });

      logger.warn(`Admin ${req.user?.email} deleted user ${user.email}`);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
