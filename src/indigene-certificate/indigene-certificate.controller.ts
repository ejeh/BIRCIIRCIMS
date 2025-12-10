import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Patch,
  Req,
  Query,
  UploadedFile,
  Delete,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserNotFoundException } from 'src/common/exception';

import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { IndigeneCertificateService } from './indigene-certificate.service';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/users/users.role.enum';
import { Certificate } from './indigene-certicate.schema';
import { UsersService } from 'src/users/users.service';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import path, { extname, join } from 'path';
import QRCode from 'qrcode';
import config from 'src/config';
import { Public } from 'src/common/decorators/public.decorator';
import * as crypto from 'crypto';
import { Throttle } from '@nestjs/throttler';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import axios, { AxiosResponse } from 'axios';
import { FileSizeValidationPipe } from '../common/pipes/file-size-validation.pipe';
import { PassportPhotoQualityPipe } from 'src/common/pipes/passport-photo-quality.pipes';
import {
  CreateCertificateDto,
  UpdateCertificateDto,
} from './dto/update-certificate.dto';

@ApiTags('indigene-certificate.controller')
@UseGuards(JwtAuthGuard)
@Controller('api/indigene/certificate')
export class IndigeneCertificateController {
  constructor(
    private readonly indigeneCertificateService: IndigeneCertificateService,
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly httpService: HttpService,
  ) {}

  @Post('create')
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const fieldTypeRules = {
          passportPhoto: {
            mime: ['image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.jpeg', '.jpg', '.png'],
            message: 'Passport Photo must be an image (.jpg, .jpeg, .png)',
          },
          idCard: {
            mime: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.pdf', '.jpeg', '.jpg', '.png'],
            message: 'ID Card must be an image or a PDF file',
          },
          birthCertificate: {
            mime: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.pdf', '.jpeg', '.jpg', '.png'],
            message: 'Birth Certificate must be an image or a PDF file',
          },
        };

        const rules = fieldTypeRules[file.fieldname];
        const ext = extname(file.originalname).toLowerCase();

        if (!rules) {
          return cb(
            new BadRequestException(`Unexpected file field: ${file.fieldname}`),
            false,
          );
        }

        const isValidMime = rules.mime.includes(file.mimetype);
        const isValidExt = rules.ext.includes(ext);

        if (!isValidMime || !isValidExt) {
          return cb(new BadRequestException(rules.message), false);
        }

