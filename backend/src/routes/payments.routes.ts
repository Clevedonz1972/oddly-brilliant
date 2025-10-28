import { Router } from 'express';
import { param } from 'express-validator';
import { paymentsController } from '../controllers/payments.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/payments/my
 * @desc    Get all payments for the authenticated user
 * @access  Private
 */
router.get(
  '/my',
  authenticate,
  paymentsController.getMyPayments.bind(paymentsController)
);

/**
 * @route   GET /api/payments/challenge/:challengeId
 * @desc    Get all payments for a specific challenge
 * @access  Private (must be sponsor or contributor)
 */
router.get(
  '/challenge/:challengeId',
  authenticate,
  validateRequest([
    param('challengeId').isUUID().withMessage('Invalid challenge ID'),
  ]),
  paymentsController.getPaymentsByChallenge.bind(paymentsController)
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get single payment by ID
 * @access  Private (must be recipient)
 */
router.get(
  '/:id',
  authenticate,
  validateRequest([
    param('id').isUUID().withMessage('Invalid payment ID'),
  ]),
  paymentsController.getPaymentById.bind(paymentsController)
);

export default router;
