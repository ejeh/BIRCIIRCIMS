import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateIdCardDto {
  @IsOptional()
  @IsString()
  @IsIn(['utilityBill', 'ref_letter', 'passportPhoto'], {
    message:
      'documentTypeToUpdate must be one of: idCard, birthCertificate, passportPhoto',
  })
  documentTypeToUpdate?: 'utilityBill' | 'ref_letter' | 'passportPhoto';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @IsString()
  lastname?: string;
}

export interface ResubmittableDocument {
  status: string;
  resubmissionAllowed: boolean;
  resubmissionAttempts: number;
  lastResubmittedAt?: Date;
}
