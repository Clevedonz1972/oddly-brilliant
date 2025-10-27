import { PaginationParams } from '../types';
import { ContributionType } from '@prisma/client';

/**
 * Calculate pagination parameters from query string
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Pagination parameters with skip and limit
 */
export const getPagination = (
  page: string | number = 1,
  limit: string | number = 10
): PaginationParams => {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

  const validPage = Math.max(1, isNaN(pageNum) ? 1 : pageNum);
  const validLimit = Math.min(100, Math.max(1, isNaN(limitNum) ? 10 : limitNum));

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit,
  };
};

/**
 * Remove sensitive fields from user object
 * @param user - User object with all fields
 * @returns User object without sensitive fields
 */
export const sanitizeUser = <T extends Record<string, unknown>>(user: T): Omit<T, 'passwordHash'> => {
  const { passwordHash: _passwordHash, ...sanitized } = user as T & { passwordHash?: string };
  return sanitized as Omit<T, 'passwordHash'>;
};

/**
 * Check if a string is a valid email
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if a string is a valid Ethereum address
 * @param address - Ethereum address to validate
 * @returns True if valid Ethereum address format
 */
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Generate a random string of specified length
 * @param length - Length of random string
 * @returns Random string
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sleep/delay utility
 * @param ms - Milliseconds to sleep
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Format Decimal to string with fixed precision
 * @param value - Decimal value
 * @param precision - Number of decimal places
 */
export const formatDecimal = (value: unknown, precision = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return num.toFixed(precision);
};

/**
 * Calculate token value based on contribution type
 * This determines how much a contribution is worth in the payment distribution
 *
 * Token Values:
 * - CODE: 30 tokens (most valuable - working solution)
 * - DESIGN: 25 tokens (visual/UX work)
 * - IDEA: 20 tokens (concept/approach)
 * - RESEARCH: 15 tokens (background work)
 *
 * @param type - Contribution type
 * @returns Token value for the contribution type
 */
export const calculateTokenValue = (type: ContributionType): number => {
  const TOKEN_VALUES: Record<ContributionType, number> = {
    CODE: 30,
    DESIGN: 25,
    IDEA: 20,
    RESEARCH: 15,
  };

  return TOKEN_VALUES[type];
};
