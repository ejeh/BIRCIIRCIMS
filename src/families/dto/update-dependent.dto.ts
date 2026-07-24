import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RelationshipType } from '../enums/family.enum';

export class UpdateDependentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  birthCertificateNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stateOfOrigin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lgaOfOrigin?: string;

  @ApiProperty({ required: false, enum: RelationshipType })
  @IsOptional()
  @IsEnum(RelationshipType)
  relationship?: RelationshipType;
}
