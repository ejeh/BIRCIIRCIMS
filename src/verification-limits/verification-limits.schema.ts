// src/verification-limits/verification-limits.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class VerificationLimits extends Document {
  @Prop({ required: true, default: 3 })
  familyVerificationLimit: number;

  @Prop({ required: true, default: 3 })
  neighborVerificationLimit: number;

  @Prop({ required: true, default: Date.now })
  lastUpdated: Date;

  @Prop({ required: true })
  updatedBy: string; // Admin ID who last updated the limits
}

export const VerificationLimitsSchema =
  SchemaFactory.createForClass(VerificationLimits);
