import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
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
import {
  AnyFilesInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
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
import { FileSizeValidationPipe } from 'src/common/pipes/file-size-validation.pipe';
import { UpdateIdCardDto } from './dto/update-idcard.dto';
import { PassportPhotoQualityPipe } from 'src/common/pipes/passport-photo-quality.pipes';
import { GenericImageValidationPipe } from 'src/common/pipes/generic-image-validation.pipe';

@ApiTags('idCard.controller')
@UseGuards(JwtAuthGuard)
@Controller('api/idcard')
export class IdcardController {
  constructor(
    private readonly idcardService: IdcardService,
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
          ref_letter: {
            mime: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.pdf', '.jpeg', '.jpg', '.png'],
            message: 'ID Card must be an image or a PDF file',
          },
          utilityBill: {
            mime: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.pdf', '.jpeg', '.jpg', '.png'],
            message: 'Birth Certificate must be an image or a PDF file',
          },
        };

        const rules = fieldTypeRules[file.fieldname];
        const ext = extname(file.originalname).toLowerCase();

        console.log(rules);

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
  async createIdCard(
    @Body() body: any,
    @Req() req,
    @UploadedFiles(
      // new GenericImageValidationPipe(),
      new PassportPhotoQualityPipe(),
      new FileSizeValidationPipe({
        passportPhoto: { maxSize: 2 * 1024 * 1024 },
        ref_letter: { maxSize: 5 * 1024 * 1024 }, // 3MB
        utilityBill: { maxSize: 5 * 1024 * 1024 }, // 5MB
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    await this.idcardService.canUserCreateIdcard(req.user.id);

    // 2. Map files by fieldname
    const fileMap = files.reduce(
      (acc, file) => ({ ...acc, [file.fieldname]: file }),
      {},
    );

    // 3. Define required document fields and their Cloudinary folders
    const documentConfig = {
      ref_letter: 'idcards/ref_letters',
      utilityBill: 'idcards/utility_bills',
      passportPhoto: 'idcards/passportPhoto',
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

    const [passportPhotoUrl, refLetterUrl, utilityBillUrl] =
      await Promise.all(uploadPromises);

    // 5. Create the FINAL data object to save to the database
    const dataToSave = {
      ...body,
      bin: await this.idcardService.generateUniqueBIN(),
      ref_letter: refLetterUrl,
      utilityBill: utilityBillUrl,
      passportPhoto: passportPhotoUrl,
    };

    return this.idcardService.createIdCard(dataToSave, req.user.id);
  }

  @Get('get-all-request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: IdCard, isArray: true })
  @Roles(UserRole.GLOBAL_ADMIN)
  async getCertsRequest() {
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
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.KINDRED_HEAD, UserRole.GLOBAL_ADMIN)
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

  @Get(':id/requests')
  @ApiResponse({ type: IdCard, isArray: true })
  async getRequestsForId(@Param('id') id: string) {
    return await this.idcardService.findRequestsByUserId(id);
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

      // if (card.downloaded) {
      //   return res
      //     .status(400)
      //     .json({ message: 'Card has already been downloaded.' });
      // }

      // If already downloaded before → check expiry
      if (card.downloaded) {
        const now = new Date();

        if (!card.downloadExpiryDate || card.downloadExpiryDate < now) {
          return res.status(400).json({
            message: 'Download window has expired. Please request a new card.',
          });
        }
      } else {
        // First-time download → activate 10-minute window
        card.downloaded = true;
        // card.downloadExpiryDate = new Date(Date.now() + 10 * 60 * 1000);
        card.downloadExpiryDate = new Date(
          Date.now() + 3 * 30 * 24 * 60 * 60 * 1000, // 3 months
        );
        await card.save();
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

      const idCardQrCodeData = `${getBaseUrl()}/api/idcard/view/${card.id}`;
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
      .replace(/{{passportPhoto}}/g, data.passportPhoto)
      .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl)
      .replace(/{{issueDate}}/g, formattedDateOfIssue)
      .replace(/{{gender}}/g, user.gender);
  }

  private async markCardAsDownloaded(id: string): Promise<void> {
    try {
      // await this.idcardService.markAsDownloaded(id);
      await this.idcardService.markAsDownloadedForThreeMonths(id);
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
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const fieldTypeRules = {
          passportPhotoUrl: {
            mime: ['image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.jpeg', '.jpg', '.png'],
          },
          refLetterUrl: {
            mime: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
            ext: ['.pdf', '.jpeg', '.jpg', '.png'],
          },
          utilityBillUrl: {
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
    @Body() updatedData: UpdateIdCardDto,
    @UploadedFiles(
      // new GenericImageValidationPipe(),
      new PassportPhotoQualityPipe({ isOptional: true }),
      new FileSizeValidationPipe({
        passportPhoto: { maxSize: 2 * 1024 * 1024 },
        refLetterUrl: { maxSize: 3 * 1024 * 1024 },
        utilityBillUrl: { maxSize: 5 * 1024 * 1024 },
      }),
    )
    files: Array<Express.Multer.File>,
  ): Promise<IdCard> {
    const existingIdcard = await this.idcardService.findById(id);

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

      const oldImageUrl = existingIdcard[documentType];
      if (oldImageUrl) {
        await this.cloudinaryService.deleteFile(oldImageUrl);
      }

      const folder = `idcard/${documentType}`;
      const newImageUrl = await this.cloudinaryService.uploadFile(
        fileToUpload,
        folder,
      );
      updatedData[documentType] = newImageUrl;
    }

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
