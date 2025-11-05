import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ReportFrequency } from './report.schema';

@Schema()
export class ScheduledReport extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ReportFrequency })
  frequency: ReportFrequency;

  @Prop({ required: true })
  lga: string; // The LGA this report is for

  @Prop({ required: true })
  createdBy: string; // User ID

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ScheduledReportSchema =
  SchemaFactory.createForClass(ScheduledReport);
