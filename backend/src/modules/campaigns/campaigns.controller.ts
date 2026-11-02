import { Request, Response } from 'express';
import { Campaign } from '../../models/Campaign';
import { AuthRequest } from '../../middleware/auth';

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
    const { name, nameHindi, slug, description, descriptionHindi, targetAmount, isFeatured } = req.body;

    const campaign = await Campaign.create({
      name,
      nameHindi,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      descriptionHindi,
      targetAmount,
      isFeatured: !!isFeatured,
      collectedAmount: 0,
      status: 'ACTIVE',
    });

    res.status(201).json({ success: true, message: 'Campaign created', data: { campaign } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating campaign' });
  }
};

export const updateCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const campaign = await Campaign.findByIdAndUpdate(id, updates, { new: true });
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Campaign updated', data: { campaign } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating campaign' });
  }
};
