import { useState, useEffect } from 'react';
import { safetyService } from '../../services/ai.service';
import type {
  SafetyAnalysisResult,
  SafetyModerationResult,
} from '../../types/ai.types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';

/**
 * SafetyMonitoring - Content moderation and safety analysis interface
 */
export const SafetyMonitoring = () => {
  const [content, setContent] = useState('');
  const [entityType, setEntityType] = useState('CONTRIBUTION');
  const [entityId, setEntityId] = useState('');
  const [analysis, setAnalysis] = useState<SafetyAnalysisResult | null>(null);
  const [recentResults, setRecentResults] = useState<SafetyModerationResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent results on mount
  useEffect(() => {
    // In a real implementation, you might fetch recent results from a general endpoint
    // For now, we'll leave this empty and populate it when user analyzes specific content
  }, []);

  const handleAnalyze = async () => {
    if (!content || !entityId) {
      setError('Please provide both content and entity ID');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const result = await safetyService.analyzeContent({
        content,
        entityType,
        entityId,
      });
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze content');
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleModerate = async () => {
    if (!content || !entityId) {
      setError('Please provide both content and entity ID');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const result = await safetyService.moderateContent(
        entityType,
        entityId,
        { content }
      );
      setRecentResults([result, ...recentResults]);
      setAnalysis(null);
      setContent('');
      setEntityId('');
    } catch (err: any) {
      setError(err.message || 'Failed to moderate content');
      console.error('Moderation error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchModerationResults = async () => {
    if (!entityId) {
      setError('Please provide an entity ID');
      return;
    }

    try {
      setFetchingResults(true);
      setError(null);
      const results = await safetyService.getModerationResults(entityType, entityId);
      setRecentResults(results);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch moderation results');
      console.error('Fetch error:', err);
    } finally {
      setFetchingResults(false);
    }
  };

  const getCategoryColor = (score: number): string => {
    if (score >= 0.7) return 'text-[var(--error)]';
    if (score >= 0.4) return 'text-[var(--warning)]';
    return 'text-[var(--success)]';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.7) return 'HIGH RISK';
    if (score >= 0.4) return 'MODERATE';
    return 'SAFE';
  };

  return (
    <div className="space-y-8 page-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient-cyber mb-2">
          Safety Monitoring
        </h1>
        <p className="text-[var(--text-secondary)]">
          Analyze and moderate content for safety violations
        </p>
      </div>

      {/* Content Analysis Form */}
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Analyze Content
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Run AI-powered safety analysis on user-generated content
            </p>
          </div>

          {/* Entity Type and ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="entity-type"
                className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
              >
                Entity Type
              </label>
              <select
                id="entity-type"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="input min-h-[44px]"
                disabled={analyzing}
                aria-label="Select content entity type"
              >
                <option value="CONTRIBUTION">Contribution</option>
                <option value="CHALLENGE">Challenge</option>
                <option value="COMMENT">Comment</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="entity-id"
                className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
              >
                Entity ID
              </label>
              <input
                id="entity-id"
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="Enter entity ID (e.g., contrib_123)"
                className="input min-h-[44px]"
                disabled={analyzing}
                aria-label="Enter entity ID"
              />
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
            >
              Content to Analyze
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the content you want to analyze for safety issues..."
              className="input min-h-[200px] resize-y"
              disabled={analyzing}
              aria-label="Enter content to analyze"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleAnalyze}
              disabled={!content || !entityId || analyzing}
              loading={analyzing}
              className="flex-1 sm:flex-none"
            >
              Analyze Content
            </Button>
            <Button
              onClick={handleModerate}
              disabled={!content || !entityId || analyzing}
              loading={analyzing}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              Moderate & Flag
            </Button>
            <Button
              onClick={fetchModerationResults}
              disabled={!entityId || fetchingResults}
              loading={fetchingResults}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              View History
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="pt-4">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="pt-6 border-t border-[var(--border)]">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Analysis Results
                </h3>
                <span
                  className={`px-3 py-1 rounded font-bold text-sm ${
                    analysis.flagged
                      ? 'bg-[var(--error)] text-white'
                      : 'bg-[var(--success)] text-white'
                  }`}
                >
                  {analysis.flagged ? 'FLAGGED' : 'SAFE'}
                </span>
              </div>

              {/* Overall Score */}
              <div className="mb-6 p-4 bg-[var(--bg-elevated)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    Overall Safety Score
                  </span>
                  <span
                    className={`text-lg font-bold ${getCategoryColor(
                      analysis.overallScore
                    )}`}
                  >
                    {(analysis.overallScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-3 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                      analysis.overallScore >= 0.7
                        ? 'bg-[var(--error)]'
                        : analysis.overallScore >= 0.4
                        ? 'bg-[var(--warning)]'
                        : 'bg-[var(--success)]'
                    }`}
                    style={{ width: `${analysis.overallScore * 100}%` }}
                    role="progressbar"
                    aria-valuenow={analysis.overallScore * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <div className="mt-2 text-xs text-[var(--text-muted)] flex items-center justify-between">
                  <span>Detection: {analysis.detectionMethod}</span>
                  <span>Confidence: {(analysis.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h4 className="text-md font-semibold text-[var(--text-primary)] mb-3">
                  Category Breakdown
                </h4>
                <div className="space-y-3">
                  {Object.entries(analysis.categories).map(([category, score]) => (
                    <div key={category} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-[var(--text-secondary)] capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="flex-1 relative h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                            score >= 0.7
                              ? 'bg-[var(--error)]'
                              : score >= 0.4
                              ? 'bg-[var(--warning)]'
                              : 'bg-[var(--success)]'
                          }`}
                          style={{ width: `${score * 100}%` }}
                          role="progressbar"
                          aria-label={`${category} score`}
                          aria-valuenow={score * 100}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span className={`text-sm font-bold ${getCategoryColor(score)}`}>
                          {(score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-24 text-right">
                        <span
                          className={`text-xs font-semibold ${getCategoryColor(score)}`}
                        >
                          {getScoreLabel(score)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Moderation Results */}
      {recentResults.length > 0 && (
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Moderation History
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Recent moderation results for this entity
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Entity
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Overall Score
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)]">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentResults.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <td className="py-3 px-4 text-[var(--text-primary)]">
                        {new Date(result.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {result.entityType}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${getCategoryColor(
                            result.overallScore
                          )}`}
                        >
                          {(result.overallScore * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {result.flagged && (
                            <span className="px-2 py-1 bg-[var(--error)] bg-opacity-20 text-[var(--error)] text-xs rounded font-semibold">
                              FLAGGED
                            </span>
                          )}
                          {result.autoBlocked && (
                            <span className="px-2 py-1 bg-[var(--error)] text-white text-xs rounded font-semibold">
                              BLOCKED
                            </span>
                          )}
                          {!result.flagged && !result.autoBlocked && (
                            <span className="px-2 py-1 bg-[var(--success)] bg-opacity-20 text-[var(--success)] text-xs rounded font-semibold">
                              SAFE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {result.detectionMethod}
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
