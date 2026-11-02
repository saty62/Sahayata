import mongoose, { Document, Schema } from 'mongoose';

export type SchemeCategory = 'पेंशन' | 'स्वास्थ्य' | 'आजीविका' | 'शिक्षा' | 'अन्य';
export type SummaryStatus = 'NONE' | 'DRAFT' | 'APPROVED' | 'REJECTED';

export interface IEligibilityRules {
  minAge?: number;
  maxAge?: number;
  isWidow?: boolean;
  isBpl?: boolean;
  isShgMember?: boolean;
  isPregnantFirstChild?: boolean;
  districts?: string[]; // If empty, applies to all
  incomeLimitAnnual?: number;
  customConditionsHindi?: string[];
}

export interface IAiSummaryDraft {
  summaryHindi: string;
  whoCanApply: string[];
  benefits: string[];
  requiredDocuments: string[];
  applicationSteps: string[];
  importantConditions: string[];
  generatedAt?: Date;
  modelUsed?: string;
}

export interface IScheme extends Document {
  schemeId: string; // e.g. SCH-014
  titleHindi: string;
  titleEnglish: string;
  category: SchemeCategory;
  districts: string[]; // List of MP districts or ["ALL"]
  eligibilityRules: IEligibilityRules;
  benefits: string[]; // Key benefit points in Hindi
  documents: string[]; // Required documents list in Hindi
  applicationSteps: string[]; // Step-by-step guidance in Hindi
  officialSourceUrl: string;
  officialNoticeText?: string;
  aiSummaryDraft?: IAiSummaryDraft;
  summaryStatus: SummaryStatus;
  published: boolean;
  isSampleData: boolean;
  lastCheckedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  helpCentres?: {
    name: string;
    address: string;
    district: string;
    contactNumber: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const SchemeSchema = new Schema<IScheme>(
  {
    schemeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    titleHindi: { type: String, required: true, trim: true },
    titleEnglish: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['पेंशन', 'स्वास्थ्य', 'आजीविका', 'शिक्षा', 'अन्य'],
      index: true,
    },
    districts: [{ type: String, trim: true, index: true }],
    eligibilityRules: {
      minAge: { type: Number },
      maxAge: { type: Number },
      isWidow: { type: Boolean },
      isBpl: { type: Boolean },
      isShgMember: { type: Boolean },
      isPregnantFirstChild: { type: Boolean },
      districts: [{ type: String }],
      incomeLimitAnnual: { type: Number },
      customConditionsHindi: [{ type: String }],
    },
    benefits: [{ type: String, trim: true }],
    documents: [{ type: String, trim: true }],
    applicationSteps: [{ type: String, trim: true }],
    officialSourceUrl: { type: String, required: true, trim: true },
    officialNoticeText: { type: String, default: '' },
    aiSummaryDraft: {
      summaryHindi: { type: String },
      whoCanApply: [{ type: String }],
      benefits: [{ type: String }],
      requiredDocuments: [{ type: String }],
      applicationSteps: [{ type: String }],
      importantConditions: [{ type: String }],
      generatedAt: { type: Date },
      modelUsed: { type: String },
    },
    summaryStatus: {
      type: String,
      enum: ['NONE', 'DRAFT', 'APPROVED', 'REJECTED'],
      default: 'NONE',
      index: true,
    },
    published: { type: Boolean, default: false, index: true },
    isSampleData: { type: Boolean, default: true },
    lastCheckedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    helpCentres: [
      {
        name: { type: String },
        address: { type: String },
        district: { type: String },
        contactNumber: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

SchemeSchema.index({ category: 1, published: 1 });
SchemeSchema.index({ districts: 1, published: 1 });

export const Scheme = mongoose.model<IScheme>('Scheme', SchemeSchema);
