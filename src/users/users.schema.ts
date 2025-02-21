import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { UserPublicData } from './users.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { UserRole } from './users.role.enum';
import { NextOfKin, NextOfKinSchema } from './users.next-of-kin.schema';
import {
  EmploymentHistory,
  EmploymentHistorySchema,
} from './users.emploment.schema';
import { Business, BusinessSchema } from './users.business.schema';
import {
  EducationalHistory,
  EducationalHistorySchema,
} from './users.education.schema';
import { HealthInfo, HealthInfoSchema } from './users.health.schema';
import { Neighbor, NeighborSchema } from './users.neigbour.schema';
import { Family, FamilySchema } from './users.family.schema';

export type UserMethods = {
  getPublicData: () => UserPublicData;
};

export type UserDocument = User & Document & UserMethods;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class User {
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  email: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  firstname: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  lastname: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, require: false, default: null })
  middlename?: string;

  @ApiProperty()
  @Prop({ default: false })
  isActive: boolean;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Date, required: false, default: null })
  DOB?: Date;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  maritalStatus?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  gender?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  nationality?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  stateOfOrigin?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  lgaOfOrigin?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  stateOfResidence?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  lgaOfResidence?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  house_number?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  street_name?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  nearest_bus_stop_landmark?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  city_town?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  countryOfResidence?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  identification?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  id_number?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  issue_date?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  expiry_date?: string;

  @ApiProperty()
  @Prop({ required: false })
  passportPhoto: string; // File path or URL

  @ApiProperty()
  @Prop({ type: [NextOfKinSchema], required: false, default: null }) // Embed the next-of-kin schema
  nextOfKin?: NextOfKin[];

  @ApiProperty()
  @Prop({ type: [EmploymentHistorySchema], required: false, default: null }) // Embed the next-of-kin schema
  employmentHistory?: EmploymentHistory[]; // Array of employment histories

  @ApiProperty()
  @Prop({ type: [BusinessSchema], required: false, default: null }) // Embed the next-of-kin schema
  business?: Business[];

  @ApiProperty()
  @Prop({ type: EducationalHistorySchema, required: false, default: null }) // Embed the next-of-kin schema
  educationalHistory?: EducationalHistory;

  @ApiProperty()
  @Prop({ type: [HealthInfoSchema], required: false, default: null }) // Embed the next-of-kin schema
  healthInfo?: HealthInfo[];

  @ApiProperty()
  @Prop({ type: [NeighborSchema], required: false, default: null }) // Embed the next-of-kin schema
  neighbor?: Neighbor[];

  @ApiProperty()
  @Prop({ type: [FamilySchema], required: false, default: null }) // Embed the next-of-kin schema
  family?: Family[];

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
    required: true,
    unique: true,
  })
  phone: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  NIN: string;

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
    default: UserRole.USER,
  })
  role?: UserRole;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false, default: null })
  religion?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: false })
  community?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  password: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Boolean, default: false })
  isVerified: boolean;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  passwordResetToken: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  activationToken: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  activationExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

/**
 * Methods.
 */
UserSchema.methods.getPublicData = function () {
  const {
    id,
    email,
    firstname,
    lastname,
    role,
    LGA,
    address,
    phone,
    DOB,
    gender,
    nationality,
    stateOfOrigin,
    middlename,
  } = this;
  return {
    id,
    email,
    firstname,
    lastname,
    role,
    middlename,
    stateOfOrigin,
    gender,
    DOB,
    nationality,
    phone,
    LGA,
    address,
  };
};
