import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IdcardService } from './idcard.service';
import { UsersService } from 'src/users/users.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import path, { extname, join } from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { IdCard } from './idcard.schema';
import { UserRole } from 'src/users/users.role.enum';
import { UserNotFoundException } from 'src/common/exception';
import * as fs from 'fs';
import QRCode from 'qrcode';
import { Public } from 'src/common/decorators/public.decorator';
import config from 'src/config';
import * as crypto from 'crypto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('idCard.controller')
@UseGuards(JwtAuthGuard)
@Controller('api/idcard')
export class IdcardController {
  constructor(
    private readonly idcardService: IdcardService,
    private readonly userService: UsersService,
  ) {}

  @Post('create')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      dest: './uploads',
      // limits: { fileSize: 1024 * 1024 * 5 },
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createIdCard(
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const data = {
      ...body,
      bin: await this.idcardService.generateUniqueBIN(),
      ref_letter: files[0]?.filename,
      utilityBill: files[1]?.filename,
    };

    // Notify admin
    const adminEmail = 'ejehgodfrey@gmail.com';
    const adminPhone = '+1234567890';

    await this.userService.sendRequest(
      adminEmail,
      'New Request',
      `Request for identity card 
          from ${body.lastname}
          `,
    );

    return this.idcardService.createIdCard(data);
  }

  @Get('get-all-request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: IdCard, isArray: true })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN)
  async getCertsRequest(@Req() req: Request) {
    return await this.idcardService.idCardModel.find({});
  }

  @Get('request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: IdCard, isArray: true })
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN)
  async getRequestsByStatuses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('statuses') statuses: string = 'Pending,Rejected',
  ) {
    const statusArray = statuses.split(',');

    return this.idcardService.findCardRequestsByStatuses(
      page,
      limit,
      statusArray,
    );
  }

  @Get('latest')
  @ApiResponse({ type: IdCard, isArray: false })
  async getLatestCertificate() {
    return this.idcardService.getLatestIdCard();
  }

