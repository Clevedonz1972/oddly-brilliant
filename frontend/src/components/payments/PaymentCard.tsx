import { useState } from 'react';
import { Card } from '../common/Card';
import type { Payment } from '../../types';
import { formatCurrency, formatDateTime, formatCurrencySpoken, truncateTxHash, getBlockExplorerUrl } from '../../utils/format';
import { PAYMENT_STATUS_CLASSES, PAYMENT_METHOD_CLASSES } from '../../types/payments';

interface PaymentCardProps {
  payment: Payment;
  showChallenge?: boolean;
}

/**
 * PaymentCard Component
 *
 * Displays individual payment with status badge, payment method,
 * and blockchain transaction details if available.
 */
export const PaymentCard = ({ payment, showChallenge = false }: PaymentCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(payment.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy payment ID:', err);
    }
  };

  const statusIcons = {
    PENDING: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    COMPLETED: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    FAILED: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const methodIcons = {
    FIAT: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    CRYPTO: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  };

  return (
    <Card className="hover:border-[var(--primary)] transition-colors">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        {/* Left Side - Amount and Details */}
        <div className="flex-1">
          {/* Amount */}
          <div className="mb-3">
            <p
              className="text-3xl font-bold text-[var(--primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
              aria-label={formatCurrencySpoken(payment.amount)}
            >
              {formatCurrency(payment.amount)}
            </p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                PAYMENT_STATUS_CLASSES[payment.status]
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {statusIcons[payment.status]}
              <span className="sr-only">Status: </span>
              {payment.status}
            </span>

            {/* Method Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                PAYMENT_METHOD_CLASSES[payment.method]
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {methodIcons[payment.method]}
              <span className="sr-only">Payment method: </span>
              {payment.method}
            </span>
          </div>

          {/* Challenge Info (if showChallenge) */}
          {showChallenge && (
            <div className="mb-2">
              <p className="text-sm text-[var(--text-muted)]">
                Challenge ID:{' '}
                <span className="text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {payment.challengeId.substring(0, 8)}...
                </span>
              </p>
            </div>
          )}

          {/* Recipient */}
          {payment.user && (
            <div className="mb-2">
              <p className="text-sm text-[var(--text-muted)]">
                Recipient:{' '}
                <span className="text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {payment.user.email}
                </span>
              </p>
            </div>
          )}

          {/* Created Date */}
          <div className="text-sm text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatDateTime(payment.createdAt)}
          </div>
        </div>

        {/* Right Side - Transaction Details */}
        <div className="sm:text-right space-y-2">
          {/* Blockchain Transaction Hash */}
          {payment.method === 'CRYPTO' && payment.blockchainTxHash && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Transaction Hash</p>
              <a
                href={getBlockExplorerUrl(payment.blockchainTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--secondary)] transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {truncateTxHash(payment.blockchainTxHash)}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="sr-only">View on block explorer</span>
              </a>
            </div>
          )}

          {/* Payment ID with Copy */}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Payment ID</p>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}
              aria-label={copied ? 'Payment ID copied' : 'Copy payment ID'}
            >
              {payment.id.substring(0, 8)}...
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="sr-only">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="sr-only">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status-specific Messages */}
      {payment.status === 'PENDING' && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-sm text-yellow-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Payment is being processed. You will be notified when it completes.
          </p>
        </div>
      )}

      {payment.status === 'FAILED' && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Payment failed. Please contact support for assistance.
          </p>
        </div>
      )}
    </Card>
  );
};
