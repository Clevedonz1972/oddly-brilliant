import { useState, useMemo } from 'react';
import { ProposalCard } from './ProposalCard';
import { Loading } from '../common/Loading';
import type { Proposal } from '../../types/proposals';
import { ProposalStatus } from '../../types/proposals';

interface ProposalListProps {
  proposals: Proposal[];
  loading?: boolean;
  onRespond?: (proposalId: string, action: 'ACCEPT' | 'REJECT', message?: string) => void;
  onWithdraw?: (proposalId: string) => void;
}

/**
 * List all proposals with filtering and sorting
 * Cyberpunk-themed with status filters and empty states
 */
export const ProposalList = ({
  proposals,
  loading = false,
  onRespond,
  onWithdraw,
}: ProposalListProps) => {
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'ALL'>('ALL');

  // Filter proposals by status
  const filteredProposals = useMemo(() => {
    if (statusFilter === 'ALL') {
      return proposals;
    }
    return proposals.filter((p) => p.status === statusFilter);
  }, [proposals, statusFilter]);

  // Sort by date (newest first)
  const sortedProposals = useMemo(() => {
    return [...filteredProposals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredProposals]);

  // Count proposals by status
  const statusCounts = useMemo(() => {
    return {
      all: proposals.length,
      pending: proposals.filter((p) => p.status === ProposalStatus.PENDING).length,
      accepted: proposals.filter((p) => p.status === ProposalStatus.ACCEPTED).length,
      rejected: proposals.filter((p) => p.status === ProposalStatus.REJECTED).length,
      withdrawn: proposals.filter((p) => p.status === ProposalStatus.WITHDRAWN).length,
    };
  }, [proposals]);

  // Filter buttons configuration
  const filters = [
    { value: 'ALL', label: 'All', count: statusCounts.all, color: 'text-[var(--text-primary)]' },
    { value: ProposalStatus.PENDING, label: 'Pending', count: statusCounts.pending, color: 'text-yellow-400' },
    { value: ProposalStatus.ACCEPTED, label: 'Accepted', count: statusCounts.accepted, color: 'text-green-400' },
    { value: ProposalStatus.REJECTED, label: 'Rejected', count: statusCounts.rejected, color: 'text-red-400' },
    { value: ProposalStatus.WITHDRAWN, label: 'Withdrawn', count: statusCounts.withdrawn, color: 'text-gray-400' },
  ] as const;

  if (loading) {
    return <Loading message="Loading proposals..." />;
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter proposals by status">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${
              statusFilter === filter.value
                ? 'bg-[var(--primary)] text-white shadow-[0_0_20px_var(--primary-glow)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
            aria-pressed={statusFilter === filter.value}
            aria-label={`Filter by ${filter.label} proposals (${filter.count})`}
          >
            <span className={filter.value !== 'ALL' ? filter.color : ''}>
              {filter.label}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                statusFilter === filter.value
                  ? 'bg-white/20'
                  : 'bg-[var(--bg-primary)]'
              }`}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Statistics Summary */}
      {proposals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-yellow-900/10 border border-yellow-500/30 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'var(--font-display)' }}>
              {statusCounts.pending}
            </div>
            <div className="text-xs text-yellow-300/70 uppercase tracking-wide">Pending</div>
          </div>
          <div className="p-4 bg-green-900/10 border border-green-500/30 rounded-lg">
            <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>
              {statusCounts.accepted}
            </div>
            <div className="text-xs text-green-300/70 uppercase tracking-wide">Accepted</div>
          </div>
          <div className="p-4 bg-red-900/10 border border-red-500/30 rounded-lg">
            <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>
              {statusCounts.rejected}
            </div>
            <div className="text-xs text-red-300/70 uppercase tracking-wide">Rejected</div>
          </div>
          <div className="p-4 bg-gray-900/10 border border-gray-500/30 rounded-lg">
            <div className="text-2xl font-bold text-gray-400" style={{ fontFamily: 'var(--font-display)' }}>
              {statusCounts.withdrawn}
            </div>
            <div className="text-xs text-gray-300/70 uppercase tracking-wide">Withdrawn</div>
          </div>
        </div>
      )}

      {/* Proposals List */}
      {sortedProposals.length > 0 ? (
        <div className="space-y-4">
          {sortedProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onRespond={
                onRespond
                  ? (action, message) => onRespond(proposal.id, action, message)
                  : undefined
              }
              onWithdraw={onWithdraw ? () => onWithdraw(proposal.id) : undefined}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
          <svg
            className="mx-auto h-16 w-16 text-[var(--text-muted)] mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3
            className="text-xl font-semibold text-[var(--text-primary)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No proposals {statusFilter !== 'ALL' && statusFilter.toLowerCase()}
          </h3>
          <p className="text-[var(--text-secondary)]">
            {proposals.length === 0
              ? "You haven't created any proposals yet."
              : `No ${statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} proposals found.`}
          </p>
        </div>
      )}
    </div>
  );
};
