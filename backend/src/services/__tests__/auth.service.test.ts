import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { Role } from '@prisma/client';
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '../../types';

// Mock dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  // Mock Prisma client
  const mockPrismaUser = prisma.users as jest.Mocked<typeof prisma.users>;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('signup()', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'password123',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      profile: {},
      role: Role.USER,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      kycStatus: 'PENDING',
      kycVerifiedAt: null,
    };

    describe('Success Cases', () => {
      it('should create user with hashed password', async () => {
        // Arrange
        mockPrismaUser.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
        (jwt.sign as jest.Mock).mockReturnValue('valid-token');
        mockPrismaUser.create.mockResolvedValue(mockUser);

        // Act
        await authService.signup(validSignupData);

        // Assert
        expect(bcrypt.hash).toHaveBeenCalledWith(validSignupData.password, 10);
        expect(mockPrismaUser.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              email: validSignupData.email,
              passwordHash: 'hashed-password',
              walletAddress: validSignupData.walletAddress,
              profile: {},
            }),
          })
        );
      });

      it('should return user without password', async () => {
        // Arrange
        mockPrismaUser.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
        (jwt.sign as jest.Mock).mockReturnValue('valid-token');
        mockPrismaUser.create.mockResolvedValue(mockUser);

        // Act
        const result = await authService.signup(validSignupData);

        // Assert
        expect(result.user).not.toHaveProperty('passwordHash');
        expect(result.user).toMatchObject({
          id: mockUser.id,
          email: mockUser.email,
          walletAddress: mockUser.walletAddress,
        });
      });

      it('should generate valid JWT token', async () => {
        // Arrange
        mockPrismaUser.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
        (jwt.sign as jest.Mock).mockReturnValue('valid-jwt-token');
        mockPrismaUser.create.mockResolvedValue(mockUser);

        // Act
        const result = await authService.signup(validSignupData);

        // Assert
        expect(jwt.sign).toHaveBeenCalledWith(
          {
            userId: mockUser.id,
            email: mockUser.email,
          },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRES_IN }
        );
        expect(result.token).toBe('valid-jwt-token');
      });

      it('should handle optional walletAddress', async () => {
        // Arrange
        const signupDataWithoutWallet = {
          email: 'test@example.com',
          password: 'password123',
        };
        const userWithoutWallet = { ...mockUser, walletAddress: null };

        mockPrismaUser.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
        (jwt.sign as jest.Mock).mockReturnValue('valid-token');
        mockPrismaUser.create.mockResolvedValue(userWithoutWallet);

        // Act
        const result = await authService.signup(signupDataWithoutWallet);

        // Assert
        expect(mockPrismaUser.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              email: signupDataWithoutWallet.email,
              passwordHash: 'hashed-password',
              walletAddress: undefined,
              profile: {},
            }),
          })
        );
        expect(result.user.walletAddress).toBeNull();
      });

      it('should handle optional profile data', async () => {
        // Arrange
        const signupDataWithProfile = {
          ...validSignupData,
          profile: { name: 'Test User', bio: 'A test bio' },
        };
        const userWithProfile = {
          ...mockUser,
          profile: { name: 'Test User', bio: 'A test bio' },
        };

        mockPrismaUser.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
        (jwt.sign as jest.Mock).mockReturnValue('valid-token');
        mockPrismaUser.create.mockResolvedValue(userWithProfile);

        // Act
        await authService.signup(signupDataWithProfile);

        // Assert
        expect(mockPrismaUser.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              email: signupDataWithProfile.email,
              passwordHash: 'hashed-password',
              walletAddress: signupDataWithProfile.walletAddress,
              profile: signupDataWithProfile.profile,
            }),
          })
        );
      });
    });

    describe('Validation Errors', () => {
      it('should reject duplicate email', async () => {
        // Arrange
        mockPrismaUser.findUnique.mockResolvedValue(mockUser);

        // Act & Assert
        await expect(authService.signup(validSignupData)).rejects.toThrow(ConflictError);
        await expect(authService.signup(validSignupData)).rejects.toThrow(
          'User with this email already exists'
        );

        expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
          where: { email: validSignupData.email },
        });
      });

      it('should reject invalid email format', async () => {
        // Arrange
        const invalidEmailData = {
          ...validSignupData,
          email: 'invalid-email',
        };

        // Act & Assert
        await expect(authService.signup(invalidEmailData)).rejects.toThrow(ValidationError);
        await expect(authService.signup(invalidEmailData)).rejects.toThrow('Invalid email format');
      });

      it('should reject multiple invalid email formats', async () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user @example.com',
          'user@example',
        ];

        for (const email of invalidEmails) {
          await expect(
            authService.signup({ ...validSignupData, email })
          ).rejects.toThrow(ValidationError);
        }
      });

      it('should reject weak password (less than 8 characters)', async () => {
        // Arrange
        const weakPasswordData = {
          ...validSignupData,
          password: 'short',
        };

        // Act & Assert
        await expect(authService.signup(weakPasswordData)).rejects.toThrow(ValidationError);
        await expect(authService.signup(weakPasswordData)).rejects.toThrow(
          'Password must be at least 8 characters long'
        );
      });

      it('should accept password with exactly 8 characters', async () => {
        // Arrange
        const minPasswordData = {
          ...validSignupData,
          password: '12345678',
        };

        mockPrismaUser.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
        (jwt.sign as jest.Mock).mockReturnValue('valid-token');
        mockPrismaUser.create.mockResolvedValue(mockUser);

        // Act
        const result = await authService.signup(minPasswordData);

        // Assert
        expect(result).toBeDefined();
        expect(result.user.email).toBe(validSignupData.email);
      });

      it('should reject duplicate wallet address', async () => {
        // Arrange
        // First call to findUnique (email check) returns null
        // Second call to findUnique (wallet check) returns existing user
        mockPrismaUser.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockUser);

        // Act & Assert
        await expect(authService.signup(validSignupData)).rejects.toThrow(ConflictError);

        // Re-setup mocks for second assertion
        mockPrismaUser.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockUser);

        await expect(authService.signup(validSignupData)).rejects.toThrow(
          'Wallet address already registered'
        );

        expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
          where: { walletAddress: validSignupData.walletAddress },
        });
      });
    });
  });

  describe('login()', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      profile: {},
      role: Role.USER,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      kycStatus: 'PENDING',
      kycVerifiedAt: null,
    };

    describe('Success Cases', () => {
      it('should return token for valid credentials', async () => {
        // Arrange
        mockPrismaUser.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue('valid-jwt-token');

        // Act
        const result = await authService.login(validLoginData);

        // Assert
        expect(result.token).toBe('valid-jwt-token');
        expect(jwt.sign).toHaveBeenCalledWith(
          {
            userId: mockUser.id,
            email: mockUser.email,
          },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRES_IN }
        );
      });

      it('should return sanitized user object', async () => {
        // Arrange
        mockPrismaUser.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue('valid-token');

        // Act
        const result = await authService.login(validLoginData);

        // Assert
        expect(result.user).not.toHaveProperty('passwordHash');
        expect(result.user).toMatchObject({
          id: mockUser.id,
          email: mockUser.email,
          walletAddress: mockUser.walletAddress,
        });
      });

      it('should verify password correctly', async () => {
        // Arrange
        mockPrismaUser.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue('valid-token');

        // Act
        await authService.login(validLoginData);

        // Assert
        expect(bcrypt.compare).toHaveBeenCalledWith(
          validLoginData.password,
          mockUser.passwordHash
        );
      });
    });

    describe('Error Cases', () => {
      it('should reject wrong password', async () => {
        // Arrange
        mockPrismaUser.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        // Act & Assert
        await expect(authService.login(validLoginData)).rejects.toThrow(AuthenticationError);
        await expect(authService.login(validLoginData)).rejects.toThrow(
          'Invalid email or password'
        );
      });

      it('should reject non-existent email', async () => {
        // Arrange
        mockPrismaUser.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(authService.login(validLoginData)).rejects.toThrow(AuthenticationError);
        await expect(authService.login(validLoginData)).rejects.toThrow(
          'Invalid email or password'
        );

        expect(bcrypt.compare).not.toHaveBeenCalled();
      });

      it('should reject empty password', async () => {
        // Arrange
        const emptyPasswordData = {
          email: 'test@example.com',
          password: '',
        };
        mockPrismaUser.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        // Act & Assert
        await expect(authService.login(emptyPasswordData)).rejects.toThrow(AuthenticationError);
      });
    });
  });

  describe('verifyToken()', () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      iat: 1234567890,
      exp: 1234567890,
    };

    describe('Success Cases', () => {
      it('should decode valid JWT', async () => {
        // Arrange
        (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

        // Act
        const result = authService.verifyToken('valid-token');

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith('valid-token', env.JWT_SECRET);
        expect(result).toMatchObject({
          userId: mockPayload.userId,
          email: mockPayload.email,
        });
      });

      it('should return complete payload with timestamps', async () => {
        // Arrange
        (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

        // Act
        const result = authService.verifyToken('valid-token');

        // Assert
        expect(result.iat).toBeDefined();
        expect(result.exp).toBeDefined();
      });
    });

    describe('Error Cases', () => {
      it('should reject expired token', async () => {
        // Arrange
        const expiredError = new Error('jwt expired');
        expiredError.name = 'TokenExpiredError';
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw expiredError;
        });

        // Act & Assert
        expect(() => authService.verifyToken('expired-token')).toThrow(AuthenticationError);
        expect(() => authService.verifyToken('expired-token')).toThrow(
          'Invalid or expired token'
        );
      });

      it('should reject malformed token', async () => {
        // Arrange
        const malformedError = new Error('jwt malformed');
        malformedError.name = 'JsonWebTokenError';
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw malformedError;
        });

        // Act & Assert
        expect(() => authService.verifyToken('malformed-token')).toThrow(AuthenticationError);
      });

      it('should reject tampered token', async () => {
        // Arrange
        const invalidError = new Error('invalid signature');
        invalidError.name = 'JsonWebTokenError';
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw invalidError;
        });

        // Act & Assert
        expect(() => authService.verifyToken('tampered-token')).toThrow(AuthenticationError);
        expect(() => authService.verifyToken('tampered-token')).toThrow(
          'Invalid or expired token'
        );
      });

      it('should reject empty token', async () => {
        // Arrange
        const emptyError = new Error('jwt must be provided');
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw emptyError;
        });

        // Act & Assert
        expect(() => authService.verifyToken('')).toThrow(AuthenticationError);
      });
    });
  });

  describe('getUserById()', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      profile: {},
      role: Role.USER,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      kycStatus: 'PENDING',
      kycVerifiedAt: null,
    };

    it('should return sanitized user for valid userId', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await authService.getUserById('user-123');

      // Assert
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getUserById('non-existent')).rejects.toThrow(AuthenticationError);
      await expect(authService.getUserById('non-existent')).rejects.toThrow('User not found');
    });
  });

  describe('updateWalletAddress()', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      profile: {},
      role: Role.USER,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      kycStatus: 'PENDING',
      kycVerifiedAt: null,
    };

    const newWalletAddress = '0x1234567890123456789012345678901234567890';

    it('should update wallet address successfully', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaUser.update.mockResolvedValue({
        ...mockUser,
        walletAddress: newWalletAddress,
      });

      // Act
      const result = await authService.updateWalletAddress('user-123', newWalletAddress);

      // Assert
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { walletAddress: newWalletAddress },
      });
      expect(result.walletAddress).toBe(newWalletAddress);
    });

    it('should return sanitized user without password', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaUser.update.mockResolvedValue({
        ...mockUser,
        walletAddress: newWalletAddress,
      });

      // Act
      const result = await authService.updateWalletAddress('user-123', newWalletAddress);

      // Assert
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should reject if wallet address is already taken by another user', async () => {
      // Arrange
      const existingUser = { ...mockUser, id: 'different-user' };
      mockPrismaUser.findUnique.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(
        authService.updateWalletAddress('user-123', newWalletAddress)
      ).rejects.toThrow(ConflictError);
      await expect(
        authService.updateWalletAddress('user-123', newWalletAddress)
      ).rejects.toThrow('Wallet address already registered');
    });

    it('should allow user to update their own wallet address', async () => {
      // Arrange - Same user updating their own wallet
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockPrismaUser.update.mockResolvedValue({
        ...mockUser,
        walletAddress: newWalletAddress,
      });

      // Act
      const result = await authService.updateWalletAddress('user-123', newWalletAddress);

      // Assert
      expect(result.walletAddress).toBe(newWalletAddress);
    });
  });
});
