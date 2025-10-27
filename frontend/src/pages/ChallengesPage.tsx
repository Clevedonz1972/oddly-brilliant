import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChallengeList } from '../components/challenges/ChallengeList';
import { ChallengeFilters } from '../components/challenges/ChallengeFilters';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Button } from '../components/common/Button';
import { challengesService } from '../services/challenges.service';
import type { Challenge, ChallengeStatus } from '../types';

/**
 * Challenges page displaying all available challenges with filters
 */
export const ChallengesPage = () => {
  const location = useLocation();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ChallengeStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchChallenges = async () => {
    console.log('🔍 Loading challenges...');
    try {
      setLoading(true);
      setError('');

      // Use challengesService which properly handles the API response format
      const result = await challengesService.getChallenges();
      console.log('✅ Challenges loaded:', result);
      console.log('📊 Number of challenges:', result.challenges?.length || 0);

      // Extract the challenges array from the service response
      const challengesData = result.challenges || [];
      setChallenges(challengesData);
      setFilteredChallenges(challengesData);
    } catch (err: any) {
      console.error('❌ Error loading challenges:', err);
      console.error('📋 Error details:', err.response?.data);
      setError(err.response?.data?.error?.message || 'Failed to load challenges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refetch challenges when navigating to this page
  useEffect(() => {
    fetchChallenges();
  }, [location.pathname]);

  useEffect(() => {
    if (selectedStatus === 'ALL') {
      setFilteredChallenges(challenges);
    } else {
      setFilteredChallenges(
        challenges.filter((challenge) => challenge.status === selectedStatus)
      );
    }
  }, [selectedStatus, challenges]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] py-12 page-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 w-64 bg-cyber-elevated rounded animate-shimmer mb-4" />
            <div className="h-6 w-96 bg-cyber-elevated rounded animate-shimmer" />
          </div>

          {/* Skeleton for filters */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-cyber-elevated rounded animate-shimmer" />
            ))}
          </div>

          {/* Skeleton for challenge cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <ErrorMessage message={error} onRetry={fetchChallenges} />
      </div>
    );
  }

  // Show empty state if no challenges exist at all
  if (challenges.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1
              className="text-4xl font-bold text-[var(--text-primary)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Explore Challenges
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Find challenges that match your skills and interests
            </p>
          </div>

          <div className="text-center py-16 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg">
            <div className="mb-6">
              <svg
                className="w-24 h-24 mx-auto text-[var(--text-muted)] opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2
              className="text-2xl font-bold text-[var(--text-primary)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No Challenges Yet
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 text-lg">
              Be the first to create a challenge and start building!
            </p>
            <Link to="/challenges/new">
              <Button variant="primary">
                Create First Challenge
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-12 page-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1
            className="text-4xl font-bold text-[var(--text-primary)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Explore Challenges
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            Find challenges that match your skills and interests
          </p>
        </div>

        <ChallengeFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />

        <ChallengeList challenges={filteredChallenges} />
      </div>
    </div>
  );
};
