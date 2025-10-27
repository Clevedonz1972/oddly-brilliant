import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { ContributionCard } from '../components/challenges/ContributionCard';
import { ProposalCard } from '../components/proposals/ProposalCard';
import { PaymentCard } from '../components/payments/PaymentCard';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';
import { challengesService } from '../services/challenges.service';
import { contributionsService } from '../services/contributions.service';
import { proposalsService } from '../services/proposals.service';
import { submissionsService } from '../services/submissions.service';
import { paymentsService } from '../services/payments.service';
import { formatRelativeTime, formatCurrency, getContributionTypeInfo, truncateText } from '../utils/format';
import { SubmissionStatus } from '../types/submissions';
import type { Contribution, Challenge, Payment } from '../types';
import type { Proposal } from '../types/proposals';
import type { Submission } from '../types/submissions';
import { ProposalStatus } from '../types/proposals';

/**
 * User dashboard page showing personal statistics and recent activity
 * Displays user's contributions, sponsored challenges, and earnings
 * Cyberpunk-themed with colored stat cards and glowing effects
 */
export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [myChallenges, setMyChallenges] = useState<Challenge[]>([]);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch user's contributions, proposals, submissions, and all challenges
      const [allChallengesResult, contributionsResult, proposalsResult, submissionsResult] = await Promise.all([
        challengesService.getChallenges(),
        user?.id ? contributionsService.getContributionsByUser(user.id) : Promise.resolve([]),
        proposalsService.getMyProposals().catch(() => []), // Don't fail if proposals fail
        submissionsService.getMySubmissions().catch(() => []), // Don't fail if submissions fail
      ]);

      const challenges = allChallengesResult.challenges;
      setAllChallenges(challenges);

      // Filter challenges sponsored by the user
      const userChallenges = user?.id
        ? challenges.filter(c => c.sponsorId === user.id)
        : [];
      setMyChallenges(userChallenges);
      setContributions(contributionsResult);
      setProposals(proposalsResult);
      setSubmissions(submissionsResult);

      // Load payments from localStorage (workaround until backend adds endpoint)
      const storedPayments = localStorage.getItem('userPayments');
      if (storedPayments) {
        setPayments(JSON.parse(storedPayments));
      } else {
        setPayments([]);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  }

  // Calculate statistics
  const totalTokens = contributions.reduce((sum, c) => sum + (c.tokenValue || 0), 0);
  const openChallenges = allChallenges.filter((c) => c.status === 'OPEN').length;
  const activeChallengesCount = myChallenges.filter(c => c.status === 'IN_PROGRESS' || c.status === 'OPEN').length;

  // Calculate total bounty for user's challenges
  const totalBountySponsored = myChallenges.reduce((sum, c) => sum + c.bountyAmount, 0);

  // Calculate payment statistics
  const paymentStats = paymentsService.getStatistics(payments);

  // Build activity feed
  interface ActivityItem {
    id: string;
    type: 'contribution' | 'challenge_created' | 'challenge_completed';
    timestamp: string;
    content: string;
    link: string;
  }

  const activityFeed: ActivityItem[] = [
    ...contributions.map(c => ({
      id: `contrib-${c.id}`,
      type: 'contribution' as const,
      timestamp: c.createdAt,
      content: `You contributed (${getContributionTypeInfo(c.type).label}) to a challenge`,
      link: `/challenges/${c.challengeId}`,
    })),
    ...myChallenges.map(c => ({
      id: `challenge-${c.id}`,
      type: c.status === 'COMPLETED' ? 'challenge_completed' as const : 'challenge_created' as const,
      timestamp: c.createdAt,
      content: c.status === 'COMPLETED'
        ? `Challenge "${truncateText(c.title, 50)}" was completed`
        : `You created challenge "${truncateText(c.title, 50)}"`,
      link: `/challenges/${c.id}`,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const hasActivity = contributions.length > 0 || myChallenges.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold text-gradient-cyber mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Here's your oddly-brilliant activity overview
        </p>
      </div>

      {/* Stats Grid - Each card with different color theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Tokens Earned (Cyan) */}
        <Card className="card-cyan hover:shadow-[0_0_30px_var(--primary-glow)] transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-sm text-[var(--text-secondary)] mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Tokens Earned
            </p>
            <p
              className="text-4xl font-bold text-[var(--primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {totalTokens.toLocaleString()}
            </p>
          </div>
        </Card>

        {/* Card 2: Contributions (Magenta) */}
        <Card className="card-magenta hover:shadow-[0_0_30px_var(--secondary-glow)] transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <div className="text-3xl mb-2">✍️</div>
            <p className="text-sm text-[var(--text-secondary)] mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Contributions Made
            </p>
            <p
              className="text-4xl font-bold text-[var(--secondary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {contributions.length}
            </p>
          </div>
        </Card>

        {/* Card 3: Active Challenges (Purple) */}
        <Card className="card-purple hover:shadow-[0_0_30px_var(--accent-glow)] transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-sm text-[var(--text-secondary)] mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Active Challenges
            </p>
            <p
              className="text-4xl font-bold text-[var(--accent)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {activeChallengesCount}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">You're sponsoring</p>
          </div>
        </Card>

        {/* Card 4: Open Challenges (Green) */}
        <Card className="card-green hover:shadow-[0_0_30px_var(--success-glow)] transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <div className="text-3xl mb-2">🔓</div>
            <p className="text-sm text-[var(--text-secondary)] mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Open Challenges
            </p>
            <p
              className="text-4xl font-bold text-[var(--success)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {openChallenges}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Platform-wide</p>
          </div>
        </Card>
      </div>

      {/* My Earnings Section */}
      {payments.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <svg className="w-6 h-6 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              My Earnings
            </h2>
            <Link
              to="/payments"
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium hover:underline text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              View all payments →
            </Link>
          </div>

          {/* Earnings Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-900/20 to-green-700/20 border border-green-600/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-400/70 uppercase tracking-wide">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatCurrency(paymentStats.totalEarnings)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-700/20 border border-yellow-600/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-yellow-400/70 uppercase tracking-wide">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatCurrency(paymentStats.pendingEarnings)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 border border-[var(--primary)]/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--primary)]/20 rounded-lg">
                  <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--primary)]/70 uppercase tracking-wide">Payments</p>
                  <p className="text-2xl font-bold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {paymentStats.totalCount}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Payments */}
          <div className="space-y-4">
            {payments.slice(0, 3).map((payment) => (
              <PaymentCard key={payment.id} payment={payment} showChallenge />
            ))}
          </div>

          {payments.length > 3 && (
            <div className="mt-4 text-center">
              <Link
                to="/payments"
                className="inline-flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary)] font-medium hover:shadow-[0_0_8px_var(--primary-glow)] transition-all"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                View all {payments.length} payments
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasActivity && (
        <Card className="mb-8 bg-[var(--bg-elevated)] border-2 border-[var(--primary)] shadow-[0_0_30px_var(--primary-glow)]">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h2
              className="text-2xl font-bold text-[var(--text-primary)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Welcome to oddly-brilliant!
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-6">
              Start your journey by browsing challenges or creating your own
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/challenges">
                <Button className="min-h-[44px] px-8">
                  Browse Challenges
                </Button>
              </Link>
              <Link to="/challenges/new">
                <Button variant="secondary" className="min-h-[44px] px-8">
                  Create Challenge
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Activity Feed */}
      {hasActivity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <h2
              className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>📊</span>
              Recent Activity
            </h2>

            {activityFeed.length === 0 ? (
              <Card>
                <p className="text-center text-[var(--text-muted)] py-8">
                  No recent activity yet
                </p>
              </Card>
            ) : (
              <div className="space-y-3 relative">
                {/* Timeline line effect */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--border-glow)] opacity-30 hidden sm:block"></div>

                {activityFeed.map((item) => (
                  <Card
                    key={item.id}
                    interactive
                    onClick={() => window.location.href = item.link}
                    className="hover:border-[var(--primary)] hover:shadow-[0_0_20px_var(--primary-glow)] relative"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1 relative z-10 bg-[var(--bg-surface)] px-1">
                        {item.type === 'contribution' ? '✍️' : item.type === 'challenge_completed' ? '✅' : '🎯'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-primary)] font-medium">
                          {item.content}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                          {formatRelativeTime(item.timestamp)}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-[var(--primary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Quick Stats & Actions */}
          <div className="space-y-6">
            {/* Your Challenges Card */}
            <Card className="bg-[var(--bg-elevated)] border-2 border-[var(--warning)] shadow-[0_0_20px_var(--warning-glow)]">
              <h3
                className="text-lg font-semibold text-[var(--text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Your Challenges
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">Sponsored</span>
                  <span className="font-bold text-[var(--warning)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {myChallenges.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">Total Bounty</span>
                  <span className="font-bold text-[var(--warning)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatCurrency(totalBountySponsored)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3
                className="text-lg font-semibold text-[var(--text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link to="/challenges" className="block">
                  <button className="w-full btn-primary min-h-[44px] text-left flex items-center justify-between">
                    <span>Browse Challenges</span>
                    <span>→</span>
                  </button>
                </Link>
                <Link to="/challenges/new" className="block">
                  <button className="w-full btn-secondary min-h-[44px] text-left flex items-center justify-between">
                    <span>Create Challenge</span>
                    <span>+</span>
                  </button>
                </Link>
              </div>
            </Card>

            {/* Contribution Breakdown */}
            {contributions.length > 0 && (
              <Card className="bg-[var(--bg-elevated)] border border-[var(--primary)] shadow-[0_0_15px_var(--primary-glow)]">
                <h3
                  className="text-lg font-semibold text-[var(--text-primary)] mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Contribution Types
                </h3>
                <div className="space-y-2">
                  {Object.entries(
                    contributions.reduce((acc, c) => {
                      acc[c.type] = (acc[c.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => {
                    const info = getContributionTypeInfo(type);
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-[var(--text-secondary)]">{info.label}</span>
                        <span
                          className="font-semibold text-[var(--primary)]"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* My Proposals Section */}
      {proposals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              My Proposals
              <span className="text-lg text-[var(--text-muted)]">({proposals.length})</span>
            </h2>
            <Link
              to="/proposals"
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium hover:underline text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              View all →
            </Link>
          </div>

          {/* Proposal Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-yellow-900/10 border border-yellow-500/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'var(--font-display)' }}>
                {proposals.filter(p => p.status === ProposalStatus.PENDING).length}
              </div>
              <div className="text-xs text-yellow-300/70 uppercase tracking-wide">Pending</div>
            </div>
            <div className="p-4 bg-green-900/10 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>
                {proposals.filter(p => p.status === ProposalStatus.ACCEPTED).length}
              </div>
              <div className="text-xs text-green-300/70 uppercase tracking-wide">Accepted</div>
            </div>
            <div className="p-4 bg-red-900/10 border border-red-500/30 rounded-lg">
              <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>
                {proposals.filter(p => p.status === ProposalStatus.REJECTED).length}
              </div>
              <div className="text-xs text-red-300/70 uppercase tracking-wide">Rejected</div>
            </div>
            <div className="p-4 bg-gray-900/10 border border-gray-500/30 rounded-lg">
              <div className="text-2xl font-bold text-gray-400" style={{ fontFamily: 'var(--font-display)' }}>
                {proposals.filter(p => p.status === ProposalStatus.WITHDRAWN).length}
              </div>
              <div className="text-xs text-gray-300/70 uppercase tracking-wide">Withdrawn</div>
            </div>
          </div>

          {/* Recent Proposals */}
          <div className="space-y-4">
            {proposals.slice(0, 3).map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onWithdraw={async () => {
                  await proposalsService.withdraw(proposal.id);
                  await fetchDashboardData();
                }}
                showActions={proposal.status === ProposalStatus.PENDING}
              />
            ))}
          </div>
        </div>
      )}

      {/* My Submissions Section */}
      {submissions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <svg className="w-6 h-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Submissions
              <span className="text-lg text-[var(--text-muted)]">({submissions.length})</span>
            </h2>
            <Link
              to="/submissions"
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium hover:underline text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              View all →
            </Link>
          </div>

          {/* Submission Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-gray-900/20 border border-gray-600/30 rounded-lg">
              <div className="text-xl font-bold text-gray-400" style={{ fontFamily: 'var(--font-display)' }}>
                {submissions.filter(s => s.status === SubmissionStatus.DRAFT).length}
              </div>
              <div className="text-xs text-gray-300/70 uppercase tracking-wide">Drafts</div>
            </div>
            <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <div className="text-xl font-bold text-blue-400" style={{ fontFamily: 'var(--font-display)' }}>
                {submissions.filter(s => s.status === SubmissionStatus.SUBMITTED).length}
              </div>
              <div className="text-xs text-blue-300/70 uppercase tracking-wide">Submitted</div>
            </div>
            <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: 'var(--font-display)' }}>
                {submissions.filter(s => s.status === SubmissionStatus.IN_REVIEW).length}
              </div>
              <div className="text-xs text-yellow-300/70 uppercase tracking-wide">In Review</div>
            </div>
            <div className="p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
              <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>
                {submissions.filter(s => s.status === SubmissionStatus.APPROVED).length}
              </div>
              <div className="text-xs text-green-300/70 uppercase tracking-wide">Approved</div>
            </div>
            <div className="p-3 bg-orange-900/20 border border-orange-600/30 rounded-lg">
              <div className="text-xl font-bold text-orange-400" style={{ fontFamily: 'var(--font-display)' }}>
                {submissions.filter(s => s.status === SubmissionStatus.REVISION_REQUESTED).length}
              </div>
              <div className="text-xs text-orange-300/70 uppercase tracking-wide">Revision</div>
            </div>
            <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
              <div className="text-xl font-bold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>
                {submissions.filter(s => s.status === SubmissionStatus.REJECTED).length}
              </div>
              <div className="text-xs text-red-300/70 uppercase tracking-wide">Rejected</div>
            </div>
          </div>

          {/* Recent Submissions Preview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {submissions.slice(0, 3).map((submission) => (
              <Card key={submission.id} className="hover:border-[var(--accent)] transition-colors">
                <div className="mb-3">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1 truncate">
                    {submission.title}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">{submission.challenge.title}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                    submission.status === SubmissionStatus.DRAFT ? 'bg-gray-900/40 text-gray-400 border-gray-600' :
                    submission.status === SubmissionStatus.SUBMITTED ? 'bg-blue-900/40 text-blue-400 border-blue-600' :
                    submission.status === SubmissionStatus.IN_REVIEW ? 'bg-yellow-900/40 text-yellow-400 border-yellow-600' :
                    submission.status === SubmissionStatus.APPROVED ? 'bg-green-900/40 text-green-400 border-green-600' :
                    submission.status === SubmissionStatus.REJECTED ? 'bg-red-900/40 text-red-400 border-red-600' :
                    'bg-orange-900/40 text-orange-400 border-orange-600'
                  }`}>
                    {submission.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {submission.files.length} file{submission.files.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Contributions */}
      {contributions.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>✨</span>
            Your Recent Contributions
          </h2>
          <div className="space-y-4">
            {contributions.slice(0, 5).map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                showChallenge={true}
              />
            ))}
          </div>
          {contributions.length > 5 && (
            <div className="mt-4 text-center">
              <Link
                to="/contributions"
                className="text-[var(--primary)] hover:text-[var(--primary)] font-medium hover:shadow-[0_0_8px_var(--primary-glow)] transition-all"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                View all {contributions.length} contributions →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Call to Action */}
      <Card className="bg-[var(--bg-elevated)] border-2 border-[var(--primary)] shadow-[0_0_40px_var(--primary-glow)]">
        <div className="text-center py-8">
          <h3
            className="text-2xl font-bold mb-4 text-gradient-cyber"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ready to make an impact?
          </h3>
          <p className="mb-6 text-[var(--text-secondary)] text-lg">
            {contributions.length === 0
              ? "Start contributing to challenges and earn rewards"
              : "Keep contributing and growing your reputation"}
          </p>
          <Link to="/challenges">
            <button className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--primary)] text-[var(--bg-primary)] font-semibold rounded-lg hover:shadow-[0_0_30px_var(--primary-glow)] transition-all min-h-[44px]" style={{ fontFamily: 'var(--font-display)' }}>
              <span>Explore Challenges</span>
              <span>→</span>
            </button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
