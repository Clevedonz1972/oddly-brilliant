import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/signup',
  validateRequest([
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('walletAddress')
      .optional()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid Ethereum address format'),
  ]),
  authController.signup.bind(authController)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validateRequest([
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login.bind(authController)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

/**
 * @route   PUT /api/auth/wallet
 * @desc    Update user's wallet address
 * @access  Private
 */
router.put(
  '/wallet',
  authenticate,
  validateRequest([
    body('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid Ethereum address format'),
  ]),
  authController.updateWallet.bind(authController)
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user's profile information
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  validateRequest([
    body('profile.displayName')
      .optional()
      .isString()
      .isLength({ max: 50 })
      .withMessage('Display name must be less than 50 characters'),
    body('profile.thinkingStyle')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Thinking style must be less than 500 characters'),
    body('profile.interests')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Interests must be less than 500 characters'),
  ]),
  authController.updateProfile.bind(authController)
);

export default router;
