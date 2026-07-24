import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { DependentStatus } from '../enums/family.enum';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Dependent extends Document {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, default: null })
  middleName: string;

  @Prop({ type: Date, required: true })
  dob: Date;

  @Prop({ type: String, required: true })
  gender: string;

  @Prop({ type: String, default: null })
  nin: string;

  @Prop({ type: String, default: null })
  birthCertificateNumber: string;

  @Prop({ type: String, default: null })
  stateOfOrigin: string;

  @Prop({ type: String, default: null })
  lgaOfOrigin: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  parentId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  guardianId: mongoose.Types.ObjectId;

  @Prop({ type: String, default: null })
  passportPhoto: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Family', required: true, index: true })
  familyId: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: DependentStatus, default: DependentStatus.ACTIVE })
  status: DependentStatus;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const DependentSchema = SchemaFactory.createForClass(Dependent);

DependentSchema.index({ familyId: 1 });
DependentSchema.index({ nin: 1 });
