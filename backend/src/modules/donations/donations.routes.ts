import { Router } from 'express';
import {
  createDonation,
  processMockPayment,
  getMyDonations,
  getDonationById,
} from './donations.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';

const router = Router();

// Guest or logged in donors can create donations
router.post('/', optionalAuthenticate, createDonation);
router.post('/:id/mock-payment', optionalAuthenticate, processMockPayment);

// Donor history
router.get('/my', authenticate, getMyDonations);
router.get('/:id', optionalAuthenticate, getDonationById);

export default router;
