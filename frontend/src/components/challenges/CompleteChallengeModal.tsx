import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
import { PaymentBreakdown } from '../payments/PaymentBreakdown';
import { contributionsService } from '../../services/contributions.service';
import { paymentsService } from '../../services/payments.service';
import { formatCurrency } from '../../utils/format';
import type { PaymentSummary } from '../../types';

interface CompleteChallengeModalProps {
  challengeId: string;
  bountyAmount: number;
  contributionCount: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * CompleteChallengeModal Component
 *
 * Modal for previewing payment distribution before completing a challenge.
 * Shows warning about irreversibility and requires explicit confirmation.
 */
export const CompleteChallengeModal = ({
  challengeId,
  bountyAmount,
  contributionCount,
  isOpen,
  onClose,
  onConfirm,
}: CompleteChallengeModalProps) => {
  const [paymentPreview, setPaymentPreview] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchContributions();
      setConfirmed(false);
      setSuccess(false);
    }
  }, [isOpen, challengeId]);

  const fetchContributions = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await contributionsService.getContributionsByChallenge(challengeId);

      // Calculate payment preview
      const preview = paymentsService.calculatePaymentPreview(data, bountyAmount);

      // Create PaymentSummary structure
      const summary: PaymentSummary = {
        totalAmount: bountyAmount,
        totalRecipients: preview.length,
        splits: preview.map(p => ({
          userId: p.userId,
          contributionId: data.find(c => c.userId === p.userId)?.id || '',
          percentage: p.percentage,
          amount: p.amount,
          tokenValue: p.tokenValue,
        })),
      };

      setPaymentPreview(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load contributions');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError('');

    try {
      await onConfirm();
      setSuccess(true);
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete challenge');
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div
        className="bg-[var(--bg-primary)] border-2 border-[var(--primary)] rounded-lg shadow-[0_0_50px_var(--primary-glow)] max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border)] px-6 py-4 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2
                id="modal-title"
                className="text-2xl font-bold text-[var(--text-primary)] mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Complete Challenge
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Review payment distribution before finalizing
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          {!success && (
            <div className="mb-6 p-4 bg-[var(--warning)]/10 border-2 border-[var(--warning)] rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--warning)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--warning)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    This action cannot be undone
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    Completing the challenge will:
                  </p>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-1 ml-4 list-disc">
                    <li>Create payment records for all contributors</li>
                    <li>Change challenge status to COMPLETED</li>
                    <li>Prevent further contributions</li>
                    <li>Initiate payment processing</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-6 bg-green-900/20 border-2 border-green-600 rounded-lg text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-400 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Challenge Completed!
              </h3>
              <p className="text-[var(--text-secondary)]">
                Payments have been created and will be processed shortly.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12">
              <Loading message="Loading contribution data..." />
            </div>
          )}

          {/* Payment Preview */}
          {!loading && !success && paymentPreview && (
            <>
              {/* Summary Stats */}
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)] mb-1">Total Bounty</p>
                  <p className="text-xl font-bold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatCurrency(bountyAmount)}
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)] mb-1">Recipients</p>
                  <p className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {paymentPreview.totalRecipients}
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)] mb-1">Contributions</p>
                  <p className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {contributionCount}
                  </p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="mb-6">
                <PaymentBreakdown
                  paymentSummary={paymentPreview}
                  bountyAmount={bountyAmount}
                  showDetails
                />
              </div>

              {/* Confirmation Checkbox */}
              <div className="mb-6 p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-2 border-[var(--border)] bg-[var(--bg-primary)] checked:bg-[var(--primary)] checked:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] cursor-pointer"
                  />
                  <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors select-none">
                    I confirm that all contributions are finalized and I want to complete this challenge.
                    I understand this action cannot be undone.
                  </span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="sticky bottom-0 bg-[var(--bg-primary)] border-t border-[var(--border)] px-6 py-4 flex justify-end gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              disabled={confirming}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!confirmed || confirming || loading}
              className="min-h-[44px] bg-[var(--success)] text-[var(--bg-primary)] hover:shadow-[0_0_30px_var(--success-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Completing...
                </>
              ) : (
                'Complete Challenge'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
