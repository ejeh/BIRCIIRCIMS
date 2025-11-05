import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ReportFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

@Schema()
export class Report extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ReportFrequency })
  type: ReportFrequency;

  @Prop({ required: true, type: String, default: 'pdf' })
  format: string;

  @Prop({ required: true })
  generatedBy: string; // User ID or name

  @Prop({ required: true, type: Buffer })
  fileData: Buffer; // Store the generated PDF file

  @Prop({ default: Date.now })
  generatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
