import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { ContributionForm } from '../components/challenges/ContributionForm';
import { ContributionCard } from '../components/challenges/ContributionCard';
import { ChallengeProposalsSection } from '../components/challenges/ChallengeProposalsSection';
import { ChallengeSubmissionsSection } from '../components/challenges/ChallengeSubmissionsSection';
import { CompleteChallengeModal } from '../components/challenges/CompleteChallengeModal';
import { ChallengePaymentsSection } from '../components/challenges/ChallengePaymentsSection';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';
import { challengesService } from '../services/challenges.service';
import { contributionsService } from '../services/contributions.service';
import { proposalsService } from '../services/proposals.service';
import { formatRelativeTime, formatCurrency } from '../utils/format';
import { ProposalStatus } from '../types/proposals';
import type { Challenge, Contribution, CompleteChallengeResponse } from '../types';
import type { Proposal } from '../types/proposals';

/**
 * Single challenge page with details, contributions list, and action buttons
 * Includes sponsor controls for marking challenges complete
 */
export const ChallengePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [completeChallengeData, setCompleteChallengeData] = useState<CompleteChallengeResponse | null>(null);

  const fetchChallenge = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      const [challengeData, contributionsData, proposalsData] = await Promise.all([
        challengesService.getChallengeById(id),
        contributionsService.getContributionsByChallenge(id),
        proposalsService.getByChallengeId(id).catch(() => [] as Proposal[]),
      ]);
      setChallenge(challengeData);
      setContributions(contributionsData);
      setProposals(proposalsData);
    } catch (err) {
      setError('Failed to load challenge details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, [id]);

  const handleContributionSubmit = async (data: { content: string; type: string }) => {
    if (!id) return;

    // The form will handle creating the contribution
    await contributionsService.createContribution({
      challengeId: id,
      content: data.content,
      type: data.type as any,
      // tokenValue is auto-calculated by backend
    });

    // Refresh contributions list
    const updatedContributions = await contributionsService.getContributionsByChallenge(id);
    setContributions(updatedContributions);
  };

  const handleMarkComplete = async () => {
    if (!challenge || !id) return;

    setCompletionError(null);
    setCompletionSuccess(null);

    try {
      // Use the complete endpoint that creates payments
      const result = await challengesService.completeChallenge(id);

      // Store payment data for display
      setCompleteChallengeData(result);

      // Show success with payment details
      const message = `Challenge completed! ${result.paymentSummary.totalRecipients} contributors will receive payment.`;
      setCompletionSuccess(message);

      // Refresh challenge data
      await fetchChallenge();
      setShowCompleteModal(false);
    } catch (error: any) {
      console.error('Failed to complete challenge:', error);
      setCompletionError(
        error.response?.data?.error?.message ||
        error.message ||
        'Failed to complete challenge. Please try again.'
      );
      throw error; // Re-throw so modal can handle it
    }
  };

  if (loading) {
    return <Loading message="Loading challenge..." />;
  }

  if (error && !challenge) {
    return <ErrorMessage message={error || 'Challenge not found'} onRetry={fetchChallenge} />;
  }

  if (!challenge) {
    return <ErrorMessage message="Challenge not found" onRetry={() => navigate('/challenges')} />;
  }

  const isSponsor = user?.id === challenge.sponsorId;
  const canContribute = isAuthenticated && (challenge.status === 'OPEN' || challenge.status === 'IN_PROGRESS');
  const canComplete = isSponsor && challenge.status === 'IN_PROGRESS';

  // Check if user has an accepted proposal
  const hasAcceptedProposal = user
    ? proposals.some(
        (p) => p.contributorId === user.id && p.status === ProposalStatus.ACCEPTED
      )
    : false;

  const statusColors = {
    OPEN: 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]',
    IN_PROGRESS: 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]',
    COMPLETED: 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]',
    CLOSED: 'bg-[var(--text-muted)]/20 text-[var(--text-muted)] border border-[var(--text-muted)]',
  };

  const statusIcons = {
    OPEN: '🔓',
    IN_PROGRESS: '⚡',
    COMPLETED: '✅',
    CLOSED: '🔒',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-fade-in">
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Challenge Header */}
          <Card className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
              <h1
                className="text-3xl font-bold text-[var(--text-primary)] flex-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {challenge.title}
              </h1>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 ${
                  statusColors[challenge.status]
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span>{statusIcons[challenge.status]}</span>
                {challenge.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6 text-sm text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
              <span>Sponsored by <span className="font-medium text-[var(--text-secondary)]">{challenge.sponsor.email}</span></span>
              <span>•</span>
              <span>{formatRelativeTime(challenge.createdAt)}</span>
            </div>

            <p className="text-[var(--text-secondary)] text-lg mb-6 whitespace-pre-wrap leading-relaxed">
              {challenge.description}
            </p>

            {challenge.tags && challenge.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {challenge.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)] text-sm rounded-full"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Completion Success Message */}
          {completionSuccess && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-400">
              {completionSuccess}
            </div>
          )}

          {/* Completion Error Message */}
          {completionError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
              {completionError}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8">
              <ErrorMessage message={error} onRetry={fetchChallenge} />
            </div>
          )}

          {/* Contribution Form (Inline) */}
          {showContributeForm && canContribute && (
            <Card className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2
                  className="text-2xl font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Submit Your Contribution
                </h2>
                <button
                  onClick={() => setShowContributeForm(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Close contribution form"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ContributionForm
                challengeId={challenge.id}
                onSubmit={handleContributionSubmit}
                onSuccess={() => setShowContributeForm(false)}
              />
            </Card>
          )}

          {/* Login Prompt */}
          {!isAuthenticated && (challenge.status === 'OPEN' || challenge.status === 'IN_PROGRESS') && (
            <Card className="mb-8 bg-[var(--primary)]/10 border-2 border-[var(--primary)]">
              <div className="text-center">
                <p className="text-lg text-[var(--text-primary)] mb-4">
                  Want to contribute and earn tokens?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/login"
                    className="btn btn-primary min-h-[44px] px-6"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-secondary min-h-[44px] px-6"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Proposals Section */}
          {user && (
            <ChallengeProposalsSection
              challengeId={challenge.id}
              currentUserId={user.id}
              isProjectLeader={isSponsor}
            />
          )}

          {/* Submissions Section */}
          {user && (
            <ChallengeSubmissionsSection
              challengeId={challenge.id}
              currentUserId={user.id}
              isProjectLeader={isSponsor}
              hasAcceptedProposal={hasAcceptedProposal}
            />
          )}

          {/* Payments Section - Only for completed challenges */}
          {user && challenge.status === 'COMPLETED' && (
            <ChallengePaymentsSection
              challengeId={challenge.id}
              challengeStatus={challenge.status}
              bountyAmount={challenge.bountyAmount}
              isProjectLeader={isSponsor}
              completeChallengeResponse={completeChallengeData}
            />
          )}

          {/* Contributions List */}
          <div className="mt-8">
            <h2
              className="text-2xl font-bold text-[var(--text-primary)] mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Contributions ({contributions.length})
            </h2>

            {contributions.length === 0 ? (
              <Card className="text-center py-12">
                <div className="text-6xl mb-4">💡</div>
                <p className="text-xl text-[var(--text-secondary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  No contributions yet
                </p>
                <p className="text-[var(--text-muted)]">Be the first to contribute!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {contributions.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="mt-8 lg:mt-0">
          <div className="sticky top-8 space-y-6">
            {/* Bounty Card */}
            <Card className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 border-2 border-[var(--primary)] shadow-[0_0_30px_var(--primary-glow)]">
              <div className="text-center">
                <p
                  className="text-sm font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Total Bounty
                </p>
                <p
                  className="text-4xl font-bold text-[var(--primary)] mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {formatCurrency(challenge.bountyAmount)}
                </p>
                <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  Distributed based on contribution value
                </p>
              </div>
            </Card>

            {/* Stats Card */}
            <Card>
              <h3
                className="text-lg font-semibold text-[var(--text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Challenge Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Contributions</span>
                  <span
                    className="font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {contributions.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[challenge.status]}`} style={{ fontFamily: 'var(--font-display)' }}>
                    {challenge.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Created</span>
                  <span className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatRelativeTime(challenge.createdAt)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            {canContribute && !showContributeForm && (
              <Button
                onClick={() => setShowContributeForm(true)}
                className="w-full min-h-[44px]"
              >
                Contribute Now
              </Button>
            )}

            {isSponsor && (
              <Card className="bg-[var(--warning)]/10 border-2 border-[var(--warning)] shadow-[0_0_20px_var(--warning-glow)]">
                <h3
                  className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Sponsor Actions
                </h3>
                <div className="space-y-2">
                  {canComplete && (
                    <Button
                      onClick={() => setShowCompleteModal(true)}
                      className="w-full min-h-[44px] bg-[var(--success)] text-[var(--bg-primary)] hover:shadow-[0_0_30px_var(--success-glow)]"
                    >
                      Mark as Complete
                    </Button>
                  )}
                  {challenge.status === 'COMPLETED' && (
                    <p className="text-sm text-[var(--text-secondary)] text-center py-2">
                      Challenge completed! Payments have been calculated.
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Browse More Card */}
            <Card className="bg-[var(--bg-elevated)]">
              <h3
                className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Explore More
              </h3>
              <Link
                to="/challenges"
                className="block text-center py-2 text-[var(--primary)] hover:text-[var(--secondary)] hover:shadow-[0_0_8px_var(--primary-glow)] font-medium text-sm transition-all"
              >
                Browse All Challenges →
              </Link>
            </Card>
          </div>
        </div>
      </div>

      {/* Complete Challenge Modal */}
      <CompleteChallengeModal
        challengeId={challenge.id}
        bountyAmount={challenge.bountyAmount}
        contributionCount={contributions.length}
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleMarkComplete}
      />
    </div>
  );
};
