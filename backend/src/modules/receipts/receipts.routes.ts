import { Router } from 'express';
import {
  getMyReceipts,
  getReceiptById,
  downloadReceiptPdf,
  downloadCertificatePdf,
  retryPdfGeneration,
} from './receipts.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';

const router = Router();

router.get('/my', authenticate, getMyReceipts);
router.get('/:id', optionalAuthenticate, getReceiptById);
router.get('/:id/download', optionalAuthenticate, downloadReceiptPdf);
router.get('/:id/certificate', optionalAuthenticate, downloadCertificatePdf);
router.post('/:id/retry', authenticate, retryPdfGeneration);

export default router;
