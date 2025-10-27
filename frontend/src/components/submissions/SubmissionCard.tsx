import { useState } from 'react';
import { Button } from '../common/Button';
import { formatFileSize, formatDateTime } from '../../utils/format';
import { SubmissionStatus } from '../../types/submissions';
import type { Submission } from '../../types/submissions';

interface SubmissionCardProps {
  submission: Submission;
  isProjectLeader: boolean;
  currentUserId: string;
  onReview?: (id: string, action: 'approve' | 'reject' | 'revision', notes?: string) => void;
  onDelete?: (id: string) => void;
}

// Status badge color mapping
const statusColors: Record<string, string> = {
  [SubmissionStatus.DRAFT]: 'bg-gray-900/40 text-gray-400 border-gray-600',
  [SubmissionStatus.SUBMITTED]: 'bg-blue-900/40 text-blue-400 border-blue-600',
  [SubmissionStatus.IN_REVIEW]: 'bg-yellow-900/40 text-yellow-400 border-yellow-600',
  [SubmissionStatus.APPROVED]: 'bg-green-900/40 text-green-400 border-green-600',
  [SubmissionStatus.REJECTED]: 'bg-red-900/40 text-red-400 border-red-600',
  [SubmissionStatus.REVISION_REQUESTED]: 'bg-orange-900/40 text-orange-400 border-orange-600',
};

// Status label mapping
const statusLabels: Record<string, string> = {
  [SubmissionStatus.DRAFT]: 'Draft',
  [SubmissionStatus.SUBMITTED]: 'Submitted',
  [SubmissionStatus.IN_REVIEW]: 'In Review',
  [SubmissionStatus.APPROVED]: 'Approved',
  [SubmissionStatus.REJECTED]: 'Rejected',
  [SubmissionStatus.REVISION_REQUESTED]: 'Revision Requested',
};

/**
 * Card component displaying a single submission with actions
 * Shows different actions based on user role and submission status
 */
