import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Auctioneer extends Document {
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

  @ApiProperty({
    description: 'Name',
    example: 'John Doe',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  name: string;

  @ApiProperty({
    description: 'Gender',
    example: 'Male',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  gender: string;

  @ApiProperty({
    description: 'Email',
    example: 'john.doe@example.com',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  email: string;

  @ApiProperty({
    description: 'Phone',
    example: '1234567890',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  phone: string;

  @ApiProperty({
    description: 'Address',
    example: '123 Main St',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  address: string;

  @ApiProperty({
    description: 'LGA',
    example: 'LGA',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  LGA: string;

  @ApiProperty({
    description: 'State',
    example: 'State',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  state: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  NIN: string;

  @ApiProperty({
    description: 'Status',
    example: 'Pending',
  })
  @Prop({
    type: mongoose.SchemaTypes.String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  })
  status: string;

  @ApiProperty({
    description: 'Created At',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at?: Date;

  @ApiProperty({
    description: 'Updated At',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at?: Date;

  @ApiProperty({
    description: 'Approval Date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Prop({ type: mongoose.SchemaTypes.Date, default: null })
  approvalDate: Date;

  @ApiProperty({
    description: 'Approved By',
    example: 'Approved By',
  })
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  approvedBy: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Payment Status',
    example: 'pending',
  })
  @Prop({ type: mongoose.SchemaTypes.String, default: 'pending' })
  paymentStatus: string; // Can be 'pending' or 'paid'

  @ApiProperty({
    description: 'Last Resubmitted At',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Prop()
  lastResubmittedAt?: Date;

  @ApiProperty({
    description: 'Reprint Count',
    example: 0,
  })
  @Prop({ type: Number, default: 0 })
  reprintCount: number;

  @ApiProperty({
    description: 'License Number',
    example: 0,
  })
  @Prop({ type: Number, required: true })
  licenceRefSequence: number; // 1, 2, 3, 4...

  @Prop({ type: String, required: true })
  licenceRefNumber: string; // "BNT 1"

  @Prop({ type: Number, required: true })
  sequenceNumber: number;

  @Prop({ type: String, required: true })
  formattedNumber: string;

  @ApiProperty({
    description: 'Reprint Payment Status',
    example: 'NotRequired',
  })
  @Prop({
    type: String,
    enum: ['Pending', 'Paid', 'NotRequired'],
    default: 'NotRequired',
  })
  reprintPaymentStatus: string;

  @ApiProperty({
    description: 'Requires Reprint Payment',
    example: false,
  })
  @Prop({ type: Boolean, default: false })
  requiresReprintPayment: boolean;

  @ApiProperty({
    description: 'Last Reprint Date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Prop({ type: Date })
  lastReprintDate: Date;

  @ApiProperty({
    description: 'Reprint Download Expiry Date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Prop({ type: Date })
  reprintDownloadExpiryDate: Date;

  @ApiProperty({
    description: 'Rejection Reason',
    example: 'Rejection Reason',
  })
  @Prop({ type: mongoose.SchemaTypes.String })
  rejectionReason?: string;

  @ApiProperty({
    description: 'Resubmission Allowed',
    example: 'true',
  })
  @Prop({ default: true })
  resubmissionAllowed: boolean;

  @Prop({ default: 0 })
  resubmissionAttempts: number;

  @ApiProperty({
    description: 'Downloaded',
    example: 'false',
  })
  @Prop({ default: false })
  downloaded: Boolean;

  @ApiProperty({
    description: 'Download Expiry Date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Prop({ type: mongoose.SchemaTypes.Date, default: null })
  downloadExpiryDate: Date;

  @ApiProperty()
  @Prop({ required: true })
  taxClearance: string; // File path or URL

  @ApiProperty()
  @Prop({ required: false, default: null })
  qrCodeUrl?: string; // URL for the QR code

  // auctioneer.schema.ts
  @Prop({ default: 0 })
  downloadCount: number;
}

export const AuctioneerSchema = SchemaFactory.createForClass(Auctioneer);
