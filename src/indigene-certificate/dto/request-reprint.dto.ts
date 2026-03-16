// dto/request-reprint.dto.ts

import { IsString, IsBoolean, IsNumber } from 'class-validator';

export class RequestReprintDto {
  @IsString()
  certificateId: string;
}

// dto/confirm-reprint-payment.dto.ts
export class ConfirmReprintPaymentDto {
  @IsString()
  paymentReference: string;
  @IsString()
  rrr: string;
}

// dto/payment-response.dto.ts
export class PaymentResponseDto {
  @IsBoolean()
  success: boolean;
  @IsString()
  paymentReference: string;
  @IsNumber()
  amount: number;
  @IsString()
  message: string;
  @IsString()
  paymentUrl?: string;
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
