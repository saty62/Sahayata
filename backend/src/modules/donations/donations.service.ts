import mongoose from 'mongoose';
import { Donation, IDonation } from '../../models/Donation';
import { Receipt, IReceipt } from '../../models/Receipt';
import { ReceiptCounter } from '../../models/ReceiptCounter';
import { Campaign } from '../../models/Campaign';
import { AuditLog } from '../../models/AuditLog';
import { config } from '../../config';
import { getFinancialYearCounterKey, getFinancialYearString } from '../../utils/financialYear';
import { enqueuePdfGeneration } from '../../queues/pdfQueue';
import { logger } from '../../utils/logger';

export interface PaymentConfirmationResult {
  donation: IDonation;
  receipt?: IReceipt;
  duplicate: boolean;
  message: string;
}

/**
 * Concurrency-Safe, Transactional Payment Confirmation & Atomic Receipt Numbering
 * - Concurrency Safe: Uses atomic MongoDB findOneAndUpdate with $inc for receipt sequence
 * - Transactionally consistent: Donation status, Receipt record, and AuditLog
 * - Idempotent: Subsequent calls with same donationId or idempotencyKey return existing receipt
 */
export async function confirmDonationPaymentAtomic(
  donationId: string,
  paymentPayload: {
    shouldSucceed: boolean;
    paymentMode?: 'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD';
    transactionRef?: string;
    failureReason?: string;
  }
): Promise<PaymentConfirmationResult> {
  // 1. Initial Idempotency Check: if already completed, return existing receipt immediately
  const initialCheck = await Donation.findById(donationId);
  if (!initialCheck) {
    throw new Error('Donation record not found');
  }

  if (initialCheck.paymentStatus === 'COMPLETED') {
    const existingReceipt = await Receipt.findOne({ donationId: initialCheck._id });
    return {
      donation: initialCheck,
      receipt: existingReceipt || undefined,
      duplicate: true,
      message: 'Payment was already confirmed previously. Returned existing receipt.',
    };
  }

  // 2. Handle simulated failure
  if (!paymentPayload.shouldSucceed) {
    initialCheck.paymentStatus = 'FAILED';
    initialCheck.failureReason = paymentPayload.failureReason || 'Simulated payment failure chosen in test checkout';
    await initialCheck.save();
    return {
      donation: initialCheck,
      duplicate: false,
      message: 'Payment simulation resulted in failure as requested.',
    };
  }

  // 3. Concurrency-Safe Atomic Sequence Allocation via MongoDB findOneAndUpdate with $inc
  // Single document $inc is guaranteed atomic and race-condition free in MongoDB
  const date = new Date();
  const fyKey = getFinancialYearCounterKey(date);
  const fyDisplay = getFinancialYearString(date);

  const counter = await ReceiptCounter.findOneAndUpdate(
    { _id: fyKey },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.sequence).padStart(6, '0');
  const receiptNumber = `AC/${fyDisplay}/${seqStr}`;
  const certificateNumber = `80G/${fyDisplay}/${seqStr}`;

  // 4. Execute transactional commit for Donation + Receipt + AuditLog
  const session = await mongoose.startSession();

  try {
    let finalResult: PaymentConfirmationResult | null = null;

    await session.withTransaction(async () => {
      // Double-check inside transaction for idempotency
      const donation = await Donation.findById(donationId).session(session);
      if (!donation) {
        throw new Error('Donation record not found');
      }

      if (donation.paymentStatus === 'COMPLETED') {
        const existingReceipt = await Receipt.findOne({ donationId: donation._id }).session(session);
        finalResult = {
          donation,
          receipt: existingReceipt || undefined,
          duplicate: true,
          message: 'Payment was already confirmed previously.',
        };
        return;
      }

      // Update Donation to COMPLETED
      donation.paymentStatus = 'COMPLETED';
      donation.paymentMode = paymentPayload.paymentMode || donation.paymentMode || 'UPI';
      donation.transactionReference =
        paymentPayload.transactionRef || `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await donation.save({ session });

      // Create Receipt record
      const fullAddress = donation.donorAddress
        ? `${donation.donorAddress.street || ''}, ${donation.donorAddress.city || ''}, ${donation.donorAddress.state || ''} ${donation.donorAddress.pincode || ''}`.trim()
        : '';

      const [receipt] = await Receipt.create(
        [
          {
            donationId: donation._id,
            donorId: donation.donorId || undefined,
            receiptNumber,
            certificateNumber,
            donorPAN: donation.donorPan,
            donorName: donation.donorName,
            donorAddress: fullAddress,
            amount: donation.amount,
            donationDate: date,
            trustPAN: config.trust.pan,
            trust80GNumber: config.trust.eightyGNumber,
            generationStatus: 'PENDING',
            retryCount: 0,
          },
        ],
        { session }
      );

      // Audit Log
      await AuditLog.create(
        [
          {
            userId: donation.donorId || undefined,
            action: 'PAYMENT_CONFIRMED',
            entityType: 'Donation',
            entityId: donation._id.toString(),
            details: {
              receiptNumber,
              amount: donation.amount,
              paymentMode: donation.paymentMode,
            },
          },
        ],
        { session }
      );

      finalResult = {
        donation,
        receipt,
        duplicate: false,
        message: 'Payment confirmed and receipt allocated successfully.',
      };
    });

    if (finalResult) {
      // Update Campaign collectedAmount atomically via $inc without holding cross-transaction locks
      Campaign.findByIdAndUpdate(
        (finalResult as PaymentConfirmationResult).donation.campaignId,
        { $inc: { collectedAmount: (finalResult as PaymentConfirmationResult).donation.amount } }
      ).catch((err) => {
        logger.error('Failed updating campaign collected amount:', err);
      });

      // Enqueue background PDF generation
      if ((finalResult as PaymentConfirmationResult).receipt) {
        const r = (finalResult as PaymentConfirmationResult).receipt!;
        enqueuePdfGeneration({
          receiptId: r._id.toString(),
          donationId: donationId,
        }).catch((err) => {
          logger.error(`Error enqueueing PDF generation for ${r._id}:`, err);
        });
      }

      return finalResult;
    }
  } finally {
    session.endSession();
  }

  throw new Error('Transaction confirmation failed');
}
