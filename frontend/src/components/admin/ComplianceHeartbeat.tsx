import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Heartbeat, ComplianceStatus } from '../../types/governance';
import { Card } from '../common/Card';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';

interface ComplianceHeartbeatProps {
  challengeId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * ComplianceHeartbeat - Displays compliance status with color-coded indicators
 * Auto-refreshes every 30 seconds by default
 */
export const ComplianceHeartbeat = ({
  challengeId,
  autoRefresh = true,
  refreshInterval = 30000,
}: ComplianceHeartbeatProps) => {
  const [heartbeat, setHeartbeat] = useState<Heartbeat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchHeartbeat = async () => {
    try {
      setError(null);
      const endpoint = challengeId
        ? `/admin/auditor/heartbeat/${challengeId}`
        : '/admin/auditor/heartbeat';

      const response = await api.get<Heartbeat>(endpoint);
      setHeartbeat(response.data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch compliance status');
      console.error('Compliance heartbeat error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeartbeat();

    if (autoRefresh) {
      const interval = setInterval(fetchHeartbeat, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [challengeId, autoRefresh, refreshInterval]);

  const getStatusColor = (status: ComplianceStatus): string => {
    switch (status) {
      case 'GREEN':
        return 'text-[var(--success)]';
      case 'AMBER':
        return 'text-[var(--warning)]';
      case 'RED':
        return 'text-[var(--error)]';
      default:
        return 'text-[var(--text-secondary)]';
    }
  };

  const getStatusBg = (status: ComplianceStatus): string => {
    switch (status) {
      case 'GREEN':
        return 'bg-[var(--success)]';
      case 'AMBER':
        return 'bg-[var(--warning)]';
      case 'RED':
        return 'bg-[var(--error)]';
      default:
        return 'bg-[var(--text-secondary)]';
    }
  };

  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case 'GREEN':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'AMBER':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'RED':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <Loading />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorMessage message={error} />
        <button
          onClick={fetchHeartbeat}
          className="btn-primary mt-4"
          aria-label="Retry loading compliance status"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!heartbeat) {
    return (
      <Card>
        <p className="text-[var(--text-secondary)]">No compliance data available</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Compliance Status
            </h3>
            {challengeId && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Challenge: {challengeId}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-2 ${getStatusColor(heartbeat.overall)}`}>
              {getStatusIcon(heartbeat.overall)}
              <span className="text-2xl font-bold">{heartbeat.overall}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Compliance Checks */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            System Checks
          </h4>
          {heartbeat?.checks?.map((check, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
            >
              <div className={`mt-0.5 ${getStatusColor(check.status)}`}>
                {getStatusIcon(check.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h5 className="font-semibold text-[var(--text-primary)]">
                    {check.name}
                  </h5>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded ${getStatusBg(
                      check.status
                    )} text-white`}
                  >
                    {check.status}
                  </span>
                  {check.blocksAction && (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-[var(--error)] text-white">
                      BLOCKING
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-1 break-words">
                  {check.details}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Auto-refresh indicator */}
        {autoRefresh && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
            <svg
              className="w-4 h-4 motion-safe:animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Auto-refreshing every {refreshInterval / 1000}s
          </div>
        )}
      </div>
    </Card>
  );
};
