import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FamilyStatus } from '../enums/family.enum';

export class FamilyQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: FamilyStatus })
  @IsOptional()
  @IsEnum(FamilyStatus)
  status?: FamilyStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lga?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
