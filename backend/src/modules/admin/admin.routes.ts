import { Router } from 'express';
import {
  getAdminDashboardMetrics,
  getAdminDonations,
  getAdminReports,
  exportForm10BDCsv,
  getAuditLogs,
} from './admin.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';

const router = Router();

// All admin routes strictly require authentication & ADMIN role
router.use(authenticate, requireAdmin);

router.get('/dashboard', getAdminDashboardMetrics);
router.get('/donations', getAdminDonations);
router.get('/reports', getAdminReports);
router.get('/reports/form-10bd/export', exportForm10BDCsv);
router.get('/audit-logs', getAuditLogs);

export default router;
