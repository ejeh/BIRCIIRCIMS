// import {
//   PipeTransform,
//   Injectable,
//   ArgumentMetadata,
//   BadRequestException,
// } from '@nestjs/common';
// import sharp from 'sharp';
// import { Express } from 'express';

// // Define an interface for the pipe options for better type safety
// export interface PassportPhotoQualityPipeOptions {
//   isOptional?: boolean;
// }

// @Injectable()
// export class PassportPhotoQualityPipe implements PipeTransform {
//   // --- TUNABLE THRESHOLDS ---
//   private readonly MIN_WIDTH = 350;
//   private readonly MIN_HEIGHT = 450;
//   private readonly SHARPNESS_THRESHOLD = 60;
//   private readonly BRIGHTNESS_MIN = 80;
//   private readonly BRIGHTNESS_MAX = 200;

//   private readonly options: PassportPhotoQualityPipeOptions;

//   // The constructor now accepts options
//   constructor(options: PassportPhotoQualityPipeOptions = {}) {
//     // Set default values for the options
//     this.options = { isOptional: false, ...options };
//   }

//   async transform(
//     value: Express.Multer.File | Express.Multer.File[] | undefined,
//     metadata: ArgumentMetadata,
//   ) {
//     // If value is null or undefined, handle it immediately.
//     // if (!value) {
//     //   if (this.options.isOptional) {
//     //     return value;
//     //   }
//     //   throw new BadRequestException('No files were uploaded.');
//     // }

//     // If no file is provided, handle it based on the 'isOptional' flag.
//     if (value === null || value === undefined) {
//       if (this.options.isOptional) {
//         return value; // Return undefined, which is fine for an optional file.
//       }
//       // If it's not optional, it's an error.
//       throw new BadRequestException('File upload is required.');
//     }

//     // Normalize the input into an array, regardless of what's received.
//     let filesToProcess: Express.Multer.File[] = [];
//     if (Array.isArray(value)) {
//       // Case 1: An array of files was received.
//       filesToProcess = value;
//     } else if (value && typeof value === 'object' && value.fieldname) {
//       // Case 2: A single file object was received.
//       filesToProcess = [value];
//     }

//     // Now, proceed with the logic using the normalized `filesToProcess` array.
//     const passportPhoto = filesToProcess.find(
//       (file) => file.fieldname === 'passportPhoto',
//     );

//     // If no passportPhoto was found...
//     if (!passportPhoto) {
//       // ...and it's marked as optional, just return.
//       if (this.options.isOptional) {
//         return value; // Return the original value
//       }
//       // ...otherwise, it's required, so throw an error.
//       throw new BadRequestException('Passport photo is required.');
//     }

//     // If a passportPhoto WAS found, it must be validated.
//     const imageBuffer = passportPhoto.buffer;

//     await this.checkDimensions(imageBuffer);
//     await this.checkSharpness(imageBuffer);
//     await this.checkBrightness(imageBuffer);

//     // Return the original, unmodified value
//     return value;
//   }

//   private async checkDimensions(buffer: Buffer) {
//     const metadata = await sharp(buffer).metadata();
//     if (!metadata.width || !metadata.height) {
//       throw new BadRequestException('Could not determine image dimensions.');
//     }
//     if (metadata.width < this.MIN_WIDTH || metadata.height < this.MIN_HEIGHT) {
//       throw new BadRequestException(
//         `Image is too small. Minimum dimensions are ${this.MIN_WIDTH}x${this.MIN_HEIGHT}px.`,
//       );
//     }
//   }

//   private async checkSharpness(buffer: Buffer) {
//     const data = await sharp(buffer)
//       .greyscale()
//       .convolve({
//         width: 3,
//         height: 3,
//         kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0],
//       })
//       .raw()
//       .toBuffer();

//     const mean = this.calculateMean(data);
//     const variance = this.calculateVariance(data, mean);

//     if (variance < this.SHARPNESS_THRESHOLD) {
//       throw new BadRequestException(
//         'Image is too blurry. Please upload a sharper photo.',
//       );
//     }
//   }

//   private async checkBrightness(buffer: Buffer) {
//     const stats = await sharp(buffer).greyscale().stats();
//     if (
//       !stats.channels ||
//       stats.channels.length === 0 ||
//       typeof stats.channels[0].mean !== 'number'
//     ) {
//       throw new BadRequestException('Could not determine image brightness.');
//     }
//     const mean = stats.channels[0].mean;

