import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { Proposal } from '../../types/proposals';
import { ProposalStatus } from '../../types/proposals';

interface ProposalCardProps {
  proposal: Proposal;
  onRespond?: (action: 'ACCEPT' | 'REJECT', message?: string) => void;
  onWithdraw?: () => void;
  showActions?: boolean;
}

/**
 * Display a single proposal with status badge and actions
 * Cyberpunk-themed with color-coded status and accessibility features
 */
export const ProposalCard = ({
  proposal,
  onRespond,
  onWithdraw,
  showActions = true,
}: ProposalCardProps) => {
  const navigate = useNavigate();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseAction, setResponseAction] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Status badge styling - cyberpunk theme with color + icon
  const statusConfig = {
    [ProposalStatus.PENDING]: {
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-500',
      text: 'text-yellow-400',
      glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Pending',
    },
    [ProposalStatus.ACCEPTED]: {
      bg: 'bg-green-900/20',
      border: 'border-green-500',
      text: 'text-green-400',
      glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Accepted',
    },
    [ProposalStatus.REJECTED]: {
      bg: 'bg-red-900/20',
      border: 'border-red-500',
      text: 'text-red-400',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Rejected',
    },
    [ProposalStatus.WITHDRAWN]: {
      bg: 'bg-gray-900/20',
      border: 'border-gray-500',
      text: 'text-gray-400',
      glow: 'shadow-[0_0_10px_rgba(107,114,128,0.3)]',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
        </svg>
      ),
      label: 'Withdrawn',
    },
  };

  const status = statusConfig[proposal.status];

  const handleRespond = async () => {
    if (!onRespond) return;

    setLoading(true);
    try {
      await onRespond(responseAction, responseMessage || undefined);
      setShowResponseForm(false);
      setResponseMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!onWithdraw) return;

    if (!confirm('Are you sure you want to withdraw this proposal?')) {
      return;
    }

    setLoading(true);
    try {
      await onWithdraw();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover:border-[var(--primary)] transition-all duration-300">
      {/* Header with Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <button
            onClick={() => navigate(`/challenges/${proposal.challengeId}`)}
            className="text-lg font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-label={`View challenge: ${proposal.challenge.title}`}
          >
            {proposal.challenge.title}
          </button>
          <p className="text-sm text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
            by {proposal.contributor.email}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${status.bg} ${status.border} ${status.text} ${status.glow} border`}
          style={{ fontFamily: 'var(--font-display)' }}
          role="status"
          aria-label={`Proposal status: ${status.label}`}
        >
          {status.icon}
          <span className="sr-only">Status: </span>
          {status.label}
        </span>
      </div>

      {/* Proposal Message */}
      {proposal.message && (
        <div className="mb-4 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg">
          <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {proposal.message}
          </p>
        </div>
      )}

      {/* Response Info (for accepted/rejected proposals) */}
      {(proposal.status === ProposalStatus.ACCEPTED || proposal.status === ProposalStatus.REJECTED) &&
        proposal.respondedBy && (
          <div className="mb-4 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                Responded by {proposal.respondedBy.email}
              </span>
            </div>
            {proposal.responseMessage && (
              <p className="text-sm text-[var(--text-secondary)]">{proposal.responseMessage}</p>
            )}
          </div>
        )}

      {/* Actions */}
      {showActions && (
        <div className="space-y-3">
          {/* Pending: Show Accept/Reject or Withdraw */}
          {proposal.status === ProposalStatus.PENDING && (
            <>
              {onRespond && !showResponseForm && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setResponseAction('ACCEPT');
                      setShowResponseForm(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold min-h-[44px]"
                    disabled={loading}
                    aria-label="Accept proposal"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept
                  </Button>
                  <Button
                    onClick={() => {
                      setResponseAction('REJECT');
                      setShowResponseForm(true);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold min-h-[44px]"
                    disabled={loading}
                    aria-label="Reject proposal"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </Button>
                </div>
              )}

              {showResponseForm && (
                <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg space-y-3">
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Optional message to the contributor..."
                    rows={3}
                    className="input input-focus-glow w-full resize-none"
                    aria-label="Response message"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRespond}
                      loading={loading}
                      className={`flex-1 ${
                        responseAction === 'ACCEPT'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white font-semibold min-h-[44px]`}
                      aria-label={`Confirm ${responseAction.toLowerCase()} proposal`}
                    >
                      Confirm {responseAction === 'ACCEPT' ? 'Accept' : 'Reject'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowResponseForm(false);
                        setResponseMessage('');
                      }}
                      disabled={loading}
                      className="bg-gray-600 hover:bg-gray-700 text-white min-h-[44px]"
                      aria-label="Cancel response"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {onWithdraw && !onRespond && (
                <Button
                  onClick={handleWithdraw}
                  loading={loading}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold min-h-[44px]"
                  aria-label="Withdraw proposal"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Withdraw Proposal
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer with Timestamp */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          Created {formatDate(proposal.createdAt)}
        </span>
        {proposal.respondedAt && (
          <>
            <span className="text-[var(--border)]">•</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              Responded {formatDate(proposal.respondedAt)}
            </span>
          </>
        )}
      </div>
    </Card>
  );
};
