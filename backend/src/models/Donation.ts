import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type PaymentMode = 'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD';
export type DonationType = 'ONE_TIME' | 'MONTHLY_SIMULATED';

export interface IDonation extends Document {
  donorId?: mongoose.Types.ObjectId;
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
  campaignId: mongoose.Types.ObjectId;
  amount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  idempotencyKey: string;
  transactionReference?: string;
  donationType: DonationType;
  isSimulated: boolean;
  notes?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    donorName: { type: String, required: true, trim: true },
    donorEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    donorMobile: { type: String, required: true, trim: true },
    donorPan: { type: String, uppercase: true, trim: true, index: true },
    donorAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMode: {
      type: String,
      enum: ['UPI', 'NET_BANKING', 'DEBIT_CARD', 'CREDIT_CARD'],
      default: 'UPI',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transactionReference: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    donationType: {
      type: String,
      enum: ['ONE_TIME', 'MONTHLY_SIMULATED'],
      default: 'ONE_TIME',
    },
    isSimulated: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    failureReason: { type: String },
  },
  {
    timestamps: true,
  }
);

DonationSchema.index({ donorId: 1, paymentStatus: 1, createdAt: -1 });
DonationSchema.index({ campaignId: 1, paymentStatus: 1 });

export const Donation = mongoose.model<IDonation>('Donation', DonationSchema);
