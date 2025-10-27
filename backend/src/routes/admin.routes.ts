import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { adminController } from '../controllers/admin.controller';
import { proposalsController } from '../controllers/proposals.controller';
import eventsRouter from './admin/events';
import auditorRouter from './admin/auditor';
import safetyRouter from './admin/safety';
import evidenceRouter from './admin/evidence';
import ethicsRouter from './admin/ethics';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

// Admin endpoints
router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/challenges', adminController.getAllChallenges.bind(adminController));
router.get('/proposals', proposalsController.getAllProposals.bind(proposalsController));
router.get('/stats', adminController.getStats.bind(adminController));
router.patch('/users/:id/role', adminController.updateUserRole.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

// Governance endpoints
router.use('/events', eventsRouter);
router.use('/auditor', auditorRouter);

// AI service endpoints
router.use('/safety', safetyRouter);
router.use('/evidence', evidenceRouter);
router.use('/ethics', ethicsRouter);

export default router;
