// next-of-kin.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Neighbor extends Document {
  @Prop({ required: false, default: null })
  name?: string;

  @Prop({ required: false, default: null })
  address?: string;

  @Prop({ required: false, default: null })
  phone?: string;
}

export const NeighborSchema = SchemaFactory.createForClass(Neighbor);
