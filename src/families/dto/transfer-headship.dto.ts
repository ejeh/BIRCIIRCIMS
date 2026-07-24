import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferHeadshipDto {
  @ApiProperty({ example: 'new-head-user-id' })
  @IsNotEmpty()
  @IsString()
  newHeadId: string;
}
