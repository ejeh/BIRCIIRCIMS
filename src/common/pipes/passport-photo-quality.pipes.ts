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
  private readonly SHARPNESS_THRESHOLD = 0;
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
        `Passport photo is too small. Minimum size is ${this.MIN_WIDTH}×${this.MIN_HEIGHT}px.`,
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
        'Passport photo is too blurry. Please upload a sharper photo.',
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
