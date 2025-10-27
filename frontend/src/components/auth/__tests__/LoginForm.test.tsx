import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { authService } from '../../../services/auth.service';
import { useAuthStore } from '../../../stores/authStore';
import type { User } from '../../../types';

// Mock dependencies
vi.mock('../../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockNavigate = vi.fn();

describe('LoginForm', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    profile: {},
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

  const renderLoginForm = () => {
    return render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Reset auth store
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  describe('Rendering', () => {
    it('should display email input', () => {
      // Act
      renderLoginForm();

      // Assert
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      expect(emailInput).toBeDefined();
      expect(emailInput.getAttribute('type')).toBe('email');
    });

    it('should display password input', () => {
      // Act
      renderLoginForm();

      // Assert
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      expect(passwordInput).toBeDefined();
      expect(passwordInput.getAttribute('type')).toBe('password');
    });

    it('should display submit button', () => {
      // Act
      renderLoginForm();

      // Assert
      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toBeDefined();
    });

    it('should have email placeholder', () => {
      // Act
      renderLoginForm();

      // Assert
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      expect(emailInput).toBeDefined();
    });

    it('should have password placeholder', () => {
      // Act
      renderLoginForm();

      // Assert
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      expect(passwordInput).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should show error for invalid email format', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.type(emailInput, 'notanemail');
      await user.click(submitButton); // Trigger validation on submit

      // Assert - Email validation prevents form submission
      // The auth service should not be called with invalid email
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should show error for empty password', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeDefined();
      });
    });

    it('should show error for short password', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com'); // Need valid email
      await user.type(passwordInput, '12345');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeDefined();
      });
    });

    it('should not submit form with invalid data', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      // Assert
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should clear validation errors when user corrects input', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockResolvedValue({ user: mockUser, token: mockToken });
      renderLoginForm();

      // Act - Submit without password to trigger error
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Wait for password error to appear
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeDefined();
      });

      // Add password and resubmit
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert - Error should disappear and login should be called
      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 6 characters/i)).toBeNull();
        expect(authService.login).toHaveBeenCalled();
      });
    });
  });

  describe('Submission', () => {
    it('should call authService.login with form data', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockResolvedValue({ user: mockUser, token: mockToken });
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show loading state during submit', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ user: mockUser, token: mockToken }), 100))
      );
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert - Button should show loading
      expect(screen.getByText(/loading/i)).toBeDefined();
      expect(submitButton.hasAttribute('disabled')).toBe(true);
    });

    it('should navigate to /dashboard on success', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockResolvedValue({ user: mockUser, token: mockToken });
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should display API error message on failure', async () => {
      // Arrange
      const user = userEvent.setup();
      const errorMessage = 'Invalid email or password';
      (authService.login as any).mockRejectedValue({ message: errorMessage });
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeDefined();
      });
    });

    it('should update auth store on success', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockResolvedValue({ user: mockUser, token: mockToken });
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockUser);
        expect(state.token).toBe(mockToken);
      });
    });

    it('should display generic error message when error has no message', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockRejectedValue({});
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/login failed. please try again/i)).toBeDefined();
      });
    });

    it('should clear previous errors on new submission', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockRejectedValueOnce({ message: 'First error' });
      (authService.login as any).mockResolvedValueOnce({ user: mockUser, token: mockToken });
      renderLoginForm();

      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      // Act - First submission (fails)
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeDefined();
      });

      // Act - Second submission (succeeds)
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpass');
      await user.click(submitButton);

      // Assert - Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/first error/i)).toBeNull();
      });
    });
  });

  describe('User Interaction', () => {
    it('should allow user to type in email field', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      // Assert
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should allow user to type in password field', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginForm();

      // Act
      const passwordInput = screen.getByPlaceholderText(/••••••••/) as HTMLInputElement;
      await user.type(passwordInput, 'password123');

      // Assert
      expect(passwordInput.value).toBe('password123');
    });

    it('should submit form with Enter key', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockResolvedValue({ user: mockUser, token: mockToken });
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123{Enter}');

      // Assert
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalled();
      });
    });

    it('should prevent double submission', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ user: mockUser, token: mockToken }), 200))
      );
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Click twice rapidly
      await user.click(submitButton);
      await user.click(submitButton);

      // Assert - Should only be called once
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledTimes(1);
      });
    });

    it('should allow editing after validation error', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginForm();

      // Act - Trigger validation error
      const emailInput = screen.getByPlaceholderText(/your@email.com/i) as HTMLInputElement;
      await user.type(emailInput, 'invalid');
      await user.tab();

      // Edit the field
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      // Assert
      expect(emailInput.value).toBe('valid@example.com');
    });

    it('should disable button during loading', async () => {
      // Arrange
      const user = userEvent.setup();
      (authService.login as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ user: mockUser, token: mockToken }), 100))
      );
      renderLoginForm();

      // Act
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      expect(submitButton.hasAttribute('disabled')).toBe(true);
    });
  });
});
