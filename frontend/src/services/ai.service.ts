/**
 * AI Services API Client
 * Provides methods to interact with SafetyService, EthicsService, and EvidenceGenerator
 */

import { api } from './api';
import type {
  SafetyAnalysisResult,
  SafetyModerationResult,
  AnalyzeContentRequest,
  ModerateContentRequest,
  EthicsAuditResult,
  EthicsReportSummary,
  EvidencePackage,
  GenerateEvidenceRequest,
  GenerateEvidenceResponse,
  VerificationResult,
  ApiResponse,
} from '../types/ai.types';

/**
 * Safety Service API methods
 */
export const safetyService = {
  /**
   * Analyze content for safety issues
   */
  async analyzeContent(
    request: AnalyzeContentRequest
  ): Promise<SafetyAnalysisResult> {
    const response = await api.post<ApiResponse<SafetyAnalysisResult>>(
      '/admin/safety/analyze',
      request
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.data;
  },

  /**
   * Moderate content and auto-flag if needed
   */
  async moderateContent(
    entityType: string,
    entityId: string,
    content: ModerateContentRequest
  ): Promise<SafetyModerationResult> {
    const response = await api.post<ApiResponse<SafetyModerationResult>>(
      `/admin/safety/moderate/${entityType}/${entityId}`,
      content
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.data;
  },

  /**
   * Get moderation results for an entity
   */
  async getModerationResults(
    entityType: string,
    entityId: string
  ): Promise<SafetyModerationResult[]> {
    const response = await api.get<ApiResponse<SafetyModerationResult[]>>(
      `/admin/safety/results/${entityType}/${entityId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.data;
  },
};

/**
 * Ethics Service API methods
 */
export const ethicsService = {
  /**
   * Run ethics audit on a challenge
   */
  async auditChallenge(challengeId: string): Promise<EthicsAuditResult> {
    const response = await api.post<ApiResponse<EthicsAuditResult>>(
      `/admin/ethics/audit/${challengeId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.data;
  },

  /**
   * Get all ethics audits for a challenge
   */
  async getAudits(challengeId: string): Promise<EthicsAuditResult[]> {
    const response = await api.get<ApiResponse<EthicsAuditResult[]>>(
      `/admin/ethics/audits/${challengeId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.data;
  },

  /**
   * Get ethics report summary for a challenge
   */
  async getReport(challengeId: string): Promise<EthicsReportSummary> {
    const response = await api.get<ApiResponse<EthicsReportSummary>>(
      `/admin/ethics/report/${challengeId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.data;
  },
};

/**
 * Evidence Generator API methods
 */
export const evidenceService = {
  /**
   * Generate evidence package for a challenge
   */
  async generatePackage(
    challengeId: string,
    options: GenerateEvidenceRequest = {}
  ): Promise<GenerateEvidenceResponse> {
    const response = await api.post<ApiResponse<GenerateEvidenceResponse>>(
      `/admin/evidence/generate/${challengeId}`,
      options
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.data;
  },

  /**
   * Download evidence package PDF
   */
  async downloadPackage(packageId: string): Promise<void> {
    // Direct download - open in new window
    const baseURL = api.defaults.baseURL || '';
    const url = `${baseURL}/admin/evidence/download/${packageId}`;
    window.open(url, '_blank');
  },

  /**
   * Verify evidence package integrity
   */
  async verifyPackage(packageId: string): Promise<VerificationResult> {
    const response = await api.get<ApiResponse<VerificationResult>>(
      `/admin/evidence/verify/${packageId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.data;
  },

  /**
   * List all evidence packages for a challenge
   */
  async listPackages(challengeId: string): Promise<EvidencePackage[]> {
    const response = await api.get<ApiResponse<EvidencePackage[]>>(
      `/admin/evidence/list/${challengeId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.data;
  },
};

// Export unified AI service
export const aiService = {
  safety: safetyService,
  ethics: ethicsService,
  evidence: evidenceService,
};

export default aiService;
