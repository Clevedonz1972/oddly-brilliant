import { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { PaymentBreakdown } from '../payments/PaymentBreakdown';
import type { CompleteChallengeResponse } from '../../types';
import { formatCurrency } from '../../utils/format';

interface ChallengePaymentsSectionProps {
  challengeId: string;
  challengeStatus: string;
  bountyAmount: number;
  isProjectLeader: boolean;
  completeChallengeResponse?: CompleteChallengeResponse | null;
}

/**
 * ChallengePaymentsSection Component
 *
 * Displays payment breakdown for completed challenges.
 * Shows different views for project leaders and contributors.
 */
export const ChallengePaymentsSection = ({
  challengeStatus,
  bountyAmount,
  isProjectLeader,
  completeChallengeResponse,
}: ChallengePaymentsSectionProps) => {
  const [paymentData] = useState<CompleteChallengeResponse | null>(
    completeChallengeResponse || null
  );

  // Only render if challenge is completed
  if (challengeStatus !== 'COMPLETED') {
    return null;
  }

  // If we don't have payment data, show a message
  // Note: In production, you would fetch this from an API
  if (!paymentData || !paymentData.paymentSummary) {
    return (
      <Card className="mt-8">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Payment Information
          </h3>
          <p className="text-[var(--text-muted)] mb-4">
            Payment data is not available for this challenge.
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Note: Payment data is currently only stored in session after completing a challenge.
            A backend endpoint for retrieving payment history is needed.
          </p>
        </div>
      </Card>
    );
  }

  const { payments, paymentSummary } = paymentData;

  // Find current user's payment if they are a contributor
  const userPayment = !isProjectLeader
    ? payments.find(p => p.userId === localStorage.getItem('userId'))
    : null;

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-bold text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Payment Distribution
        </h2>
        <p className="text-[var(--text-muted)]">
          {isProjectLeader
            ? 'Payment breakdown for all contributors'
            : 'Your payment information for this challenge'}
        </p>
      </div>

      {/* Contributor View - Show their payment */}
      {!isProjectLeader && userPayment && (
        <Card className="mb-6 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 border-2 border-[var(--primary)]">
          <div className="text-center">
            <p className="text-sm text-[var(--text-muted)] mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Your Payment
            </p>
            <p
              className="text-4xl font-bold text-[var(--primary)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {formatCurrency(userPayment.amount)}
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  userPayment.status === 'COMPLETED'
                    ? 'bg-green-900/40 text-green-400 border border-green-600'
                    : userPayment.status === 'PENDING'
                    ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-600'
                    : 'bg-red-900/40 text-red-400 border border-red-600'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {userPayment.status}
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-400 border border-blue-600"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {userPayment.method}
              </span>
            </div>
            {userPayment.status === 'PENDING' && (
              <p className="text-sm text-yellow-400">
                Your payment is being processed and will be completed shortly.
              </p>
            )}
            {userPayment.status === 'COMPLETED' && (
              <p className="text-sm text-green-400">
                Payment has been completed successfully!
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Payment Breakdown (visible to all) */}
      <PaymentBreakdown
        paymentSummary={paymentSummary}
        bountyAmount={bountyAmount}
        showDetails={isProjectLeader}
      />

      {/* Project Leader Actions */}
      {isProjectLeader && (
        <Card className="mt-6 bg-[var(--bg-elevated)]">
          <h3
            className="text-lg font-semibold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Project Leader Actions
          </h3>

          <div className="space-y-3">
            {/* Download Evidence Package */}
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Download a complete audit package with payment breakdowns, contribution details, and evidence.
                </p>
                <Button
                  onClick={() => {
                    // In production, this would call the evidence package download endpoint
                    alert('Evidence package download not implemented. Backend endpoint: GET /api/admin/evidence/download/:packageId');
                  }}
                  variant="secondary"
                  className="min-h-[44px]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Audit Package
                </Button>
              </div>
            </div>

            {/* Payment Status Management (Future) */}
            <div className="pt-3 border-t border-[var(--border)]">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-muted)] mb-1">
                    Payment Status Management (Coming Soon)
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Future feature: Mark payments as completed/failed, process refunds, and manage disputes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Summary for Contributors */}
      {!isProjectLeader && !userPayment && (
        <Card className="mt-6 bg-blue-900/10 border border-blue-600">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-400">
                You did not contribute to this challenge, so you will not receive a payment.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
