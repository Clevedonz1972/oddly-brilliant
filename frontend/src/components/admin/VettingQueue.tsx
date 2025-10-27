import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { VettingChallenge } from '../../types/governance';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * VettingQueue - Lists challenges awaiting approval
 * Provides Approve/Reject actions for admins
 */
export const VettingQueue = () => {
  const [challenges, setChallenges] = useState<VettingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    challengeId: string;
    action: 'approve' | 'reject';
    title: string;
  }>({
    isOpen: false,
    challengeId: '',
    action: 'approve',
    title: '',
  });

  const fetchPendingChallenges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<VettingChallenge[]>('/admin/challenges', {
        params: { vettingStatus: 'PENDING' },
      });
      setChallenges(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending challenges');
      console.error('Vetting queue error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingChallenges();
  }, []);

  const handleVettingAction = async (
    challengeId: string,
    approved: boolean
  ) => {
    try {
      setActionLoading(challengeId);
      await api.post(`/admin/challenges/${challengeId}/vet`, { approved });

      // Remove from list on success
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));

      // Show success message
      const action = approved ? 'approved' : 'rejected';
      console.log(`Challenge ${action} successfully`);
    } catch (err: any) {
      setError(err.message || `Failed to ${approved ? 'approve' : 'reject'} challenge`);
      console.error('Vetting action error:', err);
    } finally {
      setActionLoading(null);
      setConfirmDialog({ isOpen: false, challengeId: '', action: 'approve', title: '' });
    }
  };

  const openConfirmDialog = (
    challengeId: string,
    action: 'approve' | 'reject',
    title: string
  ) => {
    setConfirmDialog({ isOpen: true, challengeId, action, title });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <Loading />
      </Card>
    );
  }

  if (error && challenges.length === 0) {
    return (
      <Card>
        <ErrorMessage message={error} />
        <Button onClick={fetchPendingChallenges} className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Vetting Queue
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} awaiting
              review
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchPendingChallenges}
            disabled={loading}
            aria-label="Refresh vetting queue"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} />
          </div>
        )}

        {challenges.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-[var(--text-secondary)]">
              No challenges pending approval
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              All caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[var(--text-primary)] mb-2">
                      {challenge.title}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mb-3 break-words">
                      {truncateText(challenge.description, 200)}
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-[var(--warning)]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-semibold text-[var(--warning)]">
                          {challenge.bountyAmount.toLocaleString()} tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-[var(--text-muted)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="text-sm text-[var(--text-muted)] font-mono">
                          {challenge.sponsor.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-[var(--text-muted)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm text-[var(--text-muted)]">
                          {formatDate(challenge.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      onClick={() =>
                        openConfirmDialog(challenge.id, 'approve', challenge.title)
                      }
                      disabled={actionLoading === challenge.id}
                      loading={
                        actionLoading === challenge.id &&
                        confirmDialog.action === 'approve'
                      }
                      aria-label={`Approve challenge: ${challenge.title}`}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        openConfirmDialog(challenge.id, 'reject', challenge.title)
                      }
                      disabled={actionLoading === challenge.id}
                      loading={
                        actionLoading === challenge.id &&
                        confirmDialog.action === 'reject'
                      }
                      aria-label={`Reject challenge: ${challenge.title}`}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onConfirm={() =>
            handleVettingAction(
              confirmDialog.challengeId,
              confirmDialog.action === 'approve'
            )
          }
          onCancel={() =>
            setConfirmDialog({ isOpen: false, challengeId: '', action: 'approve', title: '' })
          }
          title={`${confirmDialog.action === 'approve' ? 'Approve' : 'Reject'} Challenge`}
          message={`Are you sure you want to ${confirmDialog.action} "${confirmDialog.title}"? This action cannot be undone.`}
          confirmLabel={confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
          confirmVariant={confirmDialog.action === 'approve' ? 'primary' : 'danger'}
        />
      )}
    </>
  );
};
