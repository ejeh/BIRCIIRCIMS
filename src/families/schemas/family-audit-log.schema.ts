import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { AuditAction } from '../enums/family.enum';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class FamilyAuditLog extends Document {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Family', required: true, index: true })
  familyId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  actorId: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: AuditAction, required: true })
  action: AuditAction;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  metadata: Record<string, any>;

  @Prop({ type: String, default: null })
  ipAddress: string;

  @Prop({ type: String, default: null })
  userAgent: string;
}

export const FamilyAuditLogSchema = SchemaFactory.createForClass(FamilyAuditLog);

FamilyAuditLogSchema.index({ familyId: 1, created_at: -1 });
FamilyAuditLogSchema.index({ actorId: 1 });
