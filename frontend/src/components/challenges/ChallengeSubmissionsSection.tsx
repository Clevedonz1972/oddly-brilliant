import { useEffect, useState } from 'react';
import { SubmissionForm } from '../submissions/SubmissionForm';
import { SubmissionList } from '../submissions/SubmissionList';
import { submissionsService } from '../../services/submissions.service';
import { SubmissionStatus } from '../../types/submissions';
import type { Submission } from '../../types/submissions';
import type { ApiError } from '../../types';

interface ChallengeSubmissionsSectionProps {
  challengeId: string;
  currentUserId: string;
  isProjectLeader: boolean;
  hasAcceptedProposal: boolean;
}

/**
 * Section within ChallengePage showing submissions for that challenge
 * Shows "Submit Work" for contributors with accepted proposals or submission management for Project Leaders
 */
export const ChallengeSubmissionsSection = ({
  challengeId,
  currentUserId,
  isProjectLeader,
  hasAcceptedProposal,
}: ChallengeSubmissionsSectionProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Find user's active submission (not rejected)
  const userActiveSubmission = submissions.find(
    (s) =>
      s.contributorId === currentUserId &&
      s.status !== SubmissionStatus.REJECTED &&
      s.status !== SubmissionStatus.APPROVED
  );

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions();
  }, [challengeId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await submissionsService.getByChallengeId(challengeId);
      setSubmissions(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSuccess = async () => {
    setShowForm(false);
    await fetchSubmissions();
  };

  const handleReview = async (
    id: string,
    action: 'approve' | 'reject' | 'revision',
    notes?: string
  ) => {
    try {
      if (action === 'approve') {
        // Start review first if submitted
        const submission = submissions.find((s) => s.id === id);
        if (submission?.status === SubmissionStatus.SUBMITTED) {
          await submissionsService.startReview(id);
        }
        await submissionsService.approve(id, notes);
      } else if (action === 'reject') {
        await submissionsService.reject(id, notes!);
      } else if (action === 'revision') {
        await submissionsService.requestRevision(id, notes!);
      }
      await fetchSubmissions();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to review submission');
    }
  };

  const handleDelete = async (_id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      // Delete functionality would go here
      // For now, just refresh
      await fetchSubmissions();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete submission');
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
          <svg
            className="w-6 h-6 text-[var(--primary)]"
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
          Work Submissions
          {submissions.length > 0 && (
            <span className="text-lg text-[var(--text-muted)]">({submissions.length})</span>
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
          <svg
            className="w-6 h-6 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p>{error}</p>
            <button
              onClick={fetchSubmissions}
              className="mt-2 text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Contributor View: Show form or existing submission */}
      {!isProjectLeader && (
        <div>
          {!hasAcceptedProposal ? (
            /* User doesn't have accepted proposal */
            <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-center">
              <svg
                className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-[var(--text-secondary)]">
                You need an accepted proposal before you can submit work for this challenge.
              </p>
            </div>
          ) : userActiveSubmission ? (
            /* Show user's existing submission */
            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--primary)] rounded-lg">
                <p className="text-[var(--text-secondary)] mb-3">
                  <strong>Your Submission:</strong>
                </p>
                <SubmissionList
                  submissions={[userActiveSubmission]}
                  loading={false}
                  currentUserId={currentUserId}
                  onDelete={handleDelete}
                />
              </div>

              {/* Show all submissions for context */}
              {submissions.length > 1 && (
                <div>
                  <h3
                    className="text-lg font-semibold text-[var(--text-primary)] mb-3"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Your Previous Submissions
                  </h3>
                  <SubmissionList
                    submissions={submissions.filter((s) => s.id !== userActiveSubmission.id && s.contributorId === currentUserId)}
                    loading={false}
                    currentUserId={currentUserId}
                  />
                </div>
              )}
            </div>
          ) : showForm ? (
            /* Show submission form */
            <div>
              <SubmissionForm challengeId={challengeId} onSuccess={handleSubmissionSuccess} />
              <button
                onClick={() => setShowForm(false)}
                className="mt-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Show "Submit Work" button */
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary min-h-[44px] flex items-center gap-2"
              aria-label="Submit your work for this challenge"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Submit Your Work
            </button>
          )}
        </div>
      )}

      {/* Project Leader View: Show all submissions with actions */}
      {isProjectLeader && (
        <div>
          {loading ? (
            <div className="text-center py-8">
              <div
                className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"
                role="status"
                aria-label="Loading submissions"
              >
                <span className="sr-only">Loading submissions...</span>
              </div>
            </div>
          ) : submissions.length > 0 ? (
            <SubmissionList
              submissions={submissions}
              loading={false}
              isProjectLeader={true}
              currentUserId={currentUserId}
              onReview={handleReview}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-[var(--text-secondary)]">
                No submissions yet. Contributors with accepted proposals can submit their work here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
