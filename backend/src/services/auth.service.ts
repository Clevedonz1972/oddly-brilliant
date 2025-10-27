import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateId } from '../utils/idGenerator';
import { prisma } from '../config/database';
import { env } from '../config/env';
import {
  CreateUserDTO,
  LoginDTO,
  UserResponseDTO,
  JWTPayload,
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '../types';
import { sanitizeUser, isValidEmail } from '../utils/helpers';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 10;

/**
 * Auth Service - Handles authentication and user management
 */
export class AuthService {
  /**
   * Register a new user
   * @param data - User registration data
   * @returns Created user and JWT token
   */
  async signup(data: CreateUserDTO): Promise<{ user: UserResponseDTO; token: string }> {
    const { email, password, walletAddress, profile } = data;

    // Validate email format
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Check wallet address uniqueness if provided
    if (walletAddress) {
      const existingWallet = await prisma.users.findUnique({
        where: { walletAddress },
      });

      if (existingWallet) {
        throw new ConflictError('Wallet address already registered');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.users.create({
      data: {
        id: generateId(),
        email,
        passwordHash,
        walletAddress,
        profile: (profile || {}) as Record<string, never>,
        updatedAt: new Date(),
      },
    });

    logger.info(`New user created: ${email}`);

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    return {
      user: sanitizeUser(user) as UserResponseDTO,
      token,
    };
  }

  /**
   * Login user with email and password
   * @param data - Login credentials
   * @returns User and JWT token
   */
  async login(data: LoginDTO): Promise<{ user: UserResponseDTO; token: string }> {
    const { email, password } = data;

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    logger.info(`User logged in: ${email}`);

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    return {
      user: sanitizeUser(user) as UserResponseDTO,
      token,
    };
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User data
   */
  async getUserById(userId: string): Promise<UserResponseDTO> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return sanitizeUser(user) as UserResponseDTO;
  }

  /**
   * Update user wallet address
   * @param userId - User ID
   * @param walletAddress - Ethereum wallet address
   * @returns Updated user
   */
  async updateWalletAddress(userId: string, walletAddress: string): Promise<UserResponseDTO> {
    // Check if wallet address is already taken
    const existingWallet = await prisma.users.findUnique({
      where: { walletAddress },
    });

    if (existingWallet && existingWallet.id !== userId) {
      throw new ConflictError('Wallet address already registered');
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: { walletAddress },
    });

    logger.info(`Wallet address updated for user: ${user.email}`);

    return sanitizeUser(user) as UserResponseDTO;
  }

  /**
   * Update user profile information
   * @param userId - User ID
   * @param profileData - Profile data to update
   * @returns Updated user
   */
  async updateProfile(
    userId: string,
    profileData: {
      displayName?: string;
      thinkingStyle?: string;
      interests?: string;
    }
  ): Promise<UserResponseDTO> {
    // Validate profile data lengths
    if (profileData.displayName && profileData.displayName.length > 50) {
      throw new ValidationError('Display name must be less than 50 characters');
    }
    if (profileData.thinkingStyle && profileData.thinkingStyle.length > 500) {
      throw new ValidationError('Thinking style must be less than 500 characters');
    }
    if (profileData.interests && profileData.interests.length > 500) {
      throw new ValidationError('Interests must be less than 500 characters');
    }

    // Get current user to merge profile data
    const currentUser = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new AuthenticationError('User not found');
    }

    // Merge existing profile with new data
    const currentProfile =
      typeof currentUser.profile === 'object' && currentUser.profile !== null
        ? currentUser.profile
        : {};

    const updatedProfile = {
      ...currentProfile,
      ...profileData,
    };

    // Update user profile
    const user = await prisma.users.update({
      where: { id: userId },
      data: { profile: updatedProfile as Record<string, never> },
    });

    logger.info(`Profile updated for user: ${user.email}`);

    return sanitizeUser(user) as UserResponseDTO;
  }

  /**
   * Generate JWT token
   * @param userId - User ID
   * @param email - User email
   * @returns JWT token
   */
  private generateToken(userId: string, email: string): string {
    const payload: JWTPayload = {
      userId,
      email,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  }

  /**
   * Verify JWT token
   * @param token - JWT token
   * @returns Decoded payload
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    } catch (_error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
