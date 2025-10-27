import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { Event, AdminStats } from '../../types/governance';
import { ComplianceHeartbeat } from '../../components/admin/ComplianceHeartbeat';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';

/**
 * AdminDashboard - Main admin overview page
 * Shows compliance status, recent activity, and key metrics
 */
export const AdminDashboard = () => {
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch recent events
        // BUG FIX: Backend now returns standardized format { success, data }
        const eventsResponse = await api.get<{ success: boolean; data: Event[] }>('/admin/events/recent', {
          params: { limit: 10 },
        });
        setRecentEvents(eventsResponse.data.data || []);

        // Fetch stats (you may need to create this endpoint or aggregate from existing data)
        // For now, using placeholder logic
        const challengesResponse = await api.get('/admin/challenges');
        const challenges = challengesResponse.data.data || [];
        const stats: AdminStats = {
          totalChallenges: challenges.length || 0,
          totalUsers: 0, // Would come from a dedicated endpoint
          totalPayouts: 0, // Would come from a dedicated endpoint
          pendingVetting: challenges.filter(
            (c: any) => c.vettingStatus === 'PENDING'
          ).length,
        };
        setStats(stats);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-8 page-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient-cyber mb-2">
          Admin Dashboard
        </h1>
        <p className="text-[var(--text-secondary)]">
          Monitor system health, compliance, and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      {loading && !stats ? (
        <Card>
          <Loading />
        </Card>
      ) : error ? (
        <Card>
          <ErrorMessage message={error} />
        </Card>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-cyan">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  Total Challenges
                </p>
                <p className="text-3xl font-bold text-[var(--primary)] glow-pulse">
                  {stats.totalChallenges}
                </p>
              </div>
              <svg
                className="w-12 h-12 text-[var(--primary)] opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
          </Card>

          <Card className="card-magenta">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  Pending Vetting
                </p>
                <p className="text-3xl font-bold text-[var(--secondary)] glow-pulse">
                  {stats.pendingVetting}
                </p>
              </div>
              <svg
                className="w-12 h-12 text-[var(--secondary)] opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            {stats.pendingVetting > 0 && (
              <Link
                to="/admin/challenges"
                className="text-sm text-[var(--secondary)] hover:underline mt-2 block"
              >
                Review now →
              </Link>
            )}
          </Card>

          <Card className="card-purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-[var(--accent)] glow-pulse">
                  {stats.totalUsers}
                </p>
              </div>
              <svg
                className="w-12 h-12 text-[var(--accent)] opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </Card>

          <Card className="card-green">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  Total Payouts
                </p>
                <p className="text-3xl font-bold text-[var(--success)] glow-pulse">
                  {stats.totalPayouts}
                </p>
              </div>
              <svg
                className="w-12 h-12 text-[var(--success)] opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Compliance Status */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          System Compliance
        </h2>
        <ComplianceHeartbeat />
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Recent Activity
          </h2>
          <Link
            to="/admin/events"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            View all →
          </Link>
        </div>

        {loading && recentEvents.length === 0 ? (
          <Card>
            <Loading />
          </Card>
        ) : recentEvents.length === 0 ? (
          <Card>
            <p className="text-center text-[var(--text-secondary)] py-8">
              No recent activity
            </p>
          </Card>
        ) : (
          <Card>
            <div className="space-y-3">
              {recentEvents?.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between gap-4 p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {event.action}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {event.entityType}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      by{' '}
                      <span className="text-[var(--primary)] font-mono">
                        {event.actor.email}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/compliance">
            <Card interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--primary)] bg-opacity-20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-[var(--primary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">
                    Check Compliance
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Validate payouts & audit
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/challenges">
            <Card interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--secondary)] bg-opacity-20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-[var(--secondary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">
                    Review Challenges
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Approve or reject submissions
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/events">
            <Card interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--accent)] bg-opacity-20 rounded-lg">
                  <svg
                    className="w-6 h-6 text-[var(--accent)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">
                    Browse Events
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    View system audit log
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};
