import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Enum for blood group
export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

// Enum for genotype
export enum Genotype {
  AA = 'AA',
  AS = 'AS',
  SS = 'SS',
  AC = 'AC',
}

// Enum for disability status
export enum DisabilityStatus {
  NONE = 'none',
  PHYSICAL = 'physical',
  VISUAL = 'visual',
  HEARING = 'hearing',
  MENTAL = 'mental',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class HealthInfo extends Document {
  @Prop({
    type: String,
    required: false,
  })
  bloodGroup: BloodGroup;

  @Prop({ type: String })
  genotype: Genotype;

  @Prop({ type: String })
  medical_condition;

  @Prop({
    type: String,
    default: DisabilityStatus.NONE,
  })
  disabilityStatus: DisabilityStatus;
}

export const HealthInfoSchema = SchemaFactory.createForClass(HealthInfo);
