// next-of-kin.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Occupation extends Document {
  @Prop({ required: false, default: null })
  current_occupation?: string;

  @Prop({ required: false, default: null })
  employer_name?: string;

  @Prop({ required: false, default: null })
  employer_address?: string;

  @Prop({ required: false, default: null })
  employment_status?: string;
}

export const OccupationSchema = SchemaFactory.createForClass(Occupation);
