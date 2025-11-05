import {
  Body,
  Controller,
  Delete,
  Get,
  Options,
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
import { NotFoundException } from '@nestjs/common';
import { IdcardService } from './idcard.service';
import { UsersService } from 'src/users/users.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import path, { extname, join } from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { IdCard } from './idcard.schema';
import { UserRole } from 'src/users/users.role.enum';
import { UserNotFoundException } from 'src/common/exception';
import { Public } from 'src/common/decorators/public.decorator';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Throttle } from '@nestjs/throttler';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as fs from 'fs';
import QRCode from 'qrcode';
import config from 'src/config';
import * as crypto from 'crypto';
import axios, { AxiosResponse } from 'axios';
import { MailService } from 'src/mail/mail.service';
import { SmsService } from 'src/sms/sms.service';

@ApiTags('idCard.controller')
@UseGuards(JwtAuthGuard)
@Controller('api/idcard')
export class IdcardController {
  constructor(
    private readonly idcardService: IdcardService,
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly httpService: HttpService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  @Post('create')
  @UseInterceptors(FilesInterceptor('files', 2))
  async createIdCard(
    @Body() body: any,
    @Req() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const user = req.user as any;
    const [refLetterUrl, utilityBillUrl] = await Promise.all([
      this.cloudinaryService.uploadFile(files[0], 'idcards/ref_letters'),
      this.cloudinaryService.uploadFile(files[1], 'idcards/utility_bills'),
    ]);

    const data = {
      ...body,
      bin: await this.idcardService.generateUniqueBIN(),
      ref_letter: refLetterUrl,
      utilityBill: utilityBillUrl,
    };

    return this.idcardService.createIdCard(data, user.id);
  }

  // @Post('create')
  // @UseInterceptors(FilesInterceptor('files', 2))
  // async createIdCard(
  //   @Body() body: any,
  //   @Req() req,
  //   @UploadedFiles() files: Array<Express.Multer.File>,
  // ) {
  //   const user = req.user as any;
  //   const [refLetterUrl, utilityBillUrl] = await Promise.all([
  //     this.cloudinaryService.uploadFile(files[0], 'idcards/ref_letters'),
  //     this.cloudinaryService.uploadFile(files[1], 'idcards/utility_bills'),
  //   ]);

  //   // Process family members and generate verification tokens
  //   let processedFamily = [];
  //   if (body.family && Array.isArray(body.family)) {
  //     processedFamily = await Promise.all(
  //       body.family.map(async (familyMember) => {
  //         // Generate verification token and link
  //         const verificationToken =
  //           await this.idcardService.generateVerificationToken();
  //         const verificationLink = `${process.env.FRONTEND_URL}/verify-family/${verificationToken}`;
  //         const verificationExpiresAt = new Date();
  //         verificationExpiresAt.setDate(verificationExpiresAt.getDate() + 7); // Token expires in 7 days

  //         // Send verification notification to family member
  //         if (familyMember.email) {
  //           await this.mailService.sendFamilyVerificationEmail(
  //             familyMember.email,
  //             familyMember.name,
  //             verificationLink,
  //             user.name,
  //           );
  //         }

  //         if (familyMember.phone) {
  //           await this.smsService.sendSms(
  //             familyMember.phone,
  //             familyMember.name,
  //             verificationLink,
  //             user.name,
  //           );
  //         }

  //         return {
  //           ...familyMember,
  //           verificationToken,
  //           verificationLink,
  //           verificationExpiresAt,
  //           status: 'pending',
  //           isFollowUpSent: false,
  //         };
  //       }),
  //     );
  //   }

  //   const data = {
  //     ...body,
  //     bin: await this.idcardService.generateUniqueBIN(),
  //     ref_letter: refLetterUrl,
  //     utilityBill: utilityBillUrl,
  //     family: processedFamily,
  //   };

  //   return this.idcardService.createIdCard(data, user.id);
  // }

  // @Post('verify-family/:token')
  // async verifyFamily(
  //   @Param('token') token: string,
  //   @Body()
  //   verificationData: {
  //     isResident: boolean;
  //     knownDuration: string;
  //     knowsApplicant: boolean;
  //     comments?: string;
  //   },
  // ) {
  //   return this.idcardService.verifyFamilyMember(token, verificationData);
  // }

  // @Post('create')
  // @UseInterceptors(FilesInterceptor('files', 2))
  // async createIdCard(
  //   @Body() body: any,
  //   @Req() req,
  //   @UploadedFiles() files: Array<Express.Multer.File>,
  // ) {
  //   const user = req.user as any;
  //   const [refLetterUrl, utilityBillUrl] = await Promise.all([
  //     this.cloudinaryService.uploadFile(files[0], 'idcards/ref_letters'),
  //     this.cloudinaryService.uploadFile(files[1], 'idcards/utility_bills'),
  //   ]);

  //   // Process neighbors and generate verification tokens
  //   let processedNeighbors = [];
  //   if (body.neighbors && Array.isArray(body.neighbors)) {
  //     processedNeighbors = await Promise.all(
  //       body.neighbors.map(async (neighbor) => {
  //         // Generate verification token and link
  //         const verificationToken =
  //           await this.idcardService.generateVerificationToken();
  //         const verificationLink = `${process.env.FRONTEND_URL}/verify-neighbor/${verificationToken}`;
  //         const verificationExpiresAt = new Date();
  //         verificationExpiresAt.setDate(verificationExpiresAt.getDate() + 7); // Token expires in 7 days

  //         // Send verification notification to neighbor
  //         if (neighbor.email) {
  //           await this.mailService.sendNeighborVerificationEmail(
  //             neighbor.email,
  //             neighbor.name,
  //             verificationLink,
  //             user.name,
  //           );
  //         }

  //         if (neighbor.phone) {
  //           await this.smsService.sendNeighborVerificationSms(
  //             neighbor.phone,
  //             neighbor.name,
  //             verificationLink,
  //             user.name,
  //           );
  //         }

  //         return {
  //           ...neighbor,
  //           verificationToken,
  //           verificationLink,
  //           verificationExpiresAt,
  //           status: 'pending',
  //           isFollowUpSent: false,
  //         };
  //       }),
  //     );
  //   }

  //   const data = {
  //     ...body,
  //     bin: await this.idcardService.generateUniqueBIN(),
  //     ref_letter: refLetterUrl,
  //     utilityBill: utilityBillUrl,
  //     neighbors: processedNeighbors,
  //   };

  //   return this.idcardService.createIdCard(data, user.id);
  // }

  // // Add endpoint for neighbor verification
  // @Post('verify-neighbor/:token')
  // async verifyNeighbor(
  //   @Param('token') token: string,
  //   @Body()
  //   verificationData: {
  //     isNeighbor: boolean;
  //     knownDuration: string;
  //     knowsApplicant: boolean;
  //     comments?: string;
  //   },
  // ) {
  //   return this.idcardService.verifyNeighbor(token, verificationData);
  // }

  @Get('get-all-request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: IdCard, isArray: true })
  @Roles(UserRole.GLOBAL_ADMIN)
  async getCertsRequest(@Req() req: Request) {
    return await this.idcardService.idCardModel
      .find({})
      .populate('approvedBy', 'firstname lastname email')
      .populate(
        'userId',
        'firstname lastname email stateOfOrigin lgaOfOrigin isProfileCompleted ',
      )
      .exec();
  }

  @Get('card-request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: IdCard, isArray: true })
  @Roles(
    UserRole.SUPPORT_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.KINDRED_HEAD,
    UserRole.GLOBAL_ADMIN,
  )
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
  @Roles(UserRole.GLOBAL_ADMIN)
  @ApiResponse({ type: IdCard, isArray: false })
  async approveCert(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ) {
    return await this.idcardService.approveIdCard(id, approvedBy);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN)
  @ApiResponse({ type: IdCard, isArray: false })
  async rejectCert(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('approvedBy') approvedBy: string,
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

    return await this.idcardService.rejectCard(id, rejectionReason, approvedBy);
  }

  @Get(':id/request')
  @ApiResponse({ type: IdCard, isArray: false })
  async getIdcardRequest(@Param('id') id: string, @Body() body: any) {
    return await this.idcardService.findById(id);
  }

  @Delete(':item')
  async deleteItem(@Param('item') item: string): Promise<any> {
    return this.idcardService.deleteItem(item);
  }

  @Public()
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
          : 'https://api.citizenship.benuestate.gov.ng';

      // 2. Create QR Code URL
      // const verificationUrl = `${getBaseUrl()}/api/idcard/verify/${id}/${hash}`;

      // const qrCodeData = `Name: ${user.firstname} ${user.middlename} ${user.lastname} | issueDate: ${formattedDate} | Sex: ${user.gender} | issuer: Benue Digital Infrastructure Company | verificationUrl:${verificationUrl} `;

      const idCardQrCodeData = `${getBaseUrl()}/api/idcard/view/${card.id}`;

      // const qrCodeData = `Name: ${user.firstname} ${user.middlename} ${user.lastname} | BIN: ${card.bin} | DOB: ${formattedDOB} | Sex: ${user.gender}`;

      const qrCodeUrl = await this.generateQrCode(idCardQrCodeData); // Generate QR code URL
      card.qrCodeUrl = qrCodeUrl; // Save the QR code URL in the card

      const htmlTemplate = await this.loadHtmlTemplate('card-template.html');
      const populatedHtml = this.populateHtmlTemplate(htmlTemplate, card, user);

      const pdfPath = await this.idcardService.generateIDCardPDF(
        id,
        populatedHtml,
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=card.pdf');

      // Stream the file instead of reading it fully into memory
      res.download(pdfPath, 'card.pdf', async (err) => {
        if (err) {
          console.error('Error sending file:', err);
          return; // return res.status(500).json({ message: 'Error downloading file' });
        }

        // Mark as downloaded and delete temp file after sending
        await this.markCardAsDownloaded(id);

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
        : 'https://api.citizenship.benuestate.gov.ng';

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

  private async markCardAsDownloaded(id: string): Promise<void> {
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

  // Add these new endpoints to handle QR code downloads
  @Public()
  @Get('download/idcard/:id')
  async downloadIdCard(@Param('id') id: string, @Res() res: Response) {
    try {
      const card = await this.idcardService.findCardById(id);
      const user = await this.userService.findById(card.userId);

      if (!card) {
        return res.status(404).json({ message: 'ID Card not found' });
      }

      // Generate the ID card PDF
      const htmlTemplate = await this.loadHtmlTemplate('idcard-view.html');
      const populatedHtml = this.populateHtmlTemplate(htmlTemplate, card, user);
      const pdfPath = await this.idcardService.generateIDCardPDF(
        id,
        populatedHtml,
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=idcard.pdf');

      // Stream the file
      res.download(pdfPath, 'idcard.pdf', (err) => {
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

  // Add endpoints to fetch document details for the QR page
  @Public()
  @Get('idcard/:id')
  async getIdCardDetails(@Param('id') id: string) {
    try {
      const card = await this.idcardService.findCardById(id);
      const user = await this.userService.findById(card.userId);

      if (!card) {
        throw new NotFoundException('ID Card not found');
      }

      const dateOfIssue = new Date();

      // Format as "February 20, 1991"
      const formattedDateOfIssue = dateOfIssue.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return {
        id: card.id,
        firstname: user.firstname,
        lastname: user.lastname,
        bin: card.bin,
        issueDate: formattedDateOfIssue,
      };
    } catch (error) {
      throw new NotFoundException('ID Card not found');
    }
  }

  @Public()
  @Get('view/:id')
  async viewIdCard(@Param('id') id: string, @Res() res: Response) {
    try {
      // Find the ID card
      const card = await this.idcardService.findCardById(id);

      if (!card) {
        return res.status(404).json({ message: 'ID Card not found' });
      }

      // Read and return the HTML page for ID card
      const templatePath = join(
        __dirname,
        '..',
        '..',
        'templates',
        'idcard-view.html',
      );

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
        console.error('Error reading ID card template:', fileError);
        return res.status(500).json({ message: 'Template not found' });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Get('location-stats')
  async getLocationStats() {
    return this.idcardService.getLocationStats();
  }

  @Get(':id/request')
  async getOneIdCard(@Param('id') id: string) {
    return this.idcardService.findById(id);
  }

  @Get(':id')
  @ApiResponse({ type: IdCard, isArray: false })
  async getProfile(@Param('id') id: string) {
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
    @Param('docType') docType: 'utilityBill' | 'ref_letter',
    @Res() res: Response,
  ) {
    const request = await this.idcardService.findById(requestId);

    if (!request || !request[docType]) {
      throw new NotFoundException(`Document '${docType}' not found`);
    }

    const originalUrl = request[docType];
    const inlineUrl = originalUrl.includes('?')
      ? `${originalUrl}&fl_attachment=false`
      : `${originalUrl}?fl_attachment=false`;

    try {
      const cloudinaryRes: AxiosResponse<any> = await axios.get(inlineUrl, {
        responseType: 'stream',
      });

      res.set({
        'Content-Type':
          cloudinaryRes.headers['content-type'] || 'application/pdf',
        'Content-Disposition': `inline; filename="${docType}.pdf"`,
      });

      return cloudinaryRes.data.pipe(res);
    } catch (error) {
      console.error('Error streaming document:', error.message);
      res.status(500).send('Failed to stream document');
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
    const result = await this.idcardService.verifyCertificate(id, hash);

    const getBaseUrl = (): string =>
      config.isDev
        ? process.env.BASE_URL || 'http://localhost:5000'
        : 'https://api.citizenship.benuestate.gov.ng';

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
