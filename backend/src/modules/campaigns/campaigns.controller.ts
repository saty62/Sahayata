import { Request, Response } from 'express';
import { z } from 'zod';
import { Campaign } from '../../models/Campaign';
import { AuthRequest } from '../../middleware/auth';

const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters'),
  nameHindi: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  descriptionHindi: z.string().optional(),
  targetAmount: z.number().min(100, 'Target amount must be at least ₹100'),
  isFeatured: z.boolean().optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(2).optional(),
  nameHindi: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  descriptionHindi: z.string().optional(),
  targetAmount: z.number().min(100).optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED']).optional(),
});

export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'ACTIVE' } = req.query;
    const query: any = {};
    if (status !== 'ALL') {
      query.status = status;
    }

    const campaigns = await Campaign.find(query).sort({ isFeatured: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { campaigns },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching campaigns' });
  }
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id.toLowerCase() }],
    });

    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    res.status(200).json({ success: true, data: { campaign } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching campaign' });
  }
};

export const createCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createCampaignSchema.parse(req.body);

    const campaign = await Campaign.create({
      name: validated.name,
      nameHindi: validated.nameHindi,
      slug: validated.slug || validated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: validated.description,
      descriptionHindi: validated.descriptionHindi,
      targetAmount: validated.targetAmount,
      isFeatured: !!validated.isFeatured,
      collectedAmount: 0,
      status: 'ACTIVE',
    });

    res.status(201).json({ success: true, message: 'Campaign created', data: { campaign } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error creating campaign' });
  }
};

export const updateCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = updateCampaignSchema.parse(req.body);

    const campaign = await Campaign.findByIdAndUpdate(id, validated, { new: true });
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Campaign updated', data: { campaign } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error updating campaign' });
  }
};
