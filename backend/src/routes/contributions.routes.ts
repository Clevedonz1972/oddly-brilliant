import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { contributionsController } from '../controllers/contributions.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { ContributionType } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/contributions
 * @desc    Get all contributions with pagination and filtering
 * @access  Public
 */
router.get(
  '/',
  validateRequest([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('challengeId').optional().isUUID().withMessage('Invalid challenge ID'),
    query('userId').optional().isUUID().withMessage('Invalid user ID'),
  ]),
  contributionsController.getAllContributions.bind(contributionsController)
);

/**
 * @route   GET /api/contributions/:id
 * @desc    Get single contribution by ID
 * @access  Public
 */
router.get(
  '/:id',
  validateRequest([param('id').isUUID().withMessage('Invalid contribution ID')]),
  contributionsController.getContributionById.bind(contributionsController)
);

/**
 * @route   POST /api/contributions
 * @desc    Create a new contribution
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validateRequest([
    body('challengeId').isUUID().withMessage('Valid challenge ID is required'),
    body('content')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Content must be at least 10 characters'),
    body('type')
      .isIn(Object.values(ContributionType))
      .withMessage('Invalid contribution type'),
    body('blockchainTxHash')
      .optional()
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid transaction hash format'),
  ]),
  contributionsController.createContribution.bind(contributionsController)
);

/**
 * @route   DELETE /api/contributions/:id
 * @desc    Delete contribution
 * @access  Private (creator only)
 */
router.delete(
  '/:id',
  authenticate,
  validateRequest([param('id').isUUID().withMessage('Invalid contribution ID')]),
  contributionsController.deleteContribution.bind(contributionsController)
);

export default router;
