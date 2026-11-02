export interface User {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: 'DONOR' | 'ADMIN';
  pan?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt: string;
}

export interface EligibilityRules {
  minAge?: number;
  maxAge?: number;
  isWidow?: boolean;
  isBpl?: boolean;
  isShgMember?: boolean;
  isPregnantFirstChild?: boolean;
  districts?: string[];
  incomeLimitAnnual?: number;
  customConditionsHindi?: string[];
}

export interface AiSummaryDraft {
  summaryHindi: string;
  whoCanApply: string[];
  benefits: string[];
  requiredDocuments: string[];
  applicationSteps: string[];
  importantConditions: string[];
  generatedAt?: string;
  modelUsed?: string;
}

export interface HelpCentre {
  name: string;
  address: string;
  district: string;
  contactNumber: string;
}

export interface Scheme {
  _id: string;
  schemeId: string;
  titleHindi: string;
  titleEnglish: string;
  category: 'पेंशन' | 'स्वास्थ्य' | 'आजीविका' | 'शिक्षा' | 'अन्य';
  districts: string[];
  eligibilityRules: EligibilityRules;
  benefits: string[];
  documents: string[];
  applicationSteps: string[];
  officialSourceUrl: string;
  officialNoticeText?: string;
  aiSummaryDraft?: AiSummaryDraft;
  summaryStatus: 'NONE' | 'DRAFT' | 'APPROVED' | 'REJECTED';
  published: boolean;
  isSampleData: boolean;
  lastCheckedAt: string;
  helpCentres?: HelpCentre[];
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  _id: string;
  name: string;
  nameHindi: string;
  slug: string;
  description: string;
  descriptionHindi: string;
  category: string;
  targetAmount: number;
  collectedAmount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  startDate: string;
  endDate?: string;
  isFeatured: boolean;
}

export interface Donation {
  _id: string;
  donorId?: string;
  donorName: string;
  donorEmail: string;
  donorMobile: string;
  donorPan?: string;
  donorAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  campaignId: string | Campaign;
  amount: number;
  paymentMode: 'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  idempotencyKey: string;
  transactionReference?: string;
  donationType: 'ONE_TIME' | 'MONTHLY_SIMULATED';
  isSimulated: boolean;
  notes?: string;
  receipt?: Receipt;
  createdAt: string;
}

export interface Receipt {
  _id: string;
  donationId: string | Donation;
  donorId?: string;
  receiptNumber: string;
  certificateNumber: string;
  donorPAN?: string;
  donorName: string;
  donorAddress?: string;
  amount: number;
  donationDate: string;
  trustPAN: string;
  trust80GNumber: string;
  receiptPdfUrl?: string;
  certificatePdfUrl?: string;
  generationStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
}

export interface RuleEvaluationResult {
  ruleNameHindi: string;
  satisfied: boolean;
  userValue: any;
  requiredCondition: string;
}

export interface SchemeMatchResult {
  scheme: Scheme;
  isEligible: boolean;
  matchScorePercent: number;
  matchedRules: RuleEvaluationResult[];
  unmatchedRules: RuleEvaluationResult[];
  disclaimerHindi: string;
}

export interface EligibilityEvaluationResponse {
  matchingSchemes: SchemeMatchResult[];
  otherSchemes: SchemeMatchResult[];
  factsUsed: any;
  extractedFacts?: any;
  helpline: {
    phone: string;
    availableHours?: string;
    callToActionHindi: string;
  };
}
