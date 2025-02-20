import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class IdCard extends Document {
  @ApiProperty({
    description: 'User ID',
    example: '1234567890',
  })
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  firstname: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  lastname: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  email: string;

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  })
  status: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  rejectionReason?: string;

  @Prop({ default: true })
  resubmissionAllowed: boolean;

  @Prop({ default: 0 })
  resubmissionAttempts: number;

  @ApiProperty()
  @Prop({ default: false })
  downloaded: Boolean;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  card_type: string;

  @Prop({ required: true, default: new Date().toISOString() })
  dateOfIssue: Date;

  @Prop({ required: true, default: new Date().toISOString() })
  dateOfExpiration: Date;

  @Prop({ required: false, default: null })
  ref_letter: string; // URL for the signed attestation letter

  @Prop({ required: false, default: null })
  utilityBill: string; // URL for the signed attestation letter

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
    required: true,
    unique: true,
  })
  phone: number;

  @Prop({ required: false, default: null })
  qrCodeUrl?: string; // URL for the QR code

  @Prop({ required: false, default: null })
  bin?: string; // URL for the QR code
}

export const IdCardSchema = SchemaFactory.createForClass(IdCard);
