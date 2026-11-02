import { Router } from 'express';
import {
  getSchemes,
  getSchemeById,
  createScheme,
  updateScheme,
  deleteScheme,
  generateSummaryForScheme,
  approveAiSummary,
  publishScheme,
} from './schemes.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';

const router = Router();

// Public routes
router.get('/', getSchemes);
router.get('/:id', getSchemeById);

// Admin-protected CMS routes
router.post('/', authenticate, requireAdmin, createScheme);
router.put('/:id', authenticate, requireAdmin, updateScheme);
router.delete('/:id', authenticate, requireAdmin, deleteScheme);
router.post('/:id/generate-summary', authenticate, requireAdmin, generateSummaryForScheme);
router.post('/:id/approve', authenticate, requireAdmin, approveAiSummary);
router.post('/:id/publish', authenticate, requireAdmin, publishScheme);

export default router;
