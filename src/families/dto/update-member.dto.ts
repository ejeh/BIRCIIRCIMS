import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RelationshipType, MemberStatus } from '../enums/family.enum';

export class UpdateMemberDto {
  @ApiProperty({ required: false, enum: RelationshipType })
  @IsOptional()
  @IsEnum(RelationshipType)
  relationship?: RelationshipType;

  @ApiProperty({ required: false, enum: MemberStatus })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  permissions?: string[];
}
