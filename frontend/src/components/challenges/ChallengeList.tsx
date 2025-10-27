import { ChallengeCard } from './ChallengeCard';
import type { Challenge } from '../../types';

interface ChallengeListProps {
  challenges: Challenge[];
}

/**
 * Challenge list component displaying multiple challenges in a grid
 */
export const ChallengeList = ({ challenges }: ChallengeListProps) => {
  if (challenges.length === 0) {
    return (
      <div className="text-center py-16 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-[var(--text-muted)] opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </div>
        <p
          className="text-[var(--text-secondary)] text-lg font-medium"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          No challenges match your filters.
        </p>
        <p className="text-[var(--text-muted)] mt-2">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </div>
  );
};
