import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'invitation-token-value' })
  @IsNotEmpty()
  @IsString()
  token: string;
}
