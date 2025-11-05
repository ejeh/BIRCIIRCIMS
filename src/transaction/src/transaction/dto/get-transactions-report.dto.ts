// src/transaction/dto/get-transactions-report.dto.ts
import { IsOptional, IsString, IsDateString } from 'class-validator';

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
