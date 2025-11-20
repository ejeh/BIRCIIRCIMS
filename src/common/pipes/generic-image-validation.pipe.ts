// src/common/pipes/generic-image-validation.pipe.ts

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import sharp from 'sharp';
import { Express } from 'express';

@Injectable()
export class GenericImageValidationPipe implements PipeTransform {
  private readonly MIN_WIDTH = 300;
  private readonly MIN_HEIGHT = 300;

  async transform(
    value: Express.Multer.File | Express.Multer.File[] | undefined,
  ) {
    // 1. Handle the case where no files are uploaded at all.
    if (value === null || value === undefined) {
      return value;
    }

    // 2. Normalize the input to an array of files.
    const files = Array.isArray(value) ? value : [value];

    // 3. Find the FIRST image file in the array.
    const imageFile = files.find((file) => file.mimetype.startsWith('image/'));

    // 4. KEY FIX: If no image is found, PASS THROUGH the original file array.
    // Do not return the single file, return the entire array.
    if (!imageFile) {
      // There are no images to validate, so do nothing.
      return files; // <-- THE FIX
    }

    // 5. If an image IS found, validate it.
    try {
      const metadata = await sharp(imageFile.buffer).metadata();
      if (
        metadata.width < this.MIN_WIDTH ||
        metadata.height < this.MIN_HEIGHT
      ) {
        throw new BadRequestException(
          `Image is too small. Minimum dimensions are ${this.MIN_WIDTH}x${this.MIN_HEIGHT}px.`,
        );
      }
    } catch (error) {
      // If validation fails, throw an error. This will stop the chain.
      throw new BadRequestException(`Invalid image file: ${error.message}`);
    }

    // 6. If validation passes, return the ORIGINAL file array for the next pipe.
    // This is crucial for FileSizeValidationPipe to work correctly.
    return files; // <-- ALSO CRUCIAL
  }
}
