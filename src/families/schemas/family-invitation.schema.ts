import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { InvitationStatus, RelationshipType } from '../enums/family.enum';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class FamilyInvitation extends Document {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Family', required: true, index: true })
  familyId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  senderId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true })
  receiverId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  token: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: String, enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Prop({ type: String, enum: RelationshipType, default: null })
  relationship: RelationshipType;

  @Prop({ type: String, default: null })
  message: string;

  @Prop({ type: Date, default: null })
  respondedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const FamilyInvitationSchema = SchemaFactory.createForClass(FamilyInvitation);

FamilyInvitationSchema.index({ token: 1 });
FamilyInvitationSchema.index({ familyId: 1, receiverId: 1 });
FamilyInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
