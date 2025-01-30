// next-of-kin.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Business extends Document {
  @Prop({ required: false, default: null })
  biz_name?: string;

  @Prop({ required: false, default: null })
  biz_type?: string;

  @Prop({ required: false, default: null })
  registration_number?: string;

  @Prop({ required: false, default: null })
  biz_address?: string;

  @Prop({ required: false, default: null })
  nature_of_bussiness?: string;

  @Prop({ required: false, default: null })
  numberOfYears?: string;

  @Prop({ required: false, default: null })
  numberOfEmployees?: string;

  @Prop({ required: false, default: null })
  annualRevenue?: string;

  @Prop({ required: false, default: null })
  TIN?: string;

  @Prop({ required: false, default: null })
  biz_phone?: string;

  @Prop({ required: false, default: null })
  biz_email?: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
