import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserPublicData {
  @ApiProperty({})
  firstname: string;

  @ApiProperty({})
  lastname: string;

  @ApiProperty({})
  middlename: string;

  @ApiProperty({})
  DOB: string;

  @ApiProperty({})
  phone: number;

  @ApiProperty({})
  community: string;

  @ApiProperty({})
  religion: string;

  @ApiProperty({})
  stateOfOrigin: string;

  @ApiProperty({})
  email: string;

  @ApiProperty({})
  nationality: string;

  @ApiProperty({})
  gender: string;

  @ApiProperty({})
  maritalStatus: string;

  @ApiProperty({})
  nextOfKin: string;

  @ApiProperty({})
  employmentHistory: string;

  @ApiProperty({})
  business: string;

  @ApiProperty({})
  educationalHistory: string;

  @ApiProperty({})
  healthInfo: string;

  @ApiProperty({})
  role: string;

  @ApiProperty({})
  NIN: number;

  @ApiProperty({})
  house_number: string;

  @ApiProperty({})
  street_name: string;

  @ApiProperty({})
  nearest_bus_stop_landmark: string;

  @ApiProperty({})
  city_town: string;

  @ApiProperty({})
  countryOfResidence: string;

  @ApiProperty({})
  identification: string;

  @ApiProperty({})
  id_number: string;

  @ApiProperty({})
  issue_date: string;

  @ApiProperty({})
  expiry_date: string;

  @ApiProperty({})
  TIN: string;

  @ApiProperty({})
  stateOfResidence: string;

  @ApiProperty({})
  lgaOfResidence: string;

  @ApiProperty({})
  lgaOfOrigin: string;

  @ApiProperty({})
  created_at: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly passportPhoto?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly lastname?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly community?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly religion?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly middlename?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly house_number?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly maritalStatus?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly lgaOfOrigin?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly stateOfOrigin?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly street_name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly nearest_bus_stop_landmark?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly city_town?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly countryOfResidence?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly address?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly nationality?: string;

  // @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly DOB?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly gender?: string;

  @IsOptional()
  @ApiProperty({})
  readonly nextOfKin?: string;

  @IsOptional()
  @ApiProperty({})
  readonly employmentHistory?: string;

  @IsOptional()
  @ApiProperty({})
  readonly business?: string;

  @IsOptional()
  @ApiProperty({})
  readonly neighbor?: string;

  @IsOptional()
  @ApiProperty({})
  readonly educationalHistory?: string;

  @IsOptional()
  @ApiProperty({})
  readonly healthInfo?: string;

  @IsOptional()
  @ApiProperty({})
  readonly family?: string;

  @IsOptional()
  @ApiProperty({})
  readonly identification?: string;

  @IsOptional()
  @ApiProperty({})
  readonly id_number?: string;

  @IsOptional()
  @ApiProperty({})
  readonly issue_date?: string;

  @IsOptional()
  @ApiProperty({})
  readonly expiry_date?: string;

  @IsOptional()
  @ApiProperty({})
  readonly stateOfResidence?: string;

  @IsOptional()
  @ApiProperty({})
  readonly lgaOfResidence?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({})
  @IsString()
  @IsOptional()
  role: string;
}

export class VerifyReferenceDto {
  @IsBoolean()
  knowsApplicant: boolean;

  @IsOptional()
  @IsString()
  knownDuration?: string;

  @IsOptional()
  @IsBoolean()
  isResident?: boolean;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class VerificationStatusDto {
  verified: number;
  denied: number;
  pending: number;
  total: number;
  isVerified: boolean;
  references: any[];
}
