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
import { Transaction } from './transaction.schema';
import { Model } from 'mongoose';

@Controller('api/transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    // private readonly transactionModel: Model<Transaction>,
  ) {}

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

  // // transaction.controller.ts
  // @Post('webhook')
  // @HttpCode(200) // Credo expects a 200 response to stop retrying
  // async handleCredoWebhook(
  //   // @Body() payload: any,
  //   @Req() req: Request,
  //   @Res() res: import('express').Response,
  // ) {
  //   // Validate the signature
  //   // Ensure you have the secret hash stored securely
  //   // and not hardcoded in your codebase.
  //   // const secret = process.env.CREDO_SECRET_HASH;
  //   // For demonstration, we are using a hardcoded value.
  //   // In production, use environment variables or a secure vault.
  //   const secret = 'YOUR_CREDO_SECRET_HASH';
  //   const signature = req.headers['credo-signature'] as string;

  //   const rawBody = (req as any).body; // Body is a Buffer now

  //   // Check if the body is a Buffer
  //   if (!Buffer.isBuffer(rawBody)) {
  //     console.error('Received body is not a Buffer');
  //     return res.status(400).send('Invalid body format');
  //   }

  //   const payload = JSON.parse(rawBody.toString('utf8'));
  //   // Convert Buffer to string
  //   const hash = crypto
  //     .createHmac('sha512', secret)
  //     .update(rawBody) // ✅ correct
  //     .digest('hex');

  //   console.log('Received Credo webhook:', payload);
  //   console.log('Hash:', hash);
  //   console.log('Signature:', signature);

  //   console.log('Body type:', typeof req.body);
  //   console.log('Is Buffer?', Buffer.isBuffer(req.body));

  //   if (hash !== signature) {
  //     return res.status(401).send('Invalid signature');
  //   }

  //   // const transaction = await this.transactionModel.findOne({});

  //   await this.transactionService.handleCredoWebhook(payload);
  //   return res.send('Webhook processed');
  // }

  // @Post('webhook')
  // @HttpCode(200)
  // async handleCredoWebhook(
  //   @Req() req: Request,
  //   @Res() res: import('express').Response,
  // ) {
  //   console.log('Headers:', req.headers);
  //   const sha256Signature = req.headers['credo-signature'];
  //   const sha512Signature = req.headers['x-credo-signature'];

  //   if (!sha256Signature && !sha512Signature) {
  //     return res.status(400).send('Missing Credo signature header');
  //   }
  //   const secret = '123456789'; // Store in .env
  //   const signature = req.headers['x-credo-signature'] as string;

  //   // Ensure raw body is available (configure middleware properly)
  //   // const rawBody = (req as any).rawBody || req.body;
  //   const rawBody = req.body;
  //   console.log('Raw body:', rawBody);

  //   if (!Buffer.isBuffer(rawBody)) {
  //     console.error('Invalid body format: Expected Buffer');
  //     return res.status(400).send('Invalid body format');
  //   }

  //   try {
  //     const payload = JSON.parse(rawBody.toString('utf8'));
  //     const hash = crypto
  //       .createHmac('sha512', secret)
  //       .update(rawBody)
  //       .digest('hex');

  //     console.log('Received Credo webhook:', payload);
  //     console.log('Hash:', hash);
  //     console.log('Signature:', signature);
  //     console.log('Body type:', typeof req.body);
  //     console.log('Is Buffer?', Buffer.isBuffer(req.body));
  //     console.log('Raw body:', rawBody.toString('utf8'));

  //     if (hash !== signature) {
  //       console.error('Invalid signature');
  //       return res.status(401).send('Invalid signature');
  //     }

  //     console.log('Processing webhook...');
  //     await this.transactionService.handleCredoWebhook(payload);
  //     console.log('Webhook processed successfully');
  //     return res.send('Webhook processed');
  //   } catch (error) {
  //     console.error('Webhook processing failed:', error);
  //     return res.status(500).send('Internal Server Error');
  //   }
  // }

  // @Post('webhook')
  // @HttpCode(200)
  // async handleCredoWebhook(
  //   @Req() req: Request,
  //   @Res() res: import('express').Response,
  // ) {
  //   console.log('Headers:', req.headers);
  //   const sha256Signature = req.headers['credo-signature'];
  //   const sha512Signature = req.headers['x-credo-signature'];

  //   if (!sha256Signature && !sha512Signature) {
  //     return res.status(400).send('Missing Credo signature header');
  //   }

  //   const secret = '123456789'; // Store in .env and use process.env.CREDO_WEBHOOK_SECRET
  //   const signature = sha512Signature as string;
  //   const rawBody = (req as any).rawBody || req.body;
  //   // Get the raw body as Buffer
  //   // const rawBody = req.body;
  //   console.log('Raw body:', rawBody);

  //   if (!Buffer.isBuffer(rawBody)) {
  //     console.error('Invalid body format: Expected Buffer');
  //     return res.status(400).send('Invalid body format');
  //   }

  //   try {
  //     // Verify the signature first before parsing the JSON
  //     const hash = crypto
  //       .createHmac('sha512', secret)
  //       .update(rawBody)
  //       .digest('hex');

  //     console.log('Generated Hash:', hash);
  //     console.log('Received Signature:', signature);

  //     // Only parse the JSON after signature verification
  //     const payload = JSON.parse(rawBody.toString('utf8'));
  //     console.log('Received Credo webhook:', payload);

  //     if (hash !== signature) {
  //       console.error('Invalid signature');
  //       console.error(`Expected: ${signature}`);
  //       console.error(`Received: ${hash}`);
  //       return res.status(401).send('Invalid signature');
  //     }

  //     console.log('Processing webhook...');
  //     await this.transactionService.handleCredoWebhook(payload);
  //     console.log('Webhook processed successfully');
  //     return res.send('Webhook processed');
  //   } catch (error) {
  //     console.error('Webhook processing failed:', error);
  //     return res.status(500).send('Internal Server Error');
  //   }
  // }

  @Post('webhook')
  @HttpCode(200)
  async handleCredoWebhook(
    @Req() req: Request,
    @Res() res: import('express').Response,
  ) {
    console.log('Headers:', req.headers);
    const sha256Signature = req.headers['credo-signature'];
    const sha512Signature = req.headers['x-credo-signature'];

    if (!sha256Signature && !sha512Signature) {
      return res.status(400).send('Missing Credo signature header');
    }

    const secret = '123456789'; // Should be from environment variable
    const signature = sha256Signature as string; // Use SHA-256 signature
    const rawBody = (req as any).rawBody || req.body;

    if (!Buffer.isBuffer(rawBody)) {
      console.error('Invalid body format: Expected Buffer');
      return res.status(400).send('Invalid body format');
    }

    try {
      // Verify using SHA-256 (matches the webhook setup)
      const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      console.log('Generated Hash:', hash);
      console.log('Received Signature:', signature);

      if (hash !== signature) {
        console.error('Invalid signature');
        console.error(`Expected: ${signature}`);
        console.error(`Received: ${hash}`);
        return res.status(401).send('Invalid signature');
      }

      // Only parse after successful verification
      const payload = JSON.parse(rawBody.toString('utf8'));
      console.log('Received Credo webhook:', payload);

      console.log('Processing webhook...');
      await this.transactionService.handleCredoWebhook(payload);
      console.log('Webhook processed successfully');
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
