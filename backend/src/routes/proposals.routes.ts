import { Router } from 'express';
import { body, param } from 'express-validator';
import { proposalsController } from '../controllers/proposals.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/proposals
 * @desc    Create a new proposal
 * @access  Private (authenticated users)
 */
router.post(
  '/',
  authenticate,
  validateRequest([
    body('challengeId')
      .isUUID()
      .withMessage('Challenge ID must be a valid UUID'),
    body('message')
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
  ]),
  proposalsController.createProposal.bind(proposalsController)
);

/**
 * @route   GET /api/proposals/my
 * @desc    Get all proposals by authenticated user
 * @access  Private (authenticated users)
 */
router.get(
  '/my',
  authenticate,
  proposalsController.getMyProposals.bind(proposalsController)
);

/**
 * @route   GET /api/proposals/:id
 * @desc    Get proposal by ID
 * @access  Private (authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  validateRequest([
    param('id').isUUID().withMessage('Proposal ID must be a valid UUID'),
  ]),
  proposalsController.getProposalById.bind(proposalsController)
);

/**
 * @route   PUT /api/proposals/:id/respond
 * @desc    Accept or reject a proposal (Project Leader only)
 * @access  Private (Project Leader)
 */
router.put(
  '/:id/respond',
  authenticate,
  validateRequest([
    param('id').isUUID().withMessage('Proposal ID must be a valid UUID'),
    body('action')
      .isIn(['ACCEPT', 'REJECT'])
      .withMessage('Action must be ACCEPT or REJECT'),
    body('responseMessage')
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Response message must be between 1 and 1000 characters'),
  ]),
  proposalsController.respondToProposal.bind(proposalsController)
);

/**
 * @route   PUT /api/proposals/:id/withdraw
 * @desc    Withdraw a proposal (contributor only)
 * @access  Private (contributor)
 */
router.put(
  '/:id/withdraw',
  authenticate,
  validateRequest([
    param('id').isUUID().withMessage('Proposal ID must be a valid UUID'),
  ]),
  proposalsController.withdrawProposal.bind(proposalsController)
);

export default router;
