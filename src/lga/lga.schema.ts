import { Schema, Document, Types } from 'mongoose';

export interface Lga extends Document {
  name: string;
  headquaters: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt?: Date;
}

export const LgaSchema = new Schema<Lga>({
  name: { type: String, required: true, unique: true },
  headquaters: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date },
});
