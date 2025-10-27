import api from './api';
import type { Contribution, ContributionType } from '../types';

/**
 * Backend API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Parameters for getting contributions list
 */
export interface GetContributionsParams {
  challengeId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

/**
 * Data for creating a new contribution
 */
export interface CreateContributionData {
  challengeId: string;
  content: string;
  type: ContributionType;
  tokenValue?: number; // Optional - backend auto-calculates
  blockchainTxHash?: string;
}

/**
 * Contributions service for managing contribution-related API calls
 * Provides type-safe methods for CRUD operations on contributions
 */
export const contributionsService = {
  /**
   * Get all contributions with optional filtering and pagination
   * @param params - Filter and pagination parameters
   * @returns Promise resolving to array of contributions with metadata
   */
  async getContributions(params?: GetContributionsParams): Promise<{ contributions: Contribution[]; total?: number; page?: number; limit?: number }> {
    const queryParams = new URLSearchParams();

    if (params?.challengeId) {
      queryParams.append('challengeId', params.challengeId);
    }
    if (params?.userId) {
      queryParams.append('userId', params.userId);
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/contributions?${queryString}` : '/contributions';

    const response = await api.get<ApiResponse<Contribution[]>>(url);

    return {
      contributions: response.data.data || [],
      total: response.data.meta?.total,
      page: response.data.meta?.page,
      limit: response.data.meta?.limit,
    };
  },

  /**
   * Get a single contribution by ID
   * @param id - Contribution ID
   * @returns Promise resolving to contribution details
   */
  async getContributionById(id: string): Promise<Contribution> {
    const response = await api.get<ApiResponse<Contribution>>(`/contributions/${id}`);

    if (!response.data.data) {
      throw new Error('Contribution not found');
    }

    return response.data.data;
  },

  /**
   * Create a new contribution
   * @param data - Contribution creation data
   * @returns Promise resolving to created contribution
   */
  async createContribution(data: CreateContributionData): Promise<Contribution> {
    const response = await api.post<ApiResponse<Contribution>>('/contributions', data);

    if (!response.data.data) {
      throw new Error('Failed to create contribution');
    }

    return response.data.data;
  },

  /**
   * Delete a contribution
   * @param id - Contribution ID
   * @returns Promise resolving when contribution is deleted
   */
  async deleteContribution(id: string): Promise<void> {
    await api.delete<ApiResponse<{ message: string }>>(`/contributions/${id}`);
  },

  /**
   * Get contributions for a specific challenge (convenience method)
   * @param challengeId - Challenge ID
   * @returns Promise resolving to contributions for the challenge
   */
  async getContributionsByChallenge(challengeId: string): Promise<Contribution[]> {
    const result = await this.getContributions({ challengeId });
    return result.contributions;
  },

  /**
   * Get contributions by a specific user (convenience method)
   * @param userId - User ID
   * @returns Promise resolving to contributions by the user
   */
  async getContributionsByUser(userId: string): Promise<Contribution[]> {
    const result = await this.getContributions({ userId });
    return result.contributions;
  },
};
