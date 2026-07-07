import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  Patch,
  UseInterceptors,
  UploadedFile,
  Res,
  NotFoundException,
  InternalServerErrorException,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { AuctioneerService } from './auctioneer.service';
import {
  CreateAuctioneerDto,
  ReprintResponseDto,
  UpdateAuctioneerDto,
} from './dto/autioneer.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Auctioneer } from './auctioneer.schema';
import { UserRole } from 'src/users/users.role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { createFileUploadInterceptor } from 'src/interceptors/file-upload.interceptor';
import { OptionalFileValidationPipe } from 'src/common/pipes/optional-file-validation.pipe';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from 'src/common/decorators/current-user,decorator';
import { TransactionService } from 'src/transaction/transaction.service';
import { Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import axios, { AxiosResponse } from 'axios';
import { UsersService } from 'src/users/users.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Auctioneer')
@Controller('api/auctioneer')
@UseGuards(JwtAuthGuard)
export class AuctioneerController {
  constructor(
    private readonly auctioneerService: AuctioneerService,
    private readonly transactionService: TransactionService,
    private readonly userService: UsersService,
  ) {}

  @Post('create')
  @UseInterceptors(createFileUploadInterceptor('taxClearance'))
  async createAuctioneer(
    @Body() createAuctioneerDto: CreateAuctioneerDto,
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.auctioneerService.canUserCreateAuctioneer(req.user.id);
    return this.auctioneerService.createAuctioneerWithDocument(
      createAuctioneerDto,
      req.user.id,
      file,
    );
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('taxClearance', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        // Reuse or define allowed types
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Tax Clearance must be a PDF or Image'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async updateAuctioneer(
    @Param('id') id: string,
    @Body() updateAuctioneerDto: UpdateAuctioneerDto,
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('body', updateAuctioneerDto);
    return this.auctioneerService.updateAuctioneer(
      id,
      updateAuctioneerDto,
      req.user.id,
      file,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Auctioneer, isArray: true })
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  async getAuctRequest() {
    return await this.auctioneerService.getAuctRequest();
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  @ApiResponse({ type: Auctioneer, isArray: false })
  async approveCert(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ) {
    return await this.auctioneerService.approveLincence(id, approvedBy);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  @ApiResponse({ type: Auctioneer, isArray: false })
  async rejectCert(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('approvedBy') approvedBy: string,
  ) {
    return await this.auctioneerService.rejectAuctioneerRequest(
      id,
      rejectionReason,
      approvedBy,
    );
  }

  @Post(':id/resubmit')
  @UseInterceptors(createFileUploadInterceptor('taxClearance'))
  async resubmitRequest(
    @Param('id') id: string,
    @Body() updatedData: UpdateAuctioneerDto,
    @UploadedFile(new OptionalFileValidationPipe())
    file: Express.Multer.File,
  ): Promise<Auctioneer> {
    return this.auctioneerService.resubmitWithDocument(
      id,
      updatedData,
      file,
      'taxClearance',
    );
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
      documentType: 'auctioneer';
    },
  ): Promise<ReprintResponseDto> {
    return this.auctioneerService.requestReprint(data);
  }

  // New confirm payment endpoint
  // @Post(':id/confirm-reprint-payment')
  // async confirmReprintPayment(
  //   @Param('id') id: string,
  //   @Body() confirmPaymentDto: ConfirmReprintPaymentDto,
  // ) {
  //   const { paymentReference, rrr } = confirmPaymentDto;

  //   // Verify payment with provider
  //   const paymentVerified = await this.transactionService.verifyReprintPayment(
  //     paymentReference,
  //     rrr,
  //   );

  //   if (!paymentVerified) {
  //     throw new HttpException(
  //       'Payment verification failed',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   // Update certificate with paid status and new download window
  //   const updatedCertificate =
  //     await this.auctioneerService.confirmReprintPayment(
  //       id,
  //       paymentReference,
  //       rrr,
  //     );

  //   return {
  //     success: true,
  //     message: 'Payment confirmed. Reprint download available.',
  //     downloadUrl: `/api/auctioneer/reprint/download/${id}`,
  //     expiryDate: updatedCertificate.reprintDownloadExpiryDate,
  //   };
  // }

  @Get('reprint/download/:id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async downloadReprint(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUser,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.auctioneerService.prepareReprintDownload(id, user.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  }

  @Get(':id/requests')
  @ApiResponse({ type: Auctioneer, isArray: true })
  async getRequestsForId(@Param('id') id: string) {
    return await this.auctioneerService.findRequestsByUserId(id);
  }

  @Get(':id/request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: Auctioneer, isArray: false })
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  async getUserProfile(@Param('id') id: string) {
    return await this.auctioneerService.findById(id);
  }

  @Public()
  @Get('view/:id')
  async viewCertificate(@Param('id') id: string, @Res() res: Response) {
    const html = await this.auctioneerService.getAuctioneerViewPage(id);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'",
    );

    return res.send(html);
  }
  @Public()
  @Get('download/:id')
  @ApiResponse({ type: Auctioneer, isArray: false })
  async downloadCertificate(@Param('id') id: string, @Res() res: Response) {
    const { stream, filename } =
      await this.auctioneerService.prepareAuctioneerDownload(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    stream.pipe(res);
  }

  @Public()
  @Get(':requestId/document/:docType')
  async streamDocument(
    @Param('requestId') requestId: string,
    @Param('docType') docType: 'taxClearance',
    @Res() res: Response,
  ) {
    const request = await this.auctioneerService.findById(requestId);

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
      const err = error as Error; // Assert type
      console.log(
        `Error streaming document from Cloudinary: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException(
        'Could not retrieve the document. Please try again later.',
      );
    }
  }

  @Public()
  @Get('auctioneer/:id')
  async getAuctioneerDetails(@Param('id') id: string) {
    try {
      const auctioneer = await this.auctioneerService.findAuctioneerById(id);

      if (!auctioneer) {
        throw new NotFoundException('Auctioneer not found');
      }

      // This logic now works correctly because of the schema type change
      const userId =
        typeof auctioneer.userId === 'string'
          ? auctioneer.userId
          : (auctioneer.userId as any)._id.toString(); // No error!

      const user = await this.userService.findById(userId);

      return {
        id: auctioneer.id,
        name: `${user.firstname} ${user.lastname}`,
        lga: user.lgaOfOrigin,
        state: user.stateOfOrigin,
      };
    } catch (error) {
      throw new NotFoundException('Certificate not found');
    }
  }

  @Public()
  @Get('stream/:id')
  async streamAuctioneerLicence(@Param('id') id: string, @Res() res: Response) {
    const { stream, filename } =
      await this.auctioneerService.prepareAuctioneerDownload(id);

    // 'inline' tells the browser to display the content in the page
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    stream.pipe(res);
  }

  @Delete(':item')
  async deleteItem(@Param('item') item: string): Promise<any> {
    return this.auctioneerService.deleteItem(item);
  }
}
