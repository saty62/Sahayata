import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { Receipt } from '../models/Receipt';
import { Donation } from '../models/Donation';
import { Campaign } from '../models/Campaign';
import { generateDonationReceiptPdf, generate80GCertificatePdf } from '../utils/pdfGenerator';
import { logger } from '../utils/logger';

export interface PdfJobPayload {
  receiptId: string;
  donationId: string;
}

/**
 * Worker processor function (used by both BullMQ Worker and Memory Queue)
 */
export async function processPdfJob(data: PdfJobPayload): Promise<void> {
  const { receiptId, donationId } = data;

  const receipt = await Receipt.findById(receiptId);
  if (!receipt) {
    logger.error(`Receipt ${receiptId} not found for PDF generation.`);
    return;
  }

  // Idempotency: If already completed and files exist, skip
  if (receipt.generationStatus === 'COMPLETED' && receipt.receiptPdfUrl && receipt.certificatePdfUrl) {
    logger.info(`PDFs for receipt ${receipt.receiptNumber} already completed. Skipping.`);
    return;
  }

  const donation = await Donation.findById(donationId).populate('campaignId');
  if (!donation) {
    logger.error(`Donation ${donationId} not found for PDF generation.`);
    receipt.generationStatus = 'FAILED';
    receipt.errorMessage = 'Associated donation record missing';
    await receipt.save();
    return;
  }

  const campaign = donation.campaignId as any;
  const campaignName = campaign?.name || 'General Women Welfare Fund';

  try {
    receipt.generationStatus = 'PROCESSING';
    await receipt.save();

    const pdfData = {
      receiptNumber: receipt.receiptNumber,
      certificateNumber: receipt.certificateNumber,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      donorMobile: donation.donorMobile,
      donorPAN: donation.donorPan,
      donorAddress: donation.donorAddress ? `${donation.donorAddress.street || ''}, ${donation.donorAddress.city || ''}, ${donation.donorAddress.state || ''} ${donation.donorAddress.pincode || ''}`.trim() : undefined,
      campaignName,
      amount: donation.amount,
      paymentMode: donation.paymentMode,
      transactionReference: donation.transactionReference,
      donationDate: donation.createdAt,
      donationType: donation.donationType,
    };

    // Generate both documents concurrently
    const [receiptPath, certPath] = await Promise.all([
      generateDonationReceiptPdf(pdfData),
      generate80GCertificatePdf(pdfData),
    ]);

    receipt.receiptPdfUrl = `/api/receipts/${receipt._id}/download`;
    receipt.certificatePdfUrl = `/api/receipts/${receipt._id}/certificate`;
    receipt.generationStatus = 'COMPLETED';
    receipt.errorMessage = undefined;
    await receipt.save();

    logger.info(`Successfully generated PDFs for receipt ${receipt.receiptNumber}`);
  } catch (err: any) {
    logger.error(`Failed generating PDFs for receipt ${receipt.receiptNumber}:`, err);
    receipt.retryCount = (receipt.retryCount || 0) + 1;
    receipt.generationStatus = 'FAILED';
    receipt.errorMessage = err.message || 'PDF Generation failed';
    await receipt.save();
    throw err;
  }
}

/**
 * Initializes BullMQ worker if Redis is enabled
 */
export function startBullMqWorker(): Worker<PdfJobPayload> | null {
  if (!config.redis.enabled) {
    logger.info('Redis not enabled. Running local resilient in-memory PDF worker.');
    return null;
  }

  try {
    const connection = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    const worker = new Worker<PdfJobPayload>(
      'pdf-generation',
      async (job: Job<PdfJobPayload>) => {
        logger.info(`[BullMQ Worker] Processing Job ${job.id} for receipt: ${job.data.receiptId}`);
        await processPdfJob(job.data);
      },
      {
        connection,
        concurrency: 5, // controlled worker concurrency limit
      }
    );

    worker.on('completed', (job) => {
      logger.info(`[BullMQ Worker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err.message);
    });

    logger.info('BullMQ PDF Worker started successfully');
    return worker;
  } catch (err: any) {
    logger.warn('Failed to start BullMQ Worker:', err.message);
    return null;
  }
}
