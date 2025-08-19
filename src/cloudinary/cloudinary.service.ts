import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_url: process.env.CLOUDINARY_URL,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
    allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      //   'application/msword',
    ],
    maxSizeMB = 5,
  ): Promise<string> {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File exceeds max size of ${maxSizeMB}MB`);
    }

    const resource_type = file.mimetype === 'application/pdf' ? 'raw' : 'image';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type },
        (error: any, result: UploadApiResponse) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.result === 'ok');
        },
      );
    });
  }

  getFullPublicIdFromUrl(url: string): string | null {
    const parts = url.split('/');
    const folderIndex = parts.findIndex((part) =>
      part.includes('res.cloudinary.com'),
    );
    const folderParts = parts.slice(folderIndex + 3); // Skip domain and `image/upload`
    const [publicIdWithExt] = folderParts.slice(-1);
    const publicId = publicIdWithExt.replace(/\.(jpg|jpeg|png|pdf)$/, '');
    return folderParts.slice(0, -1).concat(publicId).join('/');
  }
}
