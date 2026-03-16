import { HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileUploadConfig } from 'src/config/file-upload.config';

export function createFileUploadInterceptor(
  fieldName: string,
  config = fileUploadConfig,
) {
  return FileInterceptor(fieldName, {
    limits: { fileSize: config.maxSize },
    fileFilter: (req, file, cb) => {
      if (config.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new HttpException('Invalid file type', HttpStatus.BAD_REQUEST),
          false,
        );
      }
    },
  });
}
