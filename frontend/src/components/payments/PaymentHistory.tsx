import { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { PaymentCard } from './PaymentCard';
import type { Payment } from '../../types';
import { formatCurrency } from '../../utils/format';
import { paymentsService } from '../../services/payments.service';

interface PaymentHistoryProps {
  payments: Payment[];
  loading: boolean;
  showFilters?: boolean;
}

type FilterStatus = 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED';
type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC';

/**
 * PaymentHistory Component
 *
 * Displays a list of payments with filtering and sorting capabilities.
 * Shows statistics summary and empty states.
 */
export const PaymentHistory = ({
  payments,
  loading,
  showFilters = true,
}: PaymentHistoryProps) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');

  // Calculate statistics
  const stats = useMemo(() => paymentsService.getStatistics(payments), [payments]);

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let result = [...payments];

    // Apply status filter
    if (filterStatus !== 'ALL') {
      result = result.filter(p => p.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'DATE_DESC':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'DATE_ASC':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'AMOUNT_DESC':
          return b.amount - a.amount;
        case 'AMOUNT_ASC':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [payments, filterStatus, sortOption]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-24 bg-[var(--bg-elevated)] rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Statistics Summary */}
      <Card className="mb-6 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10">
        <h3
          className="text-lg font-semibold text-[var(--text-primary)] mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Payment Statistics
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Total Payments</p>
            <p
              className="text-2xl font-bold text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {stats.totalCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Total Earnings</p>
            <p
              className="text-2xl font-bold text-[var(--success)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {formatCurrency(stats.totalEarnings)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Pending</p>
            <div>
              <p
                className="text-xl font-semibold text-yellow-400"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {formatCurrency(stats.pendingEarnings)}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {stats.pendingCount} payment{stats.pendingCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Completed</p>
            <div>
              <p
                className="text-xl font-semibold text-green-400"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stats.completedCount}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {formatCurrency(stats.totalEarnings)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters and Sorting */}
      {showFilters && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                filterStatus === 'ALL'
                  ? 'bg-[var(--primary)] text-white shadow-[0_0_10px_var(--primary-glow)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              All ({payments.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                filterStatus === 'PENDING'
                  ? 'bg-yellow-600 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-yellow-600'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Pending ({stats.pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('COMPLETED')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                filterStatus === 'COMPLETED'
                  ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-green-600'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Completed ({stats.completedCount})
            </button>
            <button
              onClick={() => setFilterStatus('FAILED')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                filterStatus === 'FAILED'
                  ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-red-600'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Failed ({stats.failedCount})
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm text-[var(--text-muted)]">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--primary)] min-h-[44px]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <option value="DATE_DESC">Newest First</option>
              <option value="DATE_ASC">Oldest First</option>
              <option value="AMOUNT_DESC">Highest Amount</option>
              <option value="AMOUNT_ASC">Lowest Amount</option>
            </select>
          </div>
        </div>
      )}

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <p className="text-xl text-[var(--text-secondary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {filterStatus === 'ALL' ? 'No payments yet' : `No ${filterStatus.toLowerCase()} payments`}
          </p>
          <p className="text-[var(--text-muted)]">
            {filterStatus === 'ALL'
              ? 'Start contributing to challenges to earn payments!'
              : 'Try adjusting your filters to see more payments.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} showChallenge />
          ))}
        </div>
      )}
    </div>
  );
};