//     if (mean < this.BRIGHTNESS_MIN || mean > this.BRIGHTNESS_MAX) {
//       throw new BadRequestException(
//         `Image brightness is not acceptable. It's too ${
//           mean < this.BRIGHTNESS_MIN ? 'dark' : 'bright'
//         }.`,
//       );
//     }
//   }

//   private calculateMean(data: Buffer): number {
//     let sum = 0;
//     for (let i = 0; i < data.length; i++) {
//       sum += data[i];
//     }
//     return sum / data.length;
//   }

//   private calculateVariance(data: Buffer, mean: number): number {
//     let sumOfSquares = 0;
//     for (let i = 0; i < data.length; i++) {
//       sumOfSquares += Math.pow(data[i] - mean, 2);
//     }
//     return sumOfSquares / data.length;
//   }
// }

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import sharp from 'sharp';
import { Express } from 'express';

export interface PassportPhotoQualityPipeOptions {
  isOptional?: boolean;
}

@Injectable()
export class PassportPhotoQualityPipe implements PipeTransform {
  private readonly MIN_WIDTH = 350;
  private readonly MIN_HEIGHT = 450;
  private readonly SHARPNESS_THRESHOLD = 60;
  private readonly BRIGHTNESS_MIN = 80;
  private readonly BRIGHTNESS_MAX = 200;

  constructor(
    private readonly options: PassportPhotoQualityPipeOptions = {
      isOptional: true, // ✔ DEFAULT: optional
    },
  ) {}

  async transform(
    value: Express.Multer.File | Express.Multer.File[] | undefined,
    metadata: ArgumentMetadata,
  ) {
    // If no file provided
    if (!value) {
      // Optional? → allow.
      if (this.options.isOptional) return value;

      // Not optional? → error.
      throw new BadRequestException('Passport photo is required.');
    }

    // Normalize to array
    let files: Express.Multer.File[] = [];
    if (Array.isArray(value)) {
      files = value;
    } else if (value.fieldname) {
      files = [value];
    }

    const passportPhoto = files.find(
      (file) => file.fieldname === 'passportPhoto',
    );

    // No passportPhoto uploaded?
    if (!passportPhoto) {
      if (this.options.isOptional) {
        // ✔ Allow empty uploads
        return value;
      } else {
        throw new BadRequestException('Passport photo is required.');
      }
    }

    // Passport photo exists → validate it
    const buffer = passportPhoto.buffer;

    await this.checkDimensions(buffer);
    await this.checkSharpness(buffer);
    await this.checkBrightness(buffer);

    return value;
  }

  private async checkDimensions(buffer: Buffer) {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('Could not determine image dimensions.');
    }
    if (metadata.width < this.MIN_WIDTH || metadata.height < this.MIN_HEIGHT) {
      throw new BadRequestException(
        `Image is too small. Minimum size is ${this.MIN_WIDTH}×${this.MIN_HEIGHT}px.`,
      );
    }
  }

  private async checkSharpness(buffer: Buffer) {
    const data = await sharp(buffer)
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0],
      })
      .raw()
      .toBuffer();

    const mean = this.calculateMean(data);
    const variance = this.calculateVariance(data, mean);

    if (variance < this.SHARPNESS_THRESHOLD) {
      throw new BadRequestException(
        'Image is too blurry. Please upload a sharper photo.',
      );
    }
  }

  private async checkBrightness(buffer: Buffer) {
    const stats = await sharp(buffer).greyscale().stats();
    const mean = stats.channels?.[0]?.mean;

    if (typeof mean !== 'number') {
      throw new BadRequestException('Could not determine image brightness.');
    }

    if (mean < this.BRIGHTNESS_MIN || mean > this.BRIGHTNESS_MAX) {
      throw new BadRequestException(
        `Image brightness is not acceptable. It's too ${
          mean < this.BRIGHTNESS_MIN ? 'dark' : 'bright'
        }.`,
      );
    }
  }

  private calculateMean(data: Buffer): number {
    return data.reduce((acc, val) => acc + val, 0) / data.length;
  }

  private calculateVariance(data: Buffer, mean: number): number {
    return (
      data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length
    );
  }
}
