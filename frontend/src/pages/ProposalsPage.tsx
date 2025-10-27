import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProposalList } from '../components/proposals/ProposalList';
import { proposalsService } from '../services/proposals.service';
import type { Proposal } from '../types/proposals';
import type { ApiError } from '../types';

/**
 * Page showing all user's proposals
 * Displays statistics, filters, and allows management of proposals
 */
export const ProposalsPage = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's proposals on mount
  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await proposalsService.getMyProposals();
      setProposals(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (proposalId: string) => {
    try {
      await proposalsService.withdraw(proposalId);
      // Refresh proposals list
      await fetchProposals();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to withdraw proposal');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1
            className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            My Proposals
          </h1>

          <button
            onClick={() => navigate('/challenges')}
            className="btn-primary min-h-[44px] flex items-center gap-2"
            aria-label="Browse challenges to create proposals"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Proposal
          </button>
        </div>

        <p className="text-[var(--text-secondary)] leading-relaxed">
          Track and manage your challenge proposals. View their status and take action when needed.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400 flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold mb-1">Error loading proposals</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchProposals}
              className="mt-2 text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <ProposalList
        proposals={proposals}
        loading={loading}
        onWithdraw={handleWithdraw}
      />

      {/* Help Section */}
      {!loading && proposals.length === 0 && !error && (
        <div className="mt-8 p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
          <h2
            className="text-xl font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Getting Started with Proposals
          </h2>
          <ul className="space-y-2 text-[var(--text-secondary)] list-disc list-inside">
            <li>Browse available challenges on the Challenges page</li>
            <li>Click on a challenge to view details and submit a proposal</li>
            <li>Explain why you want to join and what you can contribute</li>
            <li>Project Leaders will review your proposal and respond</li>
            <li>Once accepted, you can start contributing to the challenge</li>
          </ul>
          <button
            onClick={() => navigate('/challenges')}
            className="mt-4 btn-primary min-h-[44px]"
            aria-label="Browse challenges"
          >
            Browse Challenges
          </button>
        </div>
      )}
    </div>
  );
};
