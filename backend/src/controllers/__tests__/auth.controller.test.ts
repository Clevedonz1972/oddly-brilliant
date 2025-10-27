import request from 'supertest';
import express, { Application } from 'express';
import { authService } from '../../services/auth.service';
import { errorHandler } from '../../middleware/error';
import authRoutes from '../../routes/auth.routes';
import {
  AuthenticationError,
  ConflictError,
  UserResponseDTO,
} from '../../types';

// Mock dependencies
jest.mock('../../services/auth.service');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock JWT for authentication middleware
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-token'),
  verify: jest.fn((token) => {
    if (token === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token') {
      return {
        userId: 'user-123',
        email: 'test@example.com',
      };
    }
    throw new Error('Invalid token');
  }),
  JsonWebTokenError: Error,
  TokenExpiredError: Error,
}));

describe('AuthController', () => {
  let app: Application;
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  // Mock user data
  const mockUser: UserResponseDTO = {
    id: 'user-123',
    email: 'test@example.com',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    profile: {},
    createdAt: new Date('2024-01-01'),
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

  beforeEach(() => {
    // Create a test Express app with the same setup as production
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);

    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'password123',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    };

    describe('Success Cases', () => {
      it('should return 201 with token and user', async () => {
        // Arrange
        mockAuthService.signup.mockResolvedValue({
          user: mockUser,
          token: mockToken,
        });

        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send(validSignupData)
          .expect(201);

        // Assert
        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: expect.objectContaining({
              id: mockUser.id,
              email: mockUser.email,
            }),
            token: mockToken,
          },
        });
        expect(mockAuthService.signup).toHaveBeenCalledWith(validSignupData);
      });

      it('should accept signup without wallet address', async () => {
        // Arrange
        const signupWithoutWallet = {
          email: 'test@example.com',
          password: 'password123',
        };
        mockAuthService.signup.mockResolvedValue({
          user: { ...mockUser, walletAddress: undefined },
          token: mockToken,
        });

        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send(signupWithoutWallet)
          .expect(201);

        // Assert
        expect(response.body.success).toBe(true);
        expect(mockAuthService.signup).toHaveBeenCalled();
      });

      it('should response match UserResponseDTO type', async () => {
        // Arrange
        mockAuthService.signup.mockResolvedValue({
          user: mockUser,
          token: mockToken,
        });

        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send(validSignupData)
          .expect(201);

        // Assert
        const userData = response.body.data.user;
        expect(userData).toHaveProperty('id');
        expect(userData).toHaveProperty('email');
        expect(userData).toHaveProperty('createdAt');
        expect(userData).not.toHaveProperty('passwordHash');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 for invalid email', async () => {
        // Arrange
        const invalidEmailData = {
          ...validSignupData,
          email: 'invalid-email',
        };

        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send(invalidEmailData)
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(mockAuthService.signup).not.toHaveBeenCalled();
      });

      it('should return 400 for short password', async () => {
        // Arrange
        const shortPasswordData = {
          ...validSignupData,
          password: 'short',
        };

        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send(shortPasswordData)
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toBe('Validation failed');
        expect(mockAuthService.signup).not.toHaveBeenCalled();
      });

      it('should return 400 for invalid wallet address format', async () => {
        // Arrange
        const invalidWalletData = {
          ...validSignupData,
          walletAddress: 'invalid-wallet',
        };

        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send(invalidWalletData)
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(mockAuthService.signup).not.toHaveBeenCalled();
      });

      it('should return 400 for missing required fields', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send({ email: 'test@example.com' })
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(mockAuthService.signup).not.toHaveBeenCalled();
      });
    });

    describe('Conflict Errors', () => {
      it('should return 409 for duplicate email', async () => {
        // Arrange
        mockAuthService.signup.mockRejectedValue(
          new ConflictError('User with this email already exists')
        );

        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send(validSignupData)
          .expect(409);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe('User with this email already exists');
      });

      it('should return 409 for duplicate wallet address', async () => {
        // Arrange
        mockAuthService.signup.mockRejectedValue(
          new ConflictError('Wallet address already registered')
        );

        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send(validSignupData)
          .expect(409);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe('Wallet address already registered');
      });
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    describe('Success Cases', () => {
      it('should return 200 with token and user', async () => {
        // Arrange
        mockAuthService.login.mockResolvedValue({
          user: mockUser,
          token: mockToken,
        });

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(validLoginData)
          .expect(200);

        // Assert
        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: expect.objectContaining({
              id: mockUser.id,
              email: mockUser.email,
            }),
            token: mockToken,
          },
        });
        expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
      });

      it('should call authService.login with correct credentials', async () => {
        // Arrange
        mockAuthService.login.mockResolvedValue({
          user: mockUser,
          token: mockToken,
        });

        // Act
        await request(app).post('/api/auth/login').send(validLoginData).expect(200);

        // Assert
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: validLoginData.email,
          password: validLoginData.password,
        });
      });
    });

    describe('Error Cases', () => {
      it('should return 401 for wrong password', async () => {
        // Arrange
        mockAuthService.login.mockRejectedValue(
          new AuthenticationError('Invalid email or password')
        );

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(validLoginData)
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe('Invalid email or password');
      });

      it('should return 401 for non-existent user', async () => {
        // Arrange
        mockAuthService.login.mockRejectedValue(
          new AuthenticationError('Invalid email or password')
        );

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'nonexistent@example.com', password: 'password123' })
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe('Invalid email or password');
      });

      it('should return 400 for missing email', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({ password: 'password123' })
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(mockAuthService.login).not.toHaveBeenCalled();
      });

      it('should return 400 for missing password', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com' })
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(mockAuthService.login).not.toHaveBeenCalled();
      });

      it('should return 400 for invalid email format', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'invalid-email', password: 'password123' })
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(mockAuthService.login).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET /api/auth/me', () => {
    describe('Success Cases', () => {
      it('should return 200 with user for valid token', async () => {
        // Arrange
        mockAuthService.getUserById.mockResolvedValue(mockUser);

        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(200);

        // Assert
        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          }),
        });
      });

      it('should not include password hash in response', async () => {
        // Arrange
        mockAuthService.getUserById.mockResolvedValue(mockUser);

        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(200);

        // Assert
        expect(response.body.data).not.toHaveProperty('passwordHash');
      });
    });

    describe('Error Cases', () => {
      it('should return 401 without token', async () => {
        // Act
        const response = await request(app).get('/api/auth/me').expect(401);

        // Assert
        expect(response.body.success).toBe(false);
        expect(mockAuthService.getUserById).not.toHaveBeenCalled();
      });

      it('should return 401 with invalid token format', async () => {
        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'InvalidFormat token')
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
        expect(mockAuthService.getUserById).not.toHaveBeenCalled();
      });

      it('should return 401 with malformed token', async () => {
        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid.token.here')
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
      });

      it('should return 401 without Bearer prefix', async () => {
        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', mockToken)
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('PUT /api/auth/wallet', () => {
    const newWalletAddress = '0x1234567890123456789012345678901234567890';

    describe('Success Cases', () => {
      it('should return 200 with updated user', async () => {
        // Arrange
        const updatedUser = { ...mockUser, walletAddress: newWalletAddress };
        mockAuthService.updateWalletAddress.mockResolvedValue(updatedUser);

        // Act
        const response = await request(app)
          .put('/api/auth/wallet')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ walletAddress: newWalletAddress })
          .expect(200);

        // Assert
        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            walletAddress: newWalletAddress,
          }),
        });
      });

      it('should call updateWalletAddress with correct parameters', async () => {
        // Arrange
        const updatedUser = { ...mockUser, walletAddress: newWalletAddress };
        mockAuthService.updateWalletAddress.mockResolvedValue(updatedUser);

        // Act
        await request(app)
          .put('/api/auth/wallet')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ walletAddress: newWalletAddress })
          .expect(200);

        // Assert
        expect(mockAuthService.updateWalletAddress).toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      it('should return 401 without authentication', async () => {
        // Act
        const response = await request(app)
          .put('/api/auth/wallet')
          .send({ walletAddress: newWalletAddress })
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
        expect(mockAuthService.updateWalletAddress).not.toHaveBeenCalled();
      });

      it('should return 400 for invalid wallet address format', async () => {
        // Act
        const response = await request(app)
          .put('/api/auth/wallet')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ walletAddress: 'invalid-wallet' })
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(mockAuthService.updateWalletAddress).not.toHaveBeenCalled();
      });

      it('should return 400 for missing wallet address', async () => {
        // Act
        const response = await request(app)
          .put('/api/auth/wallet')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({})
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(mockAuthService.updateWalletAddress).not.toHaveBeenCalled();
      });

      it('should return 400 for wallet address with wrong length', async () => {
        // Act
        const response = await request(app)
          .put('/api/auth/wallet')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ walletAddress: '0x123' })
          .expect(400);

        // Assert
        expect(response.body.success).toBe(false);
        expect(mockAuthService.updateWalletAddress).not.toHaveBeenCalled();
      });

      it('should return 409 for duplicate wallet address', async () => {
        // Arrange
        mockAuthService.updateWalletAddress.mockRejectedValue(
          new ConflictError('Wallet address already registered')
        );

        // Act
        const response = await request(app)
          .put('/api/auth/wallet')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ walletAddress: newWalletAddress })
          .expect(409);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe('Wallet address already registered');
      });
    });
  });
});
