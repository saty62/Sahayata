import { IScheme, Scheme } from '../../models/Scheme';

export interface UserEligibilityFacts {
  age?: number;
  district?: string;
  isWidow?: boolean;
  isBpl?: boolean;
  isShgMember?: boolean;
  isPregnantFirstChild?: boolean;
  annualIncome?: number;
}

export interface RuleEvaluationResult {
  ruleNameHindi: string;
  satisfied: boolean;
  userValue: any;
  requiredCondition: string;
}

export interface SchemeMatchResult {
  scheme: IScheme;
  isEligible: boolean;
  matchScorePercent: number;
  matchedRules: RuleEvaluationResult[];
  unmatchedRules: RuleEvaluationResult[];
  disclaimerHindi: string;
}

/**
 * Deterministic evaluation of a scheme against user facts
 * Absolute rule: LLM is NEVER used as the decider of eligibility.
 */
export function evaluateSchemeEligibility(scheme: IScheme, facts: UserEligibilityFacts): SchemeMatchResult {
  const rules = scheme.eligibilityRules || {};
  const matchedRules: RuleEvaluationResult[] = [];
  const unmatchedRules: RuleEvaluationResult[] = [];

  // 1. Age Rule
  if (rules.minAge !== undefined || rules.maxAge !== undefined) {
    const min = rules.minAge ?? 0;
    const max = rules.maxAge ?? 150;
    const conditionText = `आयु ${min} से ${max} वर्ष के बीच होनी चाहिए`;

    if (facts.age !== undefined && facts.age !== null) {
      if (facts.age >= min && facts.age <= max) {
        matchedRules.push({
          ruleNameHindi: 'आयु पात्रता',
          satisfied: true,
          userValue: `${facts.age} वर्ष`,
          requiredCondition: conditionText,
        });
      } else {
        unmatchedRules.push({
          ruleNameHindi: 'आयु पात्रता',
          satisfied: false,
          userValue: `${facts.age} वर्ष`,
          requiredCondition: conditionText,
        });
      }
    } else {
      unmatchedRules.push({
        ruleNameHindi: 'आयु पात्रता',
        satisfied: false,
        userValue: 'जानकारी नहीं दी गई',
        requiredCondition: conditionText,
      });
    }
  }

  // 2. Widow Status Rule
  if (rules.isWidow === true) {
    const conditionText = 'महिला का विधवा होना आवश्यक है';
    if (facts.isWidow === true) {
      matchedRules.push({
        ruleNameHindi: 'वैवाहिक स्थिति (विधवा)',
        satisfied: true,
        userValue: 'हाँ',
        requiredCondition: conditionText,
      });
    } else {
      unmatchedRules.push({
        ruleNameHindi: 'वैवाहिक स्थिति (विधवा)',
        satisfied: false,
        userValue: facts.isWidow === false ? 'नहीं' : 'जानकारी नहीं दी गई',
        requiredCondition: conditionText,
      });
    }
  }

  // 3. BPL Card Rule
  if (rules.isBpl === true) {
    const conditionText = 'परिवार के पास बीपीएल (गरीबी रेखा) कार्ड होना चाहिए';
    if (facts.isBpl === true) {
      matchedRules.push({
        ruleNameHindi: 'बीपीएल राशन कार्ड',
        satisfied: true,
        userValue: 'हाँ',
        requiredCondition: conditionText,
      });
    } else {
      unmatchedRules.push({
        ruleNameHindi: 'बीपीएल राशन कार्ड',
        satisfied: false,
        userValue: facts.isBpl === false ? 'नहीं' : 'जानकारी नहीं दी गई',
        requiredCondition: conditionText,
      });
    }
  }

  // 4. SHG Member Rule
  if (rules.isShgMember === true) {
    const conditionText = 'पंजीकृत महिला स्वयं सहायता समूह (SHG) की सक्रिय सदस्य होना चाहिए';
    if (facts.isShgMember === true) {
      matchedRules.push({
        ruleNameHindi: 'स्वयं सहायता समूह सदस्यता',
        satisfied: true,
        userValue: 'हाँ',
        requiredCondition: conditionText,
      });
    } else {
      unmatchedRules.push({
        ruleNameHindi: 'स्वयं सहायता समूह सदस्यता',
        satisfied: false,
        userValue: facts.isShgMember === false ? 'नहीं' : 'जानकारी नहीं दी गई',
        requiredCondition: conditionText,
      });
    }
  }

  // 5. Pregnant with First Child Rule
  if (rules.isPregnantFirstChild === true) {
    const conditionText = 'महिला का पहले बच्चे के साथ गर्भवती होना आवश्यक है';
    if (facts.isPregnantFirstChild === true) {
      matchedRules.push({
        ruleNameHindi: 'प्रथम गर्भावस्था (मातृत्व)',
        satisfied: true,
        userValue: 'हाँ',
        requiredCondition: conditionText,
      });
    } else {
      unmatchedRules.push({
        ruleNameHindi: 'प्रथम गर्भावस्था (मातृत्व)',
        satisfied: false,
        userValue: facts.isPregnantFirstChild === false ? 'नहीं' : 'जानकारी नहीं दी गई',
        requiredCondition: conditionText,
      });
    }
  }

  // 6. District Rule
  if (rules.districts && rules.districts.length > 0 && !rules.districts.includes('ALL')) {
    const conditionText = `लागू जिले: ${rules.districts.join(', ')}`;
    if (facts.district) {
      const matchDistrict = rules.districts.some(
        (d) => d.toLowerCase() === facts.district!.toLowerCase()
      );
      if (matchDistrict) {
        matchedRules.push({
          ruleNameHindi: 'जिला पात्रता',
          satisfied: true,
          userValue: facts.district,
          requiredCondition: conditionText,
        });
      } else {
        unmatchedRules.push({
          ruleNameHindi: 'जिला पात्रता',
          satisfied: false,
          userValue: facts.district,
          requiredCondition: conditionText,
        });
      }
    }
  }

  const totalRules = matchedRules.length + unmatchedRules.length;
  const isEligible = totalRules > 0 && unmatchedRules.length === 0;
  const matchScorePercent = totalRules > 0 ? Math.round((matchedRules.length / totalRules) * 100) : 100;

  return {
    scheme,
    isEligible,
    matchScorePercent,
    matchedRules,
    unmatchedRules,
    disclaimerHindi:
      'आपकी दी गई जानकारी के आधार पर यह योजना आपके लिए संभावित रूप से उपयुक्त हो सकती है। अंतिम पात्रता आधिकारिक सत्यापन एवं दस्तावेज़ों पर निर्भर करेगी।',
  };
}

/**
 * Evaluates all published schemes against provided user facts
 */
export async function findMatchingSchemes(facts: UserEligibilityFacts): Promise<{
  matchingSchemes: SchemeMatchResult[];
  otherSchemes: SchemeMatchResult[];
  factsUsed: UserEligibilityFacts;
}> {
  const publishedSchemes = await Scheme.find({ published: true });

  const allResults = publishedSchemes.map((scheme) => evaluateSchemeEligibility(scheme, facts));

  const matchingSchemes = allResults.filter((r) => r.isEligible);
  const otherSchemes = allResults.filter((r) => !r.isEligible);

  return {
    matchingSchemes,
    otherSchemes,
    factsUsed: facts,
  };
}
