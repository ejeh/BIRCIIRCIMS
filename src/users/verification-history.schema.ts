import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define the sub-document for a single history entry
@Schema()
export class VerificationHistoryEntry {
  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop({ required: true, enum: ['verified', 'denied', 'expired', 'pending'] })
  status: string;

  @Prop({ required: false })
  comments: string;

  @Prop({ required: false })
  deviceInfo: string;

  @Prop({ required: false })
  verifiedBy?: string; // e.g., "Reference Person"
}

export const VerificationHistoryEntrySchema = SchemaFactory.createForClass(
  VerificationHistoryEntry,
);
