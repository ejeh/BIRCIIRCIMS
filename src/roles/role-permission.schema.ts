import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Permission } from '../users/permissions.enum';

export type RolePermissionDocument = RolePermission & Document;

@Schema({ timestamps: true })
export class RolePermission {
  @Prop({
    required: true,
    enum: ['global_admin', 'support_admin', 'kindred_head', 'user'],
  })
  role: string;

  @Prop({ type: [String], enum: Object.values(Permission), default: [] })
  permissions: Permission[];
}

export const RolePermissionSchema =
  SchemaFactory.createForClass(RolePermission);
