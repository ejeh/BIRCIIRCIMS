// next-of-kin.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class NextOfKin extends Document {
  @Prop({ required: false, default: null })
  nok_surname?: string;

  @Prop({ required: false, default: null })
  nok_firstname?: string;

  @Prop({ required: false, default: null })
  nok_middlename?: string;
  @Prop({ required: false, default: null })
  nok_relationship?: string;
  @Prop({ required: false, default: null })
  nok_countryOfResidence?: string;
  @Prop({ required: false, default: null })
  nok_stateOfResidence?: string;
  @Prop({ required: false, default: null })
  nok_lgaOfResidence?: string;
  @Prop({ required: false, default: null })
  nok_cityOfResidence?: string;
  @Prop({ required: false, default: null })
  nok_address?: string;
}

export const NextOfKinSchema = SchemaFactory.createForClass(NextOfKin);
