import mongoose, { Schema } from 'mongoose';

export interface IReceiptCounter {
  _id: string; // e.g. "FY2026-27"
  sequence: number; // e.g. 1000, 1001, etc.
  updatedAt?: Date;
}

const ReceiptCounterSchema = new Schema<IReceiptCounter>(
  {
    _id: { type: String, required: true },
    sequence: { type: Number, required: true, default: 1000 },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

export const ReceiptCounter = mongoose.model<IReceiptCounter>('ReceiptCounter', ReceiptCounterSchema);
