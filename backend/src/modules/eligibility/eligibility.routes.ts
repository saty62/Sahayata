import { Router } from 'express';
import { checkEligibility, parseNaturalQueryAndCheck, requestHelpCallback } from './eligibility.controller';

const router = Router();

router.post('/check', checkEligibility);
router.post('/parse-query', parseNaturalQueryAndCheck);
router.post('/callback', requestHelpCallback);

export default router;
