import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { PayoutValidation } from '../../types/governance';
import type { Challenge } from '../../types';
import { ComplianceHeartbeat } from '../../components/admin/ComplianceHeartbeat';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';

/**
 * CompliancePage - Full compliance view with challenge-specific validation
 * Allows admins to validate payouts for specific challenges
 */
export const CompliancePage = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [validation, setValidation] = useState<PayoutValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        // BUG FIX: Backend returns { success, data } format, access data.data
        const response = await api.get<{ success: boolean; data: Challenge[] }>('/admin/challenges');
        // Filter to only show completed challenges
        const completedChallenges = (response.data.data || []).filter(
          (c) => c.status === 'COMPLETED'
        );
        setChallenges(completedChallenges);
      } catch (err: any) {
        console.error('Failed to fetch challenges:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const handleValidatePayout = async () => {
    if (!selectedChallenge) return;

    try {
      setValidating(true);
      setError(null);
      const response = await api.post<PayoutValidation>(
        `/admin/auditor/payout/validate/${selectedChallenge}`
      );
      setValidation(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to validate payout');
      console.error('Payout validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-8 page-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient-cyber mb-2">
          Compliance Dashboard
        </h1>
        <p className="text-[var(--text-secondary)]">
          Monitor system compliance and validate challenge payouts
        </p>
      </div>

      {/* System-wide Compliance */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          System-wide Compliance
        </h2>
        <ComplianceHeartbeat />
      </div>

      {/* Challenge-specific Compliance */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          Challenge Compliance Check
        </h2>
        <Card>
          <div className="space-y-6">
            {/* Challenge Selection */}
            <div>
              <label
                htmlFor="challenge-select"
                className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
              >
                Select Challenge
              </label>
              {loading ? (
                <div className="py-4">
                  <Loading />
                </div>
              ) : (
                <select
                  id="challenge-select"
                  value={selectedChallenge}
                  onChange={(e) => {
                    setSelectedChallenge(e.target.value);
                    setValidation(null);
                    setError(null);
                  }}
                  className="input min-h-[44px]"
                  disabled={validating}
                >
                  <option value="">-- Select a completed challenge --</option>
                  {challenges.map((challenge) => (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.title} (Bounty: {challenge.bountyAmount} tokens)
                    </option>
                  ))}
                </select>
              )}
              {challenges.length === 0 && !loading && (
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  No completed challenges available for validation
                </p>
              )}
            </div>

            {/* Challenge-specific Heartbeat */}
            {selectedChallenge && (
              <div className="pt-4 border-t border-[var(--border)]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                  Challenge Compliance Status
                </h3>
                <ComplianceHeartbeat
                  challengeId={selectedChallenge}
                  autoRefresh={false}
                />
              </div>
            )}

            {/* Validate Button */}
            <div className="pt-4 border-t border-[var(--border)]">
              <Button
                onClick={handleValidatePayout}
                disabled={!selectedChallenge || validating}
                loading={validating}
                className="w-full md:w-auto"
              >
                Validate Payout
              </Button>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                Run comprehensive payout validation for the selected challenge
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="pt-4">
                <ErrorMessage message={error} />
              </div>
            )}

            {/* Validation Results */}
            {validation && (
              <div className="pt-6 border-t border-[var(--border)]">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Validation Results
                  </h3>
                  <span
                    className={`px-3 py-1 rounded font-bold text-sm ${
                      validation.ok
                        ? 'bg-[var(--success)] text-white'
                        : 'bg-[var(--error)] text-white'
                    }`}
                  >
                    {validation.ok ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                {/* Violations */}
                {validation.violations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-[var(--error)] mb-3 flex items-center gap-2">
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
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Violations ({validation.violations.length})
                    </h4>
                    <ul className="space-y-2">
                      {validation.violations.map((violation, index) => (
                        <li
                          key={index}
                          className="p-3 bg-[var(--error)] bg-opacity-10 border border-[var(--error)] rounded-lg text-[var(--text-primary)]"
                        >
                          {violation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-[var(--warning)] mb-3 flex items-center gap-2">
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Warnings ({validation.warnings.length})
                    </h4>
                    <ul className="space-y-2">
                      {validation.warnings.map((warning, index) => (
                        <li
                          key={index}
                          className="p-3 bg-[var(--warning)] bg-opacity-10 border border-[var(--warning)] rounded-lg text-[var(--text-primary)]"
                        >
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success Message */}
                {validation.ok &&
                  validation.violations.length === 0 &&
                  validation.warnings.length === 0 && (
                    <div className="p-4 bg-[var(--success)] bg-opacity-10 border border-[var(--success)] rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-[var(--success)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-[var(--success)] font-semibold">
                          All compliance checks passed successfully!
                        </p>
                      </div>
                    </div>
                  )}

                {/* Evidence Pack */}
                {validation.evidencePackUrl && (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <h4 className="text-md font-semibold text-[var(--text-primary)] mb-2">
                      Evidence Package
                    </h4>
                    <a
                      href={validation.evidencePackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline inline-flex items-center gap-2"
                    >
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download Evidence Pack
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
