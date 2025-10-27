import api from './api';
import type { Challenge, ChallengeStatus, CompleteChallengeResponse } from '../types';

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
 * Parameters for getting challenges list
 */
export interface GetChallengesParams {
  status?: ChallengeStatus;
  page?: number;
  limit?: number;
}

/**
 * Data for creating a new challenge
 */
export interface CreateChallengeData {
  title: string;
  description: string;
  bountyAmount: number;
}

/**
 * Data for updating a challenge
 */
export interface UpdateChallengeData {
  title?: string;
  description?: string;
  bountyAmount?: number;
  status?: ChallengeStatus;
}

/**
 * Challenges service for managing challenge-related API calls
 * Provides type-safe methods for CRUD operations on challenges
 */
export const challengesService = {
  /**
   * Get all challenges with optional filtering and pagination
   * @param params - Filter and pagination parameters
   * @returns Promise resolving to array of challenges with metadata
   */
  async getChallenges(params?: GetChallengesParams): Promise<{ challenges: Challenge[]; total?: number; page?: number; limit?: number }> {
    const queryParams = new URLSearchParams();

    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/challenges?${queryString}` : '/challenges';

    const response = await api.get<ApiResponse<Challenge[]>>(url);

    return {
      challenges: response.data.data || [],
      total: response.data.meta?.total,
      page: response.data.meta?.page,
      limit: response.data.meta?.limit,
    };
  },

  /**
   * Get a single challenge by ID
   * @param id - Challenge ID
   * @returns Promise resolving to challenge details
   */
  async getChallengeById(id: string): Promise<Challenge> {
    const response = await api.get<ApiResponse<Challenge>>(`/challenges/${id}`);

    if (!response.data.data) {
      throw new Error('Challenge not found');
    }

    return response.data.data;
  },

  /**
   * Create a new challenge
   * @param data - Challenge creation data
   * @returns Promise resolving to created challenge
   */
  async createChallenge(data: CreateChallengeData): Promise<Challenge> {
    const response = await api.post<ApiResponse<Challenge>>('/challenges', data);

    if (!response.data.data) {
      throw new Error('Failed to create challenge');
    }

    return response.data.data;
  },

  /**
   * Update an existing challenge
   * @param id - Challenge ID
   * @param data - Partial challenge data to update
   * @returns Promise resolving to updated challenge
   */
  async updateChallenge(id: string, data: UpdateChallengeData): Promise<Challenge> {
    const response = await api.patch<ApiResponse<Challenge>>(`/challenges/${id}`, data);

    if (!response.data.data) {
      throw new Error('Failed to update challenge');
    }

    return response.data.data;
  },

  /**
   * Delete a challenge
   * @param id - Challenge ID
   * @returns Promise resolving when challenge is deleted
   */
  async deleteChallenge(id: string): Promise<void> {
    await api.delete<ApiResponse<{ message: string }>>(`/challenges/${id}`);
  },

  /**
   * Get challenges by status (convenience method)
   * @param status - Challenge status to filter by
   * @returns Promise resolving to filtered challenges
   */
  async getChallengesByStatus(status: ChallengeStatus): Promise<Challenge[]> {
    const result = await this.getChallenges({ status });
    return result.challenges;
  },

  /**
   * Get open challenges (convenience method)
   * @returns Promise resolving to open challenges
   */
  async getOpenChallenges(): Promise<Challenge[]> {
    return this.getChallengesByStatus('OPEN');
  },

  /**
   * Get in-progress challenges (convenience method)
   * @returns Promise resolving to in-progress challenges
   */
  async getInProgressChallenges(): Promise<Challenge[]> {
    return this.getChallengesByStatus('IN_PROGRESS');
  },

  /**
   * Get completed challenges (convenience method)
   * @returns Promise resolving to completed challenges
   */
  async getCompletedChallenges(): Promise<Challenge[]> {
    return this.getChallengesByStatus('COMPLETED');
  },

  /**
   * Mark challenge as complete and distribute payments
   * Only sponsor can call this
   * @param id - Challenge ID
   * @returns Promise resolving to challenge with payment details
   */
  async completeChallenge(id: string): Promise<CompleteChallengeResponse> {
    const response = await api.post<ApiResponse<CompleteChallengeResponse>>(
      `/challenges/${id}/complete`
    );

    if (!response.data.data) {
      throw new Error('Failed to complete challenge');
    }

    return response.data.data;
  },
};
