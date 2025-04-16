import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SigUpKindredDto {
  @MaxLength(255)
  @ApiProperty({})
  readonly userId!: string;

  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({})
  readonly firstname!: string;

  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({})
  readonly lastname!: string;

  @MaxLength(255)
  @ApiProperty({})
  readonly address!: string;

  @IsNotEmpty()
  @MaxLength(11)
  @ApiProperty({})
  readonly phone!: number;

  @IsNotEmpty()
  @MaxLength(11)
  @ApiProperty({})
  readonly NIN!: number;

  @ApiProperty({})
  @MaxLength(255)
  readonly kindred!: string;

  @MaxLength(255)
  @ApiProperty({})
  readonly lga!: string;

  @MaxLength(255)
  @ApiProperty({})
  readonly stateOfOrigin!: string;

  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({})
  readonly lgaOfOrigin!: string;

  @ApiProperty({ example: 'email@email.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({ example: 'password', minLength: 8 })
  @MinLength(8)
  readonly password!: string;
}

export class UpdateKindredDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({})
  readonly firstname?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({})
  readonly lastname?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({})
  readonly address?: string;

  @IsOptional()
  @MaxLength(11)
  @ApiProperty({})
  readonly phone?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({})
  readonly kindred?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({})
  readonly lga?: string;

  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({})
  readonly stateOfOrigin!: string;
}
