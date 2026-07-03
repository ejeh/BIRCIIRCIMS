// src/transaction/dto/get-transactions-report.dto.ts
import {
  IsOptional,
  IsString,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class GetTransactionsReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class RejectReceiptDto {
  @IsNotEmpty({ message: 'A rejection reason is required' })
  @IsString()
  reason: string;
}
