import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { code, meta } = err;

    // Unique constraint violation
    if (code === 'P2002') {
      const fields = (meta?.target as string[]) || [];
      res.status(409).json({
        success: false,
        error: {
          message: `A record with this ${fields.join(', ')} already exists`,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          details: { fields },
        },
      });
      return;
    }

    // Foreign key constraint violation
    if (code === 'P2003') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid reference to related record',
          code: 'FOREIGN_KEY_VIOLATION',
        },
      });
      return;
    }

    // Record not found
    if (code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Record not found',
          code: 'RECORD_NOT_FOUND',
        },
      });
      return;
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  // Handle JWT errors (shouldn't reach here if auth middleware works correctly)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTHENTICATION_ERROR',
      },
    });
    return;
  }

  // Handle unknown errors
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      message: isProduction ? 'Internal server error' : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
};

/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
};
