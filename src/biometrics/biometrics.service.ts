import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Biometric, BiometricDocument } from './biometrics.schema';
import { Model } from 'mongoose';
import { CreateBiometricDto } from './create-biometrics.dto';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class BiometricsService {
  constructor(
    @InjectModel(Biometric.name)
    private biometricModel: Model<BiometricDocument>,
  ) {}

  async decryptData(data: {
    encryptedFacialImage: Buffer;
    encryptedFingerprints: string;
    key: string;
    iv: string;
  }): Promise<{ facialImagePath: string; fingerprints: string[] }> {
    try {
      // Convert base64 strings back to buffers
      const keyBuffer = Buffer.from(data.key, 'base64');
      const ivBuffer = Buffer.from(data.iv, 'base64');
      const encryptedFingersBuffer = Buffer.from(
        data.encryptedFingerprints,
        'base64',
      );

      // Decrypt fingerprints
      const decipherFingers = crypto.createDecipheriv(
        'aes-256-gcm',
        keyBuffer,
        ivBuffer,
      );
      let decryptedFingers = decipherFingers.update(encryptedFingersBuffer);
      decryptedFingers = Buffer.concat([
        decryptedFingers,
        decipherFingers.final(),
      ]);
      const fingerprints = JSON.parse(decryptedFingers.toString());

      // Decrypt facial image
      const decipherImage = crypto.createDecipheriv(
        'aes-256-gcm',
        keyBuffer,
        ivBuffer,
      );
      let decryptedImage = decipherImage.update(data.encryptedFacialImage);
      decryptedImage = Buffer.concat([decryptedImage, decipherImage.final()]);

      // Save the decrypted image to disk
      const imageFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const imagePath = path.join('./uploads/biometric/', imageFilename);
      fs.writeFileSync(imagePath, decryptedImage);

      return {
        facialImagePath: imagePath,
        fingerprints: Object.values(fingerprints),
      };
    } catch (err) {
      throw new Error('Decryption failed: ' + err.message);
    }
  }

  async saveBiometrics(data: any): Promise<Biometric> {
    const newBiometric = new this.biometricModel(data);
    return await newBiometric.save();
  }

  async findByUser(userId: string): Promise<Biometric | null> {
    return this.biometricModel.findOne({ userId });
  }
}
