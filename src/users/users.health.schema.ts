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
  NONE = 'None',
  PHYSICAL = 'Physical',
  VISUAL = 'Visual',
  HEARING = 'Hearing',
  MENTAL = 'Mental',
  OTHER = 'Other',
}

@Schema({ timestamps: true })
export class HealthInfo extends Document {
  @Prop({
    type: String,
    enum: BloodGroup,
    required: false,
    default: null,
  })
  bloodGroup: BloodGroup;

  @Prop({ type: String, enum: Genotype, required: false, default: null })
  genotype: Genotype;

  @Prop({
    type: String,
    enum: DisabilityStatus,
    default: DisabilityStatus.NONE,
  })
  disabilityStatus: DisabilityStatus;
}

export const HealthInfoSchema = SchemaFactory.createForClass(HealthInfo);
