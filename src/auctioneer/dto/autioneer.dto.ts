import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}
export class UpdateAuctioneerDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  NIN?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  LGA?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  taxClearance?: string;
}

export class CreateAuctioneerDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  NIN: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  LGA: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  taxClearance?: string;
}

export class ReprintResponseDto {
  success: boolean;
  message: string;
  data: {
    paymentReference: string;
    amount: number;
    skipCredo: boolean; // Ensure this is here!
  };
}

// dto/confirm-reprint-payment.dto.ts
export class ConfirmReprintPaymentDto {
  @IsString()
  paymentReference: string;

  @IsString()
  rrr: string;
}

export class ConfirmReprintResponseDto {
  success: boolean;
  message: string;
  downloadUrl: string;
  expiryDate: Date;
}

// dto/confirm-reprint-payment.dto.ts
export class VerifyPaymentDto {
  @IsString()
  paymentReference: string;

  @IsString()
  rrr: string;
}
