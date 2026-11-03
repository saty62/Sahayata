import { Request, Response } from 'express';
import { Scheme, IScheme } from '../../models/Scheme';
import { AuditLog } from '../../models/AuditLog';
import { AuthRequest } from '../../middleware/auth';
import { generateHindiSchemeSummary } from '../ai/groqService';
import { logger } from '../../utils/logger';

export const getSchemes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, district, search, published, page = '1', limit = '12' } = req.query;

    const query: any = {};

    // Filter published status
    if (published !== undefined) {
      query.published = published === 'true';
    } else {
      // By default public API returns published schemes
      query.published = true;
    }

    // Filter category
    if (category && category !== 'all' && category !== 'सभी') {
      query.category = category;
    }

    const andConditions: any[] = [];

    // Filter district
    if (district && district !== 'all' && district !== 'सभी') {
      andConditions.push({
        $or: [
          { districts: district },
          { districts: 'ALL' },
          { districts: { $size: 0 } },
        ],
      });
    }

    // Search keyword
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i');
      andConditions.push({
        $or: [
          { titleHindi: searchRegex },
          { titleEnglish: searchRegex },
          { schemeId: searchRegex },
          { benefits: searchRegex },
        ],
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [schemes, total] = await Promise.all([
      Scheme.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Scheme.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        schemes,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching schemes:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching schemes' });
  }
};

export const getSchemeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const scheme = await Scheme.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { schemeId: id.toUpperCase() }],
    });

    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scheme not found' });
      return;
    }

    res.status(200).json({ success: true, data: { scheme } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching scheme details' });
  }
};

export const createScheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      schemeId,
      titleHindi,
      titleEnglish,
      category,
      districts = ['ALL'],
      eligibilityRules = {},
      benefits = [],
      documents = [],
      applicationSteps = [],
      officialSourceUrl,
      officialNoticeText = '',
      helpCentres = [],
    } = req.body;

    const existing = await Scheme.findOne({ schemeId: schemeId.toUpperCase() });
    if (existing) {
      res.status(409).json({ success: false, message: `Scheme ID ${schemeId} already exists.` });
      return;
    }

    const scheme = await Scheme.create({
      schemeId: schemeId.toUpperCase(),
      titleHindi,
      titleEnglish,
      category,
      districts,
      eligibilityRules,
      benefits,
      documents,
      applicationSteps,
      officialSourceUrl,
      officialNoticeText,
      summaryStatus: 'NONE',
      published: false,
      isSampleData: false,
      lastCheckedAt: new Date(),
      createdBy: req.userId,
      helpCentres,
    });

    await AuditLog.create({
      userId: req.userId,
      action: 'SCHEME_CREATE',
      entityType: 'Scheme',
      entityId: scheme._id.toString(),
      details: { schemeId: scheme.schemeId, title: scheme.titleEnglish },
    });

    res.status(201).json({ success: true, message: 'Scheme created as draft', data: { scheme } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating scheme' });
  }
};

export const updateScheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const scheme = await Scheme.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { schemeId: id.toUpperCase() }],
    });

    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scheme not found' });
      return;
    }

    Object.assign(scheme, updates);
    scheme.lastCheckedAt = new Date();
    await scheme.save();

    await AuditLog.create({
      userId: req.userId,
      action: 'SCHEME_UPDATE',
      entityType: 'Scheme',
      entityId: scheme._id.toString(),
      details: { schemeId: scheme.schemeId },
    });

    res.status(200).json({ success: true, message: 'Scheme updated successfully', data: { scheme } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating scheme' });
  }
};

export const deleteScheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const scheme = await Scheme.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { schemeId: id.toUpperCase() }],
    });

    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scheme not found' });
      return;
    }

    await scheme.deleteOne();

    await AuditLog.create({
      userId: req.userId,
      action: 'SCHEME_DELETE',
      entityType: 'Scheme',
      entityId: scheme._id.toString(),
      details: { schemeId: scheme.schemeId },
    });

    res.status(200).json({ success: true, message: 'Scheme deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting scheme' });
  }
};

export const generateSummaryForScheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { noticeText } = req.body;

    const scheme = await Scheme.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { schemeId: id.toUpperCase() }],
    });

    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scheme not found' });
      return;
    }

    const textToSummarize = noticeText || scheme.officialNoticeText;
    if (!textToSummarize || textToSummarize.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Official notice text is required to generate AI summary',
      });
      return;
    }

    // Call Groq AI
    const aiSummary = await generateHindiSchemeSummary(textToSummarize, scheme.titleHindi);

    scheme.aiSummaryDraft = {
      ...aiSummary,
      generatedAt: new Date(),
      modelUsed: 'llama-3.3-70b-versatile',
    };
    scheme.summaryStatus = 'DRAFT'; // Always begins in draft status!
    if (noticeText) {
      scheme.officialNoticeText = noticeText;
    }
    await scheme.save();

    await AuditLog.create({
      userId: req.userId,
      action: 'AI_SUMMARY_GENERATE',
      entityType: 'Scheme',
      entityId: scheme._id.toString(),
      details: { schemeId: scheme.schemeId },
    });

    res.status(200).json({
      success: true,
      message: 'AI summary draft generated successfully. Please review and approve before publishing.',
      data: {
        scheme,
        aiSummaryDraft: scheme.aiSummaryDraft,
      },
    });
  } catch (error: any) {
    logger.error('Failed to generate AI summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate summary with AI',
    });
  }
};

export const approveAiSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { editedSummary, approve = true } = req.body;

    const scheme = await Scheme.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { schemeId: id.toUpperCase() }],
    });

    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scheme not found' });
      return;
    }

    if (approve) {
      if (editedSummary) {
        scheme.aiSummaryDraft = {
          ...scheme.aiSummaryDraft,
          ...editedSummary,
        };
        // Update main fields with reviewed content
        if (editedSummary.benefits && Array.isArray(editedSummary.benefits)) {
          scheme.benefits = editedSummary.benefits;
        }
        if (editedSummary.requiredDocuments && Array.isArray(editedSummary.requiredDocuments)) {
          scheme.documents = editedSummary.requiredDocuments;
        }
        if (editedSummary.applicationSteps && Array.isArray(editedSummary.applicationSteps)) {
          scheme.applicationSteps = editedSummary.applicationSteps;
        }
      }
      scheme.summaryStatus = 'APPROVED';
      scheme.approvedBy = req.userId as any;
    } else {
      scheme.summaryStatus = 'REJECTED';
    }

    await scheme.save();

    await AuditLog.create({
      userId: req.userId,
      action: approve ? 'AI_SUMMARY_APPROVE' : 'AI_SUMMARY_REJECT',
      entityType: 'Scheme',
      entityId: scheme._id.toString(),
      details: { schemeId: scheme.schemeId, approved: approve },
    });

    res.status(200).json({
      success: true,
      message: approve ? 'Summary approved successfully.' : 'Summary draft rejected.',
      data: { scheme },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error processing approval' });
  }
};

export const publishScheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { published = true } = req.body;

    const scheme = await Scheme.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { schemeId: id.toUpperCase() }],
    });

    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scheme not found' });
      return;
    }

    scheme.published = published;
    await scheme.save();

    await AuditLog.create({
      userId: req.userId,
      action: published ? 'SCHEME_PUBLISH' : 'SCHEME_UNPUBLISH',
      entityType: 'Scheme',
      entityId: scheme._id.toString(),
      details: { schemeId: scheme.schemeId, published },
    });

    res.status(200).json({
      success: true,
      message: published ? 'Scheme published to public homepage.' : 'Scheme unpublished.',
      data: { scheme },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error publishing scheme' });
  }
};
