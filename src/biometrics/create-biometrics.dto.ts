import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsMongoId,
  IsString,
} from 'class-validator';

export class CreateBiometricDto {
  @IsMongoId()
  userId: string;

  @IsString()
  @IsNotEmpty()
  facialImagePath: string;

  @IsArray()
  fingerprints: string[];

  @IsBoolean()
  consentGiven: boolean;

  @IsNotEmpty()
  key: string; // Encryption key (base64)

  @IsNotEmpty()
  iv: string; // Initialization vector (base64)
}
