import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest, CreateUserDTO, LoginDTO, ApiResponse, UserResponseDTO } from '../types';
import { logger } from '../utils/logger';

/**
 * Auth Controller - Handles authentication-related HTTP requests
 */
export class AuthController {
  /**
   * POST /api/auth/signup
   * Register a new user
   */
  async signup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserDTO = req.body;

      const result = await authService.signup(userData);

      const response: ApiResponse<{ user: UserResponseDTO; token: string }> = {
        success: true,
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login user with email and password
   */
  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials: LoginDTO = req.body;

      const result = await authService.login(credentials);

      const response: ApiResponse<{ user: UserResponseDTO; token: string }> = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Not authenticated' },
        });
        return;
      }

      const user = await authService.getUserById(req.user.id);

      const response: ApiResponse<UserResponseDTO> = {
        success: true,
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/wallet
   * Update user's wallet address
   */
  async updateWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Not authenticated' },
        });
        return;
      }

      const { walletAddress } = req.body;

      const user = await authService.updateWalletAddress(req.user.id, walletAddress);

      const response: ApiResponse<UserResponseDTO> = {
        success: true,
        data: user,
      };

      logger.info(`Wallet updated for user ${req.user.email}`);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   * Update user's profile information
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Not authenticated' },
        });
        return;
      }

      const { profile } = req.body;

      const user = await authService.updateProfile(req.user.id, profile);

      const response: ApiResponse<UserResponseDTO> = {
        success: true,
        data: user,
      };

      logger.info(`Profile updated for user ${req.user.email}`);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
