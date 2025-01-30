import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define the main schema for a person's educational background
@Schema()
export class EducationalBackground extends Document {
  @Prop({ required: true })
  highestEducationLevel: string; // e.g., Bachelor's, Master's, etc.

  @Prop({ required: true })
  institutionAttended: string;

  @Prop({ required: true })
  graduationYear: number;
}

// Create a schema for EducationalBackground
export const EducationalBackgroundSchema = SchemaFactory.createForClass(
  EducationalBackground,
);
