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
} from '@nestjs/common';
import { UserNotFoundException } from 'src/common/exception';

import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { IndigeneCertificateService } from './indigene-certificate.service';
import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
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

@ApiTags('indigene-certificate.controller')
@UseGuards(JwtAuthGuard)
@Controller('api/indigene/certificate')
export class IndigeneCertificateController {
  constructor(
    private readonly indigeneCertificateService: IndigeneCertificateService,
    private readonly userService: UsersService,
  ) {}

  @Post('create')
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: 5 * 1024 * 1024 },
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),

      fileFilter: (req, file, cb) => {
        const fieldTypeRules = {
          passportPhoto: {
            mime: ['image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.jpeg', '.jpg', '.png'],
            message: 'Passport Photo must be an image (.jpg, .jpeg, .png)',
          },
          idCard: {
            mime: ['application/pdf'],
            ext: ['.pdf'],
            message: 'ID Card must be a PDF file',
          },
          birthCertificate: {
            mime: ['application/pdf'],
            ext: ['.pdf'],
            message: 'Birth Certificate must be a PDF file',
          },
          // parentGuardianIndigeneCert: {
          //   mime: ['application/pdf'],
          //   ext: ['.pdf'],
          //   message: 'Parent/Guardian Certificate must be a PDF file',
          // },
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
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    // Convert array to map for easier access
    const fileMap = files.reduce(
      (acc, file) => {
        acc[file.fieldname] = file;
        return acc;
      },
      {} as Record<string, Express.Multer.File>,
    );

    const requiredFields = [
      'passportPhoto',
      'idCard',
      'birthCertificate',
      // 'parentGuardianIndigeneCert',
    ];

    for (const field of requiredFields) {
      if (!fileMap[field]) {
        throw new BadRequestException(`${field} file is required.`);
      }
    }

    const getBaseUrl = (): string =>
      config.isDev
        ? process.env.BASE_URL || 'http://localhost:5000'
        : 'https://api.citizenship.benuestate.gov.ng';

    const fileUrl = (file: Express.Multer.File) =>
      `${getBaseUrl()}/uploads/${file.filename}`;

    const data = {
      ...body,
      refNumber: uuid(),
      passportPhoto: fileUrl(fileMap.passportPhoto),
      idCard: fileUrl(fileMap.idCard),
      birthCertificate: fileUrl(fileMap.birthCertificate),
      // parentGuardianIndigeneCert: fileUrl(fileMap.parentGuardianIndigeneCert),
    };

    await this.userService.sendRequest(
      'ejehgodfrey@gmail.com',
      'New Request',
      `Request for certificate of origin from ${body.email}`,
    );

    return this.indigeneCertificateService.createCertificate(data);
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

      if (certificate.downloaded) {
        return res
          .status(400)
          .json({ message: 'Certificate has already been downloaded.' });
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
      const verificationUrl = `${getBaseUrl()}/api/indigene/certificate/verify/${id}/${hash}`;

      // const qrCodeData = `Name: ${user.firstname} ${user.middlename} ${user.lastname} | issueDate: ${formattedDate} | Sex: ${user.gender} | issuer: Benue Digital Infrastructure Company | verificationUrl:${verificationUrl} `;

      const qrCodeData = `Verification Url: ${verificationUrl} `;

      const qrCodeUrl = await this.generateQrCode(qrCodeData); // Generate QR code URL
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
      await this.indigeneCertificateService.markAsDownloaded(id);
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

  @Get('get-all-request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate, isArray: true })
  @Roles(UserRole.SUPER_ADMIN)
  async getCertsRequest(@Req() req: Request) {
    return await this.indigeneCertificateService.certificateModel.find({});
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.KINDRED_HEAD)
  @ApiResponse({ type: Certificate, isArray: false })
  async approveCert(@Param('id') id: string, @Body() Body: any) {
    return await this.indigeneCertificateService.approveCertificate(id);
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.KINDRED_HEAD)
  @ApiResponse({ type: Certificate, isArray: false })
  async verifyRequest(@Param('id') id: string, @Body() Body: any) {
    return await this.indigeneCertificateService.verifyRequest(id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiResponse({ type: Certificate, isArray: false })
  async rejectCert(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
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
    );
  }

  @Post(':id/resubmit')
  @ApiResponse({ type: Certificate, isArray: false })
  resubmitRequest(@Param('id') id: string, @Body() updatedData: any) {
    return this.indigeneCertificateService.resubmitRequest(id, updatedData);
  }

  @Get()
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate, isArray: true })
  @Roles(UserRole.SUPER_ADMIN)
  async getPaginatedData(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.indigeneCertificateService.getPaginatedData(page, limit);
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
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN, UserRole.KINDRED_HEAD)
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
  async getCert(@Param('id') id: string, @Body() body: any) {
    return await this.indigeneCertificateService.findById(id);
  }

  @Get(':id')
  @ApiResponse({ type: Certificate, isArray: false })
  async getProfile(@Param('id') id: string, @Body() body: any) {
    return await this.indigeneCertificateService.findOne(id);
  }

  @Get(':id/request')
  @ApiResponse({ type: Certificate, isArray: false })
  async getUserProfile(@Param('id') id: string, @Body() body: any) {
    return await this.indigeneCertificateService.findById(id);
  }

  @Delete(':item')
  async deleteItem(@Param('item') item: string): Promise<any> {
    return this.indigeneCertificateService.deleteItem(item);
  }

  @Public()
  @Get('pdf/:filename')
  @UseGuards(JwtAuthGuard)
  getPdf(
    @Param('filename') filename: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const filePath = join(__dirname, '..', '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // Set headers early before sending
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Pipe file (streaming) instead of res.sendFile to avoid "headers sent" on disconnect
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end('Failed to serve PDF');
    });
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
