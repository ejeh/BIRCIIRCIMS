import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RelationshipType } from '../enums/family.enum';

export class AddMemberDto {
  @ApiProperty({ example: 'user-id' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'wife', enum: RelationshipType })
  @IsNotEmpty()
  @IsEnum(RelationshipType)
  relationship: RelationshipType;
}
