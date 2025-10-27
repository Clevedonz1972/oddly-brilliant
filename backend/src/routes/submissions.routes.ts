import { Router } from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import { submissionsController } from '../controllers/submissions.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
});

/**
 * @route   POST /api/submissions
 * @desc    Create a new draft submission
 * @access  Private (authenticated users with accepted proposals)
 */
router.post(
  '/',
  authenticate,
  validateRequest([
    body('challengeId')
      .isString()
      .withMessage('Challenge ID is required')
      .notEmpty()
      .withMessage('Challenge ID cannot be empty'),
    body('proposalId')
      .optional()
      .isString()
      .withMessage('Proposal ID must be a string'),
    body('title')
      .isString()
      .withMessage('Title is required')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .isString()
      .withMessage('Description is required')
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Description must be between 10 and 5000 characters'),
  ]),
  submissionsController.createSubmission.bind(submissionsController)
);

/**
 * @route   POST /api/submissions/:id/files
 * @desc    Upload file to submission
 * @access  Private (submission owner)
 */
router.post(
  '/:id/files',
  authenticate,
  upload.single('file'),
  validateRequest([
    param('id')
      .isString()
      .withMessage('Submission ID is required')
      .notEmpty()
      .withMessage('Submission ID cannot be empty'),
  ]),
  submissionsController.uploadFile.bind(submissionsController)
);

/**
 * @route   DELETE /api/submissions/:id/files/:fileId
 * @desc    Remove file from submission
 * @access  Private (submission owner)
 */
router.delete(
  '/:id/files/:fileId',
  authenticate,
  validateRequest([
    param('id')
      .isString()
      .withMessage('Submission ID is required')
      .notEmpty()
      .withMessage('Submission ID cannot be empty'),
    param('fileId')
      .isString()
      .withMessage('File ID is required')
      .notEmpty()
      .withMessage('File ID cannot be empty'),
  ]),
  submissionsController.removeFile.bind(submissionsController)
);

/**
 * @route   PUT /api/submissions/:id/submit
 * @desc    Submit submission for review
 * @access  Private (submission owner)
 */
router.put(
  '/:id/submit',
  authenticate,
  validateRequest([
    param('id')
      .isString()
      .withMessage('Submission ID is required')
      .notEmpty()
      .withMessage('Submission ID cannot be empty'),
  ]),
  submissionsController.submitForReview.bind(submissionsController)
);

/**
 * @route   PUT /api/submissions/:id/review
 * @desc    Start review (Project Leader only)
 * @access  Private (Project Leader)
 */
router.put(
  '/:id/review',
  authenticate,
  validateRequest([
    param('id')
      .isString()
      .withMessage('Submission ID is required')
      .notEmpty()
      .withMessage('Submission ID cannot be empty'),
  ]),
  submissionsController.startReview.bind(submissionsController)
);

/**
 * @route   PUT /api/submissions/:id/approve
 * @desc    Approve submission (Project Leader only)
 * @access  Private (Project Leader)
 */
router.put(
  '/:id/approve',
  authenticate,
  validateRequest([
    param('id')
      .isString()
      .withMessage('Submission ID is required')
      .notEmpty()
      .withMessage('Submission ID cannot be empty'),
    body('reviewNotes')
      .optional()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Review notes must be between 1 and 2000 characters'),
  ]),
  submissionsController.approveSubmission.bind(submissionsController)
);

/**
 * @route   PUT /api/submissions/:id/reject
 * @desc    Reject submission (Project Leader only)
 * @access  Private (Project Leader)
 */
router.put(
  '/:id/reject',
  authenticate,
  validateRequest([
    param('id')
      .isString()
      .withMessage('Submission ID is required')
      .notEmpty()
      .withMessage('Submission ID cannot be empty'),
    body('reviewNotes')
      .isString()
      .withMessage('Review notes are required')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Review notes must be between 10 and 2000 characters'),
  ]),
  submissionsController.rejectSubmission.bind(submissionsController)
);

/**
 * @route   PUT /api/submissions/:id/request-revision
 * @desc    Request revision on submission (Project Leader only)
 * @access  Private (Project Leader)
 */
router.put(
  '/:id/request-revision',
  authenticate,
  validateRequest([
    param('id')
      .isString()
      .withMessage('Submission ID is required')
      .notEmpty()
      .withMessage('Submission ID cannot be empty'),
    body('reviewNotes')
      .isString()
      .withMessage('Review notes are required')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Review notes must be between 10 and 2000 characters'),
  ]),
  submissionsController.requestRevision.bind(submissionsController)
);

/**
 * @route   GET /api/submissions/:id
 * @desc    Get submission by ID
 * @access  Private (authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  validateRequest([
    param('id')
      .isString()
      .withMessage('Submission ID is required')
      .notEmpty()
      .withMessage('Submission ID cannot be empty'),
  ]),
  submissionsController.getSubmissionById.bind(submissionsController)
);

/**
 * @route   GET /api/submissions/my
 * @desc    Get all submissions by authenticated user
 * @access  Private (authenticated users)
 */
router.get(
  '/my',
  authenticate,
  submissionsController.getMySubmissions.bind(submissionsController)
);

export default router;
