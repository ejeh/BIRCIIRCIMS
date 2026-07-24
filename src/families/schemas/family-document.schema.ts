import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { DocumentType } from '../enums/family.enum';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class FamilyDocument extends Document {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Family', required: true, index: true })
  familyId: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: DocumentType, required: true })
  documentType: DocumentType;

  @Prop({ type: String, required: true })
  fileName: string;

  @Prop({ type: String, required: true })
  fileUrl: string;

  @Prop({ type: String, default: null })
  mimeType: string;

  @Prop({ type: Number, default: 0 })
  fileSize: number;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  uploadedBy: mongoose.Types.ObjectId;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  verifiedBy: mongoose.Types.ObjectId;

  @Prop({ type: Date, default: null })
  verifiedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const FamilyDocumentSchema = SchemaFactory.createForClass(FamilyDocument);

FamilyDocumentSchema.index({ familyId: 1, documentType: 1 });
