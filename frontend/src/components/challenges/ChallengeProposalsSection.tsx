import { useEffect, useState } from 'react';
import { ProposalForm } from '../proposals/ProposalForm';
import { ProposalList } from '../proposals/ProposalList';
import { proposalsService } from '../../services/proposals.service';
import type { Proposal } from '../../types/proposals';
import type { ApiError } from '../../types';

interface ChallengeProposalsSectionProps {
  challengeId: string;
  currentUserId: string;
  isProjectLeader: boolean;
}

/**
 * Section within ChallengePage showing proposals for that challenge
 * Shows "Propose to Join" for contributors or proposal management for Project Leaders
 */
export const ChallengeProposalsSection = ({
  challengeId,
  currentUserId,
  isProjectLeader,
}: ChallengeProposalsSectionProps) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Find user's existing proposal for this challenge
  const userProposal = proposals.find((p) => p.contributorId === currentUserId);

  // Fetch proposals on mount
  useEffect(() => {
    fetchProposals();
  }, [challengeId]);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await proposalsService.getByChallengeId(challengeId);
      setProposals(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleProposalSuccess = async () => {
    setShowForm(false);
    await fetchProposals();
  };

  const handleRespond = async (proposalId: string, action: 'ACCEPT' | 'REJECT', message?: string) => {
    try {
      await proposalsService.respond(proposalId, { action, responseMessage: message });
      await fetchProposals();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to respond to proposal');
    }
  };

  const handleWithdraw = async (proposalId: string) => {
    try {
      await proposalsService.withdraw(proposalId);
      await fetchProposals();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to withdraw proposal');
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Proposals
          {proposals.length > 0 && (
            <span className="text-lg text-[var(--text-muted)]">({proposals.length})</span>
          )}
        </h2>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400 flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p>{error}</p>
            <button
              onClick={fetchProposals}
              className="mt-2 text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Contributor View: Show form or existing proposal */}
      {!isProjectLeader && (
        <div>
          {userProposal ? (
            /* Show user's existing proposal */
            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--primary)] rounded-lg">
                <p className="text-[var(--text-secondary)] mb-2">
                  <strong>Your Proposal:</strong>
                </p>
                <ProposalList
                  proposals={[userProposal]}
                  loading={false}
                  onWithdraw={handleWithdraw}
                />
              </div>
            </div>
          ) : showForm ? (
            /* Show proposal form */
            <div>
              <ProposalForm
                challengeId={challengeId}
                onSuccess={handleProposalSuccess}
              />
              <button
                onClick={() => setShowForm(false)}
                className="mt-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Show "Propose to Join" button */
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary min-h-[44px] flex items-center gap-2"
              aria-label="Propose to join this challenge"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Propose to Join Challenge
            </button>
          )}
        </div>
      )}

      {/* Project Leader View: Show all proposals with actions */}
      {isProjectLeader && (
        <div>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" role="status" aria-label="Loading proposals">
                <span className="sr-only">Loading proposals...</span>
              </div>
            </div>
          ) : proposals.length > 0 ? (
            <ProposalList
              proposals={proposals}
              loading={false}
              onRespond={handleRespond}
            />
          ) : (
            <div className="text-center py-8 px-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-[var(--text-muted)] mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-[var(--text-secondary)]">
                No proposals yet. Contributors can propose to join your challenge.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
