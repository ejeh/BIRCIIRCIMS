// next-of-kin.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Family extends Document {
  @Prop({ required: false, default: null })
  name?: string;

  @Prop({ required: false, default: null })
  relationship?: string;

  @Prop({ required: false, default: null })
  phone?: string;

  @Prop({ required: false, default: null })
  address?: string;
}

export const FamilySchema = SchemaFactory.createForClass(Family);
