import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { evidenceService } from '../../services/ai.service';
import type { Challenge } from '../../types';
import type {
  EvidencePackage,
  VerificationResult,
} from '../../types/ai.types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';

/**
 * EvidencePackages - Generate, verify, and download evidence packages
 */
export const EvidencePackages = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [packages, setPackages] = useState<EvidencePackage[]>([]);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generation options
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeFileHashes, setIncludeFileHashes] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeAIAnalysis, setIncludeAIAnalysis] = useState(true);
  const [packageType, setPackageType] = useState('PAYOUT_AUDIT');

  // Fetch challenges on mount
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        // BUG FIX: Backend returns { success, data } format, access data.data
        const response = await api.get<{ success: boolean; data: Challenge[] }>('/admin/challenges');
        // Filter to completed challenges
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

  // Fetch packages when challenge is selected
  useEffect(() => {
    if (selectedChallenge) {
      fetchPackages();
    }
  }, [selectedChallenge]);

  const fetchPackages = async () => {
    if (!selectedChallenge) return;

    try {
      const pkgs = await evidenceService.listPackages(selectedChallenge);
      setPackages(pkgs);
    } catch (err: any) {
      console.error('Failed to fetch packages:', err);
    }
  };

  const handleGeneratePackage = async () => {
    if (!selectedChallenge) return;

    try {
      setGenerating(true);
      setError(null);
      await evidenceService.generatePackage(selectedChallenge, {
        packageType,
        includeTimeline,
        includeFileHashes,
        includeSignatures,
        includeAIAnalysis,
      });

      // Refresh package list
      await fetchPackages();

      // Show success message
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate evidence package');
      console.error('Generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (packageId: string) => {
    try {
      evidenceService.downloadPackage(packageId);
    } catch (err: any) {
      setError(err.message || 'Failed to download package');
      console.error('Download error:', err);
    }
  };

  const handleVerify = async (packageId: string) => {
    try {
      setVerifying(packageId);
      setError(null);
      const result = await evidenceService.verifyPackage(packageId);
      setVerificationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to verify package');
      console.error('Verification error:', err);
    } finally {
      setVerifying(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatPackageType = (type: string): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-8 page-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient-cyber mb-2">
          Evidence Packages
        </h1>
        <p className="text-[var(--text-secondary)]">
          Generate tamper-proof audit trails and compliance reports
        </p>
      </div>

      {/* Generate Package */}
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Generate Evidence Package
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Create a cryptographically signed PDF audit trail with tamper detection
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
                  setError(null);
                  setVerificationResult(null);
                }}
                className="input min-h-[44px]"
                disabled={generating}
                aria-label="Select challenge for evidence package"
              >
                <option value="">-- Select a completed challenge --</option>
                {challenges.map((challenge) => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.title} (Bounty: {challenge.bountyAmount} tokens)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Package Type */}
          <div>
            <label
              htmlFor="package-type"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
            >
              Package Type
            </label>
            <select
              id="package-type"
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
              className="input min-h-[44px]"
              disabled={generating}
              aria-label="Select package type"
            >
              <option value="PAYOUT_AUDIT">Payout Audit</option>
              <option value="COMPLIANCE_REPORT">Compliance Report</option>
              <option value="INCIDENT_EVIDENCE">Incident Evidence</option>
            </select>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              Include in Package
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTimeline}
                  onChange={(e) => setIncludeTimeline(e.target.checked)}
                  disabled={generating}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)]"
                  aria-label="Include timeline"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    Event Timeline
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Chronological log of all challenge events
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFileHashes}
                  onChange={(e) => setIncludeFileHashes(e.target.checked)}
                  disabled={generating}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)]"
                  aria-label="Include file hashes"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    File Hashes
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    SHA-256 hashes of all relevant files
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  disabled={generating}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)]"
                  aria-label="Include digital signatures"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    Digital Signatures
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Cryptographic signatures for verification
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAIAnalysis}
                  onChange={(e) => setIncludeAIAnalysis(e.target.checked)}
                  disabled={generating}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)]"
                  aria-label="Include AI analysis"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    AI Analysis
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Safety and ethics audit results
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4 border-t border-[var(--border)]">
            <Button
              onClick={handleGeneratePackage}
              disabled={!selectedChallenge || generating}
              loading={generating}
              className="w-full md:w-auto"
            >
              Generate Evidence Package
            </Button>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              This will create a cryptographically signed PDF with tamper detection
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

      {/* Verification Result */}
      {verificationResult && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Verification Result
              </h3>
              <span
                className={`px-3 py-1 rounded font-bold text-sm ${
                  verificationResult.valid
                    ? 'bg-[var(--success)] text-white'
                    : 'bg-[var(--error)] text-white'
                }`}
              >
                {verificationResult.valid ? 'VALID' : 'INVALID'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[var(--bg-elevated)] rounded-lg">
              <div>
                <div className="text-sm text-[var(--text-secondary)] mb-1">
                  File Name
                </div>
                <div className="font-mono text-sm text-[var(--text-primary)]">
                  {verificationResult.fileName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[var(--text-secondary)] mb-1">
                  Generated
                </div>
                <div className="font-mono text-sm text-[var(--text-primary)]">
                  {new Date(verificationResult.generatedAt).toLocaleString()}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-[var(--text-secondary)] mb-1">
                  SHA-256 Hash
                </div>
                <div className="font-mono text-xs text-[var(--text-primary)] break-all">
                  {verificationResult.sha256}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {verificationResult.fileExists ? (
                  <svg
                    className="w-5 h-5 text-[var(--success)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-[var(--error)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="text-sm text-[var(--text-primary)]">
                  File exists on storage
                </span>
              </div>
              <div className="flex items-center gap-3">
                {verificationResult.hashMatches ? (
                  <svg
                    className="w-5 h-5 text-[var(--success)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-[var(--error)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="text-sm text-[var(--text-primary)]">
                  Cryptographic hash matches
                </span>
              </div>
            </div>

            {verificationResult.message && (
              <p className="text-sm text-[var(--text-secondary)] italic">
                {verificationResult.message}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Package List */}
      {selectedChallenge && packages.length > 0 && (
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Generated Packages
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Previously generated evidence packages for this challenge
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                          {formatPackageType(pkg.packageType)}
                        </h3>
                        <span className="px-2 py-1 bg-[var(--primary)] bg-opacity-20 text-[var(--primary)] text-xs rounded font-semibold">
                          {formatFileSize(pkg.fileSize)}
                        </span>
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {pkg.fileName}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                        {pkg.includesEvents && (
                          <span className="px-2 py-1 bg-[var(--bg-surface)] rounded">
                            Timeline
                          </span>
                        )}
                        {pkg.includesFiles && (
                          <span className="px-2 py-1 bg-[var(--bg-surface)] rounded">
                            File Hashes
                          </span>
                        )}
                        {pkg.includesSignatures && (
                          <span className="px-2 py-1 bg-[var(--bg-surface)] rounded">
                            Signatures
                          </span>
                        )}
                        {pkg.includesAIAnalysis && (
                          <span className="px-2 py-1 bg-[var(--bg-surface)] rounded">
                            AI Analysis
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Generated: {new Date(pkg.createdAt).toLocaleString()}
                      </div>
                      <div className="font-mono text-xs text-[var(--text-muted)] break-all">
                        SHA-256: {pkg.sha256}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleDownload(pkg.sha256)}
                        variant="outline"
                        className="min-w-[100px]"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download
                      </Button>
                      <Button
                        onClick={() => handleVerify(pkg.sha256)}
                        disabled={verifying === pkg.sha256}
                        loading={verifying === pkg.sha256}
                        variant="secondary"
                        className="min-w-[100px]"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Verify
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
