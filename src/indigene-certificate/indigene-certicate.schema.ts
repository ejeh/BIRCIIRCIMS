import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { UserDocument } from 'src/users/users.schema';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Certificate extends Document {
  @ApiProperty({
    description: 'User ID',
    example: '1234567890',
  })
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: string | UserDocument;

  @ApiProperty({
    description: 'First Name',
    example: 'John',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  firstname: string;

  @ApiProperty({
    description: 'Last Name',
    example: 'Doe',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  lastname: string;

  @ApiProperty({
    description: 'Middle Name',
    example: 'Doe',
  })
  @Prop({ type: mongoose.SchemaTypes.String })
  middlename: string;

  @ApiProperty({
    description: 'Gender',
    example: 'Male',
  })
  @Prop({ type: mongoose.SchemaTypes.String })
  gender: string;

  @ApiProperty({
    description: 'Ward',
    example: 'Ward',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  ward: string;

  @ApiProperty({
    description: 'Phone',
    example: '1234567890',
  })
  @Prop({
    type: mongoose.SchemaTypes.String,
    required: true,
    // unique: true,
  })
  phone: string;

  @ApiProperty({
    description: 'Kindred',
    example: 'Kindred',
  })
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  kindred: string;

  @ApiProperty({
    description: 'Village',
    example: 'Village',
  })
  @Prop({
    type: mongoose.SchemaTypes.String,
    required: true,
  })
  village: string;

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

  @ApiProperty({
    description: 'LGA of Origin',
    example: 'LGA of Origin',
  })
  @Prop({ type: mongoose.SchemaTypes.String })
  lgaOfOrigin: string;

  @ApiProperty({
    description: 'Reference Number',
    example: 'Reference Number',
  })
  @Prop({ type: mongoose.SchemaTypes.String })
  refNumber: String;

  @ApiProperty({
    description: 'QR Code URL',
    example: 'QR Code URL',
  })
  @Prop({ required: false, default: null })
  qrCodeUrl?: string; // URL for the QR code

  @ApiProperty({
    description: 'Is Valid',
    example: 'true',
  })
  @Prop({ default: true })
  isValid: boolean;

  @ApiProperty({
    description: 'Is Verified',
    example: 'false',
  })
  @Prop({ default: false })
  isVerified: boolean;

  @ApiProperty({
    description: 'Verification Hash',
    example: 'Verification Hash',
  })
  @Prop({ type: mongoose.SchemaTypes.String })
  verificationHash: string; // Hash for verification

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
    description: 'Certificate Number',
    example: 0,
  })
  @ApiProperty({
    description: 'Certificate Number',
    example: 0,
  })
  @Prop({ type: Number, default: 0 })
  certificateNumber: number;

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
    description: 'Requires Reprint Payment',
    example: false,
  })
  @Prop({ type: Boolean, default: false })
  requiresReprintPayment: boolean;

  // auctioneer.schema.ts
  @Prop({ default: 0 })
  downloadCount: number;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
