import { IsString, IsOptional, MaxLength, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserPublicData {
  @ApiProperty({})
  userId: string;

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

  // @ApiProperty({})
  // LGA: string;

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
  occupation: string;

  @ApiProperty({})
  business: string;

  @ApiProperty({})
  education: string;

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
  country: string;

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
  readonly country?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly address?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  readonly nationality?: string;

  @IsString()
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
  readonly occupation?: string;

  @IsOptional()
  @ApiProperty({})
  readonly business?: string;

  @IsOptional()
  @ApiProperty({})
  readonly neighbor?: string;

  @IsOptional()
  @ApiProperty({})
  readonly education?: string;

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