        cb(null, true);
      },
    }),
  )
  async createCertificate(
    // ✅ 2. USE THE DTO HERE. This is the most important change.
    @Body() createCertificateDto: CreateCertificateDto,
    @UploadedFiles(
      new PassportPhotoQualityPipe(),
      new FileSizeValidationPipe({
        passportPhoto: { maxSize: 2 * 1024 * 1024 },
        idCard: { maxSize: 3 * 1024 * 1024 },
        birthCertificate: { maxSize: 5 * 1024 * 1024 },
      }),
    )
    files: Array<Express.Multer.File>,
    @Req() req,
  ) {
    // 1. Validate business rules first
    await this.indigeneCertificateService.canUserCreateCertificate(req.user.id);

    // 2. Map files by fieldname
    const fileMap = files.reduce(
      (acc, file) => ({ ...acc, [file.fieldname]: file }),
      {},
    );

    // 3. Define required document fields and their Cloudinary folders
    const documentConfig = {
      passportPhoto: 'certificates/passport',
      idCard: 'certificates/idcard',
      birthCertificate: 'certificates/birthcert',
    };

    // 4. Dynamically upload all required files
    const uploadPromises = Object.entries(documentConfig).map(
      async ([fieldName, folder]) => {
        if (!fileMap[fieldName]) {
          throw new BadRequestException(`${fieldName} file is required.`);
        }
        return this.cloudinaryService.uploadFile(fileMap[fieldName], folder);
      },
    );

    const [passportPhotoUrl, idCardUrl, birthCertificateUrl] =
      await Promise.all(uploadPromises);

    // 5. Create the FINAL data object to save to the database
    const dataToSave = {
      ...createCertificateDto, // Spread the validated text fields from the DTO
      refNumber: uuid(),
      // Add the newly uploaded file URLs
      passportPhoto: passportPhotoUrl,
      idCard: idCardUrl,
      birthCertificate: birthCertificateUrl,
    };

    // 6. Call the service with the complete data object
    return this.indigeneCertificateService.createCertificate(
      dataToSave,
      req.user.id,
    );
  }

  // Step 2: Download attestation template
  @Get('download/attestation/:id')
  async downloadTemplate(@Param('id') id: string, @Res() res: Response) {
    return this.indigeneCertificateService.getAttestationTemplate(id, res);
  }

  // Step 3: Upload signed attestation
  @Post('upload/attestation/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadAttestation(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.indigeneCertificateService.uploadAttestation(id, file);
  }

  @Public()
  @Get('download/:id')
  @ApiResponse({ type: Certificate, isArray: false })
  async downloadCertificate(@Param('id') id: string, @Res() res: Response) {
    try {
      const certificate =
        await this.indigeneCertificateService.findCertificateById(id);

      const user = await this.userService.findById(certificate.userId);

      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      // If already downloaded before → check expiry
      if (certificate.downloaded) {
        const now = new Date();

        if (
          !certificate.downloadExpiryDate ||
          certificate.downloadExpiryDate < now
        ) {
          return res.status(400).json({
            message:
              'Download window has expired. Please request a new certificate.',
          });
        }
      } else {
        // First-time download → activate 3 months window
        certificate.downloaded = true;
        // certificate.downloadExpiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for testing
        certificate.downloadExpiryDate = new Date(
          Date.now() + 3 * 30 * 24 * 60 * 60 * 1000, // 3 months
        );
        await certificate.save();
      }

      const dateOfIssue = new Date();

      const formattedDate = dateOfIssue.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      // 1. Generate hash
      const hash = this.generateSecureHash(
        certificate.id,
        user.firstname,
        user.lastname,
        dateOfIssue, // Or use your certificate's issue date
      );

      const getBaseUrl = (): string =>
        config.isDev
          ? process.env.BASE_URL || 'http://localhost:5000'
          : 'https://api.citizenship.benuestate.gov.ng';

      // 2. Create QR Code URL
      const certificateQrCodeData = `${getBaseUrl()}/api/indigene/certificate/view/${id}`;
      const qrCodeUrl = await this.generateQrCode(certificateQrCodeData); // Generate QR code URL
      certificate.qrCodeUrl = qrCodeUrl; // Save the QR code URL in the certificate

      const htmlTemplate = await this.loadHtmlTemplate(
        'certificate-template.html',
      );
      const populatedHtml = this.populateHtmlTemplate(
        htmlTemplate,
        certificate,
        user,
      );

      const pdfPath =
        await this.indigeneCertificateService.generateCertificatePDF(
          id,
          populatedHtml,
        );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=certificate.pdf',
      );

      // Stream the file instead of reading it fully into memory
      res.download(pdfPath, 'certificate.pdf', async (err) => {
        if (err) {
          console.error('Error sending file:', err);
          return; // return res.status(500).json({ message: 'Error downloading file' });
        }

        // Mark as downloaded and delete temp file after sending
        await this.markCertificateAsDownloaded(id);
        await this.indigeneCertificateService.saveVerificationHash(id, hash);
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  private generateSecureHash(
    id: string,
    firstname: string,
    lastname: string,
    dateOfIssue: Date,
  ): string {
    const secret = process.env.HASH_SECRET; // Store in .env
    const data = `${id}:${firstname}:${lastname}:${dateOfIssue.toISOString()}`;
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex')
      .substring(0, 12); // First 12 chars for QR code
  }

  private async loadHtmlTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'templates',
      templateName,
    );
    return fs.promises.readFile(templatePath, 'utf8');
  }

  private populateHtmlTemplate(html: string, data: any, user: any): string {
    const date = new Date(data.DOB);
    const getBaseUrl = (): string =>
      config.isDev
        ? process.env.BASE_URL || 'http://localhost:5000'
        : 'https://api.citizenship.benuestate.gov.ng';

    // Format as "February 20, 1991"
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const dateOfIssue = new Date();

    // Format as "February 20, 1991"
    const formattedDateOfIssue = dateOfIssue.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return html
      .replace(/{{baseUrl}}/g, getBaseUrl())
      .replace(
        /{{name}}/g,
        user.firstname + ' ' + user.middlename + ' ' + user.lastname,
      )
      .replace(/{{lga}}/g, data.lgaOfOrigin)
      .replace(/{{family}}/g, data.fathersName)
      .replace(/{{ward}}/g, data.ward)
      .replace(/{{kindred}}/g, data.kindred)
      .replace(/{{dob}}/g, formattedDate)
      .replace(/{{issueDate}}/g, formattedDateOfIssue)
      .replace(/{{passportPhoto}}/g, data.passportPhoto)
      .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl);
  }

  private async markCertificateAsDownloaded(id: string): Promise<void> {
    try {
      // await this.indigeneCertificateService.markAsDownloaded(id);
      await this.indigeneCertificateService.markAsDownloadedForThreeMonths(id);
    } catch (updateErr) {
      console.error('Error marking certificate as downloaded:', updateErr);
    }
  }

  private async generateQrCode(data: string): Promise<string> {
    try {
      if (!data) {
        throw new Error('Input data is required');
      }
      const qrCodeUrl = await QRCode.toDataURL(data);
      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  @Public()
  @Get('download/certificate/:id')
  async downloadCert(@Param('id') id: string, @Res() res: Response) {
    try {
      const certificate =
        await this.indigeneCertificateService.findCertificateById(id);
      const user = await this.userService.findById(certificate.userId);

      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      // Generate the certificate PDF
      const htmlTemplate = await this.loadHtmlTemplate('certificate-view.html');
      const populatedHtml = this.populateHtmlTemplate(
        htmlTemplate,
        certificate,
        user,
      );
      const pdfPath =
        await this.indigeneCertificateService.generateCertificatePDF(
          id,
          populatedHtml,
        );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=certificate.pdf',
      );

      // Stream the file
      res.download(pdfPath, 'certificate.pdf', (err) => {
        if (err) {
          console.error('Error sending file:', err);
          return res.status(500).json({ message: 'Error downloading file' });
        }
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Public()
  @Get('certificate/:id')
  async getCertificateDetails(@Param('id') id: string) {
    try {
      const certificate =
        await this.indigeneCertificateService.findCertificateById(id);
      const user = await this.userService.findById(certificate.userId);

      if (!certificate) {
        throw new NotFoundException('Certificate not found');
      }

      const dateOfIssue = new Date();

      // Format as "February 20, 1991"
      const formattedDateOfIssue = dateOfIssue.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return {
        id: certificate.id,
        name: `${user.firstname} ${user.lastname}`,
        lga: user.lgaOfOrigin,
        state: user.stateOfOrigin,
        kindred: certificate.kindred,
        issueDate: formattedDateOfIssue,
      };
    } catch (error) {
      throw new NotFoundException('Certificate not found');
    }
  }

  @Public()
  @Get('view/:id')
  async viewCertificate(@Param('id') id: string, @Res() res: Response) {
    try {
      // Find the certificate
      const certificate =
        await this.indigeneCertificateService.findCertificateById(id);

      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      // Read and return the HTML page for certificate
      const templatePath = join(
        __dirname,
        '..',
        '..',
        'templates',
        'certificate-view.html',
      );
      console.log('Certificate template path:', templatePath);

      try {
        const htmlContent = await fs.promises.readFile(templatePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        // Set CSP to allow inline scripts
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'",
        );
        return res.send(htmlContent);
      } catch (fileError) {
        console.error('Error reading certificate template:', fileError);
        return res.status(500).json({ message: 'Template not found' });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Get('get-all-request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate, isArray: true })
  @Roles(UserRole.GLOBAL_ADMIN)
  async getCertsRequest(@Req() req: Request) {
    return await this.indigeneCertificateService.certificateModel
      .find({})
      .sort({ created_at: -1 })
      .populate('approvedBy', 'firstname lastname email')
      .populate(
        'userId',
        'firstname lastname email stateOfOrigin lgaOfOrigin isProfileCompleted ',
      )
      .exec();
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.GLOBAL_ADMIN)
  @ApiResponse({ type: Certificate, isArray: false })
  async approveCert(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ) {
    return await this.indigeneCertificateService.approveCertificate(
      id,
      approvedBy,
    );
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  // @Roles(UserRole.KINDRED_HEAD)
  @ApiResponse({ type: Certificate, isArray: false })
  async verifyRequest(@Param('id') id: string, @Body() Body: any) {
    return await this.indigeneCertificateService.verifyRequest(id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.GLOBAL_ADMIN)
  @ApiResponse({ type: Certificate, isArray: false })
  async rejectCert(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('approvedBy') approvedBy: string,
  ) {
    // Notify user
    const user = await this.indigeneCertificateService.findCertificateById(id);
    if (!user) {
      throw UserNotFoundException();
    }

    await this.userService.sendRequest(
      user.email,
      ' Request rejected',
      `Rejection Reason: ${rejectionReason}
       `,
    );

    return await this.indigeneCertificateService.rejectCertificate(
      id,
      rejectionReason,
      approvedBy,
    );
  }

  @Post(':id/resubmit')
  @UseInterceptors(
    // ✅ CHANGE TO AnyFilesInterceptor to handle multiple file names
    AnyFilesInterceptor({
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        // Re-use your existing file filter logic
        const fieldTypeRules = {
          passportPhoto: {
            mime: ['image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.jpeg', '.jpg', '.png'],
          },
          idCard: {
            mime: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.pdf', '.jpeg', '.jpg', '.png'],
          },
          birthCertificate: {
            mime: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.pdf', '.jpeg', '.jpg', '.png'],
          },
        };
        const rules = fieldTypeRules[file.fieldname];
        const ext = require('path').extname(file.originalname).toLowerCase();
        if (
          !rules ||
          !rules.mime.includes(file.mimetype) ||
          !rules.ext.includes(ext)
        ) {
          return cb(
            new BadRequestException(`Invalid file type for ${file.fieldname}`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async resubmitRequest(
    @Param('id') id: string,
    @Body() updatedData: UpdateCertificateDto,
    @UploadedFiles(
      new PassportPhotoQualityPipe({ isOptional: true }),
      new FileSizeValidationPipe({
        passportPhoto: { maxSize: 2 * 1024 * 1024 },
        idCard: { maxSize: 3 * 1024 * 1024 },
        birthCertificate: { maxSize: 5 * 1024 * 1024 },
      }),
    )
    files: Array<Express.Multer.File>,
  ): Promise<Certificate> {
    const existingCertificate =
      await this.indigeneCertificateService.findById(id);

    if (files && files.length > 0) {
      const documentType = updatedData.documentTypeToUpdate;
      if (!documentType) {
        throw new BadRequestException(
          'When uploading a file, you must specify "documentTypeToUpdate" in the request body.',
        );
      }

      const fileToUpload = files.find((f) => f.fieldname === documentType);
      if (!fileToUpload) {
        throw new BadRequestException(
          `The specified document type "${documentType}" was not found in the uploaded files.`,
        );
      }

      const oldImageUrl = existingCertificate[documentType];
      if (oldImageUrl) {
        await this.cloudinaryService.deleteFile(oldImageUrl);
      }

      const folder = `certificates/${documentType}`;
      const newImageUrl = await this.cloudinaryService.uploadFile(
        fileToUpload,
        folder,
      );
      updatedData[documentType] = newImageUrl;
    }

    return this.indigeneCertificateService.resubmitRequest(id, updatedData);
  }

  @Get()
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate, isArray: true })
  async getPaginatedData(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.indigeneCertificateService.getPaginatedData(page, limit);
  }

  @Get('by-lga')
  async getCertificatesByLga(@Query('lga') lga: string) {
    return this.indigeneCertificateService.findByLga(lga);
  }

  @Get('latest')
  @ApiResponse({ type: Certificate })
  async getLatestCertificate() {
    return this.indigeneCertificateService.getLatestCertificate();
  }

  @Get('latest-approved')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate })
  async getLatestApprovedCertificate() {
    return this.indigeneCertificateService.getLatestApprovedCertificate();
  }

  @Get('approval')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate, isArray: true })
  @Roles(UserRole.SUPPORT_ADMIN)
  async getApprovedCert(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.indigeneCertificateService.findApprovedRequest(
      page,
      limit,
      'Approved',
    );
  }

  @Get('request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate, isArray: true })
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.GLOBAL_ADMIN)
  async getRequestsByStatuses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('statuses') statuses: string = 'Pending,Rejected',
  ) {
    const statusArray = statuses.split(',');

    return this.indigeneCertificateService.findRequestsByStatuses(
      page,
      limit,
      statusArray,
    );
  }

  @Get(':id/get')
  @ApiResponse({ type: Certificate, isArray: false })
  async getCert(@Param('id') id: string) {
    return await this.indigeneCertificateService.findById(id);
  }

  @Get(':id')
  @ApiResponse({ type: Certificate, isArray: false })
  async getProfile(@Param('id') id: string) {
    return await this.indigeneCertificateService.findOne(id);
  }

  @Get(':id/requests')
  @ApiResponse({ type: Certificate, isArray: true })
  async getRequestsForId(@Param('id') id: string) {
    return await this.indigeneCertificateService.findRequestsByUserId(id);
  }

  @Get(':id/request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate, isArray: false })
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.GLOBAL_ADMIN)
  async getUserProfile(@Param('id') id: string) {
    return await this.indigeneCertificateService.findById(id);
  }

  @Delete(':item')
  async deleteItem(@Param('item') item: string): Promise<any> {
    return this.indigeneCertificateService.deleteItem(item);
  }

  @Public()
  @Get('pdf/:encodedUrl')
  @UseGuards(JwtAuthGuard)
  async getPdf(@Param('encodedUrl') encodedUrl: string, @Res() res: Response) {
    const decodedUrl = decodeURIComponent(encodedUrl);

    const response = await lastValueFrom(
      this.httpService.get(decodedUrl, {
        responseType: 'stream',
      }),
    );

    // Set headers early before sending
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="document.pdf"`);
    response.data.pipe(res);
  }

  @Public()
  @Get(':requestId/document/:docType')
  async streamDocument(
    @Param('requestId') requestId: string,
    @Param('docType') docType: 'idCard' | 'birthCertificate',
    @Res() res: Response,
  ) {
    const request = await this.indigeneCertificateService.findById(requestId);

    if (!request || !request[docType]) {
      throw new NotFoundException(
        `Document '${docType}' not found for this request.`,
      );
    }

    const originalUrl = request[docType];

    // --- THE KEY FIX: Determine MIME type from the URL structure ---
    let contentType: string;
    let fileExtension: string;

    if (originalUrl.includes('/image/upload/')) {
      // This is an image. Let's find the format from the URL.
      // Example: .../image/upload/v12345678/public_id.jpg
      const urlParts = originalUrl.split('/');
      const fileName = urlParts.pop(); // Get 'public_id.jpg'
      const format = fileName.split('.').pop()?.split('?')[0]; // Get 'jpg'

      if (format) {
        contentType = `image/${format}`;
        fileExtension = `.${format}`;
      } else {
        // Fallback if no format is specified in the URL
        console.log(
          `Could not determine image format for URL: ${originalUrl}. Defaulting to jpeg.`,
        );
        contentType = 'image/jpeg';
        fileExtension = '.jpg';
      }
    } else if (originalUrl.includes('/raw/upload/')) {
      // This is a non-image file, which we will assume is a PDF.
      contentType = 'application/pdf';
      fileExtension = '.pdf';
    } else {
      // Ultimate fallback if the URL is unrecognizable
      console.log(`Unrecognized Cloudinary URL format: ${originalUrl}`);
      throw new InternalServerErrorException(
        'Could not determine the type of the stored document.',
      );
    }

    try {
      // We can stream the original URL directly; we don't need the `fl_attachment` param
      // since we are setting our own `Content-Disposition` header.
      const cloudinaryRes: AxiosResponse<any> = await axios.get(originalUrl, {
        responseType: 'stream',
      });

      // --- Set the headers based on OUR determination, not Cloudinary's ---
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${docType}${fileExtension}"`,
        'Cache-Control': 'public, max-age=86400',
      });

      // Pipe the stream from Cloudinary to the client
      return cloudinaryRes.data.pipe(res);
    } catch (error) {
      console.log(
        `Error streaming document from Cloudinary: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not retrieve the document. Please try again later.',
      );
    }
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @Get('verify/:id/:hash')
  async verify(
    @Param('id') id: string,
    @Param('hash') hash: string,
    @Res() res: Response,
  ) {
    const result = await this.indigeneCertificateService.verifyCertificate(
      id,
      hash,
    );
    const getBaseUrl = (): string =>
      config.isDev
        ? process.env.BASE_URL || 'http://localhost:5000'
        : 'https://api.citizenship.benuestate.gov.ng';
    if (result.valid) {
      return res.render('verification', {
        certificate: result.data,
        baseeUrl: getBaseUrl(),
        layout: false,
      });
    } else {
      return res.render('invalid', {
        message: result.message,
        baseeUrl: getBaseUrl(),
        layout: false,
      });
    }
  }
}
