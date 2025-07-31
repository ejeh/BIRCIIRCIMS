// biometric.controller.ts

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { BiometricsService } from './biometrics.service';

@Controller('api/biometric')
export class BiometricsController {
  constructor(private readonly biometricsService: BiometricsService) {}

  @Post('biometric-upload')
  @UseInterceptors(
    FileInterceptor('facialImage', {
      storage: diskStorage({
        destination: './uploads/biometric/',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          cb(null, filename);
        },
      }),
      // fileFilter: (req, file, cb) => {
      //   if (!file.mimetype.startsWith('image/')) {
      //     return cb(
      //       new BadRequestException('Only image files are allowed'),
      //       false,
      //     );
      //   }
      //   cb(null, true);
      // },

      // Remove the image validation since we're receiving encrypted binary data
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/octet-stream') {
          return cb(
            new BadRequestException('Only encrypted files allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
    }),
  )
  async uploadBiometric(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    console.log('Received body:', body);
    console.log('Received file:', file);
    if (!file) {
      throw new BadRequestException('Facial image is required.');
    }

    const { fingers, consent, userId, key, iv } = body;

    if (!consent || consent !== 'true') {
      throw new BadRequestException('Consent is required.');
    }

    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    if (!key || !iv) {
      throw new BadRequestException('Encryption key and IV are required.');
    }

    // let fingerprintObj: Record<string, string>;
    try {
      //   fingerprintObj = JSON.parse(fingers);
      //   if (!fingerprintObj || typeof fingerprintObj !== 'object') {
      //     throw new Error();
      //   }
      // } catch (err) {
      //   throw new BadRequestException('Valid fingerprint data is required.');
      // }

      // const fingerprints = Object.values(JSON.parse(fingers)) as string[];
      // const consentGiven = consent === 'true';
      // if (!userId) {
      //   throw new BadRequestException('User ID is required.');
      // }

      // if (fingerprints.length === 0) {
      //   throw new BadRequestException('At least one fingerprint is required.');
      // }

      // Decrypt the data
      const decryptedData = await this.biometricsService.decryptData({
        encryptedFacialImage: file.buffer,
        encryptedFingerprints: fingers,
        key,
        iv,
      });

      await this.biometricsService.saveBiometrics({
        // userId,
        // facialImagePath: file.path,
        // fingerprints,
        // consentGiven,
        userId,
        facialImagePath: decryptedData.facialImagePath,
        fingerprints: decryptedData.fingerprints,
        consentGiven: consent === 'true',
        key,
        iv,
      });

      return {
        // message: 'Biometric data uploaded successfully',
        // facialImage: file.filename,
        // fingerprintsReceived: fingerprints.length,
        message: 'Biometric data uploaded and decrypted successfully',
        facialImage: decryptedData.facialImagePath,
        fingerprintsReceived: decryptedData.fingerprints.length,
      };
    } catch (err) {
      throw new BadRequestException('Failed to decrypt biometric data');
    }
  }
}