  @Get('latest-approved')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: IdCard, isArray: false })
  async getLatestApprovedCertificate() {
    return this.idcardService.getLatestApprovedCard();
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiResponse({ type: IdCard, isArray: false })
  async approveCert(@Param('id') id: string, @Body() Body: any) {
    return await this.idcardService.approveIdCard(id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiResponse({ type: IdCard, isArray: false })
  async rejectCert(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
  ) {
    // Notify user
    const user = await this.idcardService.findCardById(id);
    if (!user) {
      throw UserNotFoundException();
    }

    await this.userService.sendRequest(
      user.email,
      ' Request rejected',
      `Rejection Reason: ${rejectionReason}
           `,
    );

    return await this.idcardService.rejectCard(id, rejectionReason);
  }

  @Get(':id/request')
  @ApiResponse({ type: IdCard, isArray: false })
  async getUserProfile(@Param('id') id: string, @Body() body: any) {
    return await this.idcardService.findById(id);
  }

  @Delete(':item')
  async deleteItem(@Param('item') item: string): Promise<any> {
    return this.idcardService.deleteItem(item);
  }

  @Get('download/:id')
  @ApiResponse({ type: IdCard, isArray: false })
  async downloadCertificate(@Param('id') id: string, @Res() res: Response) {
    try {
      const card = await this.idcardService.findCertificateById(id);

      const user = await this.userService.findById(card.userId);

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }

      if (card.downloaded) {
        return res
          .status(400)
          .json({ message: 'Card has already been downloaded.' });
      }

      const date = new Date(user.DOB);
      const dateOfIssue = new Date();

      const formattedDOB = date.toISOString().split('T')[0]; // Extracts YYYY-MM-DD

      // 1. Generate hash
      const hash = this.generateSecureHash(
        card.id,
        user.firstname,
        user.lastname,
        dateOfIssue, // Or use your certificate's issue date
      );

      const getBaseUrl = (): string =>
        config.isDev
          ? process.env.BASE_URL || 'http://localhost:5000'
          : 'http://api.citizenship.benuestate.gov.ng';

      // 2. Create QR Code URL
      const verificationUrl = `${getBaseUrl()}/api/idcard/verify/${id}/${hash}`;

      // const qrCodeData = `Name: ${user.firstname} ${user.middlename} ${user.lastname} | issueDate: ${formattedDate} | Sex: ${user.gender} | issuer: Benue Digital Infrastructure Company | verificationUrl:${verificationUrl} `;

      const qrCodeData = `Verification Url: ${verificationUrl} `;

      // const qrCodeData = `Name: ${user.firstname} ${user.middlename} ${user.lastname} | BIN: ${card.bin} | DOB: ${formattedDOB} | Sex: ${user.gender}`;

      const qrCodeUrl = await this.generateQrCode(qrCodeData); // Generate QR code URL
      card.qrCodeUrl = qrCodeUrl; // Save the QR code URL in the card

      const htmlTemplate = await this.loadHtmlTemplate('card-template.html');
      const populatedHtml = this.populateHtmlTemplate(htmlTemplate, card, user);

      const pdfPath = await this.idcardService.generateIDCardPDF(
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

        // Save verication hash
        await this.idcardService.saveVerificationHash(id, hash);
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
    const dob = new Date(user.DOB);

    const getBaseUrl = (): string =>
      config.isDev
        ? process.env.BASE_URL || 'http://localhost:5000'
        : 'http://api.citizenship.benuestate.gov.ng';

    const formattedDOB = dob
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(',', '');

    const dateOfIssue = new Date();
    const formattedDateOfIssue = dateOfIssue
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(',', '');

    return html
      .replace(/{{baseUrl}}/g, getBaseUrl())
      .replace(/{{name}}/g, user.firstname + ' ' + user.middlename)
      .replace(/{{surname}}/g, data.lastname)
      .replace(/{{dob}}/g, formattedDOB)
      .replace(/{{bin}}/g, data.bin)
      .replace(/{{passportPhoto}}/g, user.passportPhoto)
      .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl)
      .replace(/{{issueDate}}/g, formattedDateOfIssue)
      .replace(/{{gender}}/g, user.gender);
  }

  private async markCertificateAsDownloaded(id: string): Promise<void> {
    try {
      await this.idcardService.markAsDownloaded(id);
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

  @Get(':id')
  @ApiResponse({ type: IdCard, isArray: false })
  async getProfile(@Param('id') id: string, @Body() body: any) {
    return await this.idcardService.findOne(id);
  }

  @Post(':id/resubmit')
  @ApiResponse({ type: IdCard, isArray: false })
  resubmitRequest(@Param('id') id: string, @Body() updatedData: any) {
    return this.idcardService.resubmitRequest(id, updatedData);
  }

  @Get(':id/get')
  @ApiResponse({ type: IdCard, isArray: false })
  async getCert(@Param('id') id: string, @Body() body: any) {
    return await this.idcardService.findById(id);
  }

  @Public()
  @Get('pdf/:filename')
  @UseGuards(JwtAuthGuard)
  getPdf(
    @Param('filename') filename: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const filePath = join(
      // '/home/spaceinovationhub/BSCR-MIS-BkND/uploads',
      __dirname,
      '..',
      '..',
      'uploads',
      filename,
    );

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
    const result = await this.idcardService.verifyCertificate(id, hash);

    const getBaseUrl = (): string =>
      config.isDev
        ? process.env.BASE_URL || 'http://localhost:5000'
        : 'http://api.citizenship.benuestate.gov.ng';

    if (result.valid) {
      return res.render('id-card-verification', {
        card: result.data,
        baseUrl: getBaseUrl(),
        layout: false,
      });
    } else {
      return res.render('invalid', {
        message: result.message,
        baseUrl: getBaseUrl(),
        layout: false,
      });
    }
  }
}
