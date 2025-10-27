import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { Challenge } from '../../types';
import { VettingQueue } from '../../components/admin/VettingQueue';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';

/**
 * ChallengesAdmin - Admin view of all challenges with vetting queue
 */
export const ChallengesAdmin = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [vettingFilter, setVettingFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (vettingFilter) params.vettingStatus = vettingFilter;

      // BUG FIX: Backend returns { success, data } format, access data.data
      const response = await api.get<{ success: boolean; data: Challenge[] }>('/admin/challenges', { params });
      let filteredChallenges = response.data.data || [];

      // Client-side search filter
      if (searchQuery) {
        filteredChallenges = filteredChallenges.filter((challenge) =>
          challenge.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setChallenges(filteredChallenges);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenges');
      console.error('Challenges fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [statusFilter, vettingFilter]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleApplySearch = () => {
    fetchChallenges();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-[var(--success)] bg-[var(--success)] bg-opacity-20 border-[var(--success)]';
      case 'IN_PROGRESS':
        return 'text-[var(--primary)] bg-[var(--primary)] bg-opacity-20 border-[var(--primary)]';
      case 'COMPLETED':
        return 'text-[var(--accent)] bg-[var(--accent)] bg-opacity-20 border-[var(--accent)]';
      case 'CLOSED':
        return 'text-[var(--text-muted)] bg-[var(--bg-elevated)] border-[var(--border)]';
      default:
        return 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border)]';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8 page-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient-cyber mb-2">
          Challenges Administration
        </h1>
        <p className="text-[var(--text-secondary)]">
          Review pending challenges and manage all submissions
        </p>
      </div>

      {/* Vetting Queue */}
      <VettingQueue />

      {/* All Challenges Section */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          All Challenges
        </h2>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-semibold text-[var(--text-secondary)] mb-2"
              >
                Search
              </label>
              <div className="flex gap-2">
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
                  placeholder="Search by title..."
                  className="input flex-1 min-h-[44px]"
                />
                <Button onClick={handleApplySearch} aria-label="Apply search">
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-semibold text-[var(--text-secondary)] mb-2"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input min-h-[44px]"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Vetting Status Filter */}
            <div>
              <label
                htmlFor="vetting-filter"
                className="block text-sm font-semibold text-[var(--text-secondary)] mb-2"
              >
                Vetting Status
              </label>
              <select
                id="vetting-filter"
                value={vettingFilter}
                onChange={(e) => setVettingFilter(e.target.value)}
                className="input min-h-[44px]"
              >
                <option value="">All Vetting Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Challenges List */}
        <Card>
          {error ? (
            <ErrorMessage message={error} />
          ) : loading ? (
            <Loading />
          ) : challenges.length === 0 ? (
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
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <p className="text-[var(--text-secondary)]">No challenges found</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Showing {challenges.length} challenge
                  {challenges.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <Link
                            to={`/challenges/${challenge.id}`}
                            className="font-bold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                          >
                            {challenge.title}
                          </Link>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(
                              challenge.status
                            )}`}
                          >
                            {challenge.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                          {challenge.description}
                        </p>
                        <div className="flex items-center gap-4 flex-wrap text-sm">
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
                            <span className="text-[var(--warning)] font-semibold">
                              {challenge.bountyAmount.toLocaleString()} tokens
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <svg
                              className="w-4 h-4"
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
                            <span className="font-mono">{challenge.sponsor.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <svg
                              className="w-4 h-4"
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
                            {formatDate(challenge.createdAt)}
                          </div>
                          {challenge.contributionCount !== undefined && (
                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                                />
                              </svg>
                              {challenge.contributionCount} contribution
                              {challenge.contributionCount !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <Link to={`/challenges/${challenge.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
