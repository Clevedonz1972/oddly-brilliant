import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import type { Challenge } from '../../types';

interface ChallengeCardProps {
  challenge: Challenge;
}

/**
 * Challenge card component for displaying challenge summary
 * Cyberpunk-themed with colored status badges and glowing effects
 */
export const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const navigate = useNavigate();

  const statusColors = {
    OPEN: 'bg-[var(--success)] text-[var(--bg-primary)] shadow-[0_0_10px_var(--success-glow)]',
    IN_PROGRESS: 'bg-[var(--primary)] text-[var(--bg-primary)] shadow-[0_0_10px_var(--primary-glow)]',
    COMPLETED: 'bg-[var(--accent)] text-white shadow-[0_0_10px_var(--accent-glow)]',
    CLOSED: 'bg-[var(--text-muted)] text-white shadow-[0_0_10px_rgba(100,116,139,0.3)]',
  };

  // Status icons for accessibility (WCAG 1.4.1: don't rely on color alone)
  const statusIcons = {
    OPEN: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
    IN_PROGRESS: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    COMPLETED: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    CLOSED: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  };

  // Determine status border class
  const statusBorderClass = challenge.status === 'OPEN'
    ? 'status-border-open pulse-glow'
    : challenge.status === 'IN_PROGRESS'
    ? 'status-border-in-progress'
    : challenge.status === 'COMPLETED'
    ? 'status-border-completed'
    : '';

  return (
    <Card
      interactive
      onClick={() => navigate(`/challenges/${challenge.id}`)}
      className={`card-lift hover:border-[var(--primary)] hover:shadow-[0_0_30px_var(--primary-glow)] transition-all duration-300 ${statusBorderClass}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3
          className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] flex-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {challenge.title}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
            statusColors[challenge.status]
          } ${challenge.status === 'OPEN' ? 'badge-pulse' : ''}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {statusIcons[challenge.status]}
          <span className="sr-only">Status: </span>
          {challenge.status.replace('_', ' ')}
        </span>
      </div>

      <p className="text-[var(--text-secondary)] mb-4 line-clamp-2 leading-relaxed">
        {challenge.description}
      </p>

      <div className="flex justify-between items-center text-sm">
        <div className="text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
          by <span className="font-medium text-[var(--text-secondary)]">{challenge.sponsor.email}</span>
        </div>
        <div className="flex items-center space-x-4">
          {challenge.contributionCount !== undefined && (
            <span className="text-[var(--text-secondary)]">
              {challenge.contributionCount} contributions
            </span>
          )}
          <span
            className="text-[var(--primary)] font-bold text-lg"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ${challenge.bountyAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {challenge.tags && challenge.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {challenge.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] text-xs rounded hover:border-[var(--primary)] transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
};
