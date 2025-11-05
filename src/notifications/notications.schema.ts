import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: string;
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'general' })
  type: string; // e.g., 'request', 'approval', 'system'

  @Prop({ default: false })
  read: boolean;

  @Prop()
  link?: string; // optional link to the related page

  @Prop({ type: String })
  lga?: string; // optional, for LGA-specific notifications

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    index: { expires: '0s' }, // MongoDB will delete automatically when this date passes
  })
  expiresAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
