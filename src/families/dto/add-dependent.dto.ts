import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RelationshipType } from '../enums/family.enum';

export class AddDependentDto {
  @ApiProperty({ example: 'Child' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Ogenyi' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: '2018-05-15' })
  @IsNotEmpty()
  @IsDateString()
  dob: string;

  @ApiProperty({ example: 'Male' })
  @IsNotEmpty()
  @IsString()
  gender: string;

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

  @ApiProperty({ example: 'son', enum: RelationshipType })
  @IsNotEmpty()
  @IsEnum(RelationshipType)
  relationship: RelationshipType;
}
