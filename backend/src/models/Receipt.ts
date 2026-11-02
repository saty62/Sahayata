import mongoose, { Document, Schema } from 'mongoose';

export type ReceiptStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IReceipt extends Document {
  donationId: mongoose.Types.ObjectId;
  donorId?: mongoose.Types.ObjectId;
  receiptNumber: string; // e.g. AC/2026-27/001001
  certificateNumber: string; // e.g. 80G/2026-27/001001
  donorPAN?: string;
  donorName: string;
  donorAddress?: string;
  amount: number;
  donationDate: Date;
  trustPAN: string;
  trust80GNumber: string;
  receiptPdfUrl?: string;
  certificatePdfUrl?: string;
  generationStatus: ReceiptStatus;
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    donationId: {
      type: Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      unique: true,
      index: true,
    },
    donorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    donorPAN: { type: String, uppercase: true, trim: true },
    donorName: { type: String, required: true },
    donorAddress: { type: String, default: '' },
    amount: { type: Number, required: true },
    donationDate: { type: Date, default: Date.now },
    trustPAN: { type: String, required: true },
    trust80GNumber: { type: String, required: true },
    receiptPdfUrl: { type: String },
    certificatePdfUrl: { type: String },
    generationStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    retryCount: { type: Number, default: 0 },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

ReceiptSchema.index({ donorId: 1, createdAt: -1 });

export const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);
