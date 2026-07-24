import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectInvitationDto {
  @ApiProperty({ example: 'invitation-token-value' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'I am not related to this family', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
