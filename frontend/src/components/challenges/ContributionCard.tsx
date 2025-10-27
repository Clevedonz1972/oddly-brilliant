import { useState } from 'react';
import { Card } from '../common/Card';
import { formatRelativeTime, getContributionTypeInfo, truncateText } from '../../utils/format';
import type { Contribution } from '../../types';

interface ContributionCardProps {
  contribution: Contribution;
  showChallenge?: boolean;
}

/**
 * Card component for displaying a single contribution
 * Shows contributor info, type, content, and token value
 * Cyberpunk-themed with type-specific colored borders
 */
export const ContributionCard = ({ contribution, showChallenge = false }: ContributionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeInfo = getContributionTypeInfo(contribution.type);
  const shouldTruncate = contribution.content.length > 200;
  const displayContent = isExpanded || !shouldTruncate
    ? contribution.content
    : truncateText(contribution.content, 200);

  // Type-specific border colors
  const typeColors = {
    CODE: 'card-cyan',
    DESIGN: 'card-magenta',
    IDEA: 'card-purple',
    RESEARCH: 'card-green',
  };

  const typeBadgeColors = {
    CODE: 'bg-[var(--primary)] text-[var(--bg-primary)] shadow-[0_0_8px_var(--primary-glow)]',
    DESIGN: 'bg-[var(--secondary)] text-white shadow-[0_0_8px_var(--secondary-glow)]',
    IDEA: 'bg-[var(--accent)] text-white shadow-[0_0_8px_var(--accent-glow)]',
    RESEARCH: 'bg-[var(--success)] text-[var(--bg-primary)] shadow-[0_0_8px_var(--success-glow)]',
  };

  return (
    <Card className={`${typeColors[contribution.type as keyof typeof typeColors] || ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                typeBadgeColors[contribution.type as keyof typeof typeBadgeColors] || 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {typeInfo.label}
            </span>
            <span
              className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--primary)] text-[var(--primary)] text-xs font-semibold rounded-full shadow-[0_0_8px_var(--primary-glow)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {contribution.tokenValue} tokens
            </span>
          </div>
          {contribution.user && (
            <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
              By <span className="font-medium text-[var(--text-secondary)]">{contribution.user.email}</span>
            </p>
          )}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatRelativeTime(contribution.createdAt)}
          </p>
        </div>
      </div>

      <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
        {displayContent}
      </p>

      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-[var(--primary)] hover:text-[var(--primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 rounded hover:shadow-[0_0_8px_var(--primary-glow)] transition-all"
          style={{ fontFamily: 'var(--font-display)' }}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Show less ↑' : 'Read more ↓'}
        </button>
      )}

      {showChallenge && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
            Challenge ID: {contribution.challengeId}
          </p>
        </div>
      )}
    </Card>
  );
};
