import mongoose, { Schema, Document } from 'mongoose';

export interface ITransfer extends Document {
  code: string;
  content: string;
  type: 'text' | 'image';
  createdAt: Date;
  expiresAt: Date;
  isRead: boolean;
  readAt?: Date;
  senderEmail?: string;
}

const TransferSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image'], required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  senderEmail: { type: String }
});

export default mongoose.model<ITransfer>('Transfer', TransferSchema); 