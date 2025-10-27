import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmissionList } from '../components/submissions/SubmissionList';
import { submissionsService } from '../services/submissions.service';
import { useAuthStore } from '../stores/authStore';
import type { Submission } from '../types/submissions';
import type { ApiError } from '../types';

/**
 * Full-page view of user's submissions across all challenges
 * Shows submission history with filtering and statistics
 */
export const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await submissionsService.getMySubmissions();
      setSubmissions(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (
    id: string,
    action: 'approve' | 'reject' | 'revision',
    notes?: string
  ) => {
    try {
      if (action === 'approve') {
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--bg-elevated)]"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1
              className="text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <svg
                className="w-10 h-10 text-[var(--primary)]"
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
              My Submissions
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] text-lg ml-14">
            View and manage all your work submissions across challenges
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400 flex items-start gap-3"
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

        {/* Submissions List */}
        <SubmissionList
          submissions={submissions}
          loading={loading}
          currentUserId={user.id}
          onReview={handleReview}
          onDelete={handleDelete}
        />

        {/* Quick Actions */}
        {!loading && submissions.length > 0 && (
          <div className="mt-8 p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
            <h3
              className="text-lg font-semibold text-[var(--text-primary)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/challenges')}
                className="btn-secondary"
                aria-label="Browse challenges"
              >
                Browse Challenges
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
                aria-label="Go to dashboard"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
