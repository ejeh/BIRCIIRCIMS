// src/users/users.role-assignment.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleAssignmentDocument = RoleAssignment & Document;

@Schema({ timestamps: true })
export class RoleAssignment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  previousRole: string;

  @Prop({ required: true })
  newRole: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  assignedBy: Types.ObjectId;

  @Prop({ required: true })
  reason: string;
}

export const RoleAssignmentSchema =
  SchemaFactory.createForClass(RoleAssignment);
