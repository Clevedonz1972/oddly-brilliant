import { useState, useMemo } from 'react';
import { SubmissionCard } from './SubmissionCard';
import { SubmissionStatus } from '../../types/submissions';
import type { Submission } from '../../types/submissions';

interface SubmissionListProps {
  submissions: Submission[];
  loading: boolean;
  isProjectLeader?: boolean;
  currentUserId: string;
  onReview?: (id: string, action: 'approve' | 'reject' | 'revision', notes?: string) => void;
  onDelete?: (id: string) => void;
}

// Status filter options
const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: SubmissionStatus.DRAFT, label: 'Drafts' },
  { value: SubmissionStatus.SUBMITTED, label: 'Submitted' },
  { value: SubmissionStatus.IN_REVIEW, label: 'In Review' },
  { value: SubmissionStatus.APPROVED, label: 'Approved' },
  { value: SubmissionStatus.REJECTED, label: 'Rejected' },
  { value: SubmissionStatus.REVISION_REQUESTED, label: 'Revision Requested' },
];

/**
 * List component displaying multiple submissions with filtering and statistics
 */
export const SubmissionList = ({
  submissions,
  loading,
  isProjectLeader = false,
  currentUserId,
  onReview,
  onDelete,
}: SubmissionListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Calculate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const drafts = submissions.filter((s) => s.status === SubmissionStatus.DRAFT).length;
    const submitted = submissions.filter((s) => s.status === SubmissionStatus.SUBMITTED).length;
    const inReview = submissions.filter((s) => s.status === SubmissionStatus.IN_REVIEW).length;
    const approved = submissions.filter((s) => s.status === SubmissionStatus.APPROVED).length;
    const rejected = submissions.filter((s) => s.status === SubmissionStatus.REJECTED).length;
    const revisionRequested = submissions.filter((s) => s.status === SubmissionStatus.REVISION_REQUESTED).length;

    return {
      total,
      drafts,
      submitted,
      inReview,
      approved,
      rejected,
      revisionRequested,
    };
  }, [submissions]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'ALL') {
      return submissions;
    }
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg animate-pulse"
            aria-label="Loading submission"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (submissions.length === 0) {
    return (
      <div className="p-12 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-center">
        <svg
          className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3
          className="text-xl font-semibold text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          No Submissions Yet
        </h3>
        <p className="text-[var(--text-muted)]">
          {isProjectLeader
            ? 'No submissions have been made for this challenge yet.'
            : 'You have not created any submissions yet. Submit your work to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Total
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
        </div>
        <div className="p-3 bg-[var(--bg-elevated)] border border-gray-600 rounded-lg">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Drafts
          </p>
          <p className="text-2xl font-bold text-gray-400">{stats.drafts}</p>
        </div>
        <div className="p-3 bg-[var(--bg-elevated)] border border-blue-600 rounded-lg">
          <p className="text-xs text-blue-400 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Submitted
          </p>
          <p className="text-2xl font-bold text-blue-400">{stats.submitted}</p>
        </div>
        <div className="p-3 bg-[var(--bg-elevated)] border border-yellow-600 rounded-lg">
          <p className="text-xs text-yellow-400 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            In Review
          </p>
          <p className="text-2xl font-bold text-yellow-400">{stats.inReview}</p>
        </div>
        <div className="p-3 bg-[var(--bg-elevated)] border border-green-600 rounded-lg">
          <p className="text-xs text-green-400 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Approved
          </p>
          <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
        </div>
        <div className="p-3 bg-[var(--bg-elevated)] border border-orange-600 rounded-lg">
          <p className="text-xs text-orange-400 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Revision
          </p>
          <p className="text-2xl font-bold text-orange-400">{stats.revisionRequested}</p>
        </div>
        <div className="p-3 bg-[var(--bg-elevated)] border border-red-600 rounded-lg">
          <p className="text-xs text-red-400 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Rejected
          </p>
          <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <label
          htmlFor="status-filter"
          className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Filter by Status:
        </label>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Status filter buttons">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border)]'
              }`}
              aria-pressed={statusFilter === filter.value}
              aria-label={`Filter by ${filter.label}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="p-8 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-center">
          <p className="text-[var(--text-muted)]">No submissions match this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              isProjectLeader={isProjectLeader}
              currentUserId={currentUserId}
              onReview={onReview}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
