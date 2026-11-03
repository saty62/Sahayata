import { Request, Response } from 'express';
import { z } from 'zod';
import { Donation } from '../../models/Donation';
import { Campaign } from '../../models/Campaign';
import { Receipt } from '../../models/Receipt';
import { AuthRequest } from '../../middleware/auth';
import { confirmDonationPaymentAtomic } from './donations.service';
import { logger } from '../../utils/logger';

const createDonationSchema = z.object({
  campaignId: z.string().min(1, 'Campaign selection is required'),
  amount: z.number().min(10, 'Minimum donation amount is ₹10'),
  donorName: z.string().min(2, 'Name is required'),
  donorEmail: z.string().email('Valid email is required'),
  donorMobile: z.string().min(10, 'Valid 10-digit mobile number required'),
  donorPan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)')
    .optional()
    .or(z.literal('')),
  donorAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
    })
    .optional(),
  donationType: z.enum(['ONE_TIME', 'MONTHLY_SIMULATED']).default('ONE_TIME'),
  paymentMode: z.enum(['UPI', 'NET_BANKING', 'DEBIT_CARD', 'CREDIT_CARD']).default('UPI'),
  idempotencyKey: z.string().optional(),
  notes: z.string().optional(),
});

export const createDonation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createDonationSchema.parse(req.body);

    const campaign = await Campaign.findById(data.campaignId);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Selected campaign not found' });
      return;
    }

    const idempotencyKey = data.idempotencyKey || `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Check if idempotent donation already created
    const existing = await Donation.findOne({ idempotencyKey });
    if (existing) {
      res.status(200).json({
        success: true,
        message: 'Existing donation retrieved with provided idempotency key',
        data: { donation: existing },
      });
      return;
    }

    const donation = await Donation.create({
      donorId: req.userId || undefined,
      donorName: data.donorName,
      donorEmail: data.donorEmail.toLowerCase(),
      donorMobile: data.donorMobile,
      donorPan: data.donorPan ? data.donorPan.toUpperCase() : undefined,
      donorAddress: data.donorAddress,
      campaignId: campaign._id,
      amount: data.amount,
      paymentMode: data.paymentMode,
      paymentStatus: 'PENDING',
      idempotencyKey,
      donationType: data.donationType,
      isSimulated: true,
      notes: data.notes,
    });

    res.status(201).json({
      success: true,
      message: 'Donation order initiated successfully',
      data: {
        donation,
        campaign: {
          name: campaign.name,
          nameHindi: campaign.nameHindi,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error creating donation:', error);
    res.status(400).json({ success: false, message: error.message || 'Error creating donation' });
  }
};

const mockPaymentSchema = z.object({
  shouldSucceed: z.boolean().default(true),
  paymentMode: z.enum(['UPI', 'NET_BANKING', 'DEBIT_CARD', 'CREDIT_CARD']).optional(),
  transactionRef: z.string().optional(),
  isForeignCard: z.boolean().default(false),
  failureReason: z.string().optional(),
});

export const processMockPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = mockPaymentSchema.parse(req.body || {});

    // Statutory Check: Foreign card contribution block
    if (data.isForeignCard) {
      res.status(400).json({
        success: false,
        isBlocked: true,
        message:
          'विदेशी क्रेडिट/डेबिट कार्ड स्वीकार्य नहीं हैं। statutory compliance (FCRA) के अंतर्गत यह ट्रस्ट केवल भारतीय बैंक खातों एवं कार्ड्स से दान स्वीकार करता है। (Foreign card transactions are strictly not permitted on this platform).',
      });
      return;
    }

    const result = await confirmDonationPaymentAtomic(id, {
      shouldSucceed: data.shouldSucceed,
      paymentMode: data.paymentMode,
      transactionRef: data.transactionRef,
      failureReason: data.failureReason,
    });

    res.status(200).json({
      success: result.donation.paymentStatus === 'COMPLETED',
      duplicate: result.duplicate,
      message: result.message,
      data: {
        donation: result.donation,
        receipt: result.receipt,
      },
    });
  } catch (error: any) {
    logger.error(`Error confirming mock payment for donation ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: error.message || 'Payment confirmation failed' });
  }
};

export const getMyDonations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const donations = await Donation.find({ donorId: req.userId })
      .populate('campaignId', 'name nameHindi')
      .sort({ createdAt: -1 })
      .lean();

    const donationIds = donations.map((d) => d._id);
    const receipts = await Receipt.find({ donationId: { $in: donationIds } }).lean();

    const receiptMap = new Map();
    receipts.forEach((r) => receiptMap.set(r.donationId.toString(), r));

    const enriched = donations.map((d) => ({
      ...d,
      receipt: receiptMap.get(d._id.toString()) || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        donations: enriched,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching donation history' });
  }
};

export const getDonationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const donation = await Donation.findById(id).populate('campaignId', 'name nameHindi');

    if (!donation) {
      res.status(404).json({ success: false, message: 'Donation not found' });
      return;
    }

    // Security ownership check:
    // If donation belongs to a registered donor, require matching authenticated user or admin
    if (donation.donorId && req.userRole !== 'ADMIN') {
      if (!req.userId) {
        res.status(401).json({ success: false, message: 'Authentication required to view this donation record' });
        return;
      }
      if (donation.donorId.toString() !== req.userId) {
        res.status(403).json({ success: false, message: 'Access denied to this donation record' });
        return;
      }
    }

    const receipt = await Receipt.findOne({ donationId: donation._id });

    res.status(200).json({
      success: true,
      data: {
        donation,
        receipt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching donation' });
  }
};
