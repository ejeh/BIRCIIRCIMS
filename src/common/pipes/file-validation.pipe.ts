// src/common/pipes/file-validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { extname } from 'path';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly allowedExtensions: string[] = [
      '.jpg',
      '.jpeg',
      '.png',
      '.pdf',
    ],
    private readonly maxSize: number = 5 * 1024 * 1024, // 5MB
  ) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const file = value;

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileExtension = extname(file.originalname).toLowerCase();

    if (!this.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File type ${fileExtension} is not allowed. Allowed types: ${this.allowedExtensions.join(', ')}`,
      );
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `File size ${file.size} exceeds maximum allowed size of ${this.maxSize} bytes`,
      );
    }

    return file;
  }
}
