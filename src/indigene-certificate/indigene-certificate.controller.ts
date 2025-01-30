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
} from '@nestjs/common';
import { UserNotFoundException } from 'src/common/exception';

import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IndigeneCertificateService } from './indigene-certificate.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/users/users.role.enum';
import { Certificate } from './indigene-certicate.schema';
import { UsersService } from 'src/users/users.service';
import { v4 as uuid } from 'uuid';

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
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate, isArray: false })
  async downloadCertificate(@Param('id') id: string, @Res() res: Response) {
    try {
      // Fetch the certificate details
      const certificate =
        await this.indigeneCertificateService.findCertificateById(id);

      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      if (certificate.downloaded) {
        throw new Error('Certificate has already been downloaded.');
      }

      // Generate the PDF document
      const pdfPath = await this.generateCertificatePDF(id, certificate);

      // Stream the PDF file to the response
      res.download(pdfPath, 'certificate.pdf', async (err) => {
        // Clean up the temporary file
        fs.unlink(pdfPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temporary file:', unlinkErr);
          }
        });

        if (err) {
          console.error('Error sending file:', err);
          return res.status(500).json({ message: 'Error downloading file' });
        }

        // Mark as downloaded only if no error occurred
        try {
          await this.indigeneCertificateService.markAsDownloaded(id);
        } catch (updateErr) {
          console.error('Error marking certificate as downloaded:', updateErr);
        }
      });
    } catch (error) {
      console.error('Error processing request:', error.message);

      // Return a unified error response with a specific message
      if (error.message === 'Certificate has already been downloaded.') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  private async generateCertificatePDF(
    id: string,
    certificate,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const tempPath = `./temp/${id}.pdf`;
      const stream = fs.createWriteStream(tempPath);
      doc.pipe(stream);

      // Add border
      const borderSpacing = 20;
      const borderWidth = 8;
      doc
        .rect(
          borderSpacing,
          borderSpacing,
          doc.page.width - borderSpacing * 2,
          doc.page.height - borderSpacing * 2,
        )
        .lineWidth(borderWidth)
        .strokeColor('red')
        .dash(10, { space: 4 })
        .stroke();

      // Add State Emblem or Icon (Placeholder here, replace with an actual image)
      const emblemX = doc.page.width / 2 - 25;
      const emblemY = 60;
      doc.rect(emblemX, emblemY, 50, 50).strokeColor('black').stroke();

      // Header Section
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('BENUE STATE', { align: 'center' })
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(12)
        .text('TO WHOM IT MAY CONCERN', { align: 'center' })
        .moveDown(1);

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .text(`${certificate.LGA} Local Government Area`, { align: 'center' })
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(14)
        .text('Certificate of Benue State Origin', { align: 'center' })
        .moveDown(2);

      // Dynamic Details Section
      const startX = 70;
      let startY = 200;

      doc.font('Helvetica').fontSize(12).text(`I Certify that`, startX, startY);

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`${certificate.firstname}`, startX + 120, startY);

      startY += 20;
      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Is a native of:`, startX, startY);

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`${certificate.ward} `, startX + 120, startY);

      startY += 20;
      doc.font('Helvetica').fontSize(12).text(`Clan in:`, startX, startY);

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`${certificate.district}`, startX + 120, startY);

      startY += 40;
      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`${certificate.LGA} Local Government Area`, { align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Benue State of Nigeria`, { align: 'center' })
        .moveDown(1);

      // Date and Signature Section
      startY += 80;
      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Date: ${new Date().toDateString()}`, startX, startY);

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Signature: _________________________`, startX + 250, startY);

      doc.end();

      stream.on('finish', () => resolve(tempPath));
      stream.on('error', (err) => reject(err));
    });
  }

  @Get('get-all-request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Certificate, isArray: true })
  @Roles(UserRole.SUPER_ADMIN)
  async getCertsRequset(@Req() req: Request) {
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
}
