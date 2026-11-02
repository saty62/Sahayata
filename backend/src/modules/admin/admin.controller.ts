import { Request, Response } from 'express';
import { Donation } from '../../models/Donation';
import { Receipt } from '../../models/Receipt';
import { Campaign } from '../../models/Campaign';
import { Scheme } from '../../models/Scheme';
import { User } from '../../models/User';
import { AuditLog } from '../../models/AuditLog';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export const getAdminDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalDonationsAggregation,
      totalDonorsCount,
      totalCampaignsCount,
      totalReceiptsCount,
      pendingPdfJobsCount,
      publishedSchemesCount,
      pendingSchemeApprovalsCount,
      recentDonations,
      campaigns,
    ] = await Promise.all([
      // Total amount donated (completed only)
      Donation.aggregate([
        { $match: { paymentStatus: 'COMPLETED' } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Unique donors
      Donation.distinct('donorEmail', { paymentStatus: 'COMPLETED' }),
      // Campaigns
      Campaign.countDocuments(),
      // Receipts generated
      Receipt.countDocuments({ generationStatus: 'COMPLETED' }),
      // Pending PDF jobs
      Receipt.countDocuments({ generationStatus: { $in: ['PENDING', 'PROCESSING'] } }),
      // Published schemes
      Scheme.countDocuments({ published: true }),
      // Pending scheme approvals
      Scheme.countDocuments({ summaryStatus: 'DRAFT' }),
      // Recent donations (top 8)
      Donation.find()
        .populate('campaignId', 'name nameHindi')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      // Campaign progress
      Campaign.find().select('name nameHindi targetAmount collectedAmount status').lean(),
    ]);

    const totalCollected = totalDonationsAggregation[0]?.totalAmount || 0;
    const totalTransactions = totalDonationsAggregation[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        isDemoData: true,
        summary: {
          totalCollectedAmount: totalCollected,
          totalTransactions,
          totalDonors: totalDonorsCount.length,
          totalCampaigns: totalCampaignsCount,
          totalReceiptsGenerated: totalReceiptsCount,
          pendingPdfJobs: pendingPdfJobsCount,
          publishedSchemes: publishedSchemesCount,
          pendingSchemeApprovals: pendingSchemeApprovalsCount,
        },
        recentDonations,
        campaignPerformance: campaigns.map((c) => ({
          ...c,
          percentAchieved: c.targetAmount > 0 ? Math.min(100, Math.round((c.collectedAmount / c.targetAmount) * 100)) : 0,
        })),
        trustDetails: {
          name: config.trust.name,
          pan: config.trust.pan,
          eightyGNumber: config.trust.eightyGNumber,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching admin dashboard metrics:', error);
    res.status(500).json({ success: false, message: error.message || 'Error loading dashboard metrics' });
  }
};

export const getAdminDonations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, campaignId, search, page = '1', limit = '15' } = req.query;

    const query: any = {};
    if (status && status !== 'ALL') {
      query.paymentStatus = status;
    }
    if (campaignId && campaignId !== 'ALL') {
      query.campaignId = campaignId;
    }
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      query.$or = [
        { donorName: new RegExp(term, 'i') },
        { donorEmail: new RegExp(term, 'i') },
        { donorPan: new RegExp(term, 'i') },
        { transactionReference: new RegExp(term, 'i') },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate('campaignId', 'name nameHindi')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Donation.countDocuments(query),
    ]);

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
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching donations' });
  }
};

export const exportForm10BDCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const { financialYear } = req.query;

    const query: any = { paymentStatus: 'COMPLETED' };

    const donations = await Donation.find(query)
      .populate('campaignId', 'name')
      .sort({ createdAt: 1 })
      .lean();

    const donationIds = donations.map((d) => d._id);
    const receipts = await Receipt.find({ donationId: { $in: donationIds } }).lean();
    const receiptMap = new Map();
    receipts.forEach((r) => receiptMap.set(r.donationId.toString(), r));

    // Form 10BD Standard CSV Headers (Income Tax Department prescribed format)
    const headers = [
      'Sl No',
      'Section Code',
      'Unique Identification Number of the Donor',
      'ID Type',
      'Name of Donor',
      'Address of Donor',
      'Donation Type',
      'Mode of Receipt',
      'Amount of Donation (INR)',
      'Certificate Number',
      'Receipt Number',
      'Date of Donation',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = donations.map((donation, index) => {
      const receipt = receiptMap.get(donation._id.toString());
      const hasPan = !!donation.donorPan;
      const idType = hasPan ? 'Permanent Account Number (PAN)' : 'Form 60 / Aadhaar';
      const donorIdVal = donation.donorPan || 'APPLIED_FOR';
      const address = donation.donorAddress
        ? `${donation.donorAddress.street || ''} ${donation.donorAddress.city || ''} ${donation.donorAddress.state || ''} ${donation.donorAddress.pincode || ''}`.trim()
        : 'Madhya Pradesh, India';

      return [
        index + 1,
        'Section 80G',
        donorIdVal,
        idType,
        donation.donorName,
        address,
        'Specific Grant',
        donation.paymentMode || 'Electronic',
        donation.amount,
        receipt?.certificateNumber || 'PENDING',
        receipt?.receiptNumber || 'PENDING',
        new Date(donation.createdAt).toISOString().split('T')[0],
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');

    const fileName = `Form10BD_Donations_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send('\uFEFF' + csvContent); // BOM for Excel UTF-8 compliance
  } catch (error: any) {
    logger.error('Error generating Form 10BD CSV:', error);
    res.status(500).json({ success: false, message: error.message || 'Error exporting Form 10BD CSV' });
  }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ success: true, data: { logs } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching audit logs' });
  }
};
