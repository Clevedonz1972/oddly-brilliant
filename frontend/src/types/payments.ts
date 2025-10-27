/**
 * Payment type definitions for the oddly-brilliant platform
 */

export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentMethod = {
  FIAT: 'FIAT',
  CRYPTO: 'CRYPTO'
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

// Re-export payment interfaces from main types file for convenience
export type {
  Payment,
  PaymentSplit,
  PaymentSummary,
  CompleteChallengeResponse
} from './index';

/**
 * Contribution type color mapping for payment breakdown visualization
 */
export const CONTRIBUTION_TYPE_COLORS = {
  CODE: '#00D9FF',      // Cyan
  DESIGN: '#FF00FF',    // Magenta
  IDEA: '#FFD700',      // Gold/Yellow
  RESEARCH: '#00FF88'   // Green
} as const;

/**
 * Payment status color classes for Tailwind
 */
export const PAYMENT_STATUS_CLASSES = {
  PENDING: 'bg-yellow-900/40 text-yellow-400 border-yellow-600',
  COMPLETED: 'bg-green-900/40 text-green-400 border-green-600',
  FAILED: 'bg-red-900/40 text-red-400 border-red-600'
} as const;

/**
 * Payment method color classes for Tailwind
 */
export const PAYMENT_METHOD_CLASSES = {
  FIAT: 'bg-blue-900/40 text-blue-400 border-blue-600',
  CRYPTO: 'bg-purple-900/40 text-purple-400 border-purple-600'
} as const;
