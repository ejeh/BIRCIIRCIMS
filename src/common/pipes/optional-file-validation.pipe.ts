import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class OptionalFileValidationPipe implements PipeTransform {
  private readonly allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
  ];

  transform(file: Express.Multer.File) {
    // File is optional - skip validation if not provided
    if (!file) {
      return undefined;
    }

    // Validate if file is provided
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
    }

    return file;
  }
}
