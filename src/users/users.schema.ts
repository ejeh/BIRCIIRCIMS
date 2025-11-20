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
import {
  RoleAssignment,
  RoleAssignmentSchema,
} from './users.role-assiggnment.schema';

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
  @Prop({ type: mongoose.SchemaTypes.String })
  DOB?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  maritalStatus?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  gender?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  nationality?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  stateOfOrigin?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  lgaOfOrigin?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  stateOfResidence?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  lgaOfResidence?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  house_number?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  street_name?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  nearest_bus_stop_landmark?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  city_town?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  countryOfResidence?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  identification?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, unique: true })
  id_number?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  issue_date?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  expiry_date?: string;

  @ApiProperty()
  @Prop({ required: false })
  passportPhoto: string; // File path or URL

  @ApiProperty()
  @Prop({ type: [NextOfKinSchema] }) // Embed the next-of-kin schema
  nextOfKin?: NextOfKin[];

  @ApiProperty()
  @Prop({ type: [EmploymentHistorySchema] }) // Embed the next-of-kin schema
  employmentHistory?: EmploymentHistory[]; // Array of employment histories

  @ApiProperty()
  @Prop({ type: [BusinessSchema] }) // Embed the next-of-kin schema
  business?: Business[];

  @ApiProperty()
  @Prop({ type: [EducationalHistorySchema] }) // Embed the next-of-kin schema
  educationalHistory?: EducationalHistory[];

  @ApiProperty()
  @Prop({ type: HealthInfoSchema }) // Embed the next-of-kin schema
  healthInfo?: HealthInfo;

  @ApiProperty()
  @Prop({ type: [NeighborSchema] }) // Embed the next-of-kin schema
  neighbor?: Neighbor[];

  @ApiProperty()
  @Prop({ type: [FamilySchema] }) // Embed the next-of-kin schema
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
  @Prop({ type: mongoose.SchemaTypes.String })
  religion?: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  community?: string;

  @Prop({ type: mongoose.SchemaTypes.String })
  kindred: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  password: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Boolean })
  isVerified: boolean;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  passwordResetToken: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  passwordResetExpires: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  activationToken: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  activationExpires: Date;

  @Prop({ type: Boolean, default: false })
  isProfileCompleted: boolean;

  @Prop({ type: Number, default: 0 })
  profileCompletionPercentage: number;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Lga', required: false })
  lga?: string; // which LGA this admin/manager is assigned to

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop({ type: mongoose.SchemaTypes.String })
  twoFactorSecret: string;

  @Prop({ type: [String] })
  backupCodes: string[];

  created_at?: Date;
  updated_at?: Date;

  @Prop({ type: [RoleAssignmentSchema] })
  roleHistory?: RoleAssignment[];

  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: 'User' })
  assignedBy?: mongoose.Types.ObjectId;
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
    created_at,
    lga,
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
    created_at,
    lga,
  };
};
