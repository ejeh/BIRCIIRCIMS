// src/schemas/employment-history.schema.ts
import { Schema, Document } from 'mongoose';

export const EmploymentHistorySchema = new Schema({
  companyName: { type: String, required: true },
  address: { type: String, required: true },
  designation: { type: String, required: true },
  startYear: { type: Date, required: true },
  endYear: { type: Date }, // Optional for current employment
  isCurrentEmployment: { type: Boolean, default: false },
  description: { type: String },
});

export interface EmploymentHistory extends Document {
  companyName: string;
  address: string;
  designation: string;
  startYear: Date;
  endYear?: Date;
  isCurrentEmployment: boolean;
  description?: string;
}
