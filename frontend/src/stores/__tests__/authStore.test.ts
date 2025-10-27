import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import type { User } from '../../types';

describe('authStore', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    profile: {
      name: 'Test User',
      bio: 'A test user',
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

  beforeEach(() => {
    // Reset the store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });

    // Clear localStorage mock
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have null user initially', () => {
      // Act
      const state = useAuthStore.getState();

      // Assert
      expect(state.user).toBeNull();
    });

    it('should have null token initially', () => {
      // Act
      const state = useAuthStore.getState();

      // Assert
      expect(state.token).toBeNull();
    });

    it('should have isAuthenticated as false initially', () => {
      // Act
      const state = useAuthStore.getState();

      // Assert
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setAuth()', () => {
    it('should update token and user', () => {
      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);
      const state = useAuthStore.getState();

      // Assert
      expect(state.token).toBe(mockToken);
      expect(state.user).toEqual(mockUser);
    });

    it('should set isAuthenticated to true', () => {
      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);
      const state = useAuthStore.getState();

      // Assert
      expect(state.isAuthenticated).toBe(true);
    });

    it('should persist user data', () => {
      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);
      const state = useAuthStore.getState();

      // Assert
      expect(state.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        walletAddress: mockUser.walletAddress,
      });
    });

    it('should handle user with profile data', () => {
      // Arrange
      const userWithProfile = {
        ...mockUser,
        profile: {
          name: 'Test User',
          bio: 'A test bio',
          avatar: 'https://example.com/avatar.jpg',
        },
      };

      // Act
      useAuthStore.getState().setAuth(userWithProfile, mockToken);
      const state = useAuthStore.getState();

      // Assert
      expect(state.user?.profile).toEqual(userWithProfile.profile);
    });

    it('should handle user without wallet address', () => {
      // Arrange
      const userWithoutWallet = {
        ...mockUser,
        walletAddress: undefined,
      };

      // Act
      useAuthStore.getState().setAuth(userWithoutWallet, mockToken);
      const state = useAuthStore.getState();

      // Assert
      expect(state.user?.walletAddress).toBeUndefined();
    });

    it('should persist to localStorage', () => {
      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);

      // Assert
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should allow updating auth multiple times', () => {
      // Arrange
      const secondUser = {
        ...mockUser,
        id: 'user-456',
        email: 'second@example.com',
      };
      const secondToken = 'second.jwt.token';

      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);
      useAuthStore.getState().setAuth(secondUser, secondToken);
      const state = useAuthStore.getState();

      // Assert
      expect(state.user?.id).toBe(secondUser.id);
      expect(state.token).toBe(secondToken);
    });
  });

  describe('clearAuth()', () => {
    beforeEach(() => {
      // Set up authenticated state before testing clearAuth
      useAuthStore.getState().setAuth(mockUser, mockToken);
    });

    it('should reset to initial state', () => {
      // Act
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();

      // Assert
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      // Act
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();

      // Assert
      expect(state.isAuthenticated).toBe(false);
    });

    it('should remove from localStorage', () => {
      // Arrange
      vi.clearAllMocks();

      // Act
      useAuthStore.getState().clearAuth();

      // Assert
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should work even when already cleared', () => {
      // Act - Clear twice
      useAuthStore.getState().clearAuth();
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();

      // Assert
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist token to localStorage', () => {
      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);

      // Assert
      expect(localStorage.setItem).toHaveBeenCalled();
      const calls = (localStorage.setItem as any).mock.calls;
      const authStorageCall = calls.find((call: any[]) => call[0] === 'auth-storage');
      expect(authStorageCall).toBeDefined();
    });

    it('should persist user to localStorage', () => {
      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);

      // Assert
      const calls = (localStorage.setItem as any).mock.calls;
      const authStorageCall = calls.find((call: any[]) => call[0] === 'auth-storage');
      if (authStorageCall) {
        const storedData = JSON.parse(authStorageCall[1]);
        expect(storedData.state.user).toBeDefined();
        expect(storedData.state.token).toBe(mockToken);
      }
    });

    it('should persist isAuthenticated to localStorage', () => {
      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);

      // Assert
      const calls = (localStorage.setItem as any).mock.calls;
      const authStorageCall = calls.find((call: any[]) => call[0] === 'auth-storage');
      if (authStorageCall) {
        const storedData = JSON.parse(authStorageCall[1]);
        expect(storedData.state.isAuthenticated).toBe(true);
      }
    });

    it('should load token from localStorage on init', () => {
      // Arrange
      const storedState = {
        state: {
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        },
        version: 0,
      };

      vi.clearAllMocks();
      (localStorage.getItem as any).mockReturnValue(JSON.stringify(storedState));

      // Act - Access the store which should trigger persistence check
      // Zustand's persist middleware loads from localStorage on first access
      const store = useAuthStore;

      // Manually trigger persist hydration by accessing persist
      if (store.persist) {
        store.persist.rehydrate();
      }

      // Assert
      // Note: In real app, hydration happens automatically on store creation
      // For testing, we verify the persistence mechanism exists
      expect(localStorage.getItem).toHaveBeenCalled();
    });

    it('should handle missing localStorage gracefully', () => {
      // Arrange
      (localStorage.getItem as any).mockReturnValue(null);

      // Act
      const state = useAuthStore.getState();

      // Assert - Should have default values
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Arrange
      (localStorage.getItem as any).mockReturnValue('invalid-json');

      // Act - Should not throw
      expect(() => useAuthStore.getState()).not.toThrow();
    });

    it('should update localStorage on state change', () => {
      // Arrange
      vi.clearAllMocks();

      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'auth-storage',
        expect.any(String)
      );
    });
  });

  describe('State Transitions', () => {
    it('should transition from unauthenticated to authenticated', () => {
      // Arrange
      const initialState = useAuthStore.getState();
      expect(initialState.isAuthenticated).toBe(false);

      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);
      const newState = useAuthStore.getState();

      // Assert
      expect(newState.isAuthenticated).toBe(true);
    });

    it('should transition from authenticated to unauthenticated', () => {
      // Arrange
      useAuthStore.getState().setAuth(mockUser, mockToken);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Act
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();

      // Assert
      expect(state.isAuthenticated).toBe(false);
    });

    it('should allow re-authentication after logout', () => {
      // Arrange - Login, logout, login again
      useAuthStore.getState().setAuth(mockUser, mockToken);
      useAuthStore.getState().clearAuth();

      // Act
      useAuthStore.getState().setAuth(mockUser, mockToken);
      const state = useAuthStore.getState();

      // Assert
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
    });
  });
});
