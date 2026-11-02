import { Request, Response } from 'express';
import { z } from 'zod';
import { findMatchingSchemes, UserEligibilityFacts } from './eligibility.engine';
import { extractFactsFromHindiQuery } from '../ai/groqService';
import { config } from '../../config';
import { logger } from '../../utils/logger';

const checkEligibilitySchema = z.object({
  age: z.number().min(0).max(120).optional(),
  district: z.string().optional(),
  isWidow: z.boolean().optional(),
  isBpl: z.boolean().optional(),
  isShgMember: z.boolean().optional(),
  isPregnantFirstChild: z.boolean().optional(),
  annualIncome: z.number().optional(),
});

export const checkEligibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const facts: UserEligibilityFacts = checkEligibilitySchema.parse(req.body);
    const results = await findMatchingSchemes(facts);

    res.status(200).json({
      success: true,
      message: 'Eligibility evaluation completed',
      data: {
        ...results,
        helpline: {
          phone: config.trust.helpline,
          availableHours: 'सोमवार - शनिवार, प्रातः 9:00 से सायं 6:00 बजे तक',
          callToActionHindi: 'यदि आपको आवेदन करने में सहायता चाहिए, तो हमारे निःशुल्क हेल्पलाइन पर संपर्क करें।',
        },
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error processing eligibility evaluation',
    });
  }
};

export const parseNaturalQueryAndCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Please provide a question or sentence describing your situation',
      });
      return;
    }

    // 1. Extract facts using Groq AI
    const extracted = await extractFactsFromHindiQuery(query);

    // 2. Prepare facts for deterministic engine
    const facts: UserEligibilityFacts = {
      age: extracted.age ?? undefined,
      district: extracted.district ?? undefined,
      isWidow: extracted.isWidow ?? undefined,
      isBpl: extracted.isBpl ?? undefined,
      isShgMember: extracted.isShgMember ?? undefined,
      isPregnantFirstChild: extracted.isPregnantFirstChild ?? undefined,
      annualIncome: extracted.annualIncome ?? undefined,
    };

    // 3. Run deterministic engine
    const results = await findMatchingSchemes(facts);

    res.status(200).json({
      success: true,
      data: {
        extractedFacts: extracted,
        ...results,
        helpline: {
          phone: config.trust.helpline,
          callToActionHindi: 'अधिक जानकारी के लिए निःशुल्क सहायता कॉल प्राप्त करें।',
        },
      },
    });
  } catch (error: any) {
    logger.error('Natural language eligibility parse error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze inquiry',
    });
  }
};

export const requestHelpCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, mobile, district, schemeId, notes } = req.body;

    if (!name || !mobile) {
      res.status(400).json({
        success: false,
        message: 'Name and mobile number are required for a callback request',
      });
      return;
    }

    logger.info(`Helpline callback requested for ${name} (${mobile}) for scheme ${schemeId || 'General'}`);

    res.status(200).json({
      success: true,
      message: 'आपकी सहायता कॉल का अनुरोध दर्ज कर लिया गया है। हमारे प्रतिनिधि 24 घंटे के भीतर आपसे संपर्क करेंगे।',
      data: {
        ticketNumber: `HLP-${Date.now().toString().slice(-6)}`,
        estimatedCallbackTime: '24 घंटे के भीतर',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Callback request failed' });
  }
};
