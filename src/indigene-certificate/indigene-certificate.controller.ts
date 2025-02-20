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
} from '@nestjs/common';
import { UserNotFoundException } from 'src/common/exception';

import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { IndigeneCertificateService } from './indigene-certificate.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/users/users.role.enum';
import { Certificate } from './indigene-certicate.schema';
import { UsersService } from 'src/users/users.service';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';

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
    FilesInterceptor('files', 4, {
      dest: './uploads',
      limits: { fileSize: 1024 * 1024 * 5 },
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createCertificate(
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const data = {
      ...body,
      refNumber: uuid(),
      passportPhoto: files[0]?.path,
      idCard: files[1]?.path,
      birthCertificate: files[2]?.path,
      parentGuardianIndigeneCert: files[3]?.path,
    };

    // Notify admin
    const adminEmail = 'ejehgodfrey@gmail.com';
    const adminPhone = '+1234567890';

    await this.userService.sendRequest(
      adminEmail,
      'New Request',
      `Request for certificate of origin 
      from ${body.email}
      `,
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

      const qrCodeData = `Name: ${user.firstname} ${user.middlename} ${user.lastname} | issueDate: ${formattedDate} | Sex: ${user.gender} | issuer: Benue Digital Infrastructure Company`;

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
          // certificate,
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
          return res.status(500).json({ message: 'Error downloading file' });
        }

        // Mark as downloaded and delete temp file after sending
        await this.markCertificateAsDownloaded(id);
        // this.cleanupTempFile(pdfPath);
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
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
      .replace(/{{passportPhoto}}/g, user.passportPhoto)
      .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl);
  }

  // private async cleanupTempFile(filePath: string): Promise<void> {
  //   try {
  //     if (fs.existsSync(filePath)) {
  //       await fs.promises.unlink(filePath);
  //       console.log(`Deleted temp file: ${filePath}`);
  //     }
  //   } catch (unlinkErr) {
  //     console.error('Error deleting temporary file:', unlinkErr);
  //   }
  // }

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
  @Roles(UserRole.SUPER_ADMIN)
  @ApiResponse({ type: Certificate, isArray: false })
  async approveCert(@Param('id') id: string, @Body() Body: any) {
    return await this.indigeneCertificateService.approveCertificate(id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiResponse({ type: Certificate, isArray: false })
  async rejectCert(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
  ) {
    console.log(rejectionReason);
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
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN)
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
}
