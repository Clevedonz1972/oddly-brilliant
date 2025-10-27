import api from './api';
import type { LoginCredentials, SignupCredentials, AuthResponse } from '../types';

/**
 * Authentication service for login, signup, and logout operations
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);

    if (!response.data.data) {
      throw new Error('Login failed - invalid response from server');
    }

    return response.data.data;
  },

  /**
   * Signup with email and password
   */
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/signup', credentials);

    if (!response.data.data) {
      throw new Error('Signup failed - invalid response from server');
    }

    return response.data.data;
  },

  /**
   * Logout (client-side token removal)
   */
  async logout(): Promise<void> {
    // If backend has a logout endpoint, call it here
    // await api.post('/auth/logout');
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    const response = await api.get<{ success: boolean; data: any }>('/auth/me');

    if (!response.data.data) {
      throw new Error('Failed to get current user');
    }

    return response.data.data;
  },
};
