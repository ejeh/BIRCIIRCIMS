import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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

@Controller('api/transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard) // Protect endpoint
  @Post('pay')
  async initializePayment(
    @Body()
    data: {
      certificateId: string;
      cardId: string;
      userId: string;
      amount: number;
      email: string;
      paymentType: 'card' | 'certificate';
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

      console.log('SHA-512 Generated Hash:', sha512Hash);
      console.log('SHA-512 Received Signature:', sha512Signature);

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
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard) // Protect endpoint
  @Get('verify/:reference')
  async verifyPayment(@Param('reference') reference: string) {
    return this.transactionService.verifyPayment(reference);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get(':userId')
  async getUserTransactions(@Param('userId') userId: string) {
    return this.transactionService.getUserTransactions(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  async getPaginatedData(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.transactionService.getPaginatedData(page, limit);
  }
}
