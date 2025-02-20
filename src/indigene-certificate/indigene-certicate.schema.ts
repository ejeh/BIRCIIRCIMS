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
export class Certificate extends Document {
  @ApiProperty({
    description: 'Certificate ID',
    example: '1234567890',
  })
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: string;

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
  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  email: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  firstname: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  lastname: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, require: true })
  middlename: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Date, required: true })
  DOB: Date;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  maritalStatus: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  gender: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  stateOfOrigin: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  lgaOfOrigin: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  ward: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  address: string;

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
    required: true,
    unique: true,
  })
  phone: number;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  kindred: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  fathersName: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  fathersStateOfOrigin: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  mothersName: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  mothersStateOfOrigin: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false })
  guardian?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false })
  relationshionToguardian?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  purpose?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  refNumber: String;

  @ApiProperty()
  @Prop({ required: true })
  passportPhoto: string; // File path or URL

  @ApiProperty()
  @Prop({ required: true })
  idCard: string; // File path or URL

  @ApiProperty()
  @Prop({ required: true })
  birthCertificate: string; // File path or URL

  @ApiProperty()
  @Prop({ required: true })
  parentGuardianIndigeneCert: string; // File path or URL

  @Prop({ required: false, default: null })
  uploadedAttestationUrl: string; // URL for the signed attestation letter

  @Prop({ required: false, default: null })
  qrCodeUrl?: string; // URL for the QR code
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
