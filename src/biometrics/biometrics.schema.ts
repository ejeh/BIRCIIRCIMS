// src/biometric/schemas/biometric.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BiometricDocument = Biometric & Document;

@Schema({ timestamps: true })
export class Biometric {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  facialImagePath: string;

  @Prop({ type: [String], required: true }) // base64 or hash per finger
  fingerprints: string[];

  @Prop({ default: true })
  consentGiven: boolean;
}

export const BiometricSchema = SchemaFactory.createForClass(Biometric);
