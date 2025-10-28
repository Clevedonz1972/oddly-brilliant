import { api } from './api';
import type { Submission, CreateSubmissionData, ReviewSubmissionData } from '../types/submissions';

/**
 * Service for submission-related API calls
 */
export const submissionsService = {
  /**
   * Create a new submission (draft)
   */
  async create(data: CreateSubmissionData): Promise<Submission> {
    const response = await api.post<Submission>('/submissions', data);
    return response.data;
  },

  /**
   * Upload a file to a submission
   */
  async uploadFile(submissionId: string, file: File): Promise<Submission> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<Submission>(
      `/submissions/${submissionId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Remove a file from a submission
   */
  async removeFile(submissionId: string, fileId: string): Promise<Submission> {
    const response = await api.delete<Submission>(
      `/submissions/${submissionId}/files/${fileId}`
    );
    return response.data;
  },

  /**
   * Submit a draft for review
   */
  async submit(id: string): Promise<Submission> {
    const response = await api.put<Submission>(`/submissions/${id}/submit`);
    return response.data;
  },

  /**
   * Start review of a submission (project leader)
   */
  async startReview(id: string): Promise<Submission> {
    const response = await api.put<Submission>(`/submissions/${id}/review`);
    return response.data;
  },

  /**
   * Approve a submission (project leader)
   */
  async approve(id: string, notes?: string): Promise<Submission> {
    const data: ReviewSubmissionData = notes ? { reviewNotes: notes } : {};
    const response = await api.put<Submission>(`/submissions/${id}/approve`, data);
    return response.data;
  },

  /**
   * Reject a submission (project leader)
   */
  async reject(id: string, notes: string): Promise<Submission> {
    const data: ReviewSubmissionData = { reviewNotes: notes };
    const response = await api.put<Submission>(`/submissions/${id}/reject`, data);
    return response.data;
  },

  /**
   * Request revision on a submission (project leader)
   */
  async requestRevision(id: string, notes: string): Promise<Submission> {
    const data: ReviewSubmissionData = { reviewNotes: notes };
    const response = await api.put<Submission>(`/submissions/${id}/request-revision`, data);
    return response.data;
  },

  /**
   * Get a submission by ID
   */
  async getById(id: string): Promise<Submission> {
    const response = await api.get<Submission>(`/submissions/${id}`);
    return response.data;
  },

  /**
   * Get current user's submissions
   */
  async getMySubmissions(): Promise<Submission[]> {
    // BUG FIX: Backend returns { success, data } format, access data.data
    const response = await api.get<{ success: boolean; data: Submission[] }>('/submissions/my');
    return response.data.data || [];
  },

  /**
   * Get all submissions for a challenge
   */
  async getByChallengeId(challengeId: string): Promise<Submission[]> {
    // BUG FIX: Backend returns { success, data } format, access data.data
    const response = await api.get<{ success: boolean; data: Submission[] }>(`/challenges/${challengeId}/submissions`);
    return response.data.data || [];
  },
};
