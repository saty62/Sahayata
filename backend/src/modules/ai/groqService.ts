import { z } from 'zod';
import Groq from 'groq-sdk';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export const AiSummaryOutputSchema = z.object({
  summaryHindi: z.string().min(10, 'Summary in Hindi must be meaningful and clear'),
  whoCanApply: z.array(z.string()).min(1, 'At least one eligibility criterion required'),
  benefits: z.array(z.string()).min(1, 'At least one benefit must be stated'),
  requiredDocuments: z.array(z.string()),
  applicationSteps: z.array(z.string()),
  importantConditions: z.array(z.string()),
});

export type AiSummaryOutput = z.infer<typeof AiSummaryOutputSchema>;

export const ExtractedFactsSchema = z.object({
  age: z.number().nullable().optional(),
  district: z.string().nullable().optional(),
  isWidow: z.boolean().nullable().optional(),
  isBpl: z.boolean().nullable().optional(),
  isShgMember: z.boolean().nullable().optional(),
  isPregnantFirstChild: z.boolean().nullable().optional(),
  annualIncome: z.number().nullable().optional(),
  ambiguousConditions: z.array(z.string()).default([]),
  followUpQuestionsHindi: z.array(z.string()).default([]),
});

export type ExtractedFacts = z.infer<typeof ExtractedFactsSchema>;

let groqClient: Groq | null = null;
if (config.groq.apiKey) {
  try {
    groqClient = new Groq({ apiKey: config.groq.apiKey });
  } catch (err) {
    logger.warn('Failed to initialize Groq client:', err);
  }
}

/**
 * Feature A: Generate simplified Hindi summary from official notice
 */
export async function generateHindiSchemeSummary(
  noticeText: string,
  schemeTitle?: string
): Promise<AiSummaryOutput> {
  const systemPrompt = `You are an expert bilingual social worker and government policy specialist in Madhya Pradesh, India.
Your mission is to translate complex, bureaucratic official government scheme notices into clear, dignified, and simple Hindi that rural and semi-urban women can easily understand.

STRICT CONSTRAINTS:
1. Write in natural, respectful, conversational Hindi (सरल और सम्मानजनक हिंदी).
2. NEVER fabricate or invent eligibility conditions, age limits, or monetary benefits.
3. NEVER add unsupported promises or claims.
4. Extract ONLY facts present in the provided notice. If information is missing, state 'जानकारी सूचना पत्र में उपलब्ध नहीं है'.
5. You MUST return ONLY valid JSON matching this exact schema:
{
  "summaryHindi": "योजना का सरल विवरण 2-3 वाक्यों में",
  "whoCanApply": ["पात्रता बिंदु 1", "पात्रता बिंदु 2"],
  "benefits": ["लाभ बिंदु 1", "लाभ बिंदु 2"],
  "requiredDocuments": ["दस्तावेज़ 1", "दस्तावेज़ 2"],
  "applicationSteps": ["चरण 1", "चरण 2"],
  "importantConditions": ["शर्त 1", "शर्त 2"]
}`;

  const userPrompt = `योजना का नाम: ${schemeTitle || 'सरकारी कल्याण योजना'}
सरकारी अधिसूचना / सूचना पाठ (Official Notice Text):
"""
${noticeText}
"""

कृपया उपरोक्त आधिकारिक सूचना का विश्लेषण करें और सरल हिंदी में संरचित JSON प्रारूप में विवरण तैयार करें।`;

  if (groqClient && config.groq.apiKey) {
    try {
      const completion = await groqClient.chat.completions.create({
        model: config.groq.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // low temperature for high factual accuracy
      });

      const rawJson = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawJson);
      return AiSummaryOutputSchema.parse(parsed);
    } catch (error: any) {
      logger.error('Groq API summarization error:', error);
      throw new Error(`AI Summary generation failed: ${error.message || 'Groq API error'}`);
    }
  }

  // High-fidelity fallback when GROQ_API_KEY is not configured in local environment
  logger.info('Using local deterministic fallback for scheme summary generation (GROQ_API_KEY not configured)');
  return generateLocalRuleBasedSummary(noticeText, schemeTitle);
}

/**
 * Feature B: Extract structured user facts from natural Hindi text
 */
