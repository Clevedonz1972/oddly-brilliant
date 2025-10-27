import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { PaymentHistory } from '../components/payments/PaymentHistory';
import { paymentsService } from '../services/payments.service';
import { formatCurrency } from '../utils/format';
import type { Payment } from '../types';

/**
 * PaymentsPage Component
 *
 * Full-page payment history and earnings dashboard.
 * Shows total earnings, pending payments, and complete payment history.
 */
export const PaymentsPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');

    try {
      // Note: Backend doesn't have GET /api/payments/my endpoint yet
      // For now, we'll show a placeholder with empty data
      // In production, this would call: const data = await paymentsService.getMyPayments();

      // Workaround: Check localStorage for any stored payment data
      const storedPayments = localStorage.getItem('userPayments');
      if (storedPayments) {
        setPayments(JSON.parse(storedPayments));
      } else {
        // No payments available
        setPayments([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch payments:', err);
      setError(err.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = paymentsService.getStatistics(payments);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1
            className="text-4xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            My Payments
          </h1>
        </div>
        <p className="text-[var(--text-muted)]">
          Track your earnings and payment history across all challenges
        </p>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Earnings */}
        <Card className="bg-gradient-to-br from-green-900/20 to-green-700/20 border-2 border-green-600 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p
              className="text-sm font-medium text-green-400 mb-2 uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Total Earnings
            </p>
            <p
              className="text-4xl font-bold text-green-400 mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {formatCurrency(stats.totalEarnings)}
            </p>
            <p className="text-sm text-green-300/70">
              {stats.completedCount} completed payment{stats.completedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>

        {/* Pending Earnings */}
        <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-700/20 border-2 border-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <svg className="w-12 h-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p
              className="text-sm font-medium text-yellow-400 mb-2 uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Pending Earnings
            </p>
            <p
              className="text-4xl font-bold text-yellow-400 mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {formatCurrency(stats.pendingEarnings)}
            </p>
            <p className="text-sm text-yellow-300/70">
              {stats.pendingCount} pending payment{stats.pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>

        {/* Payment Count */}
        <Card className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 border-2 border-[var(--primary)] shadow-[0_0_30px_var(--primary-glow)]">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <svg className="w-12 h-12 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p
              className="text-sm font-medium text-[var(--primary)] mb-2 uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Total Payments
            </p>
            <p
              className="text-4xl font-bold text-[var(--primary)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {stats.totalCount}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              All time
            </p>
          </div>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8">
          <ErrorMessage message={error} onRetry={fetchPayments} />
        </div>
      )}

      {/* Backend Limitation Notice */}
      {!loading && payments.length === 0 && !error && (
        <Card className="mb-8 bg-blue-900/10 border-2 border-blue-600">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-400 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Payment History Not Available
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                The backend does not currently have a <code className="px-2 py-1 bg-[var(--bg-elevated)] rounded text-xs">GET /api/payments/my</code> endpoint.
              </p>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Payment data is currently only available immediately after completing a challenge.
                To view payment information:
              </p>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1 ml-4 list-disc mb-4">
                <li>Navigate to a completed challenge you sponsored</li>
                <li>The payment breakdown will be displayed on the challenge page</li>
                <li>Payment data is stored temporarily in your session</li>
              </ul>
              <p className="text-xs text-blue-300/70 italic">
                Note: A dedicated payments API endpoint is needed to display historical payment data here.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payment History Section */}
      <div className="mb-8">
        <h2
          className="text-2xl font-bold text-[var(--text-primary)] mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Payment History
        </h2>
        <PaymentHistory payments={payments} loading={loading} showFilters />
      </div>

      {/* Quick Actions */}
      <Card className="bg-[var(--bg-elevated)]">
        <h3
          className="text-lg font-semibold text-[var(--text-primary)] mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Quick Actions
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/challenges" className="flex-1">
            <Button variant="primary" className="w-full min-h-[44px]">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Challenges
            </Button>
          </Link>
          <Link to="/dashboard" className="flex-1">
            <Button variant="secondary" className="w-full min-h-[44px]">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
