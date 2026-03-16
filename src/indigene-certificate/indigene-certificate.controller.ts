import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res,
  UseGuards,
  Patch,
  Req,
  Query,
  Delete,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { IndigeneCertificateService } from './indigene-certificate.service';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/users/users.role.enum';
import { Certificate } from './indigene-certicate.schema';
import { UsersService } from 'src/users/users.service';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import path, { join } from 'path';
import config from 'src/config';
import { Public } from 'src/common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import axios, { AxiosResponse } from 'axios';
import {
  CreateCertificateDto,
  UpdateCertificateDto,
} from './dto/update-certificate.dto';
import {
  ConfirmReprintPaymentDto,
  ReprintResponseDto,
} from './dto/request-reprint.dto';
import { TransactionService } from 'src/transaction/transaction.service';
import { Logger } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user,decorator';

@ApiTags('indigene-certificate.controller')
@UseGuards(JwtAuthGuard)
@Controller('api/indigene/certificate')
export class IndigeneCertificateController {
  private readonly logger = new Logger(IndigeneCertificateController.name);
  // logger: any;
  constructor(
    private readonly indigeneCertificateService: IndigeneCertificateService,
    private readonly userService: UsersService,
    private readonly httpService: HttpService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post('create')
  async createCertificate(
    @Body() createCertificateDto: CreateCertificateDto,
    @Req() req,
  ) {
    // 1. Validate business rules first
    await this.indigeneCertificateService.canUserCreateCertificate(req.user.id);

    const certNumber =
      await this.indigeneCertificateService.generateCertificateNumber();

    // 2. Create the data object to save to the database
    const dataToSave = {
      ...createCertificateDto, // Spread the validated fields from the DTO
      refNumber: uuid(), // Generate a unique reference number
      certificateNumber: certNumber,
      userId: req.user.id,
    };

    // 3. Call the service with the complete data object
    return this.indigeneCertificateService.createCertificate(
      dataToSave,
      req.user.id,
    );
  }

  @Patch(':id')
  async updateCertificate(
    @Param('id') id: string,
    @Body() updateCertificateDto: UpdateCertificateDto,
    @Req() req,
  ) {
    return this.indigeneCertificateService.updateCertificate(
      id,
      updateCertificateDto,
      req.user.id,
    );
  }

  @Public()
  @Get('download/:id')
  @ApiResponse({ type: Certificate, isArray: false })
  async downloadCertificate(@Param('id') id: string, @Res() res: Response) {
    const { stream, filename } =
      await this.indigeneCertificateService.prepareCertificateDownload(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    stream.pipe(res);
  }

  @Public()
  @Get('download/certificate/:id')
  async downloadCert(@Param('id') id: string, @Res() res: Response) {
    const { stream, filename } =
      await this.indigeneCertificateService.prepareCertificatePdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    stream.pipe(res);
  }

  @Public()
  @Get('certificate/:id')
  async getCertificateDetails(@Param('id') id: string) {
    try {
      const certificate =
        await this.indigeneCertificateService.findCertificateById(id);

      if (!certificate) {
        throw new NotFoundException('Certificate not found');
      }

      // This logic now works correctly because of the schema type change
      const userId =
        typeof certificate.userId === 'string'
          ? certificate.userId
          : certificate.userId._id.toString(); // No error!

      const user = await this.userService.findById(userId);

      return {
        id: certificate.id,
        name: `${user.firstname} ${user.lastname}`,
        lga: user.lgaOfOrigin,
        state: user.stateOfOrigin,
        kindred: certificate.kindred,
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

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.GLOBAL_ADMIN)
  @ApiResponse({ type: Certificate, isArray: false })
  async rejectCert(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('approvedBy') approvedBy: string,
  ) {
    return await this.indigeneCertificateService.rejectCertificate(
      id,
      rejectionReason,
      approvedBy,
    );
  }

  @Post(':id/resubmit')
  async resubmitRequest(
    @Param('id') id: string,
    @Body() updatedData: UpdateCertificateDto,
  ): Promise<Certificate> {
    // 2. Create the data object to save to the database
    const dataToSave = {
      ...updatedData, // Spread the validated fields from the DTO
    };
    return this.indigeneCertificateService.resubmitRequest(id, dataToSave);
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

  @Post(':id/request-reprint')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestReprint(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUser,
    @Body()
    data: {
      documentId: string;
      userId: string;
      amount: number;
      email: string;
      documentAmount: number;
      documentType: 'certificate';
    },
  ): Promise<ReprintResponseDto> {
    return this.indigeneCertificateService.requestReprint(data);
  }

  // New confirm payment endpoint
  @Post(':id/confirm-reprint-payment')
  async confirmReprintPayment(
    @Param('id') id: string,
    @Body() confirmPaymentDto: ConfirmReprintPaymentDto,
  ) {
    const { paymentReference, rrr } = confirmPaymentDto;

    // Verify payment with provider
    const paymentVerified = await this.transactionService.verifyReprintPayment(
      paymentReference,
      rrr,
    );

    if (!paymentVerified) {
      throw new HttpException(
        'Payment verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update certificate with paid status and new download window
    const updatedCertificate =
      await this.indigeneCertificateService.confirmReprintPayment(
        id,
        paymentReference,
        rrr,
      );

    return {
      success: true,
      message: 'Payment confirmed. Reprint download available.',
      downloadUrl: `/api/indigene/certificate/reprint/download/${id}`,
      expiryDate: updatedCertificate.reprintDownloadExpiryDate,
    };
  }

  @Get('reprint/download/:id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async downloadReprint(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUser,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.indigeneCertificateService.prepareReprintDownload(id, user.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  }

  @Public()
  @Get('stream/:id')
  async streamCertificate(@Param('id') id: string, @Res() res: Response) {
    const { stream, filename } =
      await this.indigeneCertificateService.prepareCertificateDownload(id);

    // 'inline' tells the browser to display the content in the page
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    stream.pipe(res);
  }
}
