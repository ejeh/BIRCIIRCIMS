import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserPublicData } from 'src/users/users.dto';

export class SignUpDto {
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
  readonly middlename!: string;

  @IsNotEmpty()
  @ApiProperty({})
  readonly DOB!: string;

  @IsNotEmpty()
  @MaxLength(11)
  @ApiProperty({})
  readonly phone!: number;

  @IsNotEmpty()
  @MaxLength(11)
  @ApiProperty({})
  readonly NIN!: string;

  @ApiProperty({
    example: 'email@gmail.com',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'password', minLength: 8 })
  @MinLength(8)
  readonly password!: string;

  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({})
  readonly stateOfOrigin!: string;

  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({})
  readonly lgaOfOrigin!: string;
}

export class AdminSignUpDto {
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
  readonly middlename!: string;

  @IsNotEmpty()
  @ApiProperty({})
  readonly DOB!: string;

  @IsNotEmpty()
  @MaxLength(11)
  @ApiProperty({})
  readonly phone!: number;

  @IsNotEmpty()
  @MaxLength(11)
  @ApiProperty({})
  readonly NIN!: number;

  @ApiProperty({
    example: 'email@gmail.com',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email!: string;

  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({})
  readonly stateOfOrigin!: string;

  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({})
  readonly lgaOfOrigin!: string;

  @IsOptional()
  @ApiProperty({})
  readonly role?: string;
}

export class ActivateParams {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly userId!: string;

  @ApiProperty({ type: String })
  @IsUUID()
  readonly activationToken!: string;
}

export class AuthenticatedUser {
  @ApiProperty({})
  token: string;
  user: UserPublicData;
}

export class LoginDto {
  @ApiProperty({ example: 'email@email.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({ example: 'password', minLength: 8 })
  @MinLength(8)
  readonly password!: string;
}

export class ForgottenPasswordDto {
  @ApiProperty({ example: 'email@email.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'email@email.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({ example: 'password', minLength: 8 })
  @MinLength(8)
  readonly password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'password', minLength: 8 })
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({ example: 'password', minLength: 8 })
  @MinLength(8)
  newPassword: string;
}

// src/auth/dto/verify-2fa.dto.ts
export class Verify2FADto {
  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6, description: '6-digit TOTP code from authenticator app' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @Matches(/^\d{6}$/, { message: 'Code must be exactly 6 digits' })
  @IsNotEmpty()
  readonly code: string;
}

export class Login2FADto {
  @ApiProperty({ description: 'Temporary token from login when 2FA is required' })
  @IsString()
  @IsNotEmpty()
  readonly tempToken: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6, description: '6-digit TOTP code or backup code' })
  @IsString()
  @IsNotEmpty()
  readonly code: string;
}
