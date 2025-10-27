import { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { proposalsService } from '../../services/proposals.service';
import type { Proposal } from '../../types/proposals';
import type { ApiError } from '../../types';

interface ProposalFormProps {
  challengeId?: string;
  onSuccess?: (proposal: Proposal) => void;
}

/**
 * Form for contributors to propose joining a challenge
 * Cyberpunk-themed with validation and error handling
 */
export const ProposalForm = ({ challengeId: initialChallengeId, onSuccess }: ProposalFormProps) => {
  const [challengeId, setChallengeId] = useState(initialChallengeId || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!challengeId.trim()) {
      setError('Challenge ID is required');
      return;
    }

    setLoading(true);

    try {
      const proposal = await proposalsService.create({
        challengeId: challengeId.trim(),
        message: message.trim() || undefined,
      });

      setSuccess(true);
      setMessage('');

      if (!initialChallengeId) {
        setChallengeId('');
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(proposal);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
        <h3
          className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Propose to Join Challenge
        </h3>

        {/* Challenge ID Input */}
        {!initialChallengeId && (
          <Input
            label="Challenge ID"
            type="text"
            id="challenge-id"
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            placeholder="Enter challenge ID"
            required
            disabled={loading}
            aria-required="true"
          />
        )}

        {/* Message Textarea */}
        <div className="mb-4">
          <label
            htmlFor="proposal-message"
            className="block text-sm font-medium mb-2 text-[var(--text-secondary)] uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Message (Optional)
          </label>
          <textarea
            id="proposal-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Why do you want to join this challenge? (Optional)"
            rows={4}
            disabled={loading}
            className="input input-focus-glow w-full resize-none"
            aria-label="Proposal message"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Share your motivation, relevant skills, or ideas for the challenge.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg text-red-400 flex items-start gap-2"
            role="alert"
            aria-live="polite"
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded-lg text-green-400 flex items-start gap-2"
            role="alert"
            aria-live="polite"
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Proposal submitted successfully!</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          loading={loading}
          disabled={loading || (!challengeId.trim() && !initialChallengeId)}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
          aria-label="Submit proposal"
        >
          {loading ? 'Submitting...' : 'Submit Proposal'}
        </Button>
      </div>
    </form>
  );
};
