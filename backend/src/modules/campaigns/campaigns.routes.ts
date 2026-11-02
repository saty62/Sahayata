import { Router } from 'express';
import { getCampaigns, getCampaignById, createCampaign, updateCampaign } from './campaigns.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';

const router = Router();

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/', authenticate, requireAdmin, createCampaign);
router.put('/:id', authenticate, requireAdmin, updateCampaign);

export default router;
