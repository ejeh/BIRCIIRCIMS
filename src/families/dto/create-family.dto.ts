import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFamilyDto {
  @ApiProperty({ example: 'Ogenyi Family', description: 'Family surname/name' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  familyName: string;

  @ApiProperty({ example: 'No. 23, Otukpo Road, Makurdi' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  address: string;

  @ApiProperty({ example: 'Benue' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: 'Makurdi' })
  @IsNotEmpty()
  @IsString()
  lga: string;

  @ApiProperty({ example: 'Ward 1' })
  @IsNotEmpty()
  @IsString()
  ward: string;

  @ApiProperty({ example: 'Zone A', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Gboko', required: false })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiProperty({ example: 'Mbakor', required: false })
  @IsOptional()
  @IsString()
  clan?: string;

  @ApiProperty({ example: 'Mbakor', required: false })
  @IsOptional()
  @IsString()
  kindred?: string;
}
