import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../enums/family.enum';

export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
