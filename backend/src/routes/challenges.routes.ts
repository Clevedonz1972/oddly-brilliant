import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { challengesController } from '../controllers/challenges.controller';
import { proposalsController } from '../controllers/proposals.controller';
import { submissionsController } from '../controllers/submissions.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { ChallengeStatus, ProposalStatus } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/challenges
 * @desc    Get all challenges with pagination and filtering
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
    query('status')
      .optional()
      .isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED'])
      .withMessage('Invalid status value'),
  ]),
  challengesController.getAllChallenges.bind(challengesController)
);

/**
 * @route   GET /api/challenges/:id
 * @desc    Get single challenge by ID
 * @access  Public
 */
router.get(
  '/:id',
  validateRequest([param('id').isUUID().withMessage('Invalid challenge ID')]),
  challengesController.getChallengeById.bind(challengesController)
);

/**
 * @route   POST /api/challenges
 * @desc    Create a new challenge
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validateRequest([
    body('title')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
    body('bountyAmount')
      .isFloat({ min: 0 })
      .withMessage('Bounty amount must be a positive number'),
  ]),
  challengesController.createChallenge.bind(challengesController)
);

/**
 * @route   PATCH /api/challenges/:id
 * @desc    Update challenge
 * @access  Private (sponsor only)
 */
router.patch(
  '/:id',
  authenticate,
  validateRequest([
    param('id').isUUID().withMessage('Invalid challenge ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
    body('bountyAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Bounty amount must be a positive number'),
    body('status')
      .optional()
      .isIn(Object.values(ChallengeStatus))
      .withMessage('Invalid status value'),
  ]),
  challengesController.updateChallenge.bind(challengesController)
);

/**
 * @route   POST /api/challenges/:id/complete
 * @desc    Complete challenge and distribute payments
 * @access  Private (sponsor only)
 */
router.post(
  '/:id/complete',
  authenticate,
  validateRequest([param('id').isUUID().withMessage('Invalid challenge ID')]),
  challengesController.completeChallenge.bind(challengesController)
);

/**
 * @route   DELETE /api/challenges/:id
 * @desc    Delete challenge
 * @access  Private (sponsor only)
 */
router.delete(
  '/:id',
  authenticate,
  validateRequest([param('id').isUUID().withMessage('Invalid challenge ID')]),
  challengesController.deleteChallenge.bind(challengesController)
);

/**
 * @route   GET /api/challenges/:id/proposals
 * @desc    Get all proposals for a challenge
 * @access  Private (authenticated users)
 */
router.get(
  '/:id/proposals',
  authenticate,
  validateRequest([
    param('id').isUUID().withMessage('Invalid challenge ID'),
    query('status')
      .optional()
      .isIn(Object.values(ProposalStatus))
      .withMessage('Invalid proposal status'),
  ]),
  proposalsController.getProposalsByChallenge.bind(proposalsController)
);

/**
 * @route   GET /api/challenges/:challengeId/submissions
 * @desc    Get all submissions for a challenge
 * @access  Private (authenticated users)
 */
router.get(
  '/:challengeId/submissions',
  authenticate,
  validateRequest([
    param('challengeId')
      .isString()
      .withMessage('Challenge ID is required')
      .notEmpty()
      .withMessage('Challenge ID cannot be empty'),
  ]),
  submissionsController.getSubmissionsByChallenge.bind(submissionsController)
);

export default router;
