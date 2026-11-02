import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'DONOR' | 'ADMIN';

export interface IUser extends Document {
  name: string;
  email: string;
  mobile?: string;
  passwordHash: string;
  role: UserRole;
  pan?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['DONOR', 'ADMIN'], default: 'DONOR', index: true },
    pan: { type: String, uppercase: true, trim: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);
