import { Card } from '../common/Card';
import type { PaymentSummary } from '../../types';
import { formatCurrency, formatPercentage, formatCurrencySpoken, getContributionTypeInfo } from '../../utils/format';
import { CONTRIBUTION_TYPE_COLORS } from '../../types/payments';

interface PaymentBreakdownProps {
  paymentSummary: PaymentSummary;
  bountyAmount: number;
  showDetails?: boolean;
}

/**
 * PaymentBreakdown Component
 *
 * Visualizes payment distribution with token values and percentages.
 * Features color-coded contribution types, progress bars, and accessibility support.
 */
export const PaymentBreakdown = ({
  paymentSummary,
  bountyAmount,
  showDetails = true,
}: PaymentBreakdownProps) => {
  const { splits, totalAmount, totalRecipients } = paymentSummary;

  // Get contribution type info for a split
  const getContributionType = (split: PaymentSummary['splits'][0]): string => {
    // The split doesn't include type directly, but we can infer from tokenValue
    // Standard token values: CODE=30, DESIGN=25, IDEA=20, RESEARCH=15
    const tokenValue = split.tokenValue;
    if (tokenValue === 30) return 'CODE';
    if (tokenValue === 25) return 'DESIGN';
    if (tokenValue === 20) return 'IDEA';
    if (tokenValue === 15) return 'RESEARCH';
    return 'CODE'; // Default
  };

  const getTypeColor = (type: string): string => {
    return CONTRIBUTION_TYPE_COLORS[type as keyof typeof CONTRIBUTION_TYPE_COLORS] || '#00D9FF';
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3
          className="text-2xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Payment Breakdown
        </h3>
        <div className="text-right">
          <p className="text-sm text-[var(--text-muted)] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
            Total Bounty
          </p>
          <p
            className="text-2xl font-bold text-[var(--primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-label={formatCurrencySpoken(bountyAmount)}
          >
            {formatCurrency(bountyAmount)}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">Total Recipients</p>
          <p className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {totalRecipients}
          </p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">Total Distributed</p>
          <p
            className="text-xl font-semibold text-[var(--success)]"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-label={formatCurrencySpoken(totalAmount)}
          >
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      {/* Payment Splits */}
      <div className="space-y-4">
        {splits.map((split, index) => {
          const contributionType = getContributionType(split);
          const typeColor = getTypeColor(contributionType);
          const typeInfo = getContributionTypeInfo(contributionType);

          return (
            <div
              key={split.userId}
              className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
            >
              {/* User and Amount */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                    Contributor #{index + 1}
                  </p>
                  {showDetails && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold border"
                        style={{
                          backgroundColor: `${typeColor}20`,
                          color: typeColor,
                          borderColor: typeColor,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {contributionType}
                      </span>
                      <span className="text-sm text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                        {split.tokenValue} tokens
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className="text-2xl font-bold text-[var(--primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                    aria-label={formatCurrencySpoken(split.amount)}
                  >
                    {formatCurrency(split.amount)}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatPercentage(split.percentage)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${split.percentage}%`,
                    backgroundColor: typeColor,
                    boxShadow: `0 0 10px ${typeColor}80`,
                  }}
                  role="progressbar"
                  aria-valuenow={split.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${formatPercentage(split.percentage)} of total bounty`}
                />
              </div>

              {/* Additional Details */}
              {showDetails && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {typeInfo.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Totals Row */}
      <div className="mt-6 pt-4 border-t-2 border-[var(--primary)]">
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            TOTAL
          </p>
          <div className="text-right">
            <p
              className="text-2xl font-bold text-[var(--primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
              aria-label={formatCurrencySpoken(totalAmount)}
            >
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
              100.00%
            </p>
          </div>
        </div>
      </div>

      {/* Verification Notice */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded text-sm text-blue-400">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            Payment amounts are automatically calculated based on contribution token values.
            All calculations are transparent and auditable.
          </p>
        </div>
      </div>
    </Card>
  );
};
