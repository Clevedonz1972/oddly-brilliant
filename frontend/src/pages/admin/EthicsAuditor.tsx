import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ethicsService } from '../../services/ai.service';
import type { Challenge } from '../../types';
import type {
  EthicsAuditResult,
  EthicsReportSummary,
} from '../../types/ai.types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';

/**
 * EthicsAuditor - Challenge fairness and ethics analysis interface
 */
export const EthicsAuditor = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [report, setReport] = useState<EthicsReportSummary | null>(null);
  const [auditHistory, setAuditHistory] = useState<EthicsAuditResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch challenges on mount
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        const response = await api.get<Challenge[]>('/admin/challenges');
        // Filter to completed challenges for ethics auditing
        const completedChallenges = response.data.filter(
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

  // Fetch audit history when challenge is selected
  useEffect(() => {
    if (selectedChallenge) {
      fetchAuditHistory();
    }
  }, [selectedChallenge]);

  const fetchAuditHistory = async () => {
    if (!selectedChallenge) return;

    try {
      const history = await ethicsService.getAudits(selectedChallenge);
      setAuditHistory(history);
    } catch (err: any) {
      console.error('Failed to fetch audit history:', err);
    }
  };

  const handleRunAudit = async () => {
    if (!selectedChallenge) return;

    try {
      setAuditing(true);
      setError(null);
      await ethicsService.auditChallenge(selectedChallenge);

      // Fetch the full report
      const fullReport = await ethicsService.getReport(selectedChallenge);
      setReport(fullReport);

      // Update audit history
      await fetchAuditHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to run ethics audit');
      console.error('Ethics audit error:', err);
    } finally {
      setAuditing(false);
    }
  };

  const getFairnessColor = (score: number): string => {
    if (score >= 0.8) return 'text-[var(--success)]';
    if (score >= 0.6) return 'text-[var(--warning)]';
    return 'text-[var(--error)]';
  };

  const getFairnessLabel = (score: number): string => {
    if (score >= 0.8) return 'EXCELLENT';
    if (score >= 0.6) return 'FAIR';
    return 'NEEDS IMPROVEMENT';
  };

  const getRedFlagIcon = () => (
    <svg
      className="w-5 h-5 text-[var(--error)]"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );

  const getGreenFlagIcon = () => (
    <svg
      className="w-5 h-5 text-[var(--success)]"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  const getYellowFlagIcon = () => (
    <svg
      className="w-5 h-5 text-[var(--warning)]"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );

  const formatFlagLabel = (flag: string): string => {
    return flag
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-8 page-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient-cyber mb-2">
          Ethics Auditor
        </h1>
        <p className="text-[var(--text-secondary)]">
          Analyze challenge fairness, token distribution, and ethical compliance
        </p>
      </div>

      {/* Challenge Selection and Audit */}
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Run Ethics Audit
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Analyze completed challenges for fairness and ethical concerns
            </p>
          </div>

          {/* Challenge Selector */}
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
                  setReport(null);
                  setError(null);
                }}
                className="input min-h-[44px]"
                disabled={auditing}
                aria-label="Select challenge for ethics audit"
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
                No completed challenges available for auditing
              </p>
            )}
          </div>

          {/* Audit Button */}
          <div className="pt-4 border-t border-[var(--border)]">
            <Button
              onClick={handleRunAudit}
              disabled={!selectedChallenge || auditing}
              loading={auditing}
              className="w-full md:w-auto"
            >
              Run Ethics Audit
            </Button>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Analyze fairness, token distribution, and ethical concerns
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="pt-4">
              <ErrorMessage message={error} />
            </div>
          )}
        </div>
      </Card>

      {/* Audit Results */}
      {report && (
        <>
          {/* Fairness Score Overview */}
          <Card>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  Fairness Analysis
                </h2>
                <span
                  className={`px-4 py-2 rounded-lg font-bold text-lg ${
                    report.audit.fairnessScore >= 0.8
                      ? 'bg-[var(--success)] text-white'
                      : report.audit.fairnessScore >= 0.6
                      ? 'bg-[var(--warning)] text-white'
                      : 'bg-[var(--error)] text-white'
                  }`}
                >
                  {getFairnessLabel(report.audit.fairnessScore)}
                </span>
              </div>

              {/* Challenge Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[var(--bg-elevated)] rounded-lg">
                <div>
                  <div className="text-sm text-[var(--text-secondary)] mb-1">
                    Challenge
                  </div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {report.challenge.title}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[var(--text-secondary)] mb-1">
                    Contributors
                  </div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {report.contributorCount}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[var(--text-secondary)] mb-1">
                    Total Value
                  </div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {report.totalValue.toLocaleString()} tokens
                  </div>
                </div>
              </div>

              {/* Fairness Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    Fairness Score
                  </span>
                  <span
                    className={`text-2xl font-bold ${getFairnessColor(
                      report.audit.fairnessScore
                    )}`}
                  >
                    {(report.audit.fairnessScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-4 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                      report.audit.fairnessScore >= 0.8
                        ? 'bg-[var(--success)]'
                        : report.audit.fairnessScore >= 0.6
                        ? 'bg-[var(--warning)]'
                        : 'bg-[var(--error)]'
                    }`}
                    style={{ width: `${report.audit.fairnessScore * 100}%` }}
                    role="progressbar"
                    aria-label="Fairness score"
                    aria-valuenow={report.audit.fairnessScore * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>

              {/* Gini Coefficient */}
              {report.audit.giniCoefficient !== undefined && (
                <div className="pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        Gini Coefficient
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        Measures inequality in token distribution (0 = perfect equality, 1 = maximum inequality)
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                      {report.audit.giniCoefficient.toFixed(3)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Flags and Issues */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Red Flags */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getRedFlagIcon()}
                  <h3 className="text-lg font-bold text-[var(--error)]">
                    Red Flags ({report.audit.redFlags.length})
                  </h3>
                </div>
                {report.audit.redFlags.length > 0 ? (
                  <ul className="space-y-2">
                    {report.audit.redFlags.map((flag, index) => (
                      <li
                        key={index}
                        className="p-3 bg-[var(--error)] bg-opacity-10 border border-[var(--error)] rounded-lg text-sm text-[var(--text-primary)]"
                      >
                        {formatFlagLabel(flag)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] italic">
                    No critical issues detected
                  </p>
                )}
              </div>
            </Card>

            {/* Yellow Flags */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getYellowFlagIcon()}
                  <h3 className="text-lg font-bold text-[var(--warning)]">
                    Warnings ({report.audit.yellowFlags.length})
                  </h3>
                </div>
                {report.audit.yellowFlags.length > 0 ? (
                  <ul className="space-y-2">
                    {report.audit.yellowFlags.map((flag, index) => (
                      <li
                        key={index}
                        className="p-3 bg-[var(--warning)] bg-opacity-10 border border-[var(--warning)] rounded-lg text-sm text-[var(--text-primary)]"
                      >
                        {formatFlagLabel(flag)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] italic">
                    No warnings detected
                  </p>
                )}
              </div>
            </Card>

            {/* Green Flags */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getGreenFlagIcon()}
                  <h3 className="text-lg font-bold text-[var(--success)]">
                    Green Flags ({report.audit.greenFlags.length})
                  </h3>
                </div>
                {report.audit.greenFlags.length > 0 ? (
                  <ul className="space-y-2">
                    {report.audit.greenFlags.map((flag, index) => (
                      <li
                        key={index}
                        className="p-3 bg-[var(--success)] bg-opacity-10 border border-[var(--success)] rounded-lg text-sm text-[var(--text-primary)]"
                      >
                        {formatFlagLabel(flag)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] italic">
                    No positive indicators detected
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          {report.audit.recommendations && report.audit.recommendations.length > 0 && (
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {report.audit.recommendations.map((rec: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-[var(--bg-elevated)] border-l-4 rounded-lg"
                      style={{
                        borderColor:
                          rec.priority === 'HIGH'
                            ? 'var(--error)'
                            : rec.priority === 'MEDIUM'
                            ? 'var(--warning)'
                            : 'var(--success)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            rec.priority === 'HIGH'
                              ? 'bg-[var(--error)] text-white'
                              : rec.priority === 'MEDIUM'
                              ? 'bg-[var(--warning)] text-white'
                              : 'bg-[var(--success)] text-white'
                          }`}
                        >
                          {rec.priority}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                            {rec.type}
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {rec.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Audit History */}
      {selectedChallenge && auditHistory.length > 0 && (
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Audit History
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Previous ethics audits for this challenge
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Fairness Score
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Gini
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Red Flags
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Green Flags
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.map((audit) => (
                    <tr
                      key={audit.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <td className="py-3 px-4 text-[var(--text-primary)]">
                        {new Date(audit.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${getFairnessColor(
                            audit.fairnessScore
                          )}`}
                        >
                          {(audit.fairnessScore * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {audit.giniCoefficient?.toFixed(3) || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-[var(--error)] bg-opacity-20 text-[var(--error)] text-xs rounded font-semibold">
                          {audit.redFlags.length}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-[var(--success)] bg-opacity-20 text-[var(--success)] text-xs rounded font-semibold">
                          {audit.greenFlags.length}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
