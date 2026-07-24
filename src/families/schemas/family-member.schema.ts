import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { MemberType, MemberStatus, RelationshipType } from '../enums/family.enum';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class FamilyMember extends Document {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Family', required: true, index: true })
  familyId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Dependent', default: null })
  dependentId: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: MemberType, required: true })
  memberType: MemberType;

  @Prop({ type: String, enum: RelationshipType, required: true })
  relationship: RelationshipType;

  @Prop({ type: String, enum: MemberStatus, default: MemberStatus.ACTIVE })
  status: MemberStatus;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Date, default: null })
  joinedAt: Date;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  addedBy: mongoose.Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const FamilyMemberSchema = SchemaFactory.createForClass(FamilyMember);

FamilyMemberSchema.index({ familyId: 1, userId: 1 });
FamilyMemberSchema.index({ familyId: 1, memberType: 1 });
FamilyMemberSchema.index({ userId: 1 });