export async function extractFactsFromHindiQuery(query: string): Promise<ExtractedFacts> {
  const systemPrompt = `You are an AI assistant designed ONLY to extract demographic and socioeconomic facts from a woman's natural Hindi or Hinglish query for government welfare eligibility checking.

DO NOT make eligibility decisions. Extract ONLY the stated facts into this exact JSON:
{
  "age": number or null,
  "district": "string in English/Hindi" or null,
  "isWidow": boolean or null,
  "isBpl": boolean or null,
  "isShgMember": boolean or null,
  "isPregnantFirstChild": boolean or null,
  "annualIncome": number or null,
  "ambiguousConditions": ["list of unclear points"],
  "followUpQuestionsHindi": ["clarification question in simple Hindi if needed"]
}

Guidelines:
- "विधवा" / "widow" => isWidow: true
- "बीपीएल" / "BPL" / "गरीबी रेखा" => isBpl: true
- "स्वयं सहायता समूह" / "SHG" / "समूह से जुड़ी" => isShgMember: true
- "गर्भवती" / "पहला बच्चा" / "pregnant" => isPregnantFirstChild: true
- If a fact is not mentioned, use null.`;

  if (groqClient && config.groq.apiKey) {
    try {
      const completion = await groqClient.chat.completions.create({
        model: config.groq.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `उपयोगकर्ता का प्रश्न: "${query}"` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const rawJson = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawJson);
      return ExtractedFactsSchema.parse(parsed);
    } catch (error: any) {
      logger.error('Groq API fact extraction error:', error);
    }
  }

  // Regex-based rule extractor fallback if Groq key isn't provided locally
  return extractFactsLocally(query);
}

function generateLocalRuleBasedSummary(noticeText: string, schemeTitle?: string): AiSummaryOutput {
  const isWidowPension = /विधवा|widow|पेंशन|pension/i.test(noticeText + (schemeTitle || ''));
  const isShg = /स्वयं सहायता समूह|shg|loan|ऋण|आजीविका/i.test(noticeText + (schemeTitle || ''));
  const isMaternity = /गर्भवती|maternity|मातृत्व|शिशु|बच्चा/i.test(noticeText + (schemeTitle || ''));

  if (isWidowPension) {
    return {
      summaryHindi: 'यह योजना मध्य प्रदेश की निराश्रित एवं विधवा महिलाओं को मासिक आर्थिक सहायता प्रदान करती है ताकि वे सम्मानपूर्वक जीवन यापन कर सकें।',
      whoCanApply: [
        'महिला की आयु 18 से 79 वर्ष के बीच होनी चाहिए।',
        'महिला विधवा हो तथा परिवार के पास वैध बीपीएल (गरीबी रेखा) कार्ड होना चाहिए।',
        'मध्य प्रदेश की मूल निवासी होना आवश्यक है।'
      ],
      benefits: ['₹600 प्रतिमाह सीधे बैंक खाते में सहायता राशि।'],
      requiredDocuments: [
        'पति का मृत्यु प्रमाण पत्र',
        'बीपीएल राशन कार्ड',
        'आधार कार्ड और समग्र आईडी',
        'बैंक खाता पासबुक'
      ],
      applicationSteps: [
        'निकटतम लोक सेवा केंद्र (CSC) या ग्राम पंचायत कार्यालय जाएं।',
        'विधवा पेंशन हेतु आवेदन पत्र भरें और दस्तावेज़ संलग्न करें।',
        'सत्यापन उपरांत पेंशन बैंक खाते में प्रारंभ हो जाएगी।'
      ],
      importantConditions: [
        'महिला सरकारी सेवा में कार्यरत नहीं होनी चाहिए।',
        'अन्य नियमित पारिवारिक पेंशन प्राप्त न कर रही हो।'
      ]
    };
  }

  if (isShg) {
    return {
      summaryHindi: 'इस योजना के अंतर्गत पंजीकृत महिला स्वयं सहायता समूहों को स्वावलंबन और व्यवसाय स्थापित करने के लिए रियायती ब्याज दर पर ऋण सहायता मिलती है।',
      whoCanApply: [
        'महिला किसी पंजीकृत स्वयं सहायता समूह (SHG) की सक्रिय सदस्य हो।',
        'समूह नियमित बचत और बैठकें कर रहा हो।'
      ],
      benefits: ['₹3 लाख तक का व्यवसाय ऋण अत्यंत कम ब्याज दर पर उपलब्ध।'],
      requiredDocuments: [
        'स्वयं सहायता समूह पंजीकरण प्रमाण पत्र',
        'समूह का बैंक खाता विवरण',
        'सदस्यों के आधार कार्ड एवं पहचान पत्र'
      ],
      applicationSteps: [
        'समूह की बैठक में ऋण प्रस्ताव पारित करें।',
        'क्षेत्रीय ग्रामीण बैंक या आजीविका मिशन कार्यालय में आवेदन जमा करें।'
      ],
      importantConditions: [
        'ऋण का उपयोग उत्पादक आजीविका गतिविधि हेतु होना चाहिए।'
      ]
    };
  }

  if (isMaternity) {
    return {
      summaryHindi: 'गर्भवती महिलाओं को पोषण एवं स्वास्थ्य सुरक्षा सुनिश्चित करने हेतु पहले जीवित बच्चे के जन्म पर आर्थिक प्रोत्साहन दिया जाता है।',
      whoCanApply: [
        'गर्भवती महिला प्रथम जीवित संतान की माता बनने वाली हो।',
        'आयु 19 वर्ष या उससे अधिक होनी चाहिए।'
      ],
      benefits: ['₹5,000 की राशि विभिन्न किस्तों में सीधे डीबीटी द्वारा प्रदान की जाती है।'],
      requiredDocuments: [
        'एमसीपी (मातृ एवं बाल संरक्षण) कार्ड',
        'आधार कार्ड',
        'बैंक खाता पासबुक'
      ],
      applicationSteps: [
        'गर्भावस्था के 150 दिनों के भीतर निकटतम आंगनवाड़ी केंद्र में पंजीकरण कराएं।',
        'नियमित एएनसी जांच करवाएं और किस्तों का दावा करें।'
      ],
      importantConditions: [
        'यह लाभ केवल पहले जीवित बच्चे के लिए मान्य है।'
      ]
    };
  }

  return {
    summaryHindi: `यह योजना ${schemeTitle || 'महिलाओं के कल्याण'} हेतु वित्तीय व सामाजिक सहायता प्रदान करने के लिए बनाई गई है।`,
    whoCanApply: ['मध्य प्रदेश की पात्र महिला निवासी।', 'आवश्यक आयु व सामाजिक मानदंडों को पूरा करती हों।'],
    benefits: ['आधिकारिक दिशा-निर्देशों के अनुसार वित्तीय अथवा सेवा लाभ।'],
    requiredDocuments: ['आधार कार्ड', 'समग्र आईडी', 'निवास प्रमाण पत्र'],
    applicationSteps: ['नजदीकी लोक सेवा केंद्र या संबंधित विभाग में संपर्क करें।'],
    importantConditions: ['नियम व शर्तें आधिकारिक अधिसूचना के अनुसार लागू होंगी।'],
  };
}

function extractFactsLocally(query: string): ExtractedFacts {
  const lower = query.toLowerCase();

  const isWidow = /विधवा|पति नहीं|पति की मृत्यु|widow/i.test(lower) ? true : null;
  const isBpl = /बीपीएल|bpl|गरीबी रेखा|राशन कार्ड/i.test(lower) ? true : null;
  const isShgMember = /स्वयं सहायता समूह|समूह|shg|self help group/i.test(lower) ? true : null;
  const isPregnantFirstChild = /गर्भवती|पहला बच्चा|पहली बार गर्भवती|pregnant|first child/i.test(lower) ? true : null;

  // Extract age if mentioned like "मेरी उम्र 35 साल है" or "age 28"
  let age: number | null = null;
  const ageMatch = query.match(/(?:उम्र|आयु|age)\s*(?:है)?\s*[:=-]?\s*(\d{1,2})|\b(\d{1,2})\s*(?:साल|वर्ष|years)/i);
  if (ageMatch) {
    const parsedAge = parseInt(ageMatch[1] || ageMatch[2], 10);
    if (!isNaN(parsedAge) && parsedAge >= 10 && parsedAge <= 110) {
      age = parsedAge;
    }
  }

  // Check MP districts
  const districts = ['bhopal', 'sehore', 'raisen', 'rajgarh', 'vidisha', 'hoshangabad', 'jabalpur', 'indore', 'gwalior'];
  const hindiDistricts: Record<string, string> = {
    'भोपाल': 'Bhopal',
    'सीहोर': 'Sehore',
    'रायसेन': 'Raisen',
    'राजगढ़': 'Rajgarh',
    'विदिशा': 'Vidisha',
    'होशंगाबाद': 'Hoshangabad',
    'नर्मदापुरम': 'Hoshangabad',
    'जबलपुर': 'Jabalpur',
    'इंदौर': 'Indore',
    'ग्वालियर': 'Gwalior',
  };

  let district: string | null = null;
  for (const [hName, engName] of Object.entries(hindiDistricts)) {
    if (query.includes(hName)) {
      district = engName;
      break;
    }
  }
  if (!district) {
    for (const d of districts) {
      if (lower.includes(d)) {
        district = d.charAt(0).toUpperCase() + d.slice(1);
        break;
      }
    }
  }

  const followUp: string[] = [];
  if (age === null) {
    followUp.push('कृपया अपनी आयु (उम्र) भी बताएं ताकि सटीक योजनाएं खोजी जा सकें।');
  }

  return {
    age,
    district,
    isWidow,
    isBpl,
    isShgMember,
    isPregnantFirstChild,
    annualIncome: null,
    ambiguousConditions: [],
    followUpQuestionsHindi: followUp,
  };
}
