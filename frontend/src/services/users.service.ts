import api from './api';
import type { User } from '../types';

/**
 * Profile update data
 */
export interface UpdateProfileData {
  displayName?: string;
  thinkingStyle?: string;
  interests?: string;
}

/**
 * Users Service - Handles user profile and account operations
 */
class UsersService {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    console.log('🔍 Fetching current user profile...');
    const response = await api.get<User>('/auth/me');
    console.log('✅ User profile fetched:', response.data);
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileData): Promise<User> {
    console.log('📝 Updating user profile...', profileData);
    const response = await api.put<User>('/auth/profile', {
      profile: profileData,
    });
    console.log('✅ Profile updated:', response.data);
    return response.data;
  }
}

export const usersService = new UsersService();
