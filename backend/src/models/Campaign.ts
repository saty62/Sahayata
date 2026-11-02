import mongoose, { Document, Schema } from 'mongoose';

export type CampaignStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export interface ICampaign extends Document {
  name: string;
  nameHindi: string;
  slug: string;
  description: string;
  descriptionHindi: string;
  category: string;
  targetAmount: number;
  collectedAmount: number;
  status: CampaignStatus;
  startDate: Date;
  endDate?: Date;
  coverImageUrl?: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    nameHindi: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true },
    descriptionHindi: { type: String, required: true },
    category: { type: String, default: 'General', index: true },
    targetAmount: { type: Number, required: true, min: 0 },
    collectedAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PAUSED'],
      default: 'ACTIVE',
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    coverImageUrl: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
