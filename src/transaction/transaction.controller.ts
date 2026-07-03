import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/users.role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import * as crypto from 'crypto';
import { Transaction } from './transaction.schema';
import {
  GetTransactionsReportDto,
  RejectReceiptDto,
} from './src/transaction/dto/get-transactions-report.dto';
import { VerifyPaymentDto } from 'src/auctioneer/dto/autioneer.dto';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard) // Protect endpoint
  @Post('pay')
  async initializePayment(
    @Body()
    data: {
      auctioneerId: string;
      certificateId: string;
      cardId: string;
      userId: string;
      amount: number;
      documentAmount: number;
      email: string;
      paymentType: 'card' | 'certificate' | 'auctioneer';
    },
  ) {
    return this.transactionService.initializePayment(data);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleCredoWebhook(
    @Req() req: Request,
    @Res() res: import('express').Response,
  ) {
    try {
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        console.error('Raw body is missing');
        return res.status(400).send('Raw body is missing');
      }

      const sha256Signature = req.headers['credo-signature'] as string;
      const sha512Signature = req.headers['x-credo-signature'] as string;

      if (!sha256Signature && !sha512Signature) {
        return res.status(400).send('Missing Credo signature header');
      }

      const payload = JSON.parse(rawBody.toString('utf8'));

      const secret = process.env.CREDO_SECRET_HASH; // Replace with your actual secret
      const businessCode = payload.data.businessCode; // Replace with your actual business code

      const signedContent = `${secret}${businessCode}`;

      // Compute SHA-256 hash
      const sha256Hash = crypto
        .createHash('sha256')
        .update(signedContent)
        .digest('hex');

      // Compute SHA-512 hash
      const sha512Hash = crypto
        .createHash('sha512')
        .update(signedContent)
        .digest('hex');

      // Verify signatures
      const isValidSignature =
        sha256Signature === sha256Hash || sha512Signature === sha512Hash;

      if (!isValidSignature) {
        console.error('Invalid signature');
        return res.status(401).send('Invalid signature');
      }

      // Process the payload as needed
      await this.transactionService.handleCredoWebhook(payload);

      return res.send('Webhook processed');
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  @Get('approved-items')
  async getApprovedItems() {
    return this.transactionService.getApprovedItems();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('verify')
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    const { paymentReference, rrr } = verifyPaymentDto;

    if (!paymentReference) {
      throw new BadRequestException('Payment reference is required');
    }

    // Pass both to the service
    return await this.transactionService.verifyPayment(paymentReference, rrr);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  getAllTransactions() {
    return this.transactionService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getTransactionStats() {
    return this.transactionService.getTransactionStats();
  }

  @Get('by-lga')
  @Roles(UserRole.SUPPORT_ADMIN)
  async getTrendsByLga(
    @Query('lga') lga: string,
    startDate: string,
    endDate: string,
  ): Promise<Transaction[]> {
    if (!lga) {
      throw new BadRequestException('LGA query parameter is required.');
    }
    return this.transactionService.getTransactionsByLga(
      lga,
      startDate,
      endDate,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getUserTransactions(@Param('userId') userId: string) {
    return this.transactionService.getUserTransactions(userId);
  }

  @Get('export/pdf')
  async exportPdf(
    @Res() res: import('express').Response,
    @Query() query: GetTransactionsReportDto,
  ) {
    try {
      const pdfBuffer = await this.transactionService.generatePdfReport(query);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transactions_report_${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).send('Error generating PDF report');
    }
  }

  @Post('remita')
  async generateRrr(@Body() dto: any) {
    return await this.transactionService.generateRRR(dto);
  }

  @Post('verify/:rrr')
  async verify(@Param('rrr') rrr: string) {
    const result = await this.transactionService.verifyRrr(rrr);
    return { status: 200, data: result };
  }

  @Post('verify-credo')
  async verifyCredo(@Body() dto: { paymentReference: string }) {
    return this.transactionService.verifyCredo(dto.paymentReference);
  }

  @Post('upload-receipt')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('receipt'))
  async uploadReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Body('reference') reference: string, // Extract directly when using Multer
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (!reference)
      throw new BadRequestException('Payment reference is missing.');

    // DYNAMICALLY FIND THE USER ID FROM JWT
    // Change this to match exactly what your JWT payload contains (id, sub, _id, or userId)
    const userId =
      req.user.userId || req.user.id || req.user.sub || req.user._id;

    if (!userId) {
      console.error('JWT Payload structure:', JSON.stringify(req.user));
      throw new BadRequestException('Could not extract user ID from token.');
    }

    return this.transactionService.processReceiptUpload(
      file,
      reference,
      userId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  @Patch('admin/approve-receipt/:transactionId')
  async adminApproveReceipt(@Param('transactionId') transactionId: string) {
    return this.transactionService.adminApproveReceipt(transactionId);
  }

  @Patch('admin/reject-receipt/:transactionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  async adminRejectReceipt(
    @Param('transactionId') transactionId: string,
    @Body() rejectReceiptDto: RejectReceiptDto,
  ) {
    return this.transactionService.adminRejectReceipt(
      transactionId,
      rejectReceiptDto.reason,
    );
  }
}
