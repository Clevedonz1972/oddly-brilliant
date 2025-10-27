import { api } from './api';
import type { Proposal, CreateProposalData, RespondToProposalData } from '../types/proposals';

/**
 * API service for proposal operations
 * Handles all proposal-related HTTP requests
 */
export const proposalsService = {
  /**
   * Create a new proposal for a challenge
   */
  async create(data: CreateProposalData): Promise<Proposal> {
    const response = await api.post<{ success: boolean; data: Proposal }>('/proposals', data);
    return response.data.data;
  },

  /**
   * Get all proposals created by the current user
   */
  async getMyProposals(): Promise<Proposal[]> {
    const response = await api.get<{ success: boolean; data: Proposal[] }>('/proposals/my');
    return response.data.data;
  },

  /**
   * Get a specific proposal by ID
   */
  async getById(id: string): Promise<Proposal> {
    const response = await api.get<{ success: boolean; data: Proposal }>(`/proposals/${id}`);
    return response.data.data;
  },

  /**
   * Respond to a proposal (accept/reject) - Project Leader only
   */
  async respond(id: string, data: RespondToProposalData): Promise<Proposal> {
    const response = await api.put<{ success: boolean; data: Proposal }>(`/proposals/${id}/respond`, data);
    return response.data.data;
  },

  /**
   * Withdraw a proposal - Contributor only
   */
  async withdraw(id: string): Promise<Proposal> {
    const response = await api.put<{ success: boolean; data: Proposal }>(`/proposals/${id}/withdraw`);
    return response.data.data;
  },

  /**
   * Get all proposals for a specific challenge
   */
  async getByChallengeId(challengeId: string): Promise<Proposal[]> {
    const response = await api.get<{ success: boolean; data: Proposal[] }>(`/challenges/${challengeId}/proposals`);
    return response.data.data;
  },
};
