import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RelationshipType } from '../enums/family.enum';

export class InviteMemberDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsString()
  receiverEmail: string;

  @ApiProperty({ example: 'brother', enum: RelationshipType })
  @IsNotEmpty()
  @IsEnum(RelationshipType)
  relationship: RelationshipType;

  @ApiProperty({ example: 'Please join our family account', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
