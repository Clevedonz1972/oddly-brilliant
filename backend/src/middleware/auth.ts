import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest, JWTPayload, AuthenticationError } from '../types';
import { logger } from '../utils/logger';

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 * Usage: Add to routes that require authentication
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    logger.debug(`User authenticated: ${decoded.email}`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware - attaches user if token is valid, but doesn't fail if missing
 * Usage: Add to routes where authentication is optional
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };
    }

    next();
  } catch (_error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed, continuing without user');
    next();
  }
};