export const SubmissionCard = ({
  submission,
  isProjectLeader,
  currentUserId,
  onReview,
  onDelete,
}: SubmissionCardProps) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = submission.contributorId === currentUserId;
  const canEdit = isOwner && (submission.status === SubmissionStatus.DRAFT || submission.status === SubmissionStatus.REVISION_REQUESTED);
  const canDelete = isOwner && submission.status === SubmissionStatus.DRAFT;
  const canStartReview = isProjectLeader && submission.status === SubmissionStatus.SUBMITTED;
  const canReview = isProjectLeader && submission.status === SubmissionStatus.IN_REVIEW;

  // Handle review action
  const handleReviewSubmit = async () => {
    if (!onReview) return;

    // Validate review notes for reject and revision
    if ((reviewAction === 'reject' || reviewAction === 'revision') && reviewNotes.trim().length < 10) {
      return;
    }

    setIsSubmitting(true);
    await onReview(submission.id, reviewAction, reviewNotes.trim() || undefined);
    setIsSubmitting(false);
    setShowReviewModal(false);
    setReviewNotes('');
  };

  // Open review modal
  const openReviewModal = (action: 'approve' | 'reject' | 'revision') => {
    setReviewAction(action);
    setShowReviewModal(true);
  };

  // Get file icon based on type
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return (
        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimetype.startsWith('video/')) {
      return (
        <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimetype === 'application/pdf') {
      return (
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  return (
    <>
      <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {submission.title}
            </h4>
            <p className="text-sm text-[var(--text-muted)]">
              by {submission.contributor.email}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[submission.status]}`}
            aria-label={`Status: ${statusLabels[submission.status]}`}
          >
            {statusLabels[submission.status]}
          </span>
        </div>

        {/* Description */}
        <p className="text-[var(--text-secondary)] mb-4 whitespace-pre-wrap">
          {submission.description}
        </p>

        {/* Files */}
        {submission.files.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Attachments ({submission.files.length})
            </p>
            <div className="space-y-1">
              {submission.files.map((file) => (
                <div key={file.id} className="flex items-center gap-2 p-2 bg-[var(--bg-primary)] rounded border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
                  {getFileIcon(file.mimetype)}
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/submissions/${submission.id}/files/${file.id}/download`}
                    download={file.originalName}
                    className="flex-1 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 truncate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {file.originalName}
                  </a>
                  <span className="text-xs text-[var(--text-muted)]">{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Notes */}
        {submission.reviewNotes && (
          <div className={`mb-4 p-3 rounded-lg border ${
            submission.status === SubmissionStatus.APPROVED
              ? 'bg-green-900/20 border-green-500 text-green-400'
              : submission.status === SubmissionStatus.REJECTED
              ? 'bg-red-900/20 border-red-500 text-red-400'
              : 'bg-orange-900/20 border-orange-500 text-orange-400'
          }`}>
            <p className="text-sm font-medium mb-1">
              Review Notes {submission.reviewedBy && `by ${submission.reviewedBy.email}`}
            </p>
            <p className="text-sm whitespace-pre-wrap">{submission.reviewNotes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-[var(--text-muted)] space-y-1 mb-4">
          <p>Created: {formatDateTime(submission.createdAt)}</p>
          {submission.submittedAt && <p>Submitted: {formatDateTime(submission.submittedAt)}</p>}
          {submission.reviewedAt && <p>Reviewed: {formatDateTime(submission.reviewedAt)}</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Contributor Actions */}
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => {/* TODO: Navigate to edit */}}
              aria-label="Edit submission"
              className="px-4 py-2 text-sm"
            >
              Edit
            </Button>
          )}

          {canDelete && onDelete && (
            <Button
              variant="outline"
              onClick={() => onDelete(submission.id)}
              aria-label="Delete submission"
              className="px-4 py-2 text-sm text-red-400 border-red-600 hover:bg-red-900/20"
            >
              Delete
            </Button>
          )}

          {/* Project Leader Actions */}
          {canStartReview && onReview && (
            <Button
              variant="primary"
              onClick={() => onReview(submission.id, 'approve')}
              aria-label="Start review"
              className="px-4 py-2 text-sm"
            >
              Start Review
            </Button>
          )}

          {canReview && onReview && (
            <>
              <Button
                variant="primary"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                onClick={() => openReviewModal('approve')}
                aria-label="Approve submission"
              >
                Approve
              </Button>
              <Button
                variant="primary"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm"
                onClick={() => openReviewModal('revision')}
                aria-label="Request revision"
              >
                Request Revision
              </Button>
              <Button
                variant="outline"
                onClick={() => openReviewModal('reject')}
                aria-label="Reject submission"
                className="px-4 py-2 text-sm text-red-400 border-red-600 hover:bg-red-900/20"
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReviewModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div
            className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="review-modal-title"
              className="text-xl font-bold text-[var(--text-primary)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {reviewAction === 'approve' ? 'Approve Submission' : reviewAction === 'reject' ? 'Reject Submission' : 'Request Revision'}
            </h3>

            <div className="mb-4">
              <label
                htmlFor="review-notes"
                className="block text-sm font-medium mb-2 text-[var(--text-secondary)] uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {reviewAction === 'approve' ? 'Notes (Optional)' : 'Notes *'}
              </label>
              <textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Add any feedback or comments...'
                    : reviewAction === 'reject'
                    ? 'Explain why this submission is rejected...'
                    : 'Explain what needs to be revised...'
                }
                rows={4}
                required={reviewAction !== 'approve'}
                minLength={reviewAction !== 'approve' ? 10 : undefined}
                maxLength={2000}
                className="input input-focus-glow w-full resize-none"
                aria-required={reviewAction !== 'approve'}
              />
              {reviewAction !== 'approve' && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {reviewNotes.length}/2000 characters (minimum 10)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReviewSubmit}
                loading={isSubmitting}
                disabled={isSubmitting || (reviewAction !== 'approve' && reviewNotes.trim().length < 10)}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : reviewAction === 'approve' ? 'Approve' : reviewAction === 'reject' ? 'Reject' : 'Request Revision'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
