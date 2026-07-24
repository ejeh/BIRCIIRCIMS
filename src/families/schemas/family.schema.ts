import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { FamilyStatus } from '../enums/family.enum';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Family extends Document {
  @Prop({ type: String, required: true, unique: true, index: true })
  familyNumber: string;

  @Prop({ type: String, required: true, index: true })
  familyName: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  headId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: String, required: true })
  state: string;

  @Prop({ type: String, required: true, index: true })
  lga: string;

  @Prop({ type: String, required: true, index: true })
  ward: string;

  @Prop({ type: String, default: null })
  district: string;

  @Prop({ type: String, default: null })
  village: string;

  @Prop({ type: String, default: null })
  clan: string;

  @Prop({ type: String, default: null })
  kindred: string;

  @Prop({ type: String, enum: FamilyStatus, default: FamilyStatus.ACTIVE })
  status: FamilyStatus;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Family', default: null })
  mergedInto: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  previousHeadId: mongoose.Types.ObjectId;
}

export const FamilySchema = SchemaFactory.createForClass(Family);

FamilySchema.index({ lga: 1, ward: 1 });
FamilySchema.index({ familyNumber: 1 });
FamilySchema.index({ headId: 1 });
