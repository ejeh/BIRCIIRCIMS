// next-of-kin.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class NextOfKin extends Document {
  @Prop({ required: false })
  nok_name?: string;

  @Prop({ required: false })
  nok_middlename?: string;
  @Prop({ required: false })
  nok_relationship?: string;
  @Prop({ required: false })
  nok_countryOfResidence?: string;
  @Prop({ required: false })
  nok_stateOfResidence?: string;
  @Prop({ required: false })
  nok_lgaOfResidence?: string;
  @Prop({ required: false })
  nok_cityOfResidence?: string;
  @Prop({ required: false })
  nok_address?: string;

  @Prop({ required: false })
  nok_phone?: string;

  @Prop({ required: false })
  nok_email?: string;
}

export const NextOfKinSchema = SchemaFactory.createForClass(NextOfKin);
