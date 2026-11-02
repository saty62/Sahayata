import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Receipt } from '../../models/Receipt';
import { Donation } from '../../models/Donation';
import { AuthRequest } from '../../middleware/auth';
import { config } from '../../config';
import { enqueuePdfGeneration } from '../../queues/pdfQueue';
import { processPdfJob } from '../../workers/pdfWorker';
import { logger } from '../../utils/logger';

export const getMyReceipts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const receipts = await Receipt.find({ donorId: req.userId })
      .populate('donationId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { receipts } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching receipts' });
  }
};

export const getReceiptById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const receipt = await Receipt.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { receiptNumber: id },
        { donationId: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    }).populate('donationId');

    if (!receipt) {
      res.status(404).json({ success: false, message: 'Receipt not found' });
      return;
    }

    // Ownership check
    if (receipt.donorId && req.userId && req.userRole !== 'ADMIN') {
      if (receipt.donorId.toString() !== req.userId) {
        res.status(403).json({ success: false, message: 'Unauthorized to view this receipt' });
        return;
      }
    }

    res.status(200).json({ success: true, data: { receipt } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching receipt' });
  }
};

export const downloadReceiptPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { receiptNumber: id },
      ],
    });

    if (!receipt) {
      res.status(404).json({ success: false, message: 'Receipt not found' });
      return;
    }

    const fileName = `Receipt_${receipt.receiptNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = path.join(config.pdf.storagePath, fileName);

    // If PDF not generated yet, generate synchronously now
    if (!fs.existsSync(filePath)) {
      logger.info(`Receipt PDF not found on disk for ${receipt.receiptNumber}. Triggering direct generation.`);
      await processPdfJob({
        receiptId: receipt._id.toString(),
        donationId: receipt.donationId.toString(),
      });
    }

    if (!fs.existsSync(filePath)) {
      res.status(503).json({
        success: false,
        message: 'Receipt PDF is still being generated. Please check back in a few moments.',
      });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error: any) {
    logger.error('Error downloading receipt PDF:', error);
    res.status(500).json({ success: false, message: error.message || 'Error downloading PDF' });
  }
};

export const downloadCertificatePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { certificateNumber: id },
        { receiptNumber: id },
      ],
    });

    if (!receipt) {
      res.status(404).json({ success: false, message: '80G Certificate not found' });
      return;
    }

    const fileName = `Certificate80G_${receipt.certificateNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = path.join(config.pdf.storagePath, fileName);

    if (!fs.existsSync(filePath)) {
      logger.info(`80G Certificate PDF not found on disk for ${receipt.certificateNumber}. Triggering direct generation.`);
      await processPdfJob({
        receiptId: receipt._id.toString(),
        donationId: receipt.donationId.toString(),
      });
    }

    if (!fs.existsSync(filePath)) {
      res.status(503).json({
        success: false,
        message: '80G Certificate PDF is currently being prepared. Please retry shortly.',
      });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error: any) {
    logger.error('Error downloading 80G Certificate PDF:', error);
    res.status(500).json({ success: false, message: error.message || 'Error downloading certificate' });
  }
};

export const retryPdfGeneration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      res.status(404).json({ success: false, message: 'Receipt not found' });
      return;
    }

    receipt.generationStatus = 'PENDING';
    receipt.errorMessage = undefined;
    await receipt.save();

    await enqueuePdfGeneration({
      receiptId: receipt._id.toString(),
      donationId: receipt.donationId.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'PDF generation job re-queued successfully',
      data: { receipt },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to retry PDF generation' });
  }
};
